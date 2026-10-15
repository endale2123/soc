import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { UserRole, DetectionRule, Severity } from '../../types/soc';
import {
  Settings as SettingsIcon,
  Users,
  ShieldCheck,
  Zap,
  Sliders,
  History,
  Check,
  X,
  Search,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    users,
    currentUser,
    switchUser,
    detectionRules,
    toggleDetectionRule,
    auditLogs,
    addAuditLog,
    resetDemoData
  } = useSOC();

  const [activeTab, setActiveTab] = useState<
    'users' | 'roles' | 'rules' | 'general' | 'audit'
  >('users');

  // General Settings state
  const [orgName, setOrgName] = useState('Ministry of Revenues (የገቢዎች ሚኒስቴር)');
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa (UTC+3 EAT)');
  const [retentionDays, setRetentionDays] = useState(180);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Test Rule Sandbox state
  const [testingRule, setTestingRule] = useState<DetectionRule | null>(null);
  const [testPayload, setTestPayload] = useState('');
  const [testResult, setTestResult] = useState<{ match: boolean; message: string } | null>(null);

  // Audit Search
  const [auditSearch, setAuditSearch] = useState('');

  const handleTestRule = (rule: DetectionRule) => {
    setTestingRule(rule);
    setTestPayload(rule.sampleTestPayload || '');
    setTestResult(null);
  };

  const executeRuleTest = () => {
    if (!testingRule || !testPayload.trim()) return;
    // Simulate regex evaluation against detection logic
    const isMatched = testPayload.length > 10;
    setTestResult({
      match: isMatched,
      message: isMatched
        ? `Detection Rule triggered: 1 alert correlation event generated. Rule logic [${testingRule.detectionLogic.slice(0, 45)}...] satisfied.`
        : 'Rule evaluated 0 matches. Payload did not meet detection threshold window.'
    });
    addAuditLog(
      'Detection Rule Tested in Sandbox',
      `Rule: ${testingRule.name} (${testingRule.id})`,
      'Success',
      `Evaluated payload test against sandbox parser.`
    );
  };

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettingsNotice(true);
    addAuditLog('General Settings Modified', 'System Configuration', 'Success', `Updated org settings: Retention=${retentionDays}d, TZ=${timezone}`);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#0077c8]" />
            System Administration & Security Settings
          </h2>
         
        </div>

        <button
          onClick={() => {
            if (window.confirm('Reset all demonstration data back to default initial state?')) {
              resetDemoData();
            }
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#0077c8]" />
          Reset Demo Store
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-sky-200/80 overflow-x-auto text-xs font-semibold pb-1">
        {[
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'roles', label: 'Roles & Permissions (RBAC)', icon: ShieldCheck },
          { id: 'rules', label: 'Detection Rules Engine', icon: Zap },
          { id: 'general', label: 'General Parameters', icon: Sliders },
          { id: 'audit', label: 'Immutable Audit Logs', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0077c8] text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-sky-50 border border-sky-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl">
            <p className="text-xs text-slate-700">
              Authorized SOC operators, cybersecurity engineers, and executive management accounts:
            </p>
            <span className="text-xs font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs">
              Logged-in Profile: <strong className="text-[#0077c8] font-bold">{currentUser.name}</strong> ({currentUser.role})
            </span>
          </div>

          <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3.5 px-4">Name & Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Last Login</th>
                    <th className="py-3.5 px-4 text-right">RBAC Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70">
                  {users.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    const isBiksBiset = u.name.includes('Biks Biset');
                    return (
                      <tr key={u.id} className={`hover:bg-sky-50/50 transition-colors ${isCurrent ? 'bg-sky-50/30' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0077c8] text-white font-bold font-mono">
                                ACTIVE USER
                              </span>
                            )}
                            {isBiksBiset && !isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-[#0066b3] font-bold border border-sky-200">
                                SOC ANALYST
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#0077c8] whitespace-nowrap">
                          {u.role}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{u.department}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {u.lastLogin}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!isCurrent ? (
                            <button
                              onClick={() => switchUser(u.role)}
                              className="px-3 py-1.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                            >
                              Switch to {u.role === 'SOC Analyst' ? 'Biks Biset' : u.role}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium">Currently Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Enforced Role-Based Access Control (RBAC) permission matrix across security operations:
          </p>

          <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="py-3.5 px-4 font-sans">Role Name</th>
                    <th className="py-3.5 px-3 text-center">View Dashboards</th>
                    <th className="py-3.5 px-3 text-center">Manage Alerts</th>
                    <th className="py-3.5 px-3 text-center">Open Incidents</th>
                    <th className="py-3.5 px-3 text-center">Quarantine / Contain</th>
                    <th className="py-3.5 px-3 text-center">Export Reports</th>
                    <th className="py-3.5 px-3 text-center">Admin Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70">
                  {[
                    { role: 'Security Administrator', view: true, alerts: true, incidents: true, contain: true, export: true, admin: true },
                    { role: 'SOC Analyst', view: true, alerts: true, incidents: true, contain: false, export: true, admin: false },
                    { role: 'Incident Responder', view: true, alerts: true, incidents: true, contain: true, export: true, admin: false },
                    { role: 'Auditor', view: true, alerts: false, incidents: false, contain: false, export: true, admin: false },
                    { role: 'Management / Read-only Viewer', view: true, alerts: false, incidents: false, contain: false, export: true, admin: false }
                  ].map((row) => (
                    <tr key={row.role} className="hover:bg-sky-50/40">
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900">{row.role}</td>
                      <td className="py-3.5 px-3 text-center">{row.view ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                      <td className="py-3.5 px-3 text-center">{row.alerts ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                      <td className="py-3.5 px-3 text-center">{row.incidents ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                      <td className="py-3.5 px-3 text-center">{row.contain ? <Check className="w-4 h-4 text-red-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                      <td className="py-3.5 px-3 text-center">{row.export ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                      <td className="py-3.5 px-3 text-center">{row.admin ? <Check className="w-4 h-4 text-[#0077c8] mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DETECTION RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Active automated correlation rules. Click "Test Sandbox" to verify against sample payloads:
            </p>
            <span className="text-xs font-mono text-slate-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              Rules Active: <strong className="text-emerald-700 font-bold">{detectionRules.filter((r) => r.enabled).length}</strong> / {detectionRules.length}
            </span>
          </div>

          <div className="space-y-3">
            {detectionRules.map((rule) => (
              <div
                key={rule.id}
                className="p-5 bg-white border border-sky-200/80 rounded-2xl space-y-3 text-xs shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[#0077c8] font-bold">{rule.id}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{rule.name}</h4>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rule.severity === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : rule.severity === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestRule(rule)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0066b3] border border-sky-200 rounded-lg font-bold text-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-600" /> Test Sandbox
                    </button>
                    <button
                      onClick={() => toggleDetectionRule(rule.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rule.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 text-xs">{rule.description}</p>

                <div className="p-3 bg-[#f8fbff] rounded-xl border border-sky-200 font-mono text-[11px] text-[#005a9e]">
                  <span className="text-slate-500 font-semibold">Logic: </span>
                  {rule.detectionLogic}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                  <span>Required Sources: <strong className="text-slate-700">{rule.requiredSources.join(', ')}</strong></span>
                  <span>Last Triggered: {rule.lastTriggered}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneralSettings} className="bg-white border border-sky-200/80 rounded-2xl p-6 space-y-4 max-w-2xl text-xs shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Centralized SOC Instance Parameters
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Organization Title</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-hidden focus:border-[#0077c8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Time Zone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data Retention (Days)</label>
              <input
                type="number"
                min={30}
                max={365}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSettingsNotice ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Parameters saved successfully.
              </span>
            ) : <span />}
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0077c8] hover:bg-[#0066b3] text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: IMMUTABLE AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Immutable security ledger of all operator actions, rule modifications, and containment events:
            </p>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit records..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs"
              />
            </div>
          </div>

          <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="py-3 px-3">Log ID</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Operator</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Target</th>
                    <th className="py-3 px-3">Result</th>
                    <th className="py-3 px-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500">{log.id}</td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">{log.timestamp}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-sans font-bold">{log.user}</td>
                      <td className="py-2.5 px-3 text-[#0077c8] text-[11px] font-semibold">{log.role}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[150px] truncate">{log.target}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.result}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detection Rule Test Sandbox Modal */}
      {testingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Detection Rule Test Sandbox: {testingRule.id}
              </h4>
              <button
                onClick={() => setTestingRule(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block mb-1">Rule Name:</span>
              <p className="text-slate-900 font-bold text-sm">{testingRule.name}</p>
            </div>

            <div className="p-3 bg-[#f8fbff] rounded-xl border border-sky-200 font-mono text-[11px] text-[#005a9e]">
              {testingRule.detectionLogic}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Input Sample Log Event Payload:
              </label>
              <textarea
                rows={3}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-3 font-mono text-slate-800 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono ${
                  testResult.match
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="font-bold mb-1">
                  {testResult.match ? 'SUCCESS: CORRELATION TRIGGERED' : 'NO TRIGGER DETECTED'}
                </div>
                <p className="font-sans text-[11px]">{testResult.message}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100">
              <button
                type="button"
                onClick={() => setTestingRule(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Close Sandbox
              </button>
              <button
                type="button"
                onClick={executeRuleTest}
                className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold transition-colors shadow-xs"
              >
                Execute Test Parser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
