import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Layers, TrendingUp } from 'lucide-react';
import { api } from '../api/client';

export default function DemandForecastView({ portId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getForecast(portId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [portId]);

  if (error) return <div className="p-4 text-xs text-rose-600">{error}</div>;
  if (!data) return <div className="p-6 text-xs text-dusty-denim-500">Loading demand forecast...</div>;

  const { timeline, categories, peak_periods, supply_demand: sd } = data;
  const maxVal = Math.max(...timeline.map((t) => Math.max(t.actual_mt || 0, t.predicted_mt || 0))) * 1.1;

  // Build SVG polyline points for Actual and Predicted
  const chartW = 700;
  const chartH = 210;
  const padX = 42;
  const padY = 20;
  const usableW = chartW - padX * 2;
  const usableH = chartH - padY * 2;

  const xPos = (idx) => padX + (idx / Math.max(timeline.length - 1, 1)) * usableW;
  const yPos = (val) => padY + usableH - (val / maxVal) * usableH;

  const predPoints = timeline.map((t, i) => `${xPos(i)},${yPos(t.predicted_mt)}`).join(' ');
  const actualPoints = timeline
    .map((t, i) => (t.actual_mt != null ? `${xPos(i)},${yPos(t.actual_mt)}` : null))
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
          Demand Forecasting &amp; Supply–Demand Analysis
        </h1>
        <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
          Historical vs predicted cargo volumes, category growth, peak windows, and capacity gap recommendations
        </p>
      </div>

      {/* Chart + Peak Windows */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
              <h2 className="text-sm font-bold">Actual vs Predicted Cargo Volume (MT)</h2>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-ink-black-500" /> Actual
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-eggshell-500" /> Predicted
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH + 24}`} className="w-full min-w-[500px]">
              {[0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padY + usableH * (1 - frac);
                const lbl = `${Math.round((maxVal * frac) / 1000)}k`;
                return (
                  <g key={frac}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={chartW - padX}
                      y2={y}
                      stroke="currentColor"
                      className="text-dusty-denim-100 dark:text-deep-space-blue-800"
                      strokeDasharray="3 4"
                    />
                    <text
                      x={4}
                      y={y + 4}
                      className="fill-dusty-denim-500 text-[10px] dark:fill-blue-slate-400"
                    >
                      {lbl}
                    </text>
                  </g>
                );
              })}

              {/* Predicted line (dashed) */}
              <polyline
                fill="none"
                stroke="#b89f47"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                points={predPoints}
              />
              {/* Actual line */}
              <polyline fill="none" stroke="#496ab6" strokeWidth="3" points={actualPoints} />

              {timeline.map((t, i) => (
                <g key={t.period}>
                  <circle cx={xPos(i)} cy={yPos(t.predicted_mt)} r="4" fill="#b89f47" />
                  {t.actual_mt != null && <circle cx={xPos(i)} cy={yPos(t.actual_mt)} r="4.5" fill="#496ab6" />}
                  <text
                    x={xPos(i)}
                    y={chartH + 14}
                    textAnchor="middle"
                    className="fill-dusty-denim-600 text-[11px] font-medium dark:fill-blue-slate-300"
                  >
                    {t.period}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Peak Periods & Category Growth */}
        <div className="space-y-4 xl:col-span-4">
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-2.5 text-sm font-bold">Expected Peak Demand Windows</h2>
            <div className="space-y-2">
              {peak_periods.map((p) => (
                <div
                  key={p.window}
                  className="rounded-lg border border-eggshell-300 bg-eggshell-50 p-2.5 text-xs dark:border-eggshell-500/30 dark:bg-eggshell-500/10"
                >
                  <div className="flex items-center justify-between font-bold text-eggshell-900 dark:text-eggshell-200">
                    <span>{p.window}</span>
                    <span>{p.expected_load_pct}% Load</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-eggshell-800 dark:text-eggshell-300">{p.driver}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-2.5 text-sm font-bold">Forecast by Cargo Category</h2>
            <div className="space-y-2.5">
              {categories.map((cat) => (
                <div key={cat.category} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{cat.category}</span>
                    <span
                      className={`inline-flex items-center font-bold ${
                        cat.growth_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                      }`}
                    >
                      {cat.growth_pct >= 0 ? '+' : ''}
                      {cat.growth_pct}%
                      {cat.growth_pct >= 0 && <ArrowUpRight className="h-3 w-3" />}
                    </span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                    <span>Next Mo: {cat.forecast_next_month_mt.toLocaleString()} MT</span>
                    <span>Peak: {cat.peak_window}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2.10 Supply-Demand Capacity Analysis & Recommendations */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
            <h2 className="text-sm font-bold">Supply–Demand Capacity Alignment</h2>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              sd.shortage_detected
                ? 'bg-eggshell-500/20 text-eggshell-800 dark:text-eggshell-200'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {sd.shortage_detected ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {sd.shortage_detected ? 'Peak Capacity Tightness Detected' : 'Capacity Balanced'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-xl border border-dusty-denim-200 bg-dusty-denim-50/70 p-3.5 dark:border-deep-space-blue-800 dark:bg-ink-black-950/60">
            <p className="text-dusty-denim-500 dark:text-blue-slate-400">Projected Storage Need vs Capacity</p>
            <p className="mt-1 text-lg font-extrabold">
              {sd.projected_storage_requirement_mt.toLocaleString()} /{' '}
              {sd.total_storage_capacity_mt.toLocaleString()} MT
            </p>
            <p className="mt-1 text-[11px] font-semibold text-ink-black-600 dark:text-eggshell-300">
              Projected Storage Utilization: {sd.projected_storage_utilization_pct}% (Buffer:{' '}
              {sd.storage_surplus_or_deficit_mt.toLocaleString()} MT)
            </p>
          </div>
          <div className="rounded-xl border border-dusty-denim-200 bg-dusty-denim-50/70 p-3.5 dark:border-deep-space-blue-800 dark:bg-ink-black-950/60">
            <p className="text-dusty-denim-500 dark:text-blue-slate-400">Expected Vessel Calls vs Berth Slots</p>
            <p className="mt-1 text-lg font-extrabold">
              {sd.expected_vessel_calls} Calls / {sd.berth_slot_capacity} Slots
            </p>
            <p className="mt-1 text-[11px] font-semibold text-ink-black-600 dark:text-eggshell-300">
              Berth Demand Utilization: {sd.berth_demand_utilization_pct}% (Reserve: {sd.berth_slot_gap} slots)
            </p>
          </div>
          <div className="rounded-xl border border-dusty-denim-200 bg-dusty-denim-50/70 p-3.5 dark:border-deep-space-blue-800 dark:bg-ink-black-950/60">
            <p className="text-dusty-denim-500 dark:text-blue-slate-400">Expected Monthly Cargo Volume</p>
            <p className="mt-1 text-lg font-extrabold">{sd.expected_cargo_volume_mt.toLocaleString()} MT</p>
            <p className="mt-1 text-[11px] text-dusty-denim-600 dark:text-blue-slate-300">
              Total Berth Capacity Envelope: {sd.berth_capacity_mt.toLocaleString()} MT
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-dusty-denim-500 dark:text-blue-slate-400">
            Operational Recommendations
          </h3>
          {sd.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dusty-denim-100 bg-eggshell-50/60 px-3 py-2 text-xs dark:border-deep-space-blue-800 dark:bg-ink-black-950/50"
            >
              <div>
                <span className="font-bold text-ink-black-700 dark:text-eggshell-300">{rec.area}: </span>
                <span>{rec.recommendation}</span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  rec.priority === 'High'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                    : 'bg-ink-black-500/15 text-ink-black-700 dark:text-ink-black-200'
                }`}
              >
                {rec.priority} Priority
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
