import { expect } from '@playwright/test';
import { requireCredentials } from '../../../src/config/env';
import { Given, Then, When } from '../../../src/fixtures/baseTest';
import {
  expectLoggedIn,
  expectLoginRejected,
  expectSessionEnded,
} from '../../../src/utils/assertions/login';
import { expectPageMatchesVisualBaseline } from '../../../src/utils/assertions/visual';
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
    await loginPage.login(
      resolveUsername(userKind, testData.login),
      resolvePassword(passKind, testData.login),
    );
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

Then('login should be rejected', async ({ page, loginPage }) => {
  await expectLoginRejected(page, loginPage);
});

Then('required credentials should not be accepted', async ({ page, loginPage }) => {
  await expect(loginPage.username).toBeVisible();
  const usernameEmpty = await loginPage.username.inputValue();
  const passwordEmpty = await loginPage.password.inputValue();
  expect(usernameEmpty === '' || passwordEmpty === '').toBeTruthy();
  await expect(page.getByRole('heading', { name: /^Hi,/i })).toHaveCount(0);
});

Then('the authenticated session should have ended', async ({ page, loginPage }) => {
  await expectSessionEnded(page, loginPage);
});

Then('the forgot credentials link should be visible', async ({ loginPage }) => {
  await expect(loginPage.forgotLink.first()).toBeVisible();
});

Then('the page title should be {string}', async ({ page }, expected: string) => {
  await expect(page).toHaveTitle(expected);
});

Then('I should see a login success toast', async ({ page }) => {
  await expect(page.getByRole('status').filter({ hasText: /welcome back, you are in/i })).toBeVisible({
    timeout: 3_000,
  });
});

Then('the login page visual snapshot should match', async ({ page, $testInfo }) => {
  await expectPageMatchesVisualBaseline(page, $testInfo);
});
