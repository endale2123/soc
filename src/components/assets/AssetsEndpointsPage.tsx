import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { Asset, AssetType, AssetCriticality } from '../../types/soc';
import {
  Server,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  HardDrive,
  Cpu,
  Flame,
  BellRing,
  X,
  ExternalLink
} from 'lucide-react';

export const AssetsEndpointsPage: React.FC = () => {
  const { assets, selectedAsset, setSelectedAssetId, events, incidents, alerts, setActivePage, setSelectedIncidentId } = useSOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AssetType>('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState<'ALL' | AssetCriticality>('ALL');

  const filteredAssets = assets.filter((asset) => {
    if (typeFilter !== 'ALL' && asset.type !== typeFilter) return false;
    if (criticalityFilter !== 'ALL' && asset.criticality !== criticalityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        asset.id.toLowerCase().includes(q) ||
        asset.hostname.toLowerCase().includes(q) ||
        asset.ipAddress.toLowerCase().includes(q) ||
        asset.os.toLowerCase().includes(q) ||
        asset.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Events correlated to currently viewed asset in drawer
  const assetEvents = selectedAsset
    ? events.filter((e) => e.hostname === selectedAsset.hostname || e.srcIp === selectedAsset.ipAddress || e.destIp === selectedAsset.ipAddress)
    : [];

  const assetIncidents = selectedAsset
    ? incidents.filter((i) => i.affectedAssets.some((a) => a.includes(selectedAsset.hostname) || a.includes(selectedAsset.id)))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
         
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-[#0077c8]" />
            Monitored Assets & Endpoint Inventory
          </h2>
          
        </div>
        <span className="text-xs font-mono text-slate-600 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 shadow-2xs self-start sm:self-auto">
          Total Monitored Nodes: <strong className="text-slate-900 font-bold">{assets.length}</strong>
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search hostname, IP, OS, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Asset Types</option>
            <option value="Workstation">Workstation</option>
            <option value="Domain Controller">Domain Controller</option>
            <option value="Database Server">Database Server</option>
            <option value="Web Server">Web Server</option>
            <option value="Firewall">Firewall</option>
            <option value="Network Switch">Network Switch</option>
            <option value="Windows Server">Windows Server</option>
            <option value="Linux Server">Linux Server</option>
          </select>
        </div>

        <div>
          <select
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value as typeof criticalityFilter)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Criticality Tiers</option>
            <option value="mission_critical">Mission Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Asset ID</th>
                <th className="py-3.5 px-3.5">Hostname & Operating System</th>
                <th className="py-3.5 px-3.5">Type</th>
                <th className="py-3.5 px-3.5">IP Address</th>
                <th className="py-3.5 px-3.5">Criticality</th>
                <th className="py-3.5 px-3.5">Status</th>
                <th className="py-3.5 px-3.5">Department</th>
                <th className="py-3.5 px-3.5 text-center">Alerts</th>
                <th className="py-3.5 px-3.5 text-center">Incidents</th>
                <th className="py-3.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3.5 font-bold text-[#0077c8] whitespace-nowrap">
                    {asset.id}
                  </td>
                  <td className="py-3 px-3.5 font-sans max-w-xs">
                    <div className="font-bold text-slate-900">{asset.hostname}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{asset.os}</div>
                  </td>
                  <td className="py-3 px-3.5 font-sans text-slate-700 font-medium whitespace-nowrap">
                    {asset.type}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-800">
                    {asset.ipAddress}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        asset.criticality === 'mission_critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : asset.criticality === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-sky-50 text-[#0066b3] border border-sky-200'
                      }`}
                    >
                      {asset.criticality.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        asset.status === 'Online'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : asset.status === 'Warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-sans text-slate-700 max-w-[140px] truncate">
                    {asset.department}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    {asset.associatedAlertCount > 0 ? (
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {asset.associatedAlertCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    {asset.associatedIncidentCount > 0 ? (
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {asset.associatedIncidentCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssetId(asset.id);
                      }}
                      className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#0077c8] border border-sky-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Detail Drawer Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            {/* Header */}
            <div className="p-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0077c8] border border-sky-200 flex items-center justify-center shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {selectedAsset.hostname}
                    <span className="font-mono text-xs text-[#0077c8]">({selectedAsset.id})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    IP: {selectedAsset.ipAddress} · MAC: {selectedAsset.macAddress}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssetId(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Asset Hardware & Registry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f8fbff] rounded-xl border border-sky-200 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-sans font-bold block">Asset Type</span>
                  <span className="text-slate-900 font-bold">{selectedAsset.type}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-sans font-bold block">Criticality Tier</span>
                  <span className="text-red-600 font-bold uppercase">{selectedAsset.criticality.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-sans font-bold block">EDR Agent</span>
                  <span className="text-emerald-700 font-bold">{selectedAsset.agentVersion || 'Active (v4.18)'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-sans font-bold block">Admin Contact</span>
                  <span className="text-[#0077c8] font-sans font-bold">{selectedAsset.assignedAdmin || 'Endale Aychew'}</span>
                </div>
              </div>

              {/* Operating System & Department */}
              <div className="p-4 bg-[#f8fbff] rounded-xl border border-sky-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Operating System:</span>
                  <span className="text-slate-900 font-bold">{selectedAsset.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department / Role:</span>
                  <span className="text-slate-900 font-semibold">{selectedAsset.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Telemetry Seen:</span>
                  <span className="text-slate-700 font-mono font-medium">{selectedAsset.lastSeen}</span>
                </div>
              </div>

              {/* Associated Active Incidents */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-600" /> Active Security Incidents Affecting this Host
                </h4>
                {assetIncidents.length === 0 ? (
                  <p className="text-slate-500 text-xs italic bg-[#f8fbff] p-4 rounded-xl border border-sky-200">
                    No active incident investigations currently open for this asset.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assetIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => {
                          setSelectedAssetId(null);
                          setSelectedIncidentId(inc.id);
                          setActivePage('incidents');
                        }}
                        className="p-3.5 bg-white border border-sky-200 hover:border-red-400 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#0077c8] font-bold">{inc.id}</span>
                            <span className="font-bold text-slate-900">{inc.title}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                            Status: {inc.status.toUpperCase()} · Analyst: {inc.assignedAnalyst}
                          </span>
                        </div>
                        <span className="text-red-600 font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-red-50 border border-red-200">{inc.severity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Correlated Recent Events */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0077c8]" /> Recent Security Events Logged
                </h4>
                {assetEvents.length === 0 ? (
                  <p className="text-slate-500 text-xs italic bg-[#f8fbff] p-4 rounded-xl border border-sky-200">
                    No high-severity events recorded in current time window.
                  </p>
                ) : (
                  <div className="border border-sky-200 rounded-xl overflow-hidden bg-white font-mono text-[11px] shadow-xs">
                    <div className="divide-y divide-sky-100">
                      {assetEvents.slice(0, 3).map((evt) => (
                        <div key={evt.id} className="p-3 flex items-center justify-between">
                          <span className="text-[#0077c8] font-bold">{evt.id}</span>
                          <span className="text-slate-800 font-sans truncate max-w-sm">{evt.originalMessage}</span>
                          <span className="text-slate-500">{evt.timestamp.slice(11)}</span>
                          <span className="text-red-600 font-bold uppercase">{evt.severity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-sky-100 flex justify-end bg-sky-50/40 rounded-b-2xl">
              <button
                onClick={() => setSelectedAssetId(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Close Asset Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
