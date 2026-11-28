import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Calendar, TrendingUp } from 'lucide-react';

const forecastData = {
  rice: {
    name: 'Basmati Rice',
    history: [420, 450, 480, 500, 520, 540, 560],
    forecast: [580, 610, 640, 670],
    trend: 'up',
    weekly_demand: 560,
    monthly_demand: 2400,
  },
  spices: {
    name: 'Spices (Cardamom/Pepper)',
    history: [35, 32, 30, 28, 25, 22, 20],
    forecast: [18, 16, 15, 14],
    trend: 'down',
    weekly_demand: 18,
    monthly_demand: 75,
  },
  oil: {
    name: 'Coconut Oil',
    history: [40, 42, 48, 52, 58, 62, 65],
    forecast: [70, 74, 78, 82],
    trend: 'up',
    weekly_demand: 68,
    monthly_demand: 290,
  },
  steel: {
    name: 'Steel Rods',
    history: [150, 155, 148, 142, 138, 130, 128],
    forecast: [125, 122, 120, 118],
    trend: 'down',
    weekly_demand: 124,
    monthly_demand: 520,
  },
};

const months = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

export default function CargoDemandForecast() {
  const [selected, setSelected] = useState('rice');
  const product = forecastData[selected];
  const maxVal = Math.max(...product.history, ...product.forecast, 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Demand Forecast</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Predict future cargo demand &amp; estimate transportation requirements
        </p>
      </div>

      {/* Product selector */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(forecastData).map(([key, p]) => {
          const up = p.trend === 'up';
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`rounded-xl border p-3.5 text-left transition ${selected === key ? 'border-eggshell-500 bg-eggshell-50 dark:border-eggshell-500/50 dark:bg-eggshell-500/10' : 'border-dusty-denim-200 bg-white hover:border-eggshell-400 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-black-900 dark:text-white">{p.name}</span>
                {up ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-rose-500" />}
              </div>
              <p className={`mt-1.5 text-lg font-extrabold ${up ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
                {p.weekly_demand} MT<span className="text-[10px] font-semibold text-dusty-denim-500"> /wk</span>
              </p>
              <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                Monthly: {p.monthly_demand} MT · {up ? 'Increasing' : 'Decreasing'} demand
              </p>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-black-900 dark:text-white">
            <BarChart3 className="h-4 w-4 text-eggshell-600 dark:text-eggshell-400" />
            {product.name} — Historical vs Predicted Demand (MT)
          </h2>
          <div className="flex gap-3 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-ink-black-500" />Historical</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-eggshell-500" />Forecast</span>
          </div>
        </div>
        <div className="flex h-48 items-end gap-1.5 sm:gap-3">
          {[...product.history.map((v, i) => ({ v, i, type: 'hist' })), ...product.forecast.map((v, i) => ({ v, i, type: 'fc', idx: i }))].map((bar, bi) => (
            <div key={bi} className="flex flex-1 flex-col items-center gap-1 text-center">
              <span className="text-[10px] font-bold">{bar.v}</span>
              <div
                className={`w-full max-w-[36px] rounded-t-lg transition-all ${bar.type === 'hist' ? 'bg-ink-black-500' : 'bg-eggshell-500 border-l border-dashed border-ink-black-400'}`}
                style={{ height: `${Math.max(12, (bar.v / maxVal) * 130)}px` }}
              />
              <span className="text-[10px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400">
                {bar.type === 'hist' ? months[bar.i] : `F${bar.idx + 1}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transport requirements estimate */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-dusty-denim-200 bg-eggshell-50/70 p-4 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink-black-900 dark:text-white">
            <Calendar className="h-4 w-4 text-eggshell-600" /> Next 4 Weeks Demand
          </div>
          <p className="mt-1.5 text-2xl font-extrabold">{product.forecast.reduce((a, b) => a + b, 0).toLocaleString()} MT</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
            Est. transport requirement: ~{Math.ceil(product.forecast.reduce((a, b) => a + b, 0) / 500)} vessel trips (500 MT bulk)
          </p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink-black-900 dark:text-white">
            <TrendingUp className={`h-4 w-4 ${product.trend === 'up' ? 'text-emerald-600' : 'text-rose-500'}`} /> Demand Trend
          </div>
          <p className={`mt-1.5 text-2xl font-extrabold ${product.trend === 'up' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
            {product.trend === 'up' ? 'Increasing' : 'Decreasing'}
          </p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
            {product.trend === 'up'
              ? 'Recommend pre-booking vessel capacity for coming weeks'
              : 'Consider consolidating shipments to reduce per-MT cost'}
          </p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink-black-900 dark:text-white">
            <Calendar className="h-4 w-4 text-ink-black-500" /> Monthly Forecast
          </div>
          <p className="mt-1.5 text-2xl font-extrabold">{product.monthly_demand.toLocaleString()} MT</p>
          <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
            Projected cost: ₹{(product.monthly_demand * 370).toLocaleString()} at ₹370/MT avg
          </p>
        </div>
      </div>
    </div>
  );
}
