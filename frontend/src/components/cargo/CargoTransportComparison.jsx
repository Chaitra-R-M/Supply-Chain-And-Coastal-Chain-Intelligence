import React, { useState } from 'react';
import { CheckCircle2, IndianRupee, Ship, Star, Timer, Waves } from 'lucide-react';

const options = [
  {
    id: 'opt1',
    company: 'India Coastal Shipping',
    vessel: 'MV Bharat',
    type: 'Bulk Carrier',
    capacity: '52,000 MT',
    route: 'Mangalore Port → Kochi Port',
    distance_nm: 120,
    duration_hrs: 54,
    cost_inr: 185000,
    cost_per_mt: 370,
    rating: 4.6,
    reviews: 142,
    on_time_pct: 88,
    weather_exposure: 'Moderate',
    available: true,
    recommended: true,
  },
  {
    id: 'opt2',
    company: 'Coastal Lines Pvt Ltd',
    vessel: 'MV Coastal Queen',
    type: 'General Cargo',
    capacity: '12,000 MT',
    route: 'Mangalore Port → Kochi Port',
    distance_nm: 128,
    duration_hrs: 60,
    cost_inr: 174000,
    cost_per_mt: 348,
    rating: 4.2,
    reviews: 88,
    on_time_pct: 80,
    weather_exposure: 'Low',
    available: true,
    recommended: false,
  },
  {
    id: 'opt3',
    company: 'Deccan Marine Services',
    vessel: 'MV Deccan Star',
    type: 'Container',
    capacity: '35,000 MT',
    route: 'Mangalore Port → Kochi Port',
    distance_nm: 115,
    duration_hrs: 48,
    cost_inr: 196000,
    cost_per_mt: 392,
    rating: 4.4,
    reviews: 112,
    on_time_pct: 92,
    weather_exposure: 'Moderate',
    available: true,
    recommended: false,
  },
  {
    id: 'opt4',
    company: 'Malabar Ocean Lines',
    vessel: 'MV Malabar Express',
    type: 'General Cargo',
    capacity: '8,000 MT',
    route: 'Mangalore Port → Kochi Port',
    distance_nm: 120,
    duration_hrs: 65,
    cost_inr: 155000,
    cost_per_mt: 310,
    rating: 3.9,
    reviews: 55,
    on_time_pct: 72,
    weather_exposure: 'High',
    available: false,
    recommended: false,
  },
];

const renderStars = (rating) => {
  const full = Math.floor(rating);
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < full ? 'text-eggshell-500' : 'text-dusty-denim-200 dark:text-deep-space-blue-700'}>★</span>
  ));
};

export default function CargoTransportComparison() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Transportation Comparison</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Compare shipping companies by cost, duration, reliability &amp; route conditions
        </p>
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelected(opt.id === selected ? null : opt.id)}
            className={`rounded-xl border p-5 text-left transition ${
              selected === opt.id
                ? 'border-eggshell-500 bg-eggshell-50 shadow-lg dark:border-eggshell-500/50 dark:bg-eggshell-500/10'
                : !opt.available
                ? 'border-dusty-denim-100 bg-white/70 opacity-70 dark:border-deep-space-blue-800/50 dark:bg-deep-space-blue-900/50'
                : 'border-dusty-denim-200 bg-white hover:border-eggshell-400 hover:shadow dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-black-900 dark:text-white">{opt.company}</span>
                  {opt.recommended && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">Best Match</span>
                  )}
                  {!opt.available && (
                    <span className="rounded-full bg-dusty-denim-200 px-2 py-0.5 text-[10px] font-semibold text-dusty-denim-600 dark:bg-deep-space-blue-700 dark:text-blue-slate-300">Unavailable</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px]">
                  {renderStars(opt.rating)}
                  <span className="ml-1 text-dusty-denim-500">{opt.rating} ({opt.reviews} reviews)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-ink-black-900 dark:text-white">₹{(opt.cost_inr / 1000).toFixed(0)}K</div>
                <div className="text-[11px] text-dusty-denim-500">₹{opt.cost_per_mt}/MT</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Ship className="h-3.5 w-3.5 text-dusty-denim-400" />
                <span><span className="text-dusty-denim-500">Vessel: </span><span className="font-semibold">{opt.vessel} ({opt.type})</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-dusty-denim-400" />
                <span><span className="text-dusty-denim-500">Duration: </span><span className="font-semibold">{opt.duration_hrs} hrs</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-dusty-denim-400" />
                <span><span className="text-dusty-denim-500">On-time: </span><span className={`font-semibold ${opt.on_time_pct >= 85 ? 'text-emerald-700 dark:text-emerald-300' : 'text-eggshell-700 dark:text-eggshell-300'}`}>{opt.on_time_pct}%</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Waves className="h-3.5 w-3.5 text-dusty-denim-400" />
                <span><span className="text-dusty-denim-500">Weather risk: </span><span className={`font-semibold ${opt.weather_exposure === 'High' ? 'text-rose-600 dark:text-rose-400' : opt.weather_exposure === 'Moderate' ? 'text-eggshell-600 dark:text-eggshell-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{opt.weather_exposure}</span></span>
              </div>
            </div>

            {/* Cost bar */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-dusty-denim-500">
                <span>Relative cost</span><span>₹{opt.cost_inr.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                <div className={`h-full rounded-full ${opt.recommended ? 'bg-emerald-500' : 'bg-eggshell-500'}`} style={{ width: `${(opt.cost_inr / 200000) * 100}%` }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected comparison detail */}
      {selected && (() => {
        const opt = options.find((o) => o.id === selected);
        if (!opt) return null;
        return (
          <div className="rounded-xl border border-eggshell-400 bg-eggshell-50/80 p-4 dark:border-eggshell-500/40 dark:bg-eggshell-500/5">
            <h2 className="mb-3 text-sm font-bold text-ink-black-900 dark:text-white">
              Selected: {opt.company} — {opt.vessel}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div><span className="text-dusty-denim-500">Route</span><p className="font-semibold mt-0.5">{opt.route}</p></div>
              <div><span className="text-dusty-denim-500">Distance</span><p className="font-semibold mt-0.5">{opt.distance_nm} NM</p></div>
              <div><span className="text-dusty-denim-500">Duration</span><p className="font-semibold mt-0.5">{opt.duration_hrs} hrs</p></div>
              <div><span className="text-dusty-denim-500">Capacity</span><p className="font-semibold mt-0.5">{opt.capacity}</p></div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <IndianRupee className="h-4 w-4 text-eggshell-600" />
              <span className="text-sm font-bold">Total: ₹{opt.cost_inr.toLocaleString()} (₹{opt.cost_per_mt}/MT)</span>
              <Star className="h-4 w-4 text-eggshell-500" />
              <span className="text-sm font-semibold">{opt.rating} / 5 · {opt.on_time_pct}% on-time</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
