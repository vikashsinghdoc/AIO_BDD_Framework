import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, firefox, webkit, request } from "@playwright/test";
import type { Browser } from "@playwright/test";
import { rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { createScenarioContext, workerId, workerResultsDirectory } from "./browser-runtime.js";
import { config } from "./config.js";
import { writeLog } from "./logger.js";
import type { TestWorld } from "./world.js";

const browsers = { chromium, firefox, webkit };
let browser: Browser | undefined;
let scenarioSequence = 0;

setDefaultTimeout(config.browser.timeoutMs);

function artifactSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed";
}

BeforeAll(async () => {
  browser = await browsers[config.browser.name].launch({ headless: config.browser.headless });
});

Before(async function (this: TestWorld, scenario) {
  if (!browser) throw new Error("Playwright browser did not start for this Cucumber worker.");
  this.browser = browser;
  this.context = await createScenarioContext(browser);
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(config.browser.timeoutMs);
  this.api = await request.newContext({ baseURL: config.apiBaseUrl });
  this.scenarioName = scenario.pickle.name;
  this.variables.set("scenario", scenario.pickle.name);
  writeLog("info", this.scenarioName, "Scenario setup completed");
});

After(async function (this: TestWorld, scenario) {
  const failed = scenario.result?.status === Status.FAILED;
  const featureName = scenario.gherkinDocument.feature?.name ?? "feature";
  const artifactStem = `${artifactSlug(featureName)}--${artifactSlug(scenario.pickle.name)}--worker-${workerId}--run-${++scenarioSequence}`;
  const page = this.page;
  const context = this.context;
  const api = this.api;
  const video = page?.video();
  writeLog(failed ? "error" : "info", scenario.pickle.name, `Scenario finished: ${failed ? "FAILED" : "PASSED"}`);

  try {
    const shouldCaptureScreenshot = config.browser.screenshot === "on"
      || (failed && config.browser.screenshot === "only-on-failure");
    if (page && shouldCaptureScreenshot) {
      const screenshot = await page.screenshot({
        path: join(workerResultsDirectory(), `${artifactStem}.png`),
        fullPage: true
      });
      await this.attach(screenshot, "image/png");
    }
  } finally {
    const shouldSaveTrace = config.browser.trace === "on"
      || (failed && config.browser.trace === "retain-on-failure");
    if (context && config.browser.trace !== "off") {
      await context.tracing.stop({
        path: shouldSaveTrace ? join(workerResultsDirectory(), `${artifactStem}.zip`) : undefined
      });
    }
    if (api) await api.dispose();
    if (context) await context.close();
    if (video) {
      const generatedPath = await video.path();
      const shouldKeepVideo = config.browser.video === "on"
        || (failed && config.browser.video === "retain-on-failure");
      if (shouldKeepVideo) {
        await rename(generatedPath, join(workerResultsDirectory(), "videos", `${artifactStem}.webm`));
      } else {
        await rm(generatedPath, { force: true });
      }
    }
  }
});

AfterAll(async () => {
  await browser?.close();
  browser = undefined;
});
