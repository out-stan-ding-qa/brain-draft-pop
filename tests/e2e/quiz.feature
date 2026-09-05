@quiz @smoke
Feature: Teacher opens a topic quiz
  A signed-in teacher can browse from the dashboard to a topic Quiz.

  Background:
    Given I am on the BrainPOP login page
    When I log in with valid credentials

  @timeout:180000
  Scenario: Quiz loads after browsing a random subject path
    Then I should be on the teacher dashboard
    When I open a random subject
    And I open a random unit
    And I open a random topic
    And I open the Quiz
    Then the quiz page should load
