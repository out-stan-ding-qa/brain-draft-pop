import { expect, type Page } from '@playwright/test';
import { BrainPopLoginPage } from '../../pages/BrainPopLoginPage';
import { LoggedInChrome } from '../../pages/LoggedInChrome';

export async function expectLoggedIn(page: Page, chrome: LoggedInChrome, loginPage: BrainPopLoginPage): Promise<void> {
  await expect(loginPage.username).toBeHidden({ timeout: 20_000 });
  await expect(chrome.signedInHeading).toBeVisible({ timeout: 20_000 });
}

export async function expectLoginRejected(
  page: Page,
  loginPage: BrainPopLoginPage,
  errorPattern: RegExp,
): Promise<void> {
  await expect(loginPage.username).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Hi,/i })).toHaveCount(0);
  const errorVisible = await loginPage.error.first().isVisible().catch(() => false);
  if (errorVisible) {
    await expect(loginPage.error.first()).toHaveText(errorPattern);
  }
}

export async function expectSessionEnded(page: Page, loginPage: BrainPopLoginPage): Promise<void> {
  await expect(page.getByRole('heading', { name: /^Hi,/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Log In' }).first().or(loginPage.username)).toBeVisible({
    timeout: 20_000,
  });
}
