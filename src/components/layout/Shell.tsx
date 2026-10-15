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
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'ml-18' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <Header />

        {/* Section 18 Mandatory Demonstration Banner - Ministry of Revenues royal blue & gold styling */}
        <div className="print:hidden bg-gradient-to-r from-[#004e8c] via-[#0077c8] to-[#005a9e] border-b border-[#0066b3] px-4 py-1.5 flex items-center justify-between text-xs text-white shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white/60 animate-pulse shrink-0" />
            <span className="font-semibold tracking-wide text-white">
              DEMONSTRATION MODE — All displayed security data is simulated.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] text-sky-100 font-mono">
            <span>Environment: Isolated SOC Prototype</span>
            <span aria-hidden="true" className="text-sky-300">·</span>
            <span>Target: <strong className="text-white font-bold">Ministry of Revenues (የገቢዎች ሚኒስቴር)</strong></span>
          </div>
        </div>

        {/* Main Page Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};
