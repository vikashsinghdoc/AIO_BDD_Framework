// Shared by LogConsole.tsx (worker-colored console) and VisualDebugView.tsx (step
// checklist) — both need to parse the same engine log line shape, and both need it
// parsed the same way. Matches logger.ts's console format:
// "HH:mm:ss.SSS [W<id>] [<scenario>] LEVEL message". ANSI color codes (meant for a
// terminal) are stripped first — nothing in this app renders into a real terminal.
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;
// Deliberately NOT anchored with ^: Cucumber's own "progress" formatter writes an
// un-terminated single character per step (".", "F", "-", ...) with no trailing
// newline, which the backend's line-by-line stdout reader then concatenates onto the
// front of whichever log line happens to follow — most consequentially on FAIL lines
// ("F" + timestamp), exactly where the worker badge matters most. Searching for the
// pattern anywhere in the line (not just at position 0) recovers those lines too.
const STRUCTURED_PATTERN = /(\d{2}:\d{2}:\d{2}\.\d{3})\s+\[W(\S+)\]\s+\[([^\]]*)\]\s+(INFO|WARN|ERROR|DEBUG)\s+(.*)$/;

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface ParsedLine {
  raw: string;
  timestamp?: string;
  workerId?: string;
  scenario?: string;
  level?: LogLevel;
  message?: string;
}

export function parseLine(raw: string): ParsedLine {
  const clean = raw.replace(ANSI_PATTERN, "");
  const match = STRUCTURED_PATTERN.exec(clean);
  if (!match) return { raw: clean };
  const [, timestamp, workerId, scenario, level, message] = match;
  return { raw: clean, timestamp, workerId, scenario: scenario || undefined, level: level as LogLevel, message };
}
