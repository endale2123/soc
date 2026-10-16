import React, { useState, useRef, useEffect } from 'react';
import { useSOC } from '../../context/SOCContext';
import {
  Bell,
  ChevronDown,
  ShieldCheck,
  Clock,
  ExternalLink,
  Shield
} from 'lucide-react';
import morOfficialLogo from '../../assets/images/mor_official_logo.jpg';

export const Header: React.FC = () => {
  const {
    currentTimeString,
    currentUser,
    alerts,
    setSelectedAlertId,
    setActivePage
  } = useSOC();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlerts = alerts.filter((a) => a.status === 'new');

  return (
    <header className="print:hidden sticky top-0 z-20 min-h-18 lg:min-h-20 bg-gradient-to-r from-[#004e8c] via-[#0077c8] to-[#005a9e] border-b border-[#0066b3] text-white px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 shadow-md">
      {/* Left: Ministry Brand Lockup with Official Logo & Enlarged Responsive Header Text */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-white/90 bg-white shrink-0 shadow-md flex items-center justify-center p-1">
          <img
            src={morOfficialLogo}
            alt="Ministry of Revenues Official Logo"
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="flex flex-col min-w-0 justify-center">
          <div className="flex flex-wrap items-baseline gap-x-2 sm:gap-x-3 gap-y-0.5">
            <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-black text-amber-300 tracking-wide font-sans drop-shadow-xs">
              የገቢዎች ሚኒስቴር
            </span>
            <span className="text-sky-200/80 font-bold hidden sm:inline text-sm sm:text-base">·</span>
            <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-xs">
              Ministry of Revenues
            </h1>
          </div>
          <p className="text-xs sm:text-sm lg:text-[14px] text-sky-100 font-medium tracking-normal mt-0.5 line-clamp-1 drop-shadow-2xs">
            Centralized Security Event Monitoring and Incident Detection System
          </p>
        </div>
      </div>

      {/* Right: Clock, Alerts, and Logged-in User Profile */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* Real-time Organization Clock */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs sm:text-sm font-mono text-white tabular-nums shadow-xs">
          <Clock className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{currentTimeString || 'Loading clock...'}</span>
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition-colors border border-white/20 bg-white/10 shadow-xs"
            title="Active Security Alerts"
            aria-label="Security Alerts Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold font-mono flex items-center justify-center border-2 border-[#0077c8] shadow-sm animate-pulse">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-sky-200 rounded-2xl shadow-2xl py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Active Alerts ({unreadAlerts.length} Unacknowledged)
                </span>
                <button
                  onClick={() => {
                    setActivePage('alerts');
                    setNotificationsOpen(false);
                  }}
                  className="text-xs font-bold text-[#0077c8] hover:underline flex items-center gap-1"
                >
                  View All Alerts <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlertId(alert.id);
                      setActivePage('alerts');
                      setNotificationsOpen(false);
                    }}
                    className="p-3 hover:bg-sky-50/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-[#0077c8] font-bold">{alert.id}</span>
                      <span
                        className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                          alert.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : alert.severity === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{alert.title}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Asset: {alert.affectedAsset} · {alert.firstDetected.slice(11)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu (Switch User option removed as requested) */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white shadow-xs"
            aria-label="User Profile"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#0077c8] border-2 border-amber-300 flex items-center justify-center font-black text-xs sm:text-sm shadow-xs shrink-0">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-amber-200 font-semibold leading-tight flex items-center gap-1">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-sky-200 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-sky-200 rounded-2xl shadow-2xl py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Authenticated Profile Info */}
              <div className="px-4 py-3 border-b border-slate-100 bg-sky-50/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0077c8]">Authenticated Profile</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{currentUser.name}</p>
                <p className="text-xs text-[#0066b3] font-mono mt-0.5">{currentUser.email}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-sky-100">
                  <span>{currentUser.department}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {currentUser.status}
                  </span>
                </div>
              </div>

              {/* Security & Permissions Link */}
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    setActivePage('settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-[#0077c8] flex items-center gap-2.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0077c8] shrink-0" />
                  <span>View RBAC Roles & Permissions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
