import { expect } from '@playwright/test';
import { requireCredentials } from '../../../src/config/env';
import { Given, Then, When } from '../../../src/fixtures/baseTest';
import {
  expectLoggedIn,
  expectLoginRejected,
  expectRequiredCredentialsNotAccepted,
  expectSessionEnded,
} from '../../../src/utils/assertions/login';
import { resolvePassword, resolveUsername } from '../../../src/utils/credentials';

Given('I am on the BrainPOP login page', async ({ loginPage }) => {
  await loginPage.goto();
});

When('I log in with valid credentials', async ({ loginPage }) => {
  const { username, password } = requireCredentials();
  await loginPage.loginUntilAccepted(username, password);
});

When(
  'I log in with a {string} username and a {string} password',
  async ({ loginPage, testData }, userKind: string, passKind: string) => {
    const username = resolveUsername(userKind, testData.login);
    const password = resolvePassword(passKind, testData.login);
    // Blank fields never POST, so do not wait on the auth endpoint.
    if (!username || !password) {
      await loginPage.login(username, password);
      return;
    }
    await loginPage.loginUntilSettled(username, password);
  },
);

When('I log out', async ({ loggedInChrome }) => {
  await loggedInChrome.logout();
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

Then('I should be logged in successfully', async ({ loggedInChrome, loginPage }) => {
  await expectLoggedIn(loggedInChrome, loginPage);
});

Then('login should be rejected', async ({ loginPage, loggedInChrome }) => {
  await expectLoginRejected(loginPage, loggedInChrome);
});

Then('required credentials should not be accepted', async ({ loginPage, loggedInChrome }) => {
  await expectRequiredCredentialsNotAccepted(loginPage, loggedInChrome);
});

Then('the authenticated session should have ended', async ({ loginPage, loggedInChrome }) => {
  await expectSessionEnded(loginPage, loggedInChrome);
});

Then('the forgot credentials link should be visible', async ({ loginPage }) => {
  await expect(loginPage.forgotLink.first()).toBeVisible();
});
