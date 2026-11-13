/**
 * Ministry of Revenue SOC - Global State Provider
 * Connects seamlessly to the PostgreSQL + Express backend in Live Production mode
 * and cleanly isolates offline Demo Fallback data when unauthenticated.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  SecurityEvent,
  Incident,
  Alert,
  LogSource,
  Asset,
  DetectionRule,
  ThreatIndicator,
  AuditLog,
  User,
  UserRole,
  TimeRangeOption,
  TimeRangeMetrics,
  SystemHealthMetrics,
  Severity,
  IncidentStatus,
  EventCategory
} from '../types/soc';
import {
  AgentStatisticsResponse,
  DashboardKpis,
  DataMode,
  EndpointSummary,
  RolePermissions
} from '../types/backend';
import {
  INITIAL_USERS,
  INITIAL_ASSETS,
  INITIAL_LOG_SOURCES,
  INITIAL_DETECTION_RULES,
  INITIAL_INCIDENTS,
  INITIAL_ALERTS,
  INITIAL_SECURITY_EVENTS,
  INITIAL_THREAT_INDICATORS,
  INITIAL_AUDIT_LOGS,
  SYSTEM_HEALTH_DATA,
  METRICS_BY_TIMERANGE
} from '../data/mockData';
import { socApi } from '../services/socApi';

export type PageId =
  | 'dashboard'
  | 'events'
  | 'windows-events'
  | 'incidents'
  | 'threat-intel'
  | 'alerts'
  | 'log-management'
  | 'assets'
  | 'endpoints'
  | 'endpoint-details'
  | 'agent-deployment'
  | 'network'
  | 'reports'
  | 'settings';

export interface EventFilterState {
  search?: string;
  category?: EventCategory | 'ALL';
  severity?: Severity | 'ALL';
  source?: string | 'ALL';
  hostname?: string;
}

export interface IncidentFilterState {
  severity?: Severity | 'ALL';
  status?: IncidentStatus | 'ALL';
  search?: string;
}

const EMPTY_AGENT_STATS: AgentStatisticsResponse = {
  totalEndpoints: 0,
  onlineEndpoints: 0,
  offlineEndpoints: 0,
  unhealthyAgents: 0,
  pendingEnrollment: 0,
  disabledEndpoints: 0,
  totalCollectedEvents: 0,
  eventsPerSecond: 0
};

const EMPTY_LIVE_METRICS: TimeRangeMetrics = {
  totalEvents: 0,
  totalEventsChangePct: 0,
  criticalEvents: 0,
  highEvents: 0,
  securityIncidents: 0,
  incidentsChangePct: 0,
  eventsOverTime: [],
  eventTypesBreakdown: [],
  topThreatCategories: [],
  eventsBySource: [],
  incidentsBySeverity: [],
  geoAttackSources: []
};

const EMPTY_LIVE_HEALTH: SystemHealthMetrics = {
  overallStatus: 'Healthy',
  collectorsOnline: 0,
  collectorsTotal: 0,
  agentsReporting: 0,
  agentsTotal: 0,
  ingestionRateEPS: 0,
  storageUsageTB: 0,
  storageCapacityTB: 10,
  retentionDays: 180,
  lastSuccessfulIngestion: 'No ingestion yet'
};

function getPermissionsForRole(role: UserRole): RolePermissions {
  switch (role) {
    case 'Security Administrator':
      return {
        canManageUsers: true,
        canManageAgents: true,
        canViewEvents: true,
        canManageAlerts: true,
        canManageIncidents: true,
        canManageRules: true,
        canViewAuditLogs: true,
        canExportReports: true
      };
    case 'SOC Analyst':
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: true,
        canManageAlerts: true,
        canManageIncidents: true,
        canManageRules: true,
        canViewAuditLogs: false,
        canExportReports: true
      };
    case 'Incident Responder':
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: true,
        canManageAlerts: true,
        canManageIncidents: true,
        canManageRules: false,
        canViewAuditLogs: false,
        canExportReports: true
      };
    case 'Auditor':
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: true,
        canManageAlerts: false,
        canManageIncidents: false,
        canManageRules: false,
        canViewAuditLogs: true,
        canExportReports: true
      };
    case 'Management / Read-only Viewer':
    default:
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: false,
        canManageAlerts: false,
        canManageIncidents: false,
        canManageRules: false,
        canViewAuditLogs: false,
        canExportReports: true
      };
  }
}

interface SOCContextType {
  // Navigation & Viewport
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  timeRange: TimeRangeOption;
  setTimeRange: (range: TimeRangeOption) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentTimeString: string;

  // Live Backend Session & Mode
  dataMode: DataMode;
  authChecked: boolean;
  authLoading: boolean;
  permissions: RolePermissions;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logoutSession: () => Promise<void>;
  refreshLiveData: () => Promise<void>;
  sseConnected: boolean;
  actionError: string | null;
  clearActionError: () => void;

  // RBAC & Users
  currentUser: User;
  switchUser: (role: UserRole) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'lastLogin'> & { password?: string }) => Promise<User>;

  // Dynamic Metrics & Health
  metrics: TimeRangeMetrics;
  healthMetrics: SystemHealthMetrics;
  dashboardKpis: DashboardKpis | null;

  // Endpoints & Agents
  endpoints: EndpointSummary[];
  agentStats: AgentStatisticsResponse;
  selectedEndpointId: string | null;
  setSelectedEndpointId: (id: string | null) => void;
  openEndpointDetails: (agentId: string) => void;

  // Security Events
  events: SecurityEvent[];
  eventFilters: EventFilterState;
  setEventFilters: React.Dispatch<React.SetStateAction<EventFilterState>>;
  selectedEvent: SecurityEvent | null;
  setSelectedEventId: (id: string | null) => void;
  drillDownToEvents: (filters: Partial<EventFilterState>) => void;

  // Incidents
  incidents: Incident[];
  incidentFilters: IncidentFilterState;
  setIncidentFilters: React.Dispatch<React.SetStateAction<IncidentFilterState>>;
  selectedIncident: Incident | null;
  setSelectedIncidentId: (id: string | null) => void;
  drillDownToIncidents: (filters: Partial<IncidentFilterState>) => void;
  createIncident: (incident: Omit<Incident, 'id' | 'detectionTime' | 'lastUpdated' | 'timeline' | 'notes' | 'responseActions'>) => Incident;
  updateIncidentStatus: (id: string, status: IncidentStatus, note?: string) => void;
  updateIncidentSeverity: (id: string, severity: Severity, reason: string) => void;
  assignIncident: (id: string, analystName: string) => void;
  addIncidentNote: (id: string, text: string) => void;
  addResponseAction: (id: string, actionName: string, targetAsset: string, details: string) => void;
  closeIncidentWithResolution: (id: string, resolution: { rootCause: string; resolutionSummary: string; preventativeAction: string }) => void;

  // Alerts
  alerts: Alert[];
  selectedAlert: Alert | null;
  setSelectedAlertId: (id: string | null) => void;
  acknowledgeAlert: (id: string) => void;
  assignAlert: (id: string, analyst: string) => void;
  markAlertFalsePositive: (id: string, reason: string) => void;
  resolveAlert: (id: string, note?: string) => Promise<void>;
  escalateAlertToIncident: (alertId: string) => Promise<Incident>;
  linkAlertToIncident: (alertId: string, incidentId: string) => void;

  // Log Sources
  logSources: LogSource[];
  toggleLogSource: (id: string) => void;
  addLogSource: (source: Omit<LogSource, 'id' | 'totalEventsProcessed' | 'lastEventReceived'>) => void;

  // Assets
  assets: Asset[];
  selectedAsset: Asset | null;
  setSelectedAssetId: (id: string | null) => void;

  // Threat Intel
  threatIndicators: ThreatIndicator[];
  addThreatIndicator: (indicator: Omit<ThreatIndicator, 'id' | 'firstObserved' | 'lastObserved' | 'relatedEventsCount'>) => void;

  // Detection Rules
  detectionRules: DetectionRule[];
  toggleDetectionRule: (id: string) => void;
  updateDetectionRuleConfig: (
    id: string,
    patch: { enabled?: boolean; timeWindowMinutes?: number; thresholdCount?: number }
  ) => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, target: string, result: 'Success' | 'Failed' | 'Denied', details: string) => void;

  // Utilities
  resetDemoData: () => void;
}

const SOCContext = createContext<SOCContextType | undefined>(undefined);

export const SOCProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('Last 24 Hours');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Real-time clock formatted for East Africa Time (UTC+3)
  const [currentTimeString, setCurrentTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Addis_Ababa',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setCurrentTimeString(`${now.toLocaleDateString('en-GB', options)} (UTC+3 EAT)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Backend Session & Data Mode
  const [dataMode, setDataMode] = useState<DataMode>('demo');
  const [authChecked, setAuthChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>(
    getPermissionsForRole(INITIAL_USERS[0].role)
  );

  // Live Collections (Strictly separate from demo fallback data)
  const [liveUser, setLiveUser] = useState<User | null>(null);
  const [liveUsers, setLiveUsers] = useState<User[]>([]);
  const [liveEvents, setLiveEvents] = useState<SecurityEvent[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [liveLogSources, setLiveLogSources] = useState<LogSource[]>([]);
  const [liveDetectionRules, setLiveDetectionRules] = useState<DetectionRule[]>([]);
  const [liveAuditLogs, setLiveAuditLogs] = useState<AuditLog[]>([]);
  const [liveEndpoints, setLiveEndpoints] = useState<EndpointSummary[]>([]);
  const [liveAgentStats, setLiveAgentStats] = useState<AgentStatisticsResponse>(EMPTY_AGENT_STATS);
  const [liveMetrics, setLiveMetrics] = useState<TimeRangeMetrics>(EMPTY_LIVE_METRICS);
  const [liveHealthMetrics, setLiveHealthMetrics] = useState<SystemHealthMetrics>(EMPTY_LIVE_HEALTH);
  const [dashboardKpis, setDashboardKpis] = useState<DashboardKpis | null>(null);

  // Demo Fallback Collections (localStorage)
  const [demoUser, setDemoUser] = useState<User>(INITIAL_USERS[0]);
  const [demoUsers, setDemoUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mor_soc_v4_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [demoEvents] = useState<SecurityEvent[]>(() => {
    const saved = localStorage.getItem('mor_soc_v4_events');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_EVENTS;
  });
  const [demoIncidents, setDemoIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('mor_soc_v4_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });
  const [demoAlerts, setDemoAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('mor_soc_v4_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });
  const [demoLogSources, setDemoLogSources] = useState<LogSource[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_sources');
    return saved ? JSON.parse(saved) : INITIAL_LOG_SOURCES;
  });
  const [assets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });
  const [threatIndicators, setThreatIndicators] = useState<ThreatIndicator[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_threats');
    return saved ? JSON.parse(saved) : INITIAL_THREAT_INDICATORS;
  });
  const [demoDetectionRules, setDemoDetectionRules] = useState<DetectionRule[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_rules');
    return saved ? JSON.parse(saved) : INITIAL_DETECTION_RULES;
  });
  const [demoAuditLogs, setDemoAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Filters and Selections
  const [eventFilters, setEventFilters] = useState<EventFilterState>({
    category: 'ALL',
    severity: 'ALL',
    source: 'ALL'
  });

  const [incidentFilters, setIncidentFilters] = useState<IncidentFilterState>({
    severity: 'ALL',
    status: 'ALL'
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);

  // Sync Demo state changes to localStorage
  useEffect(() => {
    localStorage.setItem('mor_soc_v4_users', JSON.stringify(demoUsers));
  }, [demoUsers]);
  useEffect(() => {
    localStorage.setItem('mor_soc_v4_incidents', JSON.stringify(demoIncidents));
  }, [demoIncidents]);
  useEffect(() => {
    localStorage.setItem('mor_soc_v4_alerts', JSON.stringify(demoAlerts));
  }, [demoAlerts]);
  useEffect(() => {
    localStorage.setItem('mor_soc_v3_sources', JSON.stringify(demoLogSources));
  }, [demoLogSources]);
  useEffect(() => {
    localStorage.setItem('mor_soc_v3_threats', JSON.stringify(threatIndicators));
  }, [threatIndicators]);
  useEffect(() => {
    localStorage.setItem('mor_soc_v3_rules', JSON.stringify(demoDetectionRules));
  }, [demoDetectionRules]);
  useEffect(() => {
    localStorage.setItem('mor_soc_v3_audit', JSON.stringify(demoAuditLogs));
  }, [demoAuditLogs]);

  const timeRangeRef = useRef<TimeRangeOption>(timeRange);
  timeRangeRef.current = timeRange;

  // Fetch all live data from backend
  const fetchLiveData = useCallback(async (perms?: RolePermissions, rangeOverride?: TimeRangeOption) => {
    const activeRange = rangeOverride ?? timeRangeRef.current;
    try {
      const [
        dashRes,
        agentStatsRes,
        endpointsRes,
        alertsRes,
        incidentsRes,
        sourcesRes,
        rulesRes
      ] = await Promise.all([
        socApi.getDashboardStatistics(activeRange),
        socApi.getAgentStatistics(),
        socApi.getEndpoints({ page: 1, pageSize: 100 }),
        socApi.getAlerts(),
        socApi.getIncidents(),
        socApi.getLogSources(),
        socApi.getDetectionRules()
      ]);

      setDashboardKpis(dashRes.kpis);
      setLiveMetrics(dashRes.metrics);
      setLiveHealthMetrics(dashRes.healthMetrics);
      setLiveAgentStats(agentStatsRes);
      setLiveEndpoints(endpointsRes.items);
      setLiveAlerts(alertsRes.alerts);
      setLiveIncidents(incidentsRes.incidents);
      setLiveLogSources(sourcesRes.logSources);
      setLiveDetectionRules(rulesRes.rules);

      if (perms?.canViewEvents !== false) {
        try {
          const evRes = await socApi.getEvents({ page: 1, pageSize: 100 });
          setLiveEvents(evRes.items);
        } catch {
          setLiveEvents([]);
        }
      }

      if (perms?.canManageUsers) {
        try {
          const usrRes = await socApi.getUsers();
          setLiveUsers(usrRes.users);
        } catch {
          setLiveUsers([]);
        }
      } else {
        setLiveUsers([]);
      }

      if (perms?.canViewAuditLogs) {
        try {
          const audRes = await socApi.getAuditLogs(200);
          setLiveAuditLogs(audRes.auditLogs);
        } catch {
          setLiveAuditLogs([]);
        }
      } else {
        setLiveAuditLogs([]);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to synchronize live SOC data');
    }
  }, []);

  const refreshLiveData = useCallback(async () => {
    if (dataMode !== 'live') return;
    await fetchLiveData(permissions, timeRange);
  }, [dataMode, fetchLiveData, permissions, timeRange]);

  // Check initial session on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await socApi.me();
        if (!active) return;
        setLiveUser(session.user);
        setPermissions(session.permissions);
        setDataMode('live');
        await fetchLiveData(session.permissions);
      } catch {
        if (!active) return;
        setDataMode('demo');
      } finally {
        if (active) setAuthChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchLiveData]);

  // Reload live statistics when timeRange changes in live mode
  useEffect(() => {
    if (dataMode !== 'live') return;
    socApi
      .getDashboardStatistics(timeRange)
      .then((res) => {
        setDashboardKpis(res.kpis);
        setLiveMetrics(res.metrics);
        setLiveHealthMetrics(res.healthMetrics);
      })
      .catch(() => undefined);
  }, [dataMode, timeRange]);

  // Subscribe to Server-Sent Events (/api/stream) while in Live Production mode
  useEffect(() => {
    if (dataMode !== 'live') {
      setSseConnected(false);
      return;
    }

    const es = new EventSource('/api/stream', { withCredentials: true });
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleMetricsRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        Promise.all([
          socApi.getDashboardStatistics(timeRangeRef.current),
          socApi.getAgentStatistics(),
          socApi.getEndpoints({ page: 1, pageSize: 100 })
        ])
          .then(([dashRes, agStats, epRes]) => {
            setDashboardKpis(dashRes.kpis);
            setLiveMetrics(dashRes.metrics);
            setLiveHealthMetrics(dashRes.healthMetrics);
            setLiveAgentStats(agStats);
            setLiveEndpoints(epRes.items);
          })
          .catch(() => undefined);
      }, 1200);
    };

    es.addEventListener('connected', () => {
      setSseConnected(true);
    });

    es.addEventListener('event:created', (e) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data) as SecurityEvent;
        setLiveEvents((prev) => {
          if (prev.some((x) => x.id === evt.id)) return prev;
          return [
            {
              ...evt,
              normalizedFields: evt.normalizedFields || {},
              collectionTimestamp: evt.collectionTimestamp || evt.timestamp,
              parsingStatus: evt.parsingStatus || 'parsed'
            },
            ...prev
          ].slice(0, 200);
        });
        scheduleMetricsRefresh();
      } catch {
        // Ignore malformed SSE payload
      }
    });

    const handleAlertEvent = (e: Event) => {
      try {
        const alertObj = JSON.parse((e as MessageEvent).data) as Alert;
        setLiveAlerts((prev) => {
          const exists = prev.some((a) => a.id === alertObj.id);
          if (exists) {
            return prev.map((a) => (a.id === alertObj.id ? { ...a, ...alertObj } : a));
          }
          return [alertObj, ...prev];
        });
        scheduleMetricsRefresh();
      } catch {
        // Ignore
      }
    };

    es.addEventListener('alert:created', handleAlertEvent);
    es.addEventListener('alert:updated', handleAlertEvent);

    const handleIncidentEvent = () => {
      socApi
        .getIncidents()
        .then((res) => setLiveIncidents(res.incidents))
        .catch(() => undefined);
      scheduleMetricsRefresh();
    };

    es.addEventListener('incident:created', handleIncidentEvent);
    es.addEventListener('incident:updated', handleIncidentEvent);

    const handleAgentEvent = () => {
      scheduleMetricsRefresh();
    };

    es.addEventListener('agent:enrolled', handleAgentEvent);
    es.addEventListener('agent:heartbeat', handleAgentEvent);
    es.addEventListener('agent:status_changed', handleAgentEvent);
    es.addEventListener('agent:deactivated', handleAgentEvent);
    es.addEventListener('agent:config_updated', handleAgentEvent);
    es.addEventListener('stats:updated', handleAgentEvent);

    es.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      es.close();
      setSseConnected(false);
    };
  }, [dataMode]);

  // Auth actions
  const loginWithPassword = async (email: string, password: string) => {
    setAuthLoading(true);
    setActionError(null);
    try {
      const session = await socApi.login(email, password);
      setLiveUser(session.user);
      setPermissions(session.permissions);
      setDataMode('live');
      setSelectedEventId(null);
      setSelectedIncidentId(null);
      setSelectedAlertId(null);
      setSelectedEndpointId(null);
      await fetchLiveData(session.permissions);
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutSession = async () => {
    try {
      await socApi.logout();
    } catch {
      // Proceed cleanly even if session already expired
    }
    setLiveUser(null);
    setLiveUsers([]);
    setLiveEvents([]);
    setLiveAlerts([]);
    setLiveIncidents([]);
    setLiveLogSources([]);
    setLiveDetectionRules([]);
    setLiveAuditLogs([]);
    setLiveEndpoints([]);
    setLiveAgentStats(EMPTY_AGENT_STATS);
    setLiveMetrics(EMPTY_LIVE_METRICS);
    setLiveHealthMetrics(EMPTY_LIVE_HEALTH);
    setDashboardKpis(null);
    setPermissions(getPermissionsForRole(demoUser.role));
    setDataMode('demo');
    setSelectedEndpointId(null);
  };

  // Active resolved collections depending strictly on dataMode
  const currentUser = dataMode === 'live' && liveUser ? liveUser : demoUser;
  const users = dataMode === 'live' ? (liveUsers.length > 0 ? liveUsers : liveUser ? [liveUser] : []) : demoUsers;
  const events = dataMode === 'live' ? liveEvents : demoEvents;
  const incidents = dataMode === 'live' ? liveIncidents : demoIncidents;
  const alerts = dataMode === 'live' ? liveAlerts : demoAlerts;
  const logSources = dataMode === 'live' ? liveLogSources : demoLogSources;
  const detectionRules = dataMode === 'live' ? liveDetectionRules : demoDetectionRules;
  const auditLogs = dataMode === 'live' ? liveAuditLogs : demoAuditLogs;
  const endpoints = dataMode === 'live' ? liveEndpoints : [];
  const agentStats = dataMode === 'live' ? liveAgentStats : EMPTY_AGENT_STATS;
  const metrics = dataMode === 'live' ? liveMetrics : METRICS_BY_TIMERANGE[timeRange];
  const healthMetrics = dataMode === 'live' ? liveHealthMetrics : SYSTEM_HEALTH_DATA;

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || null;
  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || null;
  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;

  const addUser = async (
    userData: Omit<User, 'id' | 'lastLogin'> & { password?: string }
  ): Promise<User> => {
    if (dataMode === 'live') {
      const res = await socApi.createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password || 'MorSoc@User2026!',
        role: userData.role,
        department: userData.department,
        status: userData.status
      });
      setLiveUsers((prev) => [res.user, ...prev]);
      return res.user;
    }

    const newUser: User = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      status: userData.status,
      id: `usr-${Date.now().toString().slice(-4)}`,
      lastLogin: 'Never'
    };
    setDemoUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  // Audit Logger Helper (for Demo mode / local annotations)
  const addAuditLog = (action: string, target: string, result: 'Success' | 'Failed' | 'Denied', details: string) => {
    if (dataMode === 'live') {
      return; // Live audit logs are written authoritatively by backend services
    }
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser.name,
      role: currentUser.role,
      action,
      target,
      result,
      details
    };
    setDemoAuditLogs((prev) => [newLog, ...prev]);
  };

  // Demo-only role switcher (disabled in live production mode)
  const switchUser = (role: UserRole) => {
    if (dataMode === 'live') {
      setLoginModalOpen(true);
      return;
    }
    const user = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setDemoUser(user);
    setPermissions(getPermissionsForRole(role));
    addAuditLog('User Session Switched', `Active User: ${user.name} (${role})`, 'Success', 'Switched session in offline demo mode.');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const openEndpointDetails = (agentId: string) => {
    setSelectedEndpointId(agentId);
    setActivePage('endpoint-details');
  };

  const drillDownToEvents = (filters: Partial<EventFilterState>) => {
    setEventFilters((prev) => ({ ...prev, ...filters }));
    setActivePage('events');
  };

  const drillDownToIncidents = (filters: Partial<IncidentFilterState>) => {
    setIncidentFilters((prev) => ({ ...prev, ...filters }));
    setActivePage('incidents');
  };

  const runLiveMutation = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Backend operation failed');
    }
  };

  // Incident Actions
  const createIncident = (
    newIncData: Omit<Incident, 'id' | 'detectionTime' | 'lastUpdated' | 'timeline' | 'notes' | 'responseActions'>
  ): Incident => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const incId = `INC-2026-${String(demoIncidents.length + 42).padStart(4, '0')}`;
    const newIncident: Incident = {
      ...newIncData,
      id: incId,
      detectionTime: now,
      lastUpdated: now,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          timestamp: now,
          user: `${currentUser.name} (${currentUser.role})`,
          action: 'Incident manually created and opened',
          type: 'status_change'
        }
      ],
      notes: [],
      responseActions: []
    };
    setDemoIncidents((prev) => [newIncident, ...prev]);
    addAuditLog('Incident Created', `Incident: ${incId} (${newIncident.title})`, 'Success', `Created with severity ${newIncident.severity}`);
    return newIncident;
  };

  const updateIncidentStatus = (id: string, newStatus: IncidentStatus, note?: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.updateIncidentStatus(id, newStatus, note);
        setLiveIncidents((prev) => prev.map((inc) => (inc.id === id ? res.incident : inc)));
      });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setDemoIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const updatedTimeline = [
            ...inc.timeline,
            {
              id: `TL-${Date.now()}`,
              timestamp: now,
              user: `${currentUser.name} (${currentUser.role})`,
              action: `Status updated to ${newStatus.toUpperCase()}`,
              note,
              type: 'status_change' as const
            }
          ];
          return { ...inc, status: newStatus, lastUpdated: now, timeline: updatedTimeline };
        }
        return inc;
      })
    );
    addAuditLog('Incident Status Updated', `Incident: ${id}`, 'Success', `Status changed to ${newStatus.toUpperCase()}${note ? ` Note: ${note}` : ''}`);
  };

  const updateIncidentSeverity = (id: string, newSeverity: Severity, reason: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.updateIncidentSeverity(id, newSeverity, reason);
        setLiveIncidents((prev) => prev.map((inc) => (inc.id === id ? res.incident : inc)));
      });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setDemoIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return {
            ...inc,
            severity: newSeverity,
            lastUpdated: now,
            timeline: [
              ...inc.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: now,
                user: `${currentUser.name} (${currentUser.role})`,
                action: `Severity reclassified to ${newSeverity.toUpperCase()}`,
                note: reason,
                type: 'severity_change'
              }
            ]
          };
        }
        return inc;
      })
    );
    addAuditLog('Incident Severity Changed', `Incident: ${id}`, 'Success', `Reclassified to ${newSeverity.toUpperCase()}. Reason: ${reason}`);
  };

  const assignIncident = (id: string, analystName: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.assignIncident(id, analystName);
        setLiveIncidents((prev) => prev.map((inc) => (inc.id === id ? res.incident : inc)));
      });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setDemoIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return {
            ...inc,
            assignedAnalyst: analystName,
            lastUpdated: now,
            timeline: [
              ...inc.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: now,
                user: `${currentUser.name} (${currentUser.role})`,
                action: `Reassigned to ${analystName}`,
                type: 'assignment'
              }
            ]
          };
        }
        return inc;
      })
    );
    addAuditLog('Incident Reassigned', `Incident: ${id}`, 'Success', `Assigned to ${analystName}`);
  };

  const addIncidentNote = (id: string, text: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.addIncidentNote(id, text);
        setLiveIncidents((prev) => prev.map((inc) => (inc.id === id ? res.incident : inc)));
      });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newNote = {
      id: `NOTE-${Date.now()}`,
      author: currentUser.name,
      role: currentUser.role,
      timestamp: now,
      text
    };
    setDemoIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return {
            ...inc,
            lastUpdated: now,
            notes: [...inc.notes, newNote],
            timeline: [
              ...inc.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: now,
                user: `${currentUser.name} (${currentUser.role})`,
                action: 'Investigation note added',
                type: 'note_added'
              }
            ]
          };
        }
        return inc;
      })
    );
    addAuditLog('Investigation Note Added', `Incident: ${id}`, 'Success', `Added note: "${text.slice(0, 50)}..."`);
  };

  const addResponseAction = (id: string, actionName: string, targetAsset: string, details: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.addIncidentResponseAction(id, { actionName, targetAsset, details });
        setLiveIncidents((prev) => prev.map((inc) => (inc.id === id ? res.incident : inc)));
      });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newAction = {
      id: `ACT-${Date.now()}`,
      actionName,
      targetAsset,
      initiatedBy: currentUser.name,
      timestamp: now,
      status: 'completed' as const,
      resultDetails: details
    };
    setDemoIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return {
            ...inc,
            lastUpdated: now,
            responseActions: [...inc.responseActions, newAction],
            timeline: [
              ...inc.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: now,
                user: `${currentUser.name} (${currentUser.role})`,
                action: `Executed action: ${actionName} on ${targetAsset}`,
                type: 'action_taken'
              }
            ]
          };
        }
        return inc;
      })
    );
    addAuditLog('Containment Action Executed', `Target: ${targetAsset}`, 'Success', `${actionName}: ${details}`);
  };

  const closeIncidentWithResolution = (
    id: string,
    resolution: { rootCause: string; resolutionSummary: string; preventativeAction: string }
  ) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.closeIncident(id, resolution);
        setLiveIncidents((prev) => prev.map((inc) => (inc.id === id ? res.incident : inc)));
      });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setDemoIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return {
            ...inc,
            status: 'closed',
            lastUpdated: now,
            closedResolution: {
              resolvedAt: now,
              resolvedBy: currentUser.name,
              rootCause: resolution.rootCause,
              resolutionSummary: resolution.resolutionSummary,
              preventativeAction: resolution.preventativeAction
            },
            timeline: [
              ...inc.timeline,
              {
                id: `TL-${Date.now()}`,
                timestamp: now,
                user: `${currentUser.name} (${currentUser.role})`,
                action: 'Incident officially closed with documented resolution',
                type: 'status_change'
              }
            ]
          };
        }
        return inc;
      })
    );
    addAuditLog('Incident Closed', `Incident: ${id}`, 'Success', `Closed by ${currentUser.name}. Root cause: ${resolution.rootCause.slice(0, 60)}`);
  };

  // Alert Actions
  const acknowledgeAlert = (id: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.acknowledgeAlert(id);
        setLiveAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      });
      return;
    }

    setDemoAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged', assignedTo: currentUser.name } : a))
    );
    addAuditLog('Alert Acknowledged', `Alert: ${id}`, 'Success', `Acknowledged by ${currentUser.name}`);
  };

  const assignAlert = (id: string, analyst: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.assignAlert(id, analyst);
        setLiveAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      });
      return;
    }

    setDemoAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'assigned', assignedTo: analyst } : a))
    );
    addAuditLog('Alert Assigned', `Alert: ${id}`, 'Success', `Assigned to ${analyst}`);
  };

  const markAlertFalsePositive = (id: string, reason: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.markAlertFalsePositive(id, reason);
        setLiveAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      });
      return;
    }

    setDemoAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'false_positive',
              falsePositiveReason: reason,
              falsePositiveBy: currentUser.name
            }
          : a
      )
    );
    addAuditLog('Alert Marked False Positive', `Alert: ${id}`, 'Success', `Reason: ${reason}`);
  };

  const resolveAlert = async (id: string, note?: string) => {
    if (dataMode === 'live') {
      const res = await socApi.resolveAlert(id, note);
      setLiveAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      return;
    }

    setDemoAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a)));
    addAuditLog('Alert Resolved', `Alert: ${id}`, 'Success', note || 'Alert resolved by analyst');
  };

  const escalateAlertToIncident = async (alertId: string): Promise<Incident> => {
    if (dataMode === 'live') {
      const res = await socApi.escalateAlertToIncident(alertId);
      setLiveAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      const incRes = await socApi.getIncidents();
      setLiveIncidents(incRes.incidents);
      const found = incRes.incidents.find((i) => i.id === res.incident.id);
      return found || res.incident;
    }

    const targetAlert = demoAlerts.find((a) => a.id === alertId);
    if (!targetAlert) throw new Error('Alert not found');

    const createdInc = createIncident({
      title: `Escalated from Alert ${alertId}: ${targetAlert.title}`,
      severity: targetAlert.severity,
      status: 'new',
      affectedAssets: [targetAlert.affectedAsset],
      assignedAnalyst: currentUser.name,
      source: targetAlert.sourceSystem,
      summary: `Automated alert escalation. Rule: ${targetAlert.detectionRuleName}`,
      description: `Alert evidence: ${targetAlert.evidence.map((e) => `${e.label}: ${e.value}`).join(' | ')}`,
      relatedEventIds: [],
      relatedAlertIds: [alertId]
    });

    setDemoAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, relatedIncidentId: createdInc.id, status: 'linked' } : a))
    );

    return createdInc;
  };

  const linkAlertToIncident = (alertId: string, incidentId: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.linkAlertToIncident(alertId, incidentId);
        setLiveAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
        const incRes = await socApi.getIncidents();
        setLiveIncidents(incRes.incidents);
      });
      return;
    }

    setDemoAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, relatedIncidentId: incidentId, status: 'linked' } : a))
    );
    setDemoIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, relatedAlertIds: Array.from(new Set([...inc.relatedAlertIds, alertId])) }
          : inc
      )
    );
    addAuditLog('Alert Linked to Incident', `Alert: ${alertId} -> Incident: ${incidentId}`, 'Success', 'Linked alert record');
  };

  // Log Source Actions
  const toggleLogSource = (id: string) => {
    if (dataMode === 'live') {
      void runLiveMutation(async () => {
        const res = await socApi.toggleLogSource(id);
        setLiveLogSources((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, enabled: res.logSource.enabled, status: res.logSource.status } : s
          )
        );
      });
      return;
    }

    setDemoLogSources((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = !s.enabled;
          addAuditLog(
            nextState ? 'Log Source Enabled' : 'Log Source Disabled',
            `Source: ${s.name} (${s.id})`,
            'Success',
            `Status updated to ${nextState ? 'ACTIVE' : 'MUTED'}`
          );
          return { ...s, enabled: nextState, status: nextState ? 'healthy' : 'offline' };
        }
        return s;
      })
    );
  };

  const addLogSource = (source: Omit<LogSource, 'id' | 'totalEventsProcessed' | 'lastEventReceived'>) => {
    const newSource: LogSource = {
      ...source,
      id: `SRC-${String(demoLogSources.length + 15).padStart(3, '0')}`,
      lastEventReceived: 'Just now',
      totalEventsProcessed: 0
    };
    setDemoLogSources((prev) => [...prev, newSource]);
    addAuditLog('Log Source Added', `Source: ${newSource.name}`, 'Success', `Added collector method: ${newSource.collectionMethod}`);
  };

  // Threat Intel Actions
  const addThreatIndicator = (
    indicator: Omit<ThreatIndicator, 'id' | 'firstObserved' | 'lastObserved' | 'relatedEventsCount'>
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newIndicator: ThreatIndicator = {
      ...indicator,
      id: `THREAT-${Date.now().toString().slice(-4)}`,
      firstObserved: now,
      lastObserved: now,
      relatedEventsCount: 0
    };
    setThreatIndicators((prev) => [newIndicator, ...prev]);
    addAuditLog('Threat Indicator Added', `Indicator: ${indicator.value} (${indicator.type})`, 'Success', `Added to local threat feed with risk ${indicator.riskRating}`);
  };

  // Detection Rules Actions
  const toggleDetectionRule = (id: string) => {
    if (dataMode === 'live') {
      const target = liveDetectionRules.find((r) => r.id === id);
      if (!target) return;
      void runLiveMutation(async () => {
        const res = await socApi.updateDetectionRule(id, { enabled: !target.enabled });
        setLiveDetectionRules((prev) => prev.map((r) => (r.id === id ? res.rule : r)));
      });
      return;
    }

    setDemoDetectionRules((prev) =>
      prev.map((rule) => {
        if (rule.id === id) {
          const nextState = !rule.enabled;
          addAuditLog(
            nextState ? 'Detection Rule Activated' : 'Detection Rule Deactivated',
            `Rule: ${rule.name} (${rule.id})`,
            'Success',
            `Enforcement state: ${nextState ? 'ENABLED' : 'DISABLED'}`
          );
          return { ...rule, enabled: nextState };
        }
        return rule;
      })
    );
  };

  const updateDetectionRuleConfig = async (
    id: string,
    patch: { enabled?: boolean; timeWindowMinutes?: number; thresholdCount?: number }
  ) => {
    if (dataMode === 'live') {
      const res = await socApi.updateDetectionRule(id, patch);
      setLiveDetectionRules((prev) => prev.map((r) => (r.id === id ? res.rule : r)));
      return;
    }
    setDemoDetectionRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule))
    );
  };

  // Reset Demo Data
  const resetDemoData = () => {
    localStorage.removeItem('mor_soc_v4_incidents');
    localStorage.removeItem('mor_soc_v4_alerts');
    localStorage.removeItem('mor_soc_v3_sources');
    localStorage.removeItem('mor_soc_v3_threats');
    localStorage.removeItem('mor_soc_v3_rules');
    localStorage.removeItem('mor_soc_v3_audit');

    setDemoIncidents(INITIAL_INCIDENTS);
    setDemoAlerts(INITIAL_ALERTS);
    setDemoLogSources(INITIAL_LOG_SOURCES);
    setThreatIndicators(INITIAL_THREAT_INDICATORS);
    setDemoDetectionRules(INITIAL_DETECTION_RULES);
    setDemoAuditLogs(INITIAL_AUDIT_LOGS);
    setTimeRange('Last 24 Hours');
    setSelectedIncidentId(null);
    setSelectedAlertId(null);
    setSelectedEventId(null);
    setSelectedAssetId(null);
    addAuditLog('Demonstration Data Reset', 'All Local Data Stores', 'Success', 'Reset simulation data back to pristine state');
  };

  return (
    <SOCContext.Provider
      value={{
        activePage,
        setActivePage,
        timeRange,
        setTimeRange,
        theme,
        toggleTheme,
        currentTimeString,
        dataMode,
        authChecked,
        authLoading,
        permissions,
        loginModalOpen,
        setLoginModalOpen,
        loginWithPassword,
        logoutSession,
        refreshLiveData,
        sseConnected,
        actionError,
        clearActionError: () => setActionError(null),
        currentUser,
        switchUser,
        users,
        addUser,
        metrics,
        healthMetrics,
        dashboardKpis,
        endpoints,
        agentStats,
        selectedEndpointId,
        setSelectedEndpointId,
        openEndpointDetails,
        events,
        eventFilters,
        setEventFilters,
        selectedEvent,
        setSelectedEventId,
        drillDownToEvents,
        incidents,
        incidentFilters,
        setIncidentFilters,
        selectedIncident,
        setSelectedIncidentId,
        drillDownToIncidents,
        createIncident,
        updateIncidentStatus,
        updateIncidentSeverity,
        assignIncident,
        addIncidentNote,
        addResponseAction,
        closeIncidentWithResolution,
        alerts,
        selectedAlert,
        setSelectedAlertId,
        acknowledgeAlert,
        assignAlert,
        markAlertFalsePositive,
        resolveAlert,
        escalateAlertToIncident,
        linkAlertToIncident,
        logSources,
        toggleLogSource,
        addLogSource,
        assets,
        selectedAsset,
        setSelectedAssetId,
        threatIndicators,
        addThreatIndicator,
        detectionRules,
        toggleDetectionRule,
        updateDetectionRuleConfig,
        auditLogs,
        addAuditLog,
        resetDemoData
      }}
    >
      {children}
    </SOCContext.Provider>
  );
};

export const useSOC = (): SOCContextType => {
  const context = useContext(SOCContext);
  if (!context) {
    throw new Error('useSOC must be used within a SOCProvider');
  }
  return context;
};
