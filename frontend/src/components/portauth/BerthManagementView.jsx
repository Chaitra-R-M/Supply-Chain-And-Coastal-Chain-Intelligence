import React, { useEffect, useState } from 'react';
import { Anchor, Building2, CheckCircle2, Clock, Plus, Settings2, Unlock } from 'lucide-react';
import { api } from '../../api/client';

export default function BerthManagementView({ portId, onRefreshGlobal }) {
  const [portInfo, setPortInfo] = useState(null);
  const [berths, setBerths] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [assignBerth, setAssignBerth] = useState(null);
  const [assignForm, setAssignForm] = useState({ vessel_id: '', operation: 'Unloading', duration_hours: 8 });
  const [showNewBerth, setShowNewBerth] = useState(false);
  const [newBerth, setNewBerth] = useState({
    code: 'B7',
    name: 'Berth B7 – Coastal Container',
    berth_type: 'Container',
    max_length_m: 250,
    max_draft_m: 13.5,
    capacity_mt: 50000,
  });
  const [editingPort, setEditingPort] = useState(false);
  const [portForm, setPortForm] = useState({ channel_depth_m: 15.1, max_storage_mt: 180000, operating_hours: '' });
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const load = async () => {
    try {
      const [p, b, v] = await Promise.all([api.getPort(portId), api.getBerths(portId), api.getVessels(portId)]);
      setPortInfo(p);
      setBerths(b);
      setVessels(v);
      setPortForm({
        channel_depth_m: p.channel_depth_m,
        max_storage_mt: p.max_storage_mt,
        operating_hours: p.operating_hours,
      });
    } catch (e) {
      setFeedback({ type: 'error', text: e.message });
    }
  };

  useEffect(() => {
    load();
  }, [portId]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      await api.assignBerth(portId, assignBerth.id, {
        vessel_id: assignForm.vessel_id,
        operation: assignForm.operation,
        duration_hours: Number(assignForm.duration_hours),
      });
      setAssignBerth(null);
      setFeedback({ type: 'success', text: `Vessel assigned to ${assignBerth.code} without overlap.` });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleRelease = async (berth) => {
    setFeedback({ type: '', text: '' });
    try {
      await api.releaseBerth(portId, berth.id);
      setFeedback({ type: 'success', text: `Berth ${berth.code} released and marked Available.` });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleCreateBerth = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      await api.createBerth(portId, {
        ...newBerth,
        max_length_m: Number(newBerth.max_length_m),
        max_draft_m: Number(newBerth.max_draft_m),
        capacity_mt: Number(newBerth.capacity_mt),
      });
      setShowNewBerth(false);
      setFeedback({ type: 'success', text: `Registered new berth ${newBerth.code}.` });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handlePortSave = async (e) => {
    e.preventDefault();
    try {
      await api.updatePort(portId, {
        channel_depth_m: Number(portForm.channel_depth_m),
        max_storage_mt: Number(portForm.max_storage_mt),
        operating_hours: portForm.operating_hours,
      });
      setEditingPort(false);
      setFeedback({ type: 'success', text: 'Port infrastructure parameters updated.' });
      await load();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const assignableVessels = vessels.filter((v) => v.status !== 'At Berth');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
            Port Infrastructure &amp; Berth Management
          </h1>
          <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
            Manage port facilities, berth capacity/restrictions, conflict-free vessel assignment, and occupancy stats
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditingPort((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dusty-denim-200 bg-white px-3 py-2 text-xs font-semibold text-ink-black-800 shadow-sm hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-ink-black-100"
          >
            <Settings2 className="h-3.5 w-3.5" /> Manage Port Capacity
          </button>
          <button
            type="button"
            onClick={() => setShowNewBerth(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ink-black-600"
          >
            <Plus className="h-3.5 w-3.5" /> Register Berth
          </button>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs font-medium ${
            feedback.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Port Information & Facilities Card (Requirement 2.2) */}
      {portInfo && (
        <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-ink-black-500 dark:text-eggshell-300" />
                <h2 className="text-base font-bold text-ink-black-900 dark:text-white">
                  {portInfo.name} ({portInfo.code}) — {portInfo.region}
                </h2>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {portInfo.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="rounded-md border border-dusty-denim-200 bg-eggshell-50 px-2.5 py-0.5 text-[11px] font-medium text-ink-black-800 dark:border-deep-space-blue-700 dark:bg-ink-black-950/70 dark:text-blue-slate-200"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-lg bg-dusty-denim-50 px-3 py-2 dark:bg-ink-black-950/60">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Channel Depth</span>
                <p className="font-bold text-ink-black-900 dark:text-white">{portInfo.channel_depth_m} m</p>
              </div>
              <div className="rounded-lg bg-dusty-denim-50 px-3 py-2 dark:bg-ink-black-950/60">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Storage Cap</span>
                <p className="font-bold text-ink-black-900 dark:text-white">
                  {portInfo.max_storage_mt.toLocaleString()} MT
                </p>
              </div>
              <div className="rounded-lg bg-dusty-denim-50 px-3 py-2 dark:bg-ink-black-950/60">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Operating</span>
                <p className="font-bold text-ink-black-900 dark:text-white">{portInfo.operating_hours}</p>
              </div>
              <div className="rounded-lg bg-dusty-denim-50 px-3 py-2 dark:bg-ink-black-950/60">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">Efficiency</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{portInfo.efficiency_score}%</p>
              </div>
            </div>
          </div>

          {editingPort && (
            <form
              onSubmit={handlePortSave}
              className="mt-4 grid grid-cols-1 gap-3 border-t border-dusty-denim-100 pt-4 sm:grid-cols-4 text-xs dark:border-deep-space-blue-800"
            >
              <label>
                <span className="font-semibold">Channel Depth (m)</span>
                <input
                  type="number"
                  step="0.1"
                  value={portForm.channel_depth_m}
                  onChange={(e) => setPortForm({ ...portForm, channel_depth_m: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-2.5 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Max Storage Capacity (MT)</span>
                <input
                  type="number"
                  value={portForm.max_storage_mt}
                  onChange={(e) => setPortForm({ ...portForm, max_storage_mt: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-2.5 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Operating Hours</span>
                <input
                  value={portForm.operating_hours}
                  onChange={(e) => setPortForm({ ...portForm, operating_hours: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-2.5 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-ink-black-500 px-4 py-1.5 font-semibold text-white hover:bg-ink-black-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Berth Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {berths.map((b) => {
          const isOccupied = b.status === 'Occupied';
          return (
            <div
              key={b.id}
              className="flex flex-col justify-between rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-deep-space-blue-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-ink-black-500">
                        {b.code}
                      </span>
                      <h3 className="text-sm font-bold text-ink-black-900 dark:text-ink-black-50">{b.name}</h3>
                    </div>
                    <p className="mt-1 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                      {b.berth_type} • Max LOA {b.max_length_m}m • Draft {b.max_draft_m}m •{' '}
                      {b.capacity_mt.toLocaleString()} MT
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      isOccupied
                        ? 'bg-ink-black-500/15 text-ink-black-700 dark:text-ink-black-200'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {isOccupied ? (
                  <div className="mt-3 rounded-lg border border-dusty-denim-100 bg-dusty-denim-50/70 p-3 text-xs dark:border-deep-space-blue-800 dark:bg-ink-black-950/60">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{b.current_vessel_name}</span>
                      <span className="text-ink-black-600 dark:text-eggshell-300">{b.operation}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-dusty-denim-200 dark:bg-deep-space-blue-800">
                        <div
                          className="h-full rounded-full bg-ink-black-500"
                          style={{ width: `${b.progress_pct}%` }}
                        />
                      </div>
                      <span className="font-bold">{b.progress_pct}%</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Occupied duration: {b.occupancy_duration_hrs} hrs</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-3 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Ready for immediate vessel allocation</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dusty-denim-100 pt-3 text-xs dark:border-deep-space-blue-800">
                <span className="text-dusty-denim-500 dark:text-blue-slate-400">
                  Monthly Utilization: <strong className="text-ink-black-800 dark:text-white">{b.utilization_pct}%</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignBerth(b);
                      setAssignForm({
                        vessel_id: assignableVessels[0]?.id || '',
                        operation: 'Unloading',
                        duration_hours: 8,
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-ink-black-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-ink-black-600"
                  >
                    <Anchor className="h-3 w-3" /> Assign
                  </button>
                  {isOccupied && (
                    <button
                      type="button"
                      onClick={() => handleRelease(b)}
                      className="inline-flex items-center gap-1 rounded-lg border border-dusty-denim-200 px-2.5 py-1 text-[11px] font-semibold hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:hover:bg-deep-space-blue-800"
                    >
                      <Unlock className="h-3 w-3" /> Release
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Vessel Modal (Tests Overlap Prevention) */}
      {assignBerth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAssignSubmit}
            className="w-full max-w-md rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900"
          >
            <h3 className="text-base font-bold">
              Assign Vessel to {assignBerth.code} ({assignBerth.name})
            </h3>
            <p className="mt-1 text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
              Max LOA: {assignBerth.max_length_m}m • Max Draft: {assignBerth.max_draft_m}m. Overlapping windows are
              automatically blocked.
            </p>
            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-semibold">Incoming / Anchored Vessel</span>
                <select
                  required
                  value={assignForm.vessel_id}
                  onChange={(e) => setAssignForm({ ...assignForm, vessel_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                >
                  {assignableVessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.length_m}m / {v.draft_m}m draft — {v.status})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-semibold">Operation</span>
                <select
                  value={assignForm.operation}
                  onChange={(e) => setAssignForm({ ...assignForm, operation: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                >
                  <option>Unloading</option>
                  <option>Loading</option>
                </select>
              </label>
              <label className="block">
                <span className="font-semibold">Duration Window (hours)</span>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={assignForm.duration_hours}
                  onChange={(e) => setAssignForm({ ...assignForm, duration_hours: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignBerth(null)}
                className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600"
              >
                Confirm Allocation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Berth Modal */}
      {showNewBerth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateBerth}
            className="w-full max-w-md rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900"
          >
            <h3 className="text-base font-bold">Register New Berth</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <label>
                <span className="font-semibold">Berth Code</span>
                <input
                  required
                  value={newBerth.code}
                  onChange={(e) => setNewBerth({ ...newBerth, code: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Berth Type</span>
                <select
                  value={newBerth.berth_type}
                  onChange={(e) => setNewBerth({ ...newBerth, berth_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                >
                  <option>Container</option>
                  <option>Dry Bulk</option>
                  <option>Liquid Bulk</option>
                  <option>Multi-Purpose</option>
                  <option>Breakbulk</option>
                </select>
              </label>
              <label className="col-span-2">
                <span className="font-semibold">Berth Name</span>
                <input
                  required
                  value={newBerth.name}
                  onChange={(e) => setNewBerth({ ...newBerth, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Max Length (m)</span>
                <input
                  type="number"
                  value={newBerth.max_length_m}
                  onChange={(e) => setNewBerth({ ...newBerth, max_length_m: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label>
                <span className="font-semibold">Max Draft (m)</span>
                <input
                  type="number"
                  step="0.1"
                  value={newBerth.max_draft_m}
                  onChange={(e) => setNewBerth({ ...newBerth, max_draft_m: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewBerth(false)}
                className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600"
              >
                Create Berth
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
