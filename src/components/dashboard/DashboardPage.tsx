import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { TimeRangeOption, Severity, EventCategory, IncidentStatus } from '../../types/soc';
import { GeoMap } from './GeoMap';
import {
  ShieldAlert,
  Flame,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Server,
  HardDrive,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const {
    timeRange,
    setTimeRange,
    metrics,
    healthMetrics,
    incidents,
    alerts,
    drillDownToEvents,
    drillDownToIncidents,
    setSelectedIncidentId,
    setSelectedAlertId,
    setActivePage
  } = useSOC();

  // Visibility toggle state for the 3 line series in Events Over Time
  const [visibleSeries, setVisibleSeries] = useState<{ total: boolean; critical: boolean; high: boolean }>({
    total: true,
    critical: true,
    high: true
  });

  const toggleSeries = (key: 'total' | 'critical' | 'high') => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const timeRangeOptions: TimeRangeOption[] = [
    'Last 24 Hours',
    'Last 15 Days',
    'Last Month',
    'Last 3 Months'
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & Time Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
         
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Security Operations Center (SOC) Dashboard
          </h2>
        
        </div>

        {/* Section 6.A: Time Range Selector Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#0077c8]" />
            Time Range:
          </span>
          <div className="inline-flex rounded-xl bg-white p-1 border border-sky-200 shadow-xs">
            {timeRangeOptions.map((option) => {
              const isSelected = timeRange === option;
              return (
                <button
                  key={option}
                  onClick={() => setTimeRange(option)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0077c8] text-white shadow-sm shadow-[#0077c8]/30 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 6.B: Four KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Events */}
        <div
          onClick={() => drillDownToEvents({})}
          className="bg-white border border-sky-200/80 hover:border-[#0077c8] rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:shadow-sky-500/10 group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              Total Events
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0077c8] border border-sky-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
              {metrics.totalEvents.toLocaleString()}
            </span>
            <div
              className={`flex items-center text-xs font-bold font-mono tabular-nums ${
                metrics.totalEventsChangePct >= 0 ? 'text-[#0077c8]' : 'text-emerald-600'
              }`}
            >
              {metrics.totalEventsChangePct >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(metrics.totalEventsChangePct)}% vs prev
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">All normalized telemetry ingested</p>
        </div>

        {/* Card 2: Critical Events */}
        <div
          onClick={() => drillDownToEvents({ severity: 'critical' })}
          className="bg-white border border-red-200/80 hover:border-red-400 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:shadow-red-500/10 group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              Critical Events
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-red-600 tabular-nums">
              {metrics.criticalEvents.toLocaleString()}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200 uppercase">
              Immediate Action
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">Classified critical by rules engine</p>
        </div>

        {/* Card 3: High Events */}
        <div
          onClick={() => drillDownToEvents({ severity: 'high' })}
          className="bg-white border border-amber-200/80 hover:border-amber-400 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:shadow-amber-500/10 group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              High Events
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-amber-600 tabular-nums">
              {metrics.highEvents.toLocaleString()}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 uppercase">
              Elevated Threat
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">High severity security anomalies</p>
        </div>

        {/* Card 4: Security Incidents */}
        <div
          onClick={() => drillDownToIncidents({})}
          className="bg-white border border-indigo-200/80 hover:border-indigo-400 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:shadow-indigo-500/10 group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              Security Incidents
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flame className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
              {metrics.securityIncidents}
            </span>
            <div
              className={`flex items-center text-xs font-bold font-mono tabular-nums ${
                metrics.incidentsChangePct > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {metrics.incidentsChangePct > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(metrics.incidentsChangePct)}% vs prev
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">Active investigation cases opened</p>
        </div>
      </div>

      {/* Row: Events Over Time Line Chart & Event Types Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 6.C: Events Over Time Line Chart */}
        <div className="lg:col-span-2 bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Events Over Time</h3>
              <p className="text-xs text-slate-500">Interactive telemetry trend for {timeRange}</p>
            </div>
            {/* Interactive series toggles */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => toggleSeries('total')}
                className={`flex items-center gap-1.5 transition-opacity px-2 py-1 rounded-md ${
                  visibleSeries.total ? 'bg-sky-50 font-bold text-[#0077c8]' : 'opacity-40 text-slate-400'
                }`}
              >
                <span className="w-3 h-1 rounded bg-[#0077c8]" /> Total Events
              </button>
              <button
                onClick={() => toggleSeries('critical')}
                className={`flex items-center gap-1.5 transition-opacity px-2 py-1 rounded-md ${
                  visibleSeries.critical ? 'bg-red-50 font-bold text-red-600' : 'opacity-40 text-slate-400'
                }`}
              >
                <span className="w-3 h-1 rounded bg-red-500" /> Critical
              </button>
              <button
                onClick={() => toggleSeries('high')}
                className={`flex items-center gap-1.5 transition-opacity px-2 py-1 rounded-md ${
                  visibleSeries.high ? 'bg-amber-50 font-bold text-amber-600' : 'opacity-40 text-slate-400'
                }`}
              >
                <span className="w-3 h-1 rounded bg-amber-500" /> High
              </button>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.eventsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#bae6fd',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                    fontSize: '12px',
                    color: '#0f172a'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                {visibleSeries.total && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total"
                    name="Total Events"
                    stroke="#0077c8"
                    strokeWidth={2.5}
                    dot={{ fill: '#0077c8', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {visibleSeries.critical && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="critical"
                    name="Critical Events"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
                {visibleSeries.high && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="high"
                    name="High Events"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 6.D: Event Types Donut Chart */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Event Types</h3>
              <p className="text-xs text-slate-500">Click category to filter events</p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#0077c8] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              8 Categories
            </span>
          </div>

          <div className="relative w-full h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.eventTypesBreakdown}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  onClick={(entry: any) => {
                    if (entry && entry.category) {
                      drillDownToEvents({ category: entry.category as EventCategory });
                    }
                  }}
                  className="cursor-pointer"
                >
                  {metrics.eventTypesBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [
                    typeof val === 'number' ? val.toLocaleString() : String(val ?? 0),
                    'Events'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#bae6fd',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '11px',
                    color: '#0f172a'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Total</span>
              <span className="text-xl font-extrabold font-mono text-slate-900 tabular-nums">
                {metrics.totalEvents >= 1000000
                  ? `${(metrics.totalEvents / 1000000).toFixed(1)}M`
                  : metrics.totalEvents.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Interactive Legend Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2 pt-2 border-t border-sky-100 text-xs">
            {metrics.eventTypesBreakdown.map((item) => (
              <button
                key={item.category}
                onClick={() => drillDownToEvents({ category: item.category })}
                className="flex items-center justify-between p-1 rounded-lg hover:bg-sky-50 transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-semibold text-[11px] truncate">{item.category}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums ml-1">
                  {item.percentage}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Top Threat Categories & Incidents by Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 6.E: Top Threat Categories (Ranked Horizontal Bar Chart) */}
        <div className="lg:col-span-2 bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Threat Categories</h3>
              <p className="text-xs text-slate-500">Ranked by detected anomaly volume</p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Deduplicated Heuristics
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={metrics.topThreatCategories}
                margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#334155"
                  fontSize={11}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  formatter={(val: any) => [
                    typeof val === 'number' ? val.toLocaleString() : String(val ?? 0),
                    'Detections'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#bae6fd',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#0f172a'
                  }}
                />
                <Bar dataKey="count" fill="#0077c8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 6.G: Incidents by Severity (Donut Chart) */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Incidents by Severity</h3>
              <p className="text-xs text-slate-500">Click severity to filter cases</p>
            </div>
            <span className="text-[11px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Active Cases
            </span>
          </div>

          <div className="relative w-full h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.incidentsBySeverity}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  onClick={(entry: any) => {
                    if (entry && entry.severity) {
                      drillDownToIncidents({ severity: entry.severity as Severity });
                    }
                  }}
                  className="cursor-pointer"
                >
                  {metrics.incidentsBySeverity.map((entry, index) => (
                    <Cell key={`cell-sev-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#bae6fd',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#0f172a'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Total</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                {metrics.securityIncidents}
              </span>
            </div>
          </div>

          {/* Interactive Severity Badges */}
          <div className="space-y-1.5 mt-2 pt-2 border-t border-sky-100">
            {metrics.incidentsBySeverity.map((item) => (
              <button
                key={item.severity}
                onClick={() => drillDownToIncidents({ severity: item.severity })}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-sky-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold capitalize text-slate-800">{item.severity}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-900 font-bold tabular-nums">{item.count}</span>
                  <span className="text-slate-500 text-[11px] tabular-nums">({item.percentage}%)</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Security Events by Source & Attack Sources World Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 6.F: Security Events by Source Table */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security Events by Source</h3>
              <p className="text-xs text-slate-500">Click a source to inspect raw telemetry</p>
            </div>
            <button
              onClick={() => setActivePage('log-management')}
              className="text-xs font-semibold text-[#0077c8] hover:underline flex items-center gap-1"
            >
              Log Sources <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/60 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Source Name</th>
                  <th className="py-2.5 px-3 text-right">Event Count</th>
                  <th className="py-2.5 px-3 text-right">% of Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/70 font-mono">
                {metrics.eventsBySource.map((src) => (
                  <tr
                    key={src.source}
                    onClick={() => drillDownToEvents({ source: src.source })}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                      {src.source}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-bold tabular-nums">
                      {src.count.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">
                      {src.percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          src.status === 'healthy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : src.status === 'delayed'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {src.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6.H: Attack Sources / Geographic Overview Map */}
        <GeoMap sources={metrics.geoAttackSources} />
      </div>

      {/* Row: Recent Security Incidents & Recent Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 6.I: Recent Security Incidents Table */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Security Incidents</h3>
              <p className="text-xs text-slate-500">Confirmed security investigation records</p>
            </div>
            <button
              onClick={() => setActivePage('incidents')}
              className="text-xs text-[#0077c8] hover:underline flex items-center gap-1 font-bold"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/60 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Severity</th>
                  <th className="py-2 px-2.5">Title</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/70">
                {incidents.slice(0, 5).map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncidentId(inc.id);
                      setActivePage('incidents');
                    }}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-2.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {inc.detectionTime.slice(11, 16)}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono text-[#0077c8] font-bold whitespace-nowrap">
                      {inc.id}
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
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
                    <td className="py-2.5 px-2.5 font-semibold text-slate-800 max-w-xs truncate">
                      {inc.title}
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase font-mono ${
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6.J: Recent Security Alerts Table */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Security Alerts</h3>
              <p className="text-xs text-slate-500">Triggered automated detection rules</p>
            </div>
            <button
              onClick={() => setActivePage('alerts')}
              className="text-xs text-[#0077c8] hover:underline flex items-center gap-1 font-bold"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/60 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5">Alert Title</th>
                  <th className="py-2 px-2.5">Source</th>
                  <th className="py-2 px-2.5">Severity</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/70">
                {alerts.slice(0, 5).map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlertId(alert.id);
                      setActivePage('alerts');
                    }}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-2.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {alert.lastDetected.slice(11, 16)}
                    </td>
                    <td className="py-2.5 px-2.5 font-semibold text-slate-800 max-w-xs truncate">
                      {alert.title}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-500 truncate max-w-[120px]">
                      {alert.sourceSystem}
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
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
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase font-mono ${
                          alert.status === 'new'
                            ? 'bg-sky-50 text-[#0066b3] border border-sky-200'
                            : alert.status === 'assigned'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : alert.status === 'false_positive'
                            ? 'bg-slate-100 text-slate-500 line-through'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 6.K: System Health Footer (6 Compact Health Cards) */}
      <div className="border-t border-sky-200/80 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Infrastructure Telemetry & Log Ingestion Health
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Pipeline Heartbeat: Active
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Health Card 1: Overall System Status */}
          <div className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              1. System Status
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">
                {healthMetrics.overallStatus}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">SOC Engine Nominal</span>
          </div>

          {/* Health Card 2: Log Collectors Online/Offline */}
          <div className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              2. Log Collectors
            </span>
            <div className="mt-1.5 flex items-baseline gap-1 font-mono">
              <span className="text-base font-extrabold text-slate-900 tabular-nums">
                {healthMetrics.collectorsOnline}
              </span>
              <span className="text-xs text-slate-500">/ {healthMetrics.collectorsTotal} online</span>
            </div>
            <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">1 Offline (Mekelle)</span>
          </div>

          {/* Health Card 3: Agents Reporting */}
          <div className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              3. Endpoint Agents
            </span>
            <div className="mt-1.5 flex items-baseline gap-1 font-mono">
              <span className="text-base font-extrabold text-slate-900 tabular-nums">
                {healthMetrics.agentsReporting.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">/ {healthMetrics.agentsTotal.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">99.7% Reporting</span>
          </div>

          {/* Health Card 4: Ingestion Rate */}
          <div className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              4. Ingestion Rate
            </span>
            <div className="mt-1.5 flex items-baseline gap-1 font-mono">
              <span className="text-base font-extrabold text-[#0077c8] tabular-nums">
                {healthMetrics.ingestionRateEPS.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">EPS</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Peak: 22,400 EPS</span>
          </div>

          {/* Health Card 5: Storage Usage & Retention */}
          <div className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              5. Storage / Retention
            </span>
            <div className="mt-1.5 flex items-baseline gap-1 font-mono">
              <span className="text-base font-extrabold text-slate-900 tabular-nums">
                {healthMetrics.storageUsageTB}
              </span>
              <span className="text-xs text-slate-500">/ {healthMetrics.storageCapacityTB} TB</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{healthMetrics.retentionDays}-day retention</span>
          </div>

          {/* Health Card 6: Last Successful Ingestion */}
          <div className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              6. Last Ingestion
            </span>
            <div className="mt-1.5 flex items-center gap-1.5 font-mono text-emerald-600 font-bold text-xs">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>&lt; 2s ago</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Stream Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
