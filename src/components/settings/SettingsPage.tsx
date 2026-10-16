import React, { useState } from 'react';
import { useSOC } from '../../context/SOCContext';
import { UserRole } from '../../types/soc';
import {
  Settings as SettingsIcon,
  Users,
  ShieldCheck,
  Sliders,
  History,
  Check,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  UserPlus,
  Plus
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    auditLogs,
    addAuditLog
  } = useSOC();

  const [activeTab, setActiveTab] = useState<
    'users' | 'roles' | 'general' | 'audit'
  >('users');

  // Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('SOC Analyst');
  const [newUserDepartment, setNewUserDepartment] = useState('Directorate of Cybersecurity');
  const [newUserStatus, setNewUserStatus] = useState<'Active' | 'Inactive'>('Active');

  // General Settings state
  const [orgName, setOrgName] = useState('Ministry of Revenues (የገቢዎች ሚኒስቴር)');
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa (UTC+3 EAT)');
  const [retentionDays, setRetentionDays] = useState(180);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Audit Search
  const [auditSearch, setAuditSearch] = useState('');

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Please provide full name and corporate email address.');
      return;
    }
    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      department: newUserDepartment.trim(),
      status: newUserStatus
    });
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('SOC Analyst');
    setAddUserModalOpen(false);
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
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts, RBAC access boundaries, system parameters, and audit trails.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-sky-200/80 overflow-x-auto text-xs font-semibold pb-1">
        {[
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'roles', label: 'Roles & Permissions (RBAC)', icon: ShieldCheck },
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl">
            <div>
              <p className="text-xs text-slate-700 font-medium">
                Authorized SOC operators, cybersecurity engineers, and executive management accounts:
              </p>
              <span className="text-[11px] font-mono text-slate-600 mt-0.5 block">
                Logged-in Profile: <strong className="text-[#0077c8] font-bold">{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            <button
              onClick={() => setAddUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              Add New User
            </button>
          </div>

          <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3.5 px-4">Name & Email</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">Last Activity</th>
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
                                ACTIVE OPERATOR
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
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {u.lastLogin || 'Active session'}
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

      {/* Add New User Modal */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0077c8]" />
                Add New User & Assign Role
              </h3>
              <button
                onClick={() => setAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almaz Bekele"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. almaz.bekele@revenue.gov.et"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign RBAC Security Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="Security Administrator">Security Administrator (Full Operational & Config Privileges)</option>
                  <option value="SOC Analyst">SOC Analyst (Triage, Analysis, Containment Recommendations)</option>
                  <option value="Incident Responder">Incident Responder (Active Remediation & Containment)</option>
                  <option value="Auditor">Auditor (Compliance, Integrity Verification & Read-Only)</option>
                  <option value="Management / Read-only Viewer">Management / Read-only Viewer (Executive Dashboards)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department / Directorate</label>
                <input
                  type="text"
                  required
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  placeholder="e.g. Directorate of Cybersecurity, Tax Audit"
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 focus:outline-hidden focus:border-[#0077c8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Initial Status</label>
                <select
                  value={newUserStatus}
                  onChange={(e) => setNewUserStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-hidden focus:border-[#0077c8]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Save & Assign Role
                </button>
              </div>
            </form>
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
                    <th className="py-3.5 px-4 font-sans">Role Title</th>
                    <th className="py-3.5 px-3 text-center">View Logs/Events</th>
                    <th className="py-3.5 px-3 text-center">Acknowledge Alerts</th>
                    <th className="py-3.5 px-3 text-center">Manage Incidents</th>
                    <th className="py-3.5 px-3 text-center">Execute Containment</th>
                    <th className="py-3.5 px-3 text-center">Export Reports</th>
                    <th className="py-3.5 px-3 text-center">Admin Config</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70">
                  {[
                    { role: 'Security Administrator', view: true, alerts: true, incidents: true, contain: true, export: true, admin: true },
                    { role: 'SOC Analyst', view: true, alerts: true, incidents: true, contain: true, export: true, admin: false },
                    { role: 'Incident Responder', view: true, alerts: true, incidents: true, contain: true, export: true, admin: false },
                    { role: 'Auditor', view: true, alerts: false, incidents: false, contain: false, export: true, admin: false },
                    { role: 'Management / Read-only Viewer', view: true, alerts: false, incidents: false, contain: false, export: true, admin: false }
                  ].map((row) => (
                    <tr key={row.role} className="hover:bg-sky-50/50">
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

      {/* TAB 3: GENERAL SETTINGS */}
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
                <CheckCircle2 className="w-4 h-4" /> Parameters saved successfully to configuration store.
              </span>
            ) : (
              <div />
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold transition-all shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by user, action, target, or details..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-sky-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-[#0077c8]"
              />
            </div>
            <span className="text-xs font-mono text-slate-500 self-end sm:self-auto">
              Total Recorded Audits: <strong>{filteredAuditLogs.length}</strong>
            </span>
          </div>

          <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Timestamp (EAT)</th>
                    <th className="py-3 px-4 font-sans">User & Role</th>
                    <th className="py-3 px-4 font-sans">Action Performed</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4 font-sans">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70 font-sans">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-sky-50/50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div>{log.user}</div>
                        <div className="text-[10px] text-slate-500">{log.role}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0077c8] whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {log.target}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
