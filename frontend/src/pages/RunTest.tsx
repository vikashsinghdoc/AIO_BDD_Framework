import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { RunRequest, RunSummary } from "../types";
import EnvironmentPicker from "../components/EnvironmentPicker";
import TagPicker from "../components/TagPicker";
import ScenarioPicker from "../components/ScenarioPicker";
import { Field, Select, Toggle, NumberInput } from "../components/FormControls";
import LogConsole from "../components/LogConsole";
import MiniStat from "../components/MiniStat";
import { StatusBadge } from "../components/StatusBadge";

const DEFAULTS: RunRequest = {
  environment: "",
  tagExpression: "",
  browser: "chromium",
  headless: true,
  parallelWorkers: 1,
  screenshotMode: "only-on-failure",
  videoMode: "off",
  traceMode: "off",
  triggeredBy: "web-ui"
};

interface ScenarioSelection {
  uri: string;
  line: number;
}

type ExecutionModeChoice = "standard" | "visual-debug";

export default function RunTest() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<ExecutionModeChoice>(
    searchParams.get("mode") === "visual-debug" ? "visual-debug" : "standard"
  );

  // Standard execution state — unchanged behavior from before Visual Debug existed.
  const [form, setForm] = useState<RunRequest>(DEFAULTS);
  const [runId, setRunId] = useState<number | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [consoleLog, setConsoleLog] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visual Debug state — separate from Standard's, so switching modes never leaks
  // one mode's selection into the other.
  const [vdEnvironment, setVdEnvironment] = useState(searchParams.get("env") ?? "");
  const [vdScenario, setVdScenario] = useState<ScenarioSelection | null>(() => {
    const uri = searchParams.get("uri");
    const line = searchParams.get("line");
    return uri && line ? { uri, line: Number(line) } : null;
  });
  const [vdTriggering, setVdTriggering] = useState(false);
  const [vdError, setVdError] = useState<string | null>(null);

  const navigate = useNavigate();

  function update<K extends keyof RunRequest>(key: K, value: RunRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isLive = summary?.status === "RUNNING" || summary?.status === "QUEUED";

  // Poll the same run-detail endpoint RunDetail.tsx uses, so passed/failed/skipped
  // counts and duration update live without leaving this page. Capturing consoleLog
  // alongside summary (not just summary) means that when the last poll flips isLive to
  // false, LogConsole already has the finished run's output to fall back to — instead
  // of resetting to empty because no staticLog was ever provided.
  useEffect(() => {
    if (!runId || !isLive) return;
    const interval = setInterval(() => {
      api.getRun(runId).then((detail) => {
        setSummary(detail.summary);
        setConsoleLog(detail.consoleLog);
      });
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, isLive]);

  async function handleTrigger() {
    setError(null);
    setTriggering(true);
    try {
      const run = await api.triggerRun(form);
      setRunId(run.id);
      setSummary(run);
      setConsoleLog(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTriggering(false);
    }
  }

  async function handleCancel() {
    if (!runId) return;
    await api.cancelRun(runId);
  }

  async function handleStartVisualDebug() {
    if (!vdEnvironment || !vdScenario) return;
    setVdError(null);
    setVdTriggering(true);
    try {
      const run = await api.triggerVisualDebug({
        environment: vdEnvironment,
        scenarioUri: vdScenario.uri,
        scenarioLine: vdScenario.line,
        triggeredBy: "web-ui"
      });
      navigate(`/visual-debug/${run.id}`);
    } catch (e) {
      setVdError((e as Error).message);
    } finally {
      setVdTriggering(false);
    }
  }

  const canRun = form.environment !== "" && !triggering && !isLive;
  const canStartVisualDebug = vdEnvironment !== "" && vdScenario !== null && !vdTriggering;

  return (
    <div className="p-8 max-w-[1500px]">
      <header className="mb-6">
        <p className="eyebrow mb-1.5">launch</p>
        <h1 className="text-[26px] font-semibold">Run Tests</h1>
        <p className="text-ink-muted text-[13.5px] mt-1">
          Choose an execution mode, then configure and trigger the Playwright + Cucumber engine.
        </p>
      </header>

      <div className="mb-7">
        <p className="eyebrow mb-2.5">Execution mode</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <ModeCard
            active={mode === "standard"}
            title="Standard Execution"
            description="Run suites and multiple scenarios using parallel execution."
            onClick={() => setMode("standard")}
          />
          <ModeCard
            active={mode === "visual-debug"}
            title="Visual Debug"
            description="Run one scenario in its own session for focused, step-by-step investigation."
            onClick={() => setMode("visual-debug")}
          />
        </div>
      </div>

      {mode === "standard" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
          <div className="glass-panel p-5 flex flex-col gap-6 h-fit">
            <div className="flex flex-col gap-3">
              <StepLabel index={1} title="Environment" />
              <EnvironmentPicker value={form.environment} onChange={(v) => update("environment", v)} />
            </div>

            <div className="flex flex-col gap-3 pt-5 border-t border-base-border">
              <StepLabel index={2} title="Test suite" />
              <TagPicker value={form.tagExpression} onChange={(v) => update("tagExpression", v)} />
            </div>

            <div className="flex flex-col gap-4 pt-5 border-t border-base-border">
              <StepLabel index={3} title="Execution options" />
              <div className="flex flex-col gap-4">
                <Field label="Browser engine">
                  <Select
                    value={form.browser}
                    onChange={(v) => update("browser", v as RunRequest["browser"])}
                    options={[
                      { value: "chromium", label: "Chromium" },
                      { value: "firefox", label: "Firefox" },
                      { value: "webkit", label: "WebKit" }
                    ]}
                  />
                </Field>

                <Field label="Parallel workers" hint="cucumber --parallel">
                  <NumberInput value={form.parallelWorkers} onChange={(v) => update("parallelWorkers", v)} min={1} max={16} />
                </Field>

                <Field label="Execution mode">
                  <Toggle checked={form.headless} onChange={(v) => update("headless", v)} label={form.headless ? "Headless" : "Headed (visible browser)"} />
                </Field>

                <Field label="Screenshots">
                  <Select
                    value={form.screenshotMode}
                    onChange={(v) => update("screenshotMode", v as RunRequest["screenshotMode"])}
                    options={[
                      { value: "off", label: "Off" },
                      { value: "only-on-failure", label: "Only on failure" },
                      { value: "on", label: "Always" }
                    ]}
                  />
                </Field>

                <Field label="Video">
                  <Select
                    value={form.videoMode}
                    onChange={(v) => update("videoMode", v as RunRequest["videoMode"])}
                    options={[
                      { value: "off", label: "Off" },
                      { value: "retain-on-failure", label: "Retain on failure" },
                      { value: "on", label: "Always" }
                    ]}
                  />
                </Field>

                <Field label="Trace">
                  <Select
                    value={form.traceMode}
                    onChange={(v) => update("traceMode", v as RunRequest["traceMode"])}
                    options={[
                      { value: "off", label: "Off" },
                      { value: "retain-on-failure", label: "Retain on failure" },
                      { value: "on", label: "Always" }
                    ]}
                  />
                </Field>
              </div>
            </div>

            {error && <p className="text-signal-fail text-[12.5px] font-mono">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleTrigger}
                disabled={!canRun}
                className="flex-1 bg-signal-brand hover:bg-signal-brand2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-signal-brand active:scale-[0.98] transition-[background-color,transform] duration-150 ease-out-strong text-white font-medium text-[13.5px] rounded-lg py-2.5 shadow-glow"
              >
                {isLive ? "Running…" : "Run suite"}
              </button>
              {isLive && (
                <button
                  onClick={handleCancel}
                  className="px-4 rounded-lg border border-signal-fail/40 text-signal-fail text-[13px] hover:bg-signal-fail/10 transition-colors"
                >
                  Stop
                </button>
              )}
            </div>
            {!form.environment && (
              <p className="text-[11.5px] text-ink-faint -mt-3">Select an environment to enable Run.</p>
            )}

            {runId && (
              <button
                onClick={() => navigate(`/runs/${runId}`)}
                className="text-[12px] font-mono text-signal-brand2 hover:text-white text-center"
              >
                view saved results for run #{runId} →
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {summary && (
              <div className="flex flex-wrap items-center gap-2">
                <SelectionBadge label="env" value={summary.environment} />
                <SelectionBadge label="suite" value={summary.tagExpression ?? "all"} />
                <SelectionBadge label="browser" value={summary.browser} />
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MiniStat label="total" value={summary.totalScenarios} />
                <MiniStat label="passed" value={summary.passedScenarios} accent="pass" />
                <MiniStat label="failed" value={summary.failedScenarios} accent="fail" />
                <MiniStat label="skipped" value={summary.skippedScenarios} accent="pending" />
                <MiniStat label="duration" value={summary.durationMs ? `${(summary.durationMs / 1000).toFixed(1)}s` : "—"} />
              </div>
            )}

            <div className="min-h-[480px] flex-1">
              {runId ? (
                <LogConsole runId={runId} live={isLive} staticLog={consoleLog} />
              ) : (
                <div className="glass-panel h-full min-h-[480px] flex items-center justify-center">
                  <p className="text-ink-faint text-[13px]">Console output will stream here once a run starts.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
          <div className="glass-panel p-5 flex flex-col gap-6 h-fit">
            <div className="flex flex-col gap-3">
              <StepLabel index={1} title="Environment" />
              <EnvironmentPicker value={vdEnvironment} onChange={setVdEnvironment} />
            </div>

            <div className="flex flex-col gap-3 pt-5 border-t border-base-border">
              <StepLabel index={2} title="Scenario" />
              <ScenarioPicker value={vdScenario} onChange={(s) => setVdScenario({ uri: s.uri, line: s.line })} />
            </div>

            <div className="pt-5 border-t border-base-border">
              <StepLabel index={3} title="Start Visual Debug" />
              <p className="text-[11.5px] font-mono text-ink-faint mt-2.5">
                Chromium · headless · one session — fixed for Visual Debug, not configurable.
              </p>
            </div>

            {vdError && <p className="text-signal-fail text-[12.5px] font-mono">{vdError}</p>}

            <button
              onClick={handleStartVisualDebug}
              disabled={!canStartVisualDebug}
              className="bg-signal-brand hover:bg-signal-brand2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-signal-brand active:scale-[0.98] transition-[background-color,transform] duration-150 ease-out-strong text-white font-medium text-[13.5px] rounded-lg py-2.5 shadow-glow"
            >
              {vdTriggering ? "Starting…" : "Start Visual Debug"}
            </button>
            {(!vdEnvironment || !vdScenario) && (
              <p className="text-[11.5px] text-ink-faint -mt-3">Select an environment and exactly one scenario to enable Start.</p>
            )}
          </div>

          <div className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[420px]">
            <div className="w-11 h-11 rounded-xl bg-signal-brand/10 border border-signal-brand/30 flex items-center justify-center mb-4">
              <TargetIcon className="w-5 h-5 text-signal-brand2" />
            </div>
            <p className="text-ink-primary text-[14px] font-medium max-w-sm">
              Visual Debug runs exactly one scenario, on its own.
            </p>
            <p className="text-ink-muted text-[12.5px] mt-2 max-w-sm">
              Starting will open a dedicated execution view with live step progress and
              logs — no other scenario runs alongside it, and no parallel workers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCard({
  active,
  title,
  description,
  onClick
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left p-4 rounded-xl border transition-colors duration-150 ease-out-strong ${
        active ? "bg-signal-brand/10 border-signal-brand" : "border-base-border hover:border-ink-faint"
      }`}
    >
      <p className={`text-[14px] font-display font-semibold ${active ? "text-white" : "text-ink-primary"}`}>{title}</p>
      <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">{description}</p>
    </button>
  );
}

function StepLabel({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 h-5 rounded-md bg-signal-brand/15 border border-signal-brand/40 text-signal-brand2 text-[10.5px] font-mono font-semibold flex items-center justify-center shrink-0">
        {index}
      </span>
      <p className="eyebrow">{title}</p>
    </div>
  );
}

function SelectionBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-base-border text-[11px] font-mono">
      <span className="text-ink-faint uppercase tracking-wider">{label}</span>
      <span className="text-ink-primary">{value}</span>
    </span>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
