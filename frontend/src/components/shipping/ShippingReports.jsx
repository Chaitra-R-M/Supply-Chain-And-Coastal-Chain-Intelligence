import React, { useState } from 'react';
import { BarChart3, Download, Ship, TrendingUp } from 'lucide-react';

const periods = ['weekly', 'monthly', 'quarterly'];

const reportData = {
  weekly: {
    summary: { voyages_completed: 4, cargo_moved_mt: 1150, on_time_pct: 75, avg_turnaround_hrs: 14, revenue_inr: 826000, utilization_pct: 81 },
    series: [
      { label: 'Mon', mt: 180, voyages: 1 }, { label: 'Tue', mt: 220, voyages: 1 },
      { label: 'Wed', mt: 300, voyages: 2 }, { label: 'Thu', mt: 150, voyages: 1 },
      { label: 'Fri', mt: 300, voyages: 1 }, { label: 'Sat', mt: 0, voyages: 0 },
    ],
    vessel_perf: [
      { vessel: 'MV Bharat', voyages: 2, mt: 820, util: 92, on_time: '100%' },
      { vessel: 'SS Konkan', voyages: 1, mt: 300, util: 78, on_time: '100%' },
      { vessel: 'MV Sahyadri', voyages: 1, mt: 150, util: 55, on_time: '0%' },
    ],
  },
  monthly: {
    summary: { voyages_completed: 18, cargo_moved_mt: 5420, on_time_pct: 83, avg_turnaround_hrs: 13, revenue_inr: 3800000, utilization_pct: 86 },
    series: [
      { label: 'W1', mt: 1240, voyages: 4 }, { label: 'W2', mt: 1550, voyages: 5 },
      { label: 'W3', mt: 1200, voyages: 4 }, { label: 'W4', mt: 1430, voyages: 5 },
    ],
    vessel_perf: [
      { vessel: 'MV Bharat', voyages: 7, mt: 2200, util: 94, on_time: '86%' },
      { vessel: 'SS Konkan', voyages: 4, mt: 1400, util: 80, on_time: '75%' },
      { vessel: 'MV Deccan Star', voyages: 4, mt: 1200, util: 76, on_time: '100%' },
      { vessel: 'MV Sahyadri', voyages: 3, mt: 620, util: 58, on_time: '67%' },
    ],
  },
  quarterly: {
    summary: { voyages_completed: 54, cargo_moved_mt: 18200, on_time_pct: 85, avg_turnaround_hrs: 12.5, revenue_inr: 12400000, utilization_pct: 88 },
    series: [
      { label: 'Oct', mt: 5800, voyages: 16 }, { label: 'Nov', mt: 6200, voyages: 18 },
      { label: 'Dec', mt: 6200, voyages: 20 },
    ],
    vessel_perf: [
      { vessel: 'MV Bharat', voyages: 20, mt: 6500, util: 95, on_time: '90%' },
      { vessel: 'SS Konkan', voyages: 14, mt: 4800, util: 82, on_time: '79%' },
      { vessel: 'MV Deccan Star', voyages: 12, mt: 4200, util: 78, on_time: '92%' },
      { vessel: 'MV Western Ghats', voyages: 8, mt: 2700, util: 68, on_time: '75%' },
    ],
  },
};

export default function ShippingReports() {
  const [period, setPeriod] = useState('weekly');
  const data = reportData[period];
  const maxMt = Math.max(...data.series.map((s) => s.mt), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Reports &amp; Analytics</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Voyage performance, fleet utilization &amp; cargo transportation analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-dusty-denim-200 bg-white p-0.5 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${period === p ? 'bg-ink-black-500 text-white' : 'text-dusty-denim-600 hover:text-ink-black-900 dark:text-blue-slate-300'}`}
              >{p}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-dusty-denim-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-black-800 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-white">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
        {[
          { label: 'Voyages Completed', value: data.summary.voyages_completed },
          { label: 'Cargo Moved', value: `${data.summary.cargo_moved_mt.toLocaleString()} MT` },
          { label: 'On-Time Rate', value: `${data.summary.on_time_pct}%` },
          { label: 'Avg. Turnaround', value: `${data.summary.avg_turnaround_hrs} hrs` },
          { label: 'Revenue', value: `₹${(data.summary.revenue_inr / 100000).toFixed(1)}L` },
          { label: 'Fleet Utilization', value: `${data.summary.utilization_pct}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <span className="text-dusty-denim-500 dark:text-blue-slate-400">{k.label}</span>
            <p className="mt-1 text-lg font-extrabold text-ink-black-900 dark:text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Cargo Chart + Vessel Performance */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-7">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
            <h2 className="text-sm font-bold capitalize">{period} Cargo Throughput</h2>
          </div>
          <div className="flex h-44 items-end gap-3 pt-4">
            {data.series.map((s) => {
              const h = Math.max(10, Math.round((s.mt / maxMt) * 120));
              return (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-1 text-center">
                  <span className="text-[10px] font-bold">{s.mt.toLocaleString()}</span>
                  <div className="w-full max-w-[48px] rounded-t-lg bg-ink-black-500 hover:bg-eggshell-500 transition-colors" style={{ height: `${h}px` }} title={`${s.mt} MT, ${s.voyages} voyages`} />
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
                  <span className="text-dusty-denim-500">{v.voyages} voyages · {v.mt.toLocaleString()} MT · On-time: {v.on_time}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                  <div className="h-full rounded-full bg-ink-black-500 transition-all" style={{ width: `${v.util}%` }} />
                </div>
                <div className="mt-0.5 text-right text-[10px] text-dusty-denim-500">{v.util}% utilization</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On-Time Trend */}
      <div className="rounded-xl border border-dusty-denim-200 bg-eggshell-50/70 p-4 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-black-900 dark:text-white">
          <TrendingUp className="h-4 w-4 text-emerald-600" /> Fleet Performance Summary
        </h2>
        <div className="flex flex-wrap gap-4 text-xs text-dusty-denim-700 dark:text-blue-slate-300">
          <span>On-time delivery rate: <strong className="text-emerald-700 dark:text-emerald-300">{data.summary.on_time_pct}%</strong></span>
          <span>Fleet utilization: <strong>{data.summary.utilization_pct}%</strong></span>
          <span>Avg turnaround: <strong>{data.summary.avg_turnaround_hrs} hrs</strong></span>
          <span>Revenue generated: <strong>₹{(data.summary.revenue_inr / 100000).toFixed(1)} lakhs</strong></span>
        </div>
      </div>
    </div>
  );
}
