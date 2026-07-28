@ui @demowebshop @regression
Feature: Demo Web Shop public regression suite

  # Home page (4)
  Scenario: Home page displays the store welcome content
    Given I navigate to "/"
    Then "Home.welcomeMessage" should be visible

  Scenario: Home page exposes registration
    Given I navigate to "/"
    Then "Home.registerLink" should be visible

  Scenario: Home page exposes login
    Given I navigate to "/"
    Then "Home.loginLink" should be visible

  Scenario: Customer can search from the home page
    Given I navigate to "/"
    When I fill "Home.searchBox" with "computer"
    And I click "Home.searchButton"
    Then the URL should contain "/search"

  # Login page (4)
  Scenario: Login page loads
    Given I navigate to "/login"
    Then "Login.pageTitle" should be visible

  Scenario: Login page displays the email field
    Given I navigate to "/login"
    Then "Login.email" should be visible

  Scenario: Login page displays the password field
    Given I navigate to "/login"
    Then "Login.password" should be visible

  Scenario: Login page displays the remember-me option
    Given I navigate to "/login"
    Then "Login.rememberMe" should be visible

  # Registration page (4)
  Scenario: Registration page loads
    Given I navigate to "/register"
    Then "Registration.pageTitle" should be visible

  Scenario: Registration page displays gender choices
    Given I navigate to "/register"
    Then "Registration.maleGender" should be visible

  Scenario: Registration page displays personal-detail fields
    Given I navigate to "/register"
    Then "Registration.firstName" should be visible
    And "Registration.lastName" should be visible
    And "Registration.email" should be visible

  Scenario: Registration page displays password fields and submit button
    Given I navigate to "/register"
    Then "Registration.password" should be visible
    And "Registration.confirmPassword" should be visible
    And "Registration.submit" should be visible

  # Books catalog page (4)
  Scenario: Books catalog loads
    Given I navigate to "/books"
    Then "Books.pageTitle" should be visible

  Scenario: Books catalog displays products
    Given I navigate to "/books"
    Then "Books.productGrid" should be visible

  Scenario: Books catalog exposes a featured book
    Given I navigate to "/books"
    Then "Books.computingAndInternet" should be visible

  Scenario: Books catalog exposes sorting and page-size controls
    Given I navigate to "/books"
    Then "Books.sortBy" should be visible
    And "Books.pageSize" should be visible

  # Cart page (4)
  Scenario: Header cart link opens the shopping cart
    Given I navigate to "/"
    When I click "Home.cartLink"
    Then the URL should contain "/cart"

  Scenario: Shopping cart page loads
    Given I navigate to "/cart"
    Then "Cart.pageTitle" should be visible

  Scenario: New customer sees an empty cart message
    Given I navigate to "/cart"
    Then "Cart.emptyCartMessage" should be visible

  Scenario: Checkout is unavailable when the cart is empty
    Given I navigate to "/cart"
    Then "Cart.checkoutButton" should be hidden
