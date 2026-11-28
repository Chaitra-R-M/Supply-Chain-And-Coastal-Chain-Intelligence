import React, { useState } from 'react';
import { CheckCircle2, MapPin, Package, Ship, X, XCircle } from 'lucide-react';

const initRequests = [
  { id: 'REQ-2041', owner: 'Agro India Exports', cargo: 'Rice', quantity: '500 MT', from: 'Mangalore Port', to: 'Kochi Port', date: '2024-12-16', status: 'Pending', estimated_cost: 185000 },
  { id: 'REQ-2040', owner: 'Spice Traders Ltd', cargo: 'Cardamom', quantity: '25 MT', from: 'Kochi Port', to: 'Mumbai (JNPT)', date: '2024-12-18', status: 'Pending', estimated_cost: 92000 },
  { id: 'REQ-2039', owner: 'Coastal Steel Works', cargo: 'Steel Coils', quantity: '340 MT', from: 'Mumbai (JNPT)', to: 'Mangalore Port', date: '2024-12-17', status: 'Pending', estimated_cost: 145000 },
  { id: 'REQ-2038', owner: 'Agro India Exports', cargo: 'Steel', quantity: '300 MT', from: 'Mumbai (JNPT)', to: 'Mangalore Port', date: '2024-12-14', status: 'Accepted', vessel: 'SS Konkan', voyage: 'V-1020' },
  { id: 'REQ-2037', owner: 'Deccan Energy', cargo: 'Coal', quantity: '200 MT', from: 'Kochi Port', to: 'Tuticorin Port', date: '2024-12-17', status: 'Accepted', vessel: 'MV Deccan Star', voyage: 'V-1019' },
  { id: 'REQ-2036', owner: 'Marine Foods', cargo: 'Frozen Shrimp', quantity: '40 MT', from: 'Kochi Port', to: 'Mumbai (JNPT)', date: '2024-12-12', status: 'Rejected', reason: 'No reefer vessel available' },
];

const initVessels = [
  { name: 'MV Bharat', type: 'Bulk Carrier', capacity_mt: 52000, available: 45000 },
  { name: 'SS Konkan', type: 'Container', capacity_mt: 28000, available: 28000 },
  { name: 'MV Malabar', type: 'Tanker', capacity_mt: 41000, available: 41000 },
  { name: 'MV Coastal Queen', type: 'General Cargo', capacity_mt: 12000, available: 12000 },
  { name: 'MV Sahyadri', type: 'General Cargo', capacity_mt: 15000, available: 8500 },
];

const STATUS_STYLES = {
  Pending: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
  Accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const PORTS = ['Mangalore Port', 'Kochi Port', 'Mumbai (JNPT)', 'Mormugao Port', 'Tuticorin Port', 'Chennai Port'];

export default function ShippingCargoRequests() {
  const [requests, setRequests] = useState(initRequests);
  const [vessels] = useState(initVessels);
  const [assigning, setAssigning] = useState(null);
  const [assignVessel, setAssignVessel] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleAccept = (req) => {
    setAssigning(req);
    setAssignVessel('');
  };

  const confirmAssign = (e) => {
    e.preventDefault();
    if (!assignVessel) return;
    const vessel = vessels.find((v) => v.name === assignVessel);
    const qty = parseFloat(assigning.quantity) || 0;
    if (qty > vessel.available) {
      showToast(`Error: ${assigning.cargo} (${assigning.quantity}) exceeds ${vessel.name}'s available capacity (${vessel.available} MT)`);
      return;
    }
    const voyageId = `V-${1022 + Math.floor(Math.random() * 50)}`;
    setRequests((r) => r.map((x) => (x.id === assigning.id ? { ...x, status: 'Accepted', vessel: assignVessel, voyage: voyageId } : x)));
    showToast(`Request ${assigning.id} accepted — ${assignVessel} assigned, voyage ${voyageId} created from ${assigning.from} to ${assigning.to}`);
    setAssigning(null);
  };

  const handleReject = (id) => {
    setRequests((r) => r.map((x) => (x.id === id ? { ...x, status: 'Rejected', reason: 'Capacity constraints this week' } : x)));
    showToast(`Request ${id} rejected`);
  };

  const pending = requests.filter((r) => r.status === 'Pending');
  const accepted = requests.filter((r) => r.status === 'Accepted');
  const rejected = requests.filter((r) => r.status === 'Rejected');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Cargo Transportation Requests</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Review incoming requests, check fleet capacity &amp; assign vessels
        </p>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-eggshell-300 bg-eggshell-50 p-3.5 text-eggshell-900 dark:border-eggshell-500/30 dark:bg-eggshell-500/10 dark:text-eggshell-200">
          <p className="text-2xl font-extrabold">{pending.length}</p>
          <p className="text-[11px] font-semibold">Pending Requests</p>
        </div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <p className="text-2xl font-extrabold">{accepted.length}</p>
          <p className="text-[11px] font-semibold">Accepted</p>
        </div>
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <p className="text-2xl font-extrabold">{rejected.length}</p>
          <p className="text-[11px] font-semibold">Rejected</p>
        </div>
      </div>

      {/* Request Cards */}
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
                  <span className="text-xs font-semibold text-dusty-denim-600 dark:text-blue-slate-300">{r.owner}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[r.status] || ''}`}>{r.status}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-dusty-denim-700 dark:text-blue-slate-200">
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" />{r.cargo} — {r.quantity}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.from} → {r.to}</span>
                  <span>Expected: {r.date}</span>
                </div>
                {r.estimated_cost && (
                  <p className="text-xs font-semibold text-ink-black-700 dark:text-blue-slate-100">Est. Cost: ₹{r.estimated_cost.toLocaleString()}</p>
                )}
                {r.vessel && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <Ship className="h-3 w-3" />Assigned: {r.vessel} on voyage {r.voyage}
                  </p>
                )}
                {r.reason && <p className="text-xs text-rose-600 dark:text-rose-300">Reason: {r.reason}</p>}
              </div>
              {r.status === 'Pending' && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(r)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assign Vessel Modal */}
      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={confirmAssign} className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Assign Vessel to {assigning.id}</h3>
              <button type="button" onClick={() => setAssigning(null)} className="text-blue-slate-400 hover:text-ink-black-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-dusty-denim-600 dark:text-blue-slate-300">
                <strong>{assigning.cargo}</strong> ({assigning.quantity}) from <strong>{assigning.from}</strong> to <strong>{assigning.to}</strong>
              </p>
              <p className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Select available vessel (capacity check enforced):</p>
              <div className="space-y-2">
                {vessels.map((v) => {
                  const qty = parseFloat(assigning.quantity) || 0;
                  const fits = qty <= v.available;
                  return (
                    <label
                      key={v.name}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${
                        fits
                          ? 'border-dusty-denim-200 hover:border-ink-black-400 dark:border-deep-space-blue-700'
                          : 'border-rose-300 bg-rose-50/60 cursor-not-allowed dark:border-rose-500/30 dark:bg-rose-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="vessel"
                          value={v.name}
                          checked={assignVessel === v.name}
                          onChange={() => setAssignVessel(v.name)}
                          disabled={!fits}
                          className="h-3.5 w-3.5"
                        />
                        <span className="font-semibold text-ink-black-900 dark:text-white">{v.name}</span>
                        <span className="text-dusty-denim-500">{v.type}</span>
                      </div>
                      <span className={`font-semibold ${fits ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {fits ? `${v.available.toLocaleString()} MT avail.` : 'Insufficient capacity'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAssigning(null)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold text-ink-black-800 dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" disabled={!assignVessel} className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600 disabled:opacity-50">Confirm Assignment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
