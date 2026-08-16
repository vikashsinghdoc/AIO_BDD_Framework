import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { parseLine } from "../lib/logLine";

interface TickerItem {
  id: number;
  workerId?: string;
  scenario: string;
  passed: boolean;
}

const MAX_ITEMS = 14;

// A second, independent SSE subscription to the same run — consistent with the
// existing pattern of multiple live listeners per run (LogConsole + Visual
// Debug's step checklist both already do this; LogBroadcastService supports any
// number of subscribers per run id). Only extracts scenario-level PASS/FAIL
// events ("Scenario finished: ...") rather than every step, so the ticker reads
// as headlines, not a duplicate of the console.
export default function TestTicker({ runId, live }: { runId: number; live: boolean }) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    if (!live) return;
    setItems([]);
    const source = new EventSource(api.streamUrl(runId));

    source.addEventListener("log", (event) => {
      const chunk = (event as MessageEvent).data as string;
      for (const raw of chunk.split("\n")) {
        const parsed = parseLine(raw);
        if (!parsed.message || !parsed.scenario) continue;
        const match = /^Scenario finished: (PASSED|FAILED)/.exec(parsed.message);
        if (!match) continue;
        counter.current += 1;
        const item: TickerItem = {
          id: counter.current,
          workerId: parsed.workerId,
          scenario: parsed.scenario,
          passed: match[1] === "PASSED"
        };
        setItems((prev) => [...prev.slice(-(MAX_ITEMS - 1)), item]);
      }
    });

    source.addEventListener("done", () => source.close());
    source.onerror = () => source.close();
    return () => source.close();
  }, [runId, live]);

  if (!live) return null;

  const track = (keyPrefix: string) => (
    <div className="flex items-center gap-6 pr-6 shrink-0" aria-hidden={keyPrefix === "b"}>
      {items.length === 0 ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
          Awaiting first scenario result…
        </span>
      ) : (
        items.map((item) => (
          <span key={`${keyPrefix}-${item.id}`} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] shrink-0">
            <span className={item.passed ? "text-signal-pass" : "text-signal-fail"}>
              {item.passed ? "PASS" : "FAIL"}
            </span>
            {item.workerId && <span className="text-aurora-iris">W{item.workerId}</span>}
            <span className="text-ink-muted normal-case tracking-normal">{item.scenario}</span>
            <span className="text-ink-faint">•</span>
          </span>
        ))
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-base-border bg-base-surface/80 px-3 py-2">
      <span className="flex items-center gap-1.5 shrink-0 font-mono text-[10.5px] font-semibold uppercase tracking-[0.15em] text-signal-fail">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-fail opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-signal-fail" />
        </span>
        Live
      </span>
      <div className="ticker-viewport flex-1 min-w-0">
        <div className="ticker-track flex w-max">
          {track("a")}
          {track("b")}
        </div>
      </div>
    </div>
  );
}
