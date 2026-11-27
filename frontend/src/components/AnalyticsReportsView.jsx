import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { api } from '../api/client';

export default function AnalyticsReportsView({ portId }) {
  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getReports(portId, period)
      .then(setReport)
      .catch((e) => setError(e.message));
  }, [portId, period]);

  if (error) return <div className="p-4 text-xs text-rose-600">{error}</div>;
  if (!report) return <div className="p-6 text-xs text-dusty-denim-500">Generating report...</div>;

  const { summary, series, berth_breakdown, cargo_performance } = report;
  const maxThroughput = Math.max(...series.map((s) => s.throughput_mt), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
            Analytics &amp; Operational Reports — {report.port_name}
          </h1>
          <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
            Daily, weekly &amp; monthly cargo throughput, vessel turnaround, berth utilization, and report exports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-dusty-denim-200 bg-white p-0.5 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                  period === p
                    ? 'bg-ink-black-500 text-white'
                    : 'text-dusty-denim-600 hover:text-ink-black-900 dark:text-blue-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <a
            href={api.getExportUrl(portId, period, 'csv')}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-dusty-denim-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-black-800 shadow-sm hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-ink-black-100"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export CSV
          </a>
          <a
            href={api.getExportUrl(portId, period, 'json')}
            download
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-ink-black-600"
          >
            <FileJson className="h-3.5 w-3.5" /> Export JSON
          </a>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 text-xs">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <span className="text-dusty-denim-500 dark:text-blue-slate-400">Cargo Throughput</span>
          <p className="mt-1 text-lg font-extrabold">{summary.cargo_throughput_mt.toLocaleString()} MT</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <span className="text-dusty-denim-500 dark:text-blue-slate-400">Avg Turnaround</span>
          <p className="mt-1 text-lg font-extrabold">{summary.avg_turnaround_hrs} hrs</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <span className="text-dusty-denim-500 dark:text-blue-slate-400">Berth Utilization</span>
          <p className="mt-1 text-lg font-extrabold">{summary.berth_utilization_pct}%</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <span className="text-dusty-denim-500 dark:text-blue-slate-400">Port Efficiency</span>
          <p className="mt-1 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary.port_efficiency_pct}%
          </p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <span className="text-dusty-denim-500 dark:text-blue-slate-400">Congestion</span>
          <p className="mt-1 text-lg font-extrabold">
            {summary.congestion_level} ({summary.congestion_pct}%)
          </p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <span className="text-dusty-denim-500 dark:text-blue-slate-400">Vessels Serviced</span>
          <p className="mt-1 text-lg font-extrabold">{summary.vessels_serviced}</p>
        </div>
      </div>

      {/* Throughput & Turnaround Chart + Berth Breakdown */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-7">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
            <h2 className="text-sm font-bold capitalize">{period} Throughput &amp; Turnaround Performance</h2>
          </div>
          <div className="flex h-44 items-end gap-3 pt-4">
            {series.map((s) => {
              const h = Math.max(16, Math.round((s.throughput_mt / maxThroughput) * 120));
              return (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-1 text-center">
                  <span className="text-[10px] font-bold">{Math.round(s.throughput_mt).toLocaleString()}</span>
                  <div
                    className="w-full max-w-[44px] rounded-t-lg bg-ink-black-500 transition-all hover:bg-eggshell-500"
                    style={{ height: `${h}px` }}
                    title={`${s.label}: ${s.throughput_mt} MT • Turnaround ${s.turnaround_hrs}h • Berth Util ${s.berth_utilization_pct}%`}
                  />
                  <span className="text-[11px] font-semibold text-dusty-denim-600 dark:text-blue-slate-300">
                    {s.label}
                  </span>
                  <span className="text-[10px] text-dusty-denim-400">{s.turnaround_hrs}h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-5">
          <h2 className="mb-3 text-sm font-bold">Berth Utilization Breakdown</h2>
          <div className="space-y-2.5 text-xs">
            {berth_breakdown.map((b) => (
              <div key={b.code}>
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {b.code} ({b.berth_type}) — {b.current_vessel}
                  </span>
                  <span className="font-bold">{b.utilization_pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                  <div className="h-full rounded-full bg-blue-slate-500" style={{ width: `${b.utilization_pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cargo Handling Performance Table */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Cargo Handling Performance Summary</h2>
          <a
            href={api.getExportUrl(portId, period, 'csv')}
            download
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300"
          >
            <Download className="h-3.5 w-3.5" /> Download Full Report
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">Tracking</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Commodity</th>
                <th className="py-2 pr-3">Quantity</th>
                <th className="py-2 pr-3">Operation</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {cargo_performance.map((c) => (
                <tr key={c.tracking_code}>
                  <td className="py-2.5 pr-3 font-bold">{c.tracking_code}</td>
                  <td className="py-2.5 pr-3">{c.cargo_type}</td>
                  <td className="py-2.5 pr-3">{c.commodity}</td>
                  <td className="py-2.5 pr-3 font-semibold">{c.quantity_mt.toLocaleString()} MT</td>
                  <td className="py-2.5 pr-3">{c.operation}</td>
                  <td className="py-2.5 font-semibold">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
