import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { INITIAL_NETWORK_FLOWS } from '../../data/mockData';
import { NetworkFlow } from '../../types/soc';
import {
  Network,
  Activity,
  Shield,
  ArrowRightLeft,
  Filter,
  CheckCircle,
  AlertTriangle,
  Radio,
  Lock,
  Globe
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const NetworkMonitoringPage: React.FC = () => {
  const [flows] = useState<NetworkFlow[]>(INITIAL_NETWORK_FLOWS);
  const [protocolFilter, setProtocolFilter] = useState<'ALL' | 'TCP' | 'UDP' | 'TLS'>('ALL');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'ALLOW' | 'BLOCK'>('ALL');

  const filteredFlows = flows.filter((f) => {
    if (protocolFilter !== 'ALL' && f.protocol !== protocolFilter) return false;
    if (actionFilter !== 'ALL' && f.action !== actionFilter) return false;
    return true;
  });

  const protocolDistribution = [
    { name: 'TLS / HTTPS (443)', count: 42000, color: '#0077c8' },
    { name: 'DNS (UDP 53)', count: 21500, color: '#0284c7' },
    { name: 'PostgreSQL (5432)', count: 14200, color: '#059669' },
    { name: 'Kerberos / AD (88)', count: 11800, color: '#d97706' },
    { name: 'SSH / Admin (22)', count: 3200, color: '#dc2626' }
  ];

  const topDevices = [
    { name: 'FW-PERIMETER-01', type: 'Palo Alto Perimeter', throughput: '1.4 Gbps', dropRate: '3.4%', status: 'Nominal' },
    { name: 'VPN-GW-ADDIS', type: 'Fortinet SSL-VPN', throughput: '420 Mbps', dropRate: '0.8%', status: 'Nominal' },
    { name: 'SW-CORE-HQ', type: 'Cisco Nexus Core', throughput: '8.9 Gbps', dropRate: '0.01%', status: 'Nominal' },
    { name: 'DNS-RESOLVER-01', type: 'BIND Authority', throughput: '85 Mbps', dropRate: '0.2%', status: 'Nominal' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
         
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-[#0077c8]" />
            Network Traffic & Flow Telemetry Monitoring
          </h2>
         
        </div>
      </div>

      {/* Telemetry Notice */}
      <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
        <Radio className="w-4 h-4 text-[#0077c8] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-slate-600">
          <strong className="text-slate-900 font-semibold">Simulated Flow Telemetry:</strong> Flow metrics are derived from firewall NetFlow/IPFIX and syslog collectors. Deep packet capture (PCAP) inspection requires deployment of hardware network tap appliances.
        </p>
      </div>

      {/* Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Perimeter Ingress Bandwidth
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            1.82 Gbps
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">Ethio Telecom Dedicated Transit</span>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Active Remote VPN Tunnels
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-[#0077c8] tabular-nums">
            348 Sessions
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Field auditors & customs posts</span>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Firewall Dropped Packets
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-red-600 tabular-nums">
            4,890 / min
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">Probing & unauthorized ports</span>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Average DNS Latency
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
            2.4 ms
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">Local authoritative resolvers</span>
        </div>
      </div>

      {/* Charts Row: Protocol Breakdown & Top Network Appliances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Breakdown */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Top Network Protocols & Ports</h3>
            <span className="text-[11px] text-slate-500 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              NetFlow Sampling
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={protocolDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#bae6fd',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#0f172a'
                  }}
                />
                <Bar dataKey="count" fill="#0077c8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Monitored Appliances */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Core Network Appliances Health</h3>
            <span className="text-[11px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              4 / 4 Online
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/70 text-slate-600 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Device</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Throughput</th>
                  <th className="py-2.5 px-3">Drop %</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {topDevices.map((dev) => (
                  <tr key={dev.name} className="hover:bg-sky-50/40">
                    <td className="py-2.5 px-3 text-slate-900 font-bold">{dev.name}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans font-medium">{dev.type}</td>
                    <td className="py-2.5 px-3 text-[#0077c8] font-bold">{dev.throughput}</td>
                    <td className="py-2.5 px-3 text-amber-600 font-bold">{dev.dropRate}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans font-bold">
                        {dev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Real-time Simulated Flow Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Observed Network Sessions & Flows</h3>
            <p className="text-xs text-slate-500">Live stream of IP flows across Ministry boundary</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value as typeof protocolFilter)}
              className="bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold shadow-2xs"
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="TLS">TLS</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as typeof actionFilter)}
              className="bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold shadow-2xs"
            >
              <option value="ALL">All Actions</option>
              <option value="ALLOW">ALLOW</option>
              <option value="BLOCK">BLOCK</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Device</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Destination IP</th>
                <th className="py-2.5 px-3">Proto / Port</th>
                <th className="py-2.5 px-3 text-right">Bytes</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Rule Signature / Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {filteredFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{flow.timestamp}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans font-medium">{flow.device}</td>
                  <td className="py-2.5 px-3 text-[#0077c8] font-bold">{flow.srcIp}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-medium">{flow.destIp}</td>
                  <td className="py-2.5 px-3 text-slate-600">{flow.protocol} / {flow.port}</td>
                  <td className="py-2.5 px-3 text-right text-slate-900 font-bold tabular-nums">{flow.bytes.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        flow.action === 'ALLOW'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {flow.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">
                    {flow.flag || 'DEFAULT_PASS'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
