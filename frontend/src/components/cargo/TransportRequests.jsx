import React, { useState } from 'react';
import { CheckCircle2, ClipboardList, IndianRupee, MapPin, Plus, Send, Ship, X, XCircle } from 'lucide-react';

const initRequests = [
  { id: 'REQ-2041', cargo: 'Basmati Rice (CRG-101)', qty: '500 MT', from: 'Mangalore Port', to: 'Kochi Port', date: '2024-12-16', status: 'Accepted', company: 'India Coastal Shipping', vessel: 'MV Bharat', voyage: 'V-1021', cost: 185000, duration_hrs: 54 },
  { id: 'REQ-2040', cargo: 'Cardamom (CRG-102)', qty: '25 MT', from: 'Kochi Port', to: 'Mumbai (JNPT)', date: '2024-12-18', status: 'Pending', companies_quoted: 3 },
  { id: 'REQ-2039', cargo: 'Steel Rods (CRG-105)', qty: '120 MT', from: 'Mumbai (JNPT)', to: 'Mangalore Port', date: '2024-12-20', status: 'Pending', companies_quoted: 2 },
  { id: 'REQ-2038', cargo: 'Steel (CRG-104)', qty: '300 MT', from: 'Mumbai (JNPT)', to: 'Mangalore Port', date: '2024-12-14', status: 'Accepted', company: 'India Coastal Shipping', vessel: 'SS Konkan', voyage: 'V-1020', cost: 145000, duration_hrs: 36 },
  { id: 'REQ-2037', cargo: 'Urea Fertilizer (CRG-104)', qty: '280 MT', from: 'Chennai Port', to: 'Mangalore Port', date: '2024-12-12', status: 'Delivered', company: 'India Coastal Shipping', vessel: 'SS Konkan', voyage: 'V-1015', cost: 128000, duration_hrs: 42 },
];

const availableOptions = [
  { company: 'India Coastal Shipping', vessel: 'MV Bharat', capacity: '45,000 MT avail.', cost: 185000, duration_hrs: 54, rating: 4.6 },
  { company: 'Coastal Lines Pvt Ltd', vessel: 'MV Coastal Queen', capacity: '12,000 MT avail.', cost: 174000, duration_hrs: 62, rating: 4.2 },
  { company: 'Deccan Marine', vessel: 'MV Deccan Star', capacity: '28,000 MT avail.', cost: 196000, duration_hrs: 48, rating: 4.4 },
];

const STATUS_STYLES = {
  Pending: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
  Accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Delivered: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const PORTS = ['Mangalore Port', 'Kochi Port', 'Mumbai (JNPT)', 'Mormugao Port', 'Tuticorin Port', 'Chennai Port'];
const CARGO_ITEMS = ['Basmati Rice (CRG-101)', 'Cardamom (CRG-102)', 'Pepper (CRG-103)', 'Steel Rods (CRG-105)', 'Coconut Oil (CRG-106)'];

export default function TransportRequests() {
  const [requests, setRequests] = useState(initRequests);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cargo: '', qty: '', from: '', to: '', date: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = `REQ-${2042 + requests.length}`;
    setRequests((r) => [{ id, ...form, status: 'Pending', companies_quoted: 3 }, ...r]);
    showToast(`Transport request ${id} submitted to 3 shipping companies`);
    setShowForm(false);
    setForm({ cargo: '', qty: '', from: '', to: '', date: '' });
  };

  const handleCancel = (id) => {
    setRequests((r) => r.map((x) => (x.id === id ? { ...x, status: 'Rejected' } : x)));
    showToast(`Request ${id} cancelled`);
  };

  const pending = requests.filter((r) => r.status === 'Pending');
  const accepted = requests.filter((r) => r.status === 'Accepted' || r.status === 'Delivered');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Transportation Requests</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Create requests, compare shipping options &amp; track request status
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-eggshell-500 px-3 py-2 text-xs font-semibold text-white hover:bg-eggshell-600 dark:bg-eggshell-700"
        >
          <Plus className="h-3.5 w-3.5" /> New Request
        </button>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-eggshell-300 bg-eggshell-50 p-3.5 dark:border-eggshell-500/30 dark:bg-eggshell-500/10">
          <p className="text-2xl font-extrabold text-eggshell-900 dark:text-eggshell-200">{pending.length}</p>
          <p className="text-[11px] font-semibold text-eggshell-700 dark:text-eggshell-300">Pending</p>
        </div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{accepted.length}</p>
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Accepted / Completed</p>
        </div>
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">{requests.filter((r) => r.status === 'Rejected').length}</p>
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Cancelled</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {requests.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border p-4 shadow-sm ${
              r.status === 'Pending'
                ? 'border-eggshell-300 bg-eggshell-50/60 dark:border-eggshell-500/30 dark:bg-eggshell-500/5'
                : r.status === 'Rejected'
                ? 'border-dusty-denim-200 bg-white/70 opacity-80 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900/50'
                : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-ink-black-900 dark:text-white">{r.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[r.status] || ''}`}>{r.status}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-dusty-denim-700 dark:text-blue-slate-200">
                  <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{r.cargo}</span>
                  <span className="font-semibold">{r.qty}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.from} → {r.to}</span>
                  <span>Expected: {r.date}</span>
                </div>
                {r.company && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <Ship className="h-3 w-3" />Accepted: {r.company} — {r.vessel} on {r.voyage} · ₹{r.cost.toLocaleString()} · {r.duration_hrs} hrs
                  </p>
                )}
                {r.companies_quoted && !r.company && (
                  <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">{r.companies_quoted} shipping companies notified, awaiting response...</p>
                )}
              </div>
              {r.status === 'Pending' && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCancel(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Available Options (for pending requests) */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <h2 className="mb-1 text-base font-bold text-ink-black-900 dark:text-ink-black-50">Available Shipping Options</h2>
          <p className="mb-3 text-xs text-dusty-denim-500 dark:text-blue-slate-400">
            Compare cost, duration &amp; available capacity for your pending requests
          </p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {availableOptions.map((opt) => (
              <div key={opt.company} className="rounded-xl border border-dusty-denim-200 p-3.5 text-xs dark:border-deep-space-blue-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-black-900 dark:text-white">{opt.company}</span>
                  <span className="rounded-full bg-eggshell-500/15 px-2 py-0.5 text-[10px] font-bold text-eggshell-700 dark:text-eggshell-300">★ {opt.rating}</span>
                </div>
                <div className="mt-2 space-y-1 text-dusty-denim-600 dark:text-blue-slate-300">
                  <p className="flex items-center gap-1"><Ship className="h-3 w-3" />{opt.vessel} ({opt.capacity})</p>
                  <p className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{opt.cost.toLocaleString()}</p>
                  <p>Estimated delivery: {opt.duration_hrs} hrs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Create Transportation Request</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-blue-slate-400 hover:text-ink-black-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <label><span className="font-semibold">Select Cargo</span>
                <select required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select registered cargo</option>
                  {CARGO_ITEMS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label><span className="font-semibold">Quantity (MT)</span>
                <input required type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="e.g. 500" className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="font-semibold">Source Port</span>
                  <select required value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                    <option value="">Select port</option>
                    {PORTS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <label><span className="font-semibold">Destination Port</span>
                  <select required value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                    <option value="">Select port</option>
                    {PORTS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <label><span className="font-semibold">Expected Transportation Date</span>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700">Cancel</button>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-eggshell-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-eggshell-600 dark:bg-eggshell-700">
                <Send className="h-3.5 w-3.5" /> Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
