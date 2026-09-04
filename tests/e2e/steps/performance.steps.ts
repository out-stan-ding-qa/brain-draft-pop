import { expect } from '@playwright/test';
import { Then, When } from '../../../src/fixtures/baseTest';
import {
  expectVitalsCaptured,
  expectVitalsWithinBudget,
} from '../../../src/utils/assertions/performance';

When('I capture the navigation web vitals', async ({ perf }) => {
  await perf.capture();
});

Then('the web vitals should be attached to the report', async ({ perf, $testInfo }) => {
  expectVitalsCaptured(perf.lastVitals);
  expect($testInfo.attachments.map((attachment) => attachment.name)).toEqual(
    expect.arrayContaining(['web-vitals.json', 'web-vitals.txt']),
  );
});

Then('the web vitals should be within the configured budget', async ({ perf, testData }) => {
  expectVitalsWithinBudget(perf.lastVitals, testData.performance);
});
