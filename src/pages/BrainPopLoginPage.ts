import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '../config/env';
import { CookieBanner } from './components/CookieBanner';

export class BrainPopLoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly showPassword: Locator;
  readonly submit: Locator;
  readonly forgotLink: Locator;
  readonly error: Locator;

  constructor(page: Page, loginErrorPattern: string) {
    this.page = page;
    this.username = page.locator('#username').or(page.getByRole('textbox', { name: /^username:?$/i }));
    this.password = page.locator('#password-input').or(page.getByLabel(/^password:?$/i));
    this.showPassword = page.locator('#password-input_pass_checkbox').or(page.getByRole('checkbox', { name: /show password/i }));
    this.submit = page.locator('#login_button').or(page.getByRole('button', { name: 'Log In', exact: true }));
    this.forgotLink = page.getByRole('button', { name: /forgot username or password/i });
    this.error = page.getByText(new RegExp(loginErrorPattern, 'i'));
  }

  async goto(): Promise<void> {
    // '/' would resolve to the origin home page, not BASE_URL's /login path
    await this.page.goto(env.baseURL, { waitUntil: 'domcontentloaded' });
    await expect(this.username).toBeVisible({ timeout: 30_000 });
    await new CookieBanner(this.page).dismissIfPresent();
  }

  async fillUsername(value: string): Promise<void> {
    await this.username.fill(value);
  }

  async fillPassword(value: string): Promise<void> {
    await this.password.fill(value);
  }

  async submitLogin(): Promise<void> {
    await this.submit.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submitLogin();
  }

  /**
   * The auth endpoint throttles bursts of attempts. A throttled submit leaves the
   * form filled in with no error shown, so re-submit before treating it as a
   * rejection. A genuine rejection surfaces an error and returns immediately.
   */
  async loginUntilAccepted(username: string, password: string, attempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      await this.login(username, password);

      const accepted = await this.username
        .waitFor({ state: 'hidden', timeout: 15_000 })
        .then(() => true)
        .catch(() => false);

      if (accepted || (await this.error.first().isVisible().catch(() => false))) {
        return;
      }

      await this.page.waitForTimeout(1_000 * 2 ** (attempt - 1));
    }
  }
}
