import { config, roleConfig } from "./config.js";
import type { TestWorld } from "./world.js";

export function interpolate(world: TestWorld, value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    const [role, field] = key.split(".");
    if (field && config.auth.roles[role]) {
      const config = roleConfig(role);
      const envName = field === "email" || field === "username"
        ? config.usernameEnv
        : field === "password"
          ? config.passwordEnv
          : undefined;
      return envName ? process.env[envName] ?? "" : "";
    }
    const found = world.variables.get(key);
    if (found === undefined) throw new Error(`No scenario variable named "${key}".`);
    return String(found);
  });
}

export function jsonPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}
