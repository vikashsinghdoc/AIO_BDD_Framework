export default function StatCard({
  label,
  value,
  accent = "brand",
  suffix
}: {
  label: string;
  value: string | number;
  accent?: "brand" | "pass" | "fail" | "pending";
  suffix?: string;
}) {
  const accentClass = {
    brand: "text-signal-brand2",
    pass: "text-signal-pass",
    fail: "text-signal-fail",
    pending: "text-signal-pending"
  }[accent];

  return (
    <div className="glass-panel p-5">
      <p className="eyebrow">{label}</p>
      <p className={`font-display text-[32px] font-semibold mt-2 ${accentClass}`}>
        {value}
        {suffix && <span className="text-[16px] text-ink-faint ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
