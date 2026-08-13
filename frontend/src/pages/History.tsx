import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { RunStatus, RunSummary } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Select, TextInput } from "../components/FormControls";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "RUNNING", label: "Running" },
  { value: "QUEUED", label: "Queued" },
  { value: "ERRORED", label: "Errored" },
  { value: "CANCELLED", label: "Cancelled" }
];

export default function History() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .listRuns({ status: (status || undefined) as RunStatus | undefined, tag: tag || undefined, page, size: 15 })
      .then((res) => {
        setRuns(res.content);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [status, tag, page]);

  return (
    <div className="p-8">
      <header className="mb-6">
        <p className="eyebrow mb-1.5">archive</p>
        <h1 className="text-[26px] font-semibold">Run History</h1>
        <p className="text-ink-muted text-[13.5px] mt-1">
          Every run ever triggered, persisted in Postgres with full scenario/step detail and screenshots.
        </p>
      </header>

      <div className="flex gap-3 mb-5 max-w-lg">
        <div className="w-52">
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="flex-1">
          <TextInput value={tag} onChange={(v) => { setTag(v); setPage(0); }} placeholder="filter by tag, e.g. @ui" />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-base-border text-left">
              <th className="px-5 py-3 eyebrow font-normal">Run</th>
              <th className="px-5 py-3 eyebrow font-normal">Status</th>
              <th className="px-5 py-3 eyebrow font-normal">Environment</th>
              <th className="px-5 py-3 eyebrow font-normal">Tags</th>
              <th className="px-5 py-3 eyebrow font-normal">Browser</th>
              <th className="px-5 py-3 eyebrow font-normal">Results</th>
              <th className="px-5 py-3 eyebrow font-normal">Duration</th>
              <th className="px-5 py-3 eyebrow font-normal">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-border">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-base-surface2/50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link to={`/runs/${run.id}`} className="font-mono text-signal-brand2 hover:text-white">
                    #{run.id}
                  </Link>
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={run.status} /></td>
                <td className="px-5 py-3.5 font-mono text-signal-brand2 text-[12px]">{run.environment}</td>
                <td className="px-5 py-3.5 font-mono text-ink-muted text-[12px]">{run.tagExpression ?? "all"}</td>
                <td className="px-5 py-3.5 text-ink-muted capitalize">{run.browser}</td>
                <td className="px-5 py-3.5 font-mono text-[12px]">
                  <span className="text-signal-pass">{run.passedScenarios}✓</span>{" "}
                  <span className="text-signal-fail">{run.failedScenarios}✕</span>{" "}
                  <span className="text-ink-faint">{run.skippedScenarios}⊘</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-ink-muted text-[12px]">
                  {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                </td>
                <td className="px-5 py-3.5 text-ink-muted text-[12px]">
                  {format(new Date(run.startedAt), "MMM d, HH:mm")}
                </td>
              </tr>
            ))}
            {!loading && runs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-ink-faint">No runs match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-base-border text-[12px] text-ink-muted disabled:opacity-30 hover:text-white"
          >
            ← prev
          </button>
          <span className="text-[12px] font-mono text-ink-faint">
            page {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-base-border text-[12px] text-ink-muted disabled:opacity-30 hover:text-white"
          >
            next →
          </button>
        </div>
      )}
    </div>
  );
}
