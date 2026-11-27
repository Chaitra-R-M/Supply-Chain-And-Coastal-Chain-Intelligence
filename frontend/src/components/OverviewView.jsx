import React from 'react';
import {
  AlertTriangle,
  Anchor,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Boxes,
  Clock,
  Container,
  Ship,
  Warehouse,
} from 'lucide-react';
import VesselMap from './VesselMap';
import CongestionGauge from './CongestionGauge';

export default function OverviewView({ dashboard, onNavigate }) {
  if (!dashboard) return null;
  const { port, kpis, congestion, berth_operations, vessels, active_alerts } = dashboard;

  const primaryKpis = [
    {
      label: 'Incoming Vessels',
      value: kpis.incoming_vessels,
      sub: kpis.incoming_delta_text,
      subTone: 'text-emerald-600 dark:text-emerald-400',
      trendIcon: ArrowUpRight,
      icon: Ship,
      iconBg: 'bg-ink-black-100 text-ink-black-600 dark:bg-ink-black-800 dark:text-ink-black-300',
    },
    {
      label: 'At Berth',
      value: kpis.at_berth,
      sub: `(${Math.round(kpis.berth_utilization_pct)}% utilization)`,
      subTone: 'text-dusty-denim-600 dark:text-blue-slate-300',
      icon: Anchor,
      iconBg: 'bg-deep-space-blue-100 text-deep-space-blue-600 dark:bg-deep-space-blue-800 dark:text-deep-space-blue-300',
    },
    {
      label: 'Berth Availability',
      value: `${kpis.available_berths} / ${kpis.total_berths}`,
      sub: `${kpis.total_berths - kpis.available_berths} occupied`,
      subTone: 'text-blue-slate-600 dark:text-blue-slate-300',
      icon: Container,
      iconBg: 'bg-blue-slate-100 text-blue-slate-600 dark:bg-blue-slate-800 dark:text-blue-slate-300',
    },
    {
      label: 'Avg. Turnaround Time',
      value: `${kpis.avg_turnaround_hrs} hrs`,
      sub: `${kpis.turnaround_delta_pct}%`,
      subTone: 'text-emerald-600 dark:text-emerald-400',
      trendIcon: ArrowDownRight,
      icon: Clock,
      iconBg: 'bg-dusty-denim-100 text-dusty-denim-700 dark:bg-dusty-denim-800 dark:text-dusty-denim-200',
    },
    {
      label: 'Port Efficiency',
      value: `${Math.round(kpis.port_efficiency_pct)}%`,
      sub: `+${kpis.efficiency_delta_pct}%`,
      subTone: 'text-emerald-600 dark:text-emerald-400',
      trendIcon: ArrowUpRight,
      icon: BarChart2,
      iconBg: 'bg-eggshell-100 text-eggshell-700 dark:bg-eggshell-900/60 dark:text-eggshell-300',
    },
  ];

  const secondaryStrip = [
    { label: 'Total Registered Vessels', value: kpis.total_registered_vessels, icon: Ship },
    { label: 'Docked / Departing', value: `${kpis.docked_vessels} / ${kpis.departing_vessels}`, icon: Anchor },
    { label: 'Total Cargo Handled', value: `${kpis.total_cargo_handled_mt.toLocaleString()} MT`, icon: Boxes },
    { label: 'Warehouse Utilization', value: `${kpis.warehouse_utilization_pct}%`, icon: Warehouse },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">
            Port Authority Dashboard
          </h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Real-time port operations, vessel traffic and efficiency insights — {port.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryStrip.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-lg border border-dusty-denim-200 bg-eggshell-50/80 px-3 py-1.5 text-xs dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900/80"
              >
                <Icon className="h-3.5 w-3.5 text-ink-black-500 dark:text-eggshell-300" />
                <span className="text-dusty-denim-600 dark:text-blue-slate-300">{item.label}:</span>
                <span className="font-bold text-ink-black-900 dark:text-ink-black-50">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 KPI Cards (matching screenshot layout) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trendIcon;
          return (
            <div
              key={kpi.label}
              className="flex items-center gap-3.5 rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm transition hover:border-ink-black-300 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 dark:hover:border-ink-black-500"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-dusty-denim-600 dark:text-blue-slate-300">
                  {kpi.label}
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-ink-black-900 dark:text-ink-black-50">
                  {kpi.value}
                </p>
                <p className={`flex items-center gap-0.5 text-xs font-semibold ${kpi.subTone}`}>
                  {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
                  <span>{kpi.sub}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Map (left) + Berth Operations (middle) + Congestion & Alerts (right) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Vessel Movement Map */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">
              Vessel Movement – {port.name}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('vessels')}
              className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300"
            >
              Full Traffic View →
            </button>
          </div>
          <VesselMap portName={port.name} vessels={vessels} />
        </div>

        {/* Berth Operations Table */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">
              Berth Operations
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('berths')}
              className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300"
            >
              Manage Berths →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dusty-denim-100 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                  <th className="py-2 pr-2">Berth</th>
                  <th className="py-2 pr-2">Vessel</th>
                  <th className="py-2 pr-2">Operation</th>
                  <th className="py-2">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
                {berth_operations.map((b) => {
                  const isAvailable = b.status === 'Available';
                  const barColor =
                    b.operation === 'Loading'
                      ? 'bg-emerald-500'
                      : b.operation === 'Unloading'
                      ? 'bg-ink-black-500 dark:bg-ink-black-400'
                      : 'bg-dusty-denim-300';
                  return (
                    <tr key={b.id} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                      <td className="py-2.5 pr-2 font-bold text-ink-black-900 dark:text-ink-black-50">
                        {b.code}
                      </td>
                      <td className="py-2.5 pr-2 font-medium text-ink-black-800 dark:text-blue-slate-100">
                        {b.current_vessel_name || '—'}
                      </td>
                      <td className="py-2.5 pr-2">
                        {isAvailable ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Available</span>
                        ) : (
                          <span className="text-dusty-denim-700 dark:text-blue-slate-200">{b.operation}</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {isAvailable ? (
                          <span className="text-dusty-denim-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${b.progress_pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-semibold text-ink-black-800 dark:text-ink-black-200">
                              {b.progress_pct}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Port Congestion Gauge + Active Alerts */}
        <div className="flex flex-col gap-4 xl:col-span-3">
          {/* Port Congestion */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">
                Port Congestion
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('congestion')}
                className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300"
              >
                Details
              </button>
            </div>
            <CongestionGauge level={congestion.level} utilizationPct={congestion.utilization_pct} />
          </div>

          {/* Active Alerts */}
          <div className="flex-1 rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">
                  Active Alerts ({active_alerts.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('risks')}
                className="text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300"
              >
                Manage
              </button>
            </div>
            <div className="space-y-2.5">
              {active_alerts.length === 0 ? (
                <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">
                  All operational and weather alerts resolved.
                </p>
              ) : (
                active_alerts.slice(0, 3).map((alert) => {
                  const isHigh = alert.severity === 'High' || alert.severity === 'Critical';
                  return (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                        isHigh
                          ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
                          : 'border-eggshell-300 bg-eggshell-50 text-eggshell-900 dark:border-eggshell-500/30 dark:bg-eggshell-500/10 dark:text-eggshell-200'
                      }`}
                    >
                      <AlertTriangle
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          isHigh ? 'text-rose-500' : 'text-eggshell-600 dark:text-eggshell-400'
                        }`}
                      />
                      <span className="font-medium leading-snug">{alert.title}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
