/**
 * Ministry of Revenue SOC - Global State Provider
 * Manages simulation state, persistent modifications, RBAC sessions, and cross-page drill-downs.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export type PageId =
  | 'dashboard'
  | 'events'
  | 'incidents'
  | 'threat-intel'
  | 'alerts'
  | 'log-management'
  | 'assets'
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

interface SOCContextType {
  // Navigation & Viewport
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  timeRange: TimeRangeOption;
  setTimeRange: (range: TimeRangeOption) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentTimeString: string;

  // RBAC & Users
  currentUser: User;
  switchUser: (role: UserRole) => void;
  users: User[];

  // Dynamic Metrics & Health
  metrics: TimeRangeMetrics;
  healthMetrics: SystemHealthMetrics;

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
  escalateAlertToIncident: (alertId: string) => Incident;
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
      // Format: 15 Oct 2026 09:58:20 EAT (UTC+3)
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

  // Current logged-in user profile
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [users] = useState<User[]>(INITIAL_USERS);

  // Core Data Collections (persisted in localStorage with fallback to default mock)
  const [events] = useState<SecurityEvent[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_events');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_EVENTS;
  });

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [logSources, setLogSources] = useState<LogSource[]>(() => {
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

  const [detectionRules, setDetectionRules] = useState<DetectionRule[]>(() => {
    const saved = localStorage.getItem('mor_soc_v3_rules');
    return saved ? JSON.parse(saved) : INITIAL_DETECTION_RULES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
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

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('mor_soc_v3_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('mor_soc_v3_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('mor_soc_v3_sources', JSON.stringify(logSources));
  }, [logSources]);

  useEffect(() => {
    localStorage.setItem('mor_soc_v3_threats', JSON.stringify(threatIndicators));
  }, [threatIndicators]);

  useEffect(() => {
    localStorage.setItem('mor_soc_v3_rules', JSON.stringify(detectionRules));
  }, [detectionRules]);

  useEffect(() => {
    localStorage.setItem('mor_soc_v3_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Derived Objects
  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || null;
  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || null;
  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;

  // Dynamic Metrics based on current timeRange
  const metrics = METRICS_BY_TIMERANGE[timeRange];
  const healthMetrics = SYSTEM_HEALTH_DATA;

  // Audit Logger Helper
  const addAuditLog = (action: string, target: string, result: 'Success' | 'Failed' | 'Denied', details: string) => {
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
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // RBAC Switcher
  const switchUser = (role: UserRole) => {
    const user = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(user);
    addAuditLog('User Session Switched', `Active User: ${user.name} (${role})`, 'Success', 'Switched session via demonstration role switcher.');
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Drill-Down Helpers
  const drillDownToEvents = (filters: Partial<EventFilterState>) => {
    setEventFilters((prev) => ({ ...prev, ...filters }));
    setActivePage('events');
  };

  const drillDownToIncidents = (filters: Partial<IncidentFilterState>) => {
    setIncidentFilters((prev) => ({ ...prev, ...filters }));
    setActivePage('incidents');
  };

  // Incident Actions
  const createIncident = (
    newIncData: Omit<Incident, 'id' | 'detectionTime' | 'lastUpdated' | 'timeline' | 'notes' | 'responseActions'>
  ): Incident => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const incId = `INC-2026-${String(incidents.length + 42).padStart(4, '0')}`;
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
    setIncidents((prev) => [newIncident, ...prev]);
    addAuditLog('Incident Created', `Incident: ${incId} (${newIncident.title})`, 'Success', `Created with severity ${newIncident.severity}`);
    return newIncident;
  };

  const updateIncidentStatus = (id: string, newStatus: IncidentStatus, note?: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setIncidents((prev) =>
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
          return {
            ...inc,
            status: newStatus,
            lastUpdated: now,
            timeline: updatedTimeline
          };
        }
        return inc;
      })
    );
    addAuditLog('Incident Status Updated', `Incident: ${id}`, 'Success', `Status changed to ${newStatus.toUpperCase()}${note ? ` Note: ${note}` : ''}`);
  };

  const updateIncidentSeverity = (id: string, newSeverity: Severity, reason: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setIncidents((prev) =>
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
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setIncidents((prev) =>
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
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newNote = {
      id: `NOTE-${Date.now()}`,
      author: currentUser.name,
      role: currentUser.role,
      timestamp: now,
      text
    };
    setIncidents((prev) =>
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
    setIncidents((prev) =>
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
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setIncidents((prev) =>
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
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged', assignedTo: currentUser.name } : a))
    );
    addAuditLog('Alert Acknowledged', `Alert: ${id}`, 'Success', `Acknowledged by ${currentUser.name}`);
  };

  const assignAlert = (id: string, analyst: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'assigned', assignedTo: analyst } : a))
    );
    addAuditLog('Alert Assigned', `Alert: ${id}`, 'Success', `Assigned to ${analyst}`);
  };

  const markAlertFalsePositive = (id: string, reason: string) => {
    setAlerts((prev) =>
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

  const escalateAlertToIncident = (alertId: string): Incident => {
    const targetAlert = alerts.find((a) => a.id === alertId);
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

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, relatedIncidentId: createdInc.id, status: 'linked' } : a))
    );

    return createdInc;
  };

  const linkAlertToIncident = (alertId: string, incidentId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, relatedIncidentId: incidentId, status: 'linked' } : a))
    );
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              relatedAlertIds: Array.from(new Set([...inc.relatedAlertIds, alertId]))
            }
          : inc
      )
    );
    addAuditLog('Alert Linked to Incident', `Alert: ${alertId} -> Incident: ${incidentId}`, 'Success', 'Linked alert record');
  };

  // Log Source Actions
  const toggleLogSource = (id: string) => {
    setLogSources((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = !s.enabled;
          addAuditLog(
            nextState ? 'Log Source Enabled' : 'Log Source Disabled',
            `Source: ${s.name} (${s.id})`,
            'Success',
            `Status updated to ${nextState ? 'ACTIVE' : 'MUTED'}`
          );
          return {
            ...s,
            enabled: nextState,
            status: nextState ? 'healthy' : 'offline'
          };
        }
        return s;
      })
    );
  };

  const addLogSource = (source: Omit<LogSource, 'id' | 'totalEventsProcessed' | 'lastEventReceived'>) => {
    const newSource: LogSource = {
      ...source,
      id: `SRC-${String(logSources.length + 15).padStart(3, '0')}`,
      lastEventReceived: 'Just now',
      totalEventsProcessed: 0
    };
    setLogSources((prev) => [...prev, newSource]);
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
    setDetectionRules((prev) =>
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

  // Reset to Pristine Demo Data
  const resetDemoData = () => {
    localStorage.removeItem('mor_soc_v3_incidents');
    localStorage.removeItem('mor_soc_v3_alerts');
    localStorage.removeItem('mor_soc_v3_sources');
    localStorage.removeItem('mor_soc_v3_threats');
    localStorage.removeItem('mor_soc_v3_rules');
    localStorage.removeItem('mor_soc_v3_audit');

    setIncidents(INITIAL_INCIDENTS);
    setAlerts(INITIAL_ALERTS);
    setLogSources(INITIAL_LOG_SOURCES);
    setThreatIndicators(INITIAL_THREAT_INDICATORS);
    setDetectionRules(INITIAL_DETECTION_RULES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
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
        currentUser,
        switchUser,
        users,
        metrics,
        healthMetrics,
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
