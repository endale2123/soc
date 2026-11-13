import {
  AgentConfiguration,
  AgentStatisticsResponse,
  AuthSessionResponse,
  CreatedEnrollmentTokenResponse,
  DashboardStatisticsResponse,
  EndpointDetailsResponse,
  EndpointSummary,
  EnrollmentTokenRecord,
  InstallerInfoResponse,
  WindowsEventSummary
} from '../types/backend';
import {
  Alert,
  AuditLog,
  DetectionRule,
  Incident,
  IncidentStatus,
  LogSource,
  SecurityEvent,
  Severity,
  TimeRangeOption,
  User,
  UserRole
} from '../types/soc';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  });

  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`);
  }

  return data as T;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== '' && v !== 'ALL') {
      qs.set(k, String(v));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const socApi = {
  // Health
  health: () =>
    requestJson<{ status: string; database: string; engine: string; sseClients: number }>(
      '/api/health'
    ),

  // Authentication & Users
  login: (email: string, password: string) =>
    requestJson<AuthSessionResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: () =>
    requestJson<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => requestJson<AuthSessionResponse>('/api/auth/me'),

  getUsers: () => requestJson<{ users: User[] }>('/api/users'),

  createUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department: string;
    status?: 'Active' | 'Inactive' | 'Disabled';
  }) =>
    requestJson<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Dashboard Statistics
  getDashboardStatistics: (timeRange: TimeRangeOption) =>
    requestJson<DashboardStatisticsResponse>(
      `/api/statistics/dashboard${buildQuery({ timeRange })}`
    ),

  // Endpoints & Agent Statistics
  getAgentStatistics: () => requestJson<AgentStatisticsResponse>('/api/agent-statistics'),

  getEndpoints: (params: {
    search?: string;
    status?: string;
    os?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) =>
    requestJson<{
      items: EndpointSummary[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/api/endpoints${buildQuery(params)}`),

  getEndpointDetails: (agentId: string) =>
    requestJson<EndpointDetailsResponse>(`/api/endpoints/${encodeURIComponent(agentId)}`),

  getEndpointEvents: (agentId: string, page = 1, pageSize = 25) =>
    requestJson<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/api/endpoints/${encodeURIComponent(agentId)}/events${buildQuery({ page, pageSize })}`
    ),

  getEndpointAlerts: (agentId: string) =>
    requestJson<{ items: any[] }>(`/api/endpoints/${encodeURIComponent(agentId)}/alerts`),

  getEndpointIncidents: (agentId: string) =>
    requestJson<{ items: any[] }>(`/api/endpoints/${encodeURIComponent(agentId)}/incidents`),

  updateAgentConfiguration: (agentId: string, config: Partial<AgentConfiguration>) =>
    requestJson<AgentConfiguration>(`/api/agents/${encodeURIComponent(agentId)}/configuration`, {
      method: 'PUT',
      body: JSON.stringify(config)
    }),

  deactivateAgent: (agentId: string) =>
    requestJson<{ agentId: string; status: string; credentialsRevoked: boolean }>(
      `/api/agents/${encodeURIComponent(agentId)}/deactivate`,
      { method: 'POST' }
    ),

  // Enrollment Tokens & Installer Info
  getEnrollmentTokens: () =>
    requestJson<{ tokens: EnrollmentTokenRecord[] }>('/api/enrollment-tokens'),

  createEnrollmentToken: (payload: { label: string; expiresInHours?: number; maxUses?: number }) =>
    requestJson<CreatedEnrollmentTokenResponse>('/api/enrollment-tokens', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  revokeEnrollmentToken: (tokenId: string) =>
    requestJson<{ id: string; revoked: boolean }>(
      `/api/enrollment-tokens/${encodeURIComponent(tokenId)}/revoke`,
      { method: 'POST' }
    ),

  getInstallerInfo: () => requestJson<InstallerInfoResponse>('/api/agents/installer-info'),

  // Security Events & Windows Events
  getEvents: (params?: {
    search?: string;
    severity?: string;
    category?: string;
    source?: string;
    hostname?: string;
    page?: number;
    pageSize?: number;
  }) =>
    requestJson<{ items: SecurityEvent[]; total: number; page: number; totalPages: number }>(
      `/api/events${buildQuery(params || {})}`
    ),

  getWindowsEvents: (params: {
    eventId?: number | string;
    hostname?: string;
    username?: string;
    severity?: string;
    channel?: string;
    srcIp?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) =>
    requestJson<{
      items: WindowsEventSummary[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/api/windows-events${buildQuery(params)}`),

  getWindowsEventDetail: (eventId: string) =>
    requestJson<{ event: WindowsEventSummary }>(
      `/api/windows-events/${encodeURIComponent(eventId)}`
    ),

  // Alerts
  getAlerts: (params?: { status?: string; severity?: string; search?: string }) =>
    requestJson<{ alerts: Alert[] }>(`/api/alerts${buildQuery(params || {})}`),

  acknowledgeAlert: (id: string) =>
    requestJson<{ alert: Alert }>(`/api/alerts/${encodeURIComponent(id)}/acknowledge`, {
      method: 'POST'
    }),

  assignAlert: (id: string, analyst: string) =>
    requestJson<{ alert: Alert }>(`/api/alerts/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ analyst })
    }),

  markAlertFalsePositive: (id: string, reason: string) =>
    requestJson<{ alert: Alert }>(`/api/alerts/${encodeURIComponent(id)}/false-positive`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  resolveAlert: (id: string, note?: string) =>
    requestJson<{ alert: Alert }>(`/api/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note })
    }),

  escalateAlertToIncident: (id: string) =>
    requestJson<{ incident: Incident; alert: Alert }>(
      `/api/alerts/${encodeURIComponent(id)}/escalate`,
      { method: 'POST' }
    ),

  linkAlertToIncident: (id: string, incidentId: string) =>
    requestJson<{ alert: Alert }>(`/api/alerts/${encodeURIComponent(id)}/link`, {
      method: 'POST',
      body: JSON.stringify({ incidentId })
    }),

  // Incidents
  getIncidents: () => requestJson<{ incidents: Incident[] }>('/api/incidents'),

  updateIncidentStatus: (id: string, status: IncidentStatus, note?: string) =>
    requestJson<{ incident: Incident }>(`/api/incidents/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    }),

  updateIncidentSeverity: (id: string, severity: Severity, reason: string) =>
    requestJson<{ incident: Incident }>(`/api/incidents/${encodeURIComponent(id)}/severity`, {
      method: 'PATCH',
      body: JSON.stringify({ severity, reason })
    }),

  assignIncident: (id: string, analystName: string) =>
    requestJson<{ incident: Incident }>(`/api/incidents/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ analystName })
    }),

  addIncidentNote: (id: string, text: string) =>
    requestJson<{ incident: Incident }>(`/api/incidents/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  addIncidentResponseAction: (
    id: string,
    payload: { actionName: string; targetAsset: string; details: string }
  ) =>
    requestJson<{ incident: Incident }>(`/api/incidents/${encodeURIComponent(id)}/actions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  closeIncident: (
    id: string,
    resolution: { rootCause: string; resolutionSummary: string; preventativeAction: string }
  ) =>
    requestJson<{ incident: Incident }>(`/api/incidents/${encodeURIComponent(id)}/close`, {
      method: 'POST',
      body: JSON.stringify(resolution)
    }),

  // Detection Rules, Log Sources, Audit Logs
  getDetectionRules: () => requestJson<{ rules: DetectionRule[] }>('/api/detection-rules'),

  updateDetectionRule: (
    id: string,
    patch: { enabled?: boolean; timeWindowMinutes?: number; thresholdCount?: number }
  ) =>
    requestJson<{ rule: DetectionRule }>(`/api/detection-rules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    }),

  getLogSources: () => requestJson<{ logSources: LogSource[] }>('/api/log-sources'),

  toggleLogSource: (id: string) =>
    requestJson<{ logSource: LogSource }>(`/api/log-sources/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH'
    }),

  getAuditLogs: (limit = 200) =>
    requestJson<{ auditLogs: AuditLog[] }>(`/api/audit-logs${buildQuery({ limit })}`)
};
