export default function MiniStat({
  label,
  value,
  accent
}: {
  label: string;
  value: string | number;
  accent?: "pass" | "fail" | "pending";
}) {
  const color =
    accent === "pass" ? "text-signal-pass" : accent === "fail" ? "text-signal-fail" : accent === "pending" ? "text-signal-pending" : "text-ink-primary";
  return (
    <div className="glass-panel px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className={`font-display text-[20px] font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
