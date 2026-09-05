import type { Locator, Page } from '@playwright/test';

/**
 * Shown after choosing Science from the teacher dashboard Subjects list.
 * Other subjects do not open this dialog — do not wait for it unless Science was clicked.
 */
export class ExploreScienceDialog {
  readonly heading: Locator;
  readonly scienceTopics: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: /what would you like to explore\??/i });
    this.scienceTopics = page
      .getByRole('link', { name: /science topics on brainpop/i })
      .or(page.getByRole('button', { name: /science topics on brainpop/i }));
  }

  async chooseScienceTopics(): Promise<void> {
    await this.heading.waitFor({ state: 'visible', timeout: 20_000 });
    await this.scienceTopics.first().click();
    await this.heading.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
  }
}
