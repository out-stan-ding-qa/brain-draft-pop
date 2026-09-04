import { Then } from '../../../src/fixtures/baseTest';
import { expectPageMatchesVisualBaseline } from '../../../src/utils/assertions/visual';

Then('the login page visual snapshot should match', async ({ page, $testInfo }) => {
  await expectPageMatchesVisualBaseline(page, $testInfo);
});
