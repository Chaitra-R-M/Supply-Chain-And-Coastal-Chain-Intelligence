import React, { useState } from 'react';
import { BarChart3, Download, FileJson, FileSpreadsheet, Package, TrendingUp } from 'lucide-react';

const periods = ['weekly', 'monthly', 'quarterly'];

const reportData = {
  weekly: {
    summary: { shipments: 2, delivered: 1, delayed: 1, cargo_moved_mt: 650, total_cost_inr: 277000, avg_cost_per_mt: 426 },
    series: [{ label: 'Mon', mt: 0, cost: 0 }, { label: 'Tue', mt: 500, cost: 185000 }, { label: 'Wed', mt: 0, cost: 0 }, { label: 'Thu', mt: 150, cost: 92000 }, { label: 'Fri', mt: 0, cost: 0 }, { label: 'Sat', mt: 0, cost: 0 }],
    cargo_history: [
      { id: 'SHP-5041', cargo: 'Basmati Rice', qty: '500 MT', from: 'Mangalore', to: 'Kochi', cost: 185000, status: 'In Transit' },
      { id: 'SHP-5038', cargo: 'Spices', qty: '150 MT', from: 'Mormugao', to: 'Mumbai', cost: 92000, status: 'Delayed' },
    ],
  },
  monthly: {
    summary: { shipments: 7, delivered: 5, delayed: 1, cargo_moved_mt: 1830, total_cost_inr: 756000, avg_cost_per_mt: 413 },
    series: [{ label: 'W1', mt: 500, cost: 185000 }, { label: 'W2', mt: 580, cost: 220000 }, { label: 'W3', mt: 420, cost: 175000 }, { label: 'W4', mt: 330, cost: 176000 }],
    cargo_history: [
      { id: 'SHP-5041', cargo: 'Basmati Rice', qty: '500 MT', from: 'Mangalore', to: 'Kochi', cost: 185000, status: 'In Transit' },
      { id: 'SHP-5038', cargo: 'Spices', qty: '150 MT', from: 'Mormugao', to: 'Mumbai', cost: 92000, status: 'Delayed' },
      { id: 'SHP-5035', cargo: 'Urea Fertilizer', qty: '280 MT', from: 'Chennai', to: 'Mangalore', cost: 128000, status: 'Delivered' },
      { id: 'SHP-5033', cargo: 'Cardamom', qty: '30 MT', from: 'Kochi', to: 'Mumbai', cost: 68000, status: 'Delivered' },
    ],
  },
  quarterly: {
    summary: { shipments: 23, delivered: 20, delayed: 2, cargo_moved_mt: 7420, total_cost_inr: 2800000, avg_cost_per_mt: 377 },
    series: [{ label: 'Oct', mt: 2200, cost: 820000 }, { label: 'Nov', mt: 2600, cost: 980000 }, { label: 'Dec', mt: 2620, cost: 1000000 }],
    cargo_history: [
      { id: 'Multiple', cargo: 'Rice, Spices, Steel, Fertilizer', qty: '7420 MT total', from: 'Various', to: 'Various', cost: 2800000, status: 'Mixed' },
    ],
  },
};

export default function CargoReports() {
  const [period, setPeriod] = useState('weekly');
  const data = reportData[period];
  const maxMt = Math.max(...data.series.map((s) => s.mt), 1);
  const maxCost = Math.max(...data.series.map((s) => s.cost), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Reports &amp; Analytics</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Cargo movement history, shipment performance &amp; transportation cost analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-dusty-denim-200 bg-white p-0.5 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${period === p ? 'bg-eggshell-500 text-white dark:bg-eggshell-700' : 'text-dusty-denim-600 hover:text-ink-black-900 dark:text-blue-slate-300'}`}
              >{p}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-dusty-denim-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-black-800 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-white">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> CSV
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-eggshell-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-eggshell-600 dark:bg-eggshell-700">
            <FileJson className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
        {[
          { label: 'Total Shipments', value: data.summary.shipments },
          { label: 'Delivered', value: data.summary.delivered },
          { label: 'Delayed', value: data.summary.delayed },
          { label: 'Cargo Moved', value: `${data.summary.cargo_moved_mt.toLocaleString()} MT` },
          { label: 'Total Cost', value: `₹${(data.summary.total_cost_inr / 100000).toFixed(1)}L` },
          { label: 'Avg ₹/MT', value: `₹${data.summary.avg_cost_per_mt}` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <span className="text-dusty-denim-500 dark:text-blue-slate-400">{k.label}</span>
            <p className="mt-1 text-lg font-extrabold text-ink-black-900 dark:text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Cargo throughput */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-6">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-eggshell-600 dark:text-eggshell-400" />
            <h2 className="text-sm font-bold capitalize">{period} Cargo Volume</h2>
          </div>
          <div className="flex h-44 items-end gap-3 pt-4">
            {data.series.map((s) => {
              const h = Math.max(10, (s.mt / maxMt) * 130);
              return (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-1 text-center">
                  <span className="text-[10px] font-bold">{s.mt.toLocaleString()}</span>
                  <div className="w-full max-w-[48px] rounded-t-lg bg-eggshell-500 hover:bg-ink-black-500 transition-colors" style={{ height: `${h}px` }} />
                  <span className="text-[11px] font-semibold text-dusty-denim-600 dark:text-blue-slate-300">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-6">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-eggshell-600 dark:text-eggshell-400" />
            <h2 className="text-sm font-bold capitalize">{period} Transportation Cost</h2>
          </div>
          <div className="flex h-44 items-end gap-3 pt-4">
            {data.series.map((s) => {
              const h = Math.max(10, (s.cost / maxCost) * 130);
              return (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-1 text-center">
                  <span className="text-[10px] font-bold">{s.cost > 0 ? `₹${(s.cost / 1000).toFixed(0)}K` : '₹0'}</span>
                  <div className="w-full max-w-[48px] rounded-t-lg bg-ink-black-500 hover:bg-eggshell-500 transition-colors" style={{ height: `${h}px` }} />
                  <span className="text-[11px] font-semibold text-dusty-denim-600 dark:text-blue-slate-300">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cargo History Table */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Cargo Transportation History</h2>
          <button className="inline-flex items-center gap-1 text-xs font-semibold text-eggshell-700 hover:underline dark:text-eggshell-400">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">Shipment</th>
                <th className="py-2 pr-3">Cargo</th>
                <th className="py-2 pr-3">Quantity</th>
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Cost</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {data.cargo_history.map((c) => (
                <tr key={c.id} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                  <td className="py-2.5 pr-3 font-bold">{c.id}</td>
                  <td className="py-2.5 pr-3 flex items-center gap-1 font-semibold"><Package className="h-3 w-3 text-eggshell-500" />{c.cargo}</td>
                  <td className="py-2.5 pr-3">{c.qty}</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{c.from} → {c.to}</td>
                  <td className="py-2.5 pr-3 font-semibold">₹{c.cost.toLocaleString()}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.status === 'Delivered' ? 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300' : c.status === 'In Transit' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : c.status === 'Delayed' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'bg-dusty-denim-200 text-dusty-denim-700 dark:text-blue-slate-300'}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
