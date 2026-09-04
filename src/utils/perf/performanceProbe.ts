import type { Page, TestInfo } from '@playwright/test';
import {
  collectNavigationVitals,
  maybeRunLighthouse,
  publishVitals,
  type NavigationVitals,
} from './webVitals';

/**
 * Scenario-scoped helper so steps stay thin: one call collects the timings and
 * publishes them to every reporter, and later steps can assert on the result.
 */
export class PerformanceProbe {
  private lastCapture?: NavigationVitals;

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  async capture(): Promise<NavigationVitals> {
    this.lastCapture = await collectNavigationVitals(this.page);
    await publishVitals(this.testInfo, this.lastCapture);
    await maybeRunLighthouse();
    return this.lastCapture;
  }

  get lastVitals(): NavigationVitals {
    if (!this.lastCapture) {
      throw new Error('No web vitals have been captured in this scenario yet');
    }
    return this.lastCapture;
  }
}
