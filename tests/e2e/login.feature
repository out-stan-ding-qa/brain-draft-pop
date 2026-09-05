@login @mode:default
Feature: BrainPOP authentication
  Validate signing in, rejection of bad or incomplete credentials, and ending the session.

  Background:
    Given I am on the BrainPOP login page

  @smoke
  Scenario: Successful login with valid credentials
    When I log in with valid credentials
    Then I should be logged in successfully

  @negative
  Scenario Outline: Login is rejected for invalid credentials
    When I log in with a "<userKind>" username and a "<passKind>" password
    Then login should be rejected

    Examples:
      | userKind | passKind |
      | invalid  | valid    |
      | valid    | invalid  |
      | invalid  | invalid  |

  @negative
  Scenario Outline: Login is blocked when required credentials are missing
    When I log in with a "<userKind>" username and a "<passKind>" password
    Then required credentials should not be accepted

    Examples:
      | userKind | passKind |
      | blank    | blank    |
      | valid    | blank    |
      | blank    | valid    |

  @smoke @logout
  Scenario: Logging out ends the authenticated session
    When I log in with valid credentials
    Then I should be logged in successfully
    When I log out
    Then the authenticated session should have ended
    When I reload the page
    Then the authenticated session should have ended

  Scenario: Forgot credentials help is available
    Then the forgot credentials link should be visible
