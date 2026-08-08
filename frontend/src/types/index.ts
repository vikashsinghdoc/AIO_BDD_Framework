export type RunStatus = "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "ERRORED" | "CANCELLED";

export type ExecutionMode = "STANDARD" | "VISUAL_DEBUG";

export type ExecutionStatus =
  | "PASSED"
  | "FAILED"
  | "SKIPPED"
  | "PENDING"
  | "UNDEFINED"
  | "AMBIGUOUS"
  | "UNKNOWN";

export interface EnvironmentSummary {
  name: string;
  label: string;
}

export interface RunSummary {
  id: number;
  status: RunStatus;
  executionMode: ExecutionMode;
  environment: string;
  tagExpression: string | null;
  scenarioUri: string | null;
  scenarioLine: number | null;
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
  featureUri: string | null;
  name: string;
  line: number | null;
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
  environment: string;
  tagExpression: string;
  browser: "chromium" | "firefox" | "webkit";
  headless: boolean;
  parallelWorkers: number;
  screenshotMode: "off" | "on" | "only-on-failure";
  videoMode: "off" | "on" | "retain-on-failure";
  traceMode: "off" | "on" | "retain-on-failure";
  triggeredBy: string;
}

export interface StepSummary {
  keyword: string;
  text: string;
}

export interface ScenarioCatalogEntry {
  uri: string;
  name: string;
  line: number;
  tags: string[];
  steps: StepSummary[];
}

export interface VisualDebugRequest {
  environment: string;
  scenarioUri: string;
  scenarioLine: number;
  triggeredBy: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface StepDetailRow {
  id: number;
  runId: number;
  runStatus: RunStatus;
  runTagExpression: string | null;
  runBrowser: string;
  runStartedAt: string;
  featureName: string | null;
  scenarioId: number;
  scenarioName: string;
  scenarioStatus: ExecutionStatus;
  scenarioTags: string[];
  attachmentCount: number;
  stepOrder: number;
  stepKeyword: string;
  stepName: string;
  stepStatus: ExecutionStatus;
  stepDurationMs: number | null;
  stepErrorMessage: string | null;
}

export interface StepExplorerFilters {
  runId?: number;
  runStatus?: RunStatus;
  scenarioStatus?: ExecutionStatus;
  stepStatus?: ExecutionStatus;
  feature?: string;
  scenario?: string;
  step?: string;
  tag?: string;
  browser?: string;
  onlyErrors?: boolean;
  page?: number;
  size?: number;
}
