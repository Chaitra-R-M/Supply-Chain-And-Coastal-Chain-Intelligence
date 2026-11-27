import React, { useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, CloudRain, Shield, Waves, Wind } from 'lucide-react';

const weather = {
  sea_state: 'Moderate (Beaufort 4)',
  wave_height_m: 2.4,
  wind_knots: 17,
  visibility_nm: 8,
  temperature_c: 28,
  recommendation: 'Safe for vessels over 100 m LOA. Caution for small craft and tankers with high freeboard.',
};

const initAlerts = [
  { id: 1, type: 'Weather', severity: 'High', title: 'High Swell Advisory – Mangalore–Kochi Corridor', vessel: 'MV Bharat (voyage V-1021)', desc: 'Wave heights forecast to reach 3.5 m from 20:00 hrs. Recommend delayed departure or speed reduction.', action: 'Reduce speed to 8 kn, consider standby at anchorage', status: 'Active', time: '12:40' },
  { id: 2, type: 'Route Deviation', severity: 'Moderate', title: 'MV Sahyadri – 4.2 NM Off Planned Track', vessel: 'MV Sahyadri (voyage V-1018)', desc: 'Vessel has drifted off planned Mormugao–Mumbai course. Likely weather avoidance.', action: 'Notify Port Authority of revised ETA. Confirm safe course correction.', status: 'Acknowledged', time: '11:15' },
  { id: 3, type: 'Vessel Delay', severity: 'Moderate', title: 'MV Sahyadri ETA Delay – +3 hours', vessel: 'MV Sahyadri', desc: 'Revised ETA is 17:00 hrs due to adverse weather and route deviation.', action: 'Update cargo owner Spice Traders Ltd about delivery delay.', status: 'Active', time: '10:50' },
  { id: 4, type: 'Port Congestion', severity: 'Low', title: 'Mumbai (JNPT) High Congestion', vessel: 'All vessels bound for Mumbai', desc: 'JNPT at 87% berth occupancy. Expect 2–4 hour wait for berth assignment.', action: 'Pre-position vessels at outer anchorage. Notify port authority of ETA.', status: 'Active', time: '08:30' },
];

const SEVERITY_STYLES = {
  High: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200',
  Moderate: 'border-eggshell-300 bg-eggshell-50 text-eggshell-900 dark:border-eggshell-500/30 dark:bg-eggshell-500/10 dark:text-eggshell-200',
  Low: 'border-blue-slate-200 bg-blue-slate-50 text-blue-slate-900 dark:border-blue-slate-700 dark:bg-blue-slate-900/60 dark:text-blue-slate-200',
};

export default function ShippingRiskWeather() {
  const [alerts, setAlerts] = useState(initAlerts);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const updateStatus = (id, status) => {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
    showToast(`Alert ${id} marked as ${status}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Maritime Risk &amp; Weather Monitoring</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Real-time weather intelligence, vessel risk alerts &amp; corrective action plans
        </p>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>
      )}

      {/* Weather Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <CloudRain className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-sm font-bold">{weather.sea_state}</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Sea State</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Waves className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-sm font-bold">{weather.wave_height_m} m</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Wave Height</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Wind className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-sm font-bold">{weather.wind_knots} kn</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Wind Speed</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Bell className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-sm font-bold">{weather.visibility_nm} NM</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Visibility</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-blue-slate-200 bg-blue-slate-50 p-3.5 dark:border-blue-slate-700 dark:bg-blue-slate-900/40">
          <Shield className="h-4 w-4 text-blue-slate-600 dark:text-blue-slate-400" />
          <p className="mt-1.5 text-xs font-semibold text-blue-slate-700 dark:text-blue-slate-200">Advisory</p>
          <p className="text-[11px] text-blue-slate-600 dark:text-blue-slate-300 leading-tight">{weather.recommendation}</p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl border p-4 shadow-sm ${
              a.status === 'Resolved'
                ? 'border-dusty-denim-200 bg-white/70 opacity-70 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900/50'
                : SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.Moderate
            }`}
          >
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
                    <button
                      type="button"
                      onClick={() => updateStatus(a.id, 'Acknowledged')}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-ink-black-900 shadow-sm hover:bg-dusty-denim-50 dark:bg-deep-space-blue-800 dark:text-white"
                    >
                      <Shield className="h-3.5 w-3.5" /> Acknowledge
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updateStatus(a.id, 'Resolved')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
