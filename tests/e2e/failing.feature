@failing
Feature: Intentionally failing demos
  Used to verify HTML, Allure, JUnit, and JSON reporters capture failures.
  One demo fails on a mismatched value, the other on a missing element.

  Background:
    Given I am on the BrainPOP login page

  Scenario: Login page reports an unexpected title
    Then the page title should be "BrainPOP Dashboard"

  Scenario: Success toast is shown without logging in
    Then I should see a login success toast
