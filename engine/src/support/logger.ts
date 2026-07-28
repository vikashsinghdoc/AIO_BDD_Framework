import winston from "winston";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { workerId, workerResultsDirectory } from "./browser-runtime.js";
import type { TestWorld } from "./world.js";

type LogLevel = "info" | "error";

const workerColours = [36, 35, 33, 32, 34, 31];
const workerColour = workerColours[((Number(workerId) || 1) - 1) % workerColours.length];
const logsDirectory = join(workerResultsDirectory(), "logs");
mkdirSync(logsDirectory, { recursive: true });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
        winston.format.printf((info) => {
          const workerPrefix = `\u001b[${workerColour}m[W${workerId}]\u001b[0m`;
          return `${info.timestamp} ${workerPrefix} [${info.scenario ?? "worker"}] ${info.level.toUpperCase()} ${info.message}`;
        })
      )
    }),
    new winston.transports.File({
      filename: join(logsDirectory, `worker-${workerId}.log`),
      format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    })
  ]
});

export function writeLog(level: LogLevel, scenario: string, message: string): string {
  const entry = `[${new Date().toISOString()}] [W${workerId}] [${scenario}] ${level.toUpperCase()} ${message}`;
  logger.log(level, message, { worker: workerId, scenario });
  return entry;
}

export async function runLoggedStep<T>(
  world: TestWorld,
  description: string,
  action: () => Promise<T> | T
): Promise<T> {
  const scenario = world.scenarioName ?? "scenario";
  const entries = [writeLog("info", scenario, `START ${description}`)];
  const startedAt = performance.now();

  try {
    const result = await action();
    entries.push(writeLog("info", scenario, `PASS ${description} (${Math.round(performance.now() - startedAt)}ms)`));
    await world.attach(entries.join("\n"), "text/plain");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    entries.push(writeLog("error", scenario, `FAIL ${description} (${Math.round(performance.now() - startedAt)}ms): ${message}`));
    await world.attach(entries.join("\n"), "text/plain");
    throw error;
  }
}
