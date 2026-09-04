@a11y
Feature: Login page accessibility
  Explicit WCAG 2.1 A/AA checks against the login page, one concern per scenario
  so a failure names the barrier rather than "accessibility is broken".

  Background:
    Given I am on the BrainPOP login page

  Scenario: Form fields expose programmatic labels
    Then the page should satisfy the "form labels" accessibility rules

  Scenario: Buttons and links expose accessible names
    Then the page should satisfy the "control names" accessibility rules

  Scenario: Images expose text alternatives
    Then the page should satisfy the "text alternatives" accessibility rules

  Scenario: The document declares a title and language
    Then the page should satisfy the "document metadata" accessibility rules

  Scenario: ARIA roles and attributes are valid
    Then the page should satisfy the "aria" accessibility rules

  Scenario: Keyboard focus reaches every login control in order
    Then tabbing from the username field should reach the password, reveal, and submit controls

  Scenario: The login form can be submitted from the keyboard
    When I type credentials using only the keyboard
    Then pressing Enter should submit the login form

  Scenario: No other serious accessibility violations
    Then the page should have no other serious accessibility violations

  @known-issue
  Scenario: Text meets minimum colour contrast
    Then the page should satisfy the "colour contrast" accessibility rules
