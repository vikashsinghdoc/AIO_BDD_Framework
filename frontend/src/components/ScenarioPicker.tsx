import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { ScenarioCatalogEntry } from "../types";

/**
 * Single-select scenario list for Visual Debug — deliberately rendered as a radio
 * group of cards, not a multi-select control, so "only one scenario" is true by
 * construction. The backend still independently re-validates the selection (see
 * TestRunnerService.enqueueVisualDebug) rather than trusting this component alone.
 */
export default function ScenarioPicker({
  value,
  onChange
}: {
  value: { uri: string; line: number } | null;
  onChange: (scenario: ScenarioCatalogEntry) => void;
}) {
  const [scenarios, setScenarios] = useState<ScenarioCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .getScenarioCatalog()
      .then(setScenarios)
      .catch(() => setScenarios([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scenarios;
    return scenarios.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.uri.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [scenarios, query]);

  return (
    <div>
      <label className="eyebrow mb-2.5 block">Scenario</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, tag, or feature…"
        className="w-full bg-base-surface2 border border-base-border rounded-lg px-3.5 py-2.5 text-[13px] text-ink-primary placeholder:text-ink-faint outline-none focus:border-signal-brand/60 transition-colors duration-150 ease-out-strong mb-2.5"
      />
      {loading ? (
        <p className="text-[12.5px] text-ink-faint">Loading scenarios…</p>
      ) : scenarios.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">No scenarios found under engine/features.</p>
      ) : filtered.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">No scenarios match &quot;{query}&quot;.</p>
      ) : (
        <div role="radiogroup" aria-label="Scenario" className="max-h-[280px] overflow-y-auto flex flex-col gap-1.5 pr-1">
          {filtered.map((s) => {
            const active = value?.uri === s.uri && value?.line === s.line;
            return (
              <button
                key={`${s.uri}:${s.line}`}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(s)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors duration-150 ease-out-strong ${
                  active ? "bg-signal-brand border-signal-brand" : "border-base-border hover:border-ink-faint"
                }`}
              >
                <p className={`text-[13px] font-medium ${active ? "text-white" : "text-ink-primary"}`}>{s.name}</p>
                <p className={`text-[11px] font-mono mt-0.5 truncate ${active ? "text-white/70" : "text-ink-faint"}`}>
                  {s.uri.split("/").pop()}:{s.line} · {s.tags.join(" ") || "no tags"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
