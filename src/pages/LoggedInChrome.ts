import type { Locator, Page } from '@playwright/test';

export class LoggedInChrome {
  readonly page: Page;
  readonly accountName: Locator;
  readonly logOut: Locator;

  constructor(page: Page, accountName: string) {
    this.page = page;
    this.accountName = page
      .getByRole('banner')
      .getByRole('button', { name: accountName, exact: true })
      .or(page.getByRole('button', { name: accountName, exact: true }));
    this.logOut = page
      .getByRole('menuitem', { name: /log out/i })
      .or(page.getByRole('button', { name: /log out/i }));
  }

  async logout(): Promise<void> {
    await this.accountName.click();
    await this.logOut.click();
  }
}
