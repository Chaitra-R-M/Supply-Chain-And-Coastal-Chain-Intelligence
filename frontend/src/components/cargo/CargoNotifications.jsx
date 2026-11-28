import React, { useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, CloudRain, Package, Ship, Warehouse, X } from 'lucide-react';

const initNotifications = [
  { id: 1, type: 'delay', severity: 'High', title: 'Shipment SHP-5038 Delayed', message: 'Your Spices shipment (MV Sahyadri, V-1018) is delayed by 3 hours due to adverse weather conditions on the Mormugao–Mumbai corridor. Revised ETA: Dec 18, 17:00.', time: '2 hrs ago', read: false },
  { id: 2, type: 'weather', severity: 'Moderate', title: 'High Swell Advisory – Mangalore–Kochi', message: 'Wave heights forecast to reach 3.5 m from 20:00 hrs on the Mangalore–Kochi route. Your cargo on MV Bharat (SHP-5041) may experience minor delays. Vessel has reduced speed as precaution.', time: '3 hrs ago', read: false },
  { id: 3, type: 'loading', severity: 'Info', title: 'Cargo Loading Completed – SHP-5041', message: '500 MT Basmati Rice cargo (SHP-5041) has been fully loaded onto MV Bharat at Mangalore Port Berth B2. Vessel has departed and is en route to Kochi Port.', time: '14 hrs ago', read: true },
  { id: 4, type: 'eta', severity: 'Info', title: 'ETA Update – MV Bharat', message: 'ETA for MV Bharat at Kochi Port updated to Dec 18, 15:45 (delayed by 1.25 hrs due to reduced speed in heavy swell conditions). Your cargo (SHP-5041) is unaffected.', time: '1 day ago', read: true },
  { id: 5, type: 'inventory', severity: 'Moderate', title: 'Storage Alert – Pepper (Kochi Port)', message: 'Your Pepper cargo (CRG-103, 15 MT) has been stored at Kochi Port for 10 days. Recommended maximum storage is 14 days for spices. Please arrange transportation promptly.', time: '1 day ago', read: true },
  { id: 6, type: 'delivery', severity: 'Info', title: 'Delivery Confirmed – SHP-5035', message: 'Your Urea Fertilizer shipment (SHP-5035, 280 MT) has been successfully delivered to Mangalore Port and unloading is complete. Please confirm receipt.', time: '2 days ago', read: true },
];

const TYPE_STYLES = {
  delay: { icon: Ship, ring: 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10', iconColor: 'text-rose-500' },
  weather: { icon: CloudRain, ring: 'border-eggshell-300 bg-eggshell-50 dark:border-eggshell-500/30 dark:bg-eggshell-500/10', iconColor: 'text-eggshell-600 dark:text-eggshell-400' },
  loading: { icon: Package, ring: 'border-blue-slate-200 bg-blue-slate-50 dark:border-blue-slate-700 dark:bg-blue-slate-900/40', iconColor: 'text-blue-slate-500' },
  eta: { icon: AlertTriangle, ring: 'border-dusty-denim-200 bg-white dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900', iconColor: 'text-dusty-denim-500' },
  inventory: { icon: Warehouse, ring: 'border-eggshell-300 bg-eggshell-50 dark:border-eggshell-500/30 dark:bg-eggshell-500/10', iconColor: 'text-eggshell-600 dark:text-eggshell-400' },
  delivery: { icon: CheckCircle2, ring: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10', iconColor: 'text-emerald-600' },
};

const SEVERITY_BADGES = {
  High: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Moderate: 'bg-eggshell-500/20 text-eggshell-700 dark:text-eggshell-300',
  Info: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
};

export default function CargoNotifications() {
  const [notifications, setNotifications] = useState(initNotifications);
  const [filter, setFilter] = useState('All');

  const markRead = (id) => setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  const dismiss = (id) => setNotifications((n) => n.filter((x) => x.id !== id));
  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  const filtered = filter === 'All' ? notifications : filter === 'Unread' ? notifications.filter((n) => !n.read) : notifications.filter((n) => n.type === filter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Notifications</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Shipment delays, weather alerts, cargo handling &amp; delivery updates
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold text-ink-black-700 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:text-blue-slate-300"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Unread', 'delay', 'weather', 'inventory', 'delivery'].map((f) => {
          const labels = { All: 'All', Unread: `Unread (${unreadCount})`, delay: 'Delays', weather: 'Weather', inventory: 'Inventory', delivery: 'Delivery' };
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filter === f
                  ? 'border-eggshell-500 bg-eggshell-500 text-white dark:bg-eggshell-700'
                  : 'border-dusty-denim-200 text-dusty-denim-600 hover:border-eggshell-400 dark:border-deep-space-blue-700 dark:text-blue-slate-300'
              }`}
            >{labels[f]}</button>
          );
        })}
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-6 text-center text-xs text-dusty-denim-500 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <Bell className="mx-auto h-8 w-8 opacity-30" />
            <p className="mt-2">No notifications in this category.</p>
          </div>
        )}
        {filtered.map((n) => {
          const style = TYPE_STYLES[n.type] || TYPE_STYLES.eta;
          const Icon = style.icon;
          return (
            <div
              key={n.id}
              className={`rounded-xl border p-4 shadow-sm transition ${style.ring} ${!n.read ? 'ring-2 ring-eggshell-400/40' : 'opacity-80'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-ink-black-900/60`}>
                  <Icon className={`h-4 w-4 ${style.iconColor}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink-black-900 dark:text-white">{n.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEVERITY_BADGES[n.severity]}`}>{n.severity}</span>
                    {!n.read && <span className="rounded-full bg-eggshell-500/20 px-2 py-0.5 text-[10px] font-bold text-eggshell-700 dark:text-eggshell-300">New</span>}
                  </div>
                  <p className="text-xs text-ink-black-700 dark:text-blue-slate-200 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{n.time}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="rounded-lg p-1.5 text-blue-slate-400 hover:bg-white/50 hover:text-ink-black-900 dark:hover:bg-ink-black-900/50 dark:hover:text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismiss(n.id)}
                    title="Dismiss"
                    className="rounded-lg p-1.5 text-blue-slate-400 hover:bg-white/50 hover:text-rose-500 dark:hover:bg-ink-black-900/50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
