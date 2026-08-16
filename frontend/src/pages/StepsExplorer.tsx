import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { AttachmentDto, ExecutionStatus, RunStatus, StepDetailRow } from "../types";
import { StepStatusBadge, StatusBadge } from "../components/StatusBadge";
import { Select, TextInput, Toggle } from "../components/FormControls";
import { format } from "date-fns";
import { gsap, useGSAP } from "../lib/gsap";

const RUN_STATUS_OPTIONS = [
  { value: "", label: "Any run status" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "RUNNING", label: "Running" },
  { value: "ERRORED", label: "Errored" }
];

const SCENARIO_STATUS_OPTIONS = [
  { value: "", label: "Any scenario status" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "SKIPPED", label: "Skipped" }
];

const STEP_STATUS_OPTIONS = [
  { value: "", label: "Any step status" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "SKIPPED", label: "Skipped" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDEFINED", label: "Undefined" }
];

const BROWSER_OPTIONS = [
  { value: "", label: "Any browser" },
  { value: "chromium", label: "Chromium" },
  { value: "firefox", label: "Firefox" },
  { value: "webkit", label: "WebKit" }
];

export default function StepsExplorer() {
  const [rows, setRows] = useState<StepDetailRow[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [runStatus, setRunStatus] = useState("");
  const [scenarioStatus, setScenarioStatus] = useState("");
  const [stepStatus, setStepStatus] = useState("");
  const [browser, setBrowser] = useState("");
  const [feature, setFeature] = useState("");
  const [scenario, setScenario] = useState("");
  const [step, setStep] = useState("");
  const [tag, setTag] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [attachmentsByScenario, setAttachmentsByScenario] = useState<Record<number, AttachmentDto[]>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".exp-eyebrow", { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(".exp-title", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.35")
        .fromTo(".exp-subtitle", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.4");
    },
    { scope: containerRef }
  );

  function load() {
    setLoading(true);
    api
      .searchSteps({
        runStatus: (runStatus || undefined) as RunStatus | undefined,
        scenarioStatus: (scenarioStatus || undefined) as ExecutionStatus | undefined,
        stepStatus: (stepStatus || undefined) as ExecutionStatus | undefined,
        browser: browser || undefined,
        feature: feature || undefined,
        scenario: scenario || undefined,
        step: step || undefined,
        tag: tag || undefined,
        onlyErrors,
        page,
        size: 25
      })
      .then((res) => {
        setRows(res.content);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [runStatus, scenarioStatus, stepStatus, browser, feature, scenario, step, tag, onlyErrors, page]);

  function resetToFirstPage(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(0);
    };
  }

  async function toggleExpand(row: StepDetailRow) {
    if (expanded === row.id) {
      setExpanded(null);
      return;
    }
    setExpanded(row.id);
    if (row.attachmentCount > 0 && !attachmentsByScenario[row.scenarioId]) {
      const attachments = await api.getScenarioAttachments(row.scenarioId);
      setAttachmentsByScenario((prev) => ({ ...prev, [row.scenarioId]: attachments }));
    }
  }

  return (
    <div ref={containerRef} className="p-8">
      <header className="mb-6">
        <p className="eyebrow exp-eyebrow mb-2">complete grid</p>
        <h1 className="exp-title text-[48px] md:text-[56px] leading-[0.95] font-display font-bold uppercase tracking-tight text-gradient-aurora">
          Steps Explorer
        </h1>
        <p className="exp-subtitle text-ink-muted text-[13.5px] mt-3">
          Every step from every scenario, across every run ever recorded — filter by any
          combination of run/scenario/step status, feature, tag, or browser, and drill into
          the full error and screenshots inline.
        </p>
      </header>

      <div className="section-divider mb-6" />

      <div className="glass-panel p-4 mb-5 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Select value={runStatus} onChange={resetToFirstPage(setRunStatus)} options={RUN_STATUS_OPTIONS} />
        <Select value={scenarioStatus} onChange={resetToFirstPage(setScenarioStatus)} options={SCENARIO_STATUS_OPTIONS} />
        <Select value={stepStatus} onChange={resetToFirstPage(setStepStatus)} options={STEP_STATUS_OPTIONS} />
        <Select value={browser} onChange={resetToFirstPage(setBrowser)} options={BROWSER_OPTIONS} />
        <TextInput value={feature} onChange={resetToFirstPage(setFeature)} placeholder="feature name…" />
        <TextInput value={scenario} onChange={resetToFirstPage(setScenario)} placeholder="scenario name…" />
        <TextInput value={step} onChange={resetToFirstPage(setStep)} placeholder="step text…" />
        <TextInput value={tag} onChange={resetToFirstPage(setTag)} placeholder="tag, e.g. @ui" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <Toggle checked={onlyErrors} onChange={(v) => { setOnlyErrors(v); setPage(0); }} label="Only rows with an error" />
        <p className="text-[12px] font-mono text-ink-faint">{totalElements.toLocaleString()} step(s) matched</p>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-base-border text-left">
              <th className="px-4 py-2.5 eyebrow font-normal">Run</th>
              <th className="px-4 py-2.5 eyebrow font-normal">Feature / Scenario</th>
              <th className="px-4 py-2.5 eyebrow font-normal">Step</th>
              <th className="px-4 py-2.5 eyebrow font-normal">Status</th>
              <th className="px-4 py-2.5 eyebrow font-normal">Duration</th>
              <th className="px-4 py-2.5 eyebrow font-normal">Tags</th>
              <th className="px-4 py-2.5 eyebrow font-normal">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-border">
            {rows.map((row) => {
              const isExpanded = expanded === row.id;
              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => toggleExpand(row)}
                    className="hover:bg-base-surface2/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/runs/${row.runId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-aurora-iris hover:text-white transition-colors"
                      >
                        #{row.runId}
                      </Link>
                      <div className="mt-1"><StatusBadge status={row.runStatus} /></div>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-ink-faint text-[11px] font-mono truncate">{row.featureName}</p>
                      <p className="text-ink-primary truncate">{row.scenarioName}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[320px]">
                      <p className="text-ink-primary truncate">
                        <span className="text-ink-faint">{row.stepKeyword}</span>
                        {row.stepName}
                      </p>
                    </td>
                    <td className="px-4 py-3"><StepStatusBadge status={row.stepStatus} /></td>
                    <td className="px-4 py-3 font-mono text-ink-muted">
                      {row.stepDurationMs != null ? `${row.stepDurationMs}ms` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-aurora-iris text-[11px]">
                      {row.scenarioTags.slice(0, 2).join(" ")}
                    </td>
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                      {format(new Date(row.runStartedAt), "MMM d, HH:mm")}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-4 bg-base-surface2/30">
                        <div className="border-t border-base-border pt-3 flex flex-col gap-3">
                          {row.stepErrorMessage ? (
                            <pre className="text-signal-fail/90 font-mono text-[11.5px] whitespace-pre-wrap break-words bg-signal-fail/5 border border-signal-fail/20 rounded-md p-3">
                              {row.stepErrorMessage}
                            </pre>
                          ) : (
                            <p className="text-ink-faint text-[12px] italic">No error on this step.</p>
                          )}

                          {row.attachmentCount > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {(attachmentsByScenario[row.scenarioId] ?? []).filter((a) => a.mimeType.startsWith("image/")).map((a) => (
                                <img
                                  key={a.id}
                                  src={api.attachmentUrl(a.id)}
                                  alt="scenario attachment"
                                  className="w-24 h-16 object-cover rounded-md border border-base-border hover:border-aurora-cyan/60 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightbox(a.id);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-faint">No steps match these filters.</td>
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
          <span className="text-[12px] font-mono text-ink-faint">page {page + 1} / {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-base-border text-[12px] text-ink-muted disabled:opacity-30 hover:text-white"
          >
            next →
          </button>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setLightbox(null)}
        >
          <img
            src={api.attachmentUrl(lightbox)}
            alt="screenshot"
            className="max-w-full max-h-full rounded-lg shadow-2xl border border-base-border"
          />
        </div>
      )}
    </div>
  );
}
