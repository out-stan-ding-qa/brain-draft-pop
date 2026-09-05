import type { Locator, Page } from '@playwright/test';

export class LoggedInChrome {
  readonly page: Page;
  readonly accountName: Locator;
  readonly userMenu: Locator;
  readonly logOut: Locator;

  constructor(page: Page, accountName: string) {
    this.page = page;
    this.accountName = page
      .getByRole('banner')
      .getByRole('button', { name: accountName, exact: true })
      .or(page.getByRole('button', { name: accountName, exact: true }));
    this.userMenu = page.locator('#user_menu__BV_toggle_');
    this.logOut = page.locator('#logout_button');
  }

  async logout(): Promise<void> {
    await this.userMenu.evaluate((el: HTMLElement) => el.click());
    await this.logOut.evaluate((el: HTMLElement) => el.click());
  }
}
