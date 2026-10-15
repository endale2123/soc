import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { LogSource, SourceStatus } from '../../types/soc';
import {
  ScrollText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Power,
  Settings,
  X,
  Activity,
  HardDrive
} from 'lucide-react';

export const LogManagementPage: React.FC = () => {
  const { logSources, toggleLogSource, addLogSource } = useSOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SourceStatus>('ALL');

  // Test Connection Simulation Modal
  const [testingSource, setTestingSource] = useState<LogSource | null>(null);
  const [testResult, setTestResult] = useState<{
    status: 'testing' | 'success' | 'failed';
    latencyMs?: number;
    message?: string;
  } | null>(null);

  // Add Source Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Windows Event Log');
  const [hostname, setHostname] = useState('');
  const [method, setMethod] = useState<LogSource['collectionMethod']>('Syslog');
  const [ipAddress, setIpAddress] = useState('');
  const [retentionDays, setRetentionDays] = useState(180);

  // Error Viewer Modal
  const [errorModalSource, setErrorModalSource] = useState<LogSource | null>(null);

  const filteredSources = logSources.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.hostname.toLowerCase().includes(q) ||
        s.ipAddress.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleTestConnection = (source: LogSource) => {
    setTestingSource(source);
    setTestResult({ status: 'testing' });
    setTimeout(() => {
      if (source.status === 'offline') {
        setTestResult({
          status: 'failed',
          message: 'Connection timed out on TCP port 6514 (TLS Syslog endpoint). Host unreachable.'
        });
      } else {
        const fakeLatency = Math.floor(Math.random() * 25) + 8;
        setTestResult({
          status: 'success',
          latencyMs: fakeLatency,
          message: `Synthetic handshake probe succeeded. Handshake latency: ${fakeLatency}ms. Forwarder TLS certificate valid until Nov 2027.`
        });
      }
    }, 1200);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hostname.trim() || !ipAddress.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    addLogSource({
      name: name.trim(),
      type,
      hostname: hostname.trim(),
      collectionMethod: method,
      ipAddress: ipAddress.trim(),
      eventsPerMinute: 450,
      parsingSuccessRate: 99.5,
      status: 'healthy',
      dataFreshness: '< 5 sec',
      retentionDays: Number(retentionDays),
      enabled: true
    });

    setAddModalOpen(false);
    setName('');
    setHostname('');
    setIpAddress('');
  };

  const totalEPS = logSources.reduce((acc, s) => acc + (s.enabled ? s.eventsPerMinute : 0), 0) / 60;
  const offlineCount = logSources.filter((s) => s.status === 'offline').length;
  const errorCount = logSources.filter((s) => s.status === 'parsing_error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
         
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#0077c8]" />
            Centralized Log Source & Collector Management
          </h2>
         
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white text-xs font-bold rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register New Log Source
        </button>
      </div>

      {/* Collector Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Total Sources Registered
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            {logSources.length}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Multi-tier collectors active</p>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Overall Ingestion Flow
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-[#0077c8] tabular-nums">
            {Math.round(totalEPS).toLocaleString()} EPS
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Normalized events per second</p>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Sources Offline / Delayed
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 tabular-nums">
            {offlineCount} offline / 1 delayed
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Requires collector inspection</p>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Parsing Accuracy
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
            99.2%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">{errorCount} source in dead-letter queue</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by source name, type, host, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0077c8]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
          >
            <option value="ALL">All Health Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="delayed">Delayed</option>
            <option value="offline">Offline</option>
            <option value="parsing_error">Parsing Error</option>
          </select>
        </div>
      </div>

      {/* Sources Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3.5">Status</th>
                <th className="py-3.5 px-3.5">Source Name & Hostname</th>
                <th className="py-3.5 px-3.5">Category</th>
                <th className="py-3.5 px-3.5">Method</th>
                <th className="py-3.5 px-3.5">IP Address</th>
                <th className="py-3.5 px-3.5">Last Heartbeat</th>
                <th className="py-3.5 px-3.5 text-right">Rate (EPM)</th>
                <th className="py-3.5 px-3.5 text-right">Parsing Rate</th>
                <th className="py-3.5 px-3.5">Retention</th>
                <th className="py-3.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-mono">
              {filteredSources.map((source) => (
                <tr key={source.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        source.status === 'healthy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : source.status === 'delayed'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : source.status === 'parsing_error'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {source.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-sans max-w-xs">
                    <div className="font-bold text-slate-900">{source.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{source.hostname}</div>
                  </td>
                  <td className="py-3 px-3.5 font-sans text-slate-700 font-medium whitespace-nowrap">
                    {source.type}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-[#0077c8] font-bold">
                    {source.collectionMethod}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 font-mono">
                    {source.ipAddress}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                    {source.lastEventReceived}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap text-slate-900 font-bold tabular-nums">
                    {source.enabled ? source.eventsPerMinute.toLocaleString() : 0}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap tabular-nums">
                    <span
                      className={`font-bold ${
                        source.parsingSuccessRate > 98
                          ? 'text-emerald-700'
                          : source.parsingSuccessRate > 90
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {source.parsingSuccessRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                    {source.retentionDays} days
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      {source.errorLog && (
                        <button
                          onClick={() => setErrorModalSource(source)}
                          className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold"
                          title="View Parsing/Connection Error"
                        >
                          Error
                        </button>
                      )}
                      <button
                        onClick={() => handleTestConnection(source)}
                        className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-lg text-[11px] font-bold shadow-2xs"
                        title="Simulated connection handshake test"
                      >
                        Test Probe
                      </button>
                      <button
                        onClick={() => toggleLogSource(source.id)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          source.enabled
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={source.enabled ? 'Click to Mute Source' : 'Click to Enable Source'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Connection Probe Simulation Modal */}
      {testingSource && testResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0077c8]" />
                Simulated Collector Probe: {testingSource.name}
              </h4>
              <button
                onClick={() => {
                  setTestingSource(null);
                  setTestResult(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              <strong className="text-slate-800 font-semibold">Notice:</strong> Simulation mode test probe. Validates collector configuration, socket binding, and mock latency response without executing intrusive network scans.
            </p>

            <div className="p-4 bg-[#f8fbff] rounded-xl border border-sky-200 font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Target IP:</span>
                <span className="text-slate-900 font-bold">{testingSource.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="text-[#0077c8] font-bold">{testingSource.collectionMethod}</span>
              </div>

              {testResult.status === 'testing' ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2 text-slate-600">
                  <RefreshCw className="w-5 h-5 text-[#0077c8] animate-spin" />
                  <span>Sending simulated TCP/TLS SYN heartbeat...</span>
                </div>
              ) : testResult.status === 'success' ? (
                <div className="py-2 text-emerald-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Probe Succeeded
                  </div>
                  <p className="text-slate-700 text-[11px] font-sans">{testResult.message}</p>
                </div>
              ) : (
                <div className="py-2 text-red-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <XCircle className="w-4 h-4 text-red-600" /> Probe Failed (Timeout)
                  </div>
                  <p className="text-slate-700 text-[11px] font-sans">{testResult.message}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setTestingSource(null);
                  setTestResult(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Dismiss Probe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Details Modal */}
      {errorModalSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Ingestion Diagnostic Log: {errorModalSource.name}
              </h4>
              <button
                onClick={() => setErrorModalSource(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#f8fbff] rounded-xl border border-sky-200 font-mono text-[11px] text-amber-900 space-y-2">
              <p><strong>Status:</strong> {errorModalSource.status.toUpperCase()}</p>
              <p><strong>Hostname:</strong> {errorModalSource.hostname}</p>
              <div className="p-3 bg-white rounded-lg border border-sky-100 text-slate-800 whitespace-pre-wrap">
                {errorModalSource.errorLog}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setErrorModalSource(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Log Source Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white border border-sky-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs"
          >
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0077c8]" />
                Register Centralized Log Source
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Source Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hawassa Branch Regional Firewall Cluster"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Source Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="Firewall">Firewall</option>
                  <option value="Windows endpoints">Windows endpoints</option>
                  <option value="Windows servers">Windows servers</option>
                  <option value="Active Directory">Active Directory</option>
                  <option value="DNS and DHCP">DNS and DHCP</option>
                  <option value="Routers and switches">Routers and switches</option>
                  <option value="Web server and applications">Web server and applications</option>
                  <option value="Database servers">Database servers</option>
                  <option value="Email security">Email security</option>
                  <option value="VPN">VPN</option>
                  <option value="Linux servers">Linux servers</option>
                  <option value="Other supported sources">Other supported sources</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Collection Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as LogSource['collectionMethod'])}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="Syslog">Syslog (RFC 5424 / TLS 6514)</option>
                  <option value="WEF">Windows Event Forwarding (WEF)</option>
                  <option value="Endpoint Agent">Endpoint Security Agent</option>
                  <option value="WinRM">WinRM Remote Event Log</option>
                  <option value="SNMP">SNMP Trap</option>
                  <option value="Database JDBC">Database Audit JDBC</option>
                  <option value="API">REST API Ingestion Hook</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hostname / FQDN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FW-HAWASSA-01.revenue.gov.et"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">IP Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10.103.1.1"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Retention Policy (Days)</label>
              <input
                type="number"
                min={30}
                max={365}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-hidden focus:border-[#0077c8]"
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
                Register Source
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
