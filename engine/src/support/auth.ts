import { existsSync } from "node:fs";
import { config, requiredEnv, roleConfig } from "./config.js";
import { createScenarioContext, workerAuthStatePath } from "./browser-runtime.js";
import { resolveLocator } from "./locator-registry.js";
import type { TestWorld } from "./world.js";

export async function authenticateUi(world: TestWorld, role: string): Promise<void> {
  const roleSettings = roleConfig(role);
  const username = requiredEnv(roleSettings.usernameEnv, `${role} UI username`);
  const password = requiredEnv(roleSettings.passwordEnv, `${role} UI password`);
  await world.page.goto(config.auth.ui.loginPath);
  await resolveLocator(world.page, config.auth.ui.usernameLocator).fill(username);
  await resolveLocator(world.page, config.auth.ui.passwordLocator).fill(password);
  await resolveLocator(world.page, config.auth.ui.submitLocator).click();
  if (config.auth.ui.authenticatedLocator) await resolveLocator(world.page, config.auth.ui.authenticatedLocator).waitFor();
  await world.context.storageState({ path: workerAuthStatePath(role) });
  world.activeRole = role;
}

export async function reuseOrAuthenticateUi(world: TestWorld, role: string): Promise<void> {
  const stateFile = workerAuthStatePath(role);
  if (!existsSync(stateFile)) return authenticateUi(world, role);
  const bootstrapVideo = world.page.video();
  if (config.browser.trace !== "off") await world.context.tracing.stop();
  await world.context.close();
  // The first context is intentionally discarded: it has no authenticated storage state.
  if (bootstrapVideo) {
    const { rm } = await import("node:fs/promises");
    await rm(await bootstrapVideo.path(), { force: true });
  }
  world.context = await createScenarioContext(world.browser, stateFile);
  world.page = await world.context.newPage();
  world.page.setDefaultTimeout(config.browser.timeoutMs);
  world.activeRole = role;
}

export function applyApiAuthentication(world: TestWorld, role: string): void {
  const settings = roleConfig(role);
  if (settings.bearerTokenEnv && process.env[settings.bearerTokenEnv]) {
    world.requestHeaders.Authorization = `Bearer ${process.env[settings.bearerTokenEnv]}`;
  }
  if (settings.apiKeyEnv && process.env[settings.apiKeyEnv]) {
    world.requestHeaders["x-api-key"] = process.env[settings.apiKeyEnv]!;
  }
  if (!world.requestHeaders.Authorization && !world.requestHeaders["x-api-key"]) {
    throw new Error(`No API token or key is configured for role "${role}".`);
  }
  world.activeRole = role;
}
