/**
 * Ministry of Revenue SOC - Core Data Types
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type IncidentStatus = 'new' | 'investigating' | 'contained' | 'resolved' | 'closed';

export type AlertStatus = 'new' | 'acknowledged' | 'assigned' | 'investigating' | 'linked' | 'false_positive';

export type SourceStatus = 'healthy' | 'delayed' | 'offline' | 'parsing_error';

export type AssetCriticality = 'mission_critical' | 'high' | 'medium' | 'low';

export type AssetType =
  | 'Workstation'
  | 'Windows Server'
  | 'Linux Server'
  | 'Domain Controller'
  | 'Network Switch'
  | 'Firewall'
  | 'Web Server'
  | 'Database Server';

export type UserRole =
  | 'Security Administrator'
  | 'SOC Analyst'
  | 'Incident Responder'
  | 'Auditor'
  | 'Management / Read-only Viewer';

export type TimeRangeOption =
  | 'Last 24 Hours'
  | 'Last 15 Days'
  | 'Last Month'
  | 'Last 3 Months';

export type EventCategory =
  | 'Authentication'
  | 'Network'
  | 'Malware'
  | 'Web Application'
  | 'System'
  | 'Endpoint'
  | 'DNS and DHCP'
  | 'Other';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  sourceName: string;
  sourceType: string;
  hostname: string;
  username?: string;
  srcIp?: string;
  destIp?: string;
  category: EventCategory;
  severity: Severity;
  originalMessage: string;
  normalizedFields: {
    action?: string;
    protocol?: string;
    port?: number;
    processName?: string;
    processId?: number;
    fileHash?: string;
    ruleTriggered?: string;
    authMethod?: string;
    targetResource?: string;
    userAgent?: string;
    statusCode?: number;
    bytesTransferred?: number;
  };
  relatedAlertId?: string;
  relatedIncidentId?: string;
  collectionTimestamp: string;
  parsingStatus: 'parsed' | 'partial' | 'failed';
}

export interface IncidentTimelineItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  note?: string;
  type: 'status_change' | 'note_added' | 'severity_change' | 'action_taken' | 'assignment';
}

export interface InvestigationNote {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  text: string;
}

export interface ResponseAction {
  id: string;
  actionName: string;
  targetAsset: string;
  initiatedBy: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'failed';
  resultDetails: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  detectionTime: string;
  lastUpdated: string;
  affectedAssets: string[];
  assignedAnalyst: string;
  source: string;
  summary: string;
  description: string;
  relatedEventIds: string[];
  relatedAlertIds: string[];
  timeline: IncidentTimelineItem[];
  notes: InvestigationNote[];
  responseActions: ResponseAction[];
  closedResolution?: {
    resolvedAt: string;
    resolvedBy: string;
    rootCause: string;
    resolutionSummary: string;
    preventativeAction: string;
  };
}

export interface AlertEvidenceField {
  label: string;
  value: string;
}

export interface Alert {
  id: string;
  title: string;
  detectionRuleId: string;
  detectionRuleName: string;
  severity: Severity;
  firstDetected: string;
  lastDetected: string;
  sourceSystem: string;
  affectedAsset: string;
  relatedIncidentId?: string;
  status: AlertStatus;
  evidence: AlertEvidenceField[];
  falsePositiveReason?: string;
  falsePositiveBy?: string;
  assignedTo?: string;
  eventCount: number;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: EventCategory;
  detectionLogic: string;
  requiredSources: string[];
  enabled: boolean;
  lastTriggered: string;
  timeWindowMinutes: number;
  investigationGuidance: string;
  sampleTestPayload?: string;
}

export interface LogSource {
  id: string;
  name: string;
  type: string;
  hostname: string;
  collectionMethod: 'Syslog' | 'WinRM' | 'WEF' | 'Endpoint Agent' | 'API' | 'SNMP' | 'Database JDBC';
  ipAddress: string;
  lastEventReceived: string;
  eventsPerMinute: number;
  parsingSuccessRate: number;
  status: SourceStatus;
  dataFreshness: string;
  retentionDays: number;
  enabled: boolean;
  errorLog?: string;
  totalEventsProcessed: number;
}

export interface Asset {
  id: string;
  hostname: string;
  type: AssetType;
  os: string;
  ipAddress: string;
  macAddress: string;
  criticality: AssetCriticality;
  status: 'Online' | 'Offline' | 'Warning';
  lastSeen: string;
  associatedAlertCount: number;
  associatedIncidentCount: number;
  department: string;
  agentVersion?: string;
  assignedAdmin?: string;
}

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash';
  value: string;
  source: string;
  firstObserved: string;
  lastObserved: string;
  confidence: number; // 0 - 100
  riskRating: Severity;
  relatedEventsCount: number;
  expirationDate: string;
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  result: 'Success' | 'Failed' | 'Denied';
  details: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'Active' | 'Disabled';
  lastLogin: string;
  department: string;
}

export interface GeoAttackSource {
  country: string;
  countryCode: string;
  eventCount: number;
  alertCount: number;
  lat: number;
  lng: number;
  topTargetAsset: string;
  topAttackVector: string;
}

export interface NetworkFlow {
  id: string;
  timestamp: string;
  srcIp: string;
  destIp: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'TLS';
  port: number;
  bytes: number;
  action: 'ALLOW' | 'BLOCK';
  device: string;
  flag?: string;
}

export interface TimeRangeMetrics {
  totalEvents: number;
  totalEventsChangePct: number;
  criticalEvents: number;
  highEvents: number;
  securityIncidents: number;
  incidentsChangePct: number;
  eventsOverTime: {
    time: string;
    total: number;
    critical: number;
    high: number;
  }[];
  eventTypesBreakdown: {
    category: EventCategory;
    count: number;
    percentage: number;
    color: string;
  }[];
  topThreatCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  eventsBySource: {
    source: string;
    count: number;
    percentage: number;
    status: SourceStatus;
  }[];
  incidentsBySeverity: {
    severity: Severity;
    count: number;
    percentage: number;
    color: string;
  }[];
  geoAttackSources: GeoAttackSource[];
}

export interface SystemHealthMetrics {
  overallStatus: 'Healthy' | 'Degraded' | 'Critical';
  collectorsOnline: number;
  collectorsTotal: number;
  agentsReporting: number;
  agentsTotal: number;
  ingestionRateEPS: number;
  storageUsageTB: number;
  storageCapacityTB: number;
  retentionDays: number;
  lastSuccessfulIngestion: string;
}
