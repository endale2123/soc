import React from 'react';
import { useSOC, PageId } from '../../context/SOCContext';
import {
  LayoutDashboard,
  ShieldAlert,
  Flame,
  Binary,
  BellRing,
  ScrollText,
  Server,
  Network,
  FileBarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activePage, setActivePage, incidents, alerts, resetDemoData } = useSOC();

  const openIncidentsCount = incidents.filter(
    (i) => i.status === 'new' || i.status === 'investigating'
  ).length;
  const newAlertsCount = alerts.filter((a) => a.status === 'new').length;

  const navItems: { id: PageId; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Security Events', icon: ShieldAlert },
    { id: 'incidents', label: 'Incidents', icon: Flame, badge: openIncidentsCount, badgeColor: 'bg-red-500 text-white' },
    { id: 'threat-intel', label: 'Threat Intelligence', icon: Binary },
    { id: 'alerts', label: 'Alerts', icon: BellRing, badge: newAlertsCount, badgeColor: 'bg-amber-400 text-slate-950 font-bold' },
    { id: 'log-management', label: 'Log Management', icon: ScrollText },
    { id: 'assets', label: 'Assets & Endpoints', icon: Server },
    { id: 'network', label: 'Network Monitoring', icon: Network },
    { id: 'reports', label: 'Reports', icon: FileBarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-[#0b172a] text-slate-200 border-r border-[#1a2b47] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#1a2b47]">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#0077c8] p-0.5 overflow-hidden shrink-0 shadow-md shadow-[#0077c8]/20 flex items-center justify-center">
              <img
                src="/src/assets/images/mor_official_logo.jpg"
                alt="Ministry of Revenues Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-amber-400 tracking-wider truncate">
                የገቢዎች ሚኒስቴር
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
                Ministry of Revenues
              </span>
              <span className="text-[9px] text-sky-400 font-mono tracking-wider font-semibold">
                SOC PLATFORM
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-full bg-white border-2 border-[#0077c8] p-0.5 overflow-hidden mx-auto flex items-center justify-center shadow-md">
            <img
              src="/src/assets/images/mor_official_logo.jpg"
              alt="MoR"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#15253e] rounded-lg transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-[#0077c8] text-white shadow-md shadow-[#0077c8]/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-[#15253e]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'
                }`}
              />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full font-bold font-mono ${
                        item.badgeColor || 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Reset Prototype Data */}
      <div className="p-3 border-t border-[#1a2b47]">
        <button
          onClick={() => {
            if (window.confirm('Reset all modified incidents, notes, and rules back to initial state?')) {
              resetDemoData();
            }
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-semibold text-slate-400 hover:text-amber-400 hover:bg-[#15253e] rounded-lg transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Reset Prototype Data"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Reset Prototype State</span>}
        </button>
      </div>
    </aside>
  );
};
