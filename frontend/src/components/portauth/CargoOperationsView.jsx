import React, { useEffect, useState } from 'react';
import { Container, History, Plus } from 'lucide-react';
import { api } from '../../api/client';

const STATUS_FLOW = ['Scheduled', 'Unloading', 'Loading', 'Stored', 'Dispatched'];

export default function CargoOperationsView({ portId, onRefreshGlobal }) {
  const [cargos, setCargos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    cargo_type: 'Containers',
    commodity: '',
    quantity_mt: 5500,
    owner_company: '',
    destination: '',
    vessel_name: 'MV Ocean Star',
    berth_code: 'B1',
    warehouse_code: 'WH-A1',
    operation: 'Import Unloading',
  });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api.getCargo(portId);
      setCargos(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [portId]);

  const handleStatusUpdate = async (cargo, status) => {
    setError('');
    try {
      await api.updateCargo(portId, cargo.id, { status });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.recordCargo(portId, { ...form, quantity_mt: Number(form.quantity_mt) });
      setShowAdd(false);
      setForm({ ...form, commodity: '', owner_company: '', destination: '' });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
            Cargo Operations &amp; Handling History
          </h1>
          <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
            Record cargo arrivals, monitor loading/unloading shifts, track intra-port movement, and maintain logs
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ink-black-600"
        >
          <Plus className="h-3.5 w-3.5" /> Record Cargo Arrival
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2.5 pr-3">Tracking / Type</th>
                <th className="py-2.5 pr-3">Commodity &amp; Quantity</th>
                <th className="py-2.5 pr-3">Owner &amp; Destination</th>
                <th className="py-2.5 pr-3">Vessel / Location</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5 text-right">Update &amp; Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {cargos.map((c) => (
                <tr key={c.id} className="hover:bg-dusty-denim-50/60 dark:hover:bg-deep-space-blue-800/30">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5 font-bold text-ink-black-900 dark:text-white">
                      <Container className="h-3.5 w-3.5 text-ink-black-500 dark:text-eggshell-300" />
                      <span>{c.tracking_code}</span>
                    </div>
                    <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{c.cargo_type}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="font-medium">{c.commodity}</div>
                    <div className="text-[11px] font-bold text-ink-black-600 dark:text-eggshell-300">
                      {c.quantity_mt.toLocaleString()} MT
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div>{c.owner_company}</div>
                    <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">→ {c.destination}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div>{c.vessel_name}</div>
                    <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                      Berth {c.berth_code || 'TBD'} • Yard {c.warehouse_code || 'TBD'}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      aria-label={`Status for ${c.tracking_code}`}
                      value={c.status}
                      onChange={(e) => handleStatusUpdate(c, e.target.value)}
                      className="rounded-lg border border-dusty-denim-200 bg-dusty-denim-50 px-2 py-1 text-[11px] font-semibold dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                    >
                      {STATUS_FLOW.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="inline-flex items-center gap-1 rounded border border-dusty-denim-200 px-2.5 py-1 text-[11px] font-medium hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:hover:bg-deep-space-blue-800"
                    >
                      <History className="h-3 w-3" /> History ({c.history.length})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-ink-black-300 bg-eggshell-50/70 p-4 dark:border-ink-black-600 dark:bg-deep-space-blue-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">
              Handling Log — {selected.tracking_code} ({selected.commodity})
            </h3>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs font-semibold text-dusty-denim-600 hover:underline dark:text-blue-slate-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            {selected.history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-dusty-denim-200 bg-white px-3 py-2 dark:border-deep-space-blue-800 dark:bg-ink-black-950/60"
              >
                <span className="font-medium">{h.event}</span>
                <span className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                  {new Date(h.ts).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900"
          >
            <h3 className="text-base font-bold">Record Cargo Arrival</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <label>
                <span className="font-semibold">Cargo Type</span>
                <select
                  value={form.cargo_type}
                  onChange={(e) => setForm({ ...form, cargo_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                >
                  <option>Containers</option>
                  <option>Dry Bulk</option>
                  <option>Liquid Bulk</option>
                  <option>Breakbulk</option>
                </select>
              </label>
              <label>
                <span className="font-semibold">Quantity (MT)</span>
                <input
                  type="number"
                  required
                  value={form.quantity_mt}
                  onChange={(e) => setForm({ ...form, quantity_mt: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="col-span-2">
                <span className="font-semibold">Commodity</span>
                <input
                  required
                  value={form.commodity}
                  onChange={(e) => setForm({ ...form, commodity: e.target.value })}
                  placeholder="Refined Polymer Resin"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Owner Company</span>
                <input
                  required
                  value={form.owner_company}
                  onChange={(e) => setForm({ ...form, owner_company: e.target.value })}
                  placeholder="Malabar Petrochem"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Destination</span>
                <input
                  required
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="Bengaluru Hub"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Vessel Name</span>
                <input
                  required
                  value={form.vessel_name}
                  onChange={(e) => setForm({ ...form, vessel_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Warehouse / Yard</span>
                <input
                  value={form.warehouse_code}
                  onChange={(e) => setForm({ ...form, warehouse_code: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600"
              >
                Record Manifest
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
