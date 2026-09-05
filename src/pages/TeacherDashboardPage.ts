import type { Locator, Page } from '@playwright/test';
import { logger } from '../utils/logger';
import { clickNamedOrRandom } from '../utils/pickRandom';
import { ExploreScienceDialog } from './components/ExploreScienceDialog';

const SUBJECT_NAME = /^(Science|Social Studies|English|Math|Arts and Music|Health|Engineering and Tech|New and Updated)$/;

export class TeacherDashboardPage {
  readonly page: Page;
  readonly subjectsHeading: Locator;
  readonly subjects: Locator;
  private readonly exploreDialog: ExploreScienceDialog;

  constructor(page: Page) {
    this.page = page;
    this.subjectsHeading = page.getByRole('heading', { name: 'Subjects', exact: true });
    this.subjects = page.getByRole('link', { name: SUBJECT_NAME }).or(page.getByRole('button', { name: SUBJECT_NAME }));
    this.exploreDialog = new ExploreScienceDialog(page);
  }

  async openSubject(name?: string): Promise<string> {
    const chosen = await clickNamedOrRandom(this.subjects, name);
    logger.info('Opened subject', { subject: chosen });
    if (chosen.trim().toLowerCase() === 'science') {
      await this.exploreDialog.chooseScienceTopics();
    }
    return chosen;
  }
}
