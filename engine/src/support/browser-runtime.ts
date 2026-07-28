import type { Browser, BrowserContext } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "./config.js";

export const workerId = process.env.CUCUMBER_WORKER_ID ?? String(process.pid);

export function workerResultsDirectory(): string {
  const directory = resolve(process.cwd(), "test-results", `worker-${workerId}`);
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function workerAuthStatePath(role: string): string {
  const directory = resolve(process.cwd(), ".auth", `worker-${workerId}`);
  mkdirSync(directory, { recursive: true });
  return join(directory, `${role}.json`);
}

export async function createScenarioContext(browser: Browser, storageState?: string): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL: config.baseUrl,
    storageState,
    recordVideo: config.browser.video === "off"
      ? undefined
      : { dir: join(workerResultsDirectory(), "videos") }
  });
  if (config.browser.trace !== "off") {
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  }
  return context;
}
