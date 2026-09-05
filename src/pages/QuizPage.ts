import type { Locator, Page } from '@playwright/test';

export class QuizPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly preview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Quiz', exact: true, level: 1 });
    this.preview = page.getByRole('button', { name: 'Preview', exact: true });
  }
}
