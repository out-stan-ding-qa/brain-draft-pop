import { expect, type Page } from '@playwright/test';
import { BrainPopLoginPage } from '../../pages/BrainPopLoginPage';
import { LoggedInChrome } from '../../pages/LoggedInChrome';
import { LOGIN_ENDPOINT } from '../api/loginApi';

export async function expectLoggedIn(chrome: LoggedInChrome, loginPage: BrainPopLoginPage): Promise<void> {
  await expect(loginPage.username).toBeHidden({ timeout: 20_000 });
  await expect(chrome.signedInHeading).toBeVisible({ timeout: 20_000 });
}

export async function expectLoginRejected(page: Page, loginPage: BrainPopLoginPage): Promise<void> {
  await expect(loginPage.username).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Hi,/i })).toHaveCount(0);
}

export async function expectSessionEnded(page: Page, loginPage: BrainPopLoginPage): Promise<void> {
  await expect(page.getByRole('heading', { name: /^Hi,/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Log In' }).first().or(loginPage.username)).toBeVisible({
    timeout: 20_000,
  });
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
