import type { Locator, Page } from '@playwright/test';

export class LoggedInChrome {
  readonly page: Page;
  readonly signedInHeading: Locator;
  readonly userMenu: Locator;
  readonly logOut: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signedInHeading = page.getByRole('heading', { name: /^Hi,/i });
    // Product-picker chrome uses a 0×0 Bootstrap toggle; click via DOM.
    this.userMenu = page.locator('#user_menu__BV_toggle_');
    this.logOut = page.locator('#logout_button');
  }

  async logout(): Promise<void> {
    await this.userMenu.evaluate((el: HTMLElement) => el.click());
    await this.logOut.evaluate((el: HTMLElement) => el.click());
  }
}
