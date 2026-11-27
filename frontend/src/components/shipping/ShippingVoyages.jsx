import React, { useState } from 'react';
import { CheckCircle2, Clock, Navigation, Plus, Ship, X } from 'lucide-react';

const PORTS = ['Mangalore Port', 'Kochi Port', 'Mumbai (JNPT)', 'Mormugao Port', 'Tuticorin Port', 'Chennai Port'];
const VESSELS = ['MV Bharat', 'SS Konkan', 'MV Malabar', 'MV Sahyadri', 'MV Coastal Queen', 'MV Deccan Star'];

const initVoyages = [
  { id: 'V-1021', from: 'Mangalore Port', to: 'Kochi Port', vessel: 'MV Bharat', departure: '2024-12-16T08:00', arrival: '2024-12-18T14:00', status: 'Active', cargo: '500 MT Rice (REQ-2041)' },
  { id: 'V-1020', from: 'Mumbai (JNPT)', to: 'Mangalore Port', vessel: 'SS Konkan', departure: '2024-12-14T10:00', arrival: '2024-12-15T22:00', status: 'Completed', cargo: '300 MT Steel (REQ-2038)' },
  { id: 'V-1019', from: 'Kochi Port', to: 'Tuticorin Port', vessel: 'MV Deccan Star', departure: '2024-12-17T07:00', arrival: '2024-12-19T09:00', status: 'Active', cargo: '200 MT Coal (REQ-2037)' },
  { id: 'V-1018', from: 'Mormugao Port', to: 'Mumbai (JNPT)', vessel: 'MV Sahyadri', departure: '2024-12-16T06:00', arrival: '2024-12-18T12:00', status: 'Delayed', cargo: '150 MT Spices (REQ-2033)' },
  { id: 'V-1017', from: 'Mangalore Port', to: 'Chennai Port', vessel: 'MV Western Ghats', departure: '2024-12-15T18:00', arrival: '2024-12-17T14:00', status: 'Completed', cargo: '420 MT Cement (REQ-2029)' },
  { id: 'V-1016', from: 'Mumbai (JNPT)', to: 'Kochi Port', vessel: 'MV Malabar', departure: '2024-12-15T09:00', arrival: '2024-12-16T18:00', status: 'Completed', cargo: '310 MT Electronics (REQ-2025)' },
];

const STATUS_STYLES = {
  Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Completed: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Delayed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Scheduled: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
};

export default function ShippingVoyages() {
  const [voyages, setVoyages] = useState(initVoyages);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ from: '', to: '', vessel: '', departure: '', arrival: '', cargo: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = filter === 'All' ? voyages : voyages.filter((v) => v.status === filter);

  const handleCreate = (e) => {
    e.preventDefault();
    const id = `V-${1022 + voyages.length}`;
    setVoyages((prev) => [{ id, ...form, status: 'Scheduled' }, ...prev]);
    showToast(`Voyage ${id} created successfully`);
    setShowForm(false);
    setForm({ from: '', to: '', vessel: '', departure: '', arrival: '', cargo: '' });
  };

  const updateStatus = (id, status) => {
    setVoyages((v) => v.map((x) => (x.id === id ? { ...x, status } : x)));
    showToast(`Voyage ${id} status updated to ${status}`);
  };

  const totalActive = voyages.filter((v) => v.status === 'Active').length;
  const totalCompleted = voyages.filter((v) => v.status === 'Completed').length;
  const totalDelayed = voyages.filter((v) => v.status === 'Delayed').length;
  const totalScheduled = voyages.filter((v) => v.status === 'Scheduled').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Voyage Management</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Create &amp; manage voyages, assign vessels, track schedules &amp; maintain voyage history
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ink-black-600"
        >
          <Plus className="h-3.5 w-3.5" /> New Voyage
        </button>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>
      )}

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All', count: voyages.length },
          { label: 'Active', count: totalActive },
          { label: 'Scheduled', count: totalScheduled },
          { label: 'Completed', count: totalCompleted },
          { label: 'Delayed', count: totalDelayed },
        ].map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.label)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === f.label
                ? 'border-ink-black-500 bg-ink-black-500 text-white'
                : 'border-dusty-denim-200 text-dusty-denim-600 hover:border-ink-black-300 dark:border-deep-space-blue-700 dark:text-blue-slate-300'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Voyage List */}
      <div className="space-y-3">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-ink-black-900 dark:text-white">{v.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[v.status] || ''}`}>{v.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-black-800 dark:text-ink-black-100">
                  <Navigation className="h-3.5 w-3.5 text-ink-black-500" />
                  <span>{v.from}</span>
                  <span className="text-dusty-denim-400">→</span>
                  <span>{v.to}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-dusty-denim-600 dark:text-blue-slate-300">
                  <span className="flex items-center gap-1"><Ship className="h-3 w-3" />{v.vessel}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Dep: {v.departure}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Arr: {v.arrival}</span>
                </div>
                <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">Cargo: {v.cargo}</p>
              </div>
              {v.status !== 'Completed' && (
                <div className="flex shrink-0 gap-2">
                  {v.status === 'Scheduled' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(v.id, 'Active')}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700"
                    >
                      Start Voyage
                    </button>
                  )}
                  {v.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(v.id, 'Completed')}
                      className="rounded-lg bg-ink-black-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-ink-black-600"
                    >
                      Mark Completed
                    </button>
                  )}
                  {v.status === 'Delayed' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(v.id, 'Active')}
                      className="rounded-lg border border-eggshell-400 px-2.5 py-1 text-[10px] font-semibold text-eggshell-700 hover:bg-eggshell-50 dark:text-eggshell-300"
                    >
                      Resume
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Voyage Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Create New Voyage</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-blue-slate-400 hover:text-ink-black-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Source Port</span>
                <select required value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select port</option>
                  {PORTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Destination Port</span>
                <select required value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select port</option>
                  {PORTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Assign Vessel</span>
                <select required value={form.vessel} onChange={(e) => setForm({ ...form, vessel: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select vessel</option>
                  {VESSELS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Cargo Info</span>
                <input required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="e.g. 500 MT Rice (REQ-2041)" className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Planned Departure</span>
                <input required type="datetime-local" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label>
                <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Planned Arrival</span>
                <input required type="datetime-local" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold text-ink-black-800 dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">Create Voyage</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
