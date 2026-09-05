import { expect } from '@playwright/test';
import { BrainPopLoginPage } from '../../pages/BrainPopLoginPage';
import { FeaturePage } from '../../pages/FeaturePage';
import { LoggedInChrome } from '../../pages/LoggedInChrome';
import { TeacherDashboardPage } from '../../pages/TeacherDashboardPage';
import { escapeRegExp } from '../feature';
import { expectLoggedIn } from './login';

export async function expectTeacherDashboard(
  dashboard: TeacherDashboardPage,
  chrome: LoggedInChrome,
  loginPage: BrainPopLoginPage,
): Promise<void> {
  await expectLoggedIn(chrome, loginPage);
  await expect(dashboard.page).toHaveURL(/\/teacher\/?(\?|$)/, { timeout: 20_000 });
  await expect(dashboard.subjectsHeading).toBeVisible({ timeout: 20_000 });
  await expect(dashboard.subjects.first()).toBeVisible({ timeout: 20_000 });
}

export async function expectFeatureLoaded(
  featurePage: FeaturePage,
  { name, pathSegment }: { name: string; pathSegment: string },
): Promise<void> {
  const segment = escapeRegExp(pathSegment);
  await expect(featurePage.page).toHaveURL(new RegExp(`/topic/[^/?#]+/${segment}/?(\\?|$)`), {
    timeout: 20_000,
  });
  await expect(featurePage.heading(name)).toBeVisible({ timeout: 20_000 });
}
