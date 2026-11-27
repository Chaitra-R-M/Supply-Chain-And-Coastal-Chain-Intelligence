const API_BASE = '/api';

async function request(path, options = {}) {
  const { portScope, headers: customHeaders, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Role': 'Port Authority',
    ...(portScope ? { 'X-Port-Scope': portScope } : {}),
    ...customHeaders,
  };
  const res = await fetch(`${API_BASE}${path}`, { headers, ...rest });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = data?.detail || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  getPorts: () => request('/ports'),
  getPort: (portId) => request(`/ports/${portId}`),
  updatePort: (portId, payload) =>
    request(`/ports/${portId}`, { method: 'PATCH', body: JSON.stringify(payload), portScope: portId }),

  getDashboard: (portId) => request(`/ports/${portId}/dashboard`),

  getVessels: (portId, status) =>
    request(`/ports/${portId}/vessels${status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''}`),
  registerVessel: (portId, payload) =>
    request(`/ports/${portId}/vessels`, { method: 'POST', body: JSON.stringify(payload), portScope: portId }),
  updateVessel: (portId, vesselId, payload) =>
    request(`/ports/${portId}/vessels/${vesselId}`, { method: 'PATCH', body: JSON.stringify(payload), portScope: portId }),
  getVesselHistory: (portId, vesselId) => request(`/ports/${portId}/vessels/${vesselId}/history`),
  checkPrivateFinancials: (portId, vesselId) => request(`/ports/${portId}/vessels/${vesselId}/private-financials`),
  simulateVesselTick: (portId) =>
    request(`/ports/${portId}/vessels/simulate-tick`, { method: 'POST', portScope: portId }),

  getBerths: (portId) => request(`/ports/${portId}/berths`),
  createBerth: (portId, payload) =>
    request(`/ports/${portId}/berths`, { method: 'POST', body: JSON.stringify(payload), portScope: portId }),
  updateBerth: (portId, berthId, payload) =>
    request(`/ports/${portId}/berths/${berthId}`, { method: 'PATCH', body: JSON.stringify(payload), portScope: portId }),
  assignBerth: (portId, berthId, payload) =>
    request(`/ports/${portId}/berths/${berthId}/assign`, { method: 'POST', body: JSON.stringify(payload), portScope: portId }),
  releaseBerth: (portId, berthId) =>
    request(`/ports/${portId}/berths/${berthId}/release`, { method: 'POST', portScope: portId }),

  getCargo: (portId) => request(`/ports/${portId}/cargo`),
  recordCargo: (portId, payload) =>
    request(`/ports/${portId}/cargo`, { method: 'POST', body: JSON.stringify(payload), portScope: portId }),
  updateCargo: (portId, cargoId, payload) =>
    request(`/ports/${portId}/cargo/${cargoId}`, { method: 'PATCH', body: JSON.stringify(payload), portScope: portId }),

  getInventory: (portId) => request(`/ports/${portId}/inventory`),
  adjustInventory: (portId, payload) =>
    request(`/ports/${portId}/inventory/adjust`, { method: 'POST', body: JSON.stringify(payload), portScope: portId }),

  getCongestion: (portId) => request(`/ports/${portId}/congestion`),
  getCongestionPrediction: (portId, params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/ports/${portId}/congestion/predict${q ? `?${q}` : ''}`);
  },
  getForecast: (portId) => request(`/ports/${portId}/forecast`),

  getRisks: (portId) => request(`/ports/${portId}/risks`),
  getWeather: (portId) => request(`/ports/${portId}/weather`),
  createRisk: (portId, payload) =>
    request(`/ports/${portId}/risks`, { method: 'POST', body: JSON.stringify(payload), portScope: portId }),
  updateRisk: (portId, riskId, payload) =>
    request(`/ports/${portId}/risks/${riskId}`, { method: 'PATCH', body: JSON.stringify(payload), portScope: portId }),

  getRoutes: (portId) => request(`/ports/${portId}/routes`),
  getReports: (portId, period = 'weekly') => request(`/ports/${portId}/reports?period=${period}`),
  getExportUrl: (portId, period = 'weekly', format = 'csv') =>
    `${API_BASE}/ports/${portId}/reports/export?period=${period}&format=${format}`,
};
