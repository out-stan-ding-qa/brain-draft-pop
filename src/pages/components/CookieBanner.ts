import type { Page } from '@playwright/test';

export class CookieBanner {
  constructor(private readonly page: Page) {}

  async dismissIfPresent(): Promise<void> {
    const accept = this.page.getByRole('button', { name: /allow all cookies|accept all|accept|agree|got it/i }).first();
    try {
      if (await accept.isVisible({ timeout: 2_000 })) {
        await accept.click();
      }
    } catch {
      // no banner
    }
  }
}
