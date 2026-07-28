import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Locator, Page } from "@playwright/test";
import { parse } from "yaml";
import type { LocatorDefinition } from "./types.js";

type Registry = Record<string, Record<string, LocatorDefinition>>;
const registry: Registry = {};

function loadDirectory(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) loadDirectory(fullPath);
    if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
      const pageName = entry.name.replace(/\.ya?ml$/i, "");
      registry[pageName] = parse(readFileSync(fullPath, "utf8")) as Record<string, LocatorDefinition>;
    }
  }
}
loadDirectory(resolve(process.cwd(), "config/locators"));

export function resolveLocator(page: Page, alias: string): Locator {
  const [pageName, ...elementParts] = alias.split(".");
  const elementName = elementParts.join(".");
  const definition = registry[pageName]?.[elementName];
  if (!definition) throw new Error(`Locator alias "${alias}" was not found in config/locators.`);
  const options = { name: definition.name ?? definition.value, exact: definition.exact };
  switch (definition.strategy) {
    case "testId": return page.getByTestId(definition.value!);
    case "role": return page.getByRole(definition.role as never, options);
    case "label": return page.getByLabel(definition.value!, { exact: definition.exact });
    case "text": return page.getByText(definition.value!, { exact: definition.exact });
    case "placeholder": return page.getByPlaceholder(definition.value!, { exact: definition.exact });
    case "css": return page.locator(definition.value!);
    case "xpath": return page.locator(`xpath=${definition.value}`);
    default: throw new Error(`Unsupported locator strategy for "${alias}".`);
  }
}
