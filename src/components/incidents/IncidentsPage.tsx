import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import {
  Incident,
  Severity,
  IncidentStatus,
  EventCategory
} from '../../types/soc';
import {
  Flame,
  Plus,
  Search,
  Filter,
  User,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Activity,
  History,
  HardDrive,
  Send,
  Lock,
  ArrowRight,
  ExternalLink,
  Bell,
  ListChecks,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
  Radio,
  Server,
  Database,
  Globe
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const {
    incidents,
    incidentFilters,
    setIncidentFilters,
    selectedIncident,
    setSelectedIncidentId,
    createIncident,
    updateIncidentStatus,
    updateIncidentSeverity,
    assignIncident,
    addIncidentNote,
    addResponseAction,
    closeIncidentWithResolution,
    currentUser,
    events,
    alerts,
    setSelectedAlertId,
    setActivePage,
    auditLogs
  } = useSOC();

  // Create Incident Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<Severity>('high');
  const [newCategory, setNewCategory] = useState<string>('System');
  const [newSource, setNewSource] = useState('Tax Database Audit');
  const [newAffectedAssets, setNewAffectedAssets] = useState('Tax Database Server (mor-db-cluster01.revenue.gov.et)');
  const [newSummary, setNewSummary] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Active Tab inside Incident Detail
  const [activeTab, setActiveTab] = useState<
    'timeline' | 'alerts' | 'events' | 'assets' | 'notes' | 'playbook' | 'resolution'
  >('timeline');

  // Input states for Incident Detail actions
  const [newNoteText, setNewNoteText] = useState('');
  const [reassignName, setReassignName] = useState(currentUser.name);
  const [severityChangeReason, setSeverityChangeReason] = useState('');
  const [targetSeverity, setTargetSeverity] = useState<Severity>('critical');

  // Completed steps tracking for playbook (local state fallback per incident)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Response action modal & confirmation
  const [confirmActionModal, setConfirmActionModal] = useState<{
    open: boolean;
    actionName: string;
    targetAsset: string;
    details: string;
  }>({
    open: false,
    actionName: '',
    targetAsset: '',
    details: ''
  });

  // Formal Close Resolution Modal state
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeRootCause, setCloseRootCause] = useState('');
  const [closeSummary, setCloseSummary] = useState('');
  const [closePreventative, setClosePreventative] = useState('');

  // Additional category filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Filter incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (incidentFilters.severity && incidentFilters.severity !== 'ALL') {
      if (inc.severity !== incidentFilters.severity) return false;
    }
    if (incidentFilters.status && incidentFilters.status !== 'ALL') {
      if (inc.status !== incidentFilters.status) return false;
    }
    if (categoryFilter !== 'ALL') {
      if (inc.category !== categoryFilter) return false;
    }
    if (incidentFilters.search) {
      const q = incidentFilters.search.toLowerCase();
      const match =
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.summary.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.category && inc.category.toLowerCase().includes(q)) ||
        inc.source.toLowerCase().includes(q) ||
        inc.assignedAnalyst.toLowerCase().includes(q) ||
        inc.affectedAssets.some((a) => a.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) {
      alert('Please fill out all required incident fields.');
      return;
    }

    const assetsList = newAffectedAssets
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const created = createIncident({
      title: newTitle.trim(),
      severity: newSeverity,
      status: 'new',
      category: newCategory,
      affectedAssets: assetsList.length > 0 ? assetsList : ['Tax Database Server (mor-db-cluster01.revenue.gov.et)'],
      assignedAnalyst: currentUser.name,
      source: newSource,
      summary: newSummary.trim(),
      description: newDescription.trim() || newSummary.trim(),
      relatedEventIds: [],
      relatedAlertIds: []
    });

    setCreateModalOpen(false);
    setNewTitle('');
    setNewSummary('');
    setNewDescription('');
    setNewAffectedAssets('Tax Database Server (mor-db-cluster01.revenue.gov.et)');
    setSelectedIncidentId(created.id);
  };

  const handleExecuteAction = (actionName: string, targetAsset: string, details: string) => {
    if (!selectedIncident) return;
    addResponseAction(selectedIncident.id, actionName, targetAsset, details);
    setConfirmActionModal({ open: false, actionName: '', targetAsset: '', details: '' });
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    if (!closeRootCause.trim() || !closeSummary.trim()) {
      alert('Root Cause and Resolution Summary are required.');
      return;
    }
    closeIncidentWithResolution(selectedIncident.id, {
      rootCause: closeRootCause.trim(),
      resolutionSummary: closeSummary.trim(),
      preventativeAction: closePreventative.trim() || 'Enhanced continuous telemetry and policy tuning.'
    });
    setCloseModalOpen(false);
    setCloseRootCause('');
    setCloseSummary('');
    setClosePreventative('');
  };

  const toggleStep = (stepText: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepText]: !prev[stepText]
    }));
  };

  // Correlated alerts for the selected incident
  const correlatedAlerts = selectedIncident
    ? alerts.filter(
        (a) =>
          selectedIncident.relatedAlertIds.includes(a.id) ||
          a.relatedIncidentId === selectedIncident.id
      )
    : [];

  // Correlated events for the selected incident
  const correlatedEvents = selectedIncident
    ? events.filter(
        (e) =>
          selectedIncident.relatedEventIds.includes(e.id) ||
          e.relatedIncidentId === selectedIncident.id ||
          selectedIncident.affectedAssets.some(
            (asset) =>
              asset.toLowerCase().includes(e.hostname.toLowerCase()) ||
              e.originalMessage.toLowerCase().includes(asset.toLowerCase())
          )
      )
    : [];

  // KPI Metrics
  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const investigatingCount = incidents.filter((i) => i.status === 'investigating').length;
  const containedCount = incidents.filter((i) => i.status === 'contained' || i.status === 'resolved' || i.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header & New Incident Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-600" />
            Security Incident Investigation & Response
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documented cybersecurity investigations, threat containment playbooks, forensic evidence, and resolution audit trails.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white text-xs font-bold rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Security Incident
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Cases</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0077c8] flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900">{incidents.length}</div>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active enterprise security dossiers</p>
        </div>

        <div className="bg-white border border-red-200/80 rounded-2xl p-4 shadow-xs bg-red-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Critical Severity</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-red-600">{criticalCount}</div>
          <p className="text-[10px] text-red-700/80 font-medium mt-0.5">Immediate containment required</p>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Investigating</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-600">{investigatingCount}</div>
          <p className="text-[10px] text-amber-700/80 font-medium mt-0.5">Forensic analysis in progress</p>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Contained / Closed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-700">{containedCount}</div>
          <p className="text-[10px] text-emerald-700/80 font-medium mt-0.5">Threat neutralized or remediated</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, summary, analyst..."
            value={incidentFilters.search || ''}
            onChange={(e) =>
              setIncidentFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
          />
        </div>

        <div>
          <select
            value={incidentFilters.severity || 'ALL'}
            onChange={(e) =>
              setIncidentFilters((prev) => ({ ...prev, severity: e.target.value as Severity | 'ALL' }))
            }
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
            value={incidentFilters.status || 'ALL'}
            onChange={(e) =>
              setIncidentFilters((prev) => ({ ...prev, status: e.target.value as IncidentStatus | 'ALL' }))
            }
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Statuses</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="contained">Contained</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Categories</option>
            <option value="System">System / Database</option>
            <option value="Web Application">Web Application</option>
            <option value="Malware">Malware / Ransomware</option>
            <option value="Authentication">Authentication / Identity</option>
            <option value="Network">Network / Perimeter</option>
            <option value="DNS and DHCP">DNS & Threat Intel</option>
            <option value="Other">Insider Threat & Other</option>
          </select>
        </div>
      </div>

      {/* Main Incident Table displaying ALL requested attributes */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Incident ID</th>
                <th className="py-3.5 px-3.5 min-w-[280px]">Incident Title & Description</th>
                <th className="py-3.5 px-3.5">Category</th>
                <th className="py-3.5 px-3.5">Severity</th>
                <th className="py-3.5 px-3.5">Status</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Detection Time</th>
                <th className="py-3.5 px-3.5 min-w-[170px]">Affected System / Asset</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Detection Source</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap">Assigned Analyst</th>
                <th className="py-3.5 px-3.5 text-center whitespace-nowrap">Related Alerts</th>
                <th className="py-3.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500 font-sans text-xs">
                    No security incidents found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                  >
                    {/* 1. Incident ID */}
                    <td className="py-3.5 px-3.5 font-bold text-[#0077c8] whitespace-nowrap">
                      {inc.id}
                    </td>

                    {/* 2. Incident Title & Short Description */}
                    <td className="py-3.5 px-3.5 font-sans max-w-sm">
                      <div className="font-bold text-slate-900 group-hover:text-[#0077c8] transition-colors leading-snug">
                        {inc.title}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {inc.summary || inc.description}
                      </p>
                    </td>

                    {/* 3. Category */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap font-sans">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#0066b3] border border-sky-200">
                        {inc.category || 'System'}
                      </span>
                    </td>

                    {/* 4. Severity */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          inc.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : inc.severity === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inc.severity === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inc.status === 'new'
                            ? 'bg-sky-50 text-[#0066b3] border border-sky-200'
                            : inc.status === 'investigating'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inc.status === 'contained'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : inc.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>

                    {/* 6. Detection Timestamp */}
                    <td className="py-3.5 px-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      {inc.detectionTime}
                    </td>

                    {/* 7. Affected System or Asset */}
                    <td className="py-3.5 px-3.5 font-sans font-medium text-slate-700 text-xs">
                      <div className="font-semibold text-slate-900 truncate">
                        {inc.affectedAssets[0] || 'Core Network'}
                      </div>
                      {inc.affectedAssets.length > 1 && (
                        <div className="text-[10px] text-[#0077c8] font-bold mt-0.5">
                          +{inc.affectedAssets.length - 1} secondary asset(s)
                        </div>
                      )}
                    </td>

                    {/* 8. Detection Source */}
                    <td className="py-3.5 px-3.5 font-sans text-slate-600 text-[11px] whitespace-nowrap">
                      {inc.source}
                    </td>

                    {/* 9. Assigned Analyst */}
                    <td className="py-3.5 px-3.5 font-sans text-slate-800 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-sky-100 text-[#0077c8] flex items-center justify-center font-bold text-[10px]">
                          {inc.assignedAnalyst.charAt(0)}
                        </div>
                        <span>{inc.assignedAnalyst}</span>
                      </div>
                    </td>

                    {/* 10. Related Alert Count */}
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-sky-50 text-[#0077c8] border border-sky-200">
                        <Bell className="w-3 h-3" />
                        {inc.relatedAlertIds.length} {inc.relatedAlertIds.length === 1 ? 'Alert' : 'Alerts'}
                      </span>
                    </td>

                    {/* 11. Action */}
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncidentId(inc.id);
                        }}
                        className="px-3 py-1 bg-sky-50 hover:bg-[#0077c8] hover:text-white text-[#0077c8] border border-sky-200 rounded-lg text-xs font-sans font-bold transition-all shadow-2xs"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INVESTIGATION WORKSPACE MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-sky-200 rounded-2xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header with Full Incident Metadata */}
            <div className="p-4 sm:p-5 border-b border-sky-200/80 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 flex flex-col gap-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 shadow-xs">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0077c8] bg-sky-100/70 px-2 py-0.5 rounded">
                        {selectedIncident.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          selectedIncident.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : selectedIncident.severity === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}
                      >
                        {selectedIncident.severity}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-[#0066b3] border border-sky-200">
                        {selectedIncident.category || 'System'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-white border border-sky-200 text-slate-700 font-bold">
                        Status: {selectedIncident.status}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate mt-1">
                      {selectedIncident.title}
                    </h3>
                  </div>
                </div>

                {/* Status Switcher, Close Button & Dismiss */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {selectedIncident.status !== 'closed' ? (
                    <>
                      <select
                        value={selectedIncident.status}
                        onChange={(e) => updateIncidentStatus(selectedIncident.id, e.target.value as IncidentStatus)}
                        className="bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold shadow-2xs focus:outline-hidden focus:border-[#0077c8]"
                      >
                        <option value="new">Status: NEW</option>
                        <option value="investigating">Status: INVESTIGATING</option>
                        <option value="contained">Status: CONTAINED</option>
                        <option value="resolved">Status: RESOLVED</option>
                      </select>

                      <button
                        onClick={() => setCloseModalOpen(true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        Close Case
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold font-mono border border-slate-200">
                      CASE OFFICIALLY CLOSED
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedIncidentId(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors ml-1"
                    title="Close Workspace"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-white/80 p-2.5 rounded-xl border border-sky-100 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Detection Time</span>
                  <span className="text-slate-800 font-bold">{selectedIncident.detectionTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Assigned Analyst</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-900 font-bold font-sans">{selectedIncident.assignedAnalyst}</span>
                    <button
                      onClick={() => {
                        const name = prompt('Reassign incident to analyst:', currentUser.name);
                        if (name) assignIncident(selectedIncident.id, name);
                      }}
                      className="text-[10px] text-[#0077c8] font-bold hover:underline font-sans"
                    >
                      (Reassign)
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Telemetry Source</span>
                  <span className="text-slate-800 font-sans font-semibold truncate block">{selectedIncident.source}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Related Alerts</span>
                  <span className="text-[#0077c8] font-bold">{selectedIncident.relatedAlertIds.length} Linked Alert(s)</span>
                </div>
              </div>
            </div>

            {/* Workspace Navigation Tabs (All 7 required investigation areas) */}
            <div className="flex items-center gap-1 px-4 border-b border-sky-200 bg-sky-50/40 overflow-x-auto text-xs shrink-0">
              {[
                { id: 'timeline', label: '1. Incident Timeline', icon: Clock },
                { id: 'assets', label: '2. Affected Assets', icon: HardDrive },
                { id: 'alerts', label: `3. Related Alerts (${correlatedAlerts.length})`, icon: Bell },
                { id: 'events', label: '4. Supporting Events', icon: ShieldAlert },
                { id: 'notes', label: `5. Investigation Notes (${selectedIncident.notes.length})`, icon: Send },
                { id: 'playbook', label: '6. Recommended Response Steps', icon: ListChecks },
                { id: 'resolution', label: '7. Resolution History', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-4 py-3 font-semibold whitespace-nowrap border-b-2 transition-all ${
                      isActive
                        ? 'border-[#0077c8] text-[#0077c8] font-bold bg-white rounded-t-lg shadow-2xs'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body with 7 Investigation Sections */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs bg-[#fafcff]">
              {/* SECTION 1: INCIDENT TIMELINE & OVERVIEW */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {/* Executive Descriptions */}
                  <div className="bg-white border border-sky-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0077c8] mb-1">
                        Executive Incident Summary
                      </h4>
                      <p className="text-slate-800 text-xs leading-relaxed font-sans">
                        {selectedIncident.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-sky-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Technical Attack Vector & Impact Description
                      </h4>
                      <p className="text-slate-700 text-xs leading-relaxed font-sans bg-sky-50/40 p-3 rounded-lg border border-sky-100">
                        {selectedIncident.description}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Timeline */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0077c8]" />
                        Chronological Investigation Timeline
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        {selectedIncident.timeline.length} Recorded Milestones
                      </span>
                    </div>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200">
                      {selectedIncident.timeline.map((item) => (
                        <div key={item.id} className="relative">
                          <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#0077c8] ring-4 ring-sky-100" />
                          <div className="p-4 bg-white rounded-xl border border-sky-200 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 mb-1">
                              <span className="font-bold text-slate-900 font-sans">{item.action}</span>
                              <span className="text-[11px] font-mono text-slate-500">{item.timestamp}</span>
                            </div>
                            <span className="text-[11px] text-[#0077c8] font-mono font-semibold block">
                              Recorded by: {item.user}
                            </span>
                            {item.note && (
                              <p className="mt-2 text-xs text-slate-700 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100 font-sans">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: AFFECTED ASSETS */}
              {activeTab === 'assets' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Impacted Critical Systems & Infrastructure
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Assets currently identified in the attack path for isolation or memory acquisition.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedIncident.affectedAssets.map((assetName, idx) => (
                      <div key={idx} className="p-5 bg-white border border-sky-200 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0077c8] border border-sky-200 flex items-center justify-center">
                              <Server className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-bold text-sm text-slate-900 font-sans block">{assetName}</span>
                              <span className="text-[11px] text-[#0077c8] font-mono">Tax Administration Core Asset</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                            Target of Attack
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-[#f8fbff] p-3 rounded-xl border border-sky-100 font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 font-sans block">Primary Directorate</span>
                            <span className="text-slate-700 font-sans font-semibold">Directorate of Large Taxpayers</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-sans block">Criticality Tier</span>
                            <span className="text-amber-700 font-bold">Mission Critical Tier-1</span>
                          </div>
                        </div>

                        {/* Direct Response Containment Actions */}
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() =>
                              setConfirmActionModal({
                                open: true,
                                actionName: 'Isolate Host from Ministry Corporate Network',
                                targetAsset: assetName,
                                details: 'Quarantine device network adapter via endpoint security agent.'
                              })
                            }
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors"
                          >
                            Quarantine Host
                          </button>
                          <button
                            onClick={() =>
                              setConfirmActionModal({
                                open: true,
                                actionName: 'Trigger Deep EDR Forensic Memory Dump',
                                targetAsset: assetName,
                                details: 'Capture volatile RAM memory image for forensic malware extraction.'
                              })
                            }
                            className="px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                          >
                            Trigger Memory Dump
                          </button>
                          <button
                            onClick={() =>
                              setConfirmActionModal({
                                open: true,
                                actionName: 'Enforce Egress Firewall Block',
                                targetAsset: assetName,
                                details: 'Sever all outbound non-management connections at perimeter gateway.'
                              })
                            }
                            className="px-3.5 py-2 bg-white hover:bg-sky-50 text-[#0077c8] border border-sky-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                          >
                            Sever Egress
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: RELATED ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Correlated Security Detection Alerts
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Specific detection rule triggers and telemetry feeds contributing to this investigation.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const alertIdToLink = prompt('Enter Alert ID to link (e.g. ALT-1001 through ALT-1016):');
                        if (alertIdToLink && selectedIncident) {
                          const target = alerts.find((a) => a.id.toLowerCase() === alertIdToLink.trim().toLowerCase());
                          if (target) {
                            // Link alert
                            addIncidentNote(selectedIncident.id, `Linked correlated alert ${target.id} (${target.title})`);
                            alert(`Alert ${target.id} linked successfully to ${selectedIncident.id}`);
                          } else {
                            alert('Alert not found. Please specify a valid alert ID.');
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold transition-colors shadow-xs self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" /> Link Additional Alert
                    </button>
                  </div>

                  {correlatedAlerts.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-sky-200 rounded-2xl text-slate-500">
                      No alerts currently linked to this incident.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {correlatedAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="p-5 bg-white border border-sky-200 rounded-2xl space-y-3 shadow-xs hover:border-[#0077c8] transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#0077c8] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                {alert.id}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  alert.severity === 'critical'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : alert.severity === 'high'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}
                              >
                                {alert.severity}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                Status: {alert.status}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedAlertId(alert.id);
                                setActivePage('alerts');
                              }}
                              className="flex items-center gap-1 text-xs font-bold text-[#0077c8] hover:underline self-start sm:self-auto"
                            >
                              Open in Alerts Console <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div>
                            <h5 className="font-bold text-sm text-slate-900 font-sans">{alert.title}</h5>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Rule: {alert.detectionRuleName} ({alert.detectionRuleId})
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-[#f8fbff] p-3 rounded-xl border border-sky-100 font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 font-sans block">Detection Timestamp</span>
                              <span className="text-slate-800">{alert.detectionTimestamp || alert.firstDetected}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-sans block">Source System</span>
                              <span className="text-slate-800 font-sans font-semibold">{alert.sourceSystem}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-sans block">Source IP</span>
                              <span className="text-[#0077c8] font-bold">{alert.sourceIp || 'Internal Subnet'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-sans block">Event Volume</span>
                              <span className="text-slate-900 font-bold">{alert.eventCount} hits</span>
                            </div>
                          </div>

                          {/* Correlated Evidence items */}
                          <div className="bg-sky-50/40 p-3 rounded-xl border border-sky-100 space-y-1.5 font-mono text-[11px]">
                            <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block">
                              Collected Evidence Sample:
                            </span>
                            {alert.evidence.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-700 bg-white p-2 rounded border border-sky-100/80">
                                <span className="font-bold text-slate-500">{item.label}:</span>
                                <span className="text-slate-900 font-semibold">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: SUPPORTING SECURITY EVENTS */}
              {activeTab === 'events' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Correlated Security Telemetry Events
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Raw normalized log events matching the affected systems and time window.
                      </p>
                    </div>
                  </div>

                  <div className="border border-sky-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] font-bold">
                          <th className="p-3">Event ID</th>
                          <th className="p-3">Time</th>
                          <th className="p-3">Source</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Severity</th>
                          <th className="p-3">Message / Payload</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-100">
                        {correlatedEvents.length === 0 ? (
                          events.slice(0, 5).map((evt) => (
                            <tr key={evt.id} className="hover:bg-sky-50/40">
                              <td className="p-3 text-[#0077c8] font-bold">{evt.id}</td>
                              <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">{evt.timestamp}</td>
                              <td className="p-3 text-slate-800 font-sans font-semibold">{evt.sourceType}</td>
                              <td className="p-3 text-slate-700 font-sans">{evt.category}</td>
                              <td className="p-3 uppercase font-bold text-red-600">{evt.severity}</td>
                              <td className="p-3 text-slate-800 font-sans truncate max-w-sm">{evt.originalMessage}</td>
                            </tr>
                          ))
                        ) : (
                          correlatedEvents.map((evt) => (
                            <tr key={evt.id} className="hover:bg-sky-50/40">
                              <td className="p-3 text-[#0077c8] font-bold">{evt.id}</td>
                              <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">{evt.timestamp}</td>
                              <td className="p-3 text-slate-800 font-sans font-semibold">{evt.sourceType}</td>
                              <td className="p-3 text-slate-700 font-sans">{evt.category}</td>
                              <td className="p-3 uppercase font-bold text-red-600">{evt.severity}</td>
                              <td className="p-3 text-slate-800 font-sans truncate max-w-sm">{evt.originalMessage}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 5: INVESTIGATION NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Analyst Investigation Log & Collaboration
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Record forensic discoveries, stakeholder interviews, and hypothesis testing.
                      </p>
                    </div>
                  </div>

                  {/* Existing Notes Feed */}
                  <div className="space-y-3">
                    {selectedIncident.notes.length === 0 ? (
                      <div className="p-6 text-center bg-white border border-sky-200 rounded-xl text-slate-500">
                        No investigation notes added yet. Use the form below to enter the first entry.
                      </div>
                    ) : (
                      selectedIncident.notes.map((note) => (
                        <div key={note.id} className="p-4 bg-white border border-sky-200 rounded-xl space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 font-sans flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0077c8] flex items-center justify-center font-bold text-[10px]">
                                {note.author.charAt(0)}
                              </span>
                              {note.author} <span className="text-slate-500 font-normal">({note.role})</span>
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{note.timestamp}</span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-sans pl-7">
                            {note.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Note Input Box */}
                  <div className="p-5 bg-white border border-sky-200 rounded-2xl space-y-3 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-[#0077c8]" />
                      Append Investigation Finding
                    </span>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Enter forensic notes, user interview confirmation, IP lookup findings, remediation advice..."
                      className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Authoring as: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role})
                      </span>
                      <button
                        onClick={() => {
                          if (!newNoteText.trim()) return;
                          addIncidentNote(selectedIncident.id, newNoteText.trim());
                          setNewNoteText('');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Post Investigation Note
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 6: RECOMMENDED RESPONSE STEPS (PLAYBOOK) */}
              {activeTab === 'playbook' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-[#0077c8]" />
                        Recommended Incident Response Playbook Steps
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Prescribed standard operating procedures tailored to this attack category ({selectedIncident.category}).
                      </p>
                    </div>
                  </div>

                  {/* Playbook Step Checklist */}
                  <div className="bg-white border border-sky-200 rounded-2xl p-5 space-y-3 shadow-xs">
                    {(selectedIncident.recommendedSteps && selectedIncident.recommendedSteps.length > 0
                      ? selectedIncident.recommendedSteps
                      : [
                          'Execute emergency endpoint/asset isolation to sever lateral spread',
                          'Revoke active session tokens and service account credentials across affected directories',
                          'Inspect perimeter firewall egress logs for outbound data exfiltration indicators',
                          'Extract forensic memory dump and disk image for offline reverse engineering',
                          'Notify Ministry Chief Information Security Officer and Legal Compliance Directorate'
                        ]
                    ).map((stepText, idx) => {
                      const isDone = completedSteps[stepText] || idx === 0;
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleStep(stepText)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isDone
                              ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                              : 'bg-[#f8fbff] border-sky-200 text-slate-700 hover:border-[#0077c8]'
                          }`}
                        >
                          <div className="mt-0.5 text-[#0077c8]">
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold font-sans ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                Step {idx + 1}: {stepText}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isDone ? 'COMPLETED' : 'PENDING'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Executed Response Actions History */}
                  <div className="bg-white border border-sky-200 rounded-2xl p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Executed Containment & Remediation Actions
                      </h5>
                      <button
                        onClick={() =>
                          setConfirmActionModal({
                            open: true,
                            actionName: 'Enforce Perimeter Network Block on Attacker Subnet',
                            targetAsset: selectedIncident.affectedAssets[0] || 'Perimeter Firewall',
                            details: 'Drop packet signatures at perimeter border gateway.'
                          })
                        }
                        className="px-3.5 py-1.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        + Execute Containment Action
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedIncident.responseActions.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">No response actions executed yet.</p>
                      ) : (
                        selectedIncident.responseActions.map((act) => (
                          <div key={act.id} className="p-3.5 bg-[#f8fbff] border border-sky-200 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 font-sans">{act.actionName}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {act.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                                Target: {act.targetAsset} · Initiated by {act.initiatedBy} at {act.timestamp}
                              </p>
                              <p className="text-xs text-slate-700 mt-1 font-medium font-sans">{act.resultDetails}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 7: RESOLUTION HISTORY & CASE CLOSE */}
              {activeTab === 'resolution' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <History className="w-4 h-4 text-[#0077c8]" />
                        Resolution History & Root Cause Analysis
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Formal closure audit record, root cause determination, and preventative actions.
                      </p>
                    </div>

                    {selectedIncident.status !== 'closed' && (
                      <button
                        onClick={() => setCloseModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        Formally Close Incident
                      </button>
                    )}
                  </div>

                  {/* Documented Closed Resolution Dossier */}
                  {selectedIncident.closedResolution ? (
                    <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          Official Signed Incident Resolution Dossier
                        </div>
                        <span className="font-mono text-xs text-emerald-800 font-bold">
                          Closed: {selectedIncident.closedResolution.resolvedAt}
                        </span>
                      </div>

                      <div className="space-y-2 bg-white p-4 rounded-xl border border-emerald-100 text-xs font-sans">
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Determined Root Cause:</strong>
                          <p className="text-slate-700 leading-relaxed">{selectedIncident.closedResolution.rootCause}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <strong className="text-slate-900 block mb-0.5">Resolution Summary & Containment Verification:</strong>
                          <p className="text-slate-700 leading-relaxed">{selectedIncident.closedResolution.resolutionSummary}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <strong className="text-slate-900 block mb-0.5">Preventative Hardening Action:</strong>
                          <p className="text-slate-700 leading-relaxed">{selectedIncident.closedResolution.preventativeAction}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                          Authorized by: <strong className="text-slate-800">{selectedIncident.closedResolution.resolvedBy}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                      <span>Case is currently open ({selectedIncident.status.toUpperCase()}). Click "Formally Close Incident" once all containment steps and post-incident reviews are concluded.</span>
                    </div>
                  )}

                  {/* Resolution Milestones Timeline */}
                  <div className="bg-white border border-sky-200 rounded-2xl p-5 space-y-3 shadow-xs">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Chronological Resolution Milestones
                    </h5>

                    <div className="border border-sky-100 rounded-xl overflow-hidden font-mono text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-600 uppercase text-[10px] font-bold">
                            <th className="p-3">Timestamp</th>
                            <th className="p-3 font-sans">Action / Milestone</th>
                            <th className="p-3 font-sans">Operator</th>
                            <th className="p-3 font-sans">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100">
                          {(selectedIncident.resolutionHistory && selectedIncident.resolutionHistory.length > 0
                            ? selectedIncident.resolutionHistory
                            : [
                                {
                                  timestamp: selectedIncident.detectionTime,
                                  action: 'Initial Detection & Case Opening',
                                  performedBy: 'SIEM Correlation Engine',
                                  details: 'Case initiated from high-confidence security telemetry.'
                                },
                                {
                                  timestamp: selectedIncident.lastUpdated,
                                  action: 'Triage & Containment Review',
                                  performedBy: selectedIncident.assignedAnalyst,
                                  details: 'Containment actions evaluated against affected systems.'
                                }
                              ]
                          ).map((m, idx) => (
                            <tr key={idx} className="hover:bg-sky-50/30">
                              <td className="p-3 text-slate-500 whitespace-nowrap text-[11px]">{m.timestamp}</td>
                              <td className="p-3 text-[#0077c8] font-bold font-sans">{m.action}</td>
                              <td className="p-3 text-slate-900 font-sans font-medium">{m.performedBy}</td>
                              <td className="p-3 text-slate-700 font-sans">{m.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INCIDENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600" />
                Document New Security Incident
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taxpayer Data Exposure: Unusual Bulk Export Attempt"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity Rating</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
                    className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-hidden focus:border-[#0077c8]"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incident Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detection Source</label>
                  <input
                    type="text"
                    required
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Affected System / Asset</label>
                  <input
                    type="text"
                    required
                    value={newAffectedAssets}
                    onChange={(e) => setNewAffectedAssets(e.target.value)}
                    className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Incident Description (Summary)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Concise overview of what occurred and immediate potential impact..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Technical Vectors</label>
                <textarea
                  rows={3}
                  placeholder="Full technical analysis, logs observed, source IPs, commands executed..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100 font-sans">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Open Incident Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM RESPONSE ACTION MODAL */}
      {confirmActionModal.open && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600" />
              Execute Active Containment Action
            </h4>
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl space-y-1 text-slate-800">
              <span className="font-bold text-red-700 block text-xs">{confirmActionModal.actionName}</span>
              <p className="font-mono text-[11px] text-slate-600">Target Asset: {confirmActionModal.targetAsset}</p>
              <p className="text-xs text-slate-700 mt-1">{confirmActionModal.details}</p>
            </div>
            <p className="text-slate-500 text-[11px]">
              This action will be audited under operator profile <strong>{currentUser.name}</strong> and recorded in the immutable SOC audit log.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
              <button
                onClick={() => setConfirmActionModal({ open: false, actionName: '', targetAsset: '', details: '' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleExecuteAction(
                    confirmActionModal.actionName,
                    confirmActionModal.targetAsset,
                    confirmActionModal.details
                  )
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL CLOSE RESOLUTION MODAL */}
      {closeModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Close Incident with Formal Resolution
              </h4>
              <button onClick={() => setCloseModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Root Cause Determination</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. SQL injection vulnerability in unvalidated search parameter..."
                  value={closeRootCause}
                  onChange={(e) => setCloseRootCause(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Summary & Containment Verification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. WAF filter deployed, credentials rotated, integrity of databases verified with zero data loss..."
                  value={closeSummary}
                  onChange={(e) => setCloseSummary(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preventative Action / Hardening</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Code patch scheduled, mandatory MFA enforced, periodic vulnerability scanning configured..."
                  value={closePreventative}
                  onChange={(e) => setClosePreventative(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-sans focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100 font-sans">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Sign & Close Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
