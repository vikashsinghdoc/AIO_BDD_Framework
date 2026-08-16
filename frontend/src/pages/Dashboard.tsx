import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { api } from "../api/client";
import type { DashboardStats } from "../types";
import StatCard from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { gsap, useGSAP } from "../lib/gsap";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Flips true exactly once, the first time stats loads. useGSAP depends on this
  // instead of `stats` itself — `stats` gets a new object reference every 8s poll,
  // which would otherwise re-fire the effect on every tick: GSAP reverts (kills)
  // the in-flight timeline on cleanup, and since the animation should only ever
  // play once, nothing replaces it — leaving elements stuck mid-reveal. `ready`
  // never changes back to false, so the effect fires exactly once.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () =>
      api
        .getDashboard()
        .then((data) => {
          setStats(data);
          setReady(true);
        })
        .catch((e) => setError(e.message));
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useGSAP(
    () => {
      if (!ready) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".dash-eyebrow", { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(".dash-title", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.35")
        .fromTo(".dash-subtitle", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.45")
        .fromTo(".dash-stat-card", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=0.3")
        .fromTo(".dash-chart-panel", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, "-=0.35")
        .fromTo(".dash-recent-panel", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
        .fromTo(".dash-run-row", { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.05 }, "-=0.3");
    },
    { dependencies: [ready], scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative p-8">
      <header className="mb-8 relative">
        <p className="eyebrow dash-eyebrow mb-2">telemetry / overview</p>
        <h1 className="dash-title text-[56px] md:text-[68px] leading-[0.95] font-display font-bold uppercase tracking-tight text-gradient-aurora animate-auroraDrift">
          Mission Control
        </h1>
        <p className="dash-subtitle text-ink-muted text-[13.5px] mt-3 max-w-xl">
          Live status of the Playwright + Cucumber suite, aggregated from every run in Postgres.
        </p>
      </header>

      <div className="section-divider mb-8 relative" />

      {error && <p className="text-signal-fail text-[13px] mb-4 relative">{error}</p>}

      {!stats ? (
        <p className="text-ink-faint text-[13px] relative">Loading telemetry…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative">
            <StatCard className="dash-stat-card" label="Total runs" value={stats.totalRuns} />
            <StatCard className="dash-stat-card" label="Passed (recent)" value={stats.passedRuns} accent="pass" />
            <StatCard className="dash-stat-card" label="Failed (recent)" value={stats.failedRuns} accent="fail" />
            <StatCard
              className="dash-stat-card"
              label="Pass rate (recent)"
              value={stats.overallPassRate.toFixed(1)}
              suffix="%"
              accent="pending"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 relative">
            <div className="dash-chart-panel glass-panel-hero p-5 lg:col-span-2">
              <p className="eyebrow mb-4">pass rate trend — last {stats.passRateTrend.length} runs</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.passRateTrend}>
                  <defs>
                    <linearGradient id="aurora-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7C5CFF" />
                      <stop offset="100%" stopColor="#2FE6E0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E2438" vertical={false} />
                  <XAxis dataKey="runLabel" stroke="#535C77" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#535C77" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#0F1220", border: "1px solid #232A45", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#8A93AC" }}
                  />
                  <Line type="monotone" dataKey="passRate" stroke="url(#aurora-line)" strokeWidth={2.5} dot={{ r: 3, fill: "#7C5CFF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-chart-panel glass-panel-hero p-5">
              <p className="eyebrow mb-4">failures by tag</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(stats.failuresByTag).map(([tag, count]) => ({ tag, count }))}>
                  <CartesianGrid stroke="#1E2438" vertical={false} />
                  <XAxis dataKey="tag" stroke="#535C77" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#535C77" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0F1220", border: "1px solid #232A45", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#FB5A6E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {Object.keys(stats.failuresByTag).length === 0 && (
                <p className="text-ink-faint text-[12px] text-center mt-6">No failures in recent runs 🎉</p>
              )}
            </div>
          </div>

          <div className="section-divider mb-6 relative" />

          <div className="dash-recent-panel glass-panel-hero relative">
            <div className="flex items-center justify-between px-5 py-4 border-b border-base-border">
              <p className="eyebrow">recent runs</p>
              <Link to="/history" className="text-[12px] font-mono text-aurora-cyan hover:text-white transition-colors">
                view full history →
              </Link>
            </div>
            <div className="divide-y divide-base-border">
              {stats.recentRuns.slice(0, 8).map((run) => (
                <Link
                  key={run.id}
                  to={`/runs/${run.id}`}
                  className="dash-run-row flex items-center justify-between px-5 py-3.5 hover:bg-base-surface2/60 hover:translate-x-1 transition-[background-color,transform] duration-150 ease-out-strong"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-[12px] text-ink-faint w-10">#{run.id}</span>
                    <StatusBadge status={run.status} pulse />
                    <span className="text-[11px] font-mono text-aurora-iris shrink-0">{run.environment}</span>
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
