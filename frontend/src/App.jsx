import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api/client';
import TopNavBar from './components/TopNavBar';
import OverviewView from './components/OverviewView';
import VesselTrafficView from './components/VesselTrafficView';
import BerthManagementView from './components/BerthManagementView';
import CargoOperationsView from './components/CargoOperationsView';
import InventoryView from './components/InventoryView';
import DemandForecastView from './components/DemandForecastView';
import PortCongestionView from './components/PortCongestionView';
import RiskWeatherView from './components/RiskWeatherView';
import CoastalRoutesView from './components/CoastalRoutesView';
import AnalyticsReportsView from './components/AnalyticsReportsView';

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cci_theme') || 'light';
    }
    return 'light';
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [ports, setPorts] = useState([]);
  const [selectedPortId, setSelectedPortId] = useState('mangalore');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cci_theme', theme);
  }, [theme]);

  const loadDashboard = useCallback(async (portId) => {
    setError('');
    try {
      const [portsList, dashData] = await Promise.all([api.getPorts(), api.getDashboard(portId)]);
      setPorts(portsList);
      setDashboard(dashData);
    } catch (e) {
      setError(e.message || 'Unable to connect to Coastal Chain backend API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard(selectedPortId);
  }, [selectedPortId, loadDashboard]);

  const handleSimulateTick = async () => {
    setSimulating(true);
    try {
      await api.simulateVesselTick(selectedPortId);
      await loadDashboard(selectedPortId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSimulating(false);
    }
  };

  const selectedPortName =
    ports.find((p) => p.id === selectedPortId)?.name || dashboard?.port?.name || 'Mangalore Port';

  return (
    <div className="min-h-screen bg-dusty-denim-50 text-ink-black-900 transition-colors dark:bg-ink-black-950 dark:text-ink-black-50">
      <TopNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        ports={ports.length ? ports : [{ id: 'mangalore', name: 'Mangalore Port', code: 'INIXE' }]}
        selectedPortId={selectedPortId}
        onSelectPort={setSelectedPortId}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        alerts={dashboard?.active_alerts || []}
        onSimulateTick={handleSimulateTick}
        simulating={simulating}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {error} — Ensure the FastAPI backend is running on port 8000.
          </div>
        )}

        {loading && !dashboard ? (
          <div className="flex h-64 items-center justify-center text-sm font-medium text-dusty-denim-500 dark:text-blue-slate-300">
            Loading Port Authority Command Center...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewView dashboard={dashboard} onNavigate={setActiveTab} />}
            {activeTab === 'vessels' && (
              <VesselTrafficView
                portId={selectedPortId}
                portName={selectedPortName}
                onRefreshGlobal={() => loadDashboard(selectedPortId)}
              />
            )}
            {activeTab === 'berths' && (
              <BerthManagementView
                portId={selectedPortId}
                onRefreshGlobal={() => loadDashboard(selectedPortId)}
              />
            )}
            {activeTab === 'cargo' && (
              <CargoOperationsView
                portId={selectedPortId}
                onRefreshGlobal={() => loadDashboard(selectedPortId)}
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryView
                portId={selectedPortId}
                onRefreshGlobal={() => loadDashboard(selectedPortId)}
              />
            )}
            {activeTab === 'forecast' && <DemandForecastView portId={selectedPortId} />}
            {activeTab === 'congestion' && <PortCongestionView portId={selectedPortId} />}
            {activeTab === 'risks' && (
              <RiskWeatherView
                portId={selectedPortId}
                onRefreshGlobal={() => loadDashboard(selectedPortId)}
              />
            )}
            {activeTab === 'routes' && <CoastalRoutesView portId={selectedPortId} />}
            {activeTab === 'reports' && <AnalyticsReportsView portId={selectedPortId} />}
          </>
        )}
      </main>
    </div>
  );
}
