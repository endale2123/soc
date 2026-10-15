import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { ThreatIndicator, Severity } from '../../types/soc';
import {
  Binary,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Database,
  ExternalLink,
  X,
  Crosshair
} from 'lucide-react';

export const ThreatIntelPage: React.FC = () => {
  const {
    threatIndicators,
    addThreatIndicator,
    events,
    setSelectedEventId,
    setActivePage
  } = useSOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ip' | 'domain' | 'url' | 'hash'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | Severity>('ALL');

  // Interactive Correlation Lookup Tool
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<{
    matchedEvents: typeof events;
    indicatorMatch: ThreatIndicator | undefined;
  } | null>(null);

  // Add Indicator Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<'ip' | 'domain' | 'url' | 'hash'>('ip');
  const [newValue, setNewValue] = useState('');
  const [newSource, setNewSource] = useState('CERT-ET Advisory / Ministry Feed');
  const [newRisk, setNewRisk] = useState<Severity>('high');
  const [newConfidence, setNewConfidence] = useState(90);
  const [newDesc, setNewDesc] = useState('');

  const filteredIndicators = threatIndicators.filter((item) => {
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    if (riskFilter !== 'ALL' && item.riskRating !== riskFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.value.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Handle Correlation Scan
  const handleCorrelationScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    const q = lookupQuery.trim().toLowerCase();
    const matched = events.filter((evt) => {
      return (
        (evt.srcIp && evt.srcIp.toLowerCase().includes(q)) ||
        (evt.destIp && evt.destIp.toLowerCase().includes(q)) ||
        (evt.normalizedFields.fileHash && evt.normalizedFields.fileHash.toLowerCase().includes(q)) ||
        (evt.normalizedFields.targetResource && evt.normalizedFields.targetResource.toLowerCase().includes(q)) ||
        evt.originalMessage.toLowerCase().includes(q)
      );
    });

    const indMatch = threatIndicators.find((t) => t.value.toLowerCase() === q);

    setLookupResults({
      matchedEvents: matched,
      indicatorMatch: indMatch
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !newDesc.trim()) {
      alert('Please fill out value and description.');
      return;
    }

    addThreatIndicator({
      type: newType,
      value: newValue.trim(),
      source: newSource,
      confidence: Number(newConfidence),
      riskRating: newRisk,
      expirationDate: '2026-11-30',
      description: newDesc.trim()
    });

    setAddModalOpen(false);
    setNewValue('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Binary className="w-5 h-5 text-[#0077c8]" />
            Threat Intelligence & IoC Correlation Engine
          </h2>
       
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white text-xs font-bold rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Custom Threat Indicator
        </button>
      </div>

      {/* IoC Correlation Quick Lookup Tool */}
      <div className="bg-white border border-sky-200/80 rounded-2xl p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-red-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Real-time IoC Event Correlation Scanner
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          Paste any external IP address, C2 domain, or SHA-256 file hash to scan against all ingested Ministry events:
        </p>
        <form onSubmit={handleCorrelationScan} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 185.220.101.42 or sync.dnscache-update.top or e3b0c442..."
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            className="flex-1 bg-[#f8fbff] border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white text-xs font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            Scan Ingested Logs
          </button>
        </form>

        {/* Scan Results Panel */}
        {lookupResults && (
          <div className="mt-3 p-4 bg-[#f8fbff] rounded-xl border border-sky-200 space-y-2.5 text-xs font-mono animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-bold">
                Scan Target: <span className="text-[#0077c8]">{lookupQuery}</span>
              </span>
              <span className="text-slate-500">
                Matches Found: <strong className="text-red-600 font-bold">{lookupResults.matchedEvents.length} events</strong>
              </span>
            </div>

            {lookupResults.indicatorMatch && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] font-sans flex items-center justify-between">
                <span>
                  <strong>Known Threat IoC:</strong> {lookupResults.indicatorMatch.description} (Risk: {lookupResults.indicatorMatch.riskRating.toUpperCase()})
                </span>
                <span className="font-mono text-red-700 font-bold">
                  Confidence: {lookupResults.indicatorMatch.confidence}%
                </span>
              </div>
            )}

            {lookupResults.matchedEvents.length > 0 ? (
              <div className="divide-y divide-sky-100 max-h-40 overflow-y-auto pt-1 bg-white rounded-lg border border-sky-100">
                {lookupResults.matchedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedEventId(evt.id);
                      setActivePage('events');
                    }}
                    className="py-2 px-3 hover:bg-sky-50 cursor-pointer flex items-center justify-between text-[11px]"
                  >
                    <span className="text-[#0077c8] font-bold">{evt.id}</span>
                    <span className="text-slate-800 font-sans font-semibold">{evt.hostname}</span>
                    <span className="text-slate-500">{evt.timestamp}</span>
                    <span className="text-red-600 font-bold uppercase">{evt.severity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs font-sans italic py-1">
                Zero instances of this indicator observed across all internal revenue telemetry.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search IoC value, description, feed..."
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
            <option value="ALL">All IoC Types</option>
            <option value="ip">IP Address</option>
            <option value="domain">Domain Name</option>
            <option value="hash">File Hash</option>
            <option value="url">URL</option>
          </select>
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Risk Ratings</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Indicators Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Type</th>
                <th className="py-3.5 px-3.5">Indicator Value</th>
                <th className="py-3.5 px-3.5">Risk Rating</th>
                <th className="py-3.5 px-3.5">Confidence</th>
                <th className="py-3.5 px-3.5">Intelligence Source</th>
                <th className="py-3.5 px-3.5">Last Observed</th>
                <th className="py-3.5 px-3.5">Correlated Events</th>
                <th className="py-3.5 px-3.5">Expiration</th>
                <th className="py-3.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {filteredIndicators.map((item) => (
                <tr key={item.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-sky-50 text-[#0066b3] border border-sky-200">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-900 font-bold break-all max-w-xs">
                    <div>{item.value}</div>
                    <div className="text-[11px] text-slate-500 font-sans truncate mt-0.5">{item.description}</div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.riskRating === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : item.riskRating === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}
                    >
                      {item.riskRating}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#0077c8] rounded-full"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span className="text-slate-700 font-bold">{item.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-sans text-slate-700 font-medium max-w-[150px] truncate">
                    {item.source}
                  </td>
                  <td className="py-3 px-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                    {item.lastObserved}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-900 font-extrabold tabular-nums">
                    {item.relatedEventsCount}
                  </td>
                  <td className="py-3 px-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                    {item.expirationDate}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-sans">
                    <button
                      onClick={() => {
                        setLookupQuery(item.value);
                        handleCorrelationScan({ preventDefault: () => {} } as React.FormEvent);
                      }}
                      className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#0077c8] border border-sky-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      Correlate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Threat Indicator Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white border border-sky-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs"
          >
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0077c8]" />
                Add Indicator of Compromise (IoC)
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Indicator Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as typeof newType)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="ip">IP Address</option>
                  <option value="domain">Domain Name</option>
                  <option value="url">URL</option>
                  <option value="hash">File Hash (SHA-256)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Risk Severity</label>
                <select
                  value={newRisk}
                  onChange={(e) => setNewRisk(e.target.value as Severity)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Indicator Value *</label>
              <input
                type="text"
                required
                placeholder="e.g. 194.26.29.112 or malicious-update.com"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Threat Feed Source</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confidence Score: {newConfidence}%</label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={newConfidence}
                  onChange={(e) => setNewConfidence(Number(e.target.value))}
                  className="w-full mt-2 accent-[#0077c8]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description & Threat Attribution *</label>
              <textarea
                rows={2}
                required
                placeholder="Observed activity, adversary group, or targeted service..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold shadow-xs"
              >
                Save Indicator
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
