import { expect } from '@playwright/test';
import { requireCredentials } from '../../../src/config/env';
import { Then, When } from '../../../src/fixtures/baseTest';
import { expectApiLoginRejected, expectApiLoginSucceeded } from '../../../src/utils/assertions/loginApi';
import { resolvePassword, resolveUsername } from '../../../src/utils/credentials';

When('I submit a login request to the API with valid credentials', async ({ loginApi }) => {
  const { username, password } = requireCredentials();
  await loginApi.login(username, password);
});

When(
  'I submit a login request to the API with a {string} username and a {string} password',
  async ({ loginApi, testData }, userKind: string, passKind: string) => {
    await loginApi.login(
      resolveUsername(userKind, testData.login),
      resolvePassword(passKind, testData.login),
    );
  },
);

Then('the API login should succeed for the QA account', async ({ loginApi, testData }) => {
  expectApiLoginSucceeded(loginApi.lastResult, requireCredentials().username, testData.api);
});

Then('the API login should be rejected', async ({ loginApi, testData }) => {
  expectApiLoginRejected(loginApi.lastResult, testData.api);
});

Then('the login UI should still be available', async ({ loginPage }) => {
  await loginPage.goto();
  await expect(loginPage.username).toBeVisible();
});
