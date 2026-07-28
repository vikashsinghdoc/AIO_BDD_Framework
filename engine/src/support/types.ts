export type LocatorStrategy = "testId" | "role" | "label" | "text" | "placeholder" | "css" | "xpath";

export interface LocatorDefinition {
  strategy: LocatorStrategy;
  value?: string;
  role?: string;
  name?: string;
  exact?: boolean;
}

export interface RoleConfig {
  usernameEnv?: string;
  passwordEnv?: string;
  bearerTokenEnv?: string;
  apiKeyEnv?: string;
}

export interface FrameworkConfig {
  baseUrl: string;
  apiBaseUrl: string;
  browser: {
    name: "chromium" | "firefox" | "webkit";
    headless: boolean;
    timeoutMs: number;
    screenshot: "off" | "on" | "only-on-failure";
    video: "off" | "on" | "retain-on-failure";
    trace: "off" | "on" | "retain-on-failure";
  };
  auth: {
    ui: {
      loginPath: string;
      usernameLocator: string;
      passwordLocator: string;
      submitLocator: string;
      authenticatedLocator?: string;
    };
    roles: Record<string, RoleConfig>;
  };
}
