import React, { useEffect, useState } from 'react';
import { AlertTriangle, Boxes, MinusCircle, PlusCircle, Snowflake } from 'lucide-react';
import { api } from '../api/client';

export default function InventoryView({ portId, onRefreshGlobal }) {
  const [data, setData] = useState(null);
  const [adjustWh, setAdjustWh] = useState(null);
  const [delta, setDelta] = useState(2500);
  const [reason, setReason] = useState('Cargo arrival intake');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.getInventory(portId);
      setData(res);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [portId]);

  const handleAdjust = async (sign) => {
    if (!adjustWh) return;
    setError('');
    try {
      const res = await api.adjustInventory(portId, {
        warehouse_id: adjustWh.id,
        delta_mt: sign * Math.abs(Number(delta)),
        reason,
      });
      setData(res);
      setAdjustWh(null);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!data) return <div className="p-6 text-xs text-dusty-denim-500">Loading inventory...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
            Port Warehouse &amp; Yard Inventory
          </h1>
          <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
            Track stored cargo, storage duration, available capacity, and automated overflow alerts
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="rounded-lg border border-dusty-denim-200 bg-white px-3 py-2 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <span className="text-dusty-denim-500 dark:text-blue-slate-400">Overall Utilization: </span>
            <strong className="text-ink-black-900 dark:text-white">{data.summary.overall_utilization_pct}%</strong>
          </div>
          <div className="rounded-lg border border-dusty-denim-200 bg-white px-3 py-2 dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
            <span className="text-dusty-denim-500 dark:text-blue-slate-400">Available Capacity: </span>
            <strong className="text-emerald-600 dark:text-emerald-400">
              {data.summary.total_available_mt.toLocaleString()} MT
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Storage Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((al, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>
                <strong>[{al.severity}]</strong> {al.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.warehouses.map((wh) => {
          const barColor =
            wh.utilization_pct >= 95
              ? 'bg-rose-500'
              : wh.utilization_pct >= 85
              ? 'bg-eggshell-500'
              : 'bg-ink-black-500 dark:bg-ink-black-400';

          return (
            <div
              key={wh.id}
              className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
                    <h3 className="text-sm font-bold text-ink-black-900 dark:text-white">
                      {wh.name} ({wh.code})
                    </h3>
                    {wh.temperature_controlled && (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-slate-700 dark:bg-blue-slate-800 dark:text-blue-slate-200">
                        <Snowflake className="h-2.5 w-2.5" /> Cold-Chain
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                    {wh.facility_type} • Avg Dwell: {wh.avg_dwell_days} days
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    wh.capacity_state === 'Overflow Risk'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                      : wh.capacity_state === 'Near Capacity'
                      ? 'bg-eggshell-500/20 text-eggshell-700 dark:text-eggshell-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {wh.capacity_state}
                </span>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span>
                    {wh.utilized_mt.toLocaleString()} / {wh.capacity_mt.toLocaleString()} MT
                  </span>
                  <span className="font-bold">{wh.utilization_pct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-dusty-denim-100 dark:bg-deep-space-blue-800">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, wh.utilization_pct)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                  Available space: {wh.available_mt.toLocaleString()} MT
                </p>
              </div>

              {/* Stored Cargo List */}
              {wh.stored_cargo.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-dusty-denim-100 pt-3 dark:border-deep-space-blue-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:text-blue-slate-400">
                    Stored Cargo Lots
                  </p>
                  {wh.stored_cargo.map((c) => (
                    <div
                      key={c.tracking_code}
                      className="flex items-center justify-between rounded-lg bg-dusty-denim-50 px-2.5 py-1.5 text-xs dark:bg-ink-black-950/60"
                    >
                      <span>
                        <strong>{c.tracking_code}</strong> — {c.commodity}
                      </span>
                      <span className="text-[11px] text-dusty-denim-600 dark:text-blue-slate-300">
                        {c.quantity_mt.toLocaleString()} MT • {c.storage_days}d dwell
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAdjustWh(wh)}
                  className="rounded-lg border border-ink-black-300 px-3 py-1 text-xs font-semibold text-ink-black-700 hover:bg-ink-black-50 dark:border-deep-space-blue-700 dark:text-ink-black-200 dark:hover:bg-deep-space-blue-800"
                >
                  Adjust Stock (+/-)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Stock Modal */}
      {adjustWh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <h3 className="text-base font-bold">
              Adjust Inventory — {adjustWh.name} ({adjustWh.code})
            </h3>
            <p className="mt-1 text-xs text-dusty-denim-500 dark:text-blue-slate-400">
              Current stock: {adjustWh.utilized_mt.toLocaleString()} / {adjustWh.capacity_mt.toLocaleString()} MT
            </p>
            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-semibold">Quantity Change (MT)</span>
                <input
                  type="number"
                  min="1"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Operation Reason</span>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustWh(null)}
                className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(-1)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-slate-700"
              >
                <MinusCircle className="h-3.5 w-3.5" /> Remove Stock
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(1)}
                className="inline-flex items-center gap-1 rounded-lg bg-ink-black-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
