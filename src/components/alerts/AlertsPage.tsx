import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { Alert, Severity, AlertStatus } from '../../types/soc';
import {
  BellRing,
  CheckCircle,
  UserCheck,
  Flame,
  Search,
  Filter,
  X,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    selectedAlert,
    setSelectedAlertId,
    acknowledgeAlert,
    assignAlert,
    markAlertFalsePositive,
    escalateAlertToIncident,
    linkAlertToIncident,
    incidents,
    currentUser,
    setActivePage,
    setSelectedIncidentId
  } = useSOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');

  // Modal for False Positive
  const [fpModalOpen, setFpModalOpen] = useState(false);
  const [fpReason, setFpReason] = useState('');
  const [fpTargetAlertId, setFpTargetAlertId] = useState<string | null>(null);

  // Modal for Link to Incident
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTargetIncidentId, setLinkTargetIncidentId] = useState(incidents[0]?.id || '');
  const [linkAlertId, setLinkAlertId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.detectionRuleName.toLowerCase().includes(q) ||
        a.affectedAsset.toLowerCase().includes(q) ||
        a.sourceSystem.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
         
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" />
            Security Alerts & Detection Rules Engine
          </h2>
         
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by title, rule, asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
          />
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'ALL')}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="assigned">Assigned</option>
            <option value="investigating">Investigating</option>
            <option value="linked">Linked</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Alert ID</th>
                <th className="py-3.5 px-3.5">Alert Title & Detection Rule</th>
                <th className="py-3.5 px-3.5">Severity</th>
                <th className="py-3.5 px-3.5">First / Last Detected</th>
                <th className="py-3.5 px-3.5">Source & Asset</th>
                <th className="py-3.5 px-3.5">Related Incident</th>
                <th className="py-3.5 px-3.5">Status</th>
                <th className="py-3.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No security alerts matched the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-bold text-[#0077c8] whitespace-nowrap">
                      {alert.id}
                    </td>
                    <td className="py-3 px-3.5 font-sans max-w-sm">
                      <div className="font-bold text-slate-900">{alert.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        Rule: {alert.detectionRuleName}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
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
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      <div>{alert.firstDetected.slice(11)}</div>
                      <div className="text-[10px] text-slate-400">Last: {alert.lastDetected.slice(11)}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="text-slate-800 font-sans font-bold">{alert.sourceSystem}</div>
                      <div className="text-[11px] text-[#0077c8] font-mono">{alert.affectedAsset}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {alert.relatedIncidentId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentId(alert.relatedIncidentId!);
                            setActivePage('incidents');
                          }}
                          className="font-mono text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                        >
                          {alert.relatedIncidentId} <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          alert.status === 'new'
                            ? 'bg-sky-50 text-[#0066b3] border border-sky-200'
                            : alert.status === 'assigned'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : alert.status === 'linked'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : alert.status === 'false_positive'
                            ? 'bg-slate-100 text-slate-400 line-through'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap font-sans">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {alert.status === 'new' && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-lg text-[11px] font-bold shadow-2xs"
                            title="Acknowledge Alert"
                          >
                            Ack
                          </button>
                        )}
                        {!alert.relatedIncidentId && alert.status !== 'false_positive' && (
                          <button
                            onClick={() => {
                              const created = escalateAlertToIncident(alert.id);
                              setSelectedIncidentId(created.id);
                              setActivePage('incidents');
                            }}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition-colors"
                            title="Escalate to Incident"
                          >
                            Escalate
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAlertId(alert.id)}
                          className="px-3 py-1 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                        >
                          Evidence
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Alert Evidence Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Alert Evidence: <span className="font-mono text-[#0077c8]">{selectedAlert.id}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Detection Rule: {selectedAlert.detectionRuleName} ({selectedAlert.detectionRuleId})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlertId(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Status Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f8fbff] rounded-xl border border-sky-200 font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block font-sans">Severity</span>
                <span
                  className={`font-bold uppercase ${
                    selectedAlert.severity === 'critical'
                      ? 'text-red-600'
                      : selectedAlert.severity === 'high'
                      ? 'text-amber-600'
                      : 'text-[#0077c8]'
                  }`}
                >
                  {selectedAlert.severity}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block font-sans">Status</span>
                <span className="text-slate-900 font-bold uppercase">{selectedAlert.status}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block font-sans">Affected Asset</span>
                <span className="text-[#0077c8] font-bold">{selectedAlert.affectedAsset}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block font-sans">Event Volume</span>
                <span className="text-slate-900 font-bold tabular-nums">{selectedAlert.eventCount} occurrences</span>
              </div>
            </div>

            {/* Collected Evidence Fields */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Correlated Evidence Artifacts
              </h4>
              <div className="space-y-2 bg-[#f8fbff] p-4 rounded-xl border border-sky-200 font-mono">
                {selectedAlert.evidence.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white border border-sky-100">
                    <span className="text-slate-500 font-bold">{item.label}:</span>
                    <span className="text-slate-900 font-bold break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* False positive notice if marked */}
            {selectedAlert.falsePositiveReason && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800">Marked False Positive</span>
                <p className="text-slate-800 text-xs">Reason: {selectedAlert.falsePositiveReason}</p>
                <p className="text-slate-500 text-[10px] font-mono">By: {selectedAlert.falsePositiveBy}</p>
              </div>
            )}

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-sky-100 font-sans">
              <div className="flex items-center gap-2">
                {selectedAlert.status !== 'false_positive' && (
                  <button
                    onClick={() => {
                      setFpTargetAlertId(selectedAlert.id);
                      setFpModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-lg text-xs font-bold shadow-2xs"
                  >
                    Mark False Positive
                  </button>
                )}

                <button
                  onClick={() => {
                    setLinkAlertId(selectedAlert.id);
                    setLinkModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-[#0077c8] border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <LinkIcon className="w-3.5 h-3.5" /> Link to Incident
                </button>
              </div>

              <div className="flex items-center gap-2">
                {!selectedAlert.relatedIncidentId && (
                  <button
                    onClick={() => {
                      const created = escalateAlertToIncident(selectedAlert.id);
                      setSelectedAlertId(null);
                      setSelectedIncidentId(created.id);
                      setActivePage('incidents');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Flame className="w-3.5 h-3.5" /> Escalate to Incident
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlertId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* False Positive Modal */}
      {fpModalOpen && fpTargetAlertId && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Document False Positive Classification
            </h4>
            <p className="text-slate-600">
              Provide an audit justification for marking this alert as a false positive. This action will be permanently recorded in the Ministry SOC audit log.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Authorized penetration test conducted by vendor ticket #SEC-9921..."
              value={fpReason}
              onChange={(e) => setFpReason(e.target.value)}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-3 text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setFpModalOpen(false);
                  setFpReason('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!fpReason.trim()) {
                    alert('Please provide a justification reason.');
                    return;
                  }
                  markAlertFalsePositive(fpTargetAlertId, fpReason.trim());
                  setFpModalOpen(false);
                  setFpReason('');
                  setSelectedAlertId(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs"
              >
                Confirm False Positive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link to Incident Modal */}
      {linkModalOpen && linkAlertId && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#0077c8]" />
              Link Alert to Active Investigation Case
            </h4>
            <p className="text-slate-600">
              Select an open security incident to associate with Alert {linkAlertId}:
            </p>
            <select
              value={linkTargetIncidentId}
              onChange={(e) => setLinkTargetIncidentId(e.target.value)}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-3 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.id}: {inc.title.slice(0, 45)}...
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  linkAlertToIncident(linkAlertId, linkTargetIncidentId);
                  setLinkModalOpen(false);
                  setSelectedAlertId(null);
                }}
                className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white font-bold rounded-xl shadow-xs"
              >
                Link Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
