import React, { useState, useMemo } from 'react';
import { useSOC } from '../../context/SOCContext';
import { SecurityEvent, Severity, EventCategory } from '../../types/soc';
import {
  Search,
  Filter,
  Download,
  ShieldAlert,
  ArrowUpDown,
  X,
  ExternalLink,
  Copy,
  Check,
  Code2,
  ListFilter
} from 'lucide-react';

export const SecurityEventsPage: React.FC = () => {
  const {
    events,
    eventFilters,
    setEventFilters,
    selectedEvent,
    setSelectedEventId,
    logSources
  } = useSOC();

  const [copiedRaw, setCopiedRaw] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Sorting
  const [sortField, setSortField] = useState<'timestamp' | 'severity' | 'sourceName' | 'hostname'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'timestamp' | 'severity' | 'sourceName' | 'hostname') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter application
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Search text
      if (eventFilters.search) {
        const query = eventFilters.search.toLowerCase();
        const matchesQuery =
          evt.id.toLowerCase().includes(query) ||
          evt.hostname.toLowerCase().includes(query) ||
          (evt.username && evt.username.toLowerCase().includes(query)) ||
          (evt.srcIp && evt.srcIp.toLowerCase().includes(query)) ||
          (evt.destIp && evt.destIp.toLowerCase().includes(query)) ||
          evt.originalMessage.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Severity filter
      if (eventFilters.severity && eventFilters.severity !== 'ALL') {
        if (evt.severity !== eventFilters.severity) return false;
      }

      // Category filter
      if (eventFilters.category && eventFilters.category !== 'ALL') {
        if (evt.category !== eventFilters.category) return false;
      }

      // Source filter
      if (eventFilters.source && eventFilters.source !== 'ALL') {
        if (
          !evt.sourceType.toLowerCase().includes(eventFilters.source.toLowerCase()) &&
          !evt.sourceName.toLowerCase().includes(eventFilters.source.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, eventFilters]);

  // Sorting application
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'severity') {
        const weight: Record<Severity, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
          info: 0
        };
        comparison = weight[a.severity] - weight[b.severity];
      } else if (sortField === 'sourceName') {
        comparison = a.sourceType.localeCompare(b.sourceType);
      } else if (sortField === 'hostname') {
        comparison = a.hostname.localeCompare(b.hostname);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredEvents, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedEvents.length / pageSize) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEvents.slice(start, start + pageSize);
  }, [sortedEvents, currentPage, pageSize]);

  // Export CSV
  const exportToCSV = () => {
    const headers = [
      'Event ID',
      'Timestamp',
      'Severity',
      'Source Type',
      'Category',
      'Hostname',
      'Username',
      'Source IP',
      'Dest IP',
      'Message'
    ];
    const rows = sortedEvents.map((e) => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.severity}"`,
      `"${e.sourceType}"`,
      `"${e.category}"`,
      `"${e.hostname}"`,
      `"${e.username || ''}"`,
      `"${e.srcIp || ''}"`,
      `"${e.destIp || ''}"`,
      `"${e.originalMessage.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MoR_SOC_Security_Events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyRawToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const categories: (EventCategory | 'ALL')[] = [
    'ALL',
    'Authentication',
    'Network',
    'Malware',
    'Web Application',
    'System',
    'Endpoint',
    'DNS and DHCP'
  ];

  const severities: (Severity | 'ALL')[] = ['ALL', 'critical', 'high', 'medium', 'low', 'info'];

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
         
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#0077c8]" />
            Security Event Explorer
          </h2>
         
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 text-xs font-bold rounded-xl transition-all shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#0077c8]" />
          Export Search to CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-sky-200/80 rounded-2xl p-5 space-y-3.5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by event text, ID, user, IP, or hostname..."
              value={eventFilters.search || ''}
              onChange={(e) => {
                setEventFilters((prev) => ({ ...prev, search: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
            />
            {eventFilters.search && (
              <button
                onClick={() => setEventFilters((prev) => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={eventFilters.severity || 'ALL'}
              onChange={(e) => {
                setEventFilters((prev) => ({ ...prev, severity: e.target.value as Severity | 'ALL' }));
                setCurrentPage(1);
              }}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  Severity: {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={eventFilters.category || 'ALL'}
              onChange={(e) => {
                setEventFilters((prev) => ({ ...prev, category: e.target.value as EventCategory | 'ALL' }));
                setCurrentPage(1);
              }}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Source Filter Tags */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-sky-100 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] font-bold shrink-0">Source Filter:</span>
          <button
            onClick={() => setEventFilters((prev) => ({ ...prev, source: 'ALL' }))}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              !eventFilters.source || eventFilters.source === 'ALL'
                ? 'bg-[#0077c8] text-white shadow-xs'
                : 'bg-sky-50 text-slate-600 hover:bg-sky-100 hover:text-[#0077c8] border border-sky-200'
            }`}
          >
            All Sources ({events.length})
          </button>
          {logSources.slice(0, 7).map((s) => {
            const isSelected = eventFilters.source === s.name || eventFilters.source === s.type;
            return (
              <button
                key={s.id}
                onClick={() => setEventFilters((prev) => ({ ...prev, source: isSelected ? 'ALL' : s.name }))}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#0077c8] text-white shadow-xs'
                    : 'bg-sky-50 text-slate-600 hover:bg-sky-100 hover:text-[#0077c8] border border-sky-200'
                }`}
              >
                {s.type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Data Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th
                  onClick={() => handleSort('timestamp')}
                  className="py-3.5 px-3.5 cursor-pointer hover:text-[#0077c8]"
                >
                  <div className="flex items-center gap-1">
                    Timestamp <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5">Event ID</th>
                <th
                  onClick={() => handleSort('severity')}
                  className="py-3.5 px-3.5 cursor-pointer hover:text-[#0077c8]"
                >
                  <div className="flex items-center gap-1">
                    Severity <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sourceName')}
                  className="py-3.5 px-3.5 cursor-pointer hover:text-[#0077c8]"
                >
                  <div className="flex items-center gap-1">
                    Source <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('hostname')}
                  className="py-3.5 px-3.5 cursor-pointer hover:text-[#0077c8]"
                >
                  <div className="flex items-center gap-1">
                    Host / User <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-3.5">Category</th>
                <th className="py-3.5 px-3.5">Network Flow</th>
                <th className="py-3.5 px-3.5">Event Summary</th>
                <th className="py-3.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No security events matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {evt.timestamp}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-[#0077c8] whitespace-nowrap">
                      {evt.id}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          evt.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : evt.severity === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : evt.severity === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-sans font-medium text-slate-700 max-w-[130px] truncate">
                      {evt.sourceType}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{evt.hostname}</span>
                        {evt.username && (
                          <span className="text-[10px] text-slate-500">{evt.username}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-sans text-slate-700 whitespace-nowrap">
                      {evt.category}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                      {evt.srcIp ? `${evt.srcIp}${evt.destIp ? ` → ${evt.destIp}` : ''}` : '-'}
                    </td>
                    <td className="py-3 px-3.5 font-sans text-slate-800 max-w-xs truncate">
                      {evt.originalMessage}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(evt.id);
                        }}
                        className="text-xs text-[#0077c8] hover:underline font-sans font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 bg-sky-50/50 border-t border-sky-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong className="text-slate-900">{filteredEvents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-slate-900">{Math.min(currentPage * pageSize, filteredEvents.length)}</strong> of{' '}
            <strong className="text-slate-900">{filteredEvents.length}</strong> events
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Previous
            </button>
            <span className="px-2 py-1 font-mono text-slate-700 font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Event Record Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-[#0077c8]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Event Record: <span className="font-mono text-[#0077c8]">{selectedEvent.id}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Ingested at: {selectedEvent.collectionTimestamp}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Event Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f8fbff] rounded-xl border border-sky-200">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Severity</span>
                  <span
                    className={`font-bold uppercase text-xs ${
                      selectedEvent.severity === 'critical'
                        ? 'text-red-600'
                        : selectedEvent.severity === 'high'
                        ? 'text-amber-600'
                        : 'text-[#0077c8]'
                    }`}
                  >
                    {selectedEvent.severity}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Category</span>
                  <span className="font-bold text-slate-800">{selectedEvent.category}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Host / System</span>
                  <span className="font-mono text-slate-800 font-bold truncate block">{selectedEvent.hostname}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Parsing Status</span>
                  <span className="font-mono text-emerald-700 font-bold uppercase">{selectedEvent.parsingStatus}</span>
                </div>
              </div>

              {/* Normalized Key-Value Fields */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <ListFilter className="w-4 h-4 text-[#0077c8]" /> Normalized Fields
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#f8fbff] p-4 rounded-xl border border-sky-200 font-mono text-[11px]">
                  {Object.entries(selectedEvent.normalizedFields).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white border border-sky-100">
                      <span className="text-slate-500">{key}:</span>
                      <span className="text-slate-900 font-bold truncate ml-2 max-w-[200px]">{String(val)}</span>
                    </div>
                  ))}
                  {selectedEvent.username && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-sky-100">
                      <span className="text-slate-500">username:</span>
                      <span className="text-slate-900 font-bold">{selectedEvent.username}</span>
                    </div>
                  )}
                  {selectedEvent.srcIp && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-sky-100">
                      <span className="text-slate-500">source_ip:</span>
                      <span className="text-[#0077c8] font-bold">{selectedEvent.srcIp}</span>
                    </div>
                  )}
                  {selectedEvent.destIp && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-sky-100">
                      <span className="text-slate-500">destination_ip:</span>
                      <span className="text-[#0077c8] font-bold">{selectedEvent.destIp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Event Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-amber-600" /> Original Raw Log Payload
                  </h4>
                  <button
                    onClick={() => copyRawToClipboard(selectedEvent.originalMessage)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRaw ? 'Copied' : 'Copy Raw'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-[#f0f4fa] rounded-xl border border-sky-200 text-slate-800 font-mono text-[11px] whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">
                  {selectedEvent.originalMessage}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-sky-100 flex justify-end">
              <button
                onClick={() => setSelectedEventId(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
