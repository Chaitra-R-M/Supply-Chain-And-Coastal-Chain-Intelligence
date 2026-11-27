import React, { useState } from 'react';
import CargoNavBar from './CargoNavBar';
import CargoOverview from './CargoOverview';
import MyCargo from './MyCargo';
import TransportRequests from './TransportRequests';
import CargoShipments from './CargoShipments';
import CargoTrackShipments from './CargoTrackShipments';
import CargoInventory from './CargoInventory';
import CargoDemandForecast from './CargoDemandForecast';
import CargoTransportComparison from './CargoTransportComparison';
import CargoNotifications from './CargoNotifications';
import CargoReports from './CargoReports';

export default function CargoDashboard({ user, onLogout, theme, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('overview');
  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors ${dark ? 'bg-[#0f1a1a] text-[#e8f0f0]' : 'bg-[#f5f0e8] text-[#1a2e2e]'}`}>
      <CargoNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <main className="ml-56 pt-[53px] min-h-screen">
        <div className="px-6 py-6 max-w-[1400px]">
          {activeTab === 'overview'      && <CargoOverview onNavigate={setActiveTab} />}
          {activeTab === 'my_cargo'      && <MyCargo />}
          {activeTab === 'requests'      && <TransportRequests />}
          {activeTab === 'shipments'     && <CargoShipments />}
          {activeTab === 'tracking'      && <CargoTrackShipments />}
          {activeTab === 'inventory'     && <CargoInventory />}
          {activeTab === 'forecast'      && <CargoDemandForecast />}
          {activeTab === 'compare'       && <CargoTransportComparison />}
          {activeTab === 'notifications' && <CargoNotifications />}
          {activeTab === 'reports'       && <CargoReports />}
        </div>
      </main>
    </div>
  );
}
