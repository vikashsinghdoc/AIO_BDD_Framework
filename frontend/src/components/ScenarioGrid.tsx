import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ScenarioDto } from "../types";
import { StepStatusBadge } from "./StatusBadge";
import { api } from "../api/client";

const CARD_ACCENT: Record<string, string> = {
  PASSED: "border-l-signal-pass",
  FAILED: "border-l-signal-fail",
  SKIPPED: "border-l-signal-skip",
  PENDING: "border-l-signal-pending",
  UNDEFINED: "border-l-signal-pending",
  AMBIGUOUS: "border-l-signal-fail",
  UNKNOWN: "border-l-signal-skip"
};

function formatMs(ms: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ScenarioGrid({ scenarios, environment }: { scenarios: ScenarioDto[]; environment?: string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const navigate = useNavigate();

  function debugScenario(scenario: ScenarioDto, e: React.MouseEvent) {
    e.stopPropagation();
    if (!scenario.featureUri || scenario.line == null) return;
    const params = new URLSearchParams({ mode: "visual-debug", uri: scenario.featureUri, line: String(scenario.line) });
    if (environment) params.set("env", environment);
    navigate(`/run?${params.toString()}`);
  }

  if (scenarios.length === 0) {
    return (
      <div className="glass-panel p-10 text-center">
        <p className="text-ink-muted text-[13.5px]">No scenarios match the current filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const expanded = expandedId === scenario.id;
          return (
            <div
              key={scenario.id}
              className={`glass-panel border-l-[3px] ${CARD_ACCENT[scenario.status]} p-4 flex flex-col gap-3 cursor-pointer transition-transform hover:-translate-y-0.5`}
              onClick={() => setExpandedId(expanded ? null : scenario.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-mono text-ink-faint truncate">{scenario.featureName}</p>
                  <p className="text-[14px] font-medium text-ink-primary mt-0.5 leading-snug">{scenario.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StepStatusBadge status={scenario.status} />
                  {scenario.featureUri && scenario.line != null && (
                    <button
                      type="button"
                      onClick={(e) => debugScenario(scenario, e)}
                      className="text-[10.5px] font-mono text-signal-brand2 hover:text-white transition-colors duration-150 ease-out-strong"
                    >
                      debug →
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11.5px] font-mono text-ink-faint">
                <span>{formatMs(scenario.durationMs)}</span>
                <span className="flex gap-1.5 flex-wrap justify-end">
                  {scenario.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-signal-brand2">{t}</span>
                  ))}
                </span>
              </div>

              {scenario.errorMessage && !expanded && (
                <p className="text-[11.5px] text-signal-fail/90 font-mono line-clamp-2">{scenario.errorMessage}</p>
              )}

              {expanded && (
                <div className="pt-2 border-t border-base-border flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  {scenario.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-2 text-[12px]">
                      <StepStatusBadge status={step.status} />
                      <div className="min-w-0 flex-1">
                        <p className="text-ink-primary">
                          <span className="text-ink-faint">{step.keyword}</span>
                          {step.name}
                        </p>
                        {step.errorMessage && (
                          <pre className="mt-1 text-signal-fail/90 font-mono text-[11px] whitespace-pre-wrap break-words bg-signal-fail/5 border border-signal-fail/20 rounded-md p-2">
                            {step.errorMessage}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}

                  {scenario.attachments.length > 0 && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {scenario.attachments
                        .filter((a) => a.mimeType.startsWith("image/"))
                        .map((a) => (
                          <img
                            key={a.id}
                            src={api.attachmentUrl(a.id)}
                            alt="scenario attachment"
                            className="w-20 h-14 object-cover rounded-md border border-base-border hover:border-signal-brand/60 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightbox(a.id);
                            }}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
    </>
  );
}
