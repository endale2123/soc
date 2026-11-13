import React, { useState, useEffect, useCallback } from 'react';
import { useSOC } from '../../context/SOCContext';
import { socApi } from '../../services/socApi';
import { AgentStatus, EndpointSummary } from '../../types/backend';
import {
  Monitor,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  LogIn,
  Plus,
  ShieldAlert
} from 'lucide-react';

export const EndpointManagementPage: React.FC = () => {
  const {
    dataMode,
    permissions,
    agentStats,
    openEndpointDetails,
    setActivePage,
    setLoginModalOpen
  } = useSOC();

  const [items, setItems] = useState<EndpointSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [osFilter, setOsFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'hostname' | 'lastHeartbeat' | 'totalEventsCollected' | 'status' | 'enrolledAt'>('lastHeartbeat');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadEndpoints = useCallback(async () => {
    if (dataMode !== 'live') {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await socApi.getEndpoints({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        os: osFilter.trim() || undefined,
        sortBy,
        sortDir,
        page,
        pageSize: 15
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrolled endpoints');
    } finally {
      setLoading(false);
    }
  }, [dataMode, search, statusFilter, osFilter, sortBy, sortDir, page]);

  useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const statusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'Online':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Offline':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'Unhealthy':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending Enrollment':
        return 'bg-sky-50 text-[#0077c8] border-sky-200';
      case 'Disabled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[#0077c8]" />
            Windows Endpoint Agent Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live inventory, heartbeat health monitoring, and telemetry collection metrics for enrolled Windows endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dataMode === 'live' && (
            <button
              onClick={loadEndpoints}
              className="px-3 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0077c8] ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          {permissions.canManageAgents && dataMode === 'live' && (
            <button
              onClick={() => setActivePage('agent-deployment')}
              className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Enroll New Agent
            </button>
          )}
        </div>
      </div>

      {dataMode === 'demo' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-900">Authentication Required for Live Endpoint Inventory</p>
              <p className="text-amber-800 mt-0.5">
                You are viewing the platform in Demo Fallback mode. No fake online Windows agents are simulated here — sign in to the SOC backend to view real enrolled endpoints.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In to Backend
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Endpoints</span>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900 tabular-nums">
            {agentStats.totalEndpoints}
          </div>
          <span className="text-[10px] text-slate-500">Enrolled in database</span>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Online</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-700 tabular-nums">
            {agentStats.onlineEndpoints}
          </div>
          <span className="text-[10px] text-emerald-700/80">Active heartbeat</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Offline</span>
            <XCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-700 tabular-nums">
            {agentStats.offlineEndpoints}
          </div>
          <span className="text-[10px] text-slate-500">Missed heartbeat window</span>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Unhealthy</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-700 tabular-nums">
            {agentStats.unhealthyAgents}
          </div>
          <span className="text-[10px] text-amber-700/80">Buffer / ingestion warning</span>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0077c8] uppercase tracking-wider">Events Collected</span>
            <Activity className="w-4 h-4 text-[#0077c8]" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-[#0077c8] tabular-nums">
            {agentStats.totalCollectedEvents.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">{agentStats.eventsPerSecond} EPS avg</span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hostname, agent ID, IP, MAC, domain..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#f8fbff] border border-sky-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
        >
          <option value="ALL">All Agent Statuses</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Unhealthy">Unhealthy</option>
          <option value="Pending Enrollment">Pending Enrollment</option>
          <option value="Disabled">Disabled</option>
        </select>

        <input
          type="text"
          placeholder="Filter by OS (e.g. Windows 11, Server 2022)..."
          value={osFilter}
          onChange={(e) => {
            setOsFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Endpoints Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-4">
                  <button onClick={() => toggleSort('hostname')} className="flex items-center gap-1 hover:text-[#0077c8]">
                    Hostname & Agent ID <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Network (IP / MAC)</th>
                <th className="py-3.5 px-4">OS & Build</th>
                <th className="py-3.5 px-4">Domain</th>
                <th className="py-3.5 px-4">Agent Ver</th>
                <th className="py-3.5 px-4">
                  <button onClick={() => toggleSort('lastHeartbeat')} className="flex items-center gap-1 hover:text-[#0077c8]">
                    Last Heartbeat <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-[#0077c8]">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button onClick={() => toggleSort('totalEventsCollected')} className="inline-flex items-center gap-1 hover:text-[#0077c8]">
                    Events <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    {loading
                      ? 'Loading enrolled Windows endpoints...'
                      : dataMode === 'demo'
                      ? 'Sign in to view real Windows endpoint agents.'
                      : 'No Windows endpoint agents enrolled yet. Generate a one-time enrollment token in Agent Deployment to enroll your first Windows endpoint.'}
                  </td>
                </tr>
              ) : (
                items.map((ep) => (
                  <tr
                    key={ep.agentId}
                    onClick={() => openEndpointDetails(ep.agentId)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ep.hostname}</div>
                      <div className="font-mono text-[11px] text-[#0077c8]">{ep.agentId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="font-bold text-slate-800">{ep.ipAddress}</div>
                      <div className="text-slate-500">{ep.macAddress}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ep.os}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {ep.osVersion} {ep.osBuild ? `(${ep.osBuild})` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {ep.domainMembership || 'WORKGROUP'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      v{ep.agentVersion}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {ep.lastHeartbeat ? ep.lastHeartbeat.replace('T', ' ').slice(0, 19) : 'Never'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge(ep.status)}`}>
                        {ep.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {ep.totalEventsCollected.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEndpointDetails(ep.agentId);
                        }}
                        className="px-3 py-1 bg-sky-50 hover:bg-[#0077c8] hover:text-white text-[#0077c8] border border-sky-200 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-sky-100 bg-sky-50/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-mono">
              Showing page {page} of {totalPages} ({total} total endpoints)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40 hover:bg-sky-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40 hover:bg-sky-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
