import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { env } from './src/config/env';

const testDir = defineBddConfig({
  features: ['tests/e2e/**/*.feature', 'tests/api/**/*.feature'],
  steps: ['tests/**/steps/**/*.ts', 'src/fixtures/baseTest.ts'],
});

const projects = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
];

if (env.mobile) {
  projects.push({ name: 'iPhone 13', use: { ...devices['iPhone 13'] } });
}

export default defineConfig({
  testDir,
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
    ['junit', { outputFile: 'junit.xml' }],
    ['./src/utils/reporting/featureReporter.ts', { outputFolder: 'feature-report', jsonFile: 'summary.json' }],
  ],
  use: {
    baseURL: env.baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  outputDir: 'test-results',
  projects,
});
