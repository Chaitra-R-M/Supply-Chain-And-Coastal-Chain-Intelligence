import React, { useState } from 'react';
import { Anchor, CheckCircle2, Clock, MapPin, Plus, Send, X } from 'lucide-react';

const ports = [
  { id: 'mangalore', name: 'Mangalore Port', berths: 8, available: 3, congestion: 'Moderate', contacts: 'Cmdr. Ravi Nair – +91-824-2229141' },
  { id: 'kochi', name: 'Kochi Port', berths: 12, available: 5, congestion: 'Low', contacts: 'Supt. Priya Menon – +91-484-2668001' },
  { id: 'mumbai', name: 'Mumbai (JNPT)', berths: 24, available: 7, congestion: 'High', contacts: 'Dir. Suresh Reddy – +91-22-27244000' },
  { id: 'mormugao', name: 'Mormugao Port', berths: 6, available: 2, congestion: 'Moderate', contacts: 'Ops. Fatima Khan – +91-832-2250700' },
];

const arrivals = [
  { id: 'ARR-301', vessel: 'MV Bharat', port: 'Kochi Port', berth: 'B-04', eta: 'Dec 18, 14:30', status: 'Confirmed', cargo: '500 MT Rice' },
  { id: 'ARR-300', vessel: 'MV Sahyadri', port: 'Mumbai (JNPT)', berth: 'Pending', eta: 'Dec 18, 17:00', status: 'Submitted', cargo: '150 MT Spices' },
  { id: 'ARR-299', vessel: 'SS Konkan', port: 'Mangalore Port', berth: 'B-02', eta: 'Dec 15, 08:00', status: 'Completed', cargo: '300 MT Steel' },
];

const STATUS_STYLES = {
  Confirmed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Submitted: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
  Completed: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Pending: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

export default function ShippingPortCoordination() {
  const [reqs, setReqs] = useState(arrivals);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vessel: '', port: '', eta: '', cargo: '', draft_m: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const submit = (e) => {
    e.preventDefault();
    const newReq = {
      id: `ARR-${302 + reqs.length}`,
      vessel: form.vessel,
      port: form.port,
      berth: 'Pending',
      eta: form.eta,
      status: 'Submitted',
      cargo: form.cargo,
    };
    setReqs((r) => [newReq, ...r]);
    showToast(`Arrival notice for ${form.vessel} submitted to ${form.port}`);
    setShowForm(false);
    setForm({ vessel: '', port: '', eta: '', cargo: '', draft_m: '' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Port Coordination</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Submit vessel arrival notices, request berth allocation &amp; track berth assignment status
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-black-600"
        >
          <Send className="h-3.5 w-3.5" /> Submit Arrival Notice
        </button>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>
      )}

      {/* Port Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ports.map((p) => (
          <div key={p.id} className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="flex items-center gap-2 mb-2">
              <Anchor className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
              <span className="text-sm font-bold text-ink-black-900 dark:text-white">{p.name}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Total Berths</span>
                <span className="font-bold">{p.berths}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Available</span>
                <span className={`font-bold ${p.available >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{p.available}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Congestion</span>
                <span className={`font-semibold ${p.congestion === 'High' ? 'text-rose-500' : p.congestion === 'Moderate' ? 'text-eggshell-600 dark:text-eggshell-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{p.congestion}</span>
              </div>
              <p className="pt-1 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{p.contacts}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Arrival Requests */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <h2 className="mb-3 text-base font-bold text-ink-black-900 dark:text-ink-black-50">Vessel Arrival Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">Ref</th>
                <th className="py-2 pr-3">Vessel</th>
                <th className="py-2 pr-3">Destination Port</th>
                <th className="py-2 pr-3">Cargo</th>
                <th className="py-2 pr-3">ETA</th>
                <th className="py-2 pr-3">Berth Assigned</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {reqs.map((r) => (
                <tr key={r.id} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                  <td className="py-2.5 pr-3 font-bold text-ink-black-900 dark:text-white">{r.id}</td>
                  <td className="py-2.5 pr-3 font-semibold">{r.vessel}</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{r.port}</td>
                  <td className="py-2.5 pr-3">{r.cargo}</td>
                  <td className="py-2.5 pr-3 flex items-center gap-1 text-dusty-denim-600 dark:text-blue-slate-300">
                    <Clock className="h-3 w-3" />{r.eta}
                  </td>
                  <td className="py-2.5 pr-3">
                    {r.berth === 'Pending'
                      ? <span className="text-dusty-denim-400 italic">Awaiting assignment</span>
                      : <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{r.berth}</span>
                    }
                  </td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[r.status] || ''}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Arrival Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Submit Vessel Arrival Notice</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-blue-slate-400 hover:text-ink-black-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Vessel Name</span>
                <input required value={form.vessel} onChange={(e) => setForm({ ...form, vessel: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Destination Port</span>
                <select required value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select port</option>
                  {ports.map((p) => <option key={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Expected Arrival</span>
                <input required type="datetime-local" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Cargo Info</span>
                <input required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="e.g. 500 MT Rice" className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Draft (m)</span>
                <input required type="number" step="0.1" value={form.draft_m} onChange={(e) => setForm({ ...form, draft_m: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold text-ink-black-800 dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">Submit Notice</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
