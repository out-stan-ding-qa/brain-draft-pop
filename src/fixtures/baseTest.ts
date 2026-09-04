import { test as bddTest, createBdd } from 'playwright-bdd';
import { BrainPopLoginPage } from '../pages/BrainPopLoginPage';
import { LoggedInChrome } from '../pages/LoggedInChrome';
import { ApiClient } from '../utils/api/client';
import { LoginApi } from '../utils/api/loginApi';
import { PerformanceProbe } from '../utils/perf/performanceProbe';
import { loadTestData, type AppTestData } from '../utils/testData';

type CustomFixtures = {
  loginPage: BrainPopLoginPage;
  loggedInChrome: LoggedInChrome;
  testData: AppTestData;
  api: ApiClient;
  loginApi: LoginApi;
  perf: PerformanceProbe;
};

export const test = bddTest.extend<CustomFixtures>({
  loginPage: async ({ page, testData }, use) => {
    await use(new BrainPopLoginPage(page, testData.login.loginErrorPattern));
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
});

export const { Given, When, Then } = createBdd(test);
