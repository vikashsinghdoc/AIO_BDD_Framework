@api
Feature: Generic API DSL example

  Scenario: Create an order with a named API role
    Given I use API authentication as "admin"
    When I send a "POST" request to "/orders" with body "fixtures/order.json"
    Then the response status should be 201
    And I save response JSON at "id" as "orderId"
