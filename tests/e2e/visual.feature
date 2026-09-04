@visual
Feature: Login visual regression
  Background:
    Given I am on the BrainPOP login page

  Scenario: Login page matches the baseline screenshot
    Then the login page visual snapshot should match
