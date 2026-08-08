import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { parseLine, type ParsedLine } from "../lib/logLine";

// Worker identity color palette — deliberately distinct from the semantic signal.*
// colors (brand/pass/fail/pending/skip) used for severity and status elsewhere, so a
// worker's color is never mistaken for a pass/fail/warning signal.
const WORKER_PALETTE = ["#60A5FA", "#F472B6", "#FB923C", "#38BDF8", "#A3E635", "#818CF8"];

interface WorkerGroup {
  workerId: string;
  scenario?: string;
  status: "running" | "passed" | "failed";
  firstTimestamp?: string;
  lastTimestamp?: string;
  lines: ParsedLine[];
}

function workerColor(workerId: string): string {
  let hash = 0;
  for (let i = 0; i < workerId.length; i++) hash = (hash * 31 + workerId.charCodeAt(i)) | 0;
  return WORKER_PALETTE[Math.abs(hash) % WORKER_PALETTE.length];
}

// Severity reuses the existing semantic signal colors — that's exactly what they
// already mean everywhere else in the app (fail=red, pending/warn=amber).
function severityClass(level?: string): string {
  if (level === "ERROR") return "text-signal-fail";
  if (level === "WARN") return "text-signal-pending";
  if (level === "DEBUG") return "text-ink-faint";
  return "text-ink-muted";
}

function fallbackColorForLine(line: string): string {
  if (/\bfailed\b/i.test(line) || line.includes("!!!")) return "text-signal-fail";
  if (/\bpassed\b/i.test(line)) return "text-signal-pass";
  if (line.startsWith("$")) return "text-signal-brand2";
  if (line.startsWith("===")) return "text-ink-primary font-medium";
  return "text-ink-muted";
}

function buildGroups(parsed: ParsedLine[]): { general: ParsedLine[]; workers: WorkerGroup[] } {
  const general: ParsedLine[] = [];
  const byWorker = new Map<string, WorkerGroup>();
  const order: string[] = [];

  for (const p of parsed) {
    if (!p.workerId) {
      general.push(p);
      continue;
    }
    if (!byWorker.has(p.workerId)) {
      byWorker.set(p.workerId, { workerId: p.workerId, status: "running", lines: [] });
      order.push(p.workerId);
    }
    const group = byWorker.get(p.workerId)!;
    group.lines.push(p);
    if (p.scenario && !group.scenario) group.scenario = p.scenario;
    if (!group.firstTimestamp) group.firstTimestamp = p.timestamp;
    group.lastTimestamp = p.timestamp;
    if (p.message?.startsWith("Scenario finished: PASSED")) group.status = "passed";
    else if (p.message?.startsWith("Scenario finished: FAILED")) group.status = "failed";
  }

  return { general, workers: order.map((id) => byWorker.get(id)!) };
}

function WorkerBadge({ workerId }: { workerId: string }) {
  const color = workerColor(workerId);
  return (
    <span
      className="shrink-0 px-1.5 py-[1px] rounded text-[10.5px] font-semibold leading-normal"
      style={{ color, border: `1px solid ${color}55`, backgroundColor: `${color}1a` }}
    >
      WORKER {workerId}
    </span>
  );
}

function LineRow({ parsed }: { parsed: ParsedLine }) {
  if (!parsed.workerId) {
    return <div className={fallbackColorForLine(parsed.raw)}>{parsed.raw || " "}</div>;
  }
  return (
    <div className="flex items-start gap-2 py-[1px]">
      {parsed.timestamp && <span className="text-ink-faint shrink-0">{parsed.timestamp}</span>}
      <WorkerBadge workerId={parsed.workerId} />
      {parsed.level && (
        <span className={`shrink-0 text-[10.5px] font-semibold ${severityClass(parsed.level)}`}>{parsed.level}</span>
      )}
      {parsed.scenario && (
        <span className="text-signal-brand2 shrink-0 truncate max-w-[180px]">{parsed.scenario}</span>
      )}
      <span className="text-ink-primary break-words min-w-0">{parsed.message}</span>
    </div>
  );
}

function statusDotClass(status: WorkerGroup["status"]): string {
  if (status === "passed") return "bg-signal-pass";
  if (status === "failed") return "bg-signal-fail";
  return "bg-signal-pending";
}

function WorkerSection({ group, defaultOpen }: { group: WorkerGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = workerColor(group.workerId);
  return (
    <div className="border border-base-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 bg-base-surface2/60 hover:bg-base-surface2 transition-colors duration-150 ease-out-strong text-left"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(group.status)}`} style={{ boxShadow: `0 0 0 1px ${color}` }} />
        <WorkerBadge workerId={group.workerId} />
        {group.scenario && <span className="text-[12px] text-ink-primary truncate">{group.scenario}</span>}
        <span className="ml-auto text-[10.5px] font-mono text-ink-faint shrink-0">
          {group.lines.length} line{group.lines.length === 1 ? "" : "s"}
          {group.firstTimestamp ? ` · ${group.firstTimestamp}–${group.lastTimestamp}` : ""}
        </span>
        <span className="text-ink-faint text-[11px] shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-3 py-2 flex flex-col gap-0.5 border-t border-base-border">
          {group.lines.map((line, idx) => (
            <LineRow key={idx} parsed={line} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogConsole({
  runId,
  live,
  staticLog
}: {
  runId: number;
  live: boolean;
  staticLog?: string | null;
}) {
  const [lines, setLines] = useState<string[]>(staticLog ? staticLog.split("\n") : []);
  const [connected, setConnected] = useState(false);
  const [groupByWorker, setGroupByWorker] = useState(false);
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  useEffect(() => {
    if (!live) {
      setLines(staticLog ? staticLog.split("\n") : []);
      return;
    }

    setLines([]);
    const source = new EventSource(api.streamUrl(runId));
    setConnected(true);

    source.addEventListener("log", (event) => {
      const chunk = (event as MessageEvent).data as string;
      setLines((prev) => [...prev, ...chunk.split("\n")]);
    });

    source.addEventListener("done", () => {
      setConnected(false);
      source.close();
    });

    source.onerror = () => {
      setConnected(false);
      source.close();
    };

    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, live]);

  useEffect(() => {
    if (autoScroll.current) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const parsedLines = useMemo(() => lines.map(parseLine), [lines]);
  const workerIds = useMemo(
    () => Array.from(new Set(parsedLines.map((p) => p.workerId).filter((w): w is string => !!w))).sort(),
    [parsedLines]
  );
  const filteredLines = useMemo(
    () => (workerFilter === "all" ? parsedLines : parsedLines.filter((p) => p.workerId === workerFilter || !p.workerId)),
    [parsedLines, workerFilter]
  );
  const groups = useMemo(() => buildGroups(filteredLines), [filteredLines]);

  function resumeAutoScroll() {
    autoScroll.current = true;
    setAutoScrollPaused(false);
    bottomRef.current?.scrollIntoView({ block: "end" });
  }

  return (
    <div className="relative glass-panel console-scanlines overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-base-border flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-fail/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-signal-pending/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-signal-pass/60" />
          </span>
          <span className="eyebrow">run #{runId} console</span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {workerIds.length > 1 && (
            <>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="bg-base-surface2 border border-base-border rounded-md px-2 py-1 text-ink-muted text-[11px] outline-none focus:border-signal-brand/60 transition-colors duration-150"
              >
                <option value="all">All workers</option>
                {workerIds.map((id) => (
                  <option key={id} value={id}>
                    Worker {id}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setGroupByWorker((v) => !v)}
                className={`px-2 py-1 rounded-md border text-[11px] font-mono transition-colors duration-150 ease-out-strong ${
                  groupByWorker
                    ? "bg-signal-brand border-signal-brand text-white"
                    : "border-base-border text-ink-muted hover:text-ink-primary"
                }`}
              >
                Group by worker
              </button>
            </>
          )}
          {live && (
            <span className={`font-mono uppercase tracking-wider ${connected ? "text-signal-pass" : "text-ink-faint"}`}>
              {connected ? "● live" : "○ closed"}
            </span>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
          autoScroll.current = atBottom;
          setAutoScrollPaused(!atBottom && live);
        }}
      >
        {filteredLines.length === 0 && <p className="text-ink-faint italic">Waiting for output…</p>}

        {groupByWorker ? (
          <div className="flex flex-col gap-2">
            {groups.general.length > 0 && (
              <div className="flex flex-col gap-0.5 mb-1">
                {groups.general.map((line, idx) => (
                  <LineRow key={idx} parsed={line} />
                ))}
              </div>
            )}
            {groups.workers.map((group) => (
              <WorkerSection key={group.workerId} group={group} defaultOpen={group.status !== "running" || groups.workers.length <= 4} />
            ))}
          </div>
        ) : (
          filteredLines.map((line, idx) => <LineRow key={idx} parsed={line} />)
        )}
        <div ref={bottomRef} />
      </div>

      {autoScrollPaused && (
        <button
          type="button"
          onClick={resumeAutoScroll}
          className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-signal-brand text-white text-[11.5px] font-medium shadow-glow transition-transform duration-150 ease-out-strong active:scale-95"
        >
          ↓ Resume auto-scroll
        </button>
      )}
    </div>
  );
}
