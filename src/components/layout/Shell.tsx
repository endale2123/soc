import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardPage } from '../dashboard/DashboardPage';
import { SecurityEventsPage } from '../events/SecurityEventsPage';
import { WindowsEventsPage } from '../events/WindowsEventsPage';
import { IncidentsPage } from '../incidents/IncidentsPage';
import { ThreatIntelPage } from '../threat/ThreatIntelPage';
import { AlertsPage } from '../alerts/AlertsPage';
import { LogManagementPage } from '../logs/LogManagementPage';
import { AssetsEndpointsPage } from '../assets/AssetsEndpointsPage';
import { EndpointManagementPage } from '../endpoints/EndpointManagementPage';
import { EndpointDetailsPage } from '../endpoints/EndpointDetailsPage';
import { AgentDeploymentPage } from '../agents/AgentDeploymentPage';
import { NetworkMonitoringPage } from '../network/NetworkMonitoringPage';
import { ReportsPage } from '../reports/ReportsPage';
import { SettingsPage } from '../settings/SettingsPage';
import { LoginModal } from '../auth/LoginModal';
import { AlertCircle, X } from 'lucide-react';

export const Shell: React.FC = () => {
  const { activePage, actionError, clearActionError } = useSOC();
  const [collapsed, setCollapsed] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'events':
        return <SecurityEventsPage />;
      case 'windows-events':
        return <WindowsEventsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'threat-intel':
        return <ThreatIntelPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'log-management':
        return <LogManagementPage />;
      case 'endpoints':
        return <EndpointManagementPage />;
      case 'endpoint-details':
        return <EndpointDetailsPage />;
      case 'agent-deployment':
        return <AgentDeploymentPage />;
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
          {actionError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                onClick={clearActionError}
                className="p-1 text-red-500 hover:text-red-800 rounded-lg"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {renderActivePage()}
        </main>
      </div>

      {/* Authentication Modal */}
      <LoginModal />
    </div>
  );
};
