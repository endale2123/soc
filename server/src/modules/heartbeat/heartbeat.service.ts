import { getPool } from '../../database/pool.js';
import { AuthenticatedAgent } from '../../middleware/auth.js';
import { recordAuditLog } from '../../services/auditService.js';
import { sseHub } from '../../services/sseHub.js';
import { logger } from '../../utils/logger.js';

export interface HeartbeatInput {
  agentVersion?: string;
  hostname?: string;
  ipAddress?: string;
  cpuUsagePct?: number;
  memoryUsagePct?: number;
  diskFreeMb?: number;
  queueDepth?: number;
  bufferOverflow?: boolean;
  ingestionErrors?: number;
  errorMessage?: string;
  reportedAt?: string;
}

export async function processHeartbeat(agent: AuthenticatedAgent, input: HeartbeatInput) {
  const pool = await getPool();
  const nextVersion = input.agentVersion || agent.agentVersion;
  const hostname = input.hostname || agent.hostname;
  const ipAddress = sanitizeIp(input.ipAddress) || agent.ipAddress;
  const bufferOverflow = Boolean(input.bufferOverflow);
  const ingestionErrors = input.ingestionErrors ?? 0;

  const nextStatus: 'Online' | 'Unhealthy' =
    bufferOverflow || ingestionErrors > 0 || Boolean(input.errorMessage) ? 'Unhealthy' : 'Online';

  const versionChanged = Boolean(input.agentVersion && input.agentVersion !== agent.agentVersion);
  const statusChanged = agent.status !== nextStatus;

  await pool.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO agent_heartbeats (
        agent_id, status, agent_version, hostname, ip_address,
        cpu_usage_pct, memory_usage_pct, disk_free_mb,
        queue_depth, buffer_overflow, ingestion_errors, error_message, reported_at
      ) VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        agent.id,
        nextStatus,
        nextVersion,
        hostname,
        ipAddress,
        input.cpuUsagePct ?? null,
        input.memoryUsagePct ?? null,
        input.diskFreeMb ?? null,
        input.queueDepth ?? 0,
        bufferOverflow,
        ingestionErrors,
        input.errorMessage || null,
        input.reportedAt || new Date().toISOString()
      ]
    );

    await client.query(
      `UPDATE endpoint_agents
       SET status = $1,
           agent_version = $2,
           ip_address = COALESCE($3::inet, ip_address),
           last_heartbeat_at = NOW(),
           last_error = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [nextStatus, nextVersion, ipAddress, input.errorMessage || null, agent.id]
    );

    if (agent.assetId) {
      await client.query(
        `UPDATE assets
         SET status = $1, last_seen = NOW(), agent_version = $2
         WHERE id = $3`,
        [nextStatus === 'Online' ? 'Online' : 'Warning', nextVersion, agent.assetId]
      );
    }

    if (agent.logSourceId) {
      await client.query(
        `UPDATE log_sources
         SET status = $1,
             error_log = $2
         WHERE id = $3`,
        [
          nextStatus === 'Online' ? 'healthy' : 'parsing_error',
          input.errorMessage || (bufferOverflow ? 'Agent local buffer overflow reported' : null),
          agent.logSourceId
        ]
      );
    }

    if (versionChanged) {
      await recordAuditLog(
        {
          userName: `Agent:${hostname}`,
          role: 'Endpoint Agent',
          action: 'Agent Version Changed',
          target: `Agent: ${agent.id} (${hostname})`,
          result: 'Success',
          details: `Agent upgraded/changed from ${agent.agentVersion} to ${nextVersion}`
        },
        client
      );
    }

    if (bufferOverflow) {
      await recordAuditLog(
        {
          userName: `Agent:${hostname}`,
          role: 'Endpoint Agent',
          action: 'Agent Buffer Overflow Detected',
          target: `Agent: ${agent.id} (${hostname})`,
          result: 'Failed',
          details: input.errorMessage || 'Endpoint agent reported event buffer overflow'
        },
        client
      );
    }

    if (ingestionErrors > 0) {
      await recordAuditLog(
        {
          userName: `Agent:${hostname}`,
          role: 'Endpoint Agent',
          action: 'Agent Ingestion Errors Reported',
          target: `Agent: ${agent.id} (${hostname})`,
          result: 'Failed',
          details: `${ingestionErrors} ingestion errors reported. ${input.errorMessage || ''}`.trim()
        },
        client
      );
    }
  });

  const nowIso = new Date().toISOString();

  sseHub.publish('agent:heartbeat', {
    agentId: agent.id,
    hostname,
    status: nextStatus,
    agentVersion: nextVersion,
    cpuUsagePct: input.cpuUsagePct ?? null,
    memoryUsagePct: input.memoryUsagePct ?? null,
    queueDepth: input.queueDepth ?? 0,
    timestamp: nowIso
  });

  if (statusChanged) {
    sseHub.publish('endpoint:status_changed', {
      agentId: agent.id,
      hostname,
      previousStatus: agent.status,
      status: nextStatus,
      timestamp: nowIso
    });
  }

  // Also fetch current config version so agent knows whether to re-sync config
  const cfgRes = await pool.query<{ config_version: number }>(
    'SELECT config_version FROM agent_configurations WHERE agent_id = $1',
    [agent.id]
  );

  return {
    agentId: agent.id,
    status: nextStatus,
    receivedAt: nowIso,
    configVersion: cfgRes.rows[0]?.config_version ?? 1
  };
}

export async function refreshStaleAgents(): Promise<number> {
  const pool = await getPool();

  const staleRes = await pool.query<{
    id: string;
    hostname: string;
    status: string;
    asset_id: string | null;
    log_source_id: string | null;
  }>(
    `SELECT a.id, a.hostname, a.status, a.asset_id, a.log_source_id
     FROM endpoint_agents a
     LEFT JOIN agent_configurations c ON c.agent_id = a.id
     WHERE a.status IN ('Online', 'Unhealthy')
       AND a.last_heartbeat_at IS NOT NULL
       AND EXTRACT(EPOCH FROM (NOW() - a.last_heartbeat_at)) > COALESCE(c.offline_threshold_sec, 120)`
  );

  if (staleRes.rows.length === 0) return 0;

  for (const row of staleRes.rows) {
    await pool.withTransaction(async (client) => {
      await client.query(
        `UPDATE endpoint_agents
         SET status = 'Offline', last_error = 'Missed heartbeat threshold exceeded', updated_at = NOW()
         WHERE id = $1 AND status IN ('Online', 'Unhealthy')`,
        [row.id]
      );

      if (row.asset_id) {
        await client.query(`UPDATE assets SET status = 'Offline' WHERE id = $1`, [row.asset_id]);
      }

      if (row.log_source_id) {
        await client.query(
          `UPDATE log_sources SET status = 'offline', error_log = 'Missed agent heartbeat' WHERE id = $1`,
          [row.log_source_id]
        );
      }

      await recordAuditLog(
        {
          userName: 'SOC Health Monitor',
          role: 'System',
          action: 'Agent Communication Failure',
          target: `Agent: ${row.id} (${row.hostname})`,
          result: 'Failed',
          details: `Missed heartbeat threshold exceeded; status transitioned from ${row.status} to Offline`
        },
        client
      );
    });

    sseHub.publish('endpoint:status_changed', {
      agentId: row.id,
      hostname: row.hostname,
      previousStatus: row.status,
      status: 'Offline',
      reason: 'Missed heartbeat threshold exceeded',
      timestamp: new Date().toISOString()
    });
  }

  logger.warn('Marked stale agents offline', { count: staleRes.rows.length });
  return staleRes.rows.length;
}

function sanitizeIp(ip?: string): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (!trimmed || trimmed === '-' || trimmed === '::') return null;
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  if (ipv4Regex.test(trimmed) || (trimmed.includes(':') && ipv6Regex.test(trimmed))) {
    return trimmed;
  }
  return null;
}
