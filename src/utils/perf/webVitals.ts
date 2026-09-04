import type { Page, TestInfo } from '@playwright/test';
import { logger } from '../logger';

export type NavigationVitals = {
  ttfbMs?: number;
  domInteractiveMs?: number;
  domContentLoadedMs?: number;
  loadCompleteMs?: number;
  firstContentfulPaintMs?: number;
  largestContentfulPaintMs?: number;
  cumulativeLayoutShift?: number;
  transferBytes?: number;
};

const METRIC_LABELS: Record<keyof NavigationVitals, string> = {
  ttfbMs: 'Time to first byte',
  domInteractiveMs: 'DOM interactive',
  domContentLoadedMs: 'DOM content loaded',
  loadCompleteMs: 'Load complete',
  firstContentfulPaintMs: 'First contentful paint',
  largestContentfulPaintMs: 'Largest contentful paint',
  cumulativeLayoutShift: 'Cumulative layout shift',
  transferBytes: 'Transferred bytes',
};

export async function collectNavigationVitals(page: Page): Promise<NavigationVitals> {
  const vitals = await page.evaluate(async () => {
    const round = (value: number | undefined): number | undefined =>
      typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paint = performance.getEntriesByType('paint').find((entry) => entry.name === 'first-contentful-paint');

    // LCP and layout shifts are only readable through a buffered observer, and
    // neither entry type is supported by every browser.
    const observeBuffered = <T>(
      type: string,
      accumulate: (entries: PerformanceEntry[], current: T | undefined) => T | undefined,
    ): Promise<T | undefined> =>
      new Promise((resolve) => {
        if (!PerformanceObserver.supportedEntryTypes?.includes(type)) {
          resolve(undefined);
          return;
        }
        let current: T | undefined;
        try {
          const observer = new PerformanceObserver((list) => {
            current = accumulate(list.getEntries(), current);
          });
          observer.observe({ type, buffered: true } as PerformanceObserverInit);
          setTimeout(() => {
            observer.disconnect();
            resolve(current);
          }, 300);
        } catch {
          resolve(undefined);
        }
      });

    const [largestContentfulPaint, layoutShift] = await Promise.all([
      observeBuffered<number>('largest-contentful-paint', (entries) => entries[entries.length - 1]?.startTime),
      observeBuffered<number>('layout-shift', (entries, current) =>
        entries.reduce((total, entry) => {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          return shift.hadRecentInput ? total : total + shift.value;
        }, current ?? 0),
      ),
    ]);

    return {
      ttfbMs: round(navigation?.responseStart),
      domInteractiveMs: round(navigation?.domInteractive),
      domContentLoadedMs: round(navigation?.domContentLoadedEventEnd),
      loadCompleteMs: round(navigation?.loadEventEnd),
      firstContentfulPaintMs: round(paint?.startTime),
      largestContentfulPaintMs: round(largestContentfulPaint),
      cumulativeLayoutShift:
        layoutShift === undefined ? undefined : Number.parseFloat(layoutShift.toFixed(4)),
      transferBytes: navigation?.transferSize,
    };
  });

  logger.info('navigation-vitals', vitals);
  return vitals;
}

export function renderVitalsTable(vitals: NavigationVitals): string {
  const rows = (Object.keys(METRIC_LABELS) as (keyof NavigationVitals)[]).map((key) => {
    const value = vitals[key];
    const unit = key === 'transferBytes' ? '' : key === 'cumulativeLayoutShift' ? '' : ' ms';
    return `${METRIC_LABELS[key].padEnd(26)} ${value === undefined ? 'not supported' : `${value}${unit}`}`;
  });
  return ['Navigation web vitals', '='.repeat(45), ...rows].join('\n');
}

/**
 * Publishes metrics so they show up in the HTML report, Allure, and the custom
 * JSON summary. Annotations give an at-a-glance view in the test list.
 */
export async function publishVitals(testInfo: TestInfo, vitals: NavigationVitals): Promise<void> {
  await testInfo.attach('web-vitals.json', {
    body: JSON.stringify({ project: testInfo.project.name, test: testInfo.title, ...vitals }, null, 2),
    contentType: 'application/json',
  });
  await testInfo.attach('web-vitals.txt', {
    body: renderVitalsTable(vitals),
    contentType: 'text/plain',
  });

  for (const [key, value] of Object.entries(vitals)) {
    if (value !== undefined) {
      testInfo.annotations.push({ type: `perf:${key}`, description: String(value) });
    }
  }
}

/**
 * Optional Lighthouse — enable with PERF_LIGHTHOUSE=1 and wire chrome-launcher in CI.
 * Left as a documented extension point (not run in default suite).
 */
export async function maybeRunLighthouse(): Promise<void> {
  if (process.env.PERF_LIGHTHOUSE !== '1') {
    return;
  }
  logger.warn('lighthouse-skipped', { reason: 'Install lighthouse/chrome-launcher and invoke from CI when needed' });
}
