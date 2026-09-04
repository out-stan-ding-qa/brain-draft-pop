import type { Page, Request } from '@playwright/test';

export async function abortMatchingRequests(page: Page, pattern: RegExp): Promise<void> {
  await page.route(pattern, (route) => route.abort());
}

export function onFailedRequests(page: Page, handler: (request: Request) => void): void {
  page.on('requestfailed', handler);
}
