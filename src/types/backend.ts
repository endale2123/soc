import {
  Alert,
  AuditLog,
  DetectionRule,
  Incident,
  LogSource,
  SecurityEvent,
  SystemHealthMetrics,
  TimeRangeMetrics,
  User,
  UserRole
} from './soc';

export type DataMode = 'live' | 'demo';

export interface RolePermissions {
  canManageUsers: boolean;
  canManageAgents: boolean;
  canViewEvents: boolean;
  canManageAlerts: boolean;
  canManageIncidents: boolean;
  canManageRules: boolean;
  canViewAuditLogs: boolean;
  canExportReports: boolean;
}

export interface AuthSessionResponse {
  user: User;
  permissions: RolePermissions;
  expiresAt?: string;
  sessionToken?: string;
}

export type AgentStatus =
  | 'Online'
  | 'Offline'
  | 'Pending Enrollment'
  | 'Unhealthy'
  | 'Disabled';

export interface EndpointSummary {
  agentId: string;
  hostname: string;
  status: AgentStatus;
  agentVersion: string;
  ipAddress: string;
  macAddress: string;
  os: string;
  osVersion: string;
  osBuild: string;
  domainMembership: string;
  lastHeartbeat: string | null;
  lastEventReceived: string | null;
  totalEventsCollected: number;
  activeAlertsCount?: number;
  enrolledAt: string;
  lastError?: string | null;
  deactivatedAt?: string | null;
}

export interface EndpointInventory {
  fqdn: string | null;
  domainMembership: string | null;
  workgroup: string | null;
  osName: string;
  osVersion: string | null;
  osBuild: string | null;
  architecture: string | null;
  cpuModel: string | null;
  cpuCores: number | null;
  totalMemoryMb: number | null;
  diskTotalGb: number | null;
  ipAddresses: string[];
  macAddresses: string[];
  hardwareVendor: string | null;
  hardwareModel: string | null;
  serialNumber: string | null;
  lastBootTime: string | null;
  updatedAt: string;
}

export interface AgentConfiguration {
  agentId?: string;
  heartbeatIntervalSec: number;
  offlineThresholdSec: number;
  batchSize: number;
  flushIntervalSec: number;
  enabledChannels: string[];
  monitoredEventIds: number[];
  configVersion: number;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface AgentHeartbeatRecord {
  id: string;
  status: AgentStatus;
  agent_version: string;
  cpu_usage_pct: string | null;
  memory_usage_pct: string | null;
  disk_free_mb: string | null;
  queue_depth: number;
  buffer_overflow: boolean;
  ingestion_errors: number;
  error_message: string | null;
  reported_at: string;
  received_at: string;
}

export interface EndpointDetailsResponse {
  endpoint: EndpointSummary & {
    assetId?: string | null;
    logSourceId?: string | null;
  };
  inventory: EndpointInventory | null;
  configuration: AgentConfiguration | null;
  recentHeartbeats: AgentHeartbeatRecord[];
  counts: {
    events: number;
    alerts: number;
    incidents: number;
  };
}

export interface AgentStatisticsResponse {
  totalEndpoints: number;
  onlineEndpoints: number;
  offlineEndpoints: number;
  unhealthyAgents: number;
  pendingEnrollment: number;
  disabledEndpoints: number;
  totalCollectedEvents: number;
  eventsPerSecond: number;
}

export interface EnrollmentTokenRecord {
  id: string;
  tokenPrefix: string;
  label: string;
  createdBy: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  usedAt: string | null;
  usedByAgentId: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
}

export interface CreatedEnrollmentTokenResponse {
  id: string;
  enrollmentToken: string; // Shown once
  tokenPrefix: string;
  label: string;
  expiresAt: string;
  maxUses: number;
  createdAt: string;
}

export interface WindowsEventSummary {
  id: string;
  detailId: string;
  agentId: string | null;
  windowsEventId: number;
  recordId: number | null;
  channel: string;
  providerName: string;
  hostname: string;
  domain: string | null;
  targetUsername: string | null;
  subjectUsername: string | null;
  username: string | null;
  logonType: number | null;
  processName: string | null;
  processId: number | null;
  parentProcessName: string | null;
  parentProcessId: number | null;
  commandLine: string | null;
  serviceName: string | null;
  taskName: string | null;
  targetGroup: string | null;
  statusCode: string | null;
  subStatus: string | null;
  timestamp: string;
  severity: string;
  category: string;
  srcIp: string | null;
  destIp: string | null;
  message: string;
  hasRawXml: boolean;
  relatedAlertId: string | null;
  relatedIncidentId: string | null;
  rawXml?: string | null;
  structuredData?: Record<string, unknown>;
}

export interface DashboardKpis {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  activeAlerts: number;
  activeIncidents: number;
  totalEndpoints: number;
  onlineAgents: number;
  offlineAgents: number;
  unhealthyAgents: number;
  eventsPerSecond: number;
  windowsSecurityEvents: number;
  failedLoginAttempts: number;
  suspiciousProcessActivity: number;
}

export interface DashboardStatisticsResponse {
  kpis: DashboardKpis;
  metrics: TimeRangeMetrics;
  healthMetrics: SystemHealthMetrics;
}

export interface InstallerInfoResponse {
  serverUrl: string;
  supportedWindowsEventIds: number[];
  defaultChannels: string[];
  agentBinaryAvailable: boolean;
  agentPackageStatus: string;
  powershellInstallCommand: string;
  enrollApiSample: Record<string, unknown>;
}

export type BackendSyncPayload = {
  users?: User[];
  events?: SecurityEvent[];
  alerts?: Alert[];
  incidents?: Incident[];
  logSources?: LogSource[];
  detectionRules?: DetectionRule[];
  auditLogs?: AuditLog[];
  role?: UserRole;
};
