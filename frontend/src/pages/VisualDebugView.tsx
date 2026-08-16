import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { parseLine } from "../lib/logLine";
import type { RunSummary, ScenarioCatalogEntry, StepSummary } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import LogConsole from "../components/LogConsole";
import { gsap, useGSAP } from "../lib/gsap";

type StepState = "pending" | "running" | "passed" | "failed";

interface ChecklistStep {
  keyword: string;
  text: string;
  state: StepState;
}

// Advances by step ORDER as structured START/PASS/FAIL log lines appear in the given
// text — not by matching step wording (the log description and the Gherkin step text
// are similar but not guaranteed identical). Cucumber always runs a single scenario's
// steps in declared order, so sequence is a reliable signal. Used both for replaying a
// finished run's full consoleLog in one pass, and (via the live SSE effect below) for
// advancing one line at a time as a run executes.
function deriveStepStates(rawLines: string[], catalogSteps: StepSummary[]): ChecklistStep[] {
  const result: ChecklistStep[] = catalogSteps.map((s) => ({ keyword: s.keyword, text: s.text, state: "pending" }));
  let index = 0;
  for (const raw of rawLines) {
    const parsed = parseLine(raw);
    if (!parsed.message || index >= result.length) continue;
    if (parsed.message.startsWith("START ")) {
      result[index] = { ...result[index], state: "running" };
    } else if (parsed.message.startsWith("PASS ")) {
      result[index] = { ...result[index], state: "passed" };
      index += 1;
    } else if (parsed.message.startsWith("FAIL ")) {
      result[index] = { ...result[index], state: "failed" };
      index += 1;
    }
  }
  return result;
}

export default function VisualDebugView() {
  const { id } = useParams();
  const runId = Number(id);

  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [consoleLog, setConsoleLog] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioCatalogEntry | null>(null);
  const [steps, setSteps] = useState<ChecklistStep[]>([]);
  const stepIndexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // See Dashboard.tsx — flips once on first load; useGSAP depends on this, not
  // `summary`, since summary gets a new reference on every 3s poll while live.
  const [ready, setReady] = useState(false);

  const isLive = summary?.status === "RUNNING" || summary?.status === "QUEUED";

  useEffect(() => {
    if (!runId) return;
    api.getRun(runId).then((detail) => {
      setSummary(detail.summary);
      setConsoleLog(detail.consoleLog);
      setReady(true);
    });
  }, [runId]);

  useGSAP(
    () => {
      if (!ready) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".vd-eyebrow", { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(".vd-title", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.35");
    },
    { dependencies: [ready], scope: containerRef }
  );

  // Same reasoning as RunTest.tsx: capture consoleLog alongside summary on every poll
  // so that once isLive flips to false, LogConsole already has staticLog to fall back
  // to instead of resetting to "Waiting for output…".
  useEffect(() => {
    if (!runId || !isLive) return;
    const interval = setInterval(() => {
      api.getRun(runId).then((detail) => {
        setSummary(detail.summary);
        setConsoleLog(detail.consoleLog);
      });
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, isLive]);

  // Seed the checklist from the scenario's own step list (same catalog the picker
  // used) — every step starts pending, then advances live from the log stream below.
  useEffect(() => {
    if (!summary?.scenarioUri || summary.scenarioLine == null) return;
    api.getScenarioCatalog().then((all) => {
      const match = all.find((s) => s.uri === summary.scenarioUri && s.line === summary.scenarioLine);
      if (!match) return;
      setScenario(match);
      setSteps(match.steps.map((s) => ({ keyword: s.keyword, text: s.text, state: "pending" as StepState })));
    });
  }, [summary?.scenarioUri, summary?.scenarioLine]);

  useEffect(() => {
    stepIndexRef.current = 0;
  }, [runId]);

  // Covers two cases the live-only SSE effect below misses entirely: the page loaded
  // (or was refreshed) AFTER the run already finished — isLive is false from the very
  // first render, so the SSE effect never runs and steps would stay "pending" forever
  // — and the moment a live run finishes, as an authoritative correction in case any
  // SSE events were missed. consoleLog is only populated in the DB once the run
  // completes (TestRunnerService writes it in finalizeRun), so this only fires once
  // real data is available, never overwriting live progress with an empty replay.
  useEffect(() => {
    if (isLive || !consoleLog || !scenario) return;
    setSteps(deriveStepStates(consoleLog.split("\n"), scenario.steps));
  }, [isLive, consoleLog, scenario]);

  // Advances the pre-fetched step list by ORDER as structured START/PASS/FAIL log
  // lines arrive — not by matching step text (the log description and the Gherkin
  // step wording are similar but not guaranteed identical). Cucumber always runs a
  // single scenario's steps in declared order, so sequence is a reliable signal here.
  useEffect(() => {
    if (!runId || !isLive) return;
    const source = new EventSource(api.streamUrl(runId));

    source.addEventListener("log", (event) => {
      const chunk = (event as MessageEvent).data as string;
      for (const raw of chunk.split("\n")) {
        const parsed = parseLine(raw);
        if (!parsed.message) continue;
        const idx = stepIndexRef.current;
        if (parsed.message.startsWith("START ")) {
          setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, state: "running" } : s)));
        } else if (parsed.message.startsWith("PASS ")) {
          setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, state: "passed" } : s)));
          stepIndexRef.current += 1;
        } else if (parsed.message.startsWith("FAIL ")) {
          setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, state: "failed" } : s)));
          stepIndexRef.current += 1;
        }
      }
    });

    source.addEventListener("done", () => source.close());
    source.onerror = () => source.close();
    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, isLive]);

  if (!summary) {
    return (
      <div ref={containerRef} className="p-8">
        <p className="text-ink-faint text-[13px]">Loading Visual Debug session #{runId}…</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-8">
      <header className="mb-6">
        <div className="vd-eyebrow flex items-center gap-3 flex-wrap">
          <p className="eyebrow">visual debug</p>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-aurora-violet/10 border border-aurora-violet/30 text-aurora-iris text-[10.5px] font-mono uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aurora-violet opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-aurora-violet" />
              </span>
              live debug
            </span>
          )}
        </div>
        <h1 className="vd-title text-[32px] md:text-[38px] leading-tight font-display font-bold text-gradient-aurora mt-2">
          {scenario?.name ?? "Scenario"}
        </h1>
      </header>

      <div className="section-divider mb-6" />

      <div className="glass-panel p-4 mb-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px]">
        <Field label="Environment" value={summary.environment} />
        <Field label="Feature" value={summary.scenarioUri?.split("/").pop() ?? "—"} />
        <div>
          <p className="eyebrow mb-1">Status</p>
          <StatusBadge status={summary.status} pulse />
        </div>
      </div>

      <div className="glass-panel p-8 mb-5 flex flex-col items-center justify-center text-center min-h-[220px]">
        <p className="text-ink-muted text-[13px] max-w-md">
          Live browser preview isn&apos;t available yet — step progress and logs below
          reflect the real-time execution.
        </p>
      </div>

      <div className="glass-panel p-5 mb-5">
        <p className="eyebrow mb-3.5">Execution steps</p>
        {steps.length === 0 ? (
          <p className="text-ink-faint text-[12.5px] italic">Waiting for step list…</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {steps.map((step, idx) => (
              <StepRow key={idx} step={step} />
            ))}
          </div>
        )}
      </div>

      <div className="h-[360px] mb-5">
        <LogConsole runId={runId} live={isLive} staticLog={consoleLog} />
      </div>

      {!isLive && (
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-1">Final result</p>
            <StatusBadge status={summary.status} />
          </div>
          <Link
            to={`/runs/${runId}`}
            className="text-[12.5px] font-mono text-aurora-cyan hover:text-white transition-colors duration-150"
          >
            view full run detail →
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-ink-primary font-mono text-[13px]">{value}</p>
    </div>
  );
}

const STEP_STATE_LABEL: Record<StepState, string> = {
  passed: "Passed",
  failed: "Failed",
  running: "Running",
  pending: "Pending"
};

function StepRow({ step }: { step: ChecklistStep }) {
  const icon =
    step.state === "passed" ? (
      <span className="text-signal-pass">✓</span>
    ) : step.state === "failed" ? (
      <span className="text-signal-fail">✕</span>
    ) : step.state === "running" ? (
      <span className="text-aurora-iris animate-pulse">●</span>
    ) : (
      <span className="text-ink-faint">○</span>
    );

  const textClass =
    step.state === "pending" ? "text-ink-faint" : step.state === "failed" ? "text-signal-fail" : "text-ink-primary";

  return (
    <div className="flex items-center gap-2.5 text-[13px] font-mono">
      <span className="w-4 text-center shrink-0" role="img" aria-label={STEP_STATE_LABEL[step.state]}>
        {icon}
      </span>
      <span className={textClass}>
        <span className="text-ink-faint">{step.keyword}</span>
        {step.text}
      </span>
    </div>
  );
}
