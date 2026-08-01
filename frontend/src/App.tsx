import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RunTest from "./pages/RunTest";
import History from "./pages/History";
import RunDetailPage from "./pages/RunDetail";
import StepsExplorer from "./pages/StepsExplorer";

const navItems = [
  { to: "/", label: "Mission Control", icon: RadarIcon, end: true },
  { to: "/run", label: "Run Tests", icon: BoltIcon },
  { to: "/history", label: "History", icon: ClockIcon },
  { to: "/explorer", label: "Steps Explorer", icon: GridIcon }
];

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-[240px] shrink-0 border-r border-base-border/80 flex flex-col">
        <div className="px-6 py-7">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-signal-brand to-signal-brand2 shadow-glow flex items-center justify-center">
              <span className="text-[13px] font-display font-bold text-white">T</span>
            </div>
            <div>
              <p className="font-display font-semibold text-[15px] leading-none">Test Ops</p>
              <p className="text-[11px] text-ink-faint font-mono mt-1">console v1.0</p>
            </div>
          </div>
        </div>

        <nav className="px-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? "bg-signal-brand/15 text-white shadow-glow"
                    : "text-ink-muted hover:text-ink-primary hover:bg-base-surface2"
                }`
              }
            >
              <item.icon className="w-[17px] h-[17px]" />
              {item.label}
            </NavLink>
          ))}

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-ink-muted hover:text-ink-primary hover:bg-base-surface2 transition-colors"
          >
            <GrafanaIcon className="w-[17px] h-[17px]" />
            Grafana
            <span className="ml-auto text-[10px] text-ink-faint">↗</span>
          </a>
        </nav>

        <div className="mt-auto px-4 py-5">
          <div className="glass-panel px-3.5 py-3 flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-pass opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-pass"></span>
            </span>
            <span className="text-[11.5px] font-mono text-ink-muted">engine online</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/run" element={<RunTest />} />
          <Route path="/history" element={<History />} />
          <Route path="/runs/:id" element={<RunDetailPage />} />
          <Route path="/explorer" element={<StepsExplorer />} />
        </Routes>
      </main>
    </div>
  );
}

function RadarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" opacity="0.5" />
      <path d="M12 12 L18 7" />
    </svg>
  );
}
function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M13 2 L4 14h6l-1 8 9-12h-6z" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function GrafanaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
