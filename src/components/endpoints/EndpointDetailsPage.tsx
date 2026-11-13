import React, { useState, useEffect, useCallback } from 'react';
import { useSOC } from '../../context/SOCContext';
import { socApi } from '../../services/socApi';
import { EndpointDetailsResponse } from '../../types/backend';
import {
  ArrowLeft,
  Cpu,
  HardDrive,
  Network,
  Activity,
  ShieldAlert,
  BellRing,
  Flame,
  Sliders,
  PowerOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const ALL_WINDOWS_EVENT_IDS = [
  4624, 4625, 4634, 4648, 4672, 4688, 4697, 4698, 4702, 4719, 4720,
  4722, 4724, 4728, 4732, 4740, 4768, 4769, 4771, 4776, 1102, 7045
];

export const EndpointDetailsPage: React.FC = () => {
  const {
    selectedEndpointId,
    setActivePage,
    permissions,
    dataMode,
    refreshLiveData,
    setSelectedAlertId,
    setSelectedIncidentId
  } = useSOC();

  const [details, setDetails] = useState<EndpointDetailsResponse | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'events' | 'alerts' | 'incidents' | 'config'>('overview');

  // Agent configuration editor state
  const [hbInterval, setHbInterval] = useState(30);
  const [offlineThreshold, setOfflineThreshold] = useState(120);
  const [batchSize, setBatchSize] = useState(100);
  const [flushInterval, setFlushInterval] = useState(5);
  const [channelsText, setChannelsText] = useState('Security,System,Application');
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>(ALL_WINDOWS_EVENT_IDS);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  // Deactivation modal
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!selectedEndpointId || dataMode !== 'live') return;
    setLoading(true);
    setError(null);
    try {
      const [det, ev, al, inc] = await Promise.all([
        socApi.getEndpointDetails(selectedEndpointId),
        socApi.getEndpointEvents(selectedEndpointId, 1, 30),
        socApi.getEndpointAlerts(selectedEndpointId),
        socApi.getEndpointIncidents(selectedEndpointId)
      ]);
      setDetails(det);
      setEvents(ev.items);
      setAlerts(al.items);
      setIncidents(inc.items);
      if (det.configuration) {
        setHbInterval(det.configuration.heartbeatIntervalSec);
        setOfflineThreshold(det.configuration.offlineThresholdSec);
        setBatchSize(det.configuration.batchSize);
        setFlushInterval(det.configuration.flushIntervalSec);
        setChannelsText(det.configuration.enabledChannels.join(','));
        setSelectedEventIds(det.configuration.monitoredEventIds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load endpoint dossier');
    } finally {
      setLoading(false);
    }
  }, [selectedEndpointId, dataMode]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEndpointId) return;
    setSavingConfig(true);
    setConfigNotice(null);
    setError(null);
    try {
      const enabledChannels = channelsText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      await socApi.updateAgentConfiguration(selectedEndpointId, {
        heartbeatIntervalSec: hbInterval,
        offlineThresholdSec: offlineThreshold,
        batchSize,
        flushIntervalSec: flushInterval,
        enabledChannels,
        monitoredEventIds: selectedEventIds
      });
      setConfigNotice('Agent policy saved and bumped to next config version.');
      await loadDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedEndpointId) return;
    setDeactivating(true);
    setError(null);
    try {
      await socApi.deactivateAgent(selectedEndpointId);
      setConfirmDeactivate(false);
      await loadDetails();
      await refreshLiveData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate agent');
    } finally {
      setDeactivating(false);
    }
  };

  const toggleEventId = (id: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b)
    );
  };

  if (!selectedEndpointId) {
    return (
      <div className="bg-white border border-sky-200 rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">No Endpoint Selected</p>
        <button
          onClick={() => setActivePage('endpoints')}
          className="px-4 py-2 bg-[#0077c8] text-white rounded-xl text-xs font-bold"
        >
          Back to Endpoint Management
        </button>
      </div>
    );
  }

  const ep = details?.endpoint;
  const inv = details?.inventory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('endpoints')}
            className="p-2 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-slate-700"
            title="Back to Endpoints"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {ep?.hostname || selectedEndpointId}
              </h2>
              {ep && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    ep.status === 'Online'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : ep.status === 'Disabled'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : ep.status === 'Unhealthy'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {ep.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Agent ID: {selectedEndpointId} · Domain: {ep?.domainMembership || 'WORKGROUP'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDetails}
            className="px-3 py-2 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0077c8] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {permissions.canManageAgents && ep && ep.status !== 'Disabled' && (
            <button
              onClick={() => setConfirmDeactivate(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <PowerOff className="w-3.5 h-3.5" />
              Deactivate Agent
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold pb-1">
        {[
          { id: 'overview', label: 'Hardware, OS & Heartbeats', icon: Cpu },
          { id: 'events', label: `Security Events (${details?.counts.events ?? 0})`, icon: ShieldAlert },
          { id: 'alerts', label: `Associated Alerts (${details?.counts.alerts ?? 0})`, icon: BellRing },
          { id: 'incidents', label: `Associated Incidents (${details?.counts.incidents ?? 0})`, icon: Flame },
          { id: 'config', label: 'Agent Configuration', icon: Sliders }
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                active
                  ? 'bg-[#0077c8] text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-sky-50 border border-sky-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {tab === 'overview' && details && ep && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* General & OS */}
            <div className="bg-white border border-sky-200/80 rounded-2xl p-5 space-y-3 shadow-xs text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-[#0077c8]" />
                Operating System & Agent
              </h3>
              <dl className="space-y-2 font-mono">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">OS Name</dt>
                  <dd className="font-bold text-slate-900">{inv?.osName || ep.os}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">OS Version / Build</dt>
                  <dd className="text-slate-800">{ep.osVersion} ({ep.osBuild || 'N/A'})</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Architecture</dt>
                  <dd className="text-slate-800">{inv?.architecture || 'x64'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Agent Version</dt>
                  <dd className="font-bold text-[#0077c8]">v{ep.agentVersion}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Enrolled At</dt>
                  <dd className="text-slate-700">{ep.enrolledAt?.slice(0, 19).replace('T', ' ')}</dd>
                </div>
              </dl>
            </div>

            {/* Hardware */}
            <div className="bg-white border border-sky-200/80 rounded-2xl p-5 space-y-3 shadow-xs text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-[#0077c8]" />
                Hardware Inventory
              </h3>
              <dl className="space-y-2 font-mono">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Vendor / Model</dt>
                  <dd className="font-bold text-slate-900 text-right">
                    {[inv?.hardwareVendor, inv?.hardwareModel].filter(Boolean).join(' ') || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Processor</dt>
                  <dd className="text-slate-800 text-right">
                    {inv?.cpuModel || 'N/A'} {inv?.cpuCores ? `(${inv.cpuCores} cores)` : ''}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Memory</dt>
                  <dd className="text-slate-800">
                    {inv?.totalMemoryMb ? `${Math.round(inv.totalMemoryMb / 1024)} GB` : 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Disk Capacity</dt>
                  <dd className="text-slate-800">{inv?.diskTotalGb ? `${inv.diskTotalGb} GB` : 'N/A'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Serial Number</dt>
                  <dd className="text-slate-700">{inv?.serialNumber || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Network */}
            <div className="bg-white border border-sky-200/80 rounded-2xl p-5 space-y-3 shadow-xs text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Network className="w-4 h-4 text-[#0077c8]" />
                Network & Telemetry
              </h3>
              <dl className="space-y-2 font-mono">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Primary IP</dt>
                  <dd className="font-bold text-[#0077c8]">{ep.ipAddress}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">MAC Address</dt>
                  <dd className="text-slate-800">{ep.macAddress}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">FQDN</dt>
                  <dd className="text-slate-800 truncate">{inv?.fqdn || ep.hostname}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Last Heartbeat</dt>
                  <dd className="text-slate-700">
                    {ep.lastHeartbeat ? ep.lastHeartbeat.slice(0, 19).replace('T', ' ') : 'Never'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 font-sans">Total Events</dt>
                  <dd className="font-bold text-slate-900">{ep.totalEventsCollected.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Heartbeat History Table */}
          <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-sky-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Agent Heartbeats</h3>
              <span className="text-[11px] font-mono text-slate-500">
                Last {details.recentHeartbeats.length} heartbeats
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-sky-50/60 border-b border-sky-100 text-[10px] uppercase text-slate-600 font-bold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Agent Ver</th>
                    <th className="py-3 px-4 text-right">CPU %</th>
                    <th className="py-3 px-4 text-right">Mem %</th>
                    <th className="py-3 px-4 text-right">Queue</th>
                    <th className="py-3 px-4">Buffer / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {details.recentHeartbeats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                        No heartbeats recorded yet.
                      </td>
                    </tr>
                  ) : (
                    details.recentHeartbeats.map((hb) => (
                      <tr key={hb.id} className="hover:bg-sky-50/40">
                        <td className="py-2.5 px-4 text-slate-700">
                          {String(hb.received_at).slice(0, 19).replace('T', ' ')}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              hb.status === 'Online'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {hb.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">v{hb.agent_version}</td>
                        <td className="py-2.5 px-4 text-right">{hb.cpu_usage_pct ?? '—'}%</td>
                        <td className="py-2.5 px-4 text-right">{hb.memory_usage_pct ?? '—'}%</td>
                        <td className="py-2.5 px-4 text-right">{hb.queue_depth}</td>
                        <td className="py-2.5 px-4 font-sans">
                          {hb.buffer_overflow || hb.error_message ? (
                            <span className="text-red-600 font-semibold">
                              {hb.buffer_overflow ? 'Buffer Overflow · ' : ''}
                              {hb.error_message || `${hb.ingestion_errors} errors`}
                            </span>
                          ) : (
                            <span className="text-emerald-700">Nominal</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EVENTS */}
      {tab === 'events' && (
        <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-sky-50/60 border-b border-sky-100 text-[10px] uppercase text-slate-600 font-bold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">User / Source IP</th>
                  <th className="py-3 px-4">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No events collected from this endpoint yet.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-sky-50/40">
                      <td className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        {String(ev.timestamp).slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0077c8]">
                        {ev.windows_event_id || '—'}
                      </td>
                      <td className="py-2.5 px-4">{ev.category}</td>
                      <td className="py-2.5 px-4 uppercase font-bold text-[10px]">{ev.severity}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        {ev.username || 'N/A'} {ev.src_ip ? `(${ev.src_ip})` : ''}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 max-w-md truncate">{ev.original_message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ALERTS */}
      {tab === 'alerts' && (
        <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-sky-100">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No alerts triggered for this endpoint.</div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  onClick={() => {
                    setSelectedAlertId(al.id);
                    setActivePage('alerts');
                  }}
                  className="p-4 hover:bg-sky-50/50 cursor-pointer flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-mono text-[#0077c8] font-bold">{al.id}</div>
                    <div className="font-bold text-slate-900 mt-0.5">{al.title}</div>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      Rule: {al.detection_rule_name} · Events: {al.event_count}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                      {al.severity}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 mt-1 uppercase">{al.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: INCIDENTS */}
      {tab === 'incidents' && (
        <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-sky-100">
            {incidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No incidents associated with this endpoint.</div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncidentId(inc.id);
                    setActivePage('incidents');
                  }}
                  className="p-4 hover:bg-sky-50/50 cursor-pointer flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-mono text-[#0077c8] font-bold">{inc.id}</div>
                    <div className="font-bold text-slate-900 mt-0.5">{inc.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">Analyst: {inc.assigned_analyst}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-red-50 text-red-700 border border-red-200">
                      {inc.severity}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 mt-1 uppercase">{inc.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: CONFIGURATION */}
      {tab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white border border-sky-200/80 rounded-2xl p-6 space-y-5 shadow-xs text-xs">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Remote Agent Collection Policy</h3>
              <p className="text-slate-500 text-[11px]">
                Policy Version: <span className="font-mono font-bold">v{details?.configuration?.configVersion ?? 1}</span>
                {details?.configuration?.updatedBy && ` · Updated by ${details.configuration.updatedBy}`}
              </p>
            </div>
            {!permissions.canManageAgents && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px]">
                Read-Only (Security Admin Required)
              </span>
            )}
          </div>

          {configNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {configNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Heartbeat Interval (sec)</label>
              <input
                type="number"
                min={10}
                max={3600}
                disabled={!permissions.canManageAgents}
                value={hbInterval}
                onChange={(e) => setHbInterval(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Offline Threshold (sec)</label>
              <input
                type="number"
                min={30}
                max={7200}
                disabled={!permissions.canManageAgents}
                value={offlineThreshold}
                onChange={(e) => setOfflineThreshold(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Event Batch Size</label>
              <input
                type="number"
                min={1}
                max={1000}
                disabled={!permissions.canManageAgents}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Flush Interval (sec)</label>
              <input
                type="number"
                min={1}
                max={300}
                disabled={!permissions.canManageAgents}
                value={flushInterval}
                onChange={(e) => setFlushInterval(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Enabled Windows Event Channels (comma-separated)</label>
            <input
              type="text"
              disabled={!permissions.canManageAgents}
              value={channelsText}
              onChange={(e) => setChannelsText(e.target.value)}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Monitored Windows Event IDs ({selectedEventIds.length} active)
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_WINDOWS_EVENT_IDS.map((id) => {
                const active = selectedEventIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!permissions.canManageAgents}
                    onClick={() => toggleEventId(id)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors ${
                      active
                        ? 'bg-[#0077c8] text-white border-[#0077c8]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>

          {permissions.canManageAgents && (
            <div className="pt-3 border-t border-sky-100 flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold shadow-xs"
              >
                {savingConfig ? 'Saving Policy...' : 'Save Agent Policy'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Deactivation Modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Confirm Agent Deactivation & Credential Revocation
            </div>
            <p className="text-slate-600 leading-relaxed">
              Deactivating <strong className="font-mono">{selectedEndpointId}</strong> will immediately revoke all API authentication credentials for this endpoint and mark its status as <strong>Disabled</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                disabled={deactivating}
                onClick={handleDeactivate}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
              >
                {deactivating ? 'Revoking...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
