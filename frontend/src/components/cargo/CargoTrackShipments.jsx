import React, { useState } from 'react';
import { AlertTriangle, Gauge, MapPin, Navigation, Ship, Timer } from 'lucide-react';
import VesselMap from '../portauth/VesselMap';

const trackedShipments = [
  { id: 'SHP-5041', cargo: 'Basmati Rice 500 MT', vessel: { id: 1, name: 'MV Bharat', imo_number: 'IMO9234561', vessel_type: 'Bulk Carrier', status: 'En Route', map_x: 42, map_y: 55, speed_knots: 12.4, draft_m: 8.4, origin_port: 'Mangalore', eta_text: 'ETA 3h 12m', waypoints: [[42,55],[65,62],[72,58]] }, progress_pct: 68, from: 'Mangalore Port', to: 'Kochi Port', depart: 'Dec 16, 08:00', eta: 'Dec 18, 14:30' },
  { id: 'SHP-5038', cargo: 'Spices 150 MT', vessel: { id: 4, name: 'MV Sahyadri', imo_number: 'IMO6543219', vessel_type: 'General Cargo', status: 'Delayed', map_x: 30, map_y: 40, speed_knots: 8, draft_m: 6.5, origin_port: 'Mormugao', eta_text: 'Delayed +3h', route_deviation: true, deviation_nm: 4.2, waypoints: [[30,40],[68,60]] }, progress_pct: 52, from: 'Mormugao Port', to: 'Mumbai (JNPT)', depart: 'Dec 16, 06:00', eta: 'Dec 18, 17:00 (+3h)' },
];

export default function CargoTrackShipments() {
  const [selected, setSelected] = useState(trackedShipments[0]);
  const allVessels = trackedShipments.map((s) => s.vessel);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Track Shipments</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Real-time cargo shipment tracking — vessel position, ETA &amp; delay notifications
        </p>
      </div>

      {/* Shipment selector */}
      <div className="flex flex-wrap gap-3">
        {trackedShipments.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s)}
            className={`rounded-xl border px-4 py-3 text-left text-xs transition ${
              selected.id === s.id
                ? 'border-eggshell-500 bg-eggshell-50 dark:border-eggshell-500/50 dark:bg-eggshell-500/10'
                : 'border-dusty-denim-200 bg-white hover:border-eggshell-400 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900'
            }`}
          >
            <div className="font-bold text-ink-black-900 dark:text-white">{s.id}</div>
            <div className="text-dusty-denim-600 dark:text-blue-slate-300">{s.cargo}</div>
            <div className={`mt-1 font-semibold ${s.vessel.status === 'Delayed' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {s.vessel.status}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Map */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">
              Cargo Tracking — {selected.id}
            </h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${selected.vessel.status === 'Delayed' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}`}>
              {selected.vessel.status}
            </span>
          </div>
          <VesselMap portName="Cargo Tracking" vessels={allVessels} />

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-dusty-denim-600 dark:text-blue-slate-300">{selected.from}</span>
              <span className="text-dusty-denim-600 dark:text-blue-slate-300">{selected.to}</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
              <div className={`h-full rounded-full transition-all ${selected.vessel.status === 'Delayed' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${selected.progress_pct}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-ink-black-700 shadow dark:border-ink-black-900"
                style={{ left: `${selected.progress_pct}%` }}>
                <Ship className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-dusty-denim-500">
              <span>Departed: {selected.depart}</span>
              <span className="font-bold">{selected.progress_pct}% complete</span>
              <span>ETA: {selected.eta}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 xl:col-span-5">
          {/* Vessel Info */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 text-base font-bold text-ink-black-900 dark:text-ink-black-50">Vessel Telemetry</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Vessel', value: selected.vessel.name, icon: Ship },
                { label: 'IMO', value: selected.vessel.imo_number, icon: Navigation },
                { label: 'Speed', value: `${selected.vessel.speed_knots} kn`, icon: Gauge },
                { label: 'ETA', value: selected.vessel.eta_text, icon: Timer },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-dusty-denim-100 p-2.5 dark:border-deep-space-blue-800">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400">
                      <Icon className="h-3 w-3" />{item.label}
                    </span>
                    <span className="mt-1 block font-bold text-ink-black-900 dark:text-white">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Route detail */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 text-base font-bold text-ink-black-900 dark:text-ink-black-50">Shipment Route</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Cargo</span>
                <span className="font-semibold">{selected.cargo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Route</span>
                <span className="font-semibold">{selected.from} → {selected.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Departed</span>
                <span>{selected.depart}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">ETA</span>
                <span className={`font-bold ${selected.vessel.status === 'Delayed' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{selected.eta}</span>
              </div>
            </div>
          </div>

          {/* Deviation alert */}
          {selected.vessel.route_deviation && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 dark:border-rose-500/30 dark:bg-rose-500/10">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-200">
                <AlertTriangle className="h-4 w-4" /> Route Deviation Detected
              </div>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                Vessel is {selected.vessel.deviation_nm} NM off planned course. ETA may be impacted. Carrier notification sent.
              </p>
            </div>
          )}

          {/* Event Log */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 text-base font-bold text-ink-black-900 dark:text-ink-black-50">Shipment Events</h2>
            <div className="space-y-2.5 text-xs">
              {[
                { time: 'Dec 16, 08:00', event: 'Vessel departed Mangalore Port', type: 'info' },
                { time: 'Dec 16, 14:30', event: 'Cargo loading completed – 500 MT Rice confirmed', type: 'success' },
                { time: 'Dec 17, 10:00', event: 'High swell advisory issued for route', type: 'warning' },
                { time: 'Dec 17, 16:00', event: 'Vessel speed reduced to 10 kn due to weather', type: 'warning' },
              ].map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${e.type === 'success' ? 'bg-emerald-500' : e.type === 'warning' ? 'bg-eggshell-500' : 'bg-blue-slate-400'}`} />
                  <span>
                    <span className="font-semibold text-dusty-denim-500 dark:text-blue-slate-400">{e.time} — </span>
                    <span className="text-ink-black-800 dark:text-blue-slate-200">{e.event}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
