import React, { useState, useRef, useEffect } from 'react';
import { useSOC } from '../../context/SOCContext';
import { UserRole } from '../../types/soc';
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentTimeString,
    currentUser,
    switchUser,
    users,
    theme,
    toggleTheme,
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
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-sky-200/80 px-4 lg:px-6 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Ministry Brand Lockup with Official Logo */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#0077c8] bg-white shrink-0 shadow-sm flex items-center justify-center p-0.5">
          <img
            src="/src/assets/images/mor_official_logo.jpg"
            alt="Ministry of Revenues Official Logo"
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              // Fallback to stylized SVG emblem if file not loaded
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[#0077c8] tracking-wide">የገቢዎች ሚኒስቴር</span>
            <span className="text-slate-300">·</span>
            <h1 className="text-sm lg:text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Ministry of Revenues
            </h1>
            
          </div>
          <p className="text-xs text-slate-500 truncate hidden md:block">
            Centralized Security Event Monitoring and Incident Detection System
          </p>
        </div>
      </div>

      {/* Right: Clock, Alerts, Theme, and Logged-in User */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Real-time Organization Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50/80 border border-sky-200/80 text-xs font-mono text-slate-700 tabular-nums">
          <Clock className="w-3.5 h-3.5 text-[#0077c8]" />
          <span>{currentTimeString || 'Loading clock...'}</span>
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-600 hover:text-[#0077c8] hover:bg-sky-50 rounded-lg transition-colors border border-transparent hover:border-sky-200"
            title="Active Security Alerts"
            aria-label="Security Alerts Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-sky-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Active Alerts ({unreadAlerts.length} Unacknowledged)
                </span>
                <button
                  onClick={() => {
                    setActivePage('alerts');
                    setNotificationsOpen(false);
                  }}
                  className="text-xs font-semibold text-[#0077c8] hover:underline flex items-center gap-1"
                >
                  View All Alerts <ExternalLink className="w-3 h-3" />
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
                    className="p-3 hover:bg-sky-50/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-[#0077c8] font-semibold">{alert.id}</span>
                      <span
                        className={`font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded ${
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
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{alert.title}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Asset: {alert.affectedAsset} · {alert.firstDetected.slice(11)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 rounded-lg bg-sky-50/80 hover:bg-sky-100/70 border border-sky-200/80 transition-colors shadow-2xs"
            aria-label="User Profile and Role Switcher"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0077c8] to-[#005a9e] border border-amber-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-[#0077c8] font-semibold leading-tight flex items-center gap-1">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-76 bg-white border border-sky-200 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-sky-50/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authenticated Profile</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{currentUser.name}</p>
                <p className="text-xs text-[#0077c8] font-mono">{currentUser.email}</p>
                <p className="text-[11px] text-slate-500 mt-1">{currentUser.department}</p>
              </div>

              <div className="px-3 pt-2.5 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                  Switch Active Role (RBAC)
                </p>
                <div className="space-y-1 mt-1">
                  {users.map((u) => {
                    const isCurrent = u.role === currentUser.role;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.role);
                          setUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          isCurrent
                            ? 'bg-[#0077c8] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-sky-50 hover:text-[#0077c8]'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span>{u.name}</span>
                          <span className={`text-[10px] font-normal ${isCurrent ? 'text-sky-100' : 'text-slate-500'}`}>
                            {u.role}
                          </span>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 mt-2 px-3 pt-2">
                <button
                  onClick={() => {
                    setActivePage('settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0077c8] flex items-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0077c8]" />
                  <span>Manage Users & RBAC Permissions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
