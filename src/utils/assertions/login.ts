import { expect } from '@playwright/test';
import { BrainPopLoginPage } from '../../pages/BrainPopLoginPage';
import { LoggedInChrome } from '../../pages/LoggedInChrome';
import { LOGIN_ENDPOINT } from '../api/loginApi';

export async function expectLoggedIn(chrome: LoggedInChrome, loginPage: BrainPopLoginPage): Promise<void> {
  await expect(loginPage.username).toBeHidden({ timeout: 20_000 });
  await expect(chrome.signedInHeading).toBeVisible({ timeout: 20_000 });
}

export async function expectLoginRejected(loginPage: BrainPopLoginPage, chrome: LoggedInChrome): Promise<void> {
  await expect(loginPage.username).toBeVisible();
  await expect(loginPage.error.first()).toBeVisible();
  await expect(chrome.signedInHeading).toHaveCount(0);
}

export async function expectRequiredCredentialsNotAccepted(
  loginPage: BrainPopLoginPage,
  chrome: LoggedInChrome,
): Promise<void> {
  await expect(loginPage.username).toBeVisible();
  const usernameEmpty = await loginPage.username.inputValue();
  const passwordEmpty = await loginPage.password.inputValue();
  expect(usernameEmpty === '' || passwordEmpty === '').toBeTruthy();
  await expect(chrome.signedInHeading).toHaveCount(0);
}

export async function expectSessionEnded(loginPage: BrainPopLoginPage, chrome: LoggedInChrome): Promise<void> {
  await expect(chrome.signedInHeading).toHaveCount(0);
  await expect(chrome.page.getByRole('link', { name: 'Log In' }).first().or(loginPage.username)).toBeVisible({
    timeout: 20_000,
  });
}

export async function expectLoginKeyboardFocusOrder(loginPage: BrainPopLoginPage): Promise<void> {
  await loginPage.focusUsername();
  await expect(loginPage.username).toBeFocused();

  await loginPage.pressTab();
  await expect(loginPage.password).toBeFocused();

  await loginPage.pressTab();
  await expect(loginPage.showPassword).toBeFocused();

  await loginPage.pressTab();
  await expect(loginPage.submit).toBeFocused();
}

/**
 * Assert on the outgoing request so the check does not depend on the
 * response, which may be throttled when the suite runs in parallel.
 */
export async function expectEnterSubmitsLogin(loginPage: BrainPopLoginPage): Promise<void> {
  const submission = loginPage.page.waitForRequest(
    (request) => request.url().includes(LOGIN_ENDPOINT) && request.method() === 'POST',
    { timeout: 15_000 },
  );
  await loginPage.submitWithEnter();
  await submission;
}
