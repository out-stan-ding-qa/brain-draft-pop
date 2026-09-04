/**
 * Placeholder mapping from Playwright titles to external test-management IDs.
 * Extend this when wiring Zephyr, Xray, TestRail, etc. JUnit XML is the default export.
 */
export function mapTestTitleToExternalId(title: string): string | undefined {
  const match = title.match(/\[(C\d+|ZEPHYR-\d+|XRAY-\d+)\]/);
  return match?.[1];
}
