import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { EnvironmentSummary } from "../types";

export default function EnvironmentPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [environments, setEnvironments] = useState<EnvironmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEnvironments()
      .then(setEnvironments)
      .catch(() => setEnvironments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <label className="eyebrow mb-2.5 block">Environment</label>
      {loading ? (
        <p className="text-[12.5px] text-ink-faint">Loading environments…</p>
      ) : environments.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">
          No environments configured — add entries to engine/config/environments.yaml.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {environments.map((env) => {
            const active = value === env.name;
            return (
              <button
                type="button"
                key={env.name}
                onClick={() => onChange(env.name)}
                aria-pressed={active}
                className={`px-3.5 py-2 rounded-lg text-[12.5px] font-mono border transition-colors duration-150 ease-out-strong ${
                  active
                    ? "bg-signal-brand border-signal-brand text-white"
                    : "border-base-border text-ink-muted hover:border-ink-faint hover:text-ink-primary"
                }`}
              >
                {env.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
