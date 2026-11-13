import { getPool } from '../../database/pool.js';
import { AppError } from '../../middleware/errorHandler.js';
import { refreshStaleAgents } from '../heartbeat/heartbeat.service.js';

export interface EndpointListQuery {
  search?: string;
  status?: string;
  os?: string;
  sortBy?: 'hostname' | 'status' | 'lastHeartbeat' | 'totalEventsCollected' | 'enrolledAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function listEndpoints(query: EndpointListQuery) {
  await refreshStaleAgents();
  const pool = await getPool();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.status && query.status !== 'ALL') {
    params.push(query.status);
    conditions.push(`a.status::text = $${params.length}`);
  }

  if (query.os && query.os !== 'ALL') {
    params.push(`%${query.os}%`);
    conditions.push(`a.os ILIKE $${params.length}`);
  }

  if (query.search && query.search.trim().length > 0) {
    params.push(`%${query.search.trim()}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(a.hostname ILIKE ${p} OR a.id ILIKE ${p} OR COALESCE(host(a.ip_address), '') ILIKE ${p} OR COALESCE(a.domain_name, '') ILIKE ${p} OR a.os ILIKE ${p})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap: Record<string, string> = {
    hostname: 'a.hostname',
    status: 'a.status',
    lastHeartbeat: 'a.last_heartbeat_at',
    totalEventsCollected: 'a.total_events_collected',
    enrolledAt: 'a.enrolled_at'
  };
  const sortCol = sortMap[query.sortBy || 'lastHeartbeat'] || 'a.last_heartbeat_at';
  const sortDir = query.sortDir === 'asc' ? 'ASC' : 'DESC';

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const countRes = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM endpoint_agents a ${whereClause}`,
    params
  );
  const total = Number.parseInt(countRes.rows[0]?.total || '0', 10);

  const listParams = [...params, pageSize, offset];
  const rowsRes = await pool.query<{
    id: string;
    hostname: string;
    status: string;
    agent_version: string;
    ip_address: string | null;
    mac_address: string | null;
    os: string;
    os_version: string | null;
    os_build: string | null;
    domain_name: string | null;
    last_heartbeat_at: string | null;
    last_event_at: string | null;
    total_events_collected: string;
    enrolled_at: string;
    last_error: string | null;
    alert_count: string;
  }>(
    `SELECT a.id, a.hostname, a.status, a.agent_version, host(a.ip_address) AS ip_address,
            a.mac_address, a.os, a.os_version, a.os_build, a.domain_name,
            a.last_heartbeat_at, a.last_event_at, a.total_events_collected::text,
            a.enrolled_at, a.last_error,
            (SELECT COUNT(*)::text FROM alerts al WHERE al.agent_id = a.id AND al.status NOT IN ('false_positive', 'resolved')) AS alert_count
     FROM endpoint_agents a
     ${whereClause}
     ORDER BY ${sortCol} ${sortDir} NULLS LAST
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return {
    items: rowsRes.rows.map((r) => ({
      agentId: r.id,
      hostname: r.hostname,
      status: r.status,
      agentVersion: r.agent_version,
      ipAddress: r.ip_address || '',
      macAddress: r.mac_address || '',
      os: r.os,
      osVersion: r.os_version || '',
      osBuild: r.os_build || '',
      domainMembership: r.domain_name || '',
      lastHeartbeat: r.last_heartbeat_at,
      lastEventReceived: r.last_event_at,
      totalEventsCollected: Number.parseInt(r.total_events_collected || '0', 10),
      activeAlertsCount: Number.parseInt(r.alert_count || '0', 10),
      enrolledAt: r.enrolled_at,
      lastError: r.last_error
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getEndpointDetails(agentId: string) {
  await refreshStaleAgents();
  const pool = await getPool();

  const agentRes = await pool.query<{
    id: string;
    hostname: string;
    status: string;
    agent_version: string;
    ip_address: string | null;
    mac_address: string | null;
    os: string;
    os_version: string | null;
    os_build: string | null;
    domain_name: string | null;
    asset_id: string | null;
    log_source_id: string | null;
    last_heartbeat_at: string | null;
    last_event_at: string | null;
    total_events_collected: string;
    last_error: string | null;
    enrolled_at: string;
    deactivated_at: string | null;
  }>(
    `SELECT id, hostname, status, agent_version, host(ip_address) AS ip_address, mac_address,
            os, os_version, os_build, domain_name, asset_id, log_source_id,
            last_heartbeat_at, last_event_at, total_events_collected::text,
            last_error, enrolled_at, deactivated_at
     FROM endpoint_agents
     WHERE id = $1`,
    [agentId]
  );

  const agent = agentRes.rows[0];
  if (!agent) {
    throw new AppError(404, 'Endpoint agent not found');
  }

  const [invRes, cfgRes, hbRes, countsRes] = await Promise.all([
    pool.query('SELECT * FROM endpoint_inventory WHERE agent_id = $1', [agentId]),
    pool.query('SELECT * FROM agent_configurations WHERE agent_id = $1', [agentId]),
    pool.query(
      `SELECT id, status, agent_version, cpu_usage_pct, memory_usage_pct, disk_free_mb,
              queue_depth, buffer_overflow, ingestion_errors, error_message, reported_at, received_at
       FROM agent_heartbeats
       WHERE agent_id = $1
       ORDER BY received_at DESC
       LIMIT 20`,
      [agentId]
    ),
    pool.query<{
      events_count: string;
      alerts_count: string;
      incidents_count: string;
    }>(
      `SELECT
        (SELECT COUNT(*)::text FROM security_events WHERE agent_id = $1) AS events_count,
        (SELECT COUNT(*)::text FROM alerts WHERE agent_id = $1) AS alerts_count,
        (SELECT COUNT(*)::text FROM incidents WHERE agent_id = $1 OR $2 = ANY(affected_assets)) AS incidents_count`,
      [agentId, agent.hostname]
    )
  ]);

  const inv = invRes.rows[0] as Record<string, unknown> | undefined;
  const cfg = cfgRes.rows[0] as Record<string, unknown> | undefined;
  const counts = countsRes.rows[0];

  return {
    endpoint: {
      agentId: agent.id,
      hostname: agent.hostname,
      status: agent.status,
      agentVersion: agent.agent_version,
      ipAddress: agent.ip_address || '',
      macAddress: agent.mac_address || '',
      os: agent.os,
      osVersion: agent.os_version || '',
      osBuild: agent.os_build || '',
      domainMembership: agent.domain_name || '',
      assetId: agent.asset_id,
      logSourceId: agent.log_source_id,
      lastHeartbeat: agent.last_heartbeat_at,
      lastEventReceived: agent.last_event_at,
      totalEventsCollected: Number.parseInt(agent.total_events_collected || '0', 10),
      lastError: agent.last_error,
      enrolledAt: agent.enrolled_at,
      deactivatedAt: agent.deactivated_at
    },
    inventory: inv
      ? {
          fqdn: inv.fqdn,
          domainMembership: inv.domain_membership,
          workgroup: inv.workgroup,
          osName: inv.os_name,
          osVersion: inv.os_version,
          osBuild: inv.os_build,
          architecture: inv.architecture,
          cpuModel: inv.cpu_model,
          cpuCores: inv.cpu_cores,
          totalMemoryMb: inv.total_memory_mb ? Number(inv.total_memory_mb) : null,
          diskTotalGb: inv.disk_total_gb ? Number(inv.disk_total_gb) : null,
          ipAddresses: inv.ip_addresses || [],
          macAddresses: inv.mac_addresses || [],
          hardwareVendor: inv.hardware_vendor,
          hardwareModel: inv.hardware_model,
          serialNumber: inv.serial_number,
          lastBootTime: inv.last_boot_time,
          updatedAt: inv.updated_at
        }
      : null,
    configuration: cfg
      ? {
          heartbeatIntervalSec: cfg.heartbeat_interval_sec,
          offlineThresholdSec: cfg.offline_threshold_sec,
          batchSize: cfg.batch_size,
          flushIntervalSec: cfg.flush_interval_sec,
          enabledChannels: cfg.enabled_channels,
          monitoredEventIds: cfg.monitored_event_ids,
          configVersion: cfg.config_version,
          updatedAt: cfg.updated_at,
          updatedBy: cfg.updated_by
        }
      : null,
    recentHeartbeats: hbRes.rows,
    counts: {
      events: Number.parseInt(counts?.events_count || '0', 10),
      alerts: Number.parseInt(counts?.alerts_count || '0', 10),
      incidents: Number.parseInt(counts?.incidents_count || '0', 10)
    }
  };
}

export async function getEndpointEvents(agentId: string, page = 1, pageSize = 25) {
  const pool = await getPool();
  const safePage = Math.max(1, page);
  const safeSize = Math.min(100, Math.max(1, pageSize));
  const offset = (safePage - 1) * safeSize;

  const [countRes, rowsRes] = await Promise.all([
    pool.query<{ total: string }>(
      'SELECT COUNT(*)::text AS total FROM security_events WHERE agent_id = $1',
      [agentId]
    ),
    pool.query(
      `SELECT se.id, se.timestamp, se.source_name, se.source_type, se.hostname, se.username,
              host(se.src_ip) AS src_ip, host(se.dest_ip) AS dest_ip, se.category, se.severity,
              se.original_message, se.normalized_fields, se.related_alert_id, se.related_incident_id,
              se.collection_timestamp, se.parsing_status, se.windows_event_id,
              wed.channel, wed.provider_name, wed.process_name, wed.command_line
       FROM security_events se
       LEFT JOIN windows_event_details wed ON wed.security_event_id = se.id
       WHERE se.agent_id = $1
       ORDER BY se.timestamp DESC
       LIMIT $2 OFFSET $3`,
      [agentId, safeSize, offset]
    )
  ]);

  const total = Number.parseInt(countRes.rows[0]?.total || '0', 10);
  return {
    items: rowsRes.rows,
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize))
  };
}

export async function getEndpointAlerts(agentId: string) {
  const pool = await getPool();
  const res = await pool.query(
    `SELECT id, title, detection_rule_id, detection_rule_name, severity,
            first_detected, last_detected, source_system, affected_asset,
            host(source_ip) AS source_ip, related_incident_id, status, evidence,
            assigned_to, event_count
     FROM alerts
     WHERE agent_id = $1
     ORDER BY last_detected DESC`,
    [agentId]
  );
  return res.rows;
}

export async function getEndpointIncidents(agentId: string) {
  const pool = await getPool();
  const agentRes = await pool.query<{ hostname: string }>(
    'SELECT hostname FROM endpoint_agents WHERE id = $1',
    [agentId]
  );
  const hostname = agentRes.rows[0]?.hostname || '';

  const res = await pool.query(
    `SELECT id, title, severity, status, detection_time, last_updated, affected_assets,
            assigned_analyst, source, summary
     FROM incidents
     WHERE agent_id = $1 OR ($2 <> '' AND $2 = ANY(affected_assets))
     ORDER BY last_updated DESC`,
    [agentId, hostname]
  );
  return res.rows;
}

export async function getAgentStatistics() {
  await refreshStaleAgents();
  const pool = await getPool();

  const statsRes = await pool.query<{
    total_endpoints: string;
    online_endpoints: string;
    offline_endpoints: string;
    unhealthy_endpoints: string;
    pending_endpoints: string;
    disabled_endpoints: string;
    total_collected_events: string;
  }>(
    `SELECT
      COUNT(*)::text AS total_endpoints,
      COUNT(*) FILTER (WHERE status = 'Online')::text AS online_endpoints,
      COUNT(*) FILTER (WHERE status = 'Offline')::text AS offline_endpoints,
      COUNT(*) FILTER (WHERE status = 'Unhealthy')::text AS unhealthy_endpoints,
      COUNT(*) FILTER (WHERE status = 'Pending Enrollment')::text AS pending_endpoints,
      COUNT(*) FILTER (WHERE status = 'Disabled')::text AS disabled_endpoints,
      COALESCE(SUM(total_events_collected), 0)::text AS total_collected_events
     FROM endpoint_agents`
  );

  const epsRes = await pool.query<{ recent_events: string }>(
    `SELECT COUNT(*)::text AS recent_events
     FROM security_events
     WHERE collection_timestamp >= NOW() - INTERVAL '60 seconds'`
  );

  const row = statsRes.rows[0];
  const recentEvents = Number.parseInt(epsRes.rows[0]?.recent_events || '0', 10);

  return {
    totalEndpoints: Number.parseInt(row?.total_endpoints || '0', 10),
    onlineEndpoints: Number.parseInt(row?.online_endpoints || '0', 10),
    offlineEndpoints: Number.parseInt(row?.offline_endpoints || '0', 10),
    unhealthyAgents: Number.parseInt(row?.unhealthy_endpoints || '0', 10),
    pendingEnrollment: Number.parseInt(row?.pending_endpoints || '0', 10),
    disabledEndpoints: Number.parseInt(row?.disabled_endpoints || '0', 10),
    totalCollectedEvents: Number.parseInt(row?.total_collected_events || '0', 10),
    eventsPerSecond: Number((recentEvents / 60).toFixed(2))
  };
}
