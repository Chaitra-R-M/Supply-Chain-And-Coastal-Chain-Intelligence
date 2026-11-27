import React, { useState } from 'react';
import { CheckCircle2, Clock, Container, MapPin, Package, Ship } from 'lucide-react';

const shipments = [
  { id: 'SHP-5041', cargo: 'Basmati Rice', qty: '500 MT', from: 'Mangalore Port', to: 'Kochi Port', company: 'India Coastal Shipping', vessel: 'MV Bharat', depart: 'Dec 16, 08:00', arrive: 'Dec 18, 14:30', status: 'In Transit', loading_pct: 100, unloading_pct: 0, cost: 185000 },
  { id: 'SHP-5038', cargo: 'Spices', qty: '150 MT', from: 'Mormugao Port', to: 'Mumbai (JNPT)', company: 'India Coastal Shipping', vessel: 'MV Sahyadri', depart: 'Dec 16, 06:00', arrive: 'Dec 18, 17:00', status: 'Delayed', loading_pct: 100, unloading_pct: 0, cost: 92000, delay: '+3h (weather)' },
  { id: 'SHP-5035', cargo: 'Urea Fertilizer', qty: '280 MT', from: 'Chennai Port', to: 'Mangalore Port', company: 'India Coastal Shipping', vessel: 'SS Konkan', depart: 'Dec 12, 14:00', arrive: 'Dec 14, 08:00', status: 'Delivered', loading_pct: 100, unloading_pct: 100, cost: 128000 },
  { id: 'SHP-5033', cargo: 'Cardamom', qty: '30 MT', from: 'Kochi Port', to: 'Mumbai (JNPT)', company: 'Coastal Lines Pvt Ltd', vessel: 'MV Coastal Queen', depart: 'Dec 10, 10:00', arrive: 'Dec 12, 20:00', status: 'Delivered', loading_pct: 100, unloading_pct: 100, cost: 68000 },
];

const STATUS_STYLES = {
  'In Transit': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Delivered: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Delayed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Loading: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
};

export default function CargoShipments() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? shipments : shipments.filter((s) => s.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">My Shipments</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          View all your cargo shipments, assigned vessels &amp; delivery status
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Container className="h-4 w-4 text-eggshell-500" />
          <p className="mt-1.5 text-2xl font-extrabold">{shipments.length}</p>
          <p className="text-[11px] text-dusty-denim-500">Total Shipments</p>
        </div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <Ship className="h-4 w-4 text-emerald-600" />
          <p className="mt-1.5 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{shipments.filter((s) => s.status === 'In Transit').length}</p>
          <p className="text-[11px] text-emerald-600">In Transit</p>
        </div>
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 dark:border-rose-500/30 dark:bg-rose-500/10">
          <Clock className="h-4 w-4 text-rose-600" />
          <p className="mt-1.5 text-2xl font-extrabold text-rose-700 dark:text-rose-300">{shipments.filter((s) => s.status === 'Delayed').length}</p>
          <p className="text-[11px] text-rose-600">Delayed</p>
        </div>
        <div className="rounded-xl border border-blue-slate-200 bg-blue-slate-50 p-3.5 dark:border-blue-slate-700 dark:bg-blue-slate-900/30">
          <CheckCircle2 className="h-4 w-4 text-blue-slate-600" />
          <p className="mt-1.5 text-2xl font-extrabold text-blue-slate-700 dark:text-blue-slate-300">{shipments.filter((s) => s.status === 'Delivered').length}</p>
          <p className="text-[11px] text-blue-slate-600">Delivered</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['All', 'In Transit', 'Delayed', 'Delivered'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === f
                ? 'border-eggshell-500 bg-eggshell-500 text-white dark:bg-eggshell-700'
                : 'border-dusty-denim-200 text-dusty-denim-600 hover:border-eggshell-400 dark:border-deep-space-blue-700 dark:text-blue-slate-300'
            }`}
          >{f}</button>
        ))}
      </div>

      {/* Shipments */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-ink-black-900 dark:text-white">{s.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[s.status] || ''}`}>{s.status}</span>
                  {s.delay && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-300">{s.delay}</span>}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-dusty-denim-700 dark:text-blue-slate-200">
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" />{s.cargo} ({s.qty})</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.from} → {s.to}</span>
                  <span className="flex items-center gap-1"><Ship className="h-3 w-3" />{s.vessel} ({s.company})</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-dusty-denim-500 dark:text-blue-slate-400">
                  <span>Dep: {s.depart}</span>
                  <span>Arr: {s.arrive}</span>
                  <span className="font-semibold text-ink-black-700 dark:text-blue-slate-200">Cost: ₹{s.cost.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <div>
                  <p className="text-dusty-denim-500 mb-1">Loading</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-24 rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.loading_pct}%` }} />
                    </div>
                    <span className="font-bold">{s.loading_pct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-dusty-denim-500 mb-1">Unloading</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-24 rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                      <div className="h-full rounded-full bg-ink-black-500" style={{ width: `${s.unloading_pct}%` }} />
                    </div>
                    <span className="font-bold">{s.unloading_pct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
