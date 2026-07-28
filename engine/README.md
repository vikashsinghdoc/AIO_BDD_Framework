# Playwright + TypeScript + Cucumber reusable framework

Feature files use reusable UI and API steps. Add page-specific locator YAML files and write Gherkin; standard interactions do not need new step definitions.

## Start

```bash
cp .env.example .env
npm install
npx playwright install chromium
npm run typecheck
npm test
```

Set the URLs and named-role credentials/tokens in `.env`. Adapt `config/framework.yaml` to the application's login page and replace the example locator files under `config/locators`.

## Locator registry

Each `config/locators/Page.yaml` file becomes the `Page` part of an alias. For example, `Login.email` points to `config/locators/Login.yaml` → `email`. Supported strategies are `testId`, `role`, `label`, `text`, `placeholder`, `css`, and `xpath`. Prefer `testId`, role, and label locators for resilient tests.

## Authentication

- `Given I am authenticated as "admin"` signs in once through the configured UI and saves `.auth/admin.json`; later scenarios reuse that browser storage state.
- `Given I use API authentication as "admin"` adds the configured Bearer token and/or `x-api-key` header.
- Roles and the environment variables that supply their secrets live in `config/framework.yaml`; secrets stay in `.env` or CI secret storage.

## Common feature steps

```gherkin
Given I navigate to "/checkout"
When I fill "Checkout.quantity" with "2"
And I click "Checkout.submit"
Then "Checkout.confirmation" should have text "Order created"

Given I use API authentication as "admin"
And I set API header "x-correlation-id" to "run-123"
When I send a "GET" request to "/orders/${orderId}"
Then the response status should be 200
And the response JSON at "status" should equal "created"
```

Failure screenshots, videos, and Cucumber HTML/JSON reports are written to `test-results/` and `reports/`. The v1 reporter is intentionally simple; enhanced reporting can be added without changing feature files.

## Execution artifacts

Control artifacts in `.env` without changing framework code:

```env
SCREENSHOT=only-on-failure  # default; off | on | only-on-failure
VIDEO=off                   # default; off | on | retain-on-failure
TRACE=off                   # default; off | on | retain-on-failure
```

Screenshots, videos, and traces are isolated by Cucumber worker under `test-results/worker-*`.
Each retained artifact uses `feature--scenario--worker-N--run-N` so parallel-run files are easy to identify. Videos are stored in that worker's `videos/` directory.

## Parallel execution

The framework is parallel-safe: each Cucumber worker owns one browser, and every scenario receives its own browser context, page, API request client, storage state, trace, video directory, and failure-artifact name. This prevents scenario cookies and data from leaking into another test.

Set the number of workers in `.env`:

```env
PARALLEL_WORKERS=4
```

Or override it for one run:

```bash
npm test -- --parallel 4
```

Use `PARALLEL_WORKERS=1` while debugging headed tests. Authenticated browser state is intentionally cached per worker, so parallel workers never write the same `.auth` file.

## Logging

Each reusable UI/API step writes a start, pass/fail, and duration entry. Console output is colour-coded by worker and includes the worker and scenario names; each worker also writes structured JSON log events to `test-results/worker-*/logs/worker-*.log`.

The same two-line step log is attached while its Gherkin step is executing, so the built-in Cucumber HTML report displays it under that individual step. Input values, credentials, tokens, and API header values are deliberately omitted from logs.
