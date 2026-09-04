import { expect } from '@playwright/test';
import type { NavigationVitals } from '../perf/webVitals';
import type { PerformanceBudget } from '../testData';

/**
 * Reports every breach at once rather than failing on the first metric, so a
 * slow run shows the whole picture in the report.
 */
export function expectVitalsWithinBudget(vitals: NavigationVitals, budget: PerformanceBudget): void {
  const breaches = (Object.keys(budget) as (keyof PerformanceBudget)[])
    .map((metric) => {
      const actual = vitals[metric];
      const limit = budget[metric];
      if (actual === undefined || limit === undefined || actual <= limit) {
        return undefined;
      }
      return `${metric}: ${actual}ms exceeds budget of ${limit}ms`;
    })
    .filter((breach): breach is string => breach !== undefined);

  expect(breaches).toEqual([]);
}

export function expectVitalsCaptured(vitals: NavigationVitals): void {
  expect(vitals.ttfbMs, 'time to first byte should be measured').toBeGreaterThan(0);
  expect(vitals.loadCompleteMs, 'load event should have completed').toBeGreaterThan(0);
  expect(vitals.firstContentfulPaintMs, 'first contentful paint should be measured').toBeGreaterThan(0);
}
