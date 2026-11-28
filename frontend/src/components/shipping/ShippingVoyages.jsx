import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Edit3, Navigation, Plus, Ship, X } from 'lucide-react';

const PORTS   = ['Mangalore Port','Kochi Port','Mumbai (JNPT)','Mormugao Port','Tuticorin Port','Chennai Port'];
const VESSELS = ['MV Bharat','SS Konkan','MV Malabar','MV Sahyadri','MV Coastal Queen','MV Deccan Star'];

const VOYAGE_EVENTS = {
  'V-1021': [
    { ts: 'Dec 16, 08:00', event: 'Voyage created and vessel MV Bharat assigned',      type: 'info'    },
    { ts: 'Dec 16, 08:15', event: 'Vessel departed Mangalore Port',                     type: 'success' },
    { ts: 'Dec 16, 14:30', event: 'Cargo loading confirmed — 500 MT Rice',              type: 'success' },
    { ts: 'Dec 17, 10:00', event: 'High swell advisory — speed reduced to 10 kn',       type: 'warning' },
  ],
  'V-1020': [
    { ts: 'Dec 14, 10:00', event: 'Voyage created, SS Konkan assigned',                 type: 'info'    },
    { ts: 'Dec 14, 10:30', event: 'Vessel departed Mumbai (JNPT)',                       type: 'success' },
    { ts: 'Dec 15, 20:00', event: 'Cargo unloading completed at Mangalore',              type: 'success' },
    { ts: 'Dec 15, 22:00', event: 'Voyage marked Completed',                             type: 'success' },
  ],
  'V-1018': [
    { ts: 'Dec 16, 06:00', event: 'Voyage created, MV Sahyadri assigned',               type: 'info'    },
    { ts: 'Dec 16, 06:30', event: 'Vessel departed Mormugao Port',                       type: 'success' },
    { ts: 'Dec 16, 18:00', event: 'Route deviation detected — 4.2 NM off track',        type: 'warning' },
    { ts: 'Dec 17, 09:00', event: 'ETA revised +3 hrs due to weather avoidance',        type: 'warning' },
  ],
};

const initVoyages = [
  { id:'V-1021', from:'Mangalore Port', to:'Kochi Port',       vessel:'MV Bharat',      departure:'2024-12-16T08:00', arrival:'2024-12-18T14:00', planned_arrival:'2024-12-18T11:00', status:'Active',    cargo:'500 MT Rice (REQ-2041)' },
  { id:'V-1020', from:'Mumbai (JNPT)',  to:'Mangalore Port',   vessel:'SS Konkan',       departure:'2024-12-14T10:00', arrival:'2024-12-15T22:00', planned_arrival:'2024-12-15T22:00', status:'Completed', cargo:'300 MT Steel (REQ-2038)' },
  { id:'V-1019', from:'Kochi Port',     to:'Tuticorin Port',   vessel:'MV Deccan Star',  departure:'2024-12-17T07:00', arrival:'2024-12-19T09:00', planned_arrival:'2024-12-19T09:00', status:'Active',    cargo:'200 MT Coal (REQ-2037)' },
  { id:'V-1018', from:'Mormugao Port',  to:'Mumbai (JNPT)',    vessel:'MV Sahyadri',     departure:'2024-12-16T06:00', arrival:'2024-12-18T17:00', planned_arrival:'2024-12-18T12:00', status:'Delayed',   cargo:'150 MT Spices (REQ-2033)' },
  { id:'V-1017', from:'Mangalore Port', to:'Chennai Port',     vessel:'MV Western Ghats',departure:'2024-12-15T18:00', arrival:'2024-12-17T14:00', planned_arrival:'2024-12-17T14:00', status:'Completed', cargo:'420 MT Cement (REQ-2029)' },
  { id:'V-1016', from:'Mumbai (JNPT)',  to:'Kochi Port',       vessel:'MV Malabar',      departure:'2024-12-15T09:00', arrival:'2024-12-16T18:00', planned_arrival:'2024-12-16T18:00', status:'Completed', cargo:'310 MT Electronics (REQ-2025)' },
];

const STATUS_STYLES = {
  Active:    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Completed: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Delayed:   'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Scheduled: 'bg-eggshell-500/15 text-eggshell-700 dark:text-eggshell-300',
};

export default function ShippingVoyages() {
  const [voyages, setVoyages]         = useState(initVoyages);
  const [filter, setFilter]           = useState('All');
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ from:'', to:'', vessel:'', departure:'', arrival:'', cargo:'' });
  const [toast, setToast]             = useState('');
  const [expandedId, setExpandedId]   = useState(null);
  const [reassigning, setReassigning] = useState(null); // voyage being reassigned
  const [newVessel, setNewVessel]     = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const filtered = filter === 'All' ? voyages : voyages.filter((v) => v.status === filter);

  const handleCreate = (e) => {
    e.preventDefault();
    const id = `V-${1022 + voyages.length}`;
    setVoyages((prev) => [{ id, ...form, planned_arrival: form.arrival, status:'Scheduled' }, ...prev]);
    showToast(`Voyage ${id} created`);
    setShowForm(false);
    setForm({ from:'', to:'', vessel:'', departure:'', arrival:'', cargo:'' });
  };

  const updateStatus = (id, status) => {
    setVoyages((v) => v.map((x) => x.id === id ? { ...x, status } : x));
    showToast(`Voyage ${id} → ${status}`);
  };

  const confirmReassign = (e) => {
    e.preventDefault();
    if (!newVessel) return;
    setVoyages((v) => v.map((x) => x.id === reassigning.id ? { ...x, vessel: newVessel } : x));
    showToast(`${reassigning.id} reassigned to ${newVessel}`);
    setReassigning(null);
    setNewVessel('');
  };

  // ETA delta helper
  const etaDelta = (v) => {
    if (!v.planned_arrival || !v.arrival || v.status === 'Completed') return null;
    const planned = new Date(v.planned_arrival);
    const actual  = new Date(v.arrival);
    const diff = Math.round((actual - planned) / 60000); // minutes
    if (diff === 0) return null;
    const hrs = Math.floor(Math.abs(diff) / 60);
    const mins = Math.abs(diff) % 60;
    return { late: diff > 0, text: `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${diff > 0 ? 'late' : 'early'}` };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Voyage Management</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">Create voyages, assign/reassign vessels, track schedules &amp; view voyage history</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-black-600">
          <Plus className="h-3.5 w-3.5" /> New Voyage
        </button>
      </div>

      {toast && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['All','Active','Scheduled','Completed','Delayed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter===f?'border-ink-black-500 bg-ink-black-500 text-white':'border-dusty-denim-200 text-dusty-denim-600 hover:border-ink-black-300 dark:border-deep-space-blue-700 dark:text-blue-slate-300'}`}>
            {f} ({f==='All'?voyages.length:voyages.filter((v)=>v.status===f).length})
          </button>
        ))}
      </div>

      {/* Voyage List */}
      <div className="space-y-3">
        {filtered.map((v) => {
          const delta    = etaDelta(v);
          const expanded = expandedId === v.id;
          const events   = VOYAGE_EVENTS[v.id] || [];
          return (
            <div key={v.id} className="rounded-xl border border-dusty-denim-200 bg-white shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink-black-900 dark:text-white">{v.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[v.status]||''}`}>{v.status}</span>
                      {delta && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${delta.late?'bg-rose-500/15 text-rose-600 dark:text-rose-300':'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'}`}>
                          {delta.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink-black-800 dark:text-ink-black-100">
                      <Navigation className="h-3.5 w-3.5 text-ink-black-500" />
                      <span>{v.from}</span><span className="text-dusty-denim-400">→</span><span>{v.to}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-dusty-denim-600 dark:text-blue-slate-300">
                      <span className="flex items-center gap-1"><Ship className="h-3 w-3" />{v.vessel}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Dep: {v.departure}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Arr: {v.arrival}{v.planned_arrival!==v.arrival?<span className="text-dusty-denim-400 ml-1">(planned: {v.planned_arrival})</span>:null}</span>
                    </div>
                    <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">Cargo: {v.cargo}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {/* Vessel reassignment */}
                    {v.status !== 'Completed' && (
                      <button onClick={() => { setReassigning(v); setNewVessel(v.vessel); }}
                        className="inline-flex items-center gap-1 rounded-lg border border-dusty-denim-200 px-2.5 py-1 text-[10px] font-semibold text-ink-black-700 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:text-white">
                        <Edit3 className="h-3 w-3" /> Reassign Vessel
                      </button>
                    )}
                    {v.status==='Scheduled' && <button onClick={()=>updateStatus(v.id,'Active')} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700">Start</button>}
                    {v.status==='Active'    && <button onClick={()=>updateStatus(v.id,'Completed')} className="rounded-lg bg-ink-black-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-ink-black-600">Complete</button>}
                    {v.status==='Delayed'   && <button onClick={()=>updateStatus(v.id,'Active')} className="rounded-lg border border-eggshell-400 px-2.5 py-1 text-[10px] font-semibold text-eggshell-700 dark:text-eggshell-300">Resume</button>}
                    {/* History toggle */}
                    <button onClick={() => setExpandedId(expanded ? null : v.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-dusty-denim-200 px-2.5 py-1 text-[10px] font-semibold text-dusty-denim-600 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:text-blue-slate-300">
                      History {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Voyage History Drilldown */}
              {expanded && (
                <div className="border-t border-dusty-denim-100 px-4 py-3 dark:border-deep-space-blue-800">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:text-blue-slate-400">Voyage Event Log</p>
                  {events.length === 0 ? (
                    <p className="text-xs text-dusty-denim-400 dark:text-blue-slate-500">No events recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {events.map((ev, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ev.type==='success'?'bg-emerald-500':ev.type==='warning'?'bg-eggshell-500':'bg-blue-slate-400'}`} />
                          <span className="font-semibold text-dusty-denim-500 dark:text-blue-slate-400">{ev.ts} — </span>
                          <span className="text-ink-black-800 dark:text-blue-slate-200">{ev.event}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reassign Vessel Modal */}
      {reassigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={confirmReassign} className="w-full max-w-sm rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Reassign Vessel — {reassigning.id}</h3>
              <button type="button" onClick={()=>setReassigning(null)} className="text-blue-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-xs text-dusty-denim-600 dark:text-blue-slate-300">Current vessel: <strong>{reassigning.vessel}</strong></p>
            <label className="text-xs"><span className="font-semibold">New Vessel</span>
              <select required value={newVessel} onChange={(e)=>setNewVessel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                {VESSELS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={()=>setReassigning(null)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">Confirm Reassignment</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Voyage Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Create New Voyage</h3>
              <button type="button" onClick={()=>setShowForm(false)} className="text-blue-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Source Port</span>
                <select required value={form.from} onChange={(e)=>setForm({...form,from:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select</option>{PORTS.map((p)=><option key={p}>{p}</option>)}
                </select>
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Destination Port</span>
                <select required value={form.to} onChange={(e)=>setForm({...form,to:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select</option>{PORTS.map((p)=><option key={p}>{p}</option>)}
                </select>
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Assign Vessel</span>
                <select required value={form.vessel} onChange={(e)=>setForm({...form,vessel:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  <option value="">Select</option>{VESSELS.map((v)=><option key={v}>{v}</option>)}
                </select>
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Cargo Info</span>
                <input required value={form.cargo} onChange={(e)=>setForm({...form,cargo:e.target.value})} placeholder="e.g. 500 MT Rice" className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Planned Departure</span>
                <input required type="datetime-local" value={form.departure} onChange={(e)=>setForm({...form,departure:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Planned Arrival</span>
                <input required type="datetime-local" value={form.arrival} onChange={(e)=>setForm({...form,arrival:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={()=>setShowForm(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">Create Voyage</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
