import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function TagPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (expr: string) => void;
}) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [mode, setMode] = useState<"pick" | "raw">("pick");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    api.getTags().then(setAvailableTags).catch(() => setAvailableTags([]));
  }, []);

  function toggle(tag: string) {
    const next = selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag];
    setSelected(next);
    onChange(next.join(" or "));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="eyebrow">Tag filter</label>
        <button
          type="button"
          onClick={() => setMode(mode === "pick" ? "raw" : "pick")}
          className="text-[11px] font-mono text-signal-brand2 hover:text-white transition-colors"
        >
          {mode === "pick" ? "use raw expression" : "use tag picker"}
        </button>
      </div>

      {mode === "pick" ? (
        <div className="flex flex-wrap gap-2">
          {availableTags.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">No tags discovered in features/*.feature</p>
          )}
          {availableTags.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggle(tag)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-mono border transition-colors duration-150 ease-out-strong ${
                  active
                    ? "bg-signal-brand border-signal-brand text-white"
                    : "border-base-border text-ink-muted hover:border-ink-faint hover:text-ink-primary"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="@ui and not @wip"
          className="w-full bg-base-surface2 border border-base-border rounded-lg px-3.5 py-2.5 text-[13px] font-mono text-ink-primary placeholder:text-ink-faint focus:border-signal-brand/60 outline-none"
        />
      )}
      {mode === "pick" && selected.length > 0 && (
        <p className="mt-2 text-[11.5px] font-mono text-ink-faint">expression: {selected.join(" or ")}</p>
      )}
    </div>
  );
}
