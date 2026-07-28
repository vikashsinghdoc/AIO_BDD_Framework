@ui @demowebshop @smoke
Feature: Product search

  Scenario: Search for a product
    Given I navigate to "/"
    When I fill "Home.searchBox" with "computer"
    And I click "Home.searchButton"
    Then the URL should contain "/search"
