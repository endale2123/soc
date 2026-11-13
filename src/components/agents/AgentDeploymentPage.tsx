import React, { useState, useEffect, useCallback } from 'react';
import { useSOC } from '../../context/SOCContext';
import { socApi } from '../../services/socApi';
import {
  CreatedEnrollmentTokenResponse,
  EnrollmentTokenRecord,
  InstallerInfoResponse
} from '../../types/backend';
import {
  KeyRound,
  Terminal,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  Ban,
  PowerOff,
  Lock,
  Plus,
  X,
  RefreshCw,
  LogIn
} from 'lucide-react';

export const AgentDeploymentPage: React.FC = () => {
  const {
    dataMode,
    permissions,
    endpoints,
    refreshLiveData,
    setLoginModalOpen
  } = useSOC();

  const [tokens, setTokens] = useState<EnrollmentTokenRecord[]>([]);
  const [installerInfo, setInstallerInfo] = useState<InstallerInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Token Form
  const [label, setLabel] = useState('HQ Windows Endpoints Rollout');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [maxUses, setMaxUses] = useState(1);
  const [creating, setCreating] = useState(false);

  // One-time secret modal
  const [createdToken, setCreatedToken] = useState<CreatedEnrollmentTokenResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const loadDeploymentData = useCallback(async () => {
    if (dataMode !== 'live' || !permissions.canManageAgents) return;
    setLoading(true);
    setError(null);
    try {
      const [tokRes, instRes] = await Promise.all([
        socApi.getEnrollmentTokens(),
        socApi.getInstallerInfo()
      ]);
      setTokens(tokRes.tokens);
      setInstallerInfo(instRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrollment tokens');
    } finally {
      setLoading(false);
    }
  }, [dataMode, permissions.canManageAgents]);

  useEffect(() => {
    loadDeploymentData();
  }, [loadDeploymentData]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await socApi.createEnrollmentToken({
        label: label.trim(),
        expiresInHours,
        maxUses
      });
      setCreatedToken(res);
      setCopiedSecret(false);
      await loadDeploymentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate enrollment token');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await socApi.revokeEnrollmentToken(tokenId);
      await loadDeploymentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke token');
    }
  };

  const handleDeactivateAgent = async (agentId: string) => {
    try {
      await socApi.deactivateAgent(agentId);
      await refreshLiveData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate agent');
    }
  };

  if (dataMode !== 'live') {
    return (
      <div className="bg-white border border-sky-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
        <KeyRound className="w-10 h-10 text-[#0077c8] mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Agent Enrollment Requires Live Authentication</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Enrollment token generation and Windows endpoint provisioning are secured operations restricted to authenticated Security Administrators.
        </p>
        <button
          onClick={() => setLoginModalOpen(true)}
          className="px-5 py-2.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign In as Security Administrator
        </button>
      </div>
    );
  }

  if (!permissions.canManageAgents) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3 max-w-xl mx-auto mt-8">
        <Lock className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-lg font-bold text-red-900">Security Administrator Clearance Required</h2>
        <p className="text-xs text-red-800">
          Your current RBAC role does not permit generating enrollment tokens or deactivating endpoint agents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sky-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#0077c8]" />
            Windows Agent Deployment & Enrollment Tokens
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate one-time enrollment tokens, configure Windows service deployment, and revoke compromised endpoint credentials.
          </p>
        </div>

        <button
          onClick={loadDeploymentData}
          className="px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#0077c8] ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Generate Token + Install Guide Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Generator */}
        <form
          onSubmit={handleCreateToken}
          className="bg-white border border-sky-200/80 rounded-2xl p-5 space-y-4 shadow-xs text-xs"
        >
          <div className="flex items-center gap-2 border-b border-sky-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-[#0077c8]" />
            <h3 className="text-sm font-bold text-slate-900">Generate Enrollment Token</h3>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Deployment Label / Group</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Addis HQ Tax Database Servers"
              className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expires In (Hours)</label>
              <input
                type="number"
                min={1}
                max={720}
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Enrollments</label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl p-2.5 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">1 = Strict one-time token</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Generating Cryptographic Token...' : 'Generate Enrollment Token'}
          </button>
        </form>

        {/* Windows Agent Setup Guide */}
        <div className="bg-white border border-sky-200/80 rounded-2xl p-5 space-y-3 shadow-xs text-xs">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0077c8]" />
              Windows Service Deployment Instructions
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Phase 3 .NET Binary External
            </span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            {installerInfo?.agentPackageStatus ||
              'Backend enrollment, heartbeat, configuration sync, and Windows Event XML ingestion APIs are live. Point your .NET Windows Agent service to this backend URL:'}
          </p>

          <div className="p-2.5 bg-[#f8fbff] border border-sky-200 rounded-xl font-mono text-[11px]">
            <div className="text-slate-500">SOC Ingestion Base URL:</div>
            <div className="font-bold text-[#0077c8] mt-0.5">
              {installerInfo?.serverUrl || window.location.origin}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">
              PowerShell Agent Registration Command (Administrator):
            </span>
            <pre className="p-3 bg-slate-950 text-sky-300 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
              {installerInfo?.powershellInstallCommand ||
                `.\\MoR.SocAgent.exe enroll --server "${window.location.origin}" --token "<ONE_TIME_TOKEN>" && sc.exe start MoRSocAgent`}
            </pre>
          </div>
        </div>
      </div>

      {/* Enrollment Tokens Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-sky-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Issued Enrollment Tokens (Hashed at Rest)</h3>
          <span className="text-[11px] font-mono text-slate-500">{tokens.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-slate-600 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Label</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No enrollment tokens generated yet.
                  </td>
                </tr>
              ) : (
                tokens.map((tok) => (
                  <tr key={tok.id} className="hover:bg-sky-50/40">
                    <td className="py-3 px-4 font-mono font-bold text-[#0077c8]">{tok.tokenPrefix}...</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{tok.label}</td>
                    <td className="py-3 px-4 text-slate-600">{tok.createdBy}</td>
                    <td className="py-3 px-4 font-mono">
                      {tok.useCount} / {tok.maxUses}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {tok.expiresAt.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tok.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tok.status === 'used'
                            ? 'bg-sky-50 text-[#0077c8] border border-sky-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {tok.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tok.status === 'active' ? (
                        <button
                          onClick={() => handleRevokeToken(tok.id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Revoke
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrolled Agents Deactivation Control */}
      {endpoints.length > 0 && (
        <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-sky-100">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Agents Credential Control</h3>
          </div>
          <div className="divide-y divide-sky-100">
            {endpoints.map((ep) => (
              <div key={ep.agentId} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{ep.hostname}</span>
                  <span className="font-mono text-[#0077c8] ml-2">{ep.agentId}</span>
                  <span className="text-slate-500 ml-2">({ep.ipAddress})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-600">{ep.status}</span>
                  {ep.status !== 'Disabled' && (
                    <button
                      onClick={() => handleDeactivateAgent(ep.agentId)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <PowerOff className="w-3 h-3" />
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One-Time Enrollment Secret Modal */}
      {createdToken && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0077c8]" />
                One-Time Enrollment Token Issued
              </h3>
              <button
                onClick={() => setCreatedToken(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Copy this token now.</strong> Only a cryptographic SHA-256 hash is stored in PostgreSQL — this secret will never be shown again.
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between gap-3">
              <code className="font-mono text-emerald-300 break-all">{createdToken.enrollmentToken}</code>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(createdToken.enrollmentToken);
                  setCopiedSecret(true);
                }}
                className="px-3 py-1.5 bg-[#0077c8] hover:bg-[#0066b3] text-white rounded-lg font-bold shrink-0 flex items-center gap-1"
              >
                {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSecret ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-sky-100">
              <button
                onClick={() => setCreatedToken(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                I Have Stored the Token Securely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
