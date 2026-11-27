import React, { useEffect, useState } from 'react';
import { Anchor, Clock, Container, Gauge, Ship, Warehouse } from 'lucide-react';
import { api } from '../../api/client';
import CongestionGauge from './CongestionGauge';

export default function PortCongestionView({ portId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getCongestion(portId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [portId]);

  if (error) return <div className="p-4 text-xs text-rose-600">{error}</div>;
  if (!data) return <div className="p-6 text-xs text-dusty-denim-500">Loading congestion telemetry...</div>;

  const cards = [
    { label: 'Berth Utilization', value: `${data.berth_utilization_pct}%`, icon: Anchor },
    { label: 'Waiting Vessels', value: data.waiting_vessels, icon: Ship },
    { label: 'Avg Vessel Wait Time', value: `${data.avg_waiting_time_hrs} hrs`, icon: Clock },
    { label: 'Loading/Unloading Delay', value: `${data.loading_unloading_delay_hrs} hrs`, icon: Container },
    { label: 'Warehouse Utilization', value: `${data.warehouse_utilization_pct}%`, icon: Warehouse },
  ];

  const maxTrend = 100;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
          Port Congestion Monitoring
        </h1>
        <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
          Real-time congestion classification (Low / Moderate / High / Critical), queue delays, and 7-day trend
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Gauge Summary */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-dusty-denim-200 bg-white p-5 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 lg:col-span-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold">
            <Gauge className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
            <span>Composite Congestion Index</span>
          </div>
          <CongestionGauge level={data.level} utilizationPct={data.utilization_pct} />
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px] font-semibold">
            {['Low (<45%)', 'Moderate (45–69%)', 'High (70–84%)', 'Critical (85%+)'].map((band) => (
              <span
                key={band}
                className="rounded-md bg-dusty-denim-50 px-2 py-0.5 text-dusty-denim-700 dark:bg-ink-black-950/60 dark:text-blue-slate-300"
              >
                {band}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics + Trend Chart */}
        <div className="space-y-4 lg:col-span-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900"
                >
                  <Icon className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
                  <p className="mt-2 text-lg font-extrabold text-ink-black-900 dark:text-white">{c.value}</p>
                  <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{c.label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 text-sm font-bold">7-Day Port Congestion &amp; Queue Trend</h2>
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
              {data.trends.map((t) => {
                const barH = Math.max(12, Math.round((t.utilization_pct / maxTrend) * 110));
                const barColor =
                  t.utilization_pct >= 85
                    ? 'bg-rose-500'
                    : t.utilization_pct >= 70
                    ? 'bg-orange-400'
                    : t.utilization_pct >= 45
                    ? 'bg-eggshell-500'
                    : 'bg-emerald-500';
                return (
                  <div key={t.label} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-[10px] font-bold">{t.utilization_pct}%</span>
                    <div
                      className={`w-full max-w-[38px] rounded-t-lg transition-all ${barColor}`}
                      style={{ height: `${barH}px` }}
                      title={`${t.label}: ${t.utilization_pct}% • ${t.waiting_vessels} waiting`}
                    />
                    <span className="text-[11px] font-medium text-dusty-denim-600 dark:text-blue-slate-300">
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
