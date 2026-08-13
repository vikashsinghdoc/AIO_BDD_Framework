import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

export default function StatCard({
  label,
  value,
  accent = "brand",
  suffix,
  className = ""
}: {
  label: string;
  value: string | number;
  accent?: "brand" | "pass" | "fail" | "pending";
  suffix?: string;
  className?: string;
}) {
  const valueRef = useRef<HTMLSpanElement>(null);

  const accentClass = {
    brand: "text-aurora-iris",
    pass: "text-signal-pass",
    fail: "text-signal-fail",
    pending: "text-signal-pending"
  }[accent];

  const dotClass = {
    brand: "bg-aurora-violet",
    pass: "bg-signal-pass",
    fail: "bg-signal-fail",
    pending: "bg-signal-pending"
  }[accent];

  const numeric = typeof value === "number" ? value : parseFloat(value);
  const isNumeric = !isNaN(numeric);
  const decimals = String(value).includes(".") ? 1 : 0;

  // Counts up from 0 whenever the target changes (mount, or a later poll
  // landing a different number) — a plain object tween via onUpdate, not a
  // DOM-style tween, so it doesn't share the opacity/transform StrictMode
  // pitfall the entrance timelines hit; overwrite:true keeps re-triggers clean.
  useEffect(() => {
    if (!isNumeric || !valueRef.current) return;
    const obj = { val: 0 };
    const el = valueRef.current;
    gsap.to(obj, {
      val: numeric,
      duration: 1.1,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => {
        el.textContent = obj.val.toFixed(decimals);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric, isNumeric, decimals]);

  return (
    <div
      className={`glass-panel-hero p-5 overflow-hidden transition-[transform,box-shadow] duration-200 ease-out-strong hover:-translate-y-0.5 hover:shadow-glowCyan group ${className}`}
    >
      <span
        className={`absolute -top-6 -right-6 w-16 h-16 rounded-full ${dotClass} opacity-20 blur-2xl transition-opacity duration-200 group-hover:opacity-35`}
      />
      <p className="eyebrow relative">{label}</p>
      <p className={`font-display text-[40px] font-bold mt-2 relative ${accentClass}`}>
        <span ref={valueRef}>{isNumeric ? "0" : value}</span>
        {suffix && <span className="text-[18px] text-ink-faint ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
