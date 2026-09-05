import type { Locator, Page } from '@playwright/test';
import { logger } from '../../utils/logger';

/**
 * Optional post-login product hub ("Hi, QA" / Go To). Not always shown.
 * The checkbox is visually hidden (sr-only); click its label instead.
 */
export class ProductPicker {
  readonly page: Page;
  readonly hub: Locator;
  readonly dontShowAgainLabel: Locator;
  readonly brainPopScience: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hub = page.getByRole('heading', { name: /^hi,/i });
    this.dontShowAgainLabel = page.locator('label[for="save_default_checkbox"]');
    this.brainPopScience = page.getByRole('link', { name: /brainpop science/i });
  }

  async isVisible(): Promise<boolean> {
    return this.hub.isVisible();
  }

  async chooseBrainPopScience(): Promise<void> {
    await this.dontShowAgainLabel.click();
    await this.brainPopScience.first().click();
    logger.info('Chose BrainPOP Science on the product picker');
    await this.hub.waitFor({ state: 'hidden', timeout: 20_000 });
  }
}
