import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { api } from "../api/client";
import type { DashboardStats } from "../types";
import StatCard from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => api.getDashboard().then(setStats).catch((e) => setError(e.message));
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="eyebrow mb-1.5">telemetry / overview</p>
        <h1 className="text-[26px] font-semibold">Mission Control</h1>
        <p className="text-ink-muted text-[13.5px] mt-1">
          Live status of the Playwright + Cucumber suite, aggregated from every run in Postgres.
        </p>
      </header>

      {error && <p className="text-signal-fail text-[13px] mb-4">{error}</p>}

      {!stats ? (
        <p className="text-ink-faint text-[13px]">Loading telemetry…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total runs" value={stats.totalRuns} />
            <StatCard label="Passed (recent)" value={stats.passedRuns} accent="pass" />
            <StatCard label="Failed (recent)" value={stats.failedRuns} accent="fail" />
            <StatCard label="Pass rate (recent)" value={stats.overallPassRate.toFixed(1)} suffix="%" accent="pending" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="glass-panel p-5 lg:col-span-2">
              <p className="eyebrow mb-4">pass rate trend — last {stats.passRateTrend.length} runs</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.passRateTrend}>
                  <CartesianGrid stroke="#1B212B" vertical={false} />
                  <XAxis dataKey="runLabel" stroke="#57607A" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#57607A" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#12161D", border: "1px solid #232A36", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#8992A6" }}
                  />
                  <Line type="monotone" dataKey="passRate" stroke="#7C5CFF" strokeWidth={2} dot={{ r: 3, fill: "#7C5CFF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel p-5">
              <p className="eyebrow mb-4">failures by tag</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(stats.failuresByTag).map(([tag, count]) => ({ tag, count }))}>
                  <CartesianGrid stroke="#1B212B" vertical={false} />
                  <XAxis dataKey="tag" stroke="#57607A" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#57607A" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#12161D", border: "1px solid #232A36", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#FB5A6E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {Object.keys(stats.failuresByTag).length === 0 && (
                <p className="text-ink-faint text-[12px] text-center mt-6">No failures in recent runs 🎉</p>
              )}
            </div>
          </div>

          <div className="glass-panel">
            <div className="flex items-center justify-between px-5 py-4 border-b border-base-border">
              <p className="eyebrow">recent runs</p>
              <Link to="/history" className="text-[12px] font-mono text-signal-brand2 hover:text-white">
                view full history →
              </Link>
            </div>
            <div className="divide-y divide-base-border">
              {stats.recentRuns.slice(0, 8).map((run) => (
                <Link
                  key={run.id}
                  to={`/runs/${run.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-base-surface2/60 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-[12px] text-ink-faint w-10">#{run.id}</span>
                    <StatusBadge status={run.status} pulse />
                    <span className="text-[11px] font-mono text-signal-brand2 shrink-0">{run.environment}</span>
                    <span className="text-[13px] text-ink-primary truncate max-w-[280px]">
                      {run.tagExpression ?? "all scenarios"}
                    </span>
                  </div>
                  <div className="flex items-center gap-5 text-[12px] font-mono text-ink-faint">
                    <span className="text-signal-pass">{run.passedScenarios}✓</span>
                    <span className="text-signal-fail">{run.failedScenarios}✕</span>
                    <span>{formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
              {stats.recentRuns.length === 0 && (
                <p className="px-5 py-8 text-center text-ink-faint text-[13px]">No runs yet — trigger one from Run Tests.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
