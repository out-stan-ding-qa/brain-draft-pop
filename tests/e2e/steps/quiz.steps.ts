import { Then, When } from '../../../src/fixtures/baseTest';
import { expectQuizLoaded, expectTeacherDashboard } from '../../../src/utils/assertions/browse';

Then('I should be on the teacher dashboard', async ({ teacherDashboard, loggedInChrome, loginPage }) => {
  await expectTeacherDashboard(teacherDashboard, loggedInChrome, loginPage);
});

When('I open a random subject', async ({ teacherDashboard }) => {
  await teacherDashboard.openSubject();
});

When('I open a random unit', async ({ subjectPage }) => {
  await subjectPage.openUnit();
});

When('I open a random topic', async ({ unitPage }) => {
  await unitPage.openTopic();
});

When('I open the Quiz', async ({ topicPage }) => {
  await topicPage.openQuiz();
});

Then('the quiz page should load', async ({ quizPage }) => {
  await expectQuizLoaded(quizPage);
});
