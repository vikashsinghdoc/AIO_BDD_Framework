import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RunTest from "./pages/RunTest";
import History from "./pages/History";
import RunDetailPage from "./pages/RunDetail";
import StepsExplorer from "./pages/StepsExplorer";
import VisualDebugView from "./pages/VisualDebugView";

const navItems = [
  { to: "/", label: "Mission Control", icon: RadarIcon, end: true },
  { to: "/run", label: "Run Tests", icon: BoltIcon },
  { to: "/history", label: "History", icon: ClockIcon },
  { to: "/explorer", label: "Steps Explorer", icon: GridIcon }
];

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-[264px] shrink-0 border-r border-base-border/80 flex flex-col">
        <div className="px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-base-surface2 border border-base-border shrink-0 flex items-center justify-center">
              <MarkIcon className="w-[19px] h-[19px]" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[16px] leading-none">TestGenie</p>
              <p className="text-[10px] font-mono text-ink-faint leading-snug mt-1.5">
                AI-Powered Test Automation &amp; Intelligence
              </p>
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
                `flex items-center gap-3 pl-[10px] pr-3 py-2.5 rounded-xl text-[13.5px] font-medium border-l-2 transition-colors duration-150 ease-out-strong ${
                  isActive
                    ? "bg-signal-brand/10 border-signal-brand text-white"
                    : "border-transparent text-ink-muted hover:text-ink-primary hover:bg-base-surface2"
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
            className="flex items-center gap-3 pl-[10px] pr-3 py-2.5 rounded-xl text-[13.5px] font-medium border-l-2 border-transparent text-ink-muted hover:text-ink-primary hover:bg-base-surface2 transition-colors duration-150 ease-out-strong"
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
          <Route path="/visual-debug/:id" element={<VisualDebugView />} />
        </Routes>
      </main>
    </div>
  );
}

function MarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <defs>
        <linearGradient id="mark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <path d="M16 7 L23 11 V21 L16 25 L9 21 V11 Z" stroke="url(#mark-gradient)" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.2" fill="url(#mark-gradient)" />
    </svg>
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
