import path from 'node:path';
import { test as bddTest, createBdd } from 'playwright-bdd';
import { BrainPopLoginPage } from '../pages/BrainPopLoginPage';
import { LoggedInChrome } from '../pages/LoggedInChrome';
import { ApiClient } from '../utils/api/client';
import { LoginApi } from '../utils/api/loginApi';
import { logger } from '../utils/logger';
import { PerformanceProbe } from '../utils/perf/performanceProbe';
import { loadTestData, type AppTestData } from '../utils/testData';

type CustomFixtures = {
  loginPage: BrainPopLoginPage;
  loggedInChrome: LoggedInChrome;
  testData: AppTestData;
  api: ApiClient;
  loginApi: LoginApi;
  perf: PerformanceProbe;
  artifacts: { prefix: string };
};

export const test = bddTest.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new BrainPopLoginPage(page));
  },
  loggedInChrome: async ({ page }, use) => {
    await use(new LoggedInChrome(page));
  },
  testData: async ({}, use) => {
    await use(loadTestData());
  },
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
  loginApi: async ({ api }, use) => {
    await use(new LoginApi(api));
  },
  perf: async ({ page }, use, testInfo) => {
    await use(new PerformanceProbe(page, testInfo));
  },
  artifacts: [
    async ({}, use, testInfo) => {
      const prefix = [testInfo.project.name, testInfo.title, `retry-${testInfo.retry}`]
        .join('-')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .slice(0, 120);
      await use({ prefix });
      logger.debug('artifacts', { prefix, outputDir: path.dirname(testInfo.outputPath('x')) });
    },
    { auto: true },
  ],
});

export const { Given, When, Then } = createBdd(test);
