@ui
Feature: Generic UI DSL example

  Scenario: Sign in using the configured admin role
    Given I navigate to "/login"
    When I fill "Login.email" with "${admin.email}"
    And I fill "Login.password" with "${admin.password}"
    And I click "Login.submit"
    Then "Common.userMenu" should be visible
