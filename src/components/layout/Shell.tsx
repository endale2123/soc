import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardPage } from '../dashboard/DashboardPage';
import { SecurityEventsPage } from '../events/SecurityEventsPage';
import { IncidentsPage } from '../incidents/IncidentsPage';
import { ThreatIntelPage } from '../threat/ThreatIntelPage';
import { AlertsPage } from '../alerts/AlertsPage';
import { LogManagementPage } from '../logs/LogManagementPage';
import { AssetsEndpointsPage } from '../assets/AssetsEndpointsPage';
import { NetworkMonitoringPage } from '../network/NetworkMonitoringPage';
import { ReportsPage } from '../reports/ReportsPage';
import { SettingsPage } from '../settings/SettingsPage';
import { AlertCircle, Shield } from 'lucide-react';

export const Shell: React.FC = () => {
  const { activePage } = useSOC();
  const [collapsed, setCollapsed] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'events':
        return <SecurityEventsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'threat-intel':
        return <ThreatIntelPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'log-management':
        return <LogManagementPage />;
      case 'assets':
        return <AssetsEndpointsPage />;
      case 'network':
        return <NetworkMonitoringPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-900 font-sans flex flex-col">
      {/* Fixed Left Sidebar - preserved in dark navy blue as requested */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Container Area with dynamic left margin matching sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out print:ml-0 print:m-0 print:p-0 ${
          collapsed ? 'ml-18' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <Header />

        {/* Main Page Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};
