import type { ExecutionStatus, RunStatus } from "../types";

const RUN_STYLES: Record<RunStatus, string> = {
  QUEUED: "bg-signal-pending/10 text-signal-pending border-signal-pending/30",
  RUNNING: "bg-signal-brand/10 text-signal-brand2 border-signal-brand/30",
  PASSED: "bg-signal-pass/10 text-signal-pass border-signal-pass/30",
  FAILED: "bg-signal-fail/10 text-signal-fail border-signal-fail/30",
  ERRORED: "bg-signal-fail/10 text-signal-fail border-signal-fail/30",
  CANCELLED: "bg-signal-skip/10 text-ink-muted border-signal-skip/30"
};

const STEP_STYLES: Record<ExecutionStatus, string> = {
  PASSED: "bg-signal-pass/10 text-signal-pass border-signal-pass/30",
  FAILED: "bg-signal-fail/10 text-signal-fail border-signal-fail/30",
  SKIPPED: "bg-signal-skip/10 text-ink-muted border-signal-skip/30",
  PENDING: "bg-signal-pending/10 text-signal-pending border-signal-pending/30",
  UNDEFINED: "bg-signal-pending/10 text-signal-pending border-signal-pending/30",
  AMBIGUOUS: "bg-signal-fail/10 text-signal-fail border-signal-fail/30",
  UNKNOWN: "bg-signal-skip/10 text-ink-muted border-signal-skip/30"
};

export function StatusBadge({ status, pulse = false }: { status: RunStatus; pulse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono uppercase tracking-wider ${RUN_STYLES[status]}`}
    >
      {pulse && status === "RUNNING" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-brand2 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-signal-brand2" />
        </span>
      )}
      {status}
    </span>
  );
}

export function StepStatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10.5px] font-mono uppercase tracking-wide ${STEP_STYLES[status]}`}>
      {status}
    </span>
  );
}
