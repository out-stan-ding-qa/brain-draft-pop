@perf
Feature: Login page performance
  Navigation timings are captured from the browser's Performance API and published
  to the HTML report, Allure, and summary.json so load regressions are visible
  rather than buried in a console log.

  Background:
    Given I am on the BrainPOP login page

  Scenario: Navigation web vitals are captured and published to the report
    When I capture the navigation web vitals
    Then the web vitals should be attached to the report

  Scenario: The login page loads within the performance budget
    When I capture the navigation web vitals
    Then the web vitals should be within the configured budget
