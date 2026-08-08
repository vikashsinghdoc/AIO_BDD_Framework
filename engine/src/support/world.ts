import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";
import type { APIRequestContext, Browser, BrowserContext, Page, APIResponse } from "@playwright/test";

export interface NamedContext {
  context: BrowserContext;
  page: Page;
}

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
  softFailures: string[] = [];
  // openContext/useContext/closeContext support: additional named browser contexts
  // beyond the one scenario context hooks.ts already creates. defaultContext stashes
  // that original context/page the first time a scenario switches away from it, so
  // "I use context default" can switch back. this.context/this.page always point at
  // whichever context is currently active — every existing step already reads those
  // two fields directly, so switching contexts doesn't require touching them.
  namedContexts = new Map<string, NamedContext>();
  defaultContext?: NamedContext;

  constructor(options: IWorldOptions) { super(options); }
}
setWorldConstructor(TestWorld);
