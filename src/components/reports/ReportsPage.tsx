import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { Severity } from '../../types/soc';
import {
  FileBarChart2,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Shield,
  Clock,
  HardDrive,
  Flame,
  ArrowRight
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { metrics, healthMetrics, incidents, alerts, logSources, assets, timeRange } = useSOC();

  const reportTypes = [
    'Security Overview Executive Report',
    'Incident Summary & Response Report',
    'Critical and High Severity Event Dossier',
    'Log Source Coverage & Ingestion Report',
    'Collector Infrastructure Health Report',
    'Top Threat Detection Categories Report',
    'Incident Response Performance (MTTD / MTTR)',
    'Asset Monitoring & Endpoint Coverage Report'
  ];

  const [selectedReportType, setSelectedReportType] = useState(reportTypes[0]);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');

  // Trigger Print dialog (supports "Save as PDF" natively)
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const csvContent = [
      'MINISTRY OF REVENUES (የገቢዎች ሚኒስቴር) - CENTRALIZED SOC',
      `Report Title: ${selectedReportType}`,
      `Period: ${startDate} to ${endDate}`,
      `Generated At: ${new Date().toISOString()}`,
      `Lead Analyst: Biks Biset (SOC Analyst)`,
      `Authorized Sign-off: Endale Aychew (Security Administrator)`,
      `Classification: INTERNAL SOC DEMO REPORT`,
      '',
      'Metric,Value,Unit',
      `Total Events Ingested,${metrics.totalEvents},Events`,
      `Critical Events,${metrics.criticalEvents},Events`,
      `High Severity Events,${metrics.highEvents},Events`,
      `Total Incidents,${incidents.length},Cases`,
      `Log Sources Active,${healthMetrics.collectorsOnline}/${healthMetrics.collectorsTotal},Collectors`,
      `Endpoint Coverage,${healthMetrics.agentsReporting}/${healthMetrics.agentsTotal},Endpoints`,
      `Peak Ingestion Flow,${healthMetrics.ingestionRateEPS},EPS`,
      '',
      'Incident ID,Title,Severity,Status,Assigned Analyst,Detection Time',
      ...incidents.map(
        (i) =>
          `"${i.id}","${i.title.replace(/"/g, '""')}","${i.severity}","${i.status}","${i.assignedAnalyst}","${i.detectionTime}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `MoR_SOC_Report_${selectedReportType.replace(/\s+/g, '_')}_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header (hidden in print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
         
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-[#0077c8]" />
            Security Intelligence & Executive Reporting
          </h2>
         
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-[#0077c8]" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Report Generator Controls (hidden in print) */}
      <div className="print:hidden bg-white border border-sky-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0077c8]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Report Parameters & Scope Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Report Template</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
            >
              {reportTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Date Range Window</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2 font-mono text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2 font-mono text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Severity Scope</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Log Source Scope</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-[#0077c8]"
            >
              <option value="ALL">All Monitored Sources</option>
              {logSources.map((ls) => (
                <option key={ls.id} value={ls.name}>
                  {ls.name} ({ls.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Dossier Preview */}
      <div className="bg-white border border-sky-200/90 rounded-2xl p-6 sm:p-10 space-y-6 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Official Header with Logo */}
        <div className="flex items-center justify-between border-b-2 border-[#0077c8] pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#0077c8] p-1 bg-white shadow-sm flex items-center justify-center shrink-0">
              <img
                src="/src/assets/images/mor_official_logo.jpg"
                alt="Ministry of Revenues Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0077c8] tracking-widest uppercase">
                የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ · የገቢዎች ሚኒስቴር
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                MINISTRY OF REVENUES
              </h1>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
                Directorate of Cybersecurity & Infrastructure Operations · SOC Intelligence Division
              </p>
            </div>
          </div>

          <div className="text-right text-xs font-mono hidden sm:block">
            <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-[#0066b3] border border-sky-200 font-bold mb-1">
              OFFICIAL SOC DOSSIER
            </span>
            <p className="text-slate-500">Ref: MoR-SOC-{(new Date()).getFullYear()}-914</p>
            <p className="text-slate-500">Date: {endDate} 09:30 EAT</p>
          </div>
        </div>

        {/* Report Title & Metadata */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#0077c8] block">Document Title</span>
            <h2 className="text-base font-bold text-slate-900">{selectedReportType}</h2>
            <p className="text-slate-600 mt-0.5">
              Scope: {startDate} through {endDate} · Severity: {severityFilter} · Source: {selectedSource}
            </p>
          </div>
          <div className="sm:text-right font-mono text-[11px] text-slate-600">
            <p>Classification: <strong className="text-amber-700">RESTRICTED - SOC INTERNAL</strong></p>
            <p>Instance: MoR Centralized SOC Engine</p>
          </div>
        </div>

        {/* Section 1: Executive KPI Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0077c8] border-b border-sky-100 pb-1.5">
            1. Executive Telemetry & Threat Metrics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#f8fbff] rounded-xl border border-sky-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Ingested Events</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {metrics.totalEvents.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 block font-semibold mt-0.5">100% Normalized</span>
            </div>

            <div className="p-3.5 bg-red-50/50 rounded-xl border border-red-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Critical Threats</span>
              <span className="text-xl font-bold font-mono text-red-600">
                {metrics.criticalEvents.toLocaleString()}
              </span>
              <span className="text-[10px] text-red-700 block font-semibold mt-0.5">Rule Matches</span>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">High Severity Events</span>
              <span className="text-xl font-bold font-mono text-amber-600">
                {metrics.highEvents.toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-700 block font-semibold mt-0.5">Anomalies Detected</span>
            </div>

            <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Confirmed Incidents</span>
              <span className="text-xl font-bold font-mono text-[#0077c8]">
                {incidents.length} Cases
              </span>
              <span className="text-[10px] text-sky-700 block font-semibold mt-0.5">Investigation Active</span>
            </div>
          </div>
        </div>

        {/* Section 2: Infrastructure Health */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0077c8] border-b border-sky-100 pb-1.5">
            2. Infrastructure & Ingestion Pipeline Health
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-[#f8fbff] rounded-xl border border-sky-200">
              <span className="text-[10px] text-slate-500 font-sans uppercase block">Log Collectors</span>
              <span className="text-base font-bold text-slate-900">
                {healthMetrics.collectorsOnline} of {healthMetrics.collectorsTotal} Active
              </span>
              <span className="text-[10px] text-slate-500 block font-sans mt-0.5">1 Offline in Regional Branch</span>
            </div>

            <div className="p-3.5 bg-[#f8fbff] rounded-xl border border-sky-200">
              <span className="text-[10px] text-slate-500 font-sans uppercase block">Endpoint Agent Reach</span>
              <span className="text-base font-bold text-slate-900">
                {healthMetrics.agentsReporting.toLocaleString()} / {healthMetrics.agentsTotal.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 block font-sans mt-0.5">99.7% Operational Coverage</span>
            </div>

            <div className="p-3.5 bg-[#f8fbff] rounded-xl border border-sky-200">
              <span className="text-[10px] text-slate-500 font-sans uppercase block">Mean Time to Remediate (MTTR)</span>
              <span className="text-base font-bold text-slate-900">34.0 Minutes</span>
              <span className="text-[10px] text-[#0077c8] block font-sans mt-0.5">Containment & Host Quarantine</span>
            </div>
          </div>
        </div>

        {/* Section 3: Detailed Incident Case Log */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0077c8] border-b border-sky-100 pb-1.5">
            3. Documented Security Incidents Audit
          </h3>

          <div className="overflow-x-auto border border-sky-200 rounded-xl shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] font-bold">
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Incident Title</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Affected Assets</th>
                  <th className="p-2.5">Lead Analyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-sky-50/40">
                    <td className="p-2.5 text-[#0077c8] font-bold">{inc.id}</td>
                    <td className="p-2.5 font-sans font-semibold text-slate-800">{inc.title}</td>
                    <td className="p-2.5 uppercase font-bold text-red-600">{inc.severity}</td>
                    <td className="p-2.5 uppercase font-semibold text-slate-600">{inc.status}</td>
                    <td className="p-2.5 text-slate-500">{inc.affectedAssets.join(', ')}</td>
                    <td className="p-2.5 font-sans text-slate-800 font-medium">{inc.assignedAnalyst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Signature / Sign-off Footer */}
        <div className="pt-8 border-t border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-800">Prepared By:</p>
            <p className="text-[#0077c8] font-bold text-sm">Biks Biset — SOC Analyst</p>
            <p className="text-[11px] font-mono text-slate-500">Directorate of Cybersecurity, MoR</p>
          </div>
          <div>
            <p className="font-bold text-slate-800">Authorized By:</p>
            <p className="text-amber-700 font-bold text-sm">Endale Aychew — Security Administrator</p>
            <p className="text-[11px] font-mono text-slate-500">Directorate of Cybersecurity & Infrastructure, MoR</p>
          </div>
        </div>
      </div>
    </div>
  );
};
