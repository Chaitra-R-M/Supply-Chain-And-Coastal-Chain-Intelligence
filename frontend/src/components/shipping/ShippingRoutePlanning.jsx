import React, { useState } from 'react';
import { AlertTriangle, CloudRain, Compass, IndianRupee, MapPin, Navigation, Route as RouteIcon, Timer, Waves } from 'lucide-react';

const PORT_COORDS = {
  'JNPT Mumbai': { x: 165, y: 46 },
  'Mormugao Port': { x: 205, y: 120 },
  'Mangalore Port': { x: 245, y: 196 },
  'Kochi Port': { x: 295, y: 274 },
  'Tuticorin Port': { x: 355, y: 318 },
};

const routeOptions = [
  { id: 'R1', name: 'Direct Coastal Corridor', distance_nm: 120, duration_hrs: 11, cost_inr: 185000, weather: 'Moderate', wave_m: 2.4, wind_kn: 14, recommended: true, note: 'Shortest path, stable conditions, minimal congestion' },
  { id: 'R2', name: 'Offshore Deep Water Route', distance_nm: 155, duration_hrs: 13, cost_inr: 214000, weather: 'Clear', wave_m: 1.8, wind_kn: 11, recommended: false, note: 'Longer but calmer seas for sensitive cargo' },
  { id: 'R3', name: 'Inner Island Channel', distance_nm: 138, duration_hrs: 14.5, cost_inr: 198500, weather: 'Rough', wave_m: 3.2, wind_kn: 21, recommended: false, note: 'Shallow draft restrictions, higher swell exposure' },
];

export default function ShippingRoutePlanning() {
  const [from, setFrom] = useState('Mangalore Port');
  const [to, setTo] = useState('Kochi Port');

  const fromCoord = PORT_COORDS[from.replace(' Port', '')] || { x: 245, y: 196 };
  const toCoord = PORT_COORDS[to.replace(' Port', '')] || { x: 295, y: 274 };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Route Planning</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Compare coastal corridors by distance, duration, cost &amp; weather conditions
        </p>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <label className="text-xs">
          <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Source Port</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
            {Object.keys(PORT_COORDS).map((p) => <option key={p} value={`${p} Port`}>{p}</option>)}
          </select>
        </label>
        <span className="text-dusty-denim-400 pb-1.5">→</span>
        <label className="text-xs">
          <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Destination Port</span>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
            {Object.keys(PORT_COORDS).map((p) => <option key={p} value={`${p} Port`}>{p}</option>)}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-2 text-xs text-dusty-denim-500 dark:text-blue-slate-400">
          <MapPin className="h-3.5 w-3.5" />{from} → {to}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Map */}
        <div className="rounded-xl border border-dusty-denim-200 bg-deep-space-blue-950 p-4 shadow-sm dark:border-deep-space-blue-800 xl:col-span-5">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-white">
            <Compass className="h-4 w-4 text-eggshell-300" /> Coastal Route Options
          </div>
          <svg viewBox="0 0 460 350" className="w-full rounded-lg bg-ink-black-950">
            <path d="M 195 0 L 210 60 L 235 125 L 265 190 L 315 270 L 375 335 L 460 350 L 460 0 Z" fill="#233443" stroke="#5882a7" strokeWidth="1.5" />
            {[0, 1, 2].map((i) => {
              const colors = ['#22c55e', '#496ab6', '#c6b26c'];
              const offsets = [0, -20, 15];
              const midX = Math.min(fromCoord.x, toCoord.x) - 40 + offsets[i];
              const midY = (fromCoord.y + toCoord.y) / 2 + (i === 0 ? 0 : i === 1 ? -25 : 30);
              return (
                <path
                  key={i}
                  d={`M ${fromCoord.x} ${fromCoord.y} Q ${midX} ${midY} ${toCoord.x} ${toCoord.y}`}
                  fill="none"
                  stroke={colors[i]}
                  strokeWidth={i === 0 ? 3.5 : 2}
                  strokeDasharray={i === 0 ? 'none' : '6 4'}
                />
              );
            })}
            {Object.entries(PORT_COORDS).map(([name, pos]) => (
              <g key={name}>
                <circle cx={pos.x} cy={pos.y} r="5.5" fill="#496ab6" stroke="#fff" strokeWidth="1.8" />
                <text x={pos.x + 10} y={pos.y + 4} fill="#edf0f8" fontSize="11" fontWeight="600">{name}</text>
              </g>
            ))}
          </svg>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-blue-slate-300">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Recommended</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ink-black-500" />Alternative</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-eggshell-500" />Coastal channel</span>
          </div>
        </div>

        {/* Route Comparison */}
        <div className="space-y-3 xl:col-span-7">
          {routeOptions.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-4 shadow-sm transition ${
                r.recommended
                  ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/5'
                  : 'border-dusty-denim-200 bg-white dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RouteIcon className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
                  <span className="text-sm font-bold text-ink-black-900 dark:text-white">{r.name}</span>
                  {r.recommended && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">Recommended</span>
                  )}
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                  r.weather === 'Rough' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  : r.weather === 'Moderate' ? 'bg-eggshell-500/20 text-eggshell-700 dark:text-eggshell-300'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                }`}>
                  Weather: {r.weather}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span><span className="block text-[10px] text-dusty-denim-500">Distance</span><span className="font-bold">{r.distance_nm} NM</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span><span className="block text-[10px] text-dusty-denim-500">Duration</span><span className="font-bold">{r.duration_hrs} hrs</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span><span className="block text-[10px] text-dusty-denim-500">Est. Cost</span><span className="font-bold">₹{(r.cost_inr / 1000).toFixed(0)}K</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Waves className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span><span className="block text-[10px] text-dusty-denim-500">Sea State</span><span className="font-bold">{r.wave_m} m / {r.wind_kn} kn</span></span>
                </div>
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-xs text-dusty-denim-600 dark:text-blue-slate-300">
                <CloudRain className="mt-0.5 h-3.5 w-3.5 shrink-0" />{r.note}
              </p>
            </div>
          ))}
          {routeOptions.some((r) => r.weather === 'Rough') && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Inner Island Channel has 3.2 m swell forecast. Suggest Direct Coastal Corridor for rice cargo (moisture-sensitive).
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
