# BrainPOP Playwright + Gherkin framework

Modular UI/API tests for the BrainPOP login experience using **Playwright Test**, **playwright-bdd** (Gherkin), TypeScript, page objects, and fixtures.

Edit `tests/**/*.feature` and the step files next to them. Playwright runs generated specs under `.features-gen/`, which is gitignored and rewritten by `bddgen` on every test run — do not edit those files, and do not pass a `.feature` path to `playwright test`.

## Install

Requires **Node.js 20+**.

```bash
npm ci
npx playwright install chromium firefox
cp .env.example .env
```

On Windows PowerShell, copy env with `Copy-Item .env.example .env`. Credentials live in `.env` (see `.env.example`); they are not listed here.

## Run

`npm test` and the other `test:*` scripts run `bddgen` first (`npm run gen`), so you only need a separate generate step when you invoke `playwright test` yourself.

```bash
npm test                 # full suite: UI + API (includes two @failing demos)
npm run test:e2e         # same as npm test
npm run test:smoke       # @smoke only
npm run test:a11y        # accessibility scenarios only
npm run test:ci          # exclude @failing, @visual, @known-issue (CI gate)
npm run test:demo-failures
npm run test:mobile      # adds iPhone 13 project (MOBILE=1)
npm run gen              # clear allure-results/ and regenerate .features-gen/
```

### Subsets

Filter by tag or title after generating. `testDir` is `.features-gen/`, so grep the tag rather than the source `.feature` file.

```bash
npm run gen
npx playwright test --grep @api
npx playwright test --grep @api --project=chromium
npx playwright test --grep @logout
npx playwright test --grep @negative
npx playwright test --headed --grep @smoke
```

#### Combining tags

There is no `--tag` flag. `--grep` is a regular expression tested against a single string per
test made of the project name, file name, describe titles, test title, and tags joined by
spaces — so combining tags is a regex question.

```bash
# both tags, in any order
npx playwright test --grep "(?=.*@login)(?=.*@smoke)"

# either tag
npx playwright test --grep "@login|@smoke"

# one tag but not another
npx playwright test --grep @login --grep-invert @logout
```

Use the lookahead form rather than `--grep "@login @smoke"`. The latter is a literal match that
only works while those two tags stay adjacent and in that order; adding a third tag between
them makes it silently match nothing.

Keep each flag immediately followed by its own value. In
`--grep --project=chromium "@login @smoke"`, `--grep` takes `--project=chromium` as its
pattern and the quoted tags fall through as a filename filter, so nothing runs.

| Feature | File | Typical filter |
| --- | --- | --- |
| Login UI | [`tests/e2e/login.feature`](tests/e2e/login.feature) | `@login`, `@logout` |
| Login API | [`tests/api/login-api.feature`](tests/api/login-api.feature) | `@api` |
| Accessibility | [`tests/e2e/accessibility.feature`](tests/e2e/accessibility.feature) | `@a11y` |
| Performance | [`tests/e2e/performance.feature`](tests/e2e/performance.feature) | `@perf` |
| Visual | [`tests/e2e/visual.feature`](tests/e2e/visual.feature) | `@visual` |
| Reporter demos | [`tests/e2e/failing.feature`](tests/e2e/failing.feature) | `@failing` |

| Tag | Meaning |
| --- | --- |
| `@smoke` | Core happy paths |
| `@login` | UI authentication feature |
| `@logout` | End-session scenario on the login feature |
| `@negative` | Rejected or incomplete input |
| `@a11y` / `@perf` | Accessibility and web vitals |
| `@api` | Direct calls to the authentication endpoint |
| `@failing` | Synthetic failures that prove the reporters capture failures |
| `@visual` | Screenshot comparison, local only (see below) |
| `@known-issue` | Genuine product defect, kept visible but outside the CI gate |

`@mode:default` on the API feature is a playwright-bdd execution tag, not a filter. It runs those scenarios in order in one worker (overriding `fullyParallel`) without skipping later cases when one fails.

### Visual baselines

Baselines live beside the feature that uses them, at
`tests/e2e/__screenshots__/login-{project}-{platform}.png`, set by `snapshotPathTemplate`
in the config. They deliberately do **not** sit under Playwright's default location: `testDir`
is the generated `.features-gen/` folder, which is gitignored and rewritten by `bddgen`, so
baselines placed there are wiped on every run and can never be committed.

Baselines are platform-stamped because a screenshot taken on Windows will not match one taken
on the Linux CI runner. A missing baseline is created from the current page and the scenario
passes; later runs compare against that file. Refresh an existing baseline with:

```bash
npm run gen
npx playwright test --grep @visual --update-snapshots
```

Commit the baselines for whichever platforms you intend to check. `@visual` is excluded
from `test:ci` for this reason.

### Rate limiting

The suite authenticates a single shared QA account against production, and that endpoint
throttles bursts of login attempts. Worker count is capped for that reason, the `@api`
feature runs in-file sequentially (`@mode:default`), `LoginApi` backs off on HTTP 429,
and the UI `loginUntilAccepted` helper re-submits when a throttled post leaves the form
unchanged. Raising `WORKERS` well above the default will cause throttled logins to look
like failures.

## Configuration

| Variable | Purpose |
| --- | --- |
| `ENV` | `dev` \| `staging` \| `prod` — selects `test-data/<env>/`, including `env.json` for the URLs and the test account |
| `BASE_URL` | Optional override of `env.json` `baseURL` |
| `API_BASE_URL` | Optional override of `env.json` `apiBaseURL` |
| `BP_USERNAME` / `BP_PASSWORD` | Optional override of `env.json` `account.username` / `account.password` |
| `BP_ACCOUNT_NAME` | Optional override of `env.json` `account.accountName` |
| `WORKERS` | Parallelism (default 4 locally, 2 in CI) |
| `RETRIES` | Failed-test retries (default 0 locally, 2 in CI) |
| `MOBILE=1` | Extra iPhone 13 project |
| `DEBUG_TESTS=1` | Extra JSON debug logs from fixtures |

## Reports

Five reporters run on every execution: `list` (console), `html`
(`playwright-report/`), `allure-playwright` (`allure-results/`), `junit` (`junit.xml`), and
the custom `featureReporter`, which writes both `feature-report/` and `summary.json`.
Failed UI tests keep a video under `test-results/` (`video: 'retain-on-failure'`). Traces are captured on first retry.

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

## Add a page + scenario

1. Create a POM under `src/pages/`.
2. Register it as a fixture in `src/fixtures/baseTest.ts`.
3. Add a `.feature` under `tests/e2e/` or `tests/api/` and steps under `tests/**/steps/` using `Given`/`When`/`Then` from `baseTest`.
4. Put shared data in `test-data/` and env-specific values in `test-data/<env>/` (`env.json` for the URLs and the test account, plus any overrides of shared files). Keep locators out of Gherkin; keep assertions in `src/utils/assertions/`. Resolve valid / invalid / blank credentials through [`src/utils/credentials.ts`](src/utils/credentials.ts), not in the feature file.
