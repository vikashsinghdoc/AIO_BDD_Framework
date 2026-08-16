# Repository custom instructions

This is a Playwright + Cucumber BDD test-automation framework (`engine/`) with a Spring Boot
run-orchestration backend (`backend/`) and a React + Vite run-console UI (`frontend/`). See
`README.md` for the full architecture and `CLAUDE.md` for detailed architectural decisions.

## Safety rules for automated changes (apply in every session, not just named agents)

- Never write directly to `engine/features/**`, `engine/config/locators/**`, or
  `engine/src/steps/**` without proposing the change first and getting explicit human
  confirmation — even inside an otherwise autonomous task.
- Never run `git commit`, `git push`, or open a PR unless explicitly asked to do exactly that in
  the current request. Reviewing a diff is not the same as authorizing a commit.
- Never write a literal secret — connection string, API token, client ID/secret — into any file.
  Use environment-variable references (this repo's convention: `${VAR:default}`, see
  `backend/src/main/resources/application.yml`).

## Onboarding this framework to a new org

If the task involves adapting this framework to a different org's infrastructure, documenting
its test-authoring conventions, migrating existing tests into it, or porting a utility from
another project, don't improvise — four purpose-built agents already exist in
`.github/agents/` for exactly this, each scoped to one job:

- **`onboarding`** — package registry/proxy, database engine, auth (API + UI).
- **`framework-contract`** — regenerates `docs/TEST_AUTHORING_CONTRACT.md` from the real step/
  locator code; the canonical reference for what valid tests look like here.
- **`testcase-onboarding`** — converts one `graphite-observer-suite` YAML testcase at a time.
- **`utility-porting`** — ports one named helper/step from another project in the org.

Full detail and run order: `.github/agents/README.md`. Current progress on org onboarding
(what's already configured, what's left): `.onboarding/STATUS.md`, if it exists yet.
