import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";
import type { APIRequestContext, Browser, BrowserContext, Page, APIResponse } from "@playwright/test";

export class TestWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  api!: APIRequestContext;
  response?: APIResponse;
  activeRole?: string;
  scenarioName?: string;
  variables = new Map<string, unknown>();
  requestHeaders: Record<string, string> = {};
  requestQuery: Record<string, string> = {};

  constructor(options: IWorldOptions) { super(options); }
}
setWorldConstructor(TestWorld);
