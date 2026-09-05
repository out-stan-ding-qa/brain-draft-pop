import { expect } from '@playwright/test';
import { BrainPopLoginPage } from '../../pages/BrainPopLoginPage';
import { LoggedInChrome } from '../../pages/LoggedInChrome';
import { QuizPage } from '../../pages/QuizPage';
import { TeacherDashboardPage } from '../../pages/TeacherDashboardPage';
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

export async function expectQuizLoaded(quizPage: QuizPage): Promise<void> {
  await expect(quizPage.page).toHaveURL(/\/topic\/[^/?#]+\/quiz\/?/, { timeout: 20_000 });
  await expect(quizPage.heading).toBeVisible({ timeout: 20_000 });
  await expect(quizPage.preview).toBeVisible();
}
