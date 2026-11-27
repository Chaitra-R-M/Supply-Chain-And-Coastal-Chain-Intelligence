import React, { useState } from 'react';
import ShippingNavBar from './ShippingNavBar';
import ShippingOverview from './ShippingOverview';
import ShippingFleetManagement from './ShippingFleetManagement';
import ShippingVoyages from './ShippingVoyages';
import ShippingCargoRequests from './ShippingCargoRequests';
import ShippingShipments from './ShippingShipments';
import ShippingVesselTracking from './ShippingVesselTracking';
import ShippingRoutePlanning from './ShippingRoutePlanning';
import ShippingPortCoordination from './ShippingPortCoordination';
import ShippingRiskWeather from './ShippingRiskWeather';
import ShippingReports from './ShippingReports';

export default function ShippingDashboard({ user, onLogout, theme, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-dusty-denim-50 text-ink-black-900 transition-colors dark:bg-ink-black-950 dark:text-ink-black-50">
      <ShippingNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        user={user}
      />
      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        {activeTab === 'overview' && <ShippingOverview onNavigate={setActiveTab} />}
        {activeTab === 'fleet' && <ShippingFleetManagement />}
        {activeTab === 'voyages' && <ShippingVoyages />}
        {activeTab === 'cargo_requests' && <ShippingCargoRequests />}
        {activeTab === 'shipments' && <ShippingShipments />}
        {activeTab === 'tracking' && <ShippingVesselTracking />}
        {activeTab === 'routes' && <ShippingRoutePlanning />}
        {activeTab === 'ports' && <ShippingPortCoordination />}
        {activeTab === 'risks' && <ShippingRiskWeather />}
        {activeTab === 'reports' && <ShippingReports />}
      </main>
    </div>
  );
}
