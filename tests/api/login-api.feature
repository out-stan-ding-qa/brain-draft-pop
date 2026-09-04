@api @mode:default
Feature: BrainPOP login API
  Direct checks against the authentication endpoint the login page posts to.
  Scenarios run sequentially because the endpoint throttles bursts of attempts.

  @smoke
  Scenario: Valid credentials return an authenticated session
    When I submit a login request to the API with valid credentials
    Then the API login should succeed for the QA account
    And the login UI should still be available

  @negative
  Scenario Outline: The API rejects invalid or incomplete credentials
    When I submit a login request to the API with a "<userKind>" username and a "<passKind>" password
    Then the API login should be rejected

    Examples:
      | userKind | passKind |
      | invalid  | valid    |
      | valid    | invalid  |
      | valid    | blank    |
      | blank    | blank    |
