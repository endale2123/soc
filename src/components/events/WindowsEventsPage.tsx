import React, { useState, useEffect, useCallback } from 'react';
import { useSOC } from '../../context/SOCContext';
import { socApi } from '../../services/socApi';
import { WindowsEventSummary } from '../../types/backend';
import {
  FileCode2,
  Search,
  RefreshCw,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  LogIn,
  ShieldAlert
} from 'lucide-react';

const SUPPORTED_EVENT_IDS = [
  { id: 4624, label: '4624 · Successful Logon' },
  { id: 4625, label: '4625 · Failed Logon' },
  { id: 4634, label: '4634 · Logoff' },
  { id: 4648, label: '4648 · Explicit Credentials' },
  { id: 4672, label: '4672 · Special Privileges' },
  { id: 4688, label: '4688 · Process Creation' },
  { id: 4697, label: '4697 · Service Installed' },
  { id: 4698, label: '4698 · Scheduled Task Created' },
  { id: 4702, label: '4702 · Scheduled Task Updated' },
  { id: 4719, label: '4719 · Audit Policy Changed' },
  { id: 4720, label: '4720 · User Account Created' },
  { id: 4722, label: '4722 · User Account Enabled' },
  { id: 4724, label: '4724 · Password Reset Attempt' },
  { id: 4728, label: '4728 · Global Group Member Added' },
  { id: 4732, label: '4732 · Local Group Member Added' },
  { id: 4740, label: '4740 · Account Locked Out' },
  { id: 4768, label: '4768 · Kerberos TGT Request' },
  { id: 4769, label: '4769 · Kerberos Service Ticket' },
  { id: 4771, label: '4771 · Kerberos Pre-Auth Failed' },
  { id: 4776, label: '4776 · NTLM Credential Validation' },
  { id: 1102, label: '1102 · Audit Log Cleared' },
  { id: 7045, label: '7045 · System Service Installed' }
];

export const WindowsEventsPage: React.FC = () => {
  const { dataMode, setLoginModalOpen } = useSOC();

  const [items, setItems] = useState<WindowsEventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventIdFilter, setEventIdFilter] = useState<string>('ALL');
  const [hostname, setHostname] = useState('');
  const [username, setUsername] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [channel, setChannel] = useState('ALL');
  const [srcIp, setSrcIp] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Inspector Drawer / Modal
  const [selectedDetail, setSelectedDetail] = useState<WindowsEventSummary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  const loadEvents = useCallback(async () => {
    if (dataMode !== 'live') {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await socApi.getWindowsEvents({
        eventId: eventIdFilter !== 'ALL' ? eventIdFilter : undefined,
        hostname: hostname.trim() || undefined,
        username: username.trim() || undefined,
        severity: severity !== 'ALL' ? severity : undefined,
        channel: channel !== 'ALL' ? channel : undefined,
        srcIp: srcIp.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        search: search.trim() || undefined,
        page,
        pageSize: 25
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query Windows security events');
    } finally {
      setLoading(false);
    }
  }, [dataMode, eventIdFilter, hostname, username, severity, channel, srcIp, startDate, endDate, search, page]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setCopiedXml(false);
    try {
      const res = await socApi.getWindowsEventDetail(id);
      setSelectedDetail(res.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Windows event XML');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCopyXml = async () => {
    if (!selectedDetail?.rawXml) return;
    await navigator.clipboard.writeText(selectedDetail.rawXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-[#0077c8]" />
            Windows Security Events Explorer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Forensic inspection of normalized Windows Event Log records, command-line telemetry, and raw Event XML.
          </p>
        </div>

        {dataMode === 'live' && (
          <button
            onClick={loadEvents}
            className="px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0077c8] ${loading ? 'animate-spin' : ''}`} />
            Refresh Stream
          </button>
        )}
      </div>

      {dataMode === 'demo' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Live Backend Session Required</p>
              <p className="text-amber-800 mt-0.5">
                Windows Event Log ingestion & raw XML inspection requires an authenticated backend session. Sign in to query PostgreSQL telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        </div>
      )}

      {/* Multi-Criteria Filter Grid */}
      <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search process, command line, message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-[#f8fbff] border border-sky-200 rounded-xl"
            />
          </div>

          <select
            value={eventIdFilter}
            onChange={(e) => {
              setEventIdFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 font-mono font-medium"
          >
            <option value="ALL">All Windows Event IDs</option>
            {SUPPORTED_EVENT_IDS.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>

          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 font-medium"
          >
            <option value="ALL">All Event Channels</option>
            <option value="Security">Security</option>
            <option value="System">System</option>
            <option value="Application">Application</option>
            <option value="Microsoft-Windows-PowerShell/Operational">PowerShell Operational</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Hostname..."
            value={hostname}
            onChange={(e) => {
              setHostname(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2"
          />
          <input
            type="text"
            placeholder="Username..."
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2"
          />
          <input
            type="text"
            placeholder="Source IP..."
            value={srcIp}
            onChange={(e) => {
              setSrcIp(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 font-mono"
          />
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 font-mono"
            title="Start Date/Time"
          />
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 font-mono"
            title="End Date/Time"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Windows Events Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Timestamp</th>
                <th className="py-3.5 px-3.5">Event ID</th>
                <th className="py-3.5 px-3.5">Channel</th>
                <th className="py-3.5 px-3.5">Hostname</th>
                <th className="py-3.5 px-3.5">Account / Source IP</th>
                <th className="py-3.5 px-3.5">Severity</th>
                <th className="py-3.5 px-3.5">Telemetry Details</th>
                <th className="py-3.5 px-3.5 text-right">XML / Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    {loading
                      ? 'Querying Windows security events...'
                      : 'No Windows security events matched the current filters.'}
                  </td>
                </tr>
              ) : (
                items.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => openDetail(ev.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {String(ev.timestamp).replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-[#0077c8] border border-sky-200">
                        {ev.windowsEventId}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-700">{ev.channel}</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-900">{ev.hostname}</td>
                    <td className="py-3 px-3.5 font-mono text-[11px]">
                      <div className="text-slate-900 font-semibold">{ev.username || 'N/A'}</div>
                      {ev.srcIp && <div className="text-[#0077c8]">{ev.srcIp}</div>}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : ev.severity === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : ev.severity === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {ev.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 max-w-md">
                      <div className="truncate font-medium">{ev.message}</div>
                      {ev.commandLine && (
                        <div className="font-mono text-[10px] text-slate-500 truncate mt-0.5">
                          {ev.commandLine}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(ev.id);
                        }}
                        className="px-3 py-1 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-lg text-[11px] font-bold"
                      >
                        {ev.hasRawXml ? 'Inspect XML' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="px-4 py-3 border-t border-sky-100 bg-sky-50/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-mono">
              Page {page} of {totalPages} ({total.toLocaleString()} Windows events)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail & Raw XML Modal */}
      {(selectedDetail || detailLoading) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Windows Event Forensic Record{' '}
                  {selectedDetail && (
                    <span className="font-mono text-[#0077c8]">
                      (Event ID {selectedDetail.windowsEventId})
                    </span>
                  )}
                </h3>
                {selectedDetail && (
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {selectedDetail.id} · {selectedDetail.providerName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-slate-500">Loading Windows Event XML...</div>
            ) : (
              selectedDetail && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#f8fbff] rounded-xl border border-sky-200 font-mono">
                    <div>
                      <span className="text-[10px] font-sans uppercase text-slate-500 font-bold block">Hostname</span>
                      <span className="font-bold text-slate-900">{selectedDetail.hostname}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans uppercase text-slate-500 font-bold block">Target User</span>
                      <span className="font-bold text-slate-900">{selectedDetail.targetUsername || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans uppercase text-slate-500 font-bold block">Source IP</span>
                      <span className="font-bold text-[#0077c8]">{selectedDetail.srcIp || 'Local'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans uppercase text-slate-500 font-bold block">Logon Type</span>
                      <span className="font-bold text-slate-900">{selectedDetail.logonType ?? 'N/A'}</span>
                    </div>
                  </div>

                  {(selectedDetail.processName || selectedDetail.commandLine || selectedDetail.parentProcessName) && (
                    <div className="p-3.5 bg-white rounded-xl border border-sky-200 space-y-2 font-mono">
                      <div>
                        <span className="text-[10px] font-sans uppercase text-slate-500 font-bold block">Process Name</span>
                        <span className="text-slate-900 break-all">{selectedDetail.processName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-sans uppercase text-slate-500 font-bold block">Parent Process</span>
                        <span className="text-slate-800 break-all">{selectedDetail.parentProcessName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-sans uppercase text-slate-500 font-bold block">Command Line</span>
                        <pre className="mt-1 p-2.5 bg-slate-950 text-sky-300 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                          {selectedDetail.commandLine || 'N/A'}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Raw Windows Event XML
                      </span>
                      {selectedDetail.rawXml && (
                        <button
                          onClick={handleCopyXml}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#0077c8] rounded-lg font-bold flex items-center gap-1"
                        >
                          {copiedXml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedXml ? 'Copied' : 'Copy XML'}
                        </button>
                      )}
                    </div>
                    <pre className="p-3.5 bg-slate-950 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-64 whitespace-pre-wrap break-all">
                      {selectedDetail.rawXml || 'Raw XML not supplied by agent or restricted for current role.'}
                    </pre>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
