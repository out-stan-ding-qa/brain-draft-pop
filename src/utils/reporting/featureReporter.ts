import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';
import {
  renderFeatureReport,
  type Bucket,
  type FeatureReport,
  type RunReport,
  type ScenarioReport,
  type Totals,
} from './featureReportTemplate';

type Options = {
  /** Folder for index.html. Set to '' to skip the HTML output. */
  outputFolder?: string;
  /** File for the machine-readable summary. Set to '' to skip it. */
  jsonFile?: string;
};

const VITALS_ATTACHMENT = 'web-vitals.json';

/**
 * One pass over the results feeding two outputs: the feature-oriented HTML
 * report for people, and a JSON summary for CI and trend tooling.
 */
export default class FeatureReporter implements Reporter {
  private readonly outputFolder: string;
  private readonly jsonFile: string;
  private rootSuite?: Suite;
  private startedAt = new Date();

  constructor(options: Options = {}) {
    this.outputFolder = resolveOutput(options.outputFolder, 'feature-report');
    this.jsonFile = resolveOutput(options.jsonFile, 'summary.json');
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.rootSuite = suite;
    this.startedAt = new Date();
  }

  // Writes files only, so Playwright is free to keep its own terminal output.
  printsToStdio(): boolean {
    return false;
  }

  onEnd(result: FullResult): void {
    const run = this.buildRun(result);

    if (this.outputFolder) {
      fs.mkdirSync(this.outputFolder, { recursive: true });
      fs.writeFileSync(path.join(this.outputFolder, 'index.html'), renderFeatureReport(run));
    }
    if (this.jsonFile) {
      fs.mkdirSync(path.dirname(this.jsonFile), { recursive: true });
      fs.writeFileSync(this.jsonFile, JSON.stringify(toJson(run), null, 2));
    }
  }

  private buildRun(result: FullResult): RunReport {
    const features = this.collectFeatures();
    return {
      status: result.status,
      startedAt: this.startedAt.toLocaleString(),
      durationMs: Date.now() - this.startedAt.getTime(),
      totals: features.reduce((acc, feature) => addTotals(acc, feature.totals), emptyTotals()),
      flaky: features.reduce(
        (acc, feature) => acc + feature.scenarios.filter((scenario) => scenario.flaky).length,
        0,
      ),
      features,
    };
  }

  /**
   * Groups by source .feature rather than by generated spec, and merges the
   * browser projects so one row means one feature file.
   */
  private collectFeatures(): FeatureReport[] {
    const byPath = new Map<string, FeatureReport>();

    for (const test of this.rootSuite?.allTests() ?? []) {
      const { featurePath, featureName, scenarioName } = describeTest(test);
      const feature = byPath.get(featurePath) ?? {
        name: featureName,
        path: featurePath,
        totals: emptyTotals(),
        durationMs: 0,
        scenarios: [],
      };

      const scenario = this.toScenario(test, scenarioName);
      feature.totals[scenario.bucket] += 1;
      feature.durationMs += scenario.durationMs;
      feature.scenarios.push(scenario);
      byPath.set(featurePath, feature);
    }

    const features = [...byPath.values()];
    for (const feature of features) {
      feature.scenarios.sort(bySeverityThenName);
    }
    return features.sort(bySeverityThenPath);
  }

  private toScenario(test: TestCase, name: string): ScenarioReport {
    const result = test.results[test.results.length - 1];

    return {
      name,
      project: test.parent.project()?.name ?? 'unknown',
      location: `${test.location.file}:${test.location.line}`,
      bucket: classify(result),
      flaky: test.outcome() === 'flaky',
      durationMs: test.results.reduce((acc, attempt) => acc + attempt.duration, 0),
      retries: result?.retry ?? 0,
      tags: test.tags,
      steps: gherkinSteps(result),
      annotations: test.annotations.map(({ type, description }) => ({ type, description })),
      error: formatError(result),
      attachments: this.toAttachments(result),
      performance: readVitals(result),
    };
  }

  private toAttachments(result: TestResult | undefined): ScenarioReport['attachments'] {
    return (result?.attachments ?? []).map((attachment) => ({
      name: attachment.name,
      // Linked rather than inlined so the report file stays small; keep the
      // report folder next to test-results/ for the links to resolve.
      href: attachment.path
        ? path.relative(this.outputFolder, attachment.path).split(path.sep).join('/')
        : undefined,
      path: attachment.path,
      isImage: Boolean(attachment.contentType?.startsWith('image/')),
    }));
  }
}

function resolveOutput(value: string | undefined, fallback: string): string {
  const target = value ?? fallback;
  return target ? path.resolve(process.cwd(), target) : '';
}

/** Shape consumed by CI and trend tooling; mirrors the grouping of the HTML. */
function toJson(run: RunReport): unknown {
  return {
    status: run.status,
    startedAt: run.startedAt,
    durationMs: run.durationMs,
    totals: { ...run.totals, flaky: run.flaky },
    performance: run.features.flatMap((feature) =>
      feature.scenarios
        .filter((scenario) => scenario.performance)
        .map((scenario) => ({
          feature: feature.path,
          test: scenario.name,
          project: scenario.project,
          metrics: scenario.performance,
        })),
    ),
    features: run.features.map((feature) => ({
      name: feature.name,
      path: feature.path,
      durationMs: feature.durationMs,
      totals: feature.totals,
      scenarios: feature.scenarios.map((scenario) => ({
        name: scenario.name,
        project: scenario.project,
        location: scenario.location,
        status: scenario.bucket,
        flaky: scenario.flaky,
        durationMs: scenario.durationMs,
        retries: scenario.retries,
        tags: scenario.tags,
        error: scenario.error,
        attachments: scenario.attachments.map(({ name, path: file }) => ({ name, path: file })),
      })),
    })),
  };
}

/** Lifts web vitals out of their attachment so the JSON carries them directly. */
function readVitals(result: TestResult | undefined): Record<string, number> | undefined {
  const attachment = result?.attachments.find((item) => item.name === VITALS_ATTACHMENT);
  if (!attachment) {
    return undefined;
  }
  const raw = attachment.body ?? (attachment.path ? tryRead(attachment.path) : undefined);
  if (!raw) {
    return undefined;
  }
  try {
    const { project: _project, test: _test, ...metrics } = JSON.parse(raw.toString('utf8'));
    return metrics;
  } catch {
    // A malformed attachment should never sink the run summary.
    return undefined;
  }
}

function tryRead(file: string): Buffer | undefined {
  try {
    return fs.readFileSync(file);
  } catch {
    return undefined;
  }
}

function describeTest(test: TestCase): {
  featurePath: string;
  featureName: string;
  scenarioName: string;
} {
  const describes: string[] = [];
  let fileTitle = '';

  for (let node: Suite | undefined = test.parent; node; node = node.parent) {
    if (node.type === 'describe') {
      describes.unshift(node.title);
    } else if (node.type === 'file') {
      fileTitle = node.title;
    }
  }

  // playwright-bdd generates "<feature path>.spec.js"; the outermost describe is
  // the Feature name and any inner describe is a Scenario Outline.
  const featurePath = fileTitle.replace(/\.spec\.[cm]?[jt]s$/, '').split(path.sep).join('/');
  const [featureName = featurePath, ...outline] = describes;

  return {
    featurePath,
    featureName,
    scenarioName: [...outline, test.title].join(' › '),
  };
}

/**
 * An assertion that did not hold is "failed"; anything else that stopped the
 * test (thrown error, timeout) is "broken".
 */
function classify(result: TestResult | undefined): Bucket {
  switch (result?.status) {
    case 'passed':
      return 'passed';
    case 'skipped':
      return 'skipped';
    case 'timedOut':
      return 'broken';
    case 'failed':
      return isAssertion(result.error) ? 'failed' : 'broken';
    case 'interrupted':
      return 'other';
    default:
      return 'other';
  }
}

// TestError drops matcherResult when it crosses the worker boundary, so the
// matcher call in the message is the only signal left. Strip colour first:
// the escape before "expect" ends in a letter, which defeats a \b anchor.
function isAssertion(error: TestError | undefined): boolean {
  return /expect\(/.test(stripAnsi(error?.message ?? ''));
}

function gherkinSteps(result: TestResult | undefined): ScenarioReport['steps'] {
  const walk = (steps: TestStep[]): ScenarioReport['steps'] =>
    steps.flatMap((step) =>
      step.category === 'test.step'
        ? [{ title: step.title, durationMs: step.duration, failed: Boolean(step.error) }]
        : walk(step.steps),
    );
  return walk(result?.steps ?? []);
}

function formatError(result: TestResult | undefined): string | undefined {
  const errors = (result?.errors ?? [])
    .map((error) => error.message ?? error.value)
    .filter((message): message is string => Boolean(message))
    .map(stripAnsi);
  return errors.length > 0 ? errors.join('\n\n') : undefined;
}

function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;]*m/g, '');
}

const SEVERITY: Bucket[] = ['failed', 'broken', 'other', 'skipped', 'passed'];

function bySeverityThenName(a: ScenarioReport, b: ScenarioReport): number {
  const rank = SEVERITY.indexOf(a.bucket) - SEVERITY.indexOf(b.bucket);
  return rank !== 0 ? rank : a.name.localeCompare(b.name) || a.project.localeCompare(b.project);
}

function bySeverityThenPath(a: FeatureReport, b: FeatureReport): number {
  const rank = worstRank(a.totals) - worstRank(b.totals);
  return rank !== 0 ? rank : a.path.localeCompare(b.path);
}

function worstRank(totals: Totals): number {
  return SEVERITY.findIndex((bucket) => totals[bucket] > 0);
}

function emptyTotals(): Totals {
  return { passed: 0, failed: 0, broken: 0, skipped: 0, other: 0 };
}

function addTotals(a: Totals, b: Totals): Totals {
  return {
    passed: a.passed + b.passed,
    failed: a.failed + b.failed,
    broken: a.broken + b.broken,
    skipped: a.skipped + b.skipped,
    other: a.other + b.other,
  };
}
