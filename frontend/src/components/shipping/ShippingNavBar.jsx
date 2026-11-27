import React, { useState } from 'react';
import {
  Anchor,
  BarChart3,
  Bell,
  CloudLightning,
  Compass,
  Container,
  LayoutDashboard,
  LogOut,
  Map,
  Moon,
  Navigation,
  Package,
  Ship,
  Sun,
  Waves,
} from 'lucide-react';

export const SHIPPING_NAV = [
  { id: 'overview',       label: 'Overview',           icon: LayoutDashboard },
  { id: 'fleet',          label: 'Fleet Management',   icon: Ship },
  { id: 'voyages',        label: 'Voyages',            icon: Navigation },
  { id: 'cargo_requests', label: 'Cargo Requests',     icon: Package },
  { id: 'shipments',      label: 'Shipments',          icon: Container },
  { id: 'tracking',       label: 'Vessel Tracking',    icon: Map },
  { id: 'routes',         label: 'Route Planning',     icon: Compass },
  { id: 'ports',          label: 'Port Coordination',  icon: Anchor },
  { id: 'risks',          label: 'Risk & Weather',     icon: CloudLightning },
  { id: 'reports',        label: 'Reports',            icon: BarChart3 },
];

const ALERTS = [
  { id: 1, title: 'High Swell Advisory – Mangalore–Kochi Corridor', severity: 'High' },
  { id: 2, title: 'MV Bharat route deviation detected', severity: 'Moderate' },
];

export default function ShippingNavBar({ activeTab, onSelectTab, onLogout, theme, onToggleTheme }) {
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
            <p className="text-[11px] text-[#9bbaba]">Shipping Company</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {SHIPPING_NAV.map((item) => {
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

        {/* Sign out */}
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

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-56 right-0 z-30 flex items-center justify-end gap-3 border-b px-6 py-3 backdrop-blur-sm transition-colors ${
        dark
          ? 'border-[#1e3a3a] bg-[#0f1a1a]/95 text-[#e8f0f0]'
          : 'border-[#e2e8f0] bg-white/95 text-[#1a2e2e]'
      }`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAlertsOpen((o) => !o)}
            aria-label="Fleet Alerts"
            className={`relative rounded-full border p-2 transition ${
              dark
                ? 'border-[#2a4a4a] bg-[#1a3030] text-[#c8e0e0] hover:bg-[#1e3838]'
                : 'border-[#dde] bg-white text-[#555] hover:bg-[#f0f4f4]'
            }`}
          >
            <Bell className="h-4 w-4" />
            {ALERTS.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {ALERTS.length}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div className={`absolute right-0 mt-2 w-80 rounded-xl border p-3 shadow-xl ${
              dark ? 'border-[#2a4a4a] bg-[#122020]' : 'border-[#e2e8f0] bg-white'
            }`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-[#9bbaba]' : 'text-[#667]'}`}>
                  Fleet Alerts ({ALERTS.length})
                </span>
                <button
                  type="button"
                  onClick={() => { setAlertsOpen(false); onSelectTab('risks'); }}
                  className="text-xs font-semibold text-[#1a9090] hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {ALERTS.map((a) => (
                  <div key={a.id} className={`rounded-lg border p-2 text-xs ${
                    dark ? 'border-[#2a4a4a] bg-[#1a3030] text-[#e8f0f0]' : 'border-[#eee] bg-[#fafafa] text-[#333]'
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="truncate pr-2">{a.title}</span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                        a.severity === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                      }`}>{a.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Theme toggle ──────────────────────────────────────────── */}
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
