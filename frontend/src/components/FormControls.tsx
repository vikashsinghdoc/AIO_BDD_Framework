export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="eyebrow">{label}</label>
        {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-base-surface2 border border-base-border rounded-lg px-3.5 py-2.5 text-[13px] text-ink-primary outline-none focus:border-signal-brand/60 appearance-none cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
      <span
        className={`relative w-10 h-[22px] rounded-full transition-colors ${
          checked ? "bg-signal-brand" : "bg-base-surface2 border border-base-border"
        }`}
      >
        <span
          className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[21px]" : "translate-x-[3px]"
          }`}
        />
      </span>
      <span className="text-[13px] text-ink-primary group-hover:text-white">{label}</span>
    </button>
  );
}

export function NumberInput({ value, onChange, min = 1, max = 16 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
      className="w-full bg-base-surface2 border border-base-border rounded-lg px-3.5 py-2.5 text-[13px] text-ink-primary outline-none focus:border-signal-brand/60"
    />
  );
}

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-base-surface2 border border-base-border rounded-lg px-3.5 py-2.5 text-[13px] font-mono text-ink-primary placeholder:text-ink-faint outline-none focus:border-signal-brand/60"
    />
  );
}
