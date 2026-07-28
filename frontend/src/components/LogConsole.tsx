import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

function colorForLine(line: string): string {
  if (/\bfailed\b/i.test(line) || line.includes("!!!")) return "text-signal-fail";
  if (/\bpassed\b/i.test(line)) return "text-signal-pass";
  if (line.startsWith("$")) return "text-signal-brand2";
  if (line.startsWith("===")) return "text-ink-primary font-medium";
  return "text-ink-muted";
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
  const bottomRef = useRef<HTMLDivElement>(null);
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

  return (
    <div className="glass-panel console-scanlines overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-border">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-fail/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-signal-pending/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-signal-pass/60" />
          </span>
          <span className="eyebrow">run #{runId} console</span>
        </div>
        {live && (
          <span className={`text-[10.5px] font-mono uppercase tracking-wider ${connected ? "text-signal-pass" : "text-ink-faint"}`}>
            {connected ? "● live" : "○ closed"}
          </span>
        )}
      </div>
      <div
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed"
        onScroll={(e) => {
          const el = e.currentTarget;
          autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {lines.length === 0 && (
          <p className="text-ink-faint italic">Waiting for output…</p>
        )}
        {lines.map((line, idx) => (
          <div key={idx} className={colorForLine(line)}>
            {line || "\u00A0"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
