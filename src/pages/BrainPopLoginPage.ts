import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { CookieBanner } from './components/CookieBanner';
import { ProductPicker } from './components/ProductPicker';

const TOO_MANY_REQUESTS = 429;

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
    this.error = page.getByRole('alert').or(page.getByText(new RegExp(loginErrorPattern, 'i')));
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

  async submitWithEnter(): Promise<void> {
    await this.password.press('Enter');
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submitLogin();
  }

  async typeWithKeyboard(username: string, password: string): Promise<void> {
    await this.focusUsername();
    await this.page.keyboard.type(username);
    await this.pressTab();
    await this.page.keyboard.type(password);
  }

  async focusUsername(): Promise<void> {
    await this.username.focus();
  }

  async pressTab(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  /**
   * Re-submit when the auth endpoint throttles (HTTP 429 or a silent no-op).
   * A 429 leaves the form filled with no error, which is not a credential rejection.
   */
  async loginUntilSettled(
    username: string,
    password: string,
    attempts = 4,
  ): Promise<'accepted' | 'rejected'> {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const pending = this.page.waitForResponse(isLoginPost, { timeout: 15_000 }).catch(() => undefined);
      await this.login(username, password);
      const response = await pending;

      if (response?.status() === TOO_MANY_REQUESTS) {
        const waitMs = retryAfterMs(response) ?? 1_000 * 2 ** (attempt - 1);
        logger.warn('login-ui-throttled', { attempt, waitMs, status: TOO_MANY_REQUESTS });
        await this.page.waitForTimeout(waitMs);
        continue;
      }

      if (response && response.status() >= 400) {
        await this.error.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
        return 'rejected';
      }

      const accepted = await this.username
        .waitFor({ state: 'hidden', timeout: 15_000 })
        .then(() => true)
        .catch(() => false);

      if (accepted) {
        await new CookieBanner(this.page).dismissIfPresent();
        return 'accepted';
      }

      if (await this.error.first().isVisible().catch(() => false)) {
        return 'rejected';
      }

      const waitMs = 1_000 * 2 ** (attempt - 1);
      logger.warn('login-ui-unsettled', { attempt, waitMs, status: response?.status() });
      await this.page.waitForTimeout(waitMs);
    }

    throw new Error('Login did not settle after retries (form still shown, no error — likely throttled)');
  }

  async loginUntilAccepted(username: string, password: string, attempts = 4): Promise<void> {
    const outcome = await this.loginUntilSettled(username, password, attempts);
    if (outcome !== 'accepted') {
      throw new Error('Expected login to succeed, but it was rejected');
    }
    await this.passProductPickerIfShown();
  }

  /**
   * Some accounts land on a "Go To" product hub instead of /teacher.
   * Check "don't show again" and open BrainPOP Science when that hub appears.
   */
  private async passProductPickerIfShown(): Promise<void> {
    const picker = new ProductPicker(this.page);
    const shown =
      (await picker.isVisible()) ||
      (await picker.hub.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false));
    if (!shown) {
      return;
    }
    await picker.chooseBrainPopScience();
    await this.page.waitForURL(/science\.brainpop\.com|\/teacher\/?/, {
      timeout: 20_000,
      waitUntil: 'domcontentloaded',
    });
  }
}

function isLoginPost(response: Response): boolean {
  return response.url().includes('/api/login') && response.request().method() === 'POST';
}

function retryAfterMs(response: Response): number | undefined {
  const header = response.headers()['retry-after'];
  const seconds = header ? Number.parseInt(header, 10) : Number.NaN;
  return Number.isNaN(seconds) ? undefined : seconds * 1_000;
}
