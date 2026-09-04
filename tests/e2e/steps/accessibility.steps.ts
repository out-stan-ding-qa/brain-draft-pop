import { expect } from '@playwright/test';
import { Then, When } from '../../../src/fixtures/baseTest';
import {
  expectNoOtherSeriousViolations,
  expectNoViolationsForGroup,
  isRuleGroup,
} from '../../../src/utils/a11y/axe';

Then('the page should satisfy the {string} accessibility rules', async ({ page }, group: string) => {
  if (!isRuleGroup(group)) {
    throw new Error(`Unknown accessibility rule group "${group}". Add it to A11Y_RULE_GROUPS.`);
  }
  await expectNoViolationsForGroup(page, group);
});

Then('the page should have no other serious accessibility violations', async ({ page }) => {
  await expectNoOtherSeriousViolations(page);
});

Then(
  'tabbing from the username field should reach the password, reveal, and submit controls',
  async ({ page, loginPage }) => {
    await loginPage.username.focus();
    await expect(loginPage.username).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginPage.password).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginPage.showPassword).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginPage.submit).toBeFocused();
  },
);

When('I type credentials using only the keyboard', async ({ page, loginPage, testData }) => {
  await loginPage.username.focus();
  await page.keyboard.type(testData.login.invalidUsername);
  await page.keyboard.press('Tab');
  await page.keyboard.type(testData.login.wrongPassword);
});

Then('pressing Enter should submit the login form', async ({ page, loginPage }) => {
  // Assert on the outgoing request so the check does not depend on the
  // response, which may be throttled when the suite runs in parallel.
  const submission = page.waitForRequest(
    (request) => request.url().includes('/api/login') && request.method() === 'POST',
    { timeout: 15_000 },
  );
  await loginPage.password.press('Enter');
  await submission;
});
