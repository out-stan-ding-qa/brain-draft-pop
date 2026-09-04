import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { env } from './src/config/env';
import { remoteConnectOptions } from './src/config/remote';

const testDir = defineBddConfig({
  features: ['tests/e2e/**/*.feature', 'tests/api/**/*.feature'],
  steps: ['tests/**/steps/**/*.ts', 'src/fixtures/baseTest.ts'],
});

const projects = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      connectOptions: remoteConnectOptions(env.remoteProvider, 'chrome'),
    },
  },
  {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      connectOptions: remoteConnectOptions(env.remoteProvider, 'firefox'),
    },
  },
];

if (env.mobile) {
  projects.push({
    name: 'iPhone 13',
    use: {
      ...devices['iPhone 13'],
      connectOptions: remoteConnectOptions(env.remoteProvider, 'chrome'),
    },
  });
}

export default defineConfig({
  testDir,
  // testDir is the generated .features-gen folder, which is gitignored and
  // rewritten by bddgen, so baselines must live beside the source .feature files
  // to survive. Relative templates resolve against the config directory.
  snapshotPathTemplate: '{testFileDir}/__screenshots__/{arg}{-projectName}-{platform}{ext}',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: true,
  forbidOnly: env.isCi,
  retries: env.retries,
  workers: env.workers,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['junit', { outputFile: 'junit.xml' }],
    ['./src/utils/reporting/featureReporter.ts', { outputFolder: 'feature-report', jsonFile: 'summary.json' }],
  ],
  use: {
    baseURL: env.baseURL,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  outputDir: 'test-results',
  projects,
});
