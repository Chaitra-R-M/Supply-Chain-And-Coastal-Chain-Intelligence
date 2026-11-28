import React, { useEffect, useState } from 'react';
import { Anchor, Brain, Clock, Container, Gauge, Ship, Sparkles, TrendingDown, TrendingUp, Warehouse } from 'lucide-react';
import { api } from '../../api/client';
import CongestionGauge from './CongestionGauge';

const ML_LEVEL_STYLE = {
  Low: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
  Moderate: 'border-eggshell-300 bg-eggshell-50 text-eggshell-900 dark:border-eggshell-500/40 dark:bg-eggshell-500/10 dark:text-eggshell-200',
  High: 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200',
  Critical: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200',
};

export default function PortCongestionView({ portId }) {
  const [data, setData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAll = () => {
    setError('');
    api
      .getCongestion(portId)
      .then(setData)
      .catch((e) => setError(e.message));
    setMlLoading(true);
    api
      .getCongestionPrediction(portId)
      .then(setMlData)
      .catch(() => setMlData(null))
      .finally(() => setMlLoading(false));
  };

  useEffect(() => {
    setData(null);
    setMlData(null);
    loadAll();
  }, [portId]);

  const runMlPrediction = (overrides = {}) => {
    setMlLoading(true);
    api
      .getCongestionPrediction(portId, overrides)
      .then(setMlData)
      .catch(() => setMlData(null))
      .finally(() => setMlLoading(false));
  };

  if (error) return <div className="p-4 text-xs text-rose-600">{error}</div>;
  if (!data) return <div className="p-6 text-xs text-dusty-denim-500">Loading congestion telemetry...</div>;

  const cards = [
    { label: 'Berth Utilization', value: `${data.berth_utilization_pct}%`, icon: Anchor },
    { label: 'Waiting Vessels', value: data.waiting_vessels, icon: Ship },
    { label: 'Avg Vessel Wait Time', value: `${data.avg_waiting_time_hrs} hrs`, icon: Clock },
    { label: 'Loading/Unloading Delay', value: `${data.loading_unloading_delay_hrs} hrs`, icon: Container },
    { label: 'Warehouse Utilization', value: `${data.warehouse_utilization_pct}%`, icon: Warehouse },
  ];

  const maxTrend = 100;

  // ML prediction block – sourced from ml_prediction key on the same response
  const ml = mlData?.ml_prediction ?? null;
  const mlSupported = ml && ml.status === 'ok';
  const mlLevel = ml?.predicted_congestion_level_24h;
  const mlVessels = ml?.predicted_waiting_vessels_24h;
  const mlLevelStyle = ML_LEVEL_STYLE[mlLevel] ?? ML_LEVEL_STYLE.Low;
  const vesselDelta = mlSupported ? mlVessels - data.waiting_vessels : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
          Port Congestion Monitoring
        </h1>
        <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
          Real-time congestion classification (Low / Moderate / High / Critical), queue delays, and 7-day trend
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Gauge Summary */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-dusty-denim-200 bg-white p-5 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 lg:col-span-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold">
            <Gauge className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
            <span>Composite Congestion Index</span>
          </div>
          <CongestionGauge level={data.level} utilizationPct={data.utilization_pct} />
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px] font-semibold">
            {['Low (<45%)', 'Moderate (45–69%)', 'High (70–84%)', 'Critical (85%+)'].map((band) => (
              <span
                key={band}
                className="rounded-md bg-dusty-denim-50 px-2 py-0.5 text-dusty-denim-700 dark:bg-ink-black-950/60 dark:text-blue-slate-300"
              >
                {band}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics + Trend Chart */}
        <div className="space-y-4 lg:col-span-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900"
                >
                  <Icon className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
                  <p className="mt-2 text-lg font-extrabold text-ink-black-900 dark:text-white">{c.value}</p>
                  <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{c.label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 text-sm font-bold">7-Day Port Congestion &amp; Queue Trend</h2>
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
              {data.trends.map((t) => {
                const barH = Math.max(12, Math.round((t.utilization_pct / maxTrend) * 110));
                const barColor =
                  t.utilization_pct >= 85
                    ? 'bg-rose-500'
                    : t.utilization_pct >= 70
                    ? 'bg-orange-400'
                    : t.utilization_pct >= 45
                    ? 'bg-eggshell-500'
                    : 'bg-emerald-500';
                return (
                  <div key={t.label} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-[10px] font-bold">{t.utilization_pct}%</span>
                    <div
                      className={`w-full max-w-[38px] rounded-t-lg transition-all ${barColor}`}
                      style={{ height: `${barH}px` }}
                      title={`${t.label}: ${t.utilization_pct}% • ${t.waiting_vessels} waiting`}
                    />
                    <span className="text-[11px] font-medium text-dusty-denim-600 dark:text-blue-slate-300">
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── ML Prediction Panel ───────────────────────────────────────── */}
      <div className={`rounded-xl border p-4 shadow-sm ${mlSupported ? mlLevelStyle : 'border-dusty-denim-200 bg-white dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 shrink-0 text-ink-black-500 dark:text-eggshell-300" />
            <div>
              <h2 className="text-sm font-bold text-ink-black-900 dark:text-white">
                ML Congestion Forecast — Next 24 Hours
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => runMlPrediction()}
            disabled={mlLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-black-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-black-800 shadow-sm transition hover:bg-dusty-denim-50 disabled:opacity-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-white"
          >
            <Sparkles className={`h-3.5 w-3.5 ${mlLoading ? 'animate-pulse' : ''}`} />
            {mlLoading ? 'Running model…' : 'Refresh Prediction'}
          </button>
        </div>

        <div className="mt-4">
          {mlLoading && !mlSupported && (
            <div className="flex items-center gap-2 text-xs text-dusty-denim-500 dark:text-blue-slate-400">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-dusty-denim-200 border-t-ink-black-500" />
              Running prediction model…
            </div>
          )}

          {!mlLoading && ml?.status === 'error' && (
            <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">
              {ml.message ?? 'Prediction not available for this port.'}
            </p>
          )}

          {!mlLoading && mlData && !ml && (
            <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">
              Prediction not available for this port (not in model training set).
            </p>
          )}

          {mlSupported && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Predicted level */}
              <div className={`flex flex-col items-center justify-center rounded-xl border p-4 ${mlLevelStyle}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">Predicted Level</p>
                <p className="mt-1 text-3xl font-extrabold">{mlLevel}</p>
                <p className="mt-1 text-[11px] opacity-70">24-hour forecast</p>
              </div>

              {/* Predicted waiting vessels */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-dusty-denim-200 bg-white p-4 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
                <p className="text-[11px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400 uppercase tracking-wider">
                  Predicted Waiting Vessels
                </p>
                <p className="mt-1 text-3xl font-extrabold text-ink-black-900 dark:text-white">
                  {mlVessels?.toFixed(1)}
                </p>
                {vesselDelta !== null && (
                  <span className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
                    vesselDelta > 0 ? 'text-rose-600 dark:text-rose-400' : vesselDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-dusty-denim-500'
                  }`}>
                    {vesselDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : vesselDelta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                    {vesselDelta > 0 ? `+${vesselDelta.toFixed(1)} vs now` : vesselDelta < 0 ? `${vesselDelta.toFixed(1)} vs now` : 'No change expected'}
                  </span>
                )}
                <p className="mt-0.5 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                  Current: {data.waiting_vessels}
                </p>
              </div>

              {/* Model info */}
              <div className="flex flex-col justify-center rounded-xl border border-dusty-denim-200 bg-white p-4 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
                <p className="text-[11px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400 uppercase tracking-wider mb-2">
                  Model Details
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-dusty-denim-500 dark:text-blue-slate-400">Port code used</span>
                    <span className="font-semibold">{ml.port_code_used}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dusty-denim-500 dark:text-blue-slate-400">Current level</span>
                    <span className="font-semibold">{data.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dusty-denim-500 dark:text-blue-slate-400">24h forecast</span>
                    <span className="font-semibold">{mlLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dusty-denim-500 dark:text-blue-slate-400">Model accuracy</span>
                    <span className="font-semibold">72.5% (R² 0.724)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
