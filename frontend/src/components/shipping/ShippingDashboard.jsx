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
  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors ${dark ? 'bg-[#0f1a1a] text-[#e8f0f0]' : 'bg-[#f5f0e8] text-[#1a2e2e]'}`}>
      <ShippingNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      {/* offset left by sidebar width, offset top by top-bar height */}
      <main className="ml-56 pt-[53px] min-h-screen">
        <div className="px-6 py-6 max-w-[1400px]">
          {activeTab === 'overview'       && <ShippingOverview onNavigate={setActiveTab} />}
          {activeTab === 'fleet'          && <ShippingFleetManagement />}
          {activeTab === 'voyages'        && <ShippingVoyages />}
          {activeTab === 'cargo_requests' && <ShippingCargoRequests />}
          {activeTab === 'shipments'      && <ShippingShipments />}
          {activeTab === 'tracking'       && <ShippingVesselTracking />}
          {activeTab === 'routes'         && <ShippingRoutePlanning />}
          {activeTab === 'ports'          && <ShippingPortCoordination />}
          {activeTab === 'risks'          && <ShippingRiskWeather />}
          {activeTab === 'reports'        && <ShippingReports />}
        </div>
      </main>
    </div>
  );
}
