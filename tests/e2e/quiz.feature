@quiz @smoke
Feature: Teacher opens a topic feature
  A signed-in teacher can open any Feature on a Topic page.

  Background:
    Given I am on the BrainPOP login page
    When I log in with valid credentials

  @timeout:120000
  Scenario: Quiz loads from the Mountains topic
    When I open the "Mountains" topic
    And I open the "Quiz" feature
    Then the "Quiz" page should load

  @timeout:180000
  Scenario Outline: Feature loads after browsing a random subject path
    Then I should be on the teacher dashboard
    When I open a random subject
    And I open a random unit
    And I open a random topic
    And I open the "<feature>" feature
    Then the "<feature>" page should load

    Examples:
      | feature |
      | Quiz    |
