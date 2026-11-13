import { getPool } from '../../database/pool.js';
import { env } from '../../config/env.js';
import { getAgentStatistics } from '../endpoints/endpoints.service.js';
import { recordAuditLog } from '../../services/auditService.js';
import { AppError } from '../../middleware/errorHandler.js';

const CATEGORY_COLORS: Record<string, string> = {
  Authentication: '#0077c8',
  Network: '#0284c7',
  Malware: '#dc2626',
  'Web Application': '#7c3aed',
  System: '#475569',
  Endpoint: '#d97706',
  'DNS and DHCP': '#0d9488',
  Other: '#64748b'
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#64748b'
};

function rangeToHours(timeRange?: string): number {
  switch (timeRange) {
    case 'Last 15 Days':
      return 15 * 24;
    case 'Last Month':
      return 30 * 24;
    case 'Last 3 Months':
      return 90 * 24;
    case 'Last 24 Hours':
    default:
      return 24;
  }
}

export async function getDashboardStatistics(timeRange?: string) {
  const pool = await getPool();
  const hours = rangeToHours(timeRange);

  const [eventTotalsRes, winSpecificRes, activeAlertRes, activeIncRes, categoryRes, sourceRes, incSevRes, timelineRes, logSourcesRes] =
    await Promise.all([
      pool.query<{
        total_events: string;
        critical_events: string;
        high_events: string;
      }>(
        `SELECT
          COUNT(*)::text AS total_events,
          COUNT(*) FILTER (WHERE severity = 'critical')::text AS critical_events,
          COUNT(*) FILTER (WHERE severity = 'high')::text AS high_events
         FROM security_events
         WHERE timestamp >= NOW() - ($1::int * INTERVAL '1 hour')`,
        [hours]
      ),
      pool.query<{
        windows_events: string;
        failed_logins: string;
        suspicious_processes: string;
      }>(
        `SELECT
          COUNT(*)::text AS windows_events,
          COUNT(*) FILTER (WHERE wed.windows_event_id IN (4625, 4771))::text AS failed_logins,
          COUNT(*) FILTER (WHERE wed.windows_event_id = 4688 AND se.severity IN ('high', 'critical'))::text AS suspicious_processes
         FROM windows_event_details wed
         JOIN security_events se ON se.id = wed.security_event_id
         WHERE wed.event_timestamp >= NOW() - ($1::int * INTERVAL '1 hour')`,
        [hours]
      ),
      pool.query<{ cnt: string }>(
        `SELECT COUNT(*)::text AS cnt FROM alerts WHERE status IN ('new', 'acknowledged', 'assigned', 'investigating')`
      ),
      pool.query<{ cnt: string }>(
        `SELECT COUNT(*)::text AS cnt FROM incidents WHERE status IN ('new', 'investigating')`
      ),
      pool.query<{ category: string; cnt: string }>(
        `SELECT category::text AS category, COUNT(*)::text AS cnt
         FROM security_events
         WHERE timestamp >= NOW() - ($1::int * INTERVAL '1 hour')
         GROUP BY category
         ORDER BY COUNT(*) DESC`,
        [hours]
      ),
      pool.query<{ source_name: string; cnt: string; status: string }>(
        `SELECT se.source_name, COUNT(*)::text AS cnt,
                COALESCE(MAX(ls.status::text), 'healthy') AS status
         FROM security_events se
         LEFT JOIN log_sources ls ON ls.id = se.source_id
         WHERE se.timestamp >= NOW() - ($1::int * INTERVAL '1 hour')
         GROUP BY se.source_name
         ORDER BY COUNT(*) DESC
         LIMIT 10`,
        [hours]
      ),
      pool.query<{ severity: string; cnt: string }>(
        `SELECT severity::text AS severity, COUNT(*)::text AS cnt
         FROM incidents
         GROUP BY severity`
      ),
      pool.query<{
        bucket: string;
        total: string;
        critical: string;
        high: string;
      }>(
        `SELECT
          to_char(date_trunc('hour', timestamp), 'MM-DD HH24:00') AS bucket,
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE severity = 'critical')::text AS critical,
          COUNT(*) FILTER (WHERE severity = 'high')::text AS high
         FROM security_events
         WHERE timestamp >= NOW() - ($1::int * INTERVAL '1 hour')
         GROUP BY date_trunc('hour', timestamp)
         ORDER BY date_trunc('hour', timestamp) ASC
         LIMIT 48`,
        [hours]
      ),
      pool.query<{
        total_sources: string;
        online_sources: string;
        last_ingestion: string | null;
      }>(
        `SELECT
          COUNT(*)::text AS total_sources,
          COUNT(*) FILTER (WHERE status = 'healthy' AND enabled = TRUE)::text AS online_sources,
          MAX(last_event_received)::text AS last_ingestion
         FROM log_sources`
      )
    ]);

  const agentStats = await getAgentStatistics();
  const evtTotals = eventTotalsRes.rows[0];
  const winTotals = winSpecificRes.rows[0];
  const totalEvents = Number.parseInt(evtTotals?.total_events || '0', 10);
  const criticalEvents = Number.parseInt(evtTotals?.critical_events || '0', 10);
  const highEvents = Number.parseInt(evtTotals?.high_events || '0', 10);
  const activeAlerts = Number.parseInt(activeAlertRes.rows[0]?.cnt || '0', 10);
  const activeIncidents = Number.parseInt(activeIncRes.rows[0]?.cnt || '0', 10);

  const eventTypesBreakdown = categoryRes.rows.map((r) => {
    const count = Number.parseInt(r.cnt, 10);
    return {
      category: r.category,
      count,
      percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
      color: CATEGORY_COLORS[r.category] || '#64748b'
    };
  });

  const topThreatCategories = eventTypesBreakdown.slice(0, 5).map((e) => ({
    category: e.category,
    count: e.count,
    percentage: e.percentage
  }));

  const eventsBySource = sourceRes.rows.map((r) => {
    const count = Number.parseInt(r.cnt, 10);
    return {
      source: r.source_name,
      count,
      percentage: totalEvents > 0 ? Number(((count / totalEvents) * 100).toFixed(1)) : 0,
      status: r.status
    };
  });

  const totalIncidents = incSevRes.rows.reduce((sum, r) => sum + Number.parseInt(r.cnt, 10), 0);
  const incidentsBySeverity = incSevRes.rows.map((r) => {
    const count = Number.parseInt(r.cnt, 10);
    return {
      severity: r.severity,
      count,
      percentage: totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0,
      color: SEVERITY_COLORS[r.severity] || '#64748b'
    };
  });

  const lsRow = logSourcesRes.rows[0];
  const collectorsTotal = Number.parseInt(lsRow?.total_sources || '0', 10);
  const collectorsOnline = Number.parseInt(lsRow?.online_sources || '0', 10);

  return {
    kpis: {
      totalEvents,
      criticalEvents,
      highEvents,
      activeAlerts,
      activeIncidents,
      totalEndpoints: agentStats.totalEndpoints,
      onlineAgents: agentStats.onlineEndpoints,
      offlineAgents: agentStats.offlineEndpoints,
      unhealthyAgents: agentStats.unhealthyAgents,
      eventsPerSecond: agentStats.eventsPerSecond,
      windowsSecurityEvents: Number.parseInt(winTotals?.windows_events || '0', 10),
      failedLoginAttempts: Number.parseInt(winTotals?.failed_logins || '0', 10),
      suspiciousProcessActivity: Number.parseInt(winTotals?.suspicious_processes || '0', 10)
    },
    metrics: {
      totalEvents,
      totalEventsChangePct: 0,
      criticalEvents,
      highEvents,
      securityIncidents: activeIncidents,
      incidentsChangePct: 0,
      eventsOverTime: timelineRes.rows.map((r) => ({
        time: r.bucket,
        total: Number.parseInt(r.total, 10),
        critical: Number.parseInt(r.critical, 10),
        high: Number.parseInt(r.high, 10)
      })),
      eventTypesBreakdown,
      topThreatCategories,
      eventsBySource,
      incidentsBySeverity,
      geoAttackSources: []
    },
    healthMetrics: {
      overallStatus:
        agentStats.unhealthyAgents > 0 || agentStats.offlineEndpoints > 0 ? 'Degraded' : 'Healthy',
      collectorsOnline,
      collectorsTotal,
      agentsReporting: agentStats.onlineEndpoints,
      agentsTotal: agentStats.totalEndpoints,
      ingestionRateEPS: agentStats.eventsPerSecond,
      storageUsageTB: 0,
      storageCapacityTB: 10,
      retentionDays: env.eventRetentionDays,
      lastSuccessfulIngestion: lsRow?.last_ingestion || 'No ingestion yet'
    }
  };
}

export async function listAuditLogs(limit = 200) {
  const pool = await getPool();
  const res = await pool.query<Record<string, any>>(
    `SELECT id, timestamp, user_name, role, action, target, result, details
     FROM audit_logs
     ORDER BY timestamp DESC
     LIMIT $1`,
    [Math.min(500, Math.max(1, limit))]
  );
  return res.rows.map((r) => ({
    id: r.id,
    timestamp: new Date(r.timestamp).toISOString().replace('T', ' ').slice(0, 19),
    user: r.user_name,
    role: r.role,
    action: r.action,
    target: r.target,
    result: r.result,
    details: r.details
  }));
}

export async function listLogSources() {
  const pool = await getPool();
  const res = await pool.query<Record<string, any>>(
    `SELECT id, name, type, hostname, collection_method, host(ip_address) AS ip_address,
            last_event_received, events_per_minute, parsing_success_rate, status,
            data_freshness, retention_days, enabled, error_log, total_events_processed
     FROM log_sources
     ORDER BY created_at DESC`
  );
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    hostname: r.hostname,
    collectionMethod: r.collection_method,
    ipAddress: r.ip_address,
    lastEventReceived: new Date(r.last_event_received).toISOString().replace('T', ' ').slice(0, 19),
    eventsPerMinute: r.events_per_minute,
    parsingSuccessRate: Number(r.parsing_success_rate),
    status: r.status,
    dataFreshness: r.data_freshness,
    retentionDays: r.retention_days,
    enabled: r.enabled,
    errorLog: r.error_log || undefined,
    totalEventsProcessed: Number(r.total_events_processed)
  }));
}

export async function toggleLogSource(sourceId: string, actor: { name: string; role: string }) {
  const pool = await getPool();
  const res = await pool.query<Record<string, any>>(
    `UPDATE log_sources
     SET enabled = NOT enabled,
         status = CASE WHEN NOT enabled THEN 'healthy'::source_status_enum ELSE 'offline'::source_status_enum END
     WHERE id = $1
     RETURNING id, name, enabled, status`,
    [sourceId]
  );
  if (res.rows.length === 0) throw new AppError(404, 'Log source not found');

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: res.rows[0].enabled ? 'Log Source Enabled' : 'Log Source Disabled',
    target: `Source: ${res.rows[0].name} (${sourceId})`,
    result: 'Success',
    details: `Status set to ${res.rows[0].status}`
  });

  return res.rows[0];
}
