# Onboarding agents

This framework ships with four purpose-built Copilot agents instead of one monolithic
onboarding tool — each does one job, proposes changes as a reviewable diff, and never commits
or pushes on its own. Run them in this order:

1. **`onboarding`** — start here. Wires this framework to your org's actual infrastructure:
   package registry/proxy, database engine, and auth (API + UI). Tracks progress in
   `.onboarding/manifest.json`, rendered as a human-readable checklist at
   `.onboarding/STATUS.md`. Can also pull defaults from an already-onboarded reference project
   elsewhere in the org instead of interviewing from scratch.
2. **`framework-contract`** — run after `onboarding`, and again any time
   `engine/src/steps/**` or the locator conventions change. Regenerates
   `docs/TEST_AUTHORING_CONTRACT.md`, a canonical description of this framework's Gherkin step
   vocabulary and locator conventions, sourced from the real code rather than hand-written.
   Anything that needs to write valid tests for this framework — a test-writing agent living in
   another repo, a new contributor — should read this doc instead of reverse-engineering the
   code.
3. **`testcase-onboarding`** — converts one `graphite-observer-suite` YAML testcase at a time
   into a Cucumber `.feature` file plus locator entries. Scoped to graphite specifically, not a
   generic "migrate from any framework" tool.
4. **`utility-porting`** — ports one named helper, wait function, or custom step from another
   project in the org into this framework's conventions (`engine/src/support/`,
   `engine/src/steps/`). Checks `docs/TEST_AUTHORING_CONTRACT.md` first so it doesn't duplicate
   something that already exists here.

All four share the same rules:

- Never run `git commit`, `git push`, or open a PR — every change is a proposed diff for a
  human to review, even if asked to do otherwise mid-session.
- Never write a literal secret — connection strings, tokens, and client IDs go in as
  environment-variable references.
- Process one thing at a time (one domain, one testcase, one utility) rather than bulk-applying
  changes across an entire codebase in one pass.

Once `onboarding` has run at least once, check `.onboarding/STATUS.md` for what's already done
and what's left — don't re-derive it by reading all four agent files from scratch.
