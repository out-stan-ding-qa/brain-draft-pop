import type { Locator, Page } from '@playwright/test';

export class FeaturePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  heading(name: string): Locator {
    return this.page.getByRole('heading', { name, exact: true, level: 1 });
  }
}
