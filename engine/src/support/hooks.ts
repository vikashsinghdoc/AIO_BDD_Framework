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
  const failed = scenario.result?.status === Status.FAILED || this.softFailures.length > 0;
  // PENDING/SKIPPED (e.g. "I skip the remaining steps if..."/"I stop the scenario if...")
  // are not failures, but the skip point is exactly where a screenshot is most useful —
  // "only-on-failure" should still capture it, distinct from `failed` which also drives
  // video/trace retention and the pass/fail log line below.
  const nonPassing = failed
    || scenario.result?.status === Status.PENDING
    || scenario.result?.status === Status.SKIPPED;
  const featureName = scenario.gherkinDocument.feature?.name ?? "feature";
  const artifactStem = `${artifactSlug(featureName)}--${artifactSlug(scenario.pickle.name)}--worker-${workerId}--run-${++scenarioSequence}`;
  const page = this.page;
  const context = this.context;
  const api = this.api;
  const video = page?.video();
  writeLog(failed ? "error" : "info", scenario.pickle.name, `Scenario finished: ${failed ? "FAILED" : "PASSED"}`);

  try {
    const shouldCaptureScreenshot = config.browser.screenshot === "on"
      || (nonPassing && config.browser.screenshot === "only-on-failure");
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

  // Safety net for openContext/useContext: the capture/cleanup above only ever
  // touches whichever context was active when the scenario ended. Any additional
  // named contexts opened via "I open a new browser context as ..." — and the
  // original scenario context, if the scenario switched away from it and never
  // switched back — are closed here best-effort (no artifact capture for them,
  // just avoiding leaked browser contexts/tracing sessions).
  const extraContexts = [...this.namedContexts.values(), this.defaultContext].filter(
    (candidate): candidate is NonNullable<typeof candidate> => candidate != null && candidate.context !== context
  );
  for (const extra of extraContexts) {
    if (config.browser.trace !== "off") await extra.context.tracing.stop().catch(() => undefined);
    await extra.context.close().catch(() => undefined);
  }
  this.namedContexts.clear();

  // Assertion steps (runLoggedAssertion) never throw, so Cucumber's own step results
  // never reflect a soft failure — nothing else will fail this scenario. Per-step
  // detail already lives in each failed assertion's own log/attachment; this is only
  // what flips the scenario's overall status.
  if (this.softFailures.length > 0) {
    throw new Error(`${this.softFailures.length} soft assertion(s) failed.`);
  }
});

AfterAll(async () => {
  await browser?.close();
  browser = undefined;
});
