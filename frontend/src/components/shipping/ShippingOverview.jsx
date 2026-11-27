import React from 'react';
import {
  AlertTriangle,
  Anchor,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Container,
  Navigation,
  Package,
  Ship,
} from 'lucide-react';
import VesselMap from '../portauth/VesselMap';

const MOCK_VESSELS = [
  { id: 1, name: 'MV Bharat', imo_number: 'IMO9234561', vessel_type: 'Bulk Carrier', status: 'En Route', map_x: 42, map_y: 55, speed_knots: 12, draft_m: 8.4, origin_port: 'Mangalore', eta_text: 'ETA 14:30', waypoints: [[42,55],[65,62]] },
  { id: 2, name: 'SS Konkan', imo_number: 'IMO8876543', vessel_type: 'Container', status: 'At Berth', map_x: 71, map_y: 61, speed_knots: 0, draft_m: 7.2, origin_port: 'Mumbai', eta_text: 'Berthed', waypoints: [[71,61],[78,61]] },
  { id: 3, name: 'MV Malabar', imo_number: 'IMO7654321', vessel_type: 'Tanker', status: 'Anchored', map_x: 55, map_y: 72, speed_knots: 2, draft_m: 9.1, origin_port: 'Kochi', eta_text: 'Anchored', waypoints: [[55,72],[75,65]] },
  { id: 4, name: 'MV Sahyadri', imo_number: 'IMO6543219', vessel_type: 'General Cargo', status: 'Delayed', map_x: 30, map_y: 40, speed_knots: 8, draft_m: 6.5, origin_port: 'Mormugao', eta_text: 'Delayed – 3h', route_deviation: true, deviation_nm: 4.2, waypoints: [[30,40],[68,60]] },
];

const kpis = [
  { label: 'Total Vessels', value: 12, sub: '+1 this month', tone: 'text-emerald-600 dark:text-emerald-400', icon: Ship, bg: 'bg-ink-black-100 text-ink-black-600 dark:bg-ink-black-800 dark:text-ink-black-300' },
  { label: 'Active Voyages', value: 5, sub: '3 on schedule', tone: 'text-blue-slate-600 dark:text-blue-slate-300', icon: Navigation, bg: 'bg-deep-space-blue-100 text-deep-space-blue-600 dark:bg-deep-space-blue-800 dark:text-deep-space-blue-300' },
  { label: 'Vessels in Transit', value: 3, sub: '1 delayed', tone: 'text-eggshell-600 dark:text-eggshell-300', icon: ArrowUpRight, bg: 'bg-eggshell-100 text-eggshell-700 dark:bg-eggshell-900/60 dark:text-eggshell-300' },
  { label: 'Docked at Port', value: 2, sub: 'Berths B2, B4', tone: 'text-dusty-denim-600 dark:text-blue-slate-300', icon: Anchor, bg: 'bg-dusty-denim-100 text-dusty-denim-700 dark:bg-dusty-denim-800 dark:text-dusty-denim-200' },
  { label: 'Pending Cargo', value: 8, sub: '3 awaiting vessel', tone: 'text-rose-500', icon: Package, bg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
  { label: 'Completed Shipments', value: 47, sub: 'This quarter', tone: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { label: 'Active Risk Alerts', value: 2, sub: '1 High severity', tone: 'text-rose-500', icon: AlertTriangle, bg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
  { label: 'Fleet Efficiency', value: '86%', sub: '+3% vs last month', tone: 'text-emerald-600 dark:text-emerald-400', icon: BarChart2, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
];

const recentVoyages = [
  { id: 'V-1021', from: 'Mangalore', to: 'Kochi', vessel: 'MV Bharat', status: 'Active', eta: 'Dec 18, 14:30', cargo: '500 MT Rice' },
  { id: 'V-1020', from: 'Mumbai', to: 'Mangalore', vessel: 'SS Konkan', status: 'Completed', eta: 'Dec 15', cargo: '300 MT Steel' },
  { id: 'V-1019', from: 'Kochi', to: 'Tuticorin', vessel: 'MV Malabar', status: 'Active', eta: 'Dec 19, 09:00', cargo: '200 MT Coal' },
  { id: 'V-1018', from: 'Mormugao', to: 'Mumbai', vessel: 'MV Sahyadri', status: 'Delayed', eta: 'Dec 18, 17:00', cargo: '150 MT Spices' },
];

const STATUS_COLORS = {
  Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Completed: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Delayed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Scheduled: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
};

export default function ShippingOverview({ onNavigate }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">
          Shipping Company Dashboard
        </h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Real-time fleet operations, voyage management &amp; cargo intelligence
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="flex flex-col gap-2 rounded-xl border border-dusty-denim-200 bg-white p-3.5 shadow-sm hover:border-ink-black-300 transition dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900"
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

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Vessel Map */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">Fleet Position Map</h2>
            <button onClick={() => onNavigate('tracking')} className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300">Full Tracking →</button>
          </div>
          <VesselMap portName="Fleet Overview" vessels={MOCK_VESSELS} />
        </div>

        {/* Active Voyages */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">Recent Voyages</h2>
            <button onClick={() => onNavigate('voyages')} className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300">Manage →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dusty-denim-100 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                  <th className="py-2 pr-2">Voyage</th>
                  <th className="py-2 pr-2">Route</th>
                  <th className="py-2 pr-2">Vessel</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
                {recentVoyages.map((v) => (
                  <tr key={v.id} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                    <td className="py-2.5 pr-2 font-bold text-ink-black-900 dark:text-ink-black-50">{v.id}</td>
                    <td className="py-2.5 pr-2 text-dusty-denim-700 dark:text-blue-slate-200">
                      {v.from} → {v.to}
                    </td>
                    <td className="py-2.5 pr-2 text-dusty-denim-700 dark:text-blue-slate-200">{v.vessel}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[v.status] || ''}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column – Fleet Performance + Alerts */}
        <div className="flex flex-col gap-4 xl:col-span-3">
          {/* Fleet Performance */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ink-black-900 dark:text-ink-black-50">Fleet Performance</h2>
              <button onClick={() => onNavigate('reports')} className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300">Reports →</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'On-Time Delivery', pct: 78, color: 'bg-emerald-500' },
                { label: 'Cargo Utilization', pct: 86, color: 'bg-ink-black-500' },
                { label: 'Fuel Efficiency', pct: 71, color: 'bg-eggshell-500' },
                { label: 'Avg. ETA Accuracy', pct: 83, color: 'bg-blue-slate-500' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dusty-denim-600 dark:text-blue-slate-300">{m.label}</span>
                    <span className="font-bold text-ink-black-900 dark:text-ink-black-50">{m.pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                    <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Risk Alerts */}
          <div className="flex-1 rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h2 className="text-sm font-bold text-ink-black-900 dark:text-ink-black-50">Active Alerts</h2>
              </div>
              <button onClick={() => onNavigate('risks')} className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300">Manage →</button>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                <span className="font-medium leading-snug">High Swell Advisory – Mangalore–Kochi</span>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-eggshell-300 bg-eggshell-50 px-3 py-2 text-xs text-eggshell-900 dark:border-eggshell-500/30 dark:bg-eggshell-500/10 dark:text-eggshell-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-eggshell-600" />
                <span className="font-medium leading-snug">MV Sahyadri – Route deviation 4.2 NM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
