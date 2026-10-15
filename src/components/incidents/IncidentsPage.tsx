import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import {
  Incident,
  Severity,
  IncidentStatus,
  IncidentTimelineItem,
  InvestigationNote
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
  ArrowRight
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
    auditLogs
  } = useSOC();

  // Create Incident Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<Severity>('high');
  const [newSource, setNewSource] = useState('Windows Endpoints');
  const [newAffectedAssets, setNewAffectedAssets] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Active Tab inside Incident Detail
  const [activeTab, setActiveTab] = useState<
    'overview' | 'events' | 'timeline' | 'notes' | 'assets' | 'actions' | 'audit'
  >('overview');

  // Input states for Incident Detail actions
  const [newNoteText, setNewNoteText] = useState('');
  const [reassignName, setReassignName] = useState(currentUser.name);
  const [severityChangeReason, setSeverityChangeReason] = useState('');
  const [targetSeverity, setTargetSeverity] = useState<Severity>('critical');

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

  // Filter incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (incidentFilters.severity && incidentFilters.severity !== 'ALL') {
      if (inc.severity !== incidentFilters.severity) return false;
    }
    if (incidentFilters.status && incidentFilters.status !== 'ALL') {
      if (inc.status !== incidentFilters.status) return false;
    }
    if (incidentFilters.search) {
      const q = incidentFilters.search.toLowerCase();
      const match =
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.summary.toLowerCase().includes(q) ||
        inc.assignedAnalyst.toLowerCase().includes(q) ||
        inc.affectedAssets.some((a) => a.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) {
      alert('Please fill out all required fields.');
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
      affectedAssets: assetsList.length > 0 ? assetsList : ['WS-FINANCE-019'],
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
    setNewAffectedAssets('');
    setSelectedIncidentId(created.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            Security Incident Management
          </h2>
          
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white text-xs font-bold rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Security Incident
        </button>
      </div>

      {/* Filter and Search Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, analyst, asset..."
            value={incidentFilters.search || ''}
            onChange={(e) => setIncidentFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
          />
        </div>

        {/* Severity */}
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

        {/* Status */}
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
      </div>

      {/* Main Incident Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Incident ID</th>
                <th className="py-3.5 px-3.5">Title & Summary</th>
                <th className="py-3.5 px-3.5">Severity</th>
                <th className="py-3.5 px-3.5">Status</th>
                <th className="py-3.5 px-3.5">Detection Time</th>
                <th className="py-3.5 px-3.5">Affected Assets</th>
                <th className="py-3.5 px-3.5">Assigned Analyst</th>
                <th className="py-3.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No security incidents found matching filter.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-bold text-[#0077c8] whitespace-nowrap">
                      {inc.id}
                    </td>
                    <td className="py-3 px-3.5 font-sans max-w-sm">
                      <div className="font-bold text-slate-900">{inc.title}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{inc.summary}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
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
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          inc.status === 'new'
                            ? 'bg-sky-50 text-[#0066b3] border border-sky-200'
                            : inc.status === 'investigating'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inc.status === 'contained'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : inc.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      {inc.detectionTime}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 text-[11px] whitespace-nowrap font-sans font-medium">
                      {inc.affectedAssets.join(', ')}
                    </td>
                    <td className="py-3 px-3.5 font-sans text-slate-800 font-semibold whitespace-nowrap">
                      {inc.assignedAnalyst}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncidentId(inc.id);
                        }}
                        className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#0077c8] border border-sky-200 rounded-lg text-xs font-sans font-bold transition-colors"
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

      {/* Incident Detail Full Workspace Modal (Exact 7 Tabs) */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-sky-200 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0077c8]">{selectedIncident.id}</span>
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
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-white border border-sky-200 text-slate-700 font-bold">
                      {selectedIncident.status}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
                    {selectedIncident.title}
                  </h3>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedIncident.status !== 'closed' && (
                  <>
                    <select
                      value={selectedIncident.status}
                      onChange={(e) => updateIncidentStatus(selectedIncident.id, e.target.value as IncidentStatus)}
                      className="bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold shadow-2xs"
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
                )}

                <button
                  onClick={() => setSelectedIncidentId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Exact 7 Tabs Required by Section 8 */}
            <div className="flex items-center gap-1 px-4 border-b border-sky-200 bg-sky-50/30 overflow-x-auto text-xs shrink-0">
              {[
                { id: 'overview', label: '1. Overview', icon: FileText },
                { id: 'events', label: '2. Related Events', icon: ShieldAlert },
                { id: 'timeline', label: '3. Timeline', icon: Clock },
                { id: 'notes', label: '4. Investigation Notes', icon: Send },
                { id: 'assets', label: '5. Affected Assets', icon: HardDrive },
                { id: 'actions', label: '6. Response Actions', icon: Lock },
                { id: 'audit', label: '7. Audit History', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-3.5 py-3 font-semibold whitespace-nowrap border-b-2 transition-all ${
                      isActive
                        ? 'border-[#0077c8] text-[#0077c8] font-bold bg-white rounded-t-lg'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body with 7 Tabs */}
            <div className="flex-1 overflow-y-auto p-6 text-xs">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#f8fbff] rounded-xl border border-sky-200">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold block">Detection Time</span>
                      <span className="font-mono text-slate-800 text-xs font-bold">{selectedIncident.detectionTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold block">Assigned Analyst</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-900 font-bold">{selectedIncident.assignedAnalyst}</span>
                        <button
                          onClick={() => {
                            const name = prompt('Reassign incident to analyst:', currentUser.name);
                            if (name) assignIncident(selectedIncident.id, name);
                          }}
                          className="text-[10px] text-[#0077c8] font-bold hover:underline"
                        >
                          Reassign
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-bold block">Telemetry Source</span>
                      <span className="text-slate-800 text-xs font-semibold">{selectedIncident.source}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Incident Summary
                    </h4>
                    <p className="p-4 bg-[#f8fbff] rounded-xl border border-sky-200 text-slate-800 text-xs leading-relaxed">
                      {selectedIncident.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Technical Description & Vectors
                    </h4>
                    <p className="p-4 bg-[#f8fbff] rounded-xl border border-sky-200 text-slate-800 text-xs leading-relaxed">
                      {selectedIncident.description}
                    </p>
                  </div>

                  {/* If closed, show Resolution Summary */}
                  {selectedIncident.closedResolution && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Formal Resolution Record (Closed Case)
                      </div>
                      <p className="text-slate-800 text-xs">
                        <strong>Root Cause:</strong> {selectedIncident.closedResolution.rootCause}
                      </p>
                      <p className="text-slate-800 text-xs">
                        <strong>Resolution Summary:</strong> {selectedIncident.closedResolution.resolutionSummary}
                      </p>
                      <p className="text-slate-800 text-xs">
                        <strong>Preventative Action:</strong> {selectedIncident.closedResolution.preventativeAction}
                      </p>
                      <p className="text-slate-500 text-[11px] font-mono">
                        Resolved by {selectedIncident.closedResolution.resolvedBy} on {selectedIncident.closedResolution.resolvedAt}
                      </p>
                    </div>
                  )}

                  {/* Reclassify Severity with Authorization Reason */}
                  <div className="p-4 bg-[#f8fbff] rounded-xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-700 font-semibold">
                      Reclassify Severity (Requires authorization note):
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={targetSeverity}
                        onChange={(e) => setTargetSeverity(e.target.value as Severity)}
                        className="bg-white border border-sky-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Reason for reclassification..."
                        value={severityChangeReason}
                        onChange={(e) => setSeverityChangeReason(e.target.value)}
                        className="bg-white border border-sky-200 rounded-lg px-3 py-1 text-xs text-slate-800 placeholder-slate-400"
                      />
                      <button
                        onClick={() => {
                          if (!severityChangeReason.trim()) {
                            alert('Please state a reason for reclassifying severity.');
                            return;
                          }
                          updateIncidentSeverity(selectedIncident.id, targetSeverity, severityChangeReason.trim());
                          setSeverityChangeReason('');
                        }}
                        className="px-3 py-1 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-lg text-xs font-bold"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RELATED EVENTS */}
              {activeTab === 'events' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Security events correlated to this incident case:
                  </p>
                  <div className="border border-sky-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] font-bold">
                          <th className="p-3">Event ID</th>
                          <th className="p-3">Time</th>
                          <th className="p-3">Source</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Severity</th>
                          <th className="p-3">Summary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-100">
                        {events.slice(0, 4).map((evt) => (
                          <tr key={evt.id} className="hover:bg-sky-50/40">
                            <td className="p-3 text-[#0077c8] font-bold">{evt.id}</td>
                            <td className="p-3 text-slate-500 text-[11px]">{evt.timestamp}</td>
                            <td className="p-3 text-slate-800 font-sans font-semibold">{evt.sourceType}</td>
                            <td className="p-3 text-slate-700 font-sans">{evt.category}</td>
                            <td className="p-3 uppercase font-bold text-red-600">{evt.severity}</td>
                            <td className="p-3 text-slate-800 font-sans truncate max-w-xs">{evt.originalMessage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200">
                    {selectedIncident.timeline.map((item) => (
                      <div key={item.id} className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#0077c8] ring-4 ring-sky-100" />
                        <div className="p-4 bg-[#f8fbff] rounded-xl border border-sky-200 shadow-2xs">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-900">{item.action}</span>
                            <span className="text-[11px] font-mono text-slate-500">{item.timestamp}</span>
                          </div>
                          <span className="text-[11px] text-[#0077c8] font-mono font-semibold block">By: {item.user}</span>
                          {item.note && (
                            <p className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-sky-100">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: INVESTIGATION NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {selectedIncident.notes.length === 0 ? (
                      <p className="text-slate-500 text-xs italic">No investigation notes entered yet.</p>
                    ) : (
                      selectedIncident.notes.map((note) => (
                        <div key={note.id} className="p-4 bg-[#f8fbff] border border-sky-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{note.author} ({note.role})</span>
                            <span className="text-[11px] font-mono text-slate-500">{note.timestamp}</span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Note Form */}
                  <div className="p-4 bg-white border border-sky-200 rounded-xl space-y-2.5 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Add Analyst Investigation Note
                    </span>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Record investigative findings, forensic analysis, user interview details..."
                      className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          if (!newNoteText.trim()) return;
                          addIncidentNote(selectedIncident.id, newNoteText.trim());
                          setNewNoteText('');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Post Note
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AFFECTED ASSETS */}
              {activeTab === 'assets' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedIncident.affectedAssets.map((assetName) => (
                      <div key={assetName} className="p-4 bg-[#f8fbff] border border-sky-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{assetName}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                            Compromised / Under Audit
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono">
                          Department: Directorate of Finance & Large Taxpayers Office
                        </p>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() =>
                              setConfirmActionModal({
                                open: true,
                                actionName: 'Isolate Host from Corporate Network',
                                targetAsset: assetName,
                                details: 'Quarantine device network adapter via endpoint security agent.'
                              })
                            }
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Quarantine Host
                          </button>
                          <button
                            onClick={() =>
                              setConfirmActionModal({
                                open: true,
                                actionName: 'Trigger Deep EDR Memory Dump',
                                targetAsset: assetName,
                                details: 'Capture volatile RAM memory image for forensic extraction.'
                              })
                            }
                            className="px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                          >
                            Memory Dump
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: RESPONSE ACTIONS */}
              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Remediation and containment actions executed for this case:
                    </span>
                    <button
                      onClick={() =>
                        setConfirmActionModal({
                          open: true,
                          actionName: 'Block Outbound C2 Destination IP at Palo Alto Firewalls',
                          targetAsset: 'FW-PERIMETER-01',
                          details: 'Apply drop rule at edge perimeter for flagged malicious IP address.'
                        })
                      }
                      className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      + Execute Remediation Action
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedIncident.responseActions.length === 0 ? (
                      <p className="text-slate-500 text-xs italic">No response actions taken yet.</p>
                    ) : (
                      selectedIncident.responseActions.map((act) => (
                        <div key={act.id} className="p-4 bg-[#f8fbff] border border-sky-200 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{act.actionName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {act.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-mono">
                              Target: {act.targetAsset} · Initiated by {act.initiatedBy} at {act.timestamp}
                            </p>
                            <p className="text-xs text-slate-700 mt-1 font-medium">{act.resultDetails}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: AUDIT HISTORY */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Immutable security log of all analyst actions and modifications:
                  </p>
                  <div className="border border-sky-200 rounded-xl overflow-hidden bg-white font-mono text-xs shadow-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] font-bold">
                          <th className="p-3">Time</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Result</th>
                          <th className="p-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-100">
                        {auditLogs.slice(0, 6).map((log) => (
                          <tr key={log.id} className="hover:bg-sky-50/40">
                            <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                            <td className="p-3 text-slate-900 font-sans font-bold">{log.user}</td>
                            <td className="p-3 text-[#0077c8] font-bold">{log.action}</td>
                            <td className="p-3 text-emerald-700 font-bold">{log.result}</td>
                            <td className="p-3 text-slate-700 font-sans truncate max-w-xs">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-sky-200/80 flex justify-between items-center bg-sky-50/40 rounded-b-2xl">
              <span className="text-[11px] text-slate-500 font-mono">
                Case ID: {selectedIncident.id} · Created: {selectedIncident.detectionTime}
              </span>
              <button
                onClick={() => setSelectedIncidentId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Consequential Response Actions */}
      {confirmActionModal.open && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Confirm Security Containment Action</h4>
                <p className="text-xs text-slate-500">Authorization & audit signature required</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#f8fbff] rounded-xl border border-sky-200 text-xs space-y-1 font-mono">
              <p><strong className="text-slate-800">Action:</strong> {confirmActionModal.actionName}</p>
              <p><strong className="text-slate-800">Target Asset:</strong> {confirmActionModal.targetAsset}</p>
              <p className="text-slate-600 font-sans mt-1">{confirmActionModal.details}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmActionModal({ open: false, actionName: '', targetAsset: '', details: '' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedIncident) {
                    addResponseAction(
                      selectedIncident.id,
                      confirmActionModal.actionName,
                      confirmActionModal.targetAsset,
                      `Executed successfully. Verified by ${currentUser.name}`
                    );
                  }
                  setConfirmActionModal({ open: false, actionName: '', targetAsset: '', details: '' });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Authorize & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formal Resolution & Close Modal */}
      {closeModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Document Case Resolution</h4>
                <p className="text-xs text-slate-500">Formal closure of Incident {selectedIncident.id}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Root Cause Analysis *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Malicious Word macro attachment executed by finance user"
                  value={closeRootCause}
                  onChange={(e) => setCloseRootCause(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Resolution Summary *
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Workstation isolated, C2 IP blocked at perimeter, malware payload purged from disk."
                  value={closeSummary}
                  onChange={(e) => setCloseSummary(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Preventative Action Taken *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Strengthen email gateway VBA macro attachment filtering policy."
                  value={closePreventative}
                  onChange={(e) => setClosePreventative(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCloseModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!closeRootCause.trim() || !closeSummary.trim() || !closePreventative.trim()) {
                    alert('Please complete all three resolution fields.');
                    return;
                  }
                  closeIncidentWithResolution(selectedIncident.id, {
                    rootCause: closeRootCause.trim(),
                    resolutionSummary: closeSummary.trim(),
                    preventativeAction: closePreventative.trim()
                  });
                  setCloseModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Confirm Resolution & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white border border-sky-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs"
          >
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Manually Open New Security Incident
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Incident Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Unauthorized database query spike on core taxpayer registry"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as Severity)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Source System</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="Windows Endpoints">Windows Endpoints</option>
                  <option value="Active Directory">Active Directory</option>
                  <option value="Database servers">Database servers</option>
                  <option value="Web server and applications">Web server and applications</option>
                  <option value="Firewall">Firewall</option>
                  <option value="VPN">VPN</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Affected Assets (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. DB-TAX-01.revenue.gov.et, WS-FINANCE-019"
                value={newAffectedAssets}
                onChange={(e) => setNewAffectedAssets(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Summary *</label>
              <textarea
                rows={2}
                required
                placeholder="Brief executive summary of observed threat..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold transition-colors shadow-xs"
              >
                Create Incident Case
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
