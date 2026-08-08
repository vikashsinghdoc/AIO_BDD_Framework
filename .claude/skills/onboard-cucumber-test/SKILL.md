---
name: onboard-cucumber-test
description: Convert one graphite-observer-suite YAML testcase into a draft Cucumber .feature file + locator YAML additions for this engine. Produces a review draft only — never writes files without explicit user confirmation.
---

# Onboard a graphite-observer-suite testcase to Cucumber

This skill converts **one** `graphite-observer-suite` YAML testcase (the org's existing
YAML/Playwright framework, documented in this repo's session history — see `CLAUDE.md`'s
"reusable DSL" note under Test Engine) into a draft Cucumber `.feature` file plus any new
locator YAML entries needed, written against **this repo's own DSL** (`engine/src/steps/
*.steps.ts`, `engine/config/locators/*.yaml`) — not a generic Cucumber conversion.

**This is a manual, human-reviewed migration aid, not an automated translator.** It never
writes to `engine/features/**` or `engine/config/locators/**` on its own — it produces a
draft in the chat, and only writes files if the user explicitly confirms afterward. This
mirrors the project's own standing rule (`CLAUDE.md` → Safety Rules for Automated
Changes: "Never write directly to `config/locators/*.yaml`, `.feature` files, or step
definitions... without human review") and the user's own explicit instruction that this
migration happens manually, testcase by testcase, not via an automated runner.

## Input this skill needs

Since `graphite-observer-ai` lives on a different machine with no direct file access from
here, the user supplies:

1. **The testcase YAML itself** — pasted inline, or a file path if they've copied it into
   this repo (e.g. a scratch/staging folder).
2. **The relevant entries from `testcases/common/selectors.yml`** for every `${category.
   element}` key the testcase references — without the underlying CSS/role/testId/etc.,
   a locator can only be stubbed as a `TODO`, not written correctly. If the user hasn't
   provided these, ask for them before drafting locators (don't guess a selector).
3. Optionally, **the content of any `include:`d file** other than `_login` (which this
   skill already knows how to handle — see below). Without it, list the include under
   "Needs manual decision" rather than guessing what it does.

If given only a testcase with no selector detail, still produce the `.feature` file (step
translation doesn't need selector *values*, only alias *names*) and list every locator as
pending detail, rather than blocking entirely.

## Process

1. **Parse the YAML**: `name`, `tags`, `defaults`, `steps` (each `{action, ...params}` or
   `{include: name}`).
2. **Translate each step**, in order:
   - `{include: "_login"}` → `Given I sign in as "<role>"`. This engine already has a
     native cached-login mechanism (`auth.ts`) — don't replicate graphite's raw navigate/
     fill/click login sequence. Infer `<role>` from `defaults`/context; ask if ambiguous.
   - `{include: "<other>"}` → **do not guess**. List under "Needs manual decision" with
     the include name and a note: decide whether it becomes a Cucumber `Background:`
     (if truly shared scenario setup) or gets expanded inline (if testcase-specific) —
     that's a per-case judgment call for the user, not something to infer blindly.
   - `{action: "<verb>", ...}` in the mapping table below → emit the matching step line.
   - `{action: "<verb>", ...}` **not** in the table → list under "Needs manual decision"
     with the verb and its params verbatim. Never invent a step for an unsupported verb.
3. **Translate selectors**: graphite's `${category.element}` → this engine's locator
   alias `"Category.element"` (capitalize the category to match this repo's `PageName.
   yaml` file-naming convention; keep the element name as-is). For each distinct alias
   referenced:
   - Check whether `engine/config/locators/<Category>.yaml` already defines that element
     (read the actual file — don't assume). If it does, reuse it as-is, no new entry.
   - If it doesn't, and the user supplied the corresponding `selectors.yml` entry, draft
     a new locator definition mapping graphite's strategy onto this engine's supported
     ones (`testId`/`role`/`label`/`text`/`placeholder`/`css`/`xpath` — see
     `locator-registry.ts`), and list it as a **proposed addition** to that file.
   - If no selector detail was supplied, list it as `TODO — selector detail needed`.
4. **Translate value interpolation**: graphite's `${var}` for non-selector values maps
   directly to this engine's own `${var}` syntax (`variables.ts` — same `${...}` pattern)
   **only if** one of these is true: it's a role credential (`${role.username}` /
   `${role.password}`, handled identically in both frameworks), or an earlier step in the
   *same* scenario already produces that variable (`storeText`/`generateUuid`/`save
   response JSON`/`fetch an OAuth2 token`). If the value instead comes from graphite's
   `defaults:` block or `global-values.yml` with no equivalent producer in this engine,
   flag it — the user needs to either inline a literal value or add an explicit step that
   produces it, since this engine has no global-defaults-merge equivalent to graphite's.
5. **Assemble the `.feature` file**: tags line (`@ui`/`@api`/whatever graphite's `tags:`
   map to), `Feature:` (ask for a name if none is obvious from context), `Scenario:`
   using the testcase's `name`, then the translated steps in original order.
6. **Present the draft** — do not write anything yet:
   - The full proposed `.feature` file content and a suggested path under
     `engine/features/<suite>/` (mirror graphite's own suite folder — `swift`,
     `reconciliation`, `gc2` — as a starting guess, not a rule).
   - Any proposed new locator YAML entries, grouped by target file.
   - A separate, clearly-labeled **"Needs manual decision"** list: unsupported actions,
     ambiguous includes, missing selector detail, missing variable sources.
7. **Only write files once the user confirms** — then use `Write`/`Edit` on the actual
   paths, and mention that `npm run typecheck` (no new TS here, but worth a sanity build)
   and an actual `npm test -- --dry-run` or single-scenario run against the target
   environment is how to validate it before treating the onboarding as done — see
   `CLAUDE.md`'s Validation and Testing section.

## Action → step mapping

Verbs already covered by this engine's existing DSL (`engine/src/steps/ui.steps.ts`,
`api.steps.ts`) — use the **exact** Gherkin phrasing below, not a paraphrase:

| graphite `action:` | Cucumber step |
|---|---|
| `navigate` | `Given I navigate to "<path>"` |
| `click` | `When I click "<Alias>"` |
| `fill` | `When I fill "<Alias>" with "<value>"` |
| `select` | `When I select "<value>" in "<Alias>"` |
| `press` | `When I press "<key>" on "<Alias>"` |
| `hover` | `When I hover over "<Alias>"` |
| `dblclick` | `When I double-click "<Alias>"` |
| `goBack` | `When I go back` |
| `clearCookies` | `When I clear cookies` |
| `screenshot` | `When I take a screenshot` |
| `storeText` | `When I store the text of "<Alias>" as "<var>"` |
| `generateUuid` | `When I generate a UUID as "<var>"` |
| `loadFile` | `When I load file "<path>" as "<var>"` |
| `waitForSelector` | `When I wait for "<Alias>" to be "<attached\|detached\|visible\|hidden>"` |
| `waitForAny` | `When I wait for any of:` + a DataTable, one alias per row |
| `waitForTextChange` | `When I wait for the text of "<Alias>" to change from "<var>"` |
| `openContext` | `When I open a new browser context as "<name>"` |
| `useContext` | `When I use context "<name>"` |
| `closeContext` | `When I close context "<name>"` |
| `clickAndDownload` | `When I click "<Alias>" and expect a download` |
| `retryWithDateRange` | `When I retry up to <N> times widening "<DateFieldAlias>" and clicking "<SearchButtonAlias>" until "<TargetAlias>" is visible` |
| `skipIfText` | `When I skip the remaining steps if "<Alias>" contains "<text>"` |
| `stopIfNotFound` | `When I stop the scenario if "<Alias>" is not found` |
| `httpPost` / `httpGet` | `When I send a "<METHOD>" request to "<path>"` (add ` with body "<fixture>"` if there's a body) |
| `oauth2Token` | `Given I fetch an OAuth2 token as "<var>":` + a DataTable with `tokenUrl`/`clientId`/`clientSecret`/`grantType` rows |
| `assertVisible` | `Then "<Alias>" should be visible` |
| `assertHidden` / `assertNotVisible` | `Then "<Alias>" should be hidden` |
| `assertText` | `Then "<Alias>" should have text "<text>"` |
| `assertNotContains` | `Then "<Alias>" should not contain "<text>"` |
| `assertDelta` | `Then the numeric value of "<Alias>" should have changed by <delta> from "<var>"` |
| `assertNoDuplicateColumnValues` | `Then "<Alias>" should not have duplicate values` |

**Not yet supported — always list under "Needs manual decision", never invent a step**:
`dbQuery`, `dbPollUntil` (needs a real Oracle client/instance — see `CLAUDE.md`
Architectural Decisions, deliberately deferred), `clickRowsByStatus` (bulk row-click by
status column — no equivalent built yet), `setDateRange` on its own outside of
`retryWithDateRange` (may map to two plain `fill` steps if it's really just two date
fields — confirm with the user rather than assuming), and any `include:` other than
`_login`.

## Worked example

Given a graphite step:
```yaml
- action: fill
  selector: "${login.usernameInput}"
  value: "${username}"
```
→
```gherkin
When I fill "Login.usernameInput" with "${username}"
```
(assuming `Login.usernameInput` already exists in `engine/config/locators/Login.yaml`,
or gets proposed as a new entry there if not — and `${username}` only survives untouched
if something earlier in the scenario actually produces a `username` variable; otherwise
flag it.)

## Reminders

- Soft-assert is already the default for every `Then` step in this engine (see
  `CLAUDE.md` → Architectural Decisions → "Soft-assert execution model") — no special
  handling needed to match graphite's own soft-assert behavior; it's automatic here.
- Process one testcase at a time. Don't try to batch-convert the full 87 in one pass —
  the DB-heavy suites (`swift`, `reconciliation`) will mostly land in "Needs manual
  decision" until `dbQuery`/`dbPollUntil` are actually built.
- If asked to also update `scriptor.md` (the Copilot agent prompt) as part of this
  work — that's explicitly a separate, later task per prior discussion, not part of this
  skill.
