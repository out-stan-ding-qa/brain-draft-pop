import type { Page } from '@playwright/test';

/**
 * BrainPOP uses OneTrust. Call after the login form is visible so the SDK has
 * had time to inject; do not wait if the banner is absent for this region.
 */
export class CookieBanner {
  constructor(private readonly page: Page) {}

  async dismissIfPresent(): Promise<void> {
    const banner = this.page.locator('#onetrust-banner-sdk');
    const accept = this.page.locator('#onetrust-accept-btn-handler');

    if (!(await accept.isVisible())) {
      return;
    }

    await accept.click();
    await banner.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }
}
