import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import type { Result } from 'axe-core';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Named groups keep the feature files in business language while this registry
 * owns the axe rule ids. Add a rule here rather than in a step definition.
 */
export const A11Y_RULE_GROUPS = {
  'form labels': ['label', 'form-field-multiple-labels', 'autocomplete-valid'],
  'control names': ['button-name', 'link-name', 'nested-interactive'],
  'text alternatives': ['image-alt', 'role-img-alt', 'svg-img-alt'],
  'document metadata': ['document-title', 'html-has-lang', 'html-lang-valid'],
  aria: [
    'aria-allowed-attr',
    'aria-hidden-body',
    'aria-hidden-focus',
    'aria-prohibited-attr',
    'aria-required-attr',
    'aria-roles',
    'aria-valid-attr',
    'aria-valid-attr-value',
  ],
  'colour contrast': ['color-contrast'],
} as const satisfies Record<string, readonly string[]>;

export type A11yRuleGroup = keyof typeof A11Y_RULE_GROUPS;

export function isRuleGroup(name: string): name is A11yRuleGroup {
  return name in A11Y_RULE_GROUPS;
}

/** One readable line per offending element, so a failure names rule and target. */
function summarize(violations: Result[]): string[] {
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id} [${violation.impact}] ${node.target.join(' ')}`),
  );
}

export async function expectNoViolationsForGroup(page: Page, group: A11yRuleGroup): Promise<void> {
  const results = await new AxeBuilder({ page }).withRules([...A11Y_RULE_GROUPS[group]]).analyze();
  expect(summarize(results.violations)).toEqual([]);
}

/**
 * Regression net for everything the explicit scenarios do not name. Rules that
 * already have a dedicated scenario are excluded so a known failure is reported
 * once, by the scenario that owns it.
 */
export async function expectNoOtherSeriousViolations(page: Page): Promise<void> {
  const covered = Object.values(A11Y_RULE_GROUPS).flat();
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).disableRules(covered).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(summarize(serious)).toEqual([]);
}
