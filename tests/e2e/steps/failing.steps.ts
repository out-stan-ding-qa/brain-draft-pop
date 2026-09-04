import { expect } from '@playwright/test';
import { Then } from '../../../src/fixtures/baseTest';

Then('the page title should be {string}', async ({ page }, expected: string) => {
  await expect(page).toHaveTitle(expected);
});

Then('I should see a login success toast', async ({ page }) => {
  await expect(page.getByRole('status').filter({ hasText: /welcome back, you are in/i })).toBeVisible({
    timeout: 3_000,
  });
});
