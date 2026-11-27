import React, { useState } from 'react';
import { Anchor, Minus, Plus, RotateCcw, AlertTriangle, Navigation } from 'lucide-react';

const STATUS_STYLE = {
  'En Route': { dot: '#22c55e', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' },
  'At Berth': { dot: '#496ab6', badge: 'bg-ink-black-500/25 text-ink-black-200 border-ink-black-400/50' },
  Anchored: { dot: '#c6b26c', badge: 'bg-eggshell-500/20 text-eggshell-200 border-eggshell-400/50' },
  Delayed: { dot: '#ef4444', badge: 'bg-rose-500/25 text-rose-300 border-rose-400/50' },
  Departing: { dot: '#799bb9', badge: 'bg-blue-slate-500/25 text-blue-slate-200 border-blue-slate-400/50' },
};

export default function VesselMap({ portName = 'Mangalore Port', vessels = [], onSelectVessel }) {
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const selectedVessel = vessels.find((v) => v.id === selectedId) || null;

  const handleSelect = (v) => {
    setSelectedId(v.id);
    if (onSelectVessel) onSelectVessel(v);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-dusty-denim-200 bg-deep-space-blue-950 shadow-sm dark:border-deep-space-blue-800">
      {/* Zoom Controls (matching screenshot top-left +/-) */}
      <div className="absolute left-3 top-3 z-20 flex flex-col overflow-hidden rounded-lg border border-deep-space-blue-700 bg-white/95 text-ink-black-900 shadow-md dark:bg-ink-black-900/95 dark:text-ink-black-50">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
          aria-label="Zoom In"
          className="border-b border-dusty-denim-200 p-1.5 hover:bg-dusty-denim-50 dark:border-deep-space-blue-800 dark:hover:bg-deep-space-blue-800"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
          aria-label="Zoom Out"
          className="border-b border-dusty-denim-200 p-1.5 hover:bg-dusty-denim-50 dark:border-deep-space-blue-800 dark:hover:bg-deep-space-blue-800"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          aria-label="Reset Zoom"
          className="p-1.5 hover:bg-dusty-denim-50 dark:hover:bg-deep-space-blue-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Interactive Coastal Map Canvas */}
      <div className="relative h-[300px] w-full overflow-hidden sm:h-[330px]">
        <div
          className="h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: '72% 56%' }}
        >
          <svg
            viewBox="0 0 800 400"
            preserveAspectRatio="none"
            className="h-full w-full"
            role="img"
            aria-label={`Vessel movement map for ${portName}`}
          >
            <defs>
              <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0a0f1a" />
                <stop offset="55%" stopColor="#0f1824" />
                <stop offset="100%" stopColor="#1d2a49" />
              </linearGradient>
              <linearGradient id="coastalShallow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#121a21" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#354e64" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#233443" />
                <stop offset="55%" stopColor="#354e64" />
                <stop offset="100%" stopColor="#263140" />
              </linearGradient>
            </defs>

            {/* Deep Ocean */}
            <rect width="800" height="400" fill="url(#oceanGrad)" />

            {/* Subtle Navigation Grid */}
            {[80, 160, 240, 320].map((y) => (
              <line key={`hy-${y}`} x1="0" y1={y} x2="800" y2={y} stroke="#1f3047" strokeWidth="0.6" strokeDasharray="3 6" />
            ))}
            {[150, 300, 450, 600].map((x) => (
              <line key={`vx-${x}`} x1={x} y1="0" x2={x} y2="400" stroke="#1f3047" strokeWidth="0.6" strokeDasharray="3 6" />
            ))}

            {/* Shallow Coastal Shelf */}
            <path
              d="M 420 0 Q 485 110 530 190 T 625 400 L 800 400 L 800 0 Z"
              fill="url(#coastalShallow)"
            />

            {/* Karnataka Coastline & Harbor Breakwater */}
            <path
              d="M 520 0 C 545 55, 560 105, 585 150 C 605 186, 616 205, 622 222 L 598 228 L 596 244 L 632 248 C 646 290, 675 345, 705 400 L 800 400 L 800 0 Z"
              fill="url(#landGrad)"
              stroke="#5882a7"
              strokeWidth="1.5"
            />
            {/* Harbor Basin & River Estuary */}
            <path
              d="M 622 225 Q 655 232 678 214 Q 695 238 665 256 L 632 248 Z"
              fill="#0f1824"
              stroke="#4d77b3"
              strokeWidth="1"
            />
            {/* Coastal Highway / Rail Links */}
            <path
              d="M 625 0 Q 675 180 740 400"
              fill="none"
              stroke="#b89f47"
              strokeWidth="1"
              strokeOpacity="0.45"
              strokeDasharray="6 4"
            />

            {/* Vessel Approach Routes (dashed curved sea lanes) */}
            {vessels.map((v) => {
              const pts = v.waypoints && v.waypoints.length >= 2 ? v.waypoints : [[v.map_x, v.map_y], [78, 59]];
              const d = pts
                .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${(p[0] * 8).toFixed(1)} ${(p[1] * 4).toFixed(1)}`)
                .join(' ');
              const strokeColor =
                v.status === 'Delayed' ? '#ef4444' : v.status === 'Anchored' ? '#c6b26c' : '#9bb4ca';
              return (
                <path
                  key={`route-${v.id}`}
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={v.id === selectedId ? '2.2' : '1.4'}
                  strokeDasharray="5 5"
                  strokeOpacity={v.status === 'At Berth' ? 0.35 : 0.78}
                />
              );
            })}
          </svg>

          {/* Harbor Pin */}
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: '78.5%', top: '61%' }}
          >
            <div className="flex items-center gap-1.5 rounded-full border border-ink-black-300/60 bg-ink-black-900/95 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-black-500 text-eggshell-200">
                <Anchor className="h-3 w-3" />
              </span>
              <span>{portName}</span>
            </div>
          </div>

          {/* Vessel Markers */}
          {vessels.map((v) => {
            const st = STATUS_STYLE[v.status] || STATUS_STYLE['En Route'];
            const isSelected = selectedId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelect(v)}
                style={{ left: `${v.map_x}%`, top: `${v.map_y}%` }}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left focus:outline-none"
              >
                <div className="relative flex items-center gap-1.5">
                  {v.status === 'En Route' || v.status === 'Delayed' ? (
                    <span
                      className="pulse-ring absolute -left-1 -top-1 h-5 w-5 rounded-full"
                      style={{ backgroundColor: st.dot }}
                    />
                  ) : null}
                  <span
                    className={`relative flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125 ${
                      isSelected ? 'scale-125 ring-2 ring-eggshell-300' : ''
                    }`}
                    style={{ backgroundColor: st.dot }}
                  />
                  {/* Show floating label for key approaching/berth/selected vessels without overcrowding */}
                  {(v.status !== 'At Berth' || v.name === 'MV Bharat' || isSelected) && (
                    <div className="pointer-events-none whitespace-nowrap rounded-md border border-deep-space-blue-700/80 bg-ink-black-950/85 px-2 py-0.5 text-[10px] leading-tight text-ink-black-50 shadow-md backdrop-blur-sm">
                      <div className="flex items-center gap-1 font-semibold">
                        <span>{v.name}</span>
                        {v.route_deviation && <AlertTriangle className="h-2.5 w-2.5 text-rose-400" />}
                      </div>
                      <div className="text-[9px] text-blue-slate-300">{v.eta_text}</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Vessel Telemetry Popover */}
        {selectedVessel && (
          <div className="absolute right-3 top-3 z-20 w-64 rounded-xl border border-deep-space-blue-700 bg-ink-black-950/95 p-3 text-xs text-ink-black-50 shadow-xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-white">{selectedVessel.name}</p>
                <p className="text-[11px] text-blue-slate-300">
                  {selectedVessel.imo_number} • {selectedVessel.vessel_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-blue-slate-300 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-blue-slate-200">
              <div>Speed: {selectedVessel.speed_knots} kn</div>
              <div>Draft: {selectedVessel.draft_m} m</div>
              <div>From: {selectedVessel.origin_port}</div>
              <div>Status: {selectedVessel.status}</div>
            </div>
            {selectedVessel.route_deviation && (
              <div className="mt-2 flex items-center gap-1 rounded bg-rose-500/20 px-2 py-1 text-[10px] text-rose-200">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Route deviation: {selectedVessel.deviation_nm} NM off track</span>
              </div>
            )}
          </div>
        )}

        {/* Map Legend (bottom-left matching screenshot) */}
        <div className="absolute bottom-2.5 left-3 z-20 flex flex-wrap items-center gap-3 rounded-lg border border-deep-space-blue-800/80 bg-ink-black-950/85 px-3 py-1.5 text-[11px] text-ink-black-100 backdrop-blur-sm">
          {[
            { label: 'En Route', color: '#22c55e' },
            { label: 'At Berth', color: '#496ab6' },
            { label: 'Anchored', color: '#c6b26c' },
            { label: 'Delayed', color: '#ef4444' },
          ].map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </span>
          ))}
        </div>

        <div className="absolute bottom-2.5 right-3 z-20 hidden items-center gap-1 rounded-lg bg-ink-black-950/75 px-2 py-1 text-[10px] text-blue-slate-300 sm:flex">
          <Navigation className="h-3 w-3 text-eggshell-400" />
          <span>Click vessel pin for telemetry</span>
        </div>
      </div>
    </div>
  );
}
