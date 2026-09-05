import { Then, When } from '../../../src/fixtures/baseTest';
import { expectFeatureLoaded, expectTeacherDashboard } from '../../../src/utils/assertions/browse';
import { resolveFeaturePathSegment } from '../../../src/utils/feature';

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

When('I open the {string} topic', async ({ topicPage, testData }, name: string) => {
  const topic = testData.browse.topics[name];
  if (!topic) {
    throw new Error(`Unknown topic "${name}". Add it to test-data/browse.json`);
  }
  await topicPage.goto(topic.path, name);
});

When('I open the {string} feature', async ({ topicPage }, name: string) => {
  await topicPage.openFeature(name);
});

Then('the {string} page should load', async ({ featurePage, testData }, name: string) => {
  await expectFeatureLoaded(featurePage, {
    name,
    pathSegment: resolveFeaturePathSegment(name, testData.browse.features),
  });
});
