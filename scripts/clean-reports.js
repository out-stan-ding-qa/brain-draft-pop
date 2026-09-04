/**
 * Clears report inputs that are append-only.
 *
 * Most outputs are rewritten each run: Playwright wipes test-results/ and
 * playwright-report/, and junit.xml, summary.json and feature-report/index.html
 * are overwritten. allure-results/ is the exception — allure-playwright adds
 * files without removing earlier ones, so without this every run inflates the
 * Allure report with results from code that no longer exists.
 */
const fs = require('node:fs');
const path = require('node:path');

const APPEND_ONLY = ['allure-results'];

for (const dir of APPEND_ONLY) {
  fs.rmSync(path.resolve(process.cwd(), dir), { recursive: true, force: true });
}
