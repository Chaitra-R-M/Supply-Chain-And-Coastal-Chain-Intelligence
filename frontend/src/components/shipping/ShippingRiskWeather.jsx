import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, CloudRain, Plus, RefreshCw, Shield, Thermometer, Waves, Wind } from 'lucide-react';
import { api } from '../../api/client';

const SEVERITY_STYLES = {
  High:     'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200',
  Moderate: 'border-eggshell-300 bg-eggshell-50 text-eggshell-900 dark:border-eggshell-500/30 dark:bg-eggshell-500/10 dark:text-eggshell-200',
  Low:      'border-blue-slate-200 bg-blue-slate-50 text-blue-slate-900 dark:border-blue-slate-700 dark:bg-blue-slate-900/60 dark:text-blue-slate-200',
};

const initAlerts = [
  { id: 1, type: 'Weather',       severity: 'High',     title: 'High Swell Advisory – Mangalore–Kochi Corridor',   vessel: 'MV Bharat (voyage V-1021)',  desc: 'Wave heights forecast to reach 3.5 m from 20:00 hrs. Recommend delayed departure or speed reduction.', action: 'Reduce speed to 8 kn, consider standby at anchorage', status: 'Active', time: '12:40' },
  { id: 2, type: 'Route Deviation',severity: 'Moderate',title: 'MV Sahyadri – 4.2 NM Off Planned Track',           vessel: 'MV Sahyadri (voyage V-1018)', desc: 'Vessel has drifted off planned Mormugao–Mumbai course. Likely weather avoidance.', action: 'Notify Port Authority of revised ETA. Confirm safe course correction.', status: 'Acknowledged', time: '11:15' },
  { id: 3, type: 'Vessel Delay',   severity: 'Moderate',title: 'MV Sahyadri ETA Delay – +3 hours',                 vessel: 'MV Sahyadri',               desc: 'Revised ETA is 17:00 hrs due to adverse weather and route deviation.', action: 'Update cargo owner Spice Traders Ltd about delivery delay.', status: 'Active', time: '10:50' },
  { id: 4, type: 'Port Congestion',severity: 'Low',     title: 'Mumbai (JNPT) High Congestion',                    vessel: 'All vessels bound for Mumbai',desc: 'JNPT at 87% berth occupancy. Expect 2–4 hour wait for berth assignment.', action: 'Pre-position vessels at outer anchorage. Notify port authority of ETA.', status: 'Active', time: '08:30' },
];

export default function ShippingRiskWeather() {
  const [alerts, setAlerts]           = useState(initAlerts);
  const [weather, setWeather]         = useState(null);
  const [weatherLoading, setWxLoading]= useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [form, setForm]               = useState({ type: 'Weather', severity: 'High', title: '', vessel: '', desc: '', action: '' });
  const [toast, setToast]             = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const fetchWeather = () => {
    setWxLoading(true);
    api.getShippingWeather()
      .then(setWeather)
      .catch(() => {})
      .finally(() => setWxLoading(false));
  };

  useEffect(() => { fetchWeather(); }, []);

  const updateStatus = (id, status) => {
    setAlerts((a) => a.map((x) => x.id === id ? { ...x, status } : x));
    showToast(`Alert ${status.toLowerCase()}`);
  };

  const addAlert = (e) => {
    e.preventDefault();
    const now = new Date();
    setAlerts((prev) => [{ id: Date.now(), ...form, status: 'Active', time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` }, ...prev]);
    setShowAdd(false);
    setForm({ type: 'Weather', severity: 'High', title: '', vessel: '', desc: '', action: '' });
    showToast('Alert logged');
  };

  const wx = weather;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Maritime Risk &amp; Weather</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">Live weather intelligence, vessel risk alerts &amp; corrective action plans</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchWeather} disabled={weatherLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dusty-denim-200 bg-white px-3 py-2 text-xs font-semibold text-ink-black-800 hover:bg-dusty-denim-50 disabled:opacity-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-white">
            <RefreshCw className={`h-3.5 w-3.5 ${weatherLoading?'animate-spin':''}`} /> Refresh Weather
          </button>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-black-600">
            <Plus className="h-3.5 w-3.5" /> Log Alert
          </button>
        </div>
      </div>

      {toast && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>}

      {/* Weather source badge */}
      {wx?.source && (
        <div className="flex items-center gap-2 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${wx.source.includes('live')?'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300':'bg-eggshell-100 text-eggshell-700 dark:bg-eggshell-500/15 dark:text-eggshell-300'}`}>
            {wx.source.includes('live')?'● Live':'○ Estimated'}
          </span>
          <span>{wx.source}</span>
          {wx.fetched_at && <span>· updated {new Date(wx.fetched_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>}
        </div>
      )}

      {/* Weather Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          { icon: CloudRain,   label: 'Sea State',   value: wx?.sea_state       || '—' },
          { icon: Waves,       label: 'Wave Height', value: wx ? `${wx.wave_height_m} m` : '—' },
          { icon: Wind,        label: 'Wind Speed',  value: wx ? `${wx.wind_knots} kn` : '—' },
          { icon: Bell,        label: 'Visibility',  value: wx ? `${wx.visibility_nm} NM` : '—' },
          { icon: Thermometer, label: 'Temperature', value: wx ? `${wx.temperature_c} °C` : '—' },
          { icon: CloudRain,   label: 'Conditions',  value: wx?.description     || '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <Icon className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
            <p className="mt-1.5 text-sm font-bold text-ink-black-900 dark:text-white">{value}</p>
            <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className={`rounded-xl border p-4 shadow-sm ${a.status==='Resolved'?'border-dusty-denim-200 bg-white/70 opacity-70 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900/50':SEVERITY_STYLES[a.severity]||SEVERITY_STYLES.Moderate}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-bold">{a.title}</span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-ink-black-950/60">{a.type} · {a.severity}</span>
                  <span className="rounded-full border border-current/25 px-2 py-0.5 text-[10px] font-semibold">{a.status}</span>
                  <span className="text-[10px] opacity-70">{a.time}</span>
                </div>
                <p className="text-xs opacity-90">{a.desc}</p>
                <p className="text-xs"><strong>Affected:</strong> {a.vessel}</p>
                <p className="text-xs"><strong>Recommended Action:</strong> {a.action}</p>
              </div>
              {a.status !== 'Resolved' && (
                <div className="flex shrink-0 gap-2">
                  {a.status === 'Active' && (
                    <button onClick={() => updateStatus(a.id,'Acknowledged')}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-ink-black-900 shadow-sm hover:bg-dusty-denim-50 dark:bg-deep-space-blue-800 dark:text-white">
                      <Shield className="h-3.5 w-3.5" /> Acknowledge
                    </button>
                  )}
                  <button onClick={() => updateStatus(a.id,'Resolved')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Alert Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={addAlert} className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <h3 className="mb-4 text-base font-bold text-ink-black-900 dark:text-white">Log Risk / Weather Event</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label><span className="font-semibold">Type</span>
                <select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  {['Weather','Route Deviation','Vessel Delay','Port Congestion','Cargo Damage'].map((t)=><option key={t}>{t}</option>)}
                </select>
              </label>
              <label><span className="font-semibold">Severity</span>
                <select value={form.severity} onChange={(e)=>setForm({...form,severity:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
                  {['Low','Moderate','High'].map((s)=><option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="col-span-2"><span className="font-semibold">Alert Title</span>
                <input required value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label className="col-span-2"><span className="font-semibold">Affected Vessel / Route</span>
                <input required value={form.vessel} onChange={(e)=>setForm({...form,vessel:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label className="col-span-2"><span className="font-semibold">Description</span>
                <textarea required rows={2} value={form.desc} onChange={(e)=>setForm({...form,desc:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
              <label className="col-span-2"><span className="font-semibold">Recommended Action</span>
                <input required value={form.action} onChange={(e)=>setForm({...form,action:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={()=>setShowAdd(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">Publish Alert</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
