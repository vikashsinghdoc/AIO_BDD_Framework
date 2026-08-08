import type {
  AttachmentDto,
  DashboardStats,
  EnvironmentSummary,
  PageResponse,
  RunDetail,
  RunRequest,
  RunStatus,
  RunSummary,
  ScenarioCatalogEntry,
  StepDetailRow,
  StepExplorerFilters,
  VisualDebugRequest
} from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      /* ignore non-json error bodies */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  triggerRun: (payload: RunRequest) =>
    request<RunSummary>("/runs", { method: "POST", body: JSON.stringify(payload) }),

  triggerVisualDebug: (payload: VisualDebugRequest) =>
    request<RunSummary>("/visual-debug", { method: "POST", body: JSON.stringify(payload) }),

  cancelRun: (id: number) => request<void>(`/runs/${id}/cancel`, { method: "POST" }),

  listRuns: (params: {
    status?: RunStatus;
    tag?: string;
    page?: number;
    size?: number;
  }) => {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.tag) search.set("tag", params.tag);
    search.set("page", String(params.page ?? 0));
    search.set("size", String(params.size ?? 20));
    return request<PageResponse<RunSummary>>(`/runs?${search.toString()}`);
  },

  getRun: (id: number, filters?: { status?: string; tag?: string; search?: string }) => {
    const search = new URLSearchParams();
    if (filters?.status) search.set("status", filters.status);
    if (filters?.tag) search.set("tag", filters.tag);
    if (filters?.search) search.set("search", filters.search);
    const qs = search.toString();
    return request<RunDetail>(`/runs/${id}${qs ? `?${qs}` : ""}`);
  },

  getTags: () => request<string[]>("/tags"),

  getEnvironments: () => request<EnvironmentSummary[]>("/environments"),

  getScenarioCatalog: () => request<ScenarioCatalogEntry[]>("/scenarios"),

  getDashboard: () => request<DashboardStats>("/dashboard/summary"),

  searchSteps: (filters: StepExplorerFilters) => {
    const search = new URLSearchParams();
    if (filters.runId != null) search.set("runId", String(filters.runId));
    if (filters.runStatus) search.set("runStatus", filters.runStatus);
    if (filters.scenarioStatus) search.set("scenarioStatus", filters.scenarioStatus);
    if (filters.stepStatus) search.set("stepStatus", filters.stepStatus);
    if (filters.feature) search.set("feature", filters.feature);
    if (filters.scenario) search.set("scenario", filters.scenario);
    if (filters.step) search.set("step", filters.step);
    if (filters.tag) search.set("tag", filters.tag);
    if (filters.browser) search.set("browser", filters.browser);
    if (filters.onlyErrors) search.set("onlyErrors", "true");
    search.set("page", String(filters.page ?? 0));
    search.set("size", String(filters.size ?? 25));
    return request<PageResponse<StepDetailRow>>(`/steps?${search.toString()}`);
  },

  getScenarioAttachments: (scenarioId: number) =>
    request<AttachmentDto[]>(`/scenarios/${scenarioId}/attachments`),

  attachmentUrl: (id: number) => `${BASE}/attachments/${id}`,

  streamUrl: (id: number) => `${BASE}/runs/${id}/stream`
};
