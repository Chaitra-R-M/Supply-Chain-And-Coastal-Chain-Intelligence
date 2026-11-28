import React, { useState } from 'react';
import { CheckCircle2, Clock, Container, Package, Ship, SlidersHorizontal } from 'lucide-react';

const shipments = [
  { id: 'SHP-5041', voyage: 'V-1021', cargo: 'Rice', owner: 'Agro India Exports', quantity: '500 MT', from: 'Mangalore Port', to: 'Kochi Port', vessel: 'MV Bharat', depart: 'Dec 16, 08:00', arrive: 'Dec 18, 14:30', status: 'In Transit', loading_pct: 100, unloading_pct: 0 },
  { id: 'SHP-5040', voyage: 'V-1020', cargo: 'Steel', owner: 'Coastal Steel Works', quantity: '300 MT', from: 'Mumbai (JNPT)', to: 'Mangalore Port', vessel: 'SS Konkan', depart: 'Dec 14, 10:00', arrive: 'Dec 15, 22:00', status: 'Delivered', loading_pct: 100, unloading_pct: 100 },
  { id: 'SHP-5039', voyage: 'V-1019', cargo: 'Coal', owner: 'Deccan Energy', quantity: '200 MT', from: 'Kochi Port', to: 'Tuticorin Port', vessel: 'MV Deccan Star', depart: 'Dec 17, 07:00', arrive: 'Dec 19, 09:00', status: 'In Transit', loading_pct: 100, unloading_pct: 0 },
  { id: 'SHP-5038', voyage: 'V-1018', cargo: 'Spices', owner: 'Spice Traders Ltd', quantity: '150 MT', from: 'Mormugao Port', to: 'Mumbai (JNPT)', vessel: 'MV Sahyadri', depart: 'Dec 16, 06:00', arrive: 'Dec 18, 12:00', status: 'Delayed', loading_pct: 100, unloading_pct: 0 },
  { id: 'SHP-5037', voyage: 'V-1017', cargo: 'Cement', owner: 'Build Fast India', quantity: '420 MT', from: 'Mangalore Port', to: 'Chennai Port', vessel: 'MV Western Ghats', depart: 'Dec 15, 18:00', arrive: 'Dec 17, 14:00', status: 'Delivered', loading_pct: 100, unloading_pct: 100 },
  { id: 'SHP-5036', voyage: 'V-1016', cargo: 'Electronics', owner: 'TechImports Ltd', quantity: '310 MT', from: 'Mumbai (JNPT)', to: 'Kochi Port', vessel: 'MV Malabar', depart: 'Dec 15, 09:00', arrive: 'Dec 16, 18:00', status: 'Delivered', loading_pct: 100, unloading_pct: 100 },
  { id: 'SHP-5035', voyage: 'V-1015', cargo: 'Fertilizer', owner: 'GreenFarm Exports', quantity: '280 MT', from: 'Chennai Port', to: 'Mangalore Port', vessel: 'SS Konkan', depart: 'Dec 12, 14:00', arrive: 'Dec 14, 08:00', status: 'Delivered', loading_pct: 100, unloading_pct: 100 },
];

const STATUS_STYLES = {
  'In Transit': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Delivered: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Delayed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Loading: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
  Unloading: 'bg-ink-black-500/15 text-ink-black-700 dark:text-ink-black-300',
};

export default function ShippingShipments() {
  const [data, setData]   = useState(shipments.map((s) => ({ ...s })));
  const [filter, setFilter] = useState('All');
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const filtered = filter === 'All' ? data : data.filter((s) => s.status === filter);
  const counts = {
    'In Transit': data.filter((s) => s.status === 'In Transit').length,
    Delayed:      data.filter((s) => s.status === 'Delayed').length,
    Delivered:    data.filter((s) => s.status === 'Delivered').length,
  };

  const updateProgress = (id, field, value) => {
    const val = Math.min(100, Math.max(0, parseInt(value) || 0));
    setData((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: val };
      if (updated.unloading_pct === 100) updated.status = 'Delivered';
      else if (updated.loading_pct === 100 && updated.unloading_pct === 0) updated.status = s.status === 'Delayed' ? 'Delayed' : 'In Transit';
      return updated;
    }));
    showToast(`${id} ${field.replace('_pct', '')} updated to ${val}%`);
    setUpdating(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Shipment Management</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Full view of all cargo shipments, loading &amp; unloading status, and delivery confirmation
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Container className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-2xl font-extrabold">{shipments.length}</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Total Shipments</p>
        </div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <Ship className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <p className="mt-1.5 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{counts['In Transit']}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">In Transit</p>
        </div>
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 dark:border-rose-500/30 dark:bg-rose-500/10">
          <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <p className="mt-1.5 text-2xl font-extrabold text-rose-700 dark:text-rose-300">{counts['Delayed']}</p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400">Delayed</p>
        </div>
        <div className="rounded-xl border border-blue-slate-300 bg-blue-slate-50 p-3.5 dark:border-blue-slate-700/40 dark:bg-blue-slate-900/30">
          <CheckCircle2 className="h-4 w-4 text-blue-slate-600 dark:text-blue-slate-400" />
          <p className="mt-1.5 text-2xl font-extrabold text-blue-slate-700 dark:text-blue-slate-300">{counts['Delivered']}</p>
          <p className="text-[11px] text-blue-slate-600 dark:text-blue-slate-400">Delivered</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['All', 'In Transit', 'Delayed', 'Delivered'].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter===f?'border-ink-black-500 bg-ink-black-500 text-white':'border-dusty-denim-200 text-dusty-denim-600 hover:border-ink-black-300 dark:border-deep-space-blue-700 dark:text-blue-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {toast && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>}

      {/* Shipments Table */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">Shipment</th>
                <th className="py-2 pr-3">Cargo / Owner</th>
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Vessel</th>
                <th className="py-2 pr-3">Schedule</th>
                <th className="py-2 pr-3">Loading</th>
                <th className="py-2 pr-3">Unloading</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                  <td className="py-2.5 pr-3">
                    <div className="font-bold text-ink-black-900 dark:text-white">{s.id}</div>
                    <div className="text-[11px] text-dusty-denim-500">{s.voyage}</div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1 font-semibold text-ink-black-800 dark:text-blue-slate-100">
                      <Package className="h-3 w-3" />{s.cargo}
                    </div>
                    <div className="text-[11px] text-dusty-denim-500">{s.quantity} · {s.owner}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-dusty-denim-700 dark:text-blue-slate-200">
                    {s.from} <span className="text-dusty-denim-400">→</span> {s.to}
                  </td>
                  <td className="py-2.5 pr-3 font-medium">{s.vessel}</td>
                  <td className="py-2.5 pr-3 text-[11px] text-dusty-denim-500">
                    <div>Dep: {s.depart}</div>
                    <div>Arr: {s.arrive}</div>
                  </td>
                  {/* Loading — editable */}
                  <td className="py-2.5 pr-3">
                    {updating === `${s.id}-loading` ? (
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="100" defaultValue={s.loading_pct}
                          onBlur={(e) => updateProgress(s.id,'loading_pct',e.target.value)}
                          onKeyDown={(e) => { if (e.key==='Enter') updateProgress(s.id,'loading_pct',e.target.value); }}
                          className="w-14 rounded border border-dusty-denim-200 px-1 py-0.5 text-xs dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" autoFocus />
                        <span className="text-[10px]">%</span>
                      </div>
                    ) : (
                      <button onClick={() => setUpdating(`${s.id}-loading`)} title="Click to update"
                        className="flex items-center gap-1.5 hover:opacity-80">
                        <div className="h-2 w-16 rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width:`${s.loading_pct}%` }} />
                        </div>
                        <span className="font-semibold">{s.loading_pct}%</span>
                        <SlidersHorizontal className="h-3 w-3 text-dusty-denim-400" />
                      </button>
                    )}
                  </td>
                  {/* Unloading — editable */}
                  <td className="py-2.5 pr-3">
                    {updating === `${s.id}-unloading` ? (
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="100" defaultValue={s.unloading_pct}
                          onBlur={(e) => updateProgress(s.id,'unloading_pct',e.target.value)}
                          onKeyDown={(e) => { if (e.key==='Enter') updateProgress(s.id,'unloading_pct',e.target.value); }}
                          className="w-14 rounded border border-dusty-denim-200 px-1 py-0.5 text-xs dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" autoFocus />
                        <span className="text-[10px]">%</span>
                      </div>
                    ) : (
                      <button onClick={() => setUpdating(`${s.id}-unloading`)} title="Click to update"
                        className="flex items-center gap-1.5 hover:opacity-80">
                        <div className="h-2 w-16 rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                          <div className="h-full rounded-full bg-ink-black-500" style={{ width:`${s.unloading_pct}%` }} />
                        </div>
                        <span className="font-semibold">{s.unloading_pct}%</span>
                        <SlidersHorizontal className="h-3 w-3 text-dusty-denim-400" />
                      </button>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[s.status] || ''}`}>
                      {s.status}
                    </span>
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
