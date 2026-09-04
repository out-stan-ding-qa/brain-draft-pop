# BrainPOP Playwright + Gherkin framework

Modular UI/API tests for the BrainPOP login experience using **Playwright Test**, **playwright-bdd** (Gherkin), TypeScript, page objects, and fixtures.

## Install

```bash
npm ci
npx playwright install chromium firefox
cp .env.example .env
```

On Windows PowerShell, copy env with `Copy-Item .env.example .env`. Credentials live in `.env` (see `.env.example`); they are not listed here.

## Run

```bash
npm test                 # full suite (includes two @failing demos)
npm run test:e2e         # same as npm test
npm run test:smoke       # @smoke only
npm run test:a11y        # accessibility scenarios only
npm run test:ci          # exclude @failing, @visual, @known-issue (CI gate)
npm run test:demo-failures
npm run test:mobile      # adds iPhone 13 project (MOBILE=1)
```

Subsets: `--project=chromium`, `--grep @logout`, `--grep @negative`, `--grep @api`.

| Tag | Meaning |
| --- | --- |
| `@smoke` | Core happy paths |
| `@negative` | Rejected or incomplete input |
| `@a11y` / `@perf` | Accessibility and web vitals |
| `@api` | Direct calls to the authentication endpoint |
| `@failing` | Synthetic failures that prove the reporters capture failures |
| `@visual` | Screenshot comparison, local only (see below) |
| `@known-issue` | Genuine product defect, kept visible but outside the CI gate |

### Visual baselines

Baselines live beside the feature that uses them, at
`tests/e2e/__screenshots__/{name}-{project}-{platform}.png`, set by `snapshotPathTemplate`
in the config. They deliberately do **not** sit under Playwright's default location: `testDir`
is the generated `.features-gen/` folder, which is gitignored and rewritten by `bddgen`, so
baselines placed there are wiped on every run and can never be committed.

Baselines are platform-stamped because a screenshot taken on Windows will not match one taken
on the Linux CI runner. Commit the baselines for whichever platforms you intend to check, and
regenerate with `--update-snapshots` when the UI legitimately changes. `@visual` is excluded
from `test:ci` for this reason.

The suite authenticates a single shared QA account against production, and that endpoint
throttles bursts of login attempts. Worker count is capped for that reason, the `@api`
feature runs sequentially, and `LoginApi` backs off on HTTP 429. Raising `WORKERS` well
above the default will cause throttled logins to look like failures.

## Configuration

| Variable | Purpose |
| --- | --- |
| `ENV` | `dev` \| `staging` \| `prod` (selects `test-data/<env>/`) |
| `BASE_URL` | AUT origin (default login URL) |
| `API_BASE_URL` | Authentication API used by `@api` tests (default `https://api.brainpop.com`) |
| `BP_USERNAME` / `BP_PASSWORD` | QA login |
| `WORKERS` / `RETRIES` | Parallelism and retries (defaults to 4 workers, 2 in CI) |
| `MOBILE=1` | Extra iPhone 13 project |
| `REMOTE_PROVIDER` | `none` (default) \| `selenium` \| `browserstack` \| `lambdatest` (scaffold only) |

## Reports

Five reporters run on every execution: `list` (console), `html`
(`playwright-report/`), `allure-playwright` (`allure-results/`), `junit` (`junit.xml`), and
the custom `featureReporter`, which writes both `feature-report/` and `summary.json`.
Videos/traces on first retry under `test-results/`.

```bash
npx playwright show-report   # Playwright HTML report: traces, video, timeline
npm run report:features      # Feature summary: totals per .feature file
npm run report:allure
```

### Feature summary report

`feature-report/index.html` answers "what is red today" in one screen: totals across the run,
then the same breakdown per `.feature` file, with drill-down into scenarios, Gherkin steps,
error text, annotations, and screenshots. It is a single self-contained file with no external
assets, so it opens straight from a CI artifact. Markup lives in
[`featureReportTemplate.ts`](src/utils/reporting/featureReportTemplate.ts) and result
collection in [`featureReporter.ts`](src/utils/reporting/featureReporter.ts), so the
layout can be changed without touching the data.

That one reporter writes both outputs from a single pass over the results: this page and
`summary.json`. They therefore always agree — the JSON uses the same feature grouping and the
same buckets, and carries the web vitals in a top-level `performance` array. Either output can
be switched off by passing an empty `outputFolder` or `jsonFile` in the config.

Results are bucketed the way Allure splits them:

| Bucket | Meaning |
| --- | --- |
| Passed | Test passed (a pass on retry also counts, and is flagged `flaky`) |
| Failed | An assertion did not hold |
| Broken | Something else stopped the test: thrown error, timeout, missing snapshot |
| Skipped | Skipped or fixme |
| Other | Interrupted, or a status the run did not classify |

Features containing failures open automatically; everything else starts collapsed. The chips
at the top filter by bucket. Attachment links are relative, so keep `feature-report/` beside
`test-results/` for screenshots to resolve.

## Accessibility

[`tests/e2e/accessibility.feature`](tests/e2e/accessibility.feature) checks one concern per
scenario against WCAG 2.1 A/AA, so a failure names the barrier instead of reporting that
"accessibility is broken". Axe rule ids live in `A11Y_RULE_GROUPS` in
[`src/utils/a11y/axe.ts`](src/utils/a11y/axe.ts); feature files refer to groups by name.
Two scenarios are not rule scans: keyboard focus order, and submitting the form with Enter.

A final scenario re-scans the page with every already-covered rule disabled, so a newly
introduced violation still fails somewhere.

One real defect is currently tagged `@known-issue`: the "Sign in with Google" label fails
minimum colour contrast (`#sso-link-google .sso_name`). It is excluded from `test:ci` but
runs under `npm run test:a11y`.

## Performance

The step `When I capture the navigation web vitals` reads the browser's Performance API and
publishes the numbers to every reporter, so they are visible rather than buried in a log:

- **HTML report / Allure** — a `web-vitals.txt` table rendered inline, a machine-readable
  `web-vitals.json`, and `perf:*` annotations on the test itself.
- **`summary.json`** — a top-level `performance` array with one entry per feature, test, and
  project, ready for trend ingestion.

Collected: TTFB, DOM interactive, DOM content loaded, load complete, first and largest
contentful paint, cumulative layout shift, and transferred bytes. LCP and CLS come from a
buffered `PerformanceObserver`; anything a browser does not support is reported as
`not supported` instead of failing (Firefox has no `layout-shift`, so CLS is Chromium-only).

Any scenario can add the capture step — it is not limited to
[`tests/e2e/performance.feature`](tests/e2e/performance.feature). Budgets live in
`test-data/<env>/performance.json` and are deliberately loose, since these run against
production over whatever connection the runner has; tighten them once you have a baseline.

`PERF_LIGHTHOUSE=1` is a documented extension point for a full Lighthouse run in CI; it
currently logs a skip until `lighthouse`/`chrome-launcher` are wired up.

## CI

[`playwright.yml`](.github/workflows/playwright.yml) runs three jobs:

1. **`e2e`** — a matrix over Chromium and Firefox. Each job emits a `blob` report (an
   intermediate format) plus Allure results, rather than a finished report of its own.
2. **`report`** — downloads every blob and runs `playwright merge-reports`, producing **one**
   report that covers all browsers. Without this each browser produced a separate report and
   only one of them ever reached GitHub Pages.
3. **`publish-report`** — deploys the merged HTML report to Pages on the default branch.

`ALLURE=0` in the merge step drops `allure-playwright` from the reporter list, because it
reads per-project config that does not exist when replaying blobs. Allure loses nothing: its
results directories from each browser are simply downloaded into one folder, which is already
a valid merged input.

`npm run test:demo-failures` is a local demonstration that the reporters capture failures. It
is deliberately not a CI step — running it after the real suite used to overwrite
`playwright-report/`, `junit.xml` and `summary.json`, so the published report described the
two synthetic failures instead of the actual run.

## Remote providers

CI uses local Chromium and Firefox. To point at a grid, set `REMOTE_PROVIDER` and `REMOTE_WS_ENDPOINT` (plus vendor keys). Capability builders live in `src/config/remote.ts`.

## Add a page + scenario

1. Create a POM under `src/pages/`.
2. Register it as a fixture in `src/fixtures/baseTest.ts`.
3. Add a `.feature` under `tests/e2e/` or `tests/api/` and steps under `tests/**/steps/` using `Given`/`When`/`Then` from `baseTest`.
4. Put data in `test-data/<env>/`. Keep locators out of Gherkin; keep assertions in `src/utils/assertions/`.
