# BrainPOP Playwright + Gherkin framework

UI/API tests for BrainPOP using **Playwright Test**, **playwright-bdd** (Gherkin), TypeScript, page objects (POM), and fixtures.

Playwright runs generated specs under `.features-gen/`, which is gitignored and rewritten by `bddgen` on every test run — do not edit those files, and do not pass a `.feature` path to `playwright test`.

## Install

Requires **Node.js 20+**.

```bash
npm ci
npx playwright install chromium firefox
cp .env.example .env
```

On Windows PowerShell, copy env with `Copy-Item .env.example .env`.

## Run

`npm test` and the other `test:*` scripts run `bddgen` first (`npm run gen`). If you run playwright test separately, you need to run `npm run gen` to rebuild .feature-gen files.

```bash
npm test                 # full suite: UI + API (includes two @failing demos)
npm run test:e2e         # same as npm test
npm run test:smoke       # @smoke only (login happy path + quiz browse)
npm run test:a11y        # accessibility scenarios only
npm run test:ci          # exclude @failing, @visual, @known-issue (CI gate)
npm run test:demo-failures
npm run test:mobile      # adds iPhone 13 project (MOBILE=1)
npm run gen              # regenerate .features-gen/
```

### Subsets

Filter by tag or title after generating. `testDir` is `.features-gen/`, so grep the tag rather than the source `.feature` file.

On Windows PowerShell, quote the pattern (`--grep "@quiz"`). Unquoted `@quiz` is treated as a variable and the command fails.

```bash
npm run gen
npx playwright test --grep @api
npx playwright test --grep @api --project=chromium
npx playwright test --grep @logout
npx playwright test --grep @negative
npx playwright test --grep @quiz --project=chromium --headed --workers=1
npx playwright test --headed --grep @smoke
```

#### Combining tags

There is no `--tag` flag. `--grep` is a regular expression tested against a single string per
test made of the project name, file name, describe titles, test title, and tags joined by
spaces — so combining tags is a regex question.

```bash
# both tags, in any order (AND)
npx playwright test --grep "(?=.*@login)(?=.*@smoke)"

# either tag (OR)
npx playwright test --grep "@login|@smoke"

# one tag but not another
npx playwright test --grep @login --grep-invert @logout
```

| Feature | File | Typical filter |
| --- | --- | --- |
| Login UI | [`tests/e2e/login.feature`](tests/e2e/login.feature) | `@login`, `@logout` |
| Teacher topic features | [`tests/e2e/quiz.feature`](tests/e2e/quiz.feature) | `@quiz`, `@smoke` |
| Login API | [`tests/api/login-api.feature`](tests/api/login-api.feature) | `@api` |
| Accessibility | [`tests/e2e/accessibility.feature`](tests/e2e/accessibility.feature) | `@a11y` |
| Performance | [`tests/e2e/performance.feature`](tests/e2e/performance.feature) | `@perf` |
| Visual | [`tests/e2e/visual.feature`](tests/e2e/visual.feature) | `@visual` |
| Reporter demos | [`tests/e2e/failing.feature`](tests/e2e/failing.feature) | `@failing` |

| Tag | Meaning |
| --- | --- |
| `@smoke` | Core happy paths (successful login, Mountains Quiz, random Feature browse) |
| `@login` | UI authentication feature |
| `@logout` | End-session scenario on the login feature |
| `@quiz` | Topic Feature coverage (Quiz today; other Features reuse the same steps) |
| `@negative` | Rejected or incomplete input |
| `@a11y` / `@perf` | Accessibility and web vitals |
| `@api` | Direct calls to the authentication endpoint |
| `@failing` | Synthetic failures that prove the reporters capture failures |
| `@visual` | Screenshot comparison, local only (see below) |
| `@known-issue` | Genuine product defect, kept visible but outside the CI gate |

`@mode:default` is a playwright-bdd execution tag. It runs those scenarios in order in one worker (overriding `fullyParallel`) without skipping later cases when one fails.
`@timeout:N` (milliseconds) is a playwright-bdd execution tag. On a scenario it overrides Playwright’s test timeout for that test only; on a Feature it applies to each scenario in the file. It does not change `expect` or `actionTimeout`. The random-browse Feature scenario uses `@timeout:180000` (3 minutes). Background steps count toward that same budget.

### Visual baselines

Baselines live beside the feature that uses them, at
`tests/e2e/__screenshots__/login-{project}-{platform}.png`, set by `snapshotPathTemplate`
in the config.

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
throttles bursts of login attempts. CI runs one worker per browser job for that reason, the `@api`
and login UI features run in-file sequentially (`@mode:default`), `LoginApi` backs off on HTTP 429,
and the UI `loginUntilSettled` helper re-submits when a throttled post leaves the form
unchanged.

## Topic features

[`tests/e2e/quiz.feature`](tests/e2e/quiz.feature) covers opening a Feature on a Topic page. Quiz is one parameterized example of that Feature API (`openFeature(name)` / `expectFeatureLoaded({ name, pathSegment })`), not a Quiz-only page object.

Two paths after sign-in:

1. **Known topic** — open Mountains from [`test-data/browse.json`](test-data/browse.json), then open Quiz.
2. **Random browse** — teacher dashboard → random subject → unit → topic → Feature. Science is the only subject that opens **What would you like to explore?**; the page object then clicks **Science topics on BrainPOP**. Other subjects skip that dialog.

To cover another Feature (Challenge, Movie, …), add an Examples row and, if the URL slug is not the card name lowercased, a `features` entry in `browse.json`. To open a named topic, add it under `topics` and use `When I open the "Name" topic`.

Locators live on the page objects (`TeacherDashboardPage`, `SubjectPage`, `UnitPage`, `TopicPage`, `FeaturePage`).
Assertions live in [`src/utils/assertions/browse.ts`](src/utils/assertions/browse.ts).

## Configuration

| Variable | Purpose |
| --- | --- |
| `ENV` | `dev` \| `staging` \| `prod` — selects `test-data/<env>/` |
| `BASE_URL` | Optional override of `env.json` `baseURL` |
| `API_BASE_URL` | Optional override of `env.json` `apiBaseURL` |
| `BP_USERNAME` / `BP_PASSWORD` | Optional override of `env.json` `account.username` / `account.password` |
| `BP_ACCOUNT_NAME` | Optional override of `env.json` `account.accountName` |
| `WORKERS` | Parallelism (default 2) |
| `RETRIES` | Failed-test retries (default 0 locally, 2 in CI) |
| `MOBILE=1` | Extra iPhone 13 project |
| `DEBUG_TESTS=1` | Extra JSON debug logs from fixtures |

## Reports

Four reporters run on every execution: `list` (console), `html`
(`playwright-report/`), `junit` (`junit.xml`), and the custom `featureReporter`,
which writes both `feature-report/` and `summary.json`.
Failed UI tests keep a video under `test-results/` (`video: 'retain-on-failure'`). Traces are captured on first retry.

```bash
npx playwright show-report          # Playwright HTML report: traces, video, timeline
# Feature summary is written on every run — open feature-report/index.html
```

### Feature summary report

`feature-report/index.html` answers "what is red today" in one screen: totals across the run,
then the same breakdown per `.feature` file, with drill-down into scenarios, Gherkin steps,
error text, annotations, and screenshots.

| Bucket | Meaning |
| --- | --- |
| Passed | Test passed (a pass on retry also counts, and is flagged `flaky`) |
| Failed | An assertion did not hold |
| Broken | Something else stopped the test: thrown error, timeout, missing snapshot |
| Skipped | Skipped or fixme |
| Other | Interrupted, or a status the run did not classify |

## Accessibility

[`tests/e2e/accessibility.feature`](tests/e2e/accessibility.feature) checks one concern per
scenario against WCAG 2.1 A/AA.
Axe rule ids live in `A11Y_RULE_GROUPS` in [`src/utils/a11y/axe.ts`](src/utils/a11y/axe.ts)

A final scenario re-scans the page with every already-covered rule disabled, so a newly
introduced violation still fails somewhere.

One real defect is currently tagged `@known-issue`: the "Sign in with Google" label fails
minimum colour contrast (`#sso-link-google .sso_name`). It is excluded from `test:ci` but
runs under `npm run test:a11y`.

## Performance

The step `When I capture the navigation web vitals` reads the browser's Performance API and
publishes the numbers to every reporter, so they are visible rather than buried in a log:

## CI

[`playwright.yml`](.github/workflows/playwright.yml) runs three jobs:

1. **`e2e`** — a matrix over Chromium and Firefox. Each job emits a `blob` report (an
   intermediate format) rather than a finished report of its own.
2. **`report`** — downloads every blob and runs `playwright merge-reports`, producing **one**
   report that covers all browsers. Without this each browser produced a separate report and
   only one of them ever reached GitHub Pages.
3. **`publish-report`** — deploys the merged HTML report to Pages on the default branch.

The CI gate is `test:ci`, which includes `@quiz` / `@smoke` and excludes `@failing`,
`@visual`, and `@known-issue`.

`npm run test:demo-failures` is a local demonstration that the reporters capture failures. It
is deliberately not a CI step — running it after the real suite used to overwrite
`playwright-report/`, `junit.xml` and `summary.json`, so the published report described the
two synthetic failures instead of the actual run.

## Add a page + scenario

1. Create a POM under `src/pages/` (one class per URL stage; dialogs under `src/pages/components/`).
2. Register it as a fixture in `src/fixtures/baseTest.ts`.
3. Add a `.feature` under `tests/e2e/` or `tests/api/` and steps under `tests/**/steps/` using `Given`/`When`/`Then`.
4. Put shared data in `test-data/` and env-specific values in `test-data/<env>/` (`env.json` for the URLs and the test account, plus any overrides of shared files). 
5. Keep locators out of Gherkin; keep assertions in `src/utils/assertions/`. 
6. Resolve valid / invalid / blank credentials through [`src/utils/credentials.ts`](src/utils/credentials.ts), not in the feature file. For “named or random” clicks, reuse [`src/utils/pickRandom.ts`](src/utils/pickRandom.ts). Named topics and Feature URL slugs live in [`test-data/browse.json`](test-data/browse.json).
