export type RunStatus = "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "ERRORED" | "CANCELLED";

export type ExecutionStatus =
  | "PASSED"
  | "FAILED"
  | "SKIPPED"
  | "PENDING"
  | "UNDEFINED"
  | "AMBIGUOUS"
  | "UNKNOWN";

export interface RunSummary {
  id: number;
  status: RunStatus;
  tagExpression: string | null;
  browser: string;
  headless: boolean;
  parallelWorkers: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  skippedScenarios: number;
  triggeredBy: string;
}

export interface StepDto {
  id: number;
  keyword: string;
  name: string;
  status: ExecutionStatus;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface AttachmentDto {
  id: number;
  mimeType: string;
  stepKeyword: string | null;
}

export interface ScenarioDto {
  id: number;
  featureName: string | null;
  name: string;
  status: ExecutionStatus;
  durationMs: number | null;
  errorMessage: string | null;
  tags: string[];
  steps: StepDto[];
  attachments: AttachmentDto[];
}

export interface RunDetail {
  summary: RunSummary;
  failureReason: string | null;
  consoleLog: string | null;
  scenarios: ScenarioDto[];
}

export interface DashboardStats {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  runningRuns: number;
  overallPassRate: number;
  recentRuns: RunSummary[];
  failuresByTag: Record<string, number>;
  passRateTrend: { runLabel: string; runId: number; passRate: number }[];
}

export interface RunRequest {
  tagExpression: string;
  browser: "chromium" | "firefox" | "webkit";
  headless: boolean;
  parallelWorkers: number;
  screenshotMode: "off" | "on" | "only-on-failure";
  videoMode: "off" | "on" | "retain-on-failure";
  traceMode: "off" | "on" | "retain-on-failure";
  baseUrl: string;
  apiBaseUrl: string;
  triggeredBy: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
