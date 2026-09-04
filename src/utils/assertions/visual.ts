import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { CookieBanner } from '../../pages/components/CookieBanner';
import { logger } from '../logger';

export const LOGIN_VISUAL_SNAPSHOT = 'login.png';

function screenshotOptions(page: Page) {
  return {
    fullPage: true,
    mask: [CookieBanner.locator(page)],
    animations: 'disabled' as const,
    caret: 'hide' as const,
    scale: 'css' as const,
    maskColor: '#FF00FF',
  };
}

/**
 * Compare against the committed baseline. If this OS/project has none yet,
 * write the current screenshot as that baseline and pass — Playwright's own
 * missing-snapshot path still fails the test after creating the file.
 */
export async function expectPageMatchesVisualBaseline(
  page: Page,
  testInfo: TestInfo,
  name = LOGIN_VISUAL_SNAPSHOT,
): Promise<void> {
  const baselinePath = testInfo.snapshotPath(name, { kind: 'screenshot' });
  const options = screenshotOptions(page);

  if (!fs.existsSync(baselinePath)) {
    await page.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    await page.screenshot({ path: baselinePath, ...options });

    const relative = path.relative(process.cwd(), baselinePath);
    logger.info('visual-baseline-created', { path: relative, project: testInfo.project.name });
    testInfo.annotations.push({
      type: 'visual-baseline',
      description: `No baseline found; wrote ${relative}`,
    });
    await testInfo.attach('visual-baseline-created', { path: baselinePath, contentType: 'image/png' });
    return;
  }

  await expect(page).toHaveScreenshot(name, {
    ...options,
    maxDiffPixelRatio: 0.03,
  });
}
