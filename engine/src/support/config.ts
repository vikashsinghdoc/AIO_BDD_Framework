import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import type { FrameworkConfig, RoleConfig } from "./types.js";

const interpolateEnvironment = (value: string): string =>
  value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key: string) => process.env[key] ?? "");

const expand = (value: unknown): unknown => {
  if (typeof value === "string") return interpolateEnvironment(value);
  if (Array.isArray(value)) return value.map(expand);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, expand(item)]));
  }
  return value;
};

const path = resolve(process.cwd(), process.env.FRAMEWORK_CONFIG ?? "config/framework.yaml");
const loadedConfig = expand(parse(readFileSync(path, "utf8"))) as FrameworkConfig;

const rawBrowserName = (loadedConfig.browser.name as unknown as string | undefined)?.trim();
const allowedBrowsers = ["chromium", "firefox", "webkit"] as const;
loadedConfig.browser.name = (allowedBrowsers as readonly string[]).includes(rawBrowserName ?? "")
  ? (rawBrowserName as (typeof allowedBrowsers)[number])
  : "chromium";

const rawHeadless = loadedConfig.browser.headless as unknown;

if (typeof rawHeadless === "string") {
  const value = rawHeadless.trim().toLowerCase();
  if (value !== "true" && value !== "false") {
    throw new Error("HEADLESS must be either true or false.");
  }
  loadedConfig.browser.headless = value === "true";
}

function normalizeArtifactSetting<T extends string>(
  value: unknown,
  fallback: T,
  allowed: readonly T[],
  variableName: string
): T {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() || fallback : fallback;
  if (!allowed.includes(normalized as T)) {
    throw new Error(`${variableName} must be one of: ${allowed.join(", ")}.`);
  }
  return normalized as T;
}

loadedConfig.browser.screenshot = normalizeArtifactSetting(
  loadedConfig.browser.screenshot,
  "only-on-failure",
  ["off", "on", "only-on-failure"],
  "SCREENSHOT"
);
loadedConfig.browser.video = normalizeArtifactSetting(
  loadedConfig.browser.video,
  "off",
  ["off", "on", "retain-on-failure"],
  "VIDEO"
);
loadedConfig.browser.trace = normalizeArtifactSetting(
  loadedConfig.browser.trace,
  "off",
  ["off", "on", "retain-on-failure"],
  "TRACE"
);

export const config = loadedConfig;

export function roleConfig(role: string): RoleConfig {
  const found = config.auth.roles[role];
  if (!found) throw new Error(`Unknown role "${role}". Add it under auth.roles in config/framework.yaml.`);
  return found;
}

export function requiredEnv(name: string | undefined, purpose: string): string {
  if (!name) throw new Error(`No environment variable is configured for ${purpose}.`);
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name} for ${purpose}.`);
  return value;
}
