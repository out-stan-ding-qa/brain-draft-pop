import type { Locator, Page } from '@playwright/test';

/**
 * BrainPOP uses OneTrust on login and CookieHub on some later pages (quiz).
 * Call after the target UI is visible so the SDK has had time to inject;
 * do not wait if the banner is absent for this region.
 */
export class CookieBanner {
  readonly banner: Locator;
  readonly accept: Locator;
  readonly cookieHubAllowAll: Locator;

  constructor(page: Page) {
    this.banner = CookieBanner.locator(page);
    this.accept = page.locator('#onetrust-accept-btn-handler');
    this.cookieHubAllowAll = page.getByRole('button', { name: 'Allow all cookies' });
  }

  static locator(page: Page): Locator {
    return page.locator('#onetrust-banner-sdk');
  }

  async dismissIfPresent(): Promise<void> {
    if (!(await this.accept.isVisible())) {
      return;
    }

    await this.accept.click();
    await this.banner.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }

  async dismissCookieHubIfPresent(): Promise<void> {
    if (!(await this.cookieHubAllowAll.isVisible())) {
      return;
    }

    await this.cookieHubAllowAll.click();
    await this.cookieHubAllowAll.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }

  async dismissCookieHub(): Promise<void> {
    const visible = await this.cookieHubAllowAll
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (!visible) {
      return;
    }

    await this.cookieHubAllowAll.click();
    await this.cookieHubAllowAll.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }
}
