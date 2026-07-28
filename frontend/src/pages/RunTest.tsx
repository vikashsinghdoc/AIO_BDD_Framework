import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { RunRequest } from "../types";
import TagPicker from "../components/TagPicker";
import { Field, Select, Toggle, NumberInput, TextInput } from "../components/FormControls";
import LogConsole from "../components/LogConsole";
import { StatusBadge } from "../components/StatusBadge";

const DEFAULTS: RunRequest = {
  tagExpression: "",
  browser: "chromium",
  headless: true,
  parallelWorkers: 1,
  screenshotMode: "only-on-failure",
  videoMode: "off",
  traceMode: "off",
  baseUrl: "",
  apiBaseUrl: "",
  triggeredBy: "web-ui"
};

export default function RunTest() {
  const [form, setForm] = useState<RunRequest>(DEFAULTS);
  const [runId, setRunId] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function update<K extends keyof RunRequest>(key: K, value: RunRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTrigger() {
    setError(null);
    setStatus("starting");
    try {
      const run = await api.triggerRun(form);
      setRunId(run.id);
      setStatus("running");
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
    }
  }

  async function handleCancel() {
    if (!runId) return;
    await api.cancelRun(runId);
  }

  return (
    <div className="p-8 max-w-[1500px]">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-1.5">launch</p>
          <h1 className="text-[26px] font-semibold">Run Tests</h1>
          <p className="text-ink-muted text-[13.5px] mt-1">
            Configure the suite and trigger it against the Playwright + Cucumber engine.
          </p>
        </div>
        {runId && <StatusBadge status={status === "running" ? "RUNNING" : "PASSED"} pulse />}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        <div className="glass-panel p-5 flex flex-col gap-6 h-fit">
          <TagPicker value={form.tagExpression} onChange={(v) => update("tagExpression", v)} />

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

          <Field label="Base URL" hint="optional override">
            <TextInput value={form.baseUrl} onChange={(v) => update("baseUrl", v)} placeholder="https://demowebshop.tricentis.com" />
          </Field>

          <Field label="API base URL" hint="optional override">
            <TextInput value={form.apiBaseUrl} onChange={(v) => update("apiBaseUrl", v)} placeholder="https://your-api.example.com" />
          </Field>

          {error && <p className="text-signal-fail text-[12.5px] font-mono">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTrigger}
              disabled={status === "starting" || status === "running"}
              className="flex-1 bg-signal-brand hover:bg-signal-brand2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white font-medium text-[13.5px] rounded-lg py-2.5 shadow-glow"
            >
              {status === "running" ? "Running…" : "Run suite"}
            </button>
            {status === "running" && (
              <button
                onClick={handleCancel}
                className="px-4 rounded-lg border border-signal-fail/40 text-signal-fail text-[13px] hover:bg-signal-fail/10 transition-colors"
              >
                Stop
              </button>
            )}
          </div>

          {runId && (
            <button
              onClick={() => navigate(`/runs/${runId}`)}
              className="text-[12px] font-mono text-signal-brand2 hover:text-white text-center"
            >
              view saved results for run #{runId} →
            </button>
          )}
        </div>

        <div className="min-h-[560px]">
          {runId ? (
            <LogConsole runId={runId} live={status === "running"} />
          ) : (
            <div className="glass-panel h-full flex items-center justify-center">
              <p className="text-ink-faint text-[13px]">Console output will stream here once a run starts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
