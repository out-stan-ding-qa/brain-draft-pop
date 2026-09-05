import type { Locator, Page } from '@playwright/test';
import { logger } from '../utils/logger';
import { CookieBanner } from './components/CookieBanner';

export class TopicPage {
  readonly page: Page;
  readonly quiz: Locator;

  constructor(page: Page) {
    this.page = page;
    this.quiz = page
      .locator('a[href*="/quiz/"]')
      .filter({ has: page.locator('.info_name', { hasText: /^Quiz$/ }) })
      .or(page.locator('.info_name', { hasText: /^Quiz$/ }));
  }

  async openQuiz(): Promise<void> {
    await this.quiz.first().waitFor({ state: 'visible', timeout: 20_000 });
    await this.quiz.first().click();
    logger.info('Opened Quiz');
    await this.page.waitForURL(/\/topic\/[^/?#]+\/quiz\/?/, { timeout: 20_000 });
    await new CookieBanner(this.page).dismissCookieHub();
    await this.page
      .getByRole('status')
      .filter({ hasText: 'Loading...' })
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => undefined);
  }
}
