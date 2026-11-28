import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Map,
  Package,
  Ship,
  Warehouse,
} from 'lucide-react';

const kpis = [
  { label: 'Registered Cargo', value: 14, sub: '+2 this week', tone: 'text-emerald-600 dark:text-emerald-400', icon: Package, bg: 'bg-eggshell-100 text-eggshell-700 dark:bg-eggshell-900/50 dark:text-eggshell-300' },
  { label: 'Active Requests', value: 3, sub: '1 pending response', tone: 'text-eggshell-600 dark:text-eggshell-300', icon: Clock, bg: 'bg-eggshell-100 text-eggshell-700 dark:bg-eggshell-900/50 dark:text-eggshell-300' },
  { label: 'In Transit', value: 2, sub: 'On 2 vessels', tone: 'text-emerald-600 dark:text-emerald-400', icon: Ship, bg: 'bg-ink-black-100 text-ink-black-600 dark:bg-ink-black-800 dark:text-ink-black-300' },
  { label: 'Completed Shipments', value: 11, sub: 'This quarter', tone: 'text-blue-slate-600 dark:text-blue-slate-300', icon: CheckCircle2, bg: 'bg-blue-slate-100 text-blue-slate-600 dark:bg-blue-slate-800 dark:text-blue-slate-300' },
  { label: 'At Port Storage', value: 4, sub: '2 approaching limit', tone: 'text-eggshell-600 dark:text-eggshell-300', icon: Warehouse, bg: 'bg-dusty-denim-100 text-dusty-denim-700 dark:bg-dusty-denim-800 dark:text-dusty-denim-200' },
  { label: 'Est. Transport Cost', value: '₹18.5L', sub: 'This month', tone: 'text-dusty-denim-600 dark:text-blue-slate-300', icon: IndianRupee, bg: 'bg-eggshell-100 text-eggshell-700 dark:bg-eggshell-900/50 dark:text-eggshell-300' },
  { label: 'Active Alerts', value: 2, sub: '1 delay, 1 weather', tone: 'text-rose-500', icon: AlertTriangle, bg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
  { label: 'Demand Growth', value: '+12%', sub: 'Vs last quarter', tone: 'text-emerald-600 dark:text-emerald-400', icon: BarChart2, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
];

const recentShipments = [
  { id: 'SHP-5041', cargo: 'Rice', qty: '500 MT', from: 'Mangalore', to: 'Kochi', vessel: 'MV Bharat', eta: 'Dec 18, 14:30', status: 'In Transit' },
  { id: 'SHP-5038', cargo: 'Spices', qty: '150 MT', from: 'Mormugao', to: 'Mumbai', vessel: 'MV Sahyadri', eta: 'Dec 18, 17:00 (+3h delay)', status: 'Delayed' },
  { id: 'SHP-5035', cargo: 'Fertilizer', qty: '280 MT', from: 'Chennai', to: 'Mangalore', vessel: 'SS Konkan', eta: 'Dec 14, 08:00', status: 'Delivered' },
];

const STATUS_STYLES = {
  'In Transit': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Delivered: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Delayed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

export default function CargoOverview({ onNavigate }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">
          Cargo Owner Dashboard
        </h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Manage your cargo, track shipments &amp; monitor supply chain intelligence
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="flex flex-col gap-2 rounded-xl border border-dusty-denim-200 bg-white p-3.5 shadow-sm transition hover:border-eggshell-300 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.bg}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400 leading-tight">{k.label}</p>
              <p className="text-2xl font-extrabold tracking-tight text-ink-black-900 dark:text-ink-black-50">{k.value}</p>
              <p className={`text-[11px] font-semibold ${k.tone}`}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Recent Shipments */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">Recent Shipments</h2>
            <button onClick={() => onNavigate('shipments')} className="text-xs font-semibold text-eggshell-700 hover:underline dark:text-eggshell-400">View all →</button>
          </div>
          <div className="space-y-3">
            {recentShipments.map((s) => (
              <div key={s.id} className="rounded-lg border border-dusty-denim-100 p-3 text-xs dark:border-deep-space-blue-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-ink-black-900 dark:text-white">{s.id} — {s.cargo} ({s.qty})</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[s.status] || ''}`}>{s.status}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-dusty-denim-600 dark:text-blue-slate-300">
                  <span className="flex items-center gap-1"><Map className="h-3 w-3" />{s.from} → {s.to}</span>
                  <span className="flex items-center gap-1"><Ship className="h-3 w-3" />{s.vessel}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Summary */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">Transportation Costs</h2>
            <button onClick={() => onNavigate('reports')} className="text-xs font-semibold text-eggshell-700 hover:underline dark:text-eggshell-400">Full report →</button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Rice (Rice 500 MT)', cost: 185000, pct: 42, color: 'bg-eggshell-500' },
              { label: 'Spices (150 MT)', cost: 92000, pct: 21, color: 'bg-ink-black-500' },
              { label: 'Fertilizer (280 MT)', cost: 128000, pct: 29, color: 'bg-blue-slate-500' },
              { label: 'Steel (120 MT)', cost: 36000, pct: 8, color: 'bg-dusty-denim-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-dusty-denim-600 dark:text-blue-slate-300">{item.label}</span>
                  <span className="font-bold">₹{(item.cost / 1000).toFixed(0)}K</span>
                </div>
                <div className="h-2 w-full rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-eggshell-50 p-2.5 text-xs dark:bg-eggshell-900/20">
            <span className="text-dusty-denim-500">Total this month: </span>
            <span className="font-extrabold text-ink-black-900 dark:text-white">₹18,50,000</span>
          </div>
        </div>

        {/* Right Column – Alerts + Quick Actions */}
        <div className="flex flex-col gap-4 xl:col-span-3">
          {/* Alerts */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h2 className="text-sm font-bold text-ink-black-900 dark:text-ink-black-50">Active Alerts</h2>
              </div>
              <button onClick={() => onNavigate('notifications')} className="text-xs font-semibold text-eggshell-700 hover:underline dark:text-eggshell-400">All →</button>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                <strong>SHP-5038 Delayed</strong> — Spices shipment ETA shifted +3 hrs
              </div>
              <div className="rounded-lg border border-eggshell-300 bg-eggshell-50 px-3 py-2 text-xs text-eggshell-900 dark:border-eggshell-500/30 dark:bg-eggshell-500/10 dark:text-eggshell-200">
                <strong>High Swell</strong> — Mangalore–Kochi corridor weather advisory
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 text-sm font-bold text-ink-black-900 dark:text-ink-black-50">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Register New Cargo', tab: 'my_cargo', icon: Package },
                { label: 'Create Transport Request', tab: 'requests', icon: ArrowUpRight },
                { label: 'Track My Shipments', tab: 'tracking', icon: Map },
                { label: 'View Demand Forecast', tab: 'forecast', icon: BarChart2 },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.tab}
                    type="button"
                    onClick={() => onNavigate(action.tab)}
                    className="flex w-full items-center gap-2 rounded-lg border border-dusty-denim-200 px-3 py-2 text-xs font-semibold text-ink-black-800 transition hover:border-eggshell-400 hover:bg-eggshell-50 dark:border-deep-space-blue-700 dark:text-blue-slate-200 dark:hover:bg-deep-space-blue-800"
                  >
                    <Icon className="h-3.5 w-3.5 text-eggshell-600 dark:text-eggshell-400" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
