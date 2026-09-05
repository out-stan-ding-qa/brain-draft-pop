import type { Locator, Page } from '@playwright/test';
import { logger } from '../../utils/logger';

/**
 * Optional post-login product hub ("Hi, QA" / Go To). Not always shown.
 * The checkbox is visually hidden (sr-only); click its label instead.
 * Quiz and teacher paths need BrainPOP (Grades 3-8), not BrainPOP Science.
 */
export class ProductPicker {
  readonly page: Page;
  readonly hub: Locator;
  readonly dontShowAgainLabel: Locator;
  readonly brainPop: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hub = page.getByRole('heading', { name: /^hi,/i });
    this.dontShowAgainLabel = page.locator('label[for="save_default_checkbox"]');
    this.brainPop = page.getByRole('link', { name: 'BrainPOP Grades 3-8', exact: true });
  }

  async isVisible(): Promise<boolean> {
    return this.hub.isVisible();
  }

  async chooseBrainPop(): Promise<void> {
    await this.dontShowAgainLabel.click();
    await this.brainPop.click();
    logger.info('Chose BrainPOP (Grades 3-8) on the product picker');
    await this.hub.waitFor({ state: 'hidden', timeout: 20_000 });
  }
}
