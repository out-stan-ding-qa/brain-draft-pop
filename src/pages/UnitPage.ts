import type { Locator, Page } from '@playwright/test';
import { logger } from '../utils/logger';
import { clickNamedOrRandom } from '../utils/pickRandom';

export class UnitPage {
  readonly page: Page;
  readonly topics: Locator;

  constructor(page: Page) {
    this.page = page;
    this.topics = page.locator('a[href*="/topic/"]:not([href*="/quiz/"]):visible');
  }

  async openTopic(name?: string): Promise<string> {
    const chosen = await clickNamedOrRandom(this.topics, name);
    logger.info('Opened topic', { topic: chosen });
    return chosen;
  }
}
