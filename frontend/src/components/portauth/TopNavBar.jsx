import React, { useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  BarChart3,
  Bell,
  Boxes,
  Compass,
  Container,
  Gauge,
  LayoutDashboard,
  LogOut,
  Moon,
  RefreshCw,
  Ship,
  Sun,
  TrendingUp,
  Waves,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',             icon: LayoutDashboard },
  { id: 'vessels',    label: 'Vessel Traffic',        icon: Ship },
  { id: 'berths',     label: 'Berth Management',      icon: Anchor },
  { id: 'cargo',      label: 'Cargo Operations',      icon: Container },
  { id: 'inventory',  label: 'Inventory',             icon: Boxes },
  { id: 'forecast',   label: 'Demand Forecast',       icon: TrendingUp },
  { id: 'congestion', label: 'Port Congestion',       icon: Gauge },
  { id: 'risks',      label: 'Risk and Weather',      icon: AlertTriangle },
  { id: 'routes',     label: 'Coastal Routes',        icon: Compass },
  { id: 'reports',    label: 'Analytics and Reports', icon: BarChart3 },
];

export default function TopNavBar({
  activeTab,
  onSelectTab,
  ports,
  selectedPortId,
  onSelectPort,
  alerts = [],
  onSimulateTick,
  simulating,
  onLogout,
  theme,
  onToggleTheme,
}) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const dark = theme === 'dark';

  return (
    <>
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-[#1a2e2e] text-white dark:bg-[#0d1a1a]">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8891a]">
            <Waves className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Coastal Chain</p>
            <p className="text-[11px] text-[#9bbaba]">Port Authority</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all ${
                  active
                    ? 'bg-[#e8891a] text-white'
                    : 'text-[#c8e0e0] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign out at bottom */}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-sm font-medium text-[#c8e0e0] transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Top bar (right of sidebar) ────────────────────────────── */}
      <header className={`fixed top-0 left-56 right-0 z-30 flex items-center justify-end gap-3 border-b px-6 py-3 backdrop-blur-sm transition-colors ${
        dark
          ? 'border-[#1e3a3a] bg-[#0f1a1a]/95 text-[#e8f0f0]'
          : 'border-[#e2e8f0] bg-white/95 text-[#1a2e2e]'
      }`}>

        {/* Port Selector */}
        <select
          aria-label="Select Port"
          value={selectedPortId}
          onChange={(e) => onSelectPort(e.target.value)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium focus:border-[#4dbfbf] focus:outline-none transition-colors ${
            dark
              ? 'border-[#2a4a4a] bg-[#1a3030] text-[#e8f0f0]'
              : 'border-[#dde] bg-white text-[#334]'
          }`}
        >
          {ports.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>

        {/* Simulate AIS */}
        <button
          type="button"
          onClick={onSimulateTick}
          disabled={simulating}
          title="Simulate live vessel movement"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
            dark
              ? 'border-[#2a4a4a] bg-[#1a3030] text-[#c8e0e0] hover:bg-[#1e3838]'
              : 'border-[#dde] bg-white text-[#334] hover:bg-[#f0f4f4]'
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${simulating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Simulate AIS</span>
        </button>

        {/* Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAlertsOpen((o) => !o)}
            aria-label="Active Alerts"
            className={`relative rounded-full border p-2 transition ${
              dark
                ? 'border-[#2a4a4a] bg-[#1a3030] text-[#c8e0e0] hover:bg-[#1e3838]'
                : 'border-[#dde] bg-white text-[#555] hover:bg-[#f0f4f4]'
            }`}
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {alerts.length}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div className={`absolute right-0 mt-2 w-80 rounded-xl border p-3 shadow-xl ${
              dark ? 'border-[#2a4a4a] bg-[#122020]' : 'border-[#e2e8f0] bg-white'
            }`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-[#9bbaba]' : 'text-[#667]'}`}>
                  Active Alerts ({alerts.length})
                </span>
                <button
                  type="button"
                  onClick={() => { setAlertsOpen(false); onSelectTab('risks'); }}
                  className="text-xs font-semibold text-[#1a9090] hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className={`text-xs ${dark ? 'text-[#9bbaba]' : 'text-[#999]'}`}>No active alerts.</p>
                ) : (
                  alerts.slice(0, 4).map((a) => (
                    <div key={a.id} className={`rounded-lg border p-2 text-xs ${
                      dark ? 'border-[#2a4a4a] bg-[#1a3030] text-[#e8f0f0]' : 'border-[#eee] bg-[#fafafa] text-[#333]'
                    }`}>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="truncate pr-2">{a.title}</span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                          a.severity === 'High' || a.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {a.severity}
                        </span>
                      </div>
                      {a.affected_entity && (
                        <p className={`mt-0.5 text-[11px] ${dark ? 'text-[#9bbaba]' : 'text-[#888]'}`}>{a.affected_entity}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Theme toggle — circular, far top-right ─────────────── */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all hover:scale-105 ${
            dark
              ? 'border-[#2a4a4a] bg-[#1a3030] text-[#f5c842] hover:bg-[#1e3838]'
              : 'border-[#dde] bg-white text-[#555] hover:bg-[#f0f4f4]'
          }`}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>
    </>
  );
}
