import React, { useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, Compass, IndianRupee, Loader2, MapPin, Navigation, Route as RouteIcon, Timer, Waves } from 'lucide-react';
import { api } from '../../api/client';

const PORT_COORDS = {
  'JNPT Mumbai':    { x: 165, y: 46  },
  'Mormugao Port':  { x: 205, y: 120 },
  'Mangalore Port': { x: 245, y: 196 },
  'Kochi Port':     { x: 295, y: 274 },
  'Tuticorin Port': { x: 355, y: 318 },
};

// Map display names → routing graph node IDs
const PORT_TO_NODE = {
  'Mangalore Port':  'INNML',
  'Kochi Port':      'INCOK',
  'JNPT Mumbai':     'INNSA',
  'Mormugao Port':   'INMRM',
  'Tuticorin Port':  'INTUT',
};

const VESSEL_TYPES = [
  'container_ship',
  'bulk_carrier',
  'tanker',
  'general_cargo',
  'small_coastal_vessel',
];

// Map weather_risk label → badge colour classes
const RISK_STYLE = {
  Low:      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  Moderate: 'bg-eggshell-500/20 text-eggshell-700 dark:text-eggshell-300',
  High:     'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  Severe:   'bg-rose-600/20 text-rose-700 dark:text-rose-200',
};

export default function ShippingRoutePlanning() {
  const [from, setFrom]               = useState('Mangalore Port');
  const [to, setTo]                   = useState('Kochi Port');
  const [vesselType, setVesselType]   = useState('bulk_carrier');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const fromCoord = PORT_COORDS[from] || { x: 245, y: 196 };
  const toCoord   = PORT_COORDS[to]   || { x: 295, y: 274 };

  // Fetch whenever source, destination or vessel type changes
  useEffect(() => {
    const srcNode = PORT_TO_NODE[from];
    const dstNode = PORT_TO_NODE[to];
    if (!srcNode || !dstNode || srcNode === dstNode) return;

    setLoading(true);
    setError('');
    setResult(null);

    api.planRoute({ source_port: srcNode, destination_port: dstNode, vessel_type: vesselType })
      .then(setResult)
      .catch((e) => setError(e.message || 'Failed to fetch route plan.'))
      .finally(() => setLoading(false));
  }, [from, to, vesselType]);

  // Build display cards from the API response
  const cards = [];
  if (result) {
    if (result.recommended_route) {
      const r = result.recommended_route;
      const wx = r.weather_risk || 'Unknown';
      const seg = r.segments || [];
      const maxWave = seg.reduce((m, s) => Math.max(m, s.wave_height_m ?? 0), 0) || null;
      const maxWind = seg.reduce((m, s) => Math.max(m, s.wind_speed_kn ?? 0), 0) || null;
      cards.push({
        id: 'recommended',
        name: 'Weather-Aware Recommended Route',
        distance_nm: r.distance_nautical_miles,
        duration_hrs: r.estimated_travel_time?.hours,
        duration_text: r.estimated_travel_time?.text,
        eta_utc: r.estimated_travel_time?.eta_utc,
        weather: wx,
        wave_m: maxWave ? maxWave.toFixed(1) : null,
        wind_kn: maxWind ? maxWind.toFixed(1) : null,
        total_cost: r.total_cost,
        recommended: true,
        path_names: r.path_names,
        meets_constraints: r.meets_constraints,
        data_complete: r.weather_data_complete,
      });
    }
    if (
      result.alternative_route &&
      result.alternative_route.path?.join() !== result.recommended_route?.path?.join()
    ) {
      const a = result.alternative_route;
      const wx = a.weather_risk || 'Unknown';
      const seg = a.segments || [];
      const maxWave = seg.reduce((m, s) => Math.max(m, s.wave_height_m ?? 0), 0) || null;
      const maxWind = seg.reduce((m, s) => Math.max(m, s.wind_speed_kn ?? 0), 0) || null;
      cards.push({
        id: 'alternative',
        name: 'Shortest Distance Route (reference only)',
        distance_nm: a.distance_nautical_miles,
        duration_hrs: a.estimated_travel_time?.hours,
        duration_text: a.estimated_travel_time?.text,
        eta_utc: a.estimated_travel_time?.eta_utc,
        weather: wx,
        wave_m: maxWave ? maxWave.toFixed(1) : null,
        wind_kn: maxWind ? maxWind.toFixed(1) : null,
        total_cost: a.total_cost,
        recommended: false,
        path_names: a.path_names,
        meets_constraints: a.meets_constraints,
        data_complete: a.weather_data_complete,
      });
    }
  }

  const hasRoughCard = cards.some((c) => c.weather === 'High' || c.weather === 'Severe');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Route Planning</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Weather-aware coastal route planning — powered by Open-Meteo marine forecasts
        </p>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <label className="text-xs">
          <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Source Port</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
            {Object.keys(PORT_COORDS).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <span className="text-dusty-denim-400 pb-1.5">→</span>
        <label className="text-xs">
          <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Destination Port</span>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
            {Object.keys(PORT_COORDS).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Vessel Type</span>
          <select value={vesselType} onChange={(e) => setVesselType(e.target.value)} className="mt-1 block rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white">
            {VESSEL_TYPES.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
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

          {/* Route explanation from ML model */}
          {result?.route_explanation && (
            <p className="mt-3 text-[11px] leading-relaxed text-blue-slate-300 border-t border-deep-space-blue-800 pt-3">
              {result.route_explanation}
            </p>
          )}
        </div>

        {/* Route Comparison */}
        <div className="space-y-3 xl:col-span-7">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dusty-denim-200 bg-white p-8 text-sm text-dusty-denim-500 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching weather-aware route from model…
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error} — Ensure the backend is running and the route exists in the network.</span>
            </div>
          )}

          {/* Route cards from API */}
          {!loading && !error && cards.map((r) => (
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
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${RISK_STYLE[r.weather] || 'bg-dusty-denim-100 text-dusty-denim-600'}`}>
                  Risk: {r.weather}
                </span>
              </div>

              {/* Path waypoints */}
              {r.path_names && (
                <p className="mt-2 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                  {r.path_names.join(' → ')}
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span>
                    <span className="block text-[10px] text-dusty-denim-500">Distance</span>
                    <span className="font-bold">{r.distance_nm ? `${r.distance_nm} NM` : '—'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span>
                    <span className="block text-[10px] text-dusty-denim-500">Duration</span>
                    <span className="font-bold">{r.duration_text || (r.duration_hrs ? `${r.duration_hrs} hrs` : '—')}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span>
                    <span className="block text-[10px] text-dusty-denim-500">Route Cost</span>
                    <span className="font-bold">{r.total_cost ? `${r.total_cost.toFixed(0)} units` : '—'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Waves className="h-3.5 w-3.5 text-dusty-denim-400" />
                  <span>
                    <span className="block text-[10px] text-dusty-denim-500">Max Wave / Wind</span>
                    <span className="font-bold">
                      {r.wave_m ? `${r.wave_m} m` : '—'} / {r.wind_kn ? `${r.wind_kn} kn` : '—'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Constraint / data warnings */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {!r.meets_constraints && (
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    Constraint violation
                  </span>
                )}
                {!r.data_complete && (
                  <span className="rounded bg-eggshell-100 px-2 py-0.5 text-[10px] font-semibold text-eggshell-700 dark:bg-eggshell-500/15 dark:text-eggshell-300">
                    Weather data incomplete — conservative estimate applied
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Warning if high/severe risk on recommended route */}
          {!loading && !error && hasRoughCard && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                High or Severe weather risk detected on this route. Verify with official forecasts before departure.
              </span>
            </div>
          )}

          {/* Missing weather note */}
          {!loading && result && result.warnings?.length > 0 && (
            <div className="rounded-xl border border-dusty-denim-200 bg-dusty-denim-50 p-3 text-[11px] text-dusty-denim-600 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900/60 dark:text-blue-slate-300">
              {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
