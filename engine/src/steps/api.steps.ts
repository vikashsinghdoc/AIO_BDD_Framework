import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyApiAuthentication } from "../support/auth.js";
import { interpolate, jsonPath } from "../support/variables.js";
import { runLoggedStep } from "../support/logger.js";
import type { TestWorld } from "../support/world.js";

Given("I use API authentication as {string}", async function (this: TestWorld, role: string) { await runLoggedStep(this, `Apply API authentication as ${role}`, () => applyApiAuthentication(this, role)); });
Given("I set API header {string} to {string}", async function (this: TestWorld, name: string, value: string) { await runLoggedStep(this, `Set API header ${name}`, () => { this.requestHeaders[name] = interpolate(this, value); }); });
Given("I set API query parameter {string} to {string}", async function (this: TestWorld, name: string, value: string) { await runLoggedStep(this, `Set API query parameter ${name}`, () => { this.requestQuery[name] = interpolate(this, value); }); });
When("I send a {string} request to {string}", async function (this: TestWorld, method: string, path: string) {
  await runLoggedStep(this, `Send ${method} request to ${path}`, async () => {
    this.response = await this.api.fetch(interpolate(this, path), { method, headers: this.requestHeaders, params: this.requestQuery });
  });
});
When("I send a {string} request to {string} with body {string}", async function (this: TestWorld, method: string, path: string, fixture: string) {
  await runLoggedStep(this, `Send ${method} request to ${path} using ${fixture}`, async () => {
    const body = JSON.parse(interpolate(this, readFileSync(resolve(process.cwd(), fixture), "utf8")));
    this.response = await this.api.fetch(interpolate(this, path), { method, headers: { "content-type": "application/json", ...this.requestHeaders }, params: this.requestQuery, data: body });
  });
});
Then("the response status should be {int}", async function (this: TestWorld, status: number) { await runLoggedStep(this, `Assert response status is ${status}`, () => { expect(this.response, "No API response exists.").toBeDefined(); expect(this.response!.status()).toBe(status); }); });
Then("the response JSON at {string} should equal {string}", async function (this: TestWorld, path: string, expected: string) {
  await runLoggedStep(this, `Assert response JSON at ${path}`, async () => {
    const actual = jsonPath(await this.response!.json(), path);
    expect(String(actual)).toBe(interpolate(this, expected));
  });
});
Then("I save response JSON at {string} as {string}", async function (this: TestWorld, path: string, variable: string) { await runLoggedStep(this, `Save response JSON at ${path} as ${variable}`, async () => { this.variables.set(variable, jsonPath(await this.response!.json(), path)); }); });
