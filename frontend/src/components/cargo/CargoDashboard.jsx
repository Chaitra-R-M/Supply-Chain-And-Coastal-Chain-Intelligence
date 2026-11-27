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

  return (
    <div className="min-h-screen bg-dusty-denim-50 text-ink-black-900 transition-colors dark:bg-ink-black-950 dark:text-ink-black-50">
      <CargoNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        user={user}
      />
      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        {activeTab === 'overview' && <CargoOverview onNavigate={setActiveTab} />}
        {activeTab === 'my_cargo' && <MyCargo />}
        {activeTab === 'requests' && <TransportRequests />}
        {activeTab === 'shipments' && <CargoShipments />}
        {activeTab === 'tracking' && <CargoTrackShipments />}
        {activeTab === 'inventory' && <CargoInventory />}
        {activeTab === 'forecast' && <CargoDemandForecast />}
        {activeTab === 'compare' && <CargoTransportComparison />}
        {activeTab === 'notifications' && <CargoNotifications />}
        {activeTab === 'reports' && <CargoReports />}
      </main>
    </div>
  );
}
