import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { Alert, Severity, AlertStatus, User } from '../../types/soc';
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
  Link as LinkIcon,
  Plus,
  Clock,
  Server,
  Activity,
  Check,
  Network,
  Shield,
  FileCheck2,
  Database,
  Globe
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
    createIncident,
    incidents,
    currentUser,
    users,
    setActivePage,
    setSelectedIncidentId
  } = useSOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [sourceSystemFilter, setSourceSystemFilter] = useState<string>('ALL');

  // Modal for False Positive
  const [fpModalOpen, setFpModalOpen] = useState(false);
  const [fpReason, setFpReason] = useState('');
  const [fpTargetAlertId, setFpTargetAlertId] = useState<string | null>(null);

  // Modal for Link to Incident
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTargetIncidentId, setLinkTargetIncidentId] = useState(incidents[0]?.id || '');
  const [linkAlertId, setLinkAlertId] = useState<string | null>(null);

  // Modal for Assigning Analyst
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetAlertId, setAssignTargetAlertId] = useState<string | null>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>(currentUser.name);

  // Modal for Creating New Incident from Alert
  const [createIncidentModalOpen, setCreateIncidentModalOpen] = useState(false);
  const [createFromAlert, setCreateFromAlert] = useState<Alert | null>(null);
  const [newIncTitle, setNewIncTitle] = useState('');
  const [newIncCategory, setNewIncCategory] = useState('System');
  const [newIncSummary, setNewIncSummary] = useState('');
  const [newIncDescription, setNewIncDescription] = useState('');

  // Unique source systems for filter dropdown
  const uniqueSourceSystems = Array.from(new Set(alerts.map((a) => a.sourceSystem)));

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (sourceSystemFilter !== 'ALL' && a.sourceSystem !== sourceSystemFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.detectionRuleName.toLowerCase().includes(q) ||
        a.affectedAsset.toLowerCase().includes(q) ||
        a.sourceSystem.toLowerCase().includes(q) ||
        (a.sourceIp && a.sourceIp.toLowerCase().includes(q)) ||
        (a.assignedTo && a.assignedTo.toLowerCase().includes(q)) ||
        (a.relatedIncidentId && a.relatedIncidentId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleOpenAssignModal = (alertId: string, currentAssigned?: string) => {
    setAssignTargetAlertId(alertId);
    setSelectedAnalyst(currentAssigned || currentUser.name);
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = () => {
    if (assignTargetAlertId && selectedAnalyst) {
      assignAlert(assignTargetAlertId, selectedAnalyst);
      setAssignModalOpen(false);
      setAssignTargetAlertId(null);
    }
  };

  const handleOpenLinkModal = (alertId: string) => {
    setLinkAlertId(alertId);
    setLinkTargetIncidentId(incidents[0]?.id || '');
    setLinkModalOpen(true);
  };

  const handleConfirmLink = () => {
    if (linkAlertId && linkTargetIncidentId) {
      linkAlertToIncident(linkAlertId, linkTargetIncidentId);
      setLinkModalOpen(false);
      setLinkAlertId(null);
    }
  };

  const handleOpenCreateIncidentModal = (alert: Alert) => {
    setCreateFromAlert(alert);
    setNewIncTitle(`Incident: ${alert.title}`);
    setNewIncCategory(
      alert.title.toLowerCase().includes('database') || alert.title.toLowerCase().includes('sql')
        ? 'System'
        : alert.title.toLowerCase().includes('web') || alert.title.toLowerCase().includes('xss')
        ? 'Web Application'
        : alert.title.toLowerCase().includes('malware') || alert.title.toLowerCase().includes('ransomware')
        ? 'Malware'
        : alert.title.toLowerCase().includes('login') || alert.title.toLowerCase().includes('privilege')
        ? 'Authentication'
        : alert.title.toLowerCase().includes('dns')
        ? 'DNS and DHCP'
        : 'Network'
    );
    setNewIncSummary(`Automated investigation opened from Alert ${alert.id} (${alert.detectionRuleName}).`);
    setNewIncDescription(
      `Detection triggered on ${alert.sourceSystem} targeting ${alert.affectedAsset}.\nSource IP: ${
        alert.sourceIp || 'Internal'
      }.\nEvidence: ${alert.evidence.map((e) => `${e.label}: ${e.value}`).join(' | ')}`
    );
    setCreateIncidentModalOpen(true);
  };

  const handleConfirmCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFromAlert) return;

    const created = createIncident({
      title: newIncTitle.trim(),
      severity: createFromAlert.severity,
      status: 'new',
      category: newIncCategory,
      affectedAssets: [createFromAlert.affectedAsset],
      assignedAnalyst: currentUser.name,
      source: createFromAlert.sourceSystem,
      summary: newIncSummary.trim(),
      description: newIncDescription.trim(),
      relatedEventIds: [],
      relatedAlertIds: [createFromAlert.id]
    });

    // Link alert
    linkAlertToIncident(createFromAlert.id, created.id);

    setCreateIncidentModalOpen(false);
    setCreateFromAlert(null);
    setSelectedAlertId(null);
    setSelectedIncidentId(created.id);
    setActivePage('incidents');
  };

  const handleConfirmFalsePositive = () => {
    if (fpTargetAlertId && fpReason.trim()) {
      markAlertFalsePositive(fpTargetAlertId, fpReason.trim());
      setFpModalOpen(false);
      setFpReason('');
      setFpTargetAlertId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" />
            Security Alerts & Real-time Threat Detections
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time correlation alerts generated across revenue web portals, database clusters, domain controllers, and edge firewalls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold bg-white px-3.5 py-1.5 rounded-xl border border-sky-200 shadow-2xs">
          <span className="text-slate-500">Total Alerts:</span>
          <span className="text-[#0077c8] font-black">{alerts.length}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Unacknowledged:</span>
          <span className="text-red-600 font-black">{alerts.filter((a) => a.status === 'new').length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, rule, asset, source IP..."
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
            <option value="new">New (Unacknowledged)</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="assigned">Assigned</option>
            <option value="investigating">Investigating</option>
            <option value="linked">Linked to Incident</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>

        <div>
          <select
            value={sourceSystemFilter}
            onChange={(e) => setSourceSystemFilter(e.target.value)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Source Systems</option>
            {uniqueSourceSystems.map((sys) => (
              <option key={sys} value={sys}>
                {sys}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Alerts Table displaying all required fields */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Alert ID</th>
                <th className="py-3.5 px-3.5 min-w-[240px]">Alert Title & Detection Rule</th>
                <th className="py-3.5 px-3.5">Severity</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Detection Timestamp</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Source System</th>
                <th className="py-3.5 px-3.5 min-w-[170px]">Affected Hostname / Asset</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Relevant Source IP</th>
                <th className="py-3.5 px-3.5">Status</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Related Incident</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Assigned Analyst</th>
                <th className="py-3.5 px-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500 font-sans text-xs">
                    No security alerts matched the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                  >
                    {/* 1. Alert ID */}
                    <td className="py-3.5 px-3.5 font-bold text-[#0077c8] whitespace-nowrap">
                      {alert.id}
                    </td>

                    {/* 2. Alert Title & Detection Rule */}
                    <td className="py-3.5 px-3.5 font-sans max-w-sm">
                      <div className="font-bold text-slate-900 group-hover:text-[#0077c8] transition-colors leading-snug">
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        Rule: {alert.detectionRuleName} ({alert.detectionRuleId})
                      </div>
                    </td>

                    {/* 3. Severity */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
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

                    {/* 4. Detection Timestamp */}
                    <td className="py-3.5 px-3.5 text-slate-500 text-[11px] whitespace-nowrap font-mono">
                      <div className="text-slate-800 font-medium">
                        {alert.detectionTimestamp || alert.firstDetected}
                      </div>
                      {alert.lastDetected && alert.lastDetected !== alert.firstDetected && (
                        <div className="text-[10px] text-slate-400">Last: {alert.lastDetected.slice(11)}</div>
                      )}
                    </td>

                    {/* 5. Source System */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap font-sans font-semibold text-slate-800 text-xs">
                      {alert.sourceSystem}
                    </td>

                    {/* 6. Affected Hostname or Asset */}
                    <td className="py-3.5 px-3.5 font-mono text-xs text-[#0077c8]">
                      {alert.affectedAsset}
                    </td>

                    {/* 7. Relevant Source IP Address */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap font-mono">
                      {alert.sourceIp ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-[#0066b3] border border-sky-200 font-bold text-[11px]">
                          {alert.sourceIp}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A (Host Internal)</span>
                      )}
                    </td>

                    {/* 8. Alert Status */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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

                    {/* 9. Related Incident ID */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      {alert.relatedIncidentId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentId(alert.relatedIncidentId!);
                            setActivePage('incidents');
                          }}
                          className="font-mono text-xs text-red-600 font-bold hover:underline flex items-center gap-1 bg-red-50/60 px-2 py-0.5 rounded border border-red-200"
                        >
                          {alert.relatedIncidentId} <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans">None</span>
                      )}
                    </td>

                    {/* 10. Assigned Analyst */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap font-sans text-xs">
                      {alert.assignedTo ? (
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <div className="w-4 h-4 rounded-full bg-sky-100 text-[#0077c8] flex items-center justify-center text-[10px] font-bold">
                            {alert.assignedTo.charAt(0)}
                          </div>
                          <span>{alert.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* 11. Actions */}
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap font-sans">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {alert.status === 'new' && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                            title="Acknowledge Alert"
                          >
                            Ack
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenAssignModal(alert.id, alert.assignedTo)}
                          className="px-2.5 py-1 bg-white hover:bg-sky-50 text-[#0077c8] border border-sky-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                          title="Assign Analyst"
                        >
                          Assign
                        </button>

                        <button
                          onClick={() => {
                            if (alert.relatedIncidentId) {
                              setSelectedIncidentId(alert.relatedIncidentId);
                              setActivePage('incidents');
                            } else {
                              handleOpenLinkModal(alert.id);
                            }
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                          title="Link or Create Incident"
                        >
                          Link
                        </button>

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

      {/* DETAILED ALERT EVIDENCE & WORKFLOW MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-xs max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Alert Evidence Dossier: <span className="font-mono text-[#0077c8]">{selectedAlert.id}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Detection Rule: {selectedAlert.detectionRuleName} ({selectedAlert.detectionRuleId})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlertId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Status Grid */}
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
                <span className="text-[10px] uppercase text-slate-500 font-bold block font-sans">Source System</span>
                <span className="text-slate-800 font-sans font-semibold truncate block">{selectedAlert.sourceSystem}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block font-sans">Source IP</span>
                <span className="text-[#0077c8] font-bold">{selectedAlert.sourceIp || 'Internal Subnet'}</span>
              </div>
            </div>

            {/* Asset and Timestamp Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-sky-100 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-sans block font-bold">Affected Hostname / Asset</span>
                <span className="text-slate-900 font-bold">{selectedAlert.affectedAsset}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-sans block font-bold">Detection Timestamp</span>
                <span className="text-slate-800">{selectedAlert.detectionTimestamp || selectedAlert.firstDetected}</span>
              </div>
            </div>

            {/* Collected Evidence Fields */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                <span>Correlated Threat Evidence Artifacts</span>
                <span className="font-mono text-slate-500 text-[11px] font-normal">{selectedAlert.eventCount} Events Correlated</span>
              </h4>
              <div className="space-y-2 bg-[#f8fbff] p-4 rounded-xl border border-sky-200 font-mono">
                {selectedAlert.evidence.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white border border-sky-100 gap-1">
                    <span className="text-slate-500 font-bold">{item.label}:</span>
                    <span className="text-slate-900 font-bold break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Analyst Information */}
            <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block">Assigned Analyst</span>
                <span className="font-bold text-slate-900 font-sans text-xs">
                  {selectedAlert.assignedTo || 'Unassigned'}
                </span>
              </div>
              <button
                onClick={() => handleOpenAssignModal(selectedAlert.id, selectedAlert.assignedTo)}
                className="px-3 py-1 bg-white hover:bg-sky-100 text-[#0077c8] border border-sky-200 rounded-lg text-xs font-bold transition-colors font-sans shadow-2xs"
              >
                Change Assignment
              </button>
            </div>

            {/* False positive notice if marked */}
            {selectedAlert.falsePositiveReason && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800">Marked False Positive</span>
                <p className="text-slate-800 text-xs font-sans">Reason: {selectedAlert.falsePositiveReason}</p>
                <p className="text-slate-500 text-[10px] font-mono">Audited By: {selectedAlert.falsePositiveBy}</p>
              </div>
            )}

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-sky-100 font-sans">
              <div className="flex flex-wrap items-center gap-2">
                {selectedAlert.status === 'new' && (
                  <button
                    onClick={() => acknowledgeAlert(selectedAlert.id)}
                    className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-slate-800 border border-sky-200 rounded-xl text-xs font-bold shadow-2xs"
                  >
                    Acknowledge
                  </button>
                )}

                {selectedAlert.status !== 'false_positive' && (
                  <button
                    onClick={() => {
                      setFpTargetAlertId(selectedAlert.id);
                      setFpModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl text-xs font-bold shadow-2xs"
                  >
                    Mark False Positive
                  </button>
                )}

                <button
                  onClick={() => handleOpenLinkModal(selectedAlert.id)}
                  className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-[#0077c8] border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <LinkIcon className="w-3.5 h-3.5" /> Link to Incident
                </button>
              </div>

              <div className="flex items-center gap-2">
                {!selectedAlert.relatedIncidentId ? (
                  <button
                    onClick={() => handleOpenCreateIncidentModal(selectedAlert)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Flame className="w-3.5 h-3.5" /> Create New Incident
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedAlertId(null);
                      setSelectedIncidentId(selectedAlert.relatedIncidentId!);
                      setActivePage('incidents');
                    }}
                    className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    Open Linked Case ({selectedAlert.relatedIncidentId})
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

      {/* ASSIGN ANALYST MODAL */}
      {assignModalOpen && assignTargetAlertId && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0077c8]" />
                Assign Alert to SOC Analyst
              </h4>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Select an authorized security analyst to take ownership of Alert <strong>{assignTargetAlertId}</strong>:
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Security Analyst</label>
              <select
                value={selectedAnalyst}
                onChange={(e) => setSelectedAnalyst(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-hidden focus:border-[#0077c8]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} — {u.role} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Assign Analyst
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINK TO EXISTING INCIDENT MODAL */}
      {linkModalOpen && linkAlertId && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#0077c8]" />
                Link Alert to Incident Case
              </h4>
              <button onClick={() => setLinkModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Correlate Alert <strong>{linkAlertId}</strong> with an existing investigation dossier:
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Incident Investigation</label>
              <select
                value={linkTargetIncidentId}
                onChange={(e) => setLinkTargetIncidentId(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.id}: {inc.title} ({inc.severity.toUpperCase()} · {inc.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-sky-100">
              <button
                type="button"
                onClick={() => {
                  setLinkModalOpen(false);
                  const targetAlertObj = alerts.find((a) => a.id === linkAlertId);
                  if (targetAlertObj) handleOpenCreateIncidentModal(targetAlertObj);
                }}
                className="text-[#0077c8] font-bold hover:underline"
              >
                + Or Create New Incident Instead
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLink}
                  className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Confirm Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INCIDENT FROM ALERT MODAL */}
      {createIncidentModalOpen && createFromAlert && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600" />
                Create New Incident from Alert ({createFromAlert.id})
              </h4>
              <button onClick={() => setCreateIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateIncident} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  value={newIncTitle}
                  onChange={(e) => setNewIncTitle(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity</label>
                  <input
                    type="text"
                    disabled
                    value={createFromAlert.severity.toUpperCase()}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-700 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newIncCategory}
                    onChange={(e) => setNewIncCategory(e.target.value)}
                    className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                  >
                    <option value="System">System / Database</option>
                    <option value="Web Application">Web Application</option>
                    <option value="Malware">Malware / Ransomware</option>
                    <option value="Authentication">Authentication / Identity</option>
                    <option value="Network">Network / Perimeter</option>
                    <option value="DNS and DHCP">DNS & Threat Intel</option>
                    <option value="Other">Insider Threat / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Affected System / Asset</label>
                <input
                  type="text"
                  disabled
                  value={createFromAlert.affectedAsset}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Incident Description</label>
                <textarea
                  rows={2}
                  required
                  value={newIncSummary}
                  onChange={(e) => setNewIncSummary(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Technical Vectors & Evidence</label>
                <textarea
                  rows={3}
                  value={newIncDescription}
                  onChange={(e) => setNewIncDescription(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setCreateIncidentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Open Incident Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FALSE POSITIVE MODAL */}
      {fpModalOpen && fpTargetAlertId && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Document False Positive Classification
            </h4>
            <p className="text-slate-600">
              Provide an audit justification for marking Alert <strong>{fpTargetAlertId}</strong> as a false positive. This action will be permanently recorded in the Ministry SOC audit log.
            </p>
            <textarea
              rows={3}
              value={fpReason}
              onChange={(e) => setFpReason(e.target.value)}
              placeholder="e.g. Verified scheduled batch job run by authorized ETL service; verified routine administrative maintenance..."
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100 font-sans">
              <button
                onClick={() => setFpModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFalsePositive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Save False Positive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
