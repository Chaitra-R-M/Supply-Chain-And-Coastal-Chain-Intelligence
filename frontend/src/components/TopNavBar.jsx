import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart3,
  Bell,
  Boxes,
  Compass,
  Container,
  Gauge,
  LayoutDashboard,
  Moon,
  Navigation,
  RefreshCw,
  Ship,
  Sun,
  TrendingUp,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'vessels', label: 'Vessel Traffic', icon: Ship },
  { id: 'berths', label: 'Berth Management', icon: Anchor },
  { id: 'cargo', label: 'Cargo Operations', icon: Container },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp },
  { id: 'congestion', label: 'Port Congestion', icon: Gauge },
  { id: 'risks', label: 'Risk and Weather', icon: AlertTriangle },
  { id: 'routes', label: 'Coastal Routes', icon: Compass },
  { id: 'reports', label: 'Analytics and Reports', icon: BarChart3 },
];

export default function TopNavBar({
  activeTab,
  onSelectTab,
  ports,
  selectedPortId,
  onSelectPort,
  theme,
  onToggleTheme,
  alerts = [],
  onSimulateTick,
  simulating,
}) {
  const [alertsOpen, setAlertsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-deep-space-blue-800/80 bg-deep-space-blue-900 text-ink-black-50 shadow-md dark:bg-ink-black-950 dark:border-deep-space-blue-800">
      {/* Top Utility Row */}
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Brand & Role */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-black-500/25 border border-ink-black-400/40 text-eggshell-300">
            <Ship className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-ink-black-50 sm:text-base">
                Coastal Chain Intelligence
              </span>
              <span className="hidden rounded-full border border-eggshell-500/40 bg-eggshell-500/15 px-2 py-0.5 text-[11px] font-semibold text-eggshell-200 sm:inline-flex items-center gap-1">
                <Anchor className="h-3 w-3" /> Port Authority
              </span>
            </div>
            <p className="hidden text-[11px] text-blue-slate-300 md:block">
              Supply Chain &amp; Maritime Operations Command
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Port Selector */}
          <select
            aria-label="Select Port"
            value={selectedPortId}
            onChange={(e) => onSelectPort(e.target.value)}
            className="rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/90 px-3 py-1.5 text-xs font-medium text-ink-black-50 focus:border-ink-black-400 focus:outline-none sm:text-sm"
          >
            {ports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          {/* Live Indicator */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/70 px-2.5 py-1.5 text-xs font-medium text-blue-slate-100 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span>Live (UTC+5:30)</span>
          </div>

          {/* Simulate AIS Movement Button */}
          <button
            type="button"
            onClick={onSimulateTick}
            disabled={simulating}
            title="Simulate live vessel movement & AIS telemetry tick"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-black-400/50 bg-ink-black-500/25 px-2.5 py-1.5 text-xs font-medium text-ink-black-50 transition hover:bg-ink-black-500/40 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Simulate AIS</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle Light or Dark Theme"
            className="inline-flex items-center gap-1.5 rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/80 px-2.5 py-1.5 text-xs font-medium text-eggshell-200 transition hover:bg-deep-space-blue-700"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-eggshell-300" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-ink-black-200" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAlertsOpen((o) => !o)}
              aria-label="Active Alerts"
              className="relative rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/80 p-1.5 text-blue-slate-100 transition hover:bg-deep-space-blue-700"
            >
              <Bell className="h-4 w-4" />
              {alerts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </button>

            {alertsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-dusty-denim-200 bg-white p-3 text-ink-black-900 shadow-xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-ink-black-50">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-dusty-denim-600 dark:text-blue-slate-300">
                    Active Alerts ({alerts.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertsOpen(false);
                      onSelectTab('risks');
                    }}
                    className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">No active alerts.</p>
                  ) : (
                    alerts.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="rounded-lg border border-dusty-denim-100 bg-dusty-denim-50 p-2 text-xs dark:border-deep-space-blue-800 dark:bg-ink-black-950/60"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="truncate pr-2">{a.title}</span>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                              a.severity === 'High' || a.severity === 'Critical'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                : 'bg-eggshell-500/20 text-eggshell-700 dark:text-eggshell-300'
                            }`}
                          >
                            {a.severity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-dusty-denim-600 dark:text-blue-slate-300">
                          {a.affected_entity}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Pill */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/80 px-2.5 py-1.5 text-xs font-medium text-blue-slate-100 xl:flex">
            <Navigation className="h-3.5 w-3.5 text-eggshell-400" />
            <span>Port Authority</span>
          </div>
        </div>
      </div>

      {/* Horizontal Navigation Bar (Replaces Sidebar with all 10 Dashboard Headers) */}
      <nav
        aria-label="Port Authority Navigation"
        className="border-t border-deep-space-blue-800/80 bg-deep-space-blue-950/90 dark:bg-ink-black-900/90"
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-1.5 no-scrollbar sm:px-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`group flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-ink-black-500 text-white shadow-sm shadow-ink-black-500/30 dark:bg-ink-black-500'
                    : 'text-blue-slate-200 hover:bg-deep-space-blue-800/80 hover:text-white dark:text-blue-slate-300 dark:hover:bg-deep-space-blue-800'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    active ? 'text-eggshell-200' : 'text-blue-slate-400 group-hover:text-eggshell-300'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
