import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileJson, FileSpreadsheet, Ship, TrendingUp } from 'lucide-react';
import { api } from '../../api/client';

const periods = ['weekly', 'monthly', 'quarterly'];

export default function ShippingReports() {
  const [period, setPeriod] = useState('weekly');
  const [data, setData]     = useState(null);
  const [error, setError]   = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    api.getShippingReports(period)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [period]);

  if (error) return <div className="p-4 text-xs text-rose-600">{error}</div>;
  if (!data)  return <div className="p-6 text-xs text-dusty-denim-500">Loading reports…</div>;

  const maxMt = Math.max(...data.series.map((s) => s.mt), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Reports &amp; Analytics</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Voyage performance, fleet utilisation &amp; cargo transportation analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-dusty-denim-200 bg-white p-0.5 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            {periods.map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${period===p?'bg-ink-black-500 text-white':'text-dusty-denim-600 hover:text-ink-black-900 dark:text-blue-slate-300'}`}>{p}</button>
            ))}
          </div>
          <a href={api.getShippingReportsExportUrl(period,'csv')} download
            className="inline-flex items-center gap-1.5 rounded-lg border border-dusty-denim-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-black-800 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-white">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> CSV
          </a>
          <a href={api.getShippingReportsExportUrl(period,'json')} download
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">
            <FileJson className="h-3.5 w-3.5" /> JSON
          </a>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
        {[
          { label: 'Voyages Completed', value: data.summary.voyages_completed },
          { label: 'Cargo Moved',       value: `${data.summary.cargo_moved_mt?.toLocaleString()} MT` },
          { label: 'On-Time Rate',      value: `${data.summary.on_time_pct}%` },
          { label: 'Avg. Turnaround',   value: `${data.summary.avg_turnaround_hrs} hrs` },
          { label: 'Revenue',           value: `₹${((data.summary.revenue_inr||0)/100000).toFixed(1)}L` },
          { label: 'Fleet Utilisation', value: `${data.summary.utilization_pct}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <span className="text-dusty-denim-500 dark:text-blue-slate-400">{k.label}</span>
            <p className="mt-1 text-lg font-extrabold text-ink-black-900 dark:text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Chart + vessel performance */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-7">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
            <h2 className="text-sm font-bold capitalize">{period} Cargo Throughput</h2>
          </div>
          <div className="flex h-44 items-end gap-3 pt-4">
            {data.series.map((s) => {
              const h = Math.max(10, Math.round((s.mt / maxMt) * 130));
              return (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-1 text-center">
                  <span className="text-[10px] font-bold">{s.mt?.toLocaleString()}</span>
                  <div className="w-full max-w-[48px] rounded-t-lg bg-ink-black-500 hover:bg-eggshell-500 transition-colors" style={{ height:`${h}px` }} title={`${s.label}: ${s.mt} MT, ${s.voyages} voyages`} />
                  <span className="text-[11px] font-semibold text-dusty-denim-600 dark:text-blue-slate-300">{s.label}</span>
                  <span className="text-[10px] text-dusty-denim-400">{s.voyages}v</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <Ship className="h-4 w-4 text-ink-black-500" /> Vessel Performance
          </h2>
          <div className="space-y-3 text-xs">
            {data.vessel_perf.map((v) => (
              <div key={v.vessel}>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">{v.vessel}</span>
                  <span className="text-dusty-denim-500">{v.voyages} voyages · {v.mt?.toLocaleString()} MT · On-time: {v.on_time}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                  <div className="h-full rounded-full bg-ink-black-500" style={{ width:`${v.util}%` }} />
                </div>
                <div className="mt-0.5 text-right text-[10px] text-dusty-denim-500">{v.util}% utilisation</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cargo History */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Cargo Transportation History</h2>
          <a href={api.getShippingReportsExportUrl(period,'csv')} download
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-black-500 hover:underline dark:text-ink-black-300">
            <Download className="h-3.5 w-3.5" /> Export
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">Shipment</th><th className="py-2 pr-3">Cargo</th><th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Route</th><th className="py-2 pr-3">Cost</th><th className="py-2 pr-3">Vessel</th><th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {data.cargo_history.map((c) => (
                <tr key={c.shipment} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                  <td className="py-2.5 pr-3 font-bold">{c.shipment}</td>
                  <td className="py-2.5 pr-3">{c.cargo}</td>
                  <td className="py-2.5 pr-3">{c.qty_mt} MT</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{c.from} → {c.to}</td>
                  <td className="py-2.5 pr-3 font-semibold">₹{c.cost_inr?.toLocaleString()}</td>
                  <td className="py-2.5 pr-3">{c.vessel}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.status==='Delivered'?'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300':
                      c.status==='In Transit'?'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300':
                      'bg-rose-500/15 text-rose-700 dark:text-rose-300'}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* On-Time / Performance Summary */}
      <div className="rounded-xl border border-dusty-denim-200 bg-eggshell-50/70 p-4 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-black-900 dark:text-white">
          <TrendingUp className="h-4 w-4 text-emerald-600" /> Fleet Performance Summary
        </h2>
        <div className="flex flex-wrap gap-4 text-xs text-dusty-denim-700 dark:text-blue-slate-300">
          <span>On-time: <strong className="text-emerald-700 dark:text-emerald-300">{data.summary.on_time_pct}%</strong></span>
          <span>Fleet utilisation: <strong>{data.summary.utilization_pct}%</strong></span>
          <span>Avg turnaround: <strong>{data.summary.avg_turnaround_hrs} hrs</strong></span>
          <span>Delayed voyages: <strong>{data.summary.delayed_voyages}</strong></span>
          <span>Revenue: <strong>₹{((data.summary.revenue_inr||0)/100000).toFixed(1)} lakhs</strong></span>
        </div>
      </div>
    </div>
  );
}
