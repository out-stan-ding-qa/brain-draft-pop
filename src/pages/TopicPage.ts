import type { Locator, Page } from '@playwright/test';
import { escapeRegExp, featurePathSegment } from '../utils/feature';
import { logger } from '../utils/logger';
import { CookieBanner } from './components/CookieBanner';

export class TopicPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  featureCard(name: string): Locator {
    const slug = featurePathSegment(name);
    const namePattern = new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`, 'i');
    return this.page
      .locator(`a[href*="/${slug}/"]`)
      .filter({ has: this.page.locator('.info_name', { hasText: namePattern }) })
      .or(this.page.getByRole('link', { name: namePattern }))
      .or(this.page.locator('.info_name', { hasText: namePattern }));
  }

  async goto(path: string, topicName: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.dismissBanners();
    await this.page.getByRole('heading', { name: topicName }).first().waitFor({
      state: 'visible',
      timeout: 30_000,
    });
    logger.info('Opened topic', { topic: topicName, path });
  }

  async openFeature(name: string): Promise<void> {
    const slug = featurePathSegment(name);
    const card = this.featureCard(name).first();
    await card.waitFor({ state: 'visible', timeout: 20_000 });
    await card.click();
    logger.info('Opened feature', { feature: name, pathSegment: slug });
    await this.page.waitForURL(new RegExp(`/topic/[^/?#]+/${escapeRegExp(slug)}/?`), { timeout: 20_000 });
    await this.dismissBanners();
    await this.page
      .getByRole('status')
      .filter({ hasText: 'Loading...' })
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => undefined);
  }

  private async dismissBanners(): Promise<void> {
    const banner = new CookieBanner(this.page);
    await banner.dismissIfPresent();
    await banner.dismissCookieHub();
  }
}
