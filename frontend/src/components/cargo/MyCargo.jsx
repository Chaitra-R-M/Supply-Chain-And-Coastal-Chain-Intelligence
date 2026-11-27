import React, { useState } from 'react';
import { Edit3, Package, Plus, X } from 'lucide-react';

const initCargo = [
  { id: 'CRG-101', name: 'Basmati Rice', category: 'Agricultural', qty: 500, unit: 'MT', origin: 'Mangalore Port', destination: 'Kochi Port', weight_kg: 500000, length_m: null, storage: 'Dry, ventilated', status: 'In Transit' },
  { id: 'CRG-102', name: 'Cardamom', category: 'Spice', qty: 25, unit: 'MT', origin: 'Kochi Port', destination: 'Mumbai (JNPT)', weight_kg: 25000, length_m: null, storage: 'Cool, dry', status: 'Pending Request' },
  { id: 'CRG-103', name: 'Pepper (Black)', category: 'Spice', qty: 15, unit: 'MT', origin: 'Kochi Port', destination: 'Mumbai (JNPT)', weight_kg: 15000, length_m: null, storage: 'Cool, dry, airtight', status: 'At Port Storage' },
  { id: 'CRG-104', name: 'Urea Fertilizer', category: 'Chemical', qty: 280, unit: 'MT', origin: 'Chennai Port', destination: 'Mangalore Port', weight_kg: 280000, length_m: null, storage: 'Dry, away from moisture', status: 'Delivered' },
  { id: 'CRG-105', name: 'Steel Rods', category: 'Metals', qty: 120, unit: 'MT', origin: 'Mumbai (JNPT)', destination: 'Mangalore Port', weight_kg: 120000, length_m: 12, storage: 'Open yard, weather cover', status: 'Pending Request' },
  { id: 'CRG-106', name: 'Coconut Oil', category: 'Food', qty: 60, unit: 'MT', origin: 'Kochi Port', destination: 'Chennai Port', weight_kg: 60000, length_m: null, storage: 'Tanker / sealed containers', status: 'At Port Storage' },
];

const STATUS_STYLES = {
  'In Transit': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Delivered: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  'Pending Request': 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
  'At Port Storage': 'bg-ink-black-500/15 text-ink-black-700 dark:text-ink-black-300',
};

export default function MyCargo() {
  const [cargo, setCargo] = useState(initCargo);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', qty: '', unit: 'MT', origin: '', destination: '', storage: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, category: c.category, qty: c.qty, unit: c.unit, origin: c.origin, destination: c.destination, storage: c.storage });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      setCargo((prev) => prev.map((c) => (c.id === editing ? { ...c, ...form, qty: Number(form.qty) } : c)));
      showToast('Cargo updated successfully');
    } else {
      const id = `CRG-${107 + cargo.length}`;
      setCargo((prev) => [...prev, { id, ...form, qty: Number(form.qty), weight_kg: Number(form.qty) * 1000, length_m: null, status: 'Pending Request' }]);
      showToast(`Cargo ${id} registered`);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', category: '', qty: '', unit: 'MT', origin: '', destination: '', storage: '' });
  };

  const PORTS = ['Mangalore Port', 'Kochi Port', 'Mumbai (JNPT)', 'Mormugao Port', 'Tuticorin Port', 'Chennai Port'];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">My Cargo</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Register, manage and track your registered cargo items
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setForm({ name: '', category: '', qty: '', unit: 'MT', origin: '', destination: '', storage: '' }); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-eggshell-500 px-3 py-2 text-xs font-semibold text-white hover:bg-eggshell-600 dark:bg-eggshell-700 dark:hover:bg-eggshell-600"
        >
          <Plus className="h-3.5 w-3.5" /> Register Cargo
        </button>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Cargo Items', value: cargo.length },
          { label: 'In Transit', value: cargo.filter((c) => c.status === 'In Transit').length },
          { label: 'Pending Request', value: cargo.filter((c) => c.status === 'Pending Request').length },
          { label: 'Delivered', value: cargo.filter((c) => c.status === 'Delivered').length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <Package className="h-4 w-4 text-eggshell-500 dark:text-eggshell-400" />
            <p className="mt-1.5 text-2xl font-extrabold text-ink-black-900 dark:text-white">{s.value}</p>
            <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cargo Table */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Cargo</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Quantity</th>
                <th className="py-2 pr-3">Origin → Destination</th>
                <th className="py-2 pr-3">Storage</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {cargo.map((c) => (
                <tr key={c.id} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                  <td className="py-2.5 pr-3 font-bold text-ink-black-900 dark:text-white">{c.id}</td>
                  <td className="py-2.5 pr-3 font-semibold">{c.name}</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{c.category}</td>
                  <td className="py-2.5 pr-3 font-semibold">{c.qty} {c.unit}</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{c.origin} → {c.destination}</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-500 dark:text-blue-slate-400">{c.storage}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span>
                  </td>
                  <td className="py-2.5">
                    <button type="button" onClick={() => openEdit(c)} className="inline-flex items-center gap-1 rounded-lg border border-dusty-denim-200 px-2 py-1 text-[10px] font-semibold hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:hover:bg-deep-space-blue-800">
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">{editing ? 'Edit Cargo' : 'Register New Cargo'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-blue-slate-400 hover:text-ink-black-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label><span className="font-semibold">Cargo Name</span>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basmati Rice" className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold">Category</span>
                <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Agricultural, Spice, Metal..." className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold">Quantity</span>
                <input required type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold">Unit</span>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option>MT</option><option>KG</option><option>Tonnes</option><option>Units</option>
                </select>
              </label>
              <label><span className="font-semibold">Origin Port</span>
                <select required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select port</option>
                  {PORTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label><span className="font-semibold">Destination Port</span>
                <select required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select port</option>
                  {PORTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="col-span-2"><span className="font-semibold">Storage Requirements</span>
                <input required value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} placeholder="e.g. Dry, ventilated; Cool and dry" className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700">Cancel</button>
              <button type="submit" className="rounded-lg bg-eggshell-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-eggshell-600 dark:bg-eggshell-700">{editing ? 'Save' : 'Register'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
