import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { RunDetail } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import ScenarioGrid from "../components/ScenarioGrid";
import LogConsole from "../components/LogConsole";
import MiniStat from "../components/MiniStat";
import TestTicker from "../components/TestTicker";
import { Select, TextInput } from "../components/FormControls";
import { format } from "date-fns";
import { gsap, useGSAP } from "../lib/gsap";

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
  const containerRef = useRef<HTMLDivElement>(null);
  // Flips once, first load — see Dashboard.tsx for why useGSAP must depend on
  // this rather than `detail` (which gets a new reference on every 4s poll of a
  // running run, which would otherwise re-fire and kill the entrance mid-flight).
  const [ready, setReady] = useState(false);

  function load() {
    api
      .getRun(runId, { status: statusFilter || undefined, tag: tagFilter || undefined, search: search || undefined })
      .then((data) => {
        setDetail(data);
        setReady(true);
      });
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

  useGSAP(
    () => {
      if (!ready) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".rd-eyebrow", { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(".rd-title", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.35");
    },
    { dependencies: [ready], scope: containerRef }
  );

  if (!detail) {
    return (
      <div ref={containerRef} className="p-8">
        <p className="text-ink-faint text-[13px]">Loading run #{runId}…</p>
      </div>
    );
  }

  const { summary } = detail;
  const isLive = summary.status === "RUNNING" || summary.status === "QUEUED";

  return (
    <div ref={containerRef} className="p-8">
      <header className="mb-6">
        <p className="eyebrow rd-eyebrow mb-2">run detail</p>
        <div className="rd-title flex items-center gap-4 flex-wrap">
          <h1 className="text-[40px] md:text-[48px] leading-[0.95] font-display font-bold uppercase tracking-tight text-gradient-aurora">
            Run #{summary.id}
          </h1>
          <StatusBadge status={summary.status} pulse />
        </div>
        <p className="text-ink-muted text-[13px] mt-3 font-mono">
          {summary.environment} · {summary.tagExpression ?? "all scenarios"} · {summary.browser} · {summary.headless ? "headless" : "headed"} · {summary.parallelWorkers} worker(s)
          {" · "}
          {format(new Date(summary.startedAt), "MMM d, yyyy HH:mm:ss")}
        </p>
      </header>

      <div className="section-divider mb-6" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <MiniStat label="total" value={summary.totalScenarios} />
        <MiniStat label="passed" value={summary.passedScenarios} accent="pass" />
        <MiniStat label="failed" value={summary.failedScenarios} accent="fail" />
        <MiniStat label="skipped" value={summary.skippedScenarios} accent="pending" />
        <MiniStat label="duration" value={summary.durationMs ? `${(summary.durationMs / 1000).toFixed(1)}s` : "—"} />
      </div>

      {isLive && (
        <div className="mb-6">
          <TestTicker runId={summary.id} live={isLive} />
        </div>
      )}

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
        active ? "border-aurora-violet text-white" : "border-transparent text-ink-muted hover:text-ink-primary"
      }`}
    >
      {children}
    </button>
  );
}
