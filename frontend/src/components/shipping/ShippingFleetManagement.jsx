import React, { useState } from 'react';
import { Anchor, Container, Edit3, Plus, Ship, X } from 'lucide-react';

const initialFleet = [
  { id: 1, name: 'MV Bharat', imo: 'IMO9234561', type: 'Bulk Carrier', capacity_mt: 52000, length_m: 190, width_m: 32, draft_m: 11.5, status: 'En Route', availability: 'On Voyage', assigned_voyage: 'V-1021' },
  { id: 2, name: 'SS Konkan', imo: 'IMO8876543', type: 'Container', capacity_mt: 28000, length_m: 172, width_m: 27, draft_m: 9.2, status: 'At Berth', availability: 'Available', assigned_voyage: null },
  { id: 3, name: 'MV Malabar', imo: 'IMO7654321', type: 'Tanker', capacity_mt: 41000, length_m: 183, width_m: 30, draft_m: 12.1, status: 'Anchored', availability: 'Available', assigned_voyage: null },
  { id: 4, name: 'MV Sahyadri', imo: 'IMO6543219', type: 'General Cargo', capacity_mt: 15000, length_m: 145, width_m: 22, draft_m: 8.4, status: 'Delayed', availability: 'On Voyage', assigned_voyage: 'V-1018' },
  { id: 5, name: 'MV Coastal Queen', imo: 'IMO5432198', type: 'General Cargo', capacity_mt: 12000, length_m: 128, width_m: 20, draft_m: 7.8, status: 'Docked', availability: 'Available', assigned_voyage: null },
  { id: 6, name: 'MV Deccan Star', imo: 'IMO4321987', type: 'Container', capacity_mt: 35000, length_m: 180, width_m: 28, draft_m: 10.5, status: 'En Route', availability: 'On Voyage', assigned_voyage: 'V-1019' },
  { id: 7, name: 'MV Indian Ocean', imo: 'IMO3219876', type: 'Bulk Carrier', capacity_mt: 55000, length_m: 200, width_m: 34, draft_m: 12.5, status: 'Under Maintenance', availability: 'Unavailable', assigned_voyage: null },
  { id: 8, name: 'MV Western Ghats', imo: 'IMO2198765', type: 'Tanker', capacity_mt: 38000, length_m: 175, width_m: 29, draft_m: 11.2, status: 'En Route', availability: 'On Voyage', assigned_voyage: 'V-1017' },
];

const STATUS_COLORS = {
  'En Route': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'At Berth': 'bg-ink-black-500/15 text-ink-black-700 dark:text-ink-black-300',
  Anchored: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
  Delayed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Docked: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  'Under Maintenance': 'bg-dusty-denim-500/15 text-dusty-denim-700 dark:text-dusty-denim-300',
};

export default function ShippingFleetManagement() {
  const [fleet, setFleet] = useState(initialFleet);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', imo: '', type: 'Bulk Carrier', capacity_mt: '', length_m: '', width_m: '', draft_m: '',
  });
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openEdit = (v) => {
    setEditing(v.id);
    setForm({ name: v.name, imo: v.imo, type: v.type, capacity_mt: v.capacity_mt, length_m: v.length_m, width_m: v.width_m, draft_m: v.draft_m });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      capacity_mt: Number(form.capacity_mt),
      length_m: Number(form.length_m),
      width_m: Number(form.width_m),
      draft_m: Number(form.draft_m),
    };
    if (editing) {
      setFleet((f) => f.map((v) => (v.id === editing ? { ...v, ...payload } : v)));
      showToast('Vessel updated successfully');
    } else {
      setFleet((f) => [
        ...f,
        { id: Date.now(), ...payload, status: 'Docked', availability: 'Available', assigned_voyage: null },
      ]);
      showToast('Vessel registered successfully');
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', imo: '', type: 'Bulk Carrier', capacity_mt: '', length_m: '', width_m: '', draft_m: '' });
  };

  const cycleStatus = (id) => {
    const statuses = ['Docked', 'En Route', 'At Berth', 'Anchored', 'Under Maintenance'];
    setFleet((f) =>
      f.map((v) => {
        if (v.id !== id) return v;
        const idx = statuses.indexOf(v.status);
        const next = statuses[(idx + 1) % statuses.length];
        return { ...v, status: next, availability: next === 'En Route' ? 'On Voyage' : next === 'Under Maintenance' ? 'Unavailable' : 'Available' };
      })
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Fleet Management</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Register vessels, maintain specifications &amp; monitor operational status
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setForm({ name: '', imo: '', type: 'Bulk Carrier', capacity_mt: '', length_m: '', width_m: '', draft_m: '' }); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ink-black-600"
        >
          <Plus className="h-3.5 w-3.5" /> Register Vessel
        </button>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* Fleet Table */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">Vessel</th>
                <th className="py-2 pr-3">IMO</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Capacity</th>
                <th className="py-2 pr-3">L×W×Draft (m)</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Availability</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {fleet.map((v) => (
                <tr key={v.id} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                  <td className="py-2.5 pr-3 font-bold text-ink-black-900 dark:text-ink-black-50">
                    <span className="flex items-center gap-1.5"><Ship className="h-3.5 w-3.5 text-ink-black-500" />{v.name}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{v.imo}</td>
                  <td className="py-2.5 pr-3">{v.type}</td>
                  <td className="py-2.5 pr-3 font-semibold">{v.capacity_mt.toLocaleString()} MT</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{v.length_m}×{v.width_m}×{v.draft_m}</td>
                  <td className="py-2.5 pr-3">
                    <button
                      type="button"
                      onClick={() => cycleStatus(v.id)}
                      title="Click to change status"
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[v.status] || ''}`}
                    >
                      {v.status}
                    </button>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`font-semibold ${v.availability === 'Available' ? 'text-emerald-600 dark:text-emerald-400' : 'text-dusty-denim-500'}`}>
                      {v.availability}{v.assigned_voyage ? ` (${v.assigned_voyage})` : ''}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <button
                      type="button"
                      onClick={() => openEdit(v)}
                      className="inline-flex items-center gap-1 rounded-lg border border-dusty-denim-200 px-2 py-1 text-[10px] font-semibold text-ink-black-700 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:text-blue-slate-200 dark:hover:bg-deep-space-blue-800"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">
                {editing ? 'Update Vessel Information' : 'Register New Vessel'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-blue-slate-400 hover:text-ink-black-900 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Vessel Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white"
                />
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">IMO Number</span>
                <input
                  required
                  value={form.imo}
                  onChange={(e) => setForm({ ...form, imo: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white"
                />
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Vessel Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white"
                >
                  <option>Bulk Carrier</option>
                  <option>Container</option>
                  <option>Tanker</option>
                  <option>General Cargo</option>
                </select>
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Cargo Capacity (MT)</span>
                <input
                  required
                  type="number"
                  value={form.capacity_mt}
                  onChange={(e) => setForm({ ...form, capacity_mt: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white"
                />
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Length (m)</span>
                <input
                  required
                  type="number"
                  value={form.length_m}
                  onChange={(e) => setForm({ ...form, length_m: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white"
                />
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Width (m)</span>
                <input
                  required
                  type="number"
                  value={form.width_m}
                  onChange={(e) => setForm({ ...form, width_m: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white"
                />
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Draft (m)</span>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={form.draft_m}
                  onChange={(e) => setForm({ ...form, draft_m: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold text-ink-black-800 dark:border-deep-space-blue-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600"
              >
                {editing ? 'Save Changes' : 'Register Vessel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Capacity Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Ship className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-2xl font-extrabold text-ink-black-900 dark:text-white">{fleet.length}</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Total Vessels</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Container className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-2xl font-extrabold text-ink-black-900 dark:text-white">
            {fleet.reduce((s, v) => s + v.capacity_mt, 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Total Cargo Capacity (MT)</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Anchor className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-2xl font-extrabold text-ink-black-900 dark:text-white">
            {fleet.filter((v) => v.availability === 'Available').length}
          </p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Available Vessels</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Container className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-2xl font-extrabold text-ink-black-900 dark:text-white">
            {fleet.filter((v) => v.availability === 'On Voyage').length}
          </p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">On Voyage</p>
        </div>
      </div>
    </div>
  );
}
