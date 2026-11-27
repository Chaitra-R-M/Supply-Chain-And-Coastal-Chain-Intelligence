import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  Container,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Map,
  Moon,
  Package,
  RefreshCw,
  Ship,
  Sun,
  TrendingUp,
} from 'lucide-react';

export const CARGO_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'my_cargo', label: 'My Cargo', icon: Package },
  { id: 'requests', label: 'Transport Requests', icon: ClipboardList },
  { id: 'shipments', label: 'My Shipments', icon: Container },
  { id: 'tracking', label: 'Track Shipments', icon: Map },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp },
  { id: 'compare', label: 'Transport Comparison', icon: IndianRupee },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export default function CargoNavBar({ activeTab, onSelectTab, theme, onToggleTheme, onLogout, user, unreadCount }) {
  const [alertsOpen, setAlertsOpen] = useState(false);

  const alerts = [
    { id: 1, title: 'MV Bharat – ETA delayed by 1.5 hrs due to adverse weather', severity: 'Moderate' },
    { id: 2, title: 'Shipment SHP-5038 (Spices) delayed – carrier notification', severity: 'High' },
    { id: 3, title: 'Cargo SHP-5041 (Rice) – Loading completed at Mangalore Port', severity: 'Info' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-eggshell-800/40 bg-eggshell-900 text-ink-black-50 shadow-md dark:bg-ink-black-950 dark:border-deep-space-blue-800" style={{ background: 'linear-gradient(to right, #1d2a49, #2c3f6d)' }}>
      {/* Top Utility Row */}
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eggshell-500/25 border border-eggshell-400/40 text-eggshell-200">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-ink-black-50 sm:text-base">
                Coastal Chain Intelligence
              </span>
              <span className="hidden rounded-full border border-eggshell-500/40 bg-eggshell-500/15 px-2 py-0.5 text-[11px] font-semibold text-eggshell-200 sm:inline-flex items-center gap-1">
                <Package className="h-3 w-3" /> Cargo Owner
              </span>
            </div>
            <p className="hidden text-[11px] text-blue-slate-300 md:block">Cargo Registration, Tracking &amp; Supply Intelligence</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Live */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/70 px-2.5 py-1.5 text-xs font-medium text-blue-slate-100 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span>Live (UTC+5:30)</span>
          </div>

          {/* Theme */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="inline-flex items-center gap-1.5 rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/80 px-2.5 py-1.5 text-xs font-medium text-eggshell-200 transition hover:bg-deep-space-blue-700"
          >
            {theme === 'dark' ? (
              <><Sun className="h-3.5 w-3.5 text-eggshell-300" /><span className="hidden md:inline">Light</span></>
            ) : (
              <><Moon className="h-3.5 w-3.5" /><span className="hidden md:inline">Dark</span></>
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAlertsOpen((o) => !o)}
              aria-label="Notifications"
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
                    Shipment Alerts ({alerts.length})
                  </span>
                  <button type="button" onClick={() => { setAlertsOpen(false); onSelectTab('notifications'); }} className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300">View all</button>
                </div>
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <div key={a.id} className="rounded-lg border border-dusty-denim-100 bg-dusty-denim-50 p-2 text-xs dark:border-deep-space-blue-800 dark:bg-ink-black-950/60">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="truncate pr-2">{a.title}</span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${a.severity === 'High' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : a.severity === 'Info' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-eggshell-500/20 text-eggshell-700 dark:text-eggshell-300'}`}>{a.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User pill */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/80 px-2.5 py-1.5 text-xs font-medium text-blue-slate-100 xl:flex">
            <Package className="h-3.5 w-3.5 text-eggshell-400" />
            <span>{user?.name || 'Cargo Owner'}</span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-700/40 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Horizontal Nav */}
      <nav aria-label="Cargo Owner Navigation" className="border-t border-deep-space-blue-800/80 bg-deep-space-blue-950/90 dark:bg-ink-black-900/90">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-1.5 no-scrollbar sm:px-6">
          {CARGO_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`group flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-eggshell-500/70 text-white shadow-sm dark:bg-eggshell-700'
                    : 'text-blue-slate-200 hover:bg-deep-space-blue-800/80 hover:text-white dark:text-blue-slate-300 dark:hover:bg-deep-space-blue-800'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-eggshell-100' : 'text-blue-slate-400 group-hover:text-eggshell-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
