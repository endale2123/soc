import { env } from '../../config/env.js';
import { getPool } from '../../database/pool.js';
import { AppError } from '../../middleware/errorHandler.js';
import { recordAuditLog } from '../../services/auditService.js';
import { sseHub } from '../../services/sseHub.js';
import { generateSecureToken, getTokenPrefix, hashToken } from '../../utils/crypto.js';

export const DEFAULT_MONITORED_WINDOWS_EVENT_IDS = [
  4624, 4625, 4634, 4648, 4672, 4688, 4697, 4698, 4702, 4719, 4720,
  4722, 4724, 4728, 4732, 4740, 4768, 4769, 4771, 4776, 1102, 7045
];

export const DEFAULT_WINDOWS_CHANNELS = [
  'Security',
  'System',
  'Application',
  'Microsoft-Windows-PowerShell/Operational'
];

export async function createEnrollmentToken(
  input: { label: string; expiresInHours?: number; maxUses?: number },
  actor: { id: string; name: string; role: string }
) {
  const pool = await getPool();
  const plaintextToken = generateSecureToken('mor_enr', 24);
  const tokenHash = hashToken(plaintextToken);
  const tokenPrefix = getTokenPrefix(plaintextToken);
  const expiresInHours = input.expiresInHours ?? 24;
  const maxUses = input.maxUses ?? 1;
  const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

  const res = await pool.query<{
    id: string;
    token_prefix: string;
    label: string;
    expires_at: string;
    max_uses: number;
    created_at: string;
  }>(
    `INSERT INTO enrollment_tokens (
      token_hash, token_prefix, label, created_by, created_by_name, expires_at, max_uses
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, token_prefix, label, expires_at, max_uses, created_at`,
    [
      tokenHash,
      tokenPrefix,
      input.label.trim(),
      actor.id,
      actor.name,
      expiresAt.toISOString(),
      maxUses
    ]
  );

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Enrollment Token Generated',
    target: `Token: ${tokenPrefix}... (${input.label.trim()})`,
    result: 'Success',
    details: `Expires in ${expiresInHours}h, max uses: ${maxUses}`
  });

  const row = res.rows[0];
  return {
    id: row.id,
    enrollmentToken: plaintextToken, // Returned ONCE at generation
    tokenPrefix: row.token_prefix,
    label: row.label,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    createdAt: row.created_at
  };
}

export async function listEnrollmentTokens() {
  const pool = await getPool();
  const res = await pool.query<{
    id: string;
    token_prefix: string;
    label: string;
    created_by_name: string;
    expires_at: string;
    max_uses: number;
    use_count: number;
    used_at: string | null;
    used_by_agent_id: string | null;
    revoked_at: string | null;
    created_at: string;
  }>(
    `SELECT id, token_prefix, label, created_by_name, expires_at, max_uses,
            use_count, used_at, used_by_agent_id, revoked_at, created_at
     FROM enrollment_tokens
     ORDER BY created_at DESC`
  );

  const now = Date.now();
  return res.rows.map((row) => {
    let status: 'active' | 'used' | 'expired' | 'revoked' = 'active';
    if (row.revoked_at) status = 'revoked';
    else if (row.use_count >= row.max_uses) status = 'used';
    else if (new Date(row.expires_at).getTime() <= now) status = 'expired';

    return {
      id: row.id,
      tokenPrefix: row.token_prefix,
      label: row.label,
      createdBy: row.created_by_name,
      expiresAt: row.expires_at,
      maxUses: row.max_uses,
      useCount: row.use_count,
      usedAt: row.used_at,
      usedByAgentId: row.used_by_agent_id,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
      status
    };
  });
}

export async function revokeEnrollmentToken(
  tokenId: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const res = await pool.query<{ id: string; token_prefix: string }>(
    `UPDATE enrollment_tokens
     SET revoked_at = NOW(), revoked_by = $1
     WHERE id = $2 AND revoked_at IS NULL
     RETURNING id, token_prefix`,
    [actor.name, tokenId]
  );
  if (res.rows.length === 0) {
    throw new AppError(404, 'Enrollment token not found or already revoked');
  }

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Enrollment Token Revoked',
    target: `Token: ${res.rows[0].token_prefix}...`,
    result: 'Success',
    details: 'Token manually revoked by administrator'
  });

  return { id: tokenId, revoked: true };
}

export interface AgentEnrollInput {
  enrollmentToken: string;
  hostname: string;
  fqdn?: string;
  ipAddress?: string;
  macAddress?: string;
  os?: string;
  osVersion?: string;
  osBuild?: string;
  domainName?: string;
  workgroup?: string;
  architecture?: string;
  agentVersion?: string;
  cpuModel?: string;
  cpuCores?: number;
  totalMemoryMb?: number;
  diskTotalGb?: number;
  hardwareVendor?: string;
  hardwareModel?: string;
  serialNumber?: string;
  ipAddresses?: string[];
  macAddresses?: string[];
}

export async function enrollAgent(input: AgentEnrollInput) {
  const pool = await getPool();
  const tokenHash = hashToken(input.enrollmentToken.trim());

  const result = await pool.withTransaction(async (client) => {
    const tokenRes = await client.query<{
      id: string;
      label: string;
      expires_at: string;
      max_uses: number;
      use_count: number;
      revoked_at: string | null;
    }>(
      `SELECT id, label, expires_at, max_uses, use_count, revoked_at
       FROM enrollment_tokens
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    const tokenRow = tokenRes.rows[0];
    if (!tokenRow) {
      throw new AppError(401, 'Invalid enrollment token');
    }
    if (tokenRow.revoked_at) {
      throw new AppError(401, 'Enrollment token has been revoked');
    }
    if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      throw new AppError(401, 'Enrollment token has expired');
    }
    if (tokenRow.use_count >= tokenRow.max_uses) {
      throw new AppError(409, 'Enrollment token has already been used');
    }

    const hostname = input.hostname.trim();
    const ipAddress = sanitizeIp(input.ipAddress) || '127.0.0.1';
    const macAddress = sanitizeMac(input.macAddress);
    const osName = input.os || 'Windows Server / Workstation';
    const agentVersion = input.agentVersion || '1.0.0';

    // Check if an active (non-disabled) agent already exists for this hostname
    const existingAgent = await client.query<{ id: string }>(
      `SELECT id FROM endpoint_agents WHERE LOWER(hostname) = LOWER($1) AND status <> 'Disabled' LIMIT 1`,
      [hostname]
    );

    const agentId =
      existingAgent.rows[0]?.id ||
      `AGT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const assetId = `AST-${agentId.replace('AGT-', '')}`;
    const logSourceId = `SRC-${agentId.replace('AGT-', '')}`;

    // Upsert corresponding Asset record
    const assetType = osName.toLowerCase().includes('domain')
      ? 'Domain Controller'
      : osName.toLowerCase().includes('server')
      ? 'Windows Server'
      : 'Workstation';

    await client.query(
      `INSERT INTO assets (id, hostname, type, os, ip_address, mac_address, criticality, status, last_seen, department, agent_version)
       VALUES ($1, $2, $3, $4, $5::inet, $6::macaddr, 'high', 'Online', NOW(), $7, $8)
       ON CONFLICT (hostname) DO UPDATE SET
         os = EXCLUDED.os,
         ip_address = EXCLUDED.ip_address,
         status = 'Online',
         last_seen = NOW(),
         agent_version = EXCLUDED.agent_version`,
      [
        assetId,
        hostname,
        assetType,
        `${osName}${input.osVersion ? ` ${input.osVersion}` : ''}`,
        ipAddress,
        macAddress,
        input.domainName || 'Windows Endpoint Fleet',
        agentVersion
      ]
    );

    const assetRow = await client.query<{ id: string }>(
      'SELECT id FROM assets WHERE hostname = $1 LIMIT 1',
      [hostname]
    );
    const resolvedAssetId = assetRow.rows[0]?.id || assetId;

    // Upsert corresponding LogSource record
    await client.query(
      `INSERT INTO log_sources (id, name, type, hostname, collection_method, ip_address, status, enabled)
       VALUES ($1, $2, 'Windows Endpoint Agent', $3, 'Endpoint Agent', $4::inet, 'healthy', TRUE)
       ON CONFLICT (id) DO UPDATE SET
         hostname = EXCLUDED.hostname,
         ip_address = EXCLUDED.ip_address,
         status = 'healthy',
         enabled = TRUE`,
      [logSourceId, `WinAgent · ${hostname}`, hostname, ipAddress]
    );

    // Upsert endpoint_agents
    await client.query(
      `INSERT INTO endpoint_agents (
        id, hostname, status, agent_version, ip_address, mac_address, os, os_version, os_build,
        domain_name, asset_id, log_source_id, last_heartbeat_at, enrolled_at, updated_at
      ) VALUES ($1, $2, 'Online', $3, $4::inet, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = 'Online',
        agent_version = EXCLUDED.agent_version,
        ip_address = EXCLUDED.ip_address,
        mac_address = EXCLUDED.mac_address,
        os = EXCLUDED.os,
        os_version = EXCLUDED.os_version,
        os_build = EXCLUDED.os_build,
        domain_name = EXCLUDED.domain_name,
        last_heartbeat_at = NOW(),
        updated_at = NOW()`,
      [
        agentId,
        hostname,
        agentVersion,
        ipAddress,
        input.macAddress || null,
        osName,
        input.osVersion || null,
        input.osBuild || null,
        input.domainName || null,
        resolvedAssetId,
        logSourceId
      ]
    );

    // Upsert endpoint_inventory
    await client.query(
      `INSERT INTO endpoint_inventory (
        agent_id, hostname, fqdn, domain_membership, workgroup, os_name, os_version, os_build,
        architecture, cpu_model, cpu_cores, total_memory_mb, disk_total_gb,
        ip_addresses, mac_addresses, hardware_vendor, hardware_model, serial_number, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16, $17, $18, NOW())
      ON CONFLICT (agent_id) DO UPDATE SET
        hostname = EXCLUDED.hostname,
        fqdn = EXCLUDED.fqdn,
        domain_membership = EXCLUDED.domain_membership,
        workgroup = EXCLUDED.workgroup,
        os_name = EXCLUDED.os_name,
        os_version = EXCLUDED.os_version,
        os_build = EXCLUDED.os_build,
        architecture = EXCLUDED.architecture,
        cpu_model = EXCLUDED.cpu_model,
        cpu_cores = EXCLUDED.cpu_cores,
        total_memory_mb = EXCLUDED.total_memory_mb,
        disk_total_gb = EXCLUDED.disk_total_gb,
        ip_addresses = EXCLUDED.ip_addresses,
        mac_addresses = EXCLUDED.mac_addresses,
        hardware_vendor = EXCLUDED.hardware_vendor,
        hardware_model = EXCLUDED.hardware_model,
        serial_number = EXCLUDED.serial_number,
        updated_at = NOW()`,
      [
        agentId,
        hostname,
        input.fqdn || hostname,
        input.domainName || null,
        input.workgroup || null,
        osName,
        input.osVersion || null,
        input.osBuild || null,
        input.architecture || 'x64',
        input.cpuModel || null,
        input.cpuCores ?? null,
        input.totalMemoryMb ?? null,
        input.diskTotalGb ?? null,
        JSON.stringify(input.ipAddresses || (input.ipAddress ? [input.ipAddress] : [])),
        JSON.stringify(input.macAddresses || (input.macAddress ? [input.macAddress] : [])),
        input.hardwareVendor || null,
        input.hardwareModel || null,
        input.serialNumber || null
      ]
    );

    // Ensure default agent_configurations
    const configRes = await client.query<{
      heartbeat_interval_sec: number;
      offline_threshold_sec: number;
      batch_size: number;
      flush_interval_sec: number;
      enabled_channels: string[];
      monitored_event_ids: number[];
      config_version: number;
    }>(
      `INSERT INTO agent_configurations (
        agent_id, heartbeat_interval_sec, offline_threshold_sec, batch_size, flush_interval_sec,
        enabled_channels, monitored_event_ids
      ) VALUES ($1, $2, $3, 50, 10, $4, $5)
      ON CONFLICT (agent_id) DO UPDATE SET updated_at = NOW()
      RETURNING heartbeat_interval_sec, offline_threshold_sec, batch_size, flush_interval_sec,
                enabled_channels, monitored_event_ids, config_version`,
      [
        agentId,
        env.defaultHeartbeatIntervalSec,
        env.defaultOfflineThresholdSec,
        DEFAULT_WINDOWS_CHANNELS,
        DEFAULT_MONITORED_WINDOWS_EVENT_IDS
      ]
    );

    // Revoke any prior active credentials for this agent before issuing a new secret
    await client.query(
      `UPDATE agent_credentials SET status = 'revoked', revoked_at = NOW()
       WHERE agent_id = $1 AND status = 'active'`,
      [agentId]
    );

    const agentSecret = generateSecureToken('mor_agt', 32);
    const keyHash = hashToken(agentSecret);
    const keyPrefix = getTokenPrefix(agentSecret);

    await client.query(
      `INSERT INTO agent_credentials (agent_id, api_key_hash, key_prefix, status, created_by_token_id)
       VALUES ($1, $2, $3, 'active', $4)`,
      [agentId, keyHash, keyPrefix, tokenRow.id]
    );

    // Mark enrollment token usage
    await client.query(
      `UPDATE enrollment_tokens
       SET use_count = use_count + 1, used_at = NOW(), used_by_agent_id = $1
       WHERE id = $2`,
      [agentId, tokenRow.id]
    );

    await recordAuditLog(
      {
        userName: `Agent:${hostname}`,
        role: 'Endpoint Agent',
        action: 'Windows Agent Enrolled',
        target: `Agent: ${agentId} (${hostname})`,
        result: 'Success',
        details: `Enrolled using token "${tokenRow.label}" from IP ${ipAddress}, OS: ${osName}`
      },
      client
    );

    const cfg = configRes.rows[0];
    return {
      agentId,
      agentSecret, // Returned ONCE during enrollment
      hostname,
      status: 'Online',
      configuration: {
        heartbeatIntervalSec: cfg.heartbeat_interval_sec,
        offlineThresholdSec: cfg.offline_threshold_sec,
        batchSize: cfg.batch_size,
        flushIntervalSec: cfg.flush_interval_sec,
        enabledChannels: cfg.enabled_channels,
        monitoredEventIds: cfg.monitored_event_ids,
        configVersion: cfg.config_version
      }
    };
  });

  sseHub.publish('agent:enrolled', {
    agentId: result.agentId,
    hostname: result.hostname,
    status: result.status,
    timestamp: new Date().toISOString()
  });

  return result;
}

export async function getAgentConfiguration(agentId: string) {
  const pool = await getPool();
  const res = await pool.query<{
    agent_id: string;
    heartbeat_interval_sec: number;
    offline_threshold_sec: number;
    batch_size: number;
    flush_interval_sec: number;
    enabled_channels: string[];
    monitored_event_ids: number[];
    config_version: number;
    updated_at: string;
    updated_by: string | null;
  }>(
    `SELECT agent_id, heartbeat_interval_sec, offline_threshold_sec, batch_size, flush_interval_sec,
            enabled_channels, monitored_event_ids, config_version, updated_at, updated_by
     FROM agent_configurations
     WHERE agent_id = $1`,
    [agentId]
  );

  const row = res.rows[0];
  if (!row) {
    throw new AppError(404, 'Agent configuration not found');
  }

  return {
    agentId: row.agent_id,
    heartbeatIntervalSec: row.heartbeat_interval_sec,
    offlineThresholdSec: row.offline_threshold_sec,
    batchSize: row.batch_size,
    flushIntervalSec: row.flush_interval_sec,
    enabledChannels: row.enabled_channels,
    monitoredEventIds: row.monitored_event_ids,
    configVersion: row.config_version,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  };
}

export async function updateAgentConfiguration(
  agentId: string,
  input: {
    heartbeatIntervalSec?: number;
    offlineThresholdSec?: number;
    batchSize?: number;
    flushIntervalSec?: number;
    enabledChannels?: string[];
    monitoredEventIds?: number[];
  },
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const existing = await getAgentConfiguration(agentId);

  const res = await pool.query<{
    agent_id: string;
    heartbeat_interval_sec: number;
    offline_threshold_sec: number;
    batch_size: number;
    flush_interval_sec: number;
    enabled_channels: string[];
    monitored_event_ids: number[];
    config_version: number;
    updated_at: string;
  }>(
    `UPDATE agent_configurations
     SET heartbeat_interval_sec = $1,
         offline_threshold_sec = $2,
         batch_size = $3,
         flush_interval_sec = $4,
         enabled_channels = $5,
         monitored_event_ids = $6,
         config_version = config_version + 1,
         updated_by = $7,
         updated_at = NOW()
     WHERE agent_id = $8
     RETURNING agent_id, heartbeat_interval_sec, offline_threshold_sec, batch_size, flush_interval_sec,
               enabled_channels, monitored_event_ids, config_version, updated_at`,
    [
      input.heartbeatIntervalSec ?? existing.heartbeatIntervalSec,
      input.offlineThresholdSec ?? existing.offlineThresholdSec,
      input.batchSize ?? existing.batchSize,
      input.flushIntervalSec ?? existing.flushIntervalSec,
      input.enabledChannels ?? existing.enabledChannels,
      input.monitoredEventIds ?? existing.monitoredEventIds,
      actor.name,
      agentId
    ]
  );

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Agent Configuration Updated',
    target: `Agent: ${agentId}`,
    result: 'Success',
    details: `Config version bumped to v${res.rows[0].config_version}`
  });

  const row = res.rows[0];
  return {
    agentId: row.agent_id,
    heartbeatIntervalSec: row.heartbeat_interval_sec,
    offlineThresholdSec: row.offline_threshold_sec,
    batchSize: row.batch_size,
    flushIntervalSec: row.flush_interval_sec,
    enabledChannels: row.enabled_channels,
    monitoredEventIds: row.monitored_event_ids,
    configVersion: row.config_version,
    updatedAt: row.updated_at
  };
}

export async function deactivateAgent(
  agentId: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();

  const updated = await pool.withTransaction(async (client) => {
    const res = await client.query<{
      id: string;
      hostname: string;
      log_source_id: string | null;
      asset_id: string | null;
    }>(
      `UPDATE endpoint_agents
       SET status = 'Disabled', deactivated_at = NOW(), deactivated_by = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, hostname, log_source_id, asset_id`,
      [actor.name, agentId]
    );

    if (res.rows.length === 0) {
      throw new AppError(404, 'Endpoint agent not found');
    }

    const row = res.rows[0];

    await client.query(
      `UPDATE agent_credentials SET status = 'revoked', revoked_at = NOW()
       WHERE agent_id = $1 AND status = 'active'`,
      [agentId]
    );

    if (row.log_source_id) {
      await client.query(
        `UPDATE log_sources SET status = 'offline', enabled = FALSE WHERE id = $1`,
        [row.log_source_id]
      );
    }

    if (row.asset_id) {
      await client.query(`UPDATE assets SET status = 'Offline' WHERE id = $1`, [row.asset_id]);
    }

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Endpoint Agent Deactivated',
        target: `Agent: ${agentId} (${row.hostname})`,
        result: 'Success',
        details: 'Agent disabled and active API credentials revoked'
      },
      client
    );

    return row;
  });

  sseHub.publish('endpoint:status_changed', {
    agentId: updated.id,
    hostname: updated.hostname,
    status: 'Disabled',
    timestamp: new Date().toISOString()
  });

  return {
    agentId: updated.id,
    hostname: updated.hostname,
    status: 'Disabled',
    credentialsRevoked: true
  };
}

export async function listAgents() {
  const pool = await getPool();
  const res = await pool.query<{
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
    deactivated_at: string | null;
  }>(
    `SELECT id, hostname, status, agent_version, host(ip_address) AS ip_address, mac_address,
            os, os_version, os_build, domain_name, last_heartbeat_at, last_event_at,
            total_events_collected::text, enrolled_at, deactivated_at
     FROM endpoint_agents
     ORDER BY enrolled_at DESC`
  );

  return res.rows.map((r) => ({
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
    enrolledAt: r.enrolled_at,
    deactivatedAt: r.deactivated_at
  }));
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

function sanitizeMac(mac?: string): string | null {
  if (!mac) return null;
  const cleaned = mac.trim().replace(/-/g, ':');
  if (/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  return null;
}
