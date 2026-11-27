import React, { useEffect, useState } from 'react';
import { AlertTriangle, Compass, Gauge, History, MapPin, Navigation, RefreshCw, Timer } from 'lucide-react';
import VesselMap from '../portauth/VesselMap';

const initialPositions = [
  { id: 1, name: 'MV Bharat', imo_number: 'IMO9234561', vessel_type: 'Bulk Carrier', status: 'En Route', map_x: 42, map_y: 55, speed_knots: 12.4, draft_m: 8.4, origin_port: 'Mangalore', destination_port: 'Kochi', eta_text: 'ETA 3h 12m', heading: 165, route_deviation: false, waypoints: [[42,55],[65,62],[72,58]] },
  { id: 2, name: 'SS Konkan', imo_number: 'IMO8876543', vessel_type: 'Container', status: 'At Berth', map_x: 71, map_y: 61, speed_knots: 0, draft_m: 7.2, origin_port: 'Mumbai', destination_port: 'Mangalore', eta_text: 'Berthed', heading: 90, route_deviation: false, waypoints: [[71,61]] },
  { id: 3, name: 'MV Malabar', imo_number: 'IMO7654321', vessel_type: 'Tanker', status: 'Anchored', map_x: 55, map_y: 72, speed_knots: 2, draft_m: 9.1, origin_port: 'Kochi', destination_port: '—', eta_text: 'Anchored', heading: 45, route_deviation: false, waypoints: [[55,72]] },
  { id: 4, name: 'MV Sahyadri', imo_number: 'IMO6543219', vessel_type: 'General Cargo', status: 'Delayed', map_x: 30, map_y: 40, speed_knots: 8, draft_m: 6.5, origin_port: 'Mormugao', destination_port: 'Mumbai (JNPT)', eta_text: 'Delayed +3h', heading: 340, route_deviation: true, deviation_nm: 4.2, waypoints: [[30,40],[68,60]] },
  { id: 5, name: 'MV Western Ghats', imo_number: 'IMO2198765', vessel_type: 'Tanker', status: 'En Route', map_x: 60, map_y: 38, speed_knots: 11, draft_m: 10.2, origin_port: 'Mangalore', destination_port: 'Chennai', eta_text: 'ETA 7h 40m', heading: 85, route_deviation: false, waypoints: [[60,38],[72,50]] },
];

const locationHistory = [
  { time: '12:00', vessel: 'MV Bharat', lat: '12.8471°N', lon: '74.8420°E', speed: 12.4 },
  { time: '11:30', vessel: 'MV Bharat', lat: '12.7121°N', lon: '74.7740°E', speed: 12.0 },
  { time: '11:00', vessel: 'MV Bharat', lat: '12.5802°N', lon: '74.7010°E', speed: 12.8 },
  { time: '10:30', vessel: 'MV Western Ghats', lat: '13.1201°N', lon: '74.9010°E', speed: 11.2 },
  { time: '10:00', vessel: 'MV Western Ghats', lat: '13.0102°N', lon: '74.9520°E', speed: 11.0 },
];

export default function ShippingVesselTracking() {
  const [vessels, setVessels] = useState(initialPositions);
  const [selected, setSelected] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [lastTick, setLastTick] = useState(new Date().toLocaleTimeString());

  // Simulate vessel movement when no live AIS feed
  useEffect(() => {
    if (!simulating) return;
    const t = setInterval(() => {
      setVessels((prev) =>
        prev.map((v) => {
          if (v.status !== 'En Route' && v.status !== 'Delayed') return v;
          const dx = (Math.random() - 0.35) * 1.6;
          const dy = (Math.random() - 0.4) * 1.4;
          const nx = Math.min(75, Math.max(20, v.map_x + dx));
          const ny = Math.min(80, Math.max(20, v.map_y + dy));
          return {
            ...v,
            map_x: Number(nx.toFixed(1)),
            map_y: Number(ny.toFixed(1)),
            speed_knots: Number((v.speed_knots + (Math.random() - 0.5) * 0.6).toFixed(1)),
            heading: (v.heading + Math.floor((Math.random() - 0.5) * 12) + 360) % 360,
          };
        })
      );
      setLastTick(new Date().toLocaleTimeString());
    }, 2000);
    return () => clearInterval(t);
  }, [simulating]);

  const selectedVessel = vessels.find((v) => v.id === selected);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Vessel Tracking</h1>
          <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
            Live fleet positions, speeds, headings, route deviations &amp; ETA monitoring
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSimulating((s) => !s)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            simulating
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-ink-black-500 text-white hover:bg-ink-black-600'
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${simulating ? 'animate-spin' : ''}`} />
          {simulating ? 'Stop Simulation' : 'Simulate Movement'}
        </button>
      </div>

      {/* Telemetry Strip */}
      {selectedVessel && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 rounded-xl border border-dusty-denim-200 bg-ink-black-50 p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <div>
            <p className="text-[11px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400">Vessel</p>
            <p className="text-sm font-bold text-ink-black-900 dark:text-white">{selectedVessel.name}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400">Position</p>
            <p className="text-sm font-bold text-ink-black-900 dark:text-white">
              {selectedVessel.map_x.toFixed(1)}% / {selectedVessel.map_y.toFixed(1)}% (chart)
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400">Speed</p>
            <p className="text-sm font-bold text-ink-black-900 dark:text-white">{selectedVessel.speed_knots} kn</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400">Heading</p>
            <p className="text-sm font-bold text-ink-black-900 dark:text-white">{selectedVessel.heading}°</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-dusty-denim-500 dark:text-blue-slate-400">ETA / Status</p>
            <p className={`text-sm font-bold ${selectedVessel.route_deviation ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {selectedVessel.eta_text}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Map */}
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-black-900 dark:text-ink-black-50">Live Fleet Positions</h2>
            <span className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Last tick: {lastTick}</span>
          </div>
          <VesselMap portName="Company Fleet" vessels={vessels} onSelectVessel={(v) => setSelected(v.id)} />
        </div>

        {/* Vessel List */}
        <div className="space-y-3 xl:col-span-5">
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 text-base font-bold text-ink-black-900 dark:text-ink-black-50">Fleet Telemetry</h2>
            <div className="space-y-2.5">
              {vessels.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelected(v.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                    selected === v.id
                      ? 'border-ink-black-500 bg-ink-black-50 dark:border-ink-black-500 dark:bg-deep-space-blue-800'
                      : 'border-dusty-denim-200 hover:border-ink-black-300 dark:border-deep-space-blue-800 dark:hover:border-deep-space-blue-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-black-900 dark:text-white">{v.name}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      v.route_deviation ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                      : v.status === 'En Route' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : 'bg-blue-slate-500/15 text-blue-slate-600 dark:text-blue-slate-300'
                    }`}>
                      {v.route_deviation ? `Deviation ${v.deviation_nm} NM` : v.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.origin_port} → {v.destination_port}</span>
                    <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{v.speed_knots} kn</span>
                    <span className="flex items-center gap-1"><Compass className="h-3 w-3" />{v.heading}°</span>
                    <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{v.eta_text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Location History */}
          <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-ink-black-900 dark:text-ink-black-50">
              <History className="h-4 w-4 text-ink-black-500" /> Location History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dusty-denim-100 text-[10px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                    <th className="py-1.5 pr-2">Time</th>
                    <th className="py-1.5 pr-2">Vessel</th>
                    <th className="py-1.5 pr-2">Position</th>
                    <th className="py-1.5">Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
                  {locationHistory.map((h, i) => (
                    <tr key={i}>
                      <td className="py-1.5 pr-2 font-semibold">{h.time}</td>
                      <td className="py-1.5 pr-2">{h.vessel}</td>
                      <td className="py-1.5 pr-2 text-dusty-denim-600 dark:text-blue-slate-300">{h.lat}, {h.lon}</td>
                      <td className="py-1.5">{h.speed} kn</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deviation Alerts */}
          {vessels.some((v) => v.route_deviation) && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <div className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" /> Route Deviation Detected
              </div>
              <p className="mt-1 text-xs">
                MV Sahyadri is 4.2 NM off planned track (Mormugao → Mumbai). Weather avoidance suspected. Consider notifying Port Authority of revised ETA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
