import type { Locator, Page } from '@playwright/test';

/**
 * BrainPOP uses OneTrust. Call after the login form is visible so the SDK has
 * had time to inject; do not wait if the banner is absent for this region.
 */
export class CookieBanner {
  readonly banner: Locator;
  readonly accept: Locator;

  constructor(page: Page) {
    this.banner = CookieBanner.locator(page);
    this.accept = page.locator('#onetrust-accept-btn-handler');
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
}
