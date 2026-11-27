import React, { useEffect, useState } from 'react';
import { AlertTriangle, Compass, Navigation, Waves } from 'lucide-react';
import { api } from '../api/client';

const PORT_COORDS = {
  'JNPT Mumbai': { x: 165, y: 46 },
  'Mormugao Port': { x: 205, y: 120 },
  'Mangalore Port': { x: 245, y: 196 },
  'Kochi Port': { x: 295, y: 274 },
  'Tuticorin Port': { x: 355, y: 318 },
};

export default function CoastalRoutesView({ portId }) {
  const [routes, setRoutes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getRoutes(portId)
      .then((res) => {
        setRoutes(res);
        if (res.length) setSelectedId(res[0].id);
      })
      .catch((e) => setError(e.message));
  }, [portId]);

  if (error) return <div className="p-4 text-xs text-rose-600">{error}</div>;

  const selected = routes.find((r) => r.id === selectedId) || routes[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
          Coastal Shipping Route Monitoring
        </h1>
        <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
          Inter-port coastal sea corridors, route distances &amp; transit times, marine weather, and disruption alerts
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Coastal Corridor Map */}
        <div className="rounded-xl border border-dusty-denim-200 bg-deep-space-blue-950 p-4 text-white shadow-sm dark:border-deep-space-blue-800 lg:col-span-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold">
              <Compass className="h-4 w-4 text-eggshell-300" /> West Coast Shipping Corridors
            </span>
            <span className="text-[11px] text-blue-slate-300">Click route to inspect</span>
          </div>
          <svg viewBox="0 0 460 350" className="w-full rounded-lg bg-ink-black-950">
            {/* Coastline */}
            <path
              d="M 195 0 L 210 60 L 235 125 L 265 190 L 315 270 L 375 335 L 460 350 L 460 0 Z"
              fill="#233443"
              stroke="#5882a7"
              strokeWidth="1.5"
            />
            {/* Sea Routes */}
            {routes.map((rt) => {
              const from = PORT_COORDS[rt.origin_port_name] || PORT_COORDS['Mangalore Port'];
              const to = PORT_COORDS[rt.destination_port_name] || PORT_COORDS['Kochi Port'];
              const midX = Math.min(from.x, to.x) - 48;
              const midY = (from.y + to.y) / 2;
              const color =
                rt.disruption_level === 'High Risk'
                  ? '#ef4444'
                  : rt.disruption_level === 'Minor Delay'
                  ? '#c6b26c'
                  : '#22c55e';
              const isSel = selected?.id === rt.id;
              return (
                <path
                  key={rt.id}
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSel ? 3.5 : 2}
                  strokeDasharray={rt.disruption_level === 'None' ? 'none' : '6 4'}
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedId(rt.id)}
                />
              );
            })}
            {/* Port Nodes */}
            {Object.entries(PORT_COORDS).map(([name, pos]) => (
              <g key={name}>
                <circle cx={pos.x} cy={pos.y} r="5.5" fill="#496ab6" stroke="#fff" strokeWidth="1.8" />
                <text x={pos.x + 10} y={pos.y + 4} fill="#edf0f8" fontSize="11" fontWeight="600">
                  {name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Route Details & Table */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                    <th className="py-2 pr-3">Corridor</th>
                    <th className="py-2 pr-3">Distance / ETA</th>
                    <th className="py-2 pr-3">Weather</th>
                    <th className="py-2 pr-3">Vessels</th>
                    <th className="py-2">Disruption</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
                  {routes.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer transition ${
                        selected?.id === r.id
                          ? 'bg-ink-black-50/80 dark:bg-deep-space-blue-800/60'
                          : 'hover:bg-dusty-denim-50/60 dark:hover:bg-deep-space-blue-800/30'
                      }`}
                    >
                      <td className="py-3 pr-3 font-bold">
                        {r.origin_port_name} ↔ {r.destination_port_name}
                      </td>
                      <td className="py-3 pr-3">
                        <div>{r.distance_nm} NM</div>
                        <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                          ~{r.estimated_hours} hrs
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-medium">{r.weather_status}</div>
                        <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                          {r.wave_height_m}m wave • {r.wind_knots} kn
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-semibold">{r.active_vessels_count}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            r.disruption_level === 'High Risk'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                              : r.disruption_level === 'Minor Delay'
                              ? 'bg-eggshell-500/20 text-eggshell-800 dark:text-eggshell-200'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {r.disruption_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="rounded-xl border border-dusty-denim-200 bg-eggshell-50/70 p-4 text-xs dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
              <div className="flex items-center gap-2 font-bold text-ink-black-900 dark:text-white">
                <Navigation className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
                <span>
                  Selected Corridor: {selected.origin_port_name} ↔ {selected.destination_port_name}
                </span>
              </div>
              <p className="mt-1.5 text-dusty-denim-700 dark:text-blue-slate-200">{selected.disruption_note}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-dusty-denim-600 dark:text-blue-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Waves className="h-3.5 w-3.5" /> Swell: {selected.wave_height_m} m
                </span>
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Disruption: {selected.disruption_level}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
