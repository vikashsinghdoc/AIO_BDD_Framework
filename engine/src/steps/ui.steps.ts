import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveLocator } from "../support/locator-registry.js";
import { config } from "../support/config.js";
import { createScenarioContext } from "../support/browser-runtime.js";
import { authenticateUi, reuseOrAuthenticateUi } from "../support/auth.js";
import { interpolate } from "../support/variables.js";
import { runLoggedStep, runLoggedAssertion } from "../support/logger.js";
import type { TestWorld } from "../support/world.js";

Given("I navigate to {string}", async function (this: TestWorld, path: string) { await runLoggedStep(this, `Navigate to ${path}`, () => this.page.goto(interpolate(this, path))); });
Given("I am authenticated as {string}", async function (this: TestWorld, role: string) { await runLoggedStep(this, `Reuse UI authentication as ${role}`, () => reuseOrAuthenticateUi(this, role)); });
Given("I sign in as {string}", async function (this: TestWorld, role: string) { await runLoggedStep(this, `Sign in as ${role}`, () => authenticateUi(this, role)); });
When("I click {string}", async function (this: TestWorld, alias: string) { await runLoggedStep(this, `Click ${alias}`, () => resolveLocator(this.page, alias).click()); });
When("I dismiss a modal using {string}", async function (this: TestWorld, alias: string) { await runLoggedStep(this, `Dismiss modal using ${alias}`, () => resolveLocator(this.page, alias).click()); });
When("I fill {string} with {string}", async function (this: TestWorld, alias: string, value: string) { await runLoggedStep(this, `Fill ${alias}`, () => resolveLocator(this.page, alias).fill(interpolate(this, value))); });
When("I select {string} in {string}", async function (this: TestWorld, value: string, alias: string) { await runLoggedStep(this, `Select option in ${alias}`, () => resolveLocator(this.page, alias).selectOption(interpolate(this, value))); });
When("I upload {string} to {string}", async function (this: TestWorld, file: string, alias: string) { await runLoggedStep(this, `Upload file to ${alias}`, () => resolveLocator(this.page, alias).setInputFiles(file)); });
When("I press {string} on {string}", async function (this: TestWorld, key: string, alias: string) { await runLoggedStep(this, `Press ${key} on ${alias}`, () => resolveLocator(this.page, alias).press(key)); });
When("I wait for {string}", async function (this: TestWorld, alias: string) { await runLoggedStep(this, `Wait for ${alias}`, () => resolveLocator(this.page, alias).waitFor()); });
When("I wait for {string} to be {string}", async function (this: TestWorld, alias: string, state: string) {
  if (state !== "attached" && state !== "detached" && state !== "visible" && state !== "hidden") {
    throw new Error(`Unsupported wait state "${state}" — expected attached, detached, visible, or hidden.`);
  }
  await runLoggedStep(this, `Wait for ${alias} to be ${state}`, () => resolveLocator(this.page, alias).waitFor({ state }));
});
When("I hover over {string}", async function (this: TestWorld, alias: string) { await runLoggedStep(this, `Hover over ${alias}`, () => resolveLocator(this.page, alias).hover()); });
When("I double-click {string}", async function (this: TestWorld, alias: string) { await runLoggedStep(this, `Double-click ${alias}`, () => resolveLocator(this.page, alias).dblclick()); });
When("I go back", async function (this: TestWorld) { await runLoggedStep(this, "Go back", () => this.page.goBack()); });
When("I clear cookies", async function (this: TestWorld) { await runLoggedStep(this, "Clear cookies", () => this.context.clearCookies()); });
When("I take a screenshot", async function (this: TestWorld) {
  await runLoggedStep(this, "Take a screenshot", async () => {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, "image/png");
  });
});
When("I store the text of {string} as {string}", async function (this: TestWorld, alias: string, variable: string) {
  await runLoggedStep(this, `Store text of ${alias} as ${variable}`, async () => {
    this.variables.set(variable, (await resolveLocator(this.page, alias).textContent())?.trim() ?? "");
  });
});
When("I generate a UUID as {string}", async function (this: TestWorld, variable: string) {
  await runLoggedStep(this, `Generate a UUID as ${variable}`, () => { this.variables.set(variable, randomUUID()); });
});
When("I load file {string} as {string}", async function (this: TestWorld, path: string, variable: string) {
  await runLoggedStep(this, `Load file ${path} as ${variable}`, () => {
    this.variables.set(variable, readFileSync(resolve(process.cwd(), path), "utf8"));
  });
});
Then("{string} should be visible", async function (this: TestWorld, alias: string) { await runLoggedAssertion(this, `Assert ${alias} is visible`, () => expect(resolveLocator(this.page, alias)).toBeVisible()); });
Then("{string} should be hidden", async function (this: TestWorld, alias: string) { await runLoggedAssertion(this, `Assert ${alias} is hidden`, () => expect(resolveLocator(this.page, alias)).toBeHidden()); });
Then("{string} should have text {string}", async function (this: TestWorld, alias: string, text: string) { await runLoggedAssertion(this, `Assert ${alias} has expected text`, () => expect(resolveLocator(this.page, alias)).toHaveText(interpolate(this, text))); });
Then("{string} should have value {string}", async function (this: TestWorld, alias: string, value: string) { await runLoggedAssertion(this, `Assert ${alias} has expected value`, () => expect(resolveLocator(this.page, alias)).toHaveValue(interpolate(this, value))); });
Then("{string} should be enabled", async function (this: TestWorld, alias: string) { await runLoggedAssertion(this, `Assert ${alias} is enabled`, () => expect(resolveLocator(this.page, alias)).toBeEnabled()); });
Then("{string} should be disabled", async function (this: TestWorld, alias: string) { await runLoggedAssertion(this, `Assert ${alias} is disabled`, () => expect(resolveLocator(this.page, alias)).toBeDisabled()); });
Then("the URL should contain {string}", async function (this: TestWorld, value: string) { await runLoggedAssertion(this, `Assert URL contains ${value}`, () => expect(this.page).toHaveURL(new RegExp(interpolate(this, value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))); });
Then("{string} should have count {int}", async function (this: TestWorld, alias: string, count: number) { await runLoggedAssertion(this, `Assert ${alias} has count ${count}`, () => expect(resolveLocator(this.page, alias)).toHaveCount(count)); });
Then("{string} should not contain {string}", async function (this: TestWorld, alias: string, text: string) { await runLoggedAssertion(this, `Assert ${alias} does not contain expected text`, () => expect(resolveLocator(this.page, alias)).not.toContainText(interpolate(this, text))); });
Then("the numeric value of {string} should have changed by {int} from {string}", async function (this: TestWorld, alias: string, delta: number, variable: string) {
  await runLoggedAssertion(this, `Assert ${alias} changed by ${delta} from stored ${variable}`, async () => {
    const before = Number(this.variables.get(variable));
    const afterText = (await resolveLocator(this.page, alias).textContent()) ?? "";
    const after = Number(afterText.replace(/[^0-9.-]/g, ""));
    expect(after - before, `Expected ${alias} to change by ${delta} but changed by ${after - before}`).toBe(delta);
  });
});
Then("{string} should not have duplicate values", async function (this: TestWorld, alias: string) {
  await runLoggedAssertion(this, `Assert ${alias} has no duplicate values`, async () => {
    const values = (await resolveLocator(this.page, alias).allTextContents()).map((v) => v.trim()).filter(Boolean);
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) duplicates.add(value); else seen.add(value);
    }
    expect(Array.from(duplicates), `Duplicate values found: ${Array.from(duplicates).join(", ")}`).toEqual([]);
  });
});

// openContext/useContext/closeContext — additional named browser contexts alongside
// the one scenario context hooks.ts already creates. this.context/this.page always
// point at whichever context is currently active; every other step already reads
// those two fields directly, so switching never requires touching them.
When("I open a new browser context as {string}", async function (this: TestWorld, name: string) {
  await runLoggedStep(this, `Open new browser context as ${name}`, async () => {
    const context = await createScenarioContext(this.browser);
    const page = await context.newPage();
    page.setDefaultTimeout(config.browser.timeoutMs);
    this.namedContexts.set(name, { context, page });
  });
});
When("I use context {string}", async function (this: TestWorld, name: string) {
  await runLoggedStep(this, `Switch to context ${name}`, () => {
    if (!this.defaultContext) this.defaultContext = { context: this.context, page: this.page };
    const target = name === "default" ? this.defaultContext : this.namedContexts.get(name);
    if (!target) throw new Error(`Context "${name}" was not found — open it first with "I open a new browser context as ...".`);
    this.context = target.context;
    this.page = target.page;
  });
});
When("I close context {string}", async function (this: TestWorld, name: string) {
  await runLoggedStep(this, `Close context ${name}`, async () => {
    const target = this.namedContexts.get(name);
    if (!target) throw new Error(`Context "${name}" was not found.`);
    if (config.browser.trace !== "off") await target.context.tracing.stop();
    await target.context.close();
    this.namedContexts.delete(name);
    if (this.page === target.page && this.defaultContext) {
      this.context = this.defaultContext.context;
      this.page = this.defaultContext.page;
    }
  });
});

When("I click {string} and expect a download", async function (this: TestWorld, alias: string) {
  await runLoggedStep(this, `Click ${alias} and expect a download`, async () => {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      resolveLocator(this.page, alias).click()
    ]);
    this.variables.set("lastDownload", download.suggestedFilename());
  });
});

When("I wait for any of:", async function (this: TestWorld, table: DataTable) {
  const aliases = table.raw().map((row) => row[0]);
  await runLoggedStep(this, `Wait for any of ${aliases.join(", ")}`, () =>
    Promise.race(aliases.map((alias) => resolveLocator(this.page, alias).waitFor()))
  );
});

When("I wait for the text of {string} to change from {string}", async function (this: TestWorld, alias: string, variable: string) {
  await runLoggedStep(this, `Wait for text of ${alias} to change from stored ${variable}`, async () => {
    const previous = String(this.variables.get(variable) ?? "");
    await expect.poll(async () => (await resolveLocator(this.page, alias).textContent()) ?? "").not.toBe(previous);
  });
});

When("I retry up to {int} times widening {string} and clicking {string} until {string} is visible", async function (this: TestWorld, retries: number, dateFieldAlias: string, searchButtonAlias: string, targetAlias: string) {
  await runLoggedStep(this, `Retry up to ${retries} times widening ${dateFieldAlias} until ${targetAlias} is visible`, async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await resolveLocator(this.page, targetAlias).waitFor({ timeout: 3000 });
        return;
      } catch (error) {
        lastError = error;
        if (attempt === retries) break;
        const daysBack = (attempt + 1) * 5;
        const date = new Date();
        date.setDate(date.getDate() - daysBack);
        await resolveLocator(this.page, dateFieldAlias).fill(date.toISOString().slice(0, 10));
        await resolveLocator(this.page, searchButtonAlias).click();
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  });
});

// skipIfText/stopIfNotFound: returning the literal string "pending" from a step
// function is a real @cucumber/cucumber convention (step_runner.js) that marks the
// step PENDING rather than PASSED/FAILED — Cucumber's own runner already treats any
// non-PASSED status as a reason to skip the scenario's remaining steps, so this stops
// the scenario cleanly without a hard failure, unlike throwing.
When("I skip the remaining steps if {string} contains {string}", async function (this: TestWorld, alias: string, text: string) {
  return runLoggedStep(this, `Check whether to skip remaining steps based on ${alias}`, async () => {
    const content = (await resolveLocator(this.page, alias).textContent()) ?? "";
    return content.includes(interpolate(this, text)) ? "pending" : undefined;
  });
});
When("I stop the scenario if {string} is not found", async function (this: TestWorld, alias: string) {
  return runLoggedStep(this, `Check whether ${alias} exists before continuing`, async () => {
    const count = await resolveLocator(this.page, alias).count();
    return count === 0 ? "pending" : undefined;
  });
});
