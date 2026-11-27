import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, CloudRain, Plus, ShieldCheck, Waves, Wind } from 'lucide-react';
import { api } from '../../api/client';

const SEVERITY_STYLE = {
  Critical: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200',
  High: 'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  Moderate: 'border-eggshell-300 bg-eggshell-50 text-eggshell-900 dark:border-eggshell-500/30 dark:bg-eggshell-500/10 dark:text-eggshell-200',
  Low: 'border-blue-slate-200 bg-blue-slate-50 text-blue-slate-900 dark:border-blue-slate-700 dark:bg-blue-slate-900/60 dark:text-blue-slate-200',
};

export default function RiskWeatherView({ portId, onRefreshGlobal }) {
  const [data, setData] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    category: 'Weather',
    severity: 'High',
    title: '',
    description: '',
    affected_entity: '',
    recommended_action: '',
  });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.getRisks(portId);
      setData(res);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [portId]);

  const handleStatus = async (risk, status) => {
    try {
      await api.updateRisk(portId, risk.id, { status });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createRisk(portId, form);
      setShowAdd(false);
      setForm({
        category: 'Weather',
        severity: 'High',
        title: '',
        description: '',
        affected_entity: '',
        recommended_action: '',
      });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!data) return <div className="p-6 text-xs text-dusty-denim-500">Loading weather &amp; risk intelligence...</div>;

  const { weather, risks } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
            Risk Management &amp; Marine Weather Intelligence
          </h1>
          <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
            Weather disruptions, vessel delay risks, congestion &amp; storage alerts with corrective action plans
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ink-black-600"
        >
          <Plus className="h-3.5 w-3.5" /> Log Risk / Weather Event
        </button>
      </div>

      {error && <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

      {/* Marine Weather Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <CloudRain className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-sm font-bold">{weather.sea_state}</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Sea State</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Waves className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-sm font-bold">{weather.wave_height_m} m</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Swell Height</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Wind className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
          <p className="mt-1.5 text-sm font-bold">{weather.wind_knots} kn</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Peak Gusts</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <p className="text-xs font-semibold text-dusty-denim-500 dark:text-blue-slate-400">Visibility</p>
          <p className="mt-2 text-sm font-bold">{weather.visibility_nm} NM</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <p className="text-xs font-semibold text-dusty-denim-500 dark:text-blue-slate-400">Tidal Window</p>
          <p className="mt-2 text-sm font-bold">{weather.tidal_window}</p>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {risks.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border p-4 shadow-sm ${
              r.status === 'Resolved'
                ? 'border-dusty-denim-200 bg-white/70 opacity-75 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900/50'
                : SEVERITY_STYLE[r.severity] || SEVERITY_STYLE.Moderate
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-bold">{r.title}</span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-ink-black-950/60">
                    {r.category} • {r.severity}
                  </span>
                  <span className="rounded-full border border-current/25 px-2 py-0.5 text-[10px] font-semibold">
                    {r.status}
                  </span>
                </div>
                <p className="text-xs opacity-90">{r.description}</p>
                <p className="text-xs">
                  <strong>Affected:</strong> {r.affected_entity}
                </p>
                <p className="text-xs">
                  <strong>Corrective Action:</strong> {r.recommended_action}
                </p>
              </div>
              {r.status !== 'Resolved' && (
                <div className="flex shrink-0 gap-2">
                  {r.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => handleStatus(r, 'Acknowledged')}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-ink-black-900 shadow-sm hover:bg-dusty-denim-50 dark:bg-deep-space-blue-800 dark:text-white"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Acknowledge
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStatus(r, 'Resolved')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900"
          >
            <h3 className="text-base font-bold">Log Operational or Weather Risk</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <label>
                <span className="font-semibold">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                >
                  <option>Weather</option>
                  <option>Vessel Delay</option>
                  <option>Congestion</option>
                  <option>Inventory Overflow</option>
                  <option>Route Deviation</option>
                </select>
              </label>
              <label>
                <span className="font-semibold">Severity</span>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                >
                  <option>Low</option>
                  <option>Moderate</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </label>
              <label className="col-span-2">
                <span className="font-semibold">Alert Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Monsoon squall advisory for outer fairway"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="col-span-2">
                <span className="font-semibold">Affected Vessel / Facility</span>
                <input
                  required
                  value={form.affected_entity}
                  onChange={(e) => setForm({ ...form, affected_entity: e.target.value })}
                  placeholder="Berth B1 & MV Ocean Star"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="col-span-2">
                <span className="font-semibold">Description</span>
                <textarea
                  required
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="col-span-2">
                <span className="font-semibold">Recommended Corrective Action</span>
                <input
                  required
                  value={form.recommended_action}
                  onChange={(e) => setForm({ ...form, recommended_action: e.target.value })}
                  placeholder="Standby harbor tugs and shift crane lock window"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600"
              >
                Publish Alert
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
