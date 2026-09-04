@visual
Feature: Login visual regression
  If this OS and browser have no committed baseline yet, the run writes one
  and passes. Later runs compare against that file.

  Background:
    Given I am on the BrainPOP login page

  Scenario: Login page matches the baseline screenshot
    Then the login page visual snapshot should match
