import type { Locator, Page } from '@playwright/test';
import { logger } from '../utils/logger';
import { clickNamedOrRandom } from '../utils/pickRandom';

export class SubjectPage {
  readonly page: Page;
  readonly units: Locator;

  constructor(page: Page) {
    this.page = page;
    this.units = page.locator('a[href*="/unit/"]:visible');
  }

  async openUnit(name?: string): Promise<string> {
    const chosen = await clickNamedOrRandom(this.units, name);
    logger.info('Opened unit', { unit: chosen });
    return chosen;
  }
}
