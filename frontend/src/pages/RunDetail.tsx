import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { RunDetail } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import ScenarioGrid from "../components/ScenarioGrid";
import LogConsole from "../components/LogConsole";
import MiniStat from "../components/MiniStat";
import { Select, TextInput } from "../components/FormControls";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "SKIPPED", label: "Skipped" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDEFINED", label: "Undefined" }
];

export default function RunDetailPage() {
  const { id } = useParams();
  const runId = Number(id);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [tab, setTab] = useState<"scenarios" | "console">("scenarios");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [search, setSearch] = useState("");

  function load() {
    api
      .getRun(runId, { status: statusFilter || undefined, tag: tagFilter || undefined, search: search || undefined })
      .then(setDetail);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, statusFilter, tagFilter, search]);

  useEffect(() => {
    if (!detail || detail.summary.status !== "RUNNING") return;
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.summary.status]);

  if (!detail) {
    return <div className="p-8"><p className="text-ink-faint text-[13px]">Loading run #{runId}…</p></div>;
  }

  const { summary } = detail;
  const isLive = summary.status === "RUNNING" || summary.status === "QUEUED";

  return (
    <div className="p-8 max-w-[1500px]">
      <header className="mb-6">
        <p className="eyebrow mb-1.5">run detail</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[26px] font-semibold">Run #{summary.id}</h1>
          <StatusBadge status={summary.status} pulse />
        </div>
        <p className="text-ink-muted text-[13px] mt-1.5 font-mono">
          {summary.environment} · {summary.tagExpression ?? "all scenarios"} · {summary.browser} · {summary.headless ? "headless" : "headed"} · {summary.parallelWorkers} worker(s)
          {" · "}
          {format(new Date(summary.startedAt), "MMM d, yyyy HH:mm:ss")}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <MiniStat label="total" value={summary.totalScenarios} />
        <MiniStat label="passed" value={summary.passedScenarios} accent="pass" />
        <MiniStat label="failed" value={summary.failedScenarios} accent="fail" />
        <MiniStat label="skipped" value={summary.skippedScenarios} accent="pending" />
        <MiniStat label="duration" value={summary.durationMs ? `${(summary.durationMs / 1000).toFixed(1)}s` : "—"} />
      </div>

      {detail.failureReason && (
        <div className="glass-panel border-l-[3px] border-l-signal-fail p-4 mb-6">
          <p className="eyebrow mb-1 text-signal-fail">run-level failure</p>
          <p className="text-[13px] text-ink-primary font-mono">{detail.failureReason}</p>
        </div>
      )}

      <div className="flex gap-1 mb-5 border-b border-base-border">
        <TabButton active={tab === "scenarios"} onClick={() => setTab("scenarios")}>
          Scenarios
        </TabButton>
        <TabButton active={tab === "console"} onClick={() => setTab("console")}>
          Console log
        </TabButton>
      </div>

      {tab === "scenarios" ? (
        <>
          <div className="flex gap-3 mb-5 max-w-2xl">
            <div className="w-44">
              <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            </div>
            <div className="w-40">
              <TextInput value={tagFilter} onChange={setTagFilter} placeholder="tag, e.g. @ui" />
            </div>
            <div className="flex-1">
              <TextInput value={search} onChange={setSearch} placeholder="search scenario name…" />
            </div>
          </div>
          <ScenarioGrid scenarios={detail.scenarios} environment={summary.environment} />
        </>
      ) : (
        <div className="h-[600px]">
          <LogConsole runId={summary.id} live={isLive} staticLog={detail.consoleLog} />
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
        active ? "border-signal-brand text-white" : "border-transparent text-ink-muted hover:text-ink-primary"
      }`}
    >
      {children}
    </button>
  );
}
