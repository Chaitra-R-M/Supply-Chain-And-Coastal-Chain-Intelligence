import React, { useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, Clock, Package, Warehouse } from 'lucide-react';

const inventory = [
  { id: 'INV-001', cargo: 'Basmati Rice', category: 'Agricultural', port: 'Mangalore Port', qty_stored: 500, qty_max: 600, unit: 'MT', arrival: 'Dec 16', eta_departure: 'Dec 16', days_stored: 1, status: 'Dispatched' },
  { id: 'INV-002', cargo: 'Cardamom', category: 'Spice', port: 'Kochi Port', qty_stored: 25, qty_max: 50, unit: 'MT', arrival: 'Dec 10', eta_departure: 'Dec 20', days_stored: 8, status: 'Stored' },
  { id: 'INV-003', cargo: 'Pepper (Black)', category: 'Spice', port: 'Kochi Port', qty_stored: 15, qty_max: 30, unit: 'MT', arrival: 'Dec 8', eta_departure: 'Dec 22', days_stored: 10, status: 'Storage Alert' },
  { id: 'INV-004', cargo: 'Steel Rods', category: 'Metals', port: 'Mumbai (JNPT)', qty_stored: 120, qty_max: 200, unit: 'MT', arrival: 'Dec 14', eta_departure: 'Dec 21', days_stored: 4, status: 'Stored' },
  { id: 'INV-005', cargo: 'Coconut Oil', category: 'Food', port: 'Kochi Port', qty_stored: 60, qty_max: 100, unit: 'MT', arrival: 'Dec 11', eta_departure: 'Dec 23', days_stored: 7, status: 'Stored' },
];

const movements = [
  { date: 'Dec 16', cargo: 'Basmati Rice', qty: '500 MT', type: 'Dispatch', port: 'Mangalore Port' },
  { date: 'Dec 14', cargo: 'Steel Rods', qty: '120 MT', type: 'Arrival', port: 'Mumbai (JNPT)' },
  { date: 'Dec 11', cargo: 'Coconut Oil', qty: '60 MT', type: 'Arrival', port: 'Kochi Port' },
  { date: 'Dec 10', cargo: 'Cardamom', qty: '25 MT', type: 'Arrival', port: 'Kochi Port' },
  { date: 'Dec 8', cargo: 'Pepper', qty: '15 MT', type: 'Arrival', port: 'Kochi Port' },
];

const STATUS_STYLES = {
  Stored: 'bg-blue-slate-500/15 text-blue-slate-700 dark:text-blue-slate-300',
  Dispatched: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'Storage Alert': 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

export default function CargoInventory() {
  const [selectedPort, setSelectedPort] = useState('All');
  const ports = ['All', ...Array.from(new Set(inventory.map((i) => i.port)))];

  const filtered = selectedPort === 'All' ? inventory : inventory.filter((i) => i.port === selectedPort);
  const totalStored = inventory.reduce((s, i) => s + i.qty_stored, 0);
  const alerts = inventory.filter((i) => i.days_stored >= 10 || i.status === 'Storage Alert');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Inventory Monitoring</h1>
        <p className="text-sm text-dusty-denim-600 dark:text-blue-slate-300">
          Cargo stored across ports — quantities, storage duration &amp; overflow alerts
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Warehouse className="h-4 w-4 text-eggshell-500" />
          <p className="mt-1.5 text-2xl font-extrabold">{inventory.length}</p>
          <p className="text-[11px] text-dusty-denim-500">Cargo Items at Storage</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Boxes className="h-4 w-4 text-eggshell-500" />
          <p className="mt-1.5 text-2xl font-extrabold">{totalStored.toLocaleString()} MT</p>
          <p className="text-[11px] text-dusty-denim-500">Total in Storage</p>
        </div>
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-3.5 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <Package className="h-4 w-4 text-eggshell-500" />
          <p className="mt-1.5 text-2xl font-extrabold">{ports.length - 1}</p>
          <p className="text-[11px] text-dusty-denim-500">Storage Ports</p>
        </div>
        <div className={`rounded-xl border p-3.5 ${alerts.length > 0 ? 'border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10' : 'border-dusty-denim-200 bg-white dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900'}`}>
          <AlertTriangle className={`h-4 w-4 ${alerts.length > 0 ? 'text-rose-600' : 'text-dusty-denim-400'}`} />
          <p className={`mt-1.5 text-2xl font-extrabold ${alerts.length > 0 ? 'text-rose-700 dark:text-rose-300' : ''}`}>{alerts.length}</p>
          <p className={`text-[11px] ${alerts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-dusty-denim-500'}`}>Storage Alerts</p>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs dark:border-rose-500/30 dark:bg-rose-500/10">
          <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200 mb-1">
            <AlertTriangle className="h-4 w-4" /> Storage Duration Alert
          </div>
          <p className="text-rose-700 dark:text-rose-300">
            {alerts.map((a) => a.cargo).join(', ')} at {alerts[0].port} {alerts.length > 1 ? `and ${alerts.length - 1} other items are` : 'is'} approaching maximum storage duration. Consider expediting transportation requests.
          </p>
        </div>
      )}

      {/* Port Filter */}
      <div className="flex flex-wrap gap-2">
        {ports.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setSelectedPort(p)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${selectedPort === p ? 'border-eggshell-500 bg-eggshell-500 text-white dark:bg-eggshell-700' : 'border-dusty-denim-200 text-dusty-denim-600 dark:border-deep-space-blue-700 dark:text-blue-slate-300'}`}
          >{p}</button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Cargo</th>
                <th className="py-2 pr-3">Port</th>
                <th className="py-2 pr-3">Stored</th>
                <th className="py-2 pr-3">Capacity Used</th>
                <th className="py-2 pr-3">Days Stored</th>
                <th className="py-2 pr-3">ETA Departure</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {filtered.map((item) => (
                <tr key={item.id} className={`hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40 ${item.status === 'Storage Alert' ? 'bg-rose-50/60 dark:bg-rose-500/5' : ''}`}>
                  <td className="py-2.5 pr-3 font-bold text-ink-black-900 dark:text-white">{item.id}</td>
                  <td className="py-2.5 pr-3 font-semibold">{item.cargo}</td>
                  <td className="py-2.5 pr-3 text-dusty-denim-600 dark:text-blue-slate-300">{item.port}</td>
                  <td className="py-2.5 pr-3 font-semibold">{item.qty_stored} {item.unit}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-20 rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                        <div className={`h-full rounded-full ${item.qty_stored / item.qty_max > 0.9 ? 'bg-rose-500' : 'bg-eggshell-500'}`} style={{ width: `${Math.round((item.qty_stored / item.qty_max) * 100)}%` }} />
                      </div>
                      <span className="font-bold">{Math.round((item.qty_stored / item.qty_max) * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`flex items-center gap-1 ${item.days_stored >= 10 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-dusty-denim-600 dark:text-blue-slate-300'}`}>
                      <Clock className="h-3 w-3" />{item.days_stored} days
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-dusty-denim-500">{item.eta_departure}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[item.status] || ''}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement History */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <h2 className="mb-3 text-base font-bold text-ink-black-900 dark:text-ink-black-50">Recent Cargo Movements</h2>
        <div className="space-y-2.5">
          {movements.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-dusty-denim-100 px-3 py-2 text-xs dark:border-deep-space-blue-800">
              <span className="text-dusty-denim-500 dark:text-blue-slate-400">{m.date}</span>
              <span className="font-semibold text-ink-black-900 dark:text-white">{m.cargo}</span>
              <span className="text-dusty-denim-600 dark:text-blue-slate-300">{m.qty}</span>
              <span className="flex items-center gap-1 font-semibold">
                {m.type === 'Arrival' ? <ArrowDownRight className="h-3.5 w-3.5 text-blue-slate-500" /> : <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />}
                <span className={m.type === 'Arrival' ? 'text-blue-slate-700 dark:text-blue-slate-300' : 'text-emerald-700 dark:text-emerald-300'}>{m.type}</span>
              </span>
              <span className="text-dusty-denim-500 dark:text-blue-slate-400">{m.port}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
