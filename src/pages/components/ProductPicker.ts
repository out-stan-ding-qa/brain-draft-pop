import type { Locator, Page } from '@playwright/test';
import { logger } from '../../utils/logger';

/**
 * Post-login "Go To" hub. Not always shown — skip if the teacher dashboard
 * loaded directly. Checking the box persists BrainPOP Science as the default.
 */
export class ProductPicker {
  readonly page: Page;
  readonly goTo: Locator;
  readonly dontShowAgain: Locator;
  readonly brainPopScience: Locator;

  constructor(page: Page) {
    this.page = page;
    this.goTo = page.getByRole('heading', { name: /^go to$/i });
    this.dontShowAgain = page.getByRole('checkbox', { name: /don['’]?t show this page again/i });
    this.brainPopScience = page
      .getByRole('link', { name: /brainpop science/i })
      .or(page.getByRole('button', { name: /brainpop science/i }))
      .or(page.getByText('BrainPOP Science', { exact: true }));
  }

  async chooseBrainPopScience(): Promise<void> {
    if (await this.dontShowAgain.isVisible()) {
      await this.dontShowAgain.check();
    } else {
      await this.page.getByText(/don['’]?t show this page again/i).click();
    }
    await this.brainPopScience.first().click();
    logger.info('Chose BrainPOP Science on the product picker');
    await this.goTo.waitFor({ state: 'hidden', timeout: 20_000 });
  }
}
