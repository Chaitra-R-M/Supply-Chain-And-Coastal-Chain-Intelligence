import React, { useEffect, useState } from 'react';
import { AlertTriangle, History, Lock, Plus, RefreshCw, Search, ShieldAlert, Ship } from 'lucide-react';
import { api } from '../../api/client';
import VesselMap from './VesselMap';

const STATUS_TABS = ['All', 'En Route', 'At Berth', 'Anchored', 'Delayed', 'Departing'];

const STATUS_BADGE = {
  'En Route': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'At Berth': 'bg-ink-black-500/15 text-ink-black-700 dark:text-ink-black-200',
  Anchored: 'bg-eggshell-500/20 text-eggshell-800 dark:text-eggshell-200',
  Delayed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Departing: 'bg-blue-slate-500/20 text-blue-slate-700 dark:text-blue-slate-200',
};

export default function VesselTrafficView({ portId, portName, onRefreshGlobal }) {
  const [vessels, setVessels] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [policyNotice, setPolicyNotice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    imo_number: 'IMO 98',
    shipping_company: '',
    vessel_type: 'Container',
    capacity_dwt: 38000,
    length_m: 195,
    draft_m: 11.2,
    origin_port: 'Kochi Port',
    eta_hours: 4.5,
  });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getVessels(portId);
      setVessels(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [portId]);

  const handleSimulate = async () => {
    setSimulating(true);
    setError('');
    try {
      await api.simulateVesselTick(portId);
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (e) {
      setError(e.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleOpenHistory = async (vessel) => {
    try {
      const res = await api.getVesselHistory(portId, vessel.id);
      setHistoryData(res);
      setPolicyNotice('');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCheckPrivateAccess = async (vesselId) => {
    setPolicyNotice('');
    try {
      await api.checkPrivateFinancials(portId, vesselId);
    } catch (e) {
      setPolicyNotice(`HTTP ${e.status || 403}: ${e.message}`);
    }
  };

  const handleStatusChange = async (vessel, nextStatus) => {
    try {
      await api.updateVessel(portId, vessel.id, { status: nextStatus });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.registerVessel(portId, {
        ...form,
        capacity_dwt: Number(form.capacity_dwt),
        length_m: Number(form.length_m),
        draft_m: Number(form.draft_m),
        eta_hours: Number(form.eta_hours),
        destination_port: portName,
      });
      setShowAdd(false);
      setForm({
        name: '',
        imo_number: 'IMO 98',
        shipping_company: '',
        vessel_type: 'Container',
        capacity_dwt: 38000,
        length_m: 195,
        draft_m: 11.2,
        origin_port: 'Kochi Port',
        eta_hours: 4.5,
      });
      await load();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = vessels.filter((v) => {
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    const q = search.toLowerCase();
    const matchesQuery =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.imo_number.toLowerCase().includes(q) ||
      v.shipping_company.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-black-900 dark:text-ink-black-50">
            Vessel Traffic &amp; AIS Tracking — {portName}
          </h1>
          <p className="text-xs text-dusty-denim-600 dark:text-blue-slate-300">
            Live coastal approaches, vessel specifications, route deviation alerts, and arrival/departure records
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={simulating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-black-300 bg-white px-3 py-2 text-xs font-semibold text-ink-black-800 shadow-sm hover:bg-ink-black-50 dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900 dark:text-ink-black-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${simulating ? 'animate-spin' : ''}`} />
            Simulate Vessel Movement
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ink-black-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Register Approaching Vessel
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Map + Quick Fleet Access Restriction Banner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <VesselMap portName={portName} vessels={vessels} onSelectVessel={handleOpenHistory} />
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900 lg:col-span-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-ink-black-900 dark:text-ink-black-50">
              <ShieldAlert className="h-4 w-4 text-eggshell-500" />
              <span>Access &amp; Telemetry Scope</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-dusty-denim-600 dark:text-blue-slate-300">
              Port Authority views operational vessel characteristics, AIS positions, ETAs, and port-bound cargo
              requirements across all shipping companies calling at {portName}.
            </p>
            <div className="mt-3 rounded-lg border border-dusty-denim-200 bg-dusty-denim-50 p-3 text-xs dark:border-deep-space-blue-800 dark:bg-ink-black-950/60">
              <div className="flex items-center gap-1.5 font-semibold text-ink-black-800 dark:text-ink-black-100">
                <Lock className="h-3.5 w-3.5 text-eggshell-500" />
                <span>Restricted Fleet &amp; Financial Data</span>
              </div>
              <p className="mt-1 text-[11px] text-dusty-denim-600 dark:text-blue-slate-400">
                Private charter rates, non-port fleet deployments, and shipping company financials are isolated from
                Port Authority access.
              </p>
              {vessels[0] && (
                <button
                  type="button"
                  onClick={() => handleCheckPrivateAccess(vessels[0].id)}
                  className="mt-2 rounded bg-deep-space-blue-800 px-2.5 py-1 text-[11px] font-semibold text-eggshell-200 hover:bg-deep-space-blue-700"
                >
                  Verify Access Policy
                </button>
              )}
              {policyNotice && (
                <p className="mt-2 rounded border border-rose-400/40 bg-rose-500/10 p-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                  {policyNotice}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-dusty-denim-100 pt-3 text-center dark:border-deep-space-blue-800">
            <div>
              <p className="text-lg font-extrabold text-ink-black-900 dark:text-white">{vessels.length}</p>
              <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Total</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {vessels.filter((v) => v.status === 'En Route').length}
              </p>
              <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">En Route</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                {vessels.filter((v) => v.route_deviation || v.status === 'Delayed').length}
              </p>
              <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">Deviated/Delayed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterStatus === tab
                    ? 'bg-ink-black-500 text-white'
                    : 'bg-dusty-denim-50 text-dusty-denim-700 hover:bg-dusty-denim-100 dark:bg-ink-black-950/60 dark:text-blue-slate-300 dark:hover:bg-deep-space-blue-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-dusty-denim-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vessel, IMO, company..."
              className="w-full rounded-lg border border-dusty-denim-200 bg-dusty-denim-50/50 py-1.5 pl-8 pr-3 text-xs text-ink-black-900 focus:border-ink-black-400 focus:outline-none dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-ink-black-50"
            />
          </div>
        </div>

        {/* Vessel Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-200 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2.5 pr-3">Vessel &amp; IMO</th>
                <th className="py-2.5 pr-3">Shipping Company</th>
                <th className="py-2.5 pr-3">Type / Specs</th>
                <th className="py-2.5 pr-3">Position &amp; Speed</th>
                <th className="py-2.5 pr-3">Route / ETA</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-dusty-denim-500">
                    Loading vessels...
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-dusty-denim-50/60 dark:hover:bg-deep-space-blue-800/30">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2 font-bold text-ink-black-900 dark:text-ink-black-50">
                        <Ship className="h-3.5 w-3.5 text-ink-black-500 dark:text-ink-black-300" />
                        <span>{v.name}</span>
                        {v.route_deviation && (
                          <span
                            title={`Route deviation ${v.deviation_nm} NM`}
                            className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-600 dark:text-rose-300"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" /> Dev
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{v.imo_number}</div>
                    </td>
                    <td className="py-3 pr-3 text-ink-black-800 dark:text-blue-slate-200">{v.shipping_company}</td>
                    <td className="py-3 pr-3">
                      <div className="font-medium">{v.vessel_type}</div>
                      <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                        {v.capacity_dwt.toLocaleString()} DWT • {v.length_m}m × {v.draft_m}m draft
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div>
                        {v.latitude}°N, {v.longitude}°E
                      </div>
                      <div className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                        {v.speed_knots} kn • HDG {v.heading_deg}°
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div>
                        {v.origin_port} → {v.destination_port}
                      </div>
                      <div className="text-[11px] font-semibold text-ink-black-600 dark:text-eggshell-300">
                        {v.eta_text}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          STATUS_BADGE[v.status] || 'bg-dusty-denim-100 text-dusty-denim-700'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(v)}
                          className="inline-flex items-center gap-1 rounded border border-dusty-denim-200 px-2 py-1 text-[11px] font-medium hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:hover:bg-deep-space-blue-800"
                        >
                          <History className="h-3 w-3" /> History
                        </button>
                        {v.status === 'At Berth' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v, 'Departing')}
                            className="rounded bg-blue-slate-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-slate-700"
                          >
                            Depart
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement History Drawer / Panel */}
      {historyData && (
        <div className="rounded-xl border border-ink-black-300 bg-eggshell-50/70 p-4 shadow-sm dark:border-ink-black-600 dark:bg-deep-space-blue-900">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink-black-900 dark:text-ink-black-50">
                Movement History — {historyData.vessel.name} ({historyData.vessel.imo_number})
              </h3>
              <p className="text-[11px] text-dusty-denim-600 dark:text-blue-slate-300">
                Origin: {historyData.vessel.origin_port} | Arrival:{' '}
                {historyData.vessel.arrival_time ? new Date(historyData.vessel.arrival_time).toLocaleString() : 'Pending'} |
                Departure:{' '}
                {historyData.vessel.departure_time
                  ? new Date(historyData.vessel.departure_time).toLocaleString()
                  : 'In Port / En Route'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryData(null)}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-dusty-denim-600 hover:bg-dusty-denim-200/50 dark:text-blue-slate-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            {historyData.movements.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dusty-denim-200 bg-white px-3 py-2 text-xs dark:border-deep-space-blue-800 dark:bg-ink-black-950/60"
              >
                <div>
                  <span className="font-bold text-ink-black-600 dark:text-eggshell-300">{m.event_type}</span>
                  <span className="mx-2 text-dusty-denim-400">•</span>
                  <span className="font-medium">{m.location_label}</span>
                  <p className="text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">{m.notes}</p>
                </div>
                <div className="text-right text-[11px] text-dusty-denim-500 dark:text-blue-slate-400">
                  <div>
                    {m.latitude}°N, {m.longitude}°E ({m.speed_knots} kn)
                  </div>
                  <div>{m.timestamp ? new Date(m.timestamp).toLocaleString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Vessel Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleRegister}
            className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900"
          >
            <h3 className="text-base font-bold text-ink-black-900 dark:text-white">
              Register Approaching Vessel
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <label className="block">
                <span className="font-semibold">Vessel Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="MV Malabar Horizon"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="block">
                <span className="font-semibold">IMO Number</span>
                <input
                  required
                  value={form.imo_number}
                  onChange={(e) => setForm({ ...form, imo_number: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Shipping Company</span>
                <input
                  required
                  value={form.shipping_company}
                  onChange={(e) => setForm({ ...form, shipping_company: e.target.value })}
                  placeholder="West Coast Maritime"
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Vessel Type</span>
                <select
                  value={form.vessel_type}
                  onChange={(e) => setForm({ ...form, vessel_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                >
                  <option>Container</option>
                  <option>Dry Bulk</option>
                  <option>Liquid Bulk</option>
                  <option>Coastal Feeder</option>
                  <option>Multi-Purpose</option>
                </select>
              </label>
              <label className="block">
                <span className="font-semibold">Capacity (DWT)</span>
                <input
                  type="number"
                  value={form.capacity_dwt}
                  onChange={(e) => setForm({ ...form, capacity_dwt: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Length (m) / Draft (m)</span>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={form.length_m}
                    onChange={(e) => setForm({ ...form, length_m: e.target.value })}
                    className="w-1/2 rounded-lg border border-dusty-denim-200 px-2 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={form.draft_m}
                    onChange={(e) => setForm({ ...form, draft_m: e.target.value })}
                    className="w-1/2 rounded-lg border border-dusty-denim-200 px-2 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                  />
                </div>
              </label>
              <label className="block">
                <span className="font-semibold">Origin Port</span>
                <input
                  required
                  value={form.origin_port}
                  onChange={(e) => setForm({ ...form, origin_port: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950"
                />
              </label>
              <label className="block">
                <span className="font-semibold">ETA (hours)</span>
                <input
                  type="number"
                  step="0.5"
                  value={form.eta_hours}
                  onChange={(e) => setForm({ ...form, eta_hours: e.target.value })}
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
                Register Vessel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
