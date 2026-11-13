import { getPool } from '../../database/pool.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface EventsQuery {
  search?: string;
  severity?: string;
  category?: string;
  source?: string;
  hostname?: string;
  page?: number;
  pageSize?: number;
}

export interface WindowsEventsQuery {
  eventId?: number;
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
}

export async function listSecurityEvents(query: EventsQuery) {
  const pool = await getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.severity && query.severity !== 'ALL') {
    params.push(query.severity);
    conditions.push(`se.severity::text = $${params.length}`);
  }
  if (query.category && query.category !== 'ALL') {
    params.push(query.category);
    conditions.push(`se.category::text = $${params.length}`);
  }
  if (query.source && query.source !== 'ALL') {
    params.push(`%${query.source}%`);
    conditions.push(`(se.source_type ILIKE $${params.length} OR se.source_name ILIKE $${params.length})`);
  }
  if (query.hostname) {
    params.push(`%${query.hostname}%`);
    conditions.push(`se.hostname ILIKE $${params.length}`);
  }
  if (query.search && query.search.trim()) {
    params.push(`%${query.search.trim()}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(se.id ILIKE ${p} OR se.hostname ILIKE ${p} OR COALESCE(se.username, '') ILIKE ${p} OR COALESCE(host(se.src_ip), '') ILIKE ${p} OR COALESCE(host(se.dest_ip), '') ILIKE ${p} OR se.original_message ILIKE ${p})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 50));
  const offset = (page - 1) * pageSize;

  const [countRes, rowsRes] = await Promise.all([
    pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM security_events se ${whereClause}`,
      params
    ),
    pool.query(
      `SELECT se.id, se.timestamp, se.source_name, se.source_type, se.hostname, se.username,
              host(se.src_ip) AS src_ip, host(se.dest_ip) AS dest_ip, se.category, se.severity,
              se.original_message, se.normalized_fields, se.related_alert_id, se.related_incident_id,
              se.collection_timestamp, se.parsing_status, se.windows_event_id, se.agent_id
       FROM security_events se
       ${whereClause}
       ORDER BY se.timestamp DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    )
  ]);

  const total = Number.parseInt(countRes.rows[0]?.total || '0', 10);
  return {
    items: rowsRes.rows.map(mapSecurityEventRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function listWindowsEvents(query: WindowsEventsQuery) {
  const pool = await getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.eventId && Number.isFinite(query.eventId)) {
    params.push(query.eventId);
    conditions.push(`wed.windows_event_id = $${params.length}`);
  }
  if (query.hostname && query.hostname.trim()) {
    params.push(`%${query.hostname.trim()}%`);
    conditions.push(`wed.computer_name ILIKE $${params.length}`);
  }
  if (query.username && query.username.trim()) {
    params.push(`%${query.username.trim()}%`);
    conditions.push(
      `(COALESCE(wed.target_username, '') ILIKE $${params.length} OR COALESCE(wed.subject_username, '') ILIKE $${params.length})`
    );
  }
  if (query.severity && query.severity !== 'ALL') {
    params.push(query.severity);
    conditions.push(`se.severity::text = $${params.length}`);
  }
  if (query.channel && query.channel !== 'ALL') {
    params.push(query.channel);
    conditions.push(`wed.channel = $${params.length}`);
  }
  if (query.srcIp && query.srcIp.trim()) {
    params.push(`%${query.srcIp.trim()}%`);
    conditions.push(`COALESCE(host(se.src_ip), '') ILIKE $${params.length}`);
  }
  if (query.startDate) {
    params.push(query.startDate);
    conditions.push(`wed.event_timestamp >= $${params.length}::timestamptz`);
  }
  if (query.endDate) {
    params.push(query.endDate);
    conditions.push(`wed.event_timestamp <= $${params.length}::timestamptz`);
  }
  if (query.search && query.search.trim()) {
    params.push(`%${query.search.trim()}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(se.original_message ILIKE ${p} OR COALESCE(wed.command_line, '') ILIKE ${p} OR COALESCE(wed.process_name, '') ILIKE ${p} OR wed.computer_name ILIKE ${p} OR CAST(wed.windows_event_id AS TEXT) ILIKE ${p})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const [countRes, rowsRes] = await Promise.all([
    pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM windows_event_details wed
       JOIN security_events se ON se.id = wed.security_event_id
       ${whereClause}`,
      params
    ),
    pool.query(
      `SELECT wed.id, wed.security_event_id, wed.agent_id, wed.windows_event_id, wed.record_id,
              wed.channel, wed.provider_name, wed.computer_name, wed.domain_name,
              wed.target_username, wed.subject_username, wed.logon_type,
              wed.process_name, wed.process_id, wed.parent_process_name, wed.parent_process_id,
              wed.command_line, wed.service_name, wed.task_name, wed.target_group,
              wed.status_code, wed.sub_status, wed.event_timestamp,
              (wed.raw_xml IS NOT NULL) AS has_raw_xml,
              se.severity, se.category, host(se.src_ip) AS src_ip, host(se.dest_ip) AS dest_ip,
              se.original_message, se.related_alert_id, se.related_incident_id
       FROM windows_event_details wed
       JOIN security_events se ON se.id = wed.security_event_id
       ${whereClause}
       ORDER BY wed.event_timestamp DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    )
  ]);

  const total = Number.parseInt(countRes.rows[0]?.total || '0', 10);
  return {
    items: rowsRes.rows.map((r: Record<string, any>) => ({
      id: r.security_event_id,
      detailId: r.id,
      agentId: r.agent_id,
      windowsEventId: r.windows_event_id,
      recordId: r.record_id ? Number(r.record_id) : null,
      channel: r.channel,
      providerName: r.provider_name,
      hostname: r.computer_name,
      domain: r.domain_name,
      targetUsername: r.target_username,
      subjectUsername: r.subject_username,
      username: r.target_username || r.subject_username || null,
      logonType: r.logon_type,
      processName: r.process_name,
      processId: r.process_id,
      parentProcessName: r.parent_process_name,
      parentProcessId: r.parent_process_id,
      commandLine: r.command_line,
      serviceName: r.service_name,
      taskName: r.task_name,
      targetGroup: r.target_group,
      statusCode: r.status_code,
      subStatus: r.sub_status,
      timestamp: r.event_timestamp,
      severity: r.severity,
      category: r.category,
      srcIp: r.src_ip,
      destIp: r.dest_ip,
      message: r.original_message,
      hasRawXml: Boolean(r.has_raw_xml),
      relatedAlertId: r.related_alert_id,
      relatedIncidentId: r.related_incident_id
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getWindowsEventDetail(securityEventId: string, includeRawXml: boolean) {
  const pool = await getPool();
  const res = await pool.query(
    `SELECT wed.*, se.severity, se.category, host(se.src_ip) AS src_ip, host(se.dest_ip) AS dest_ip,
            se.original_message, se.normalized_fields, se.related_alert_id, se.related_incident_id
     FROM windows_event_details wed
     JOIN security_events se ON se.id = wed.security_event_id
     WHERE wed.security_event_id = $1 OR wed.id = $1
     LIMIT 1`,
    [securityEventId]
  );

  const r = res.rows[0] as Record<string, any> | undefined;
  if (!r) {
    throw new AppError(404, 'Windows event not found');
  }

  return {
    id: r.security_event_id,
    detailId: r.id,
    agentId: r.agent_id,
    windowsEventId: r.windows_event_id,
    recordId: r.record_id ? Number(r.record_id) : null,
    channel: r.channel,
    providerName: r.provider_name,
    hostname: r.computer_name,
    domain: r.domain_name,
    targetUsername: r.target_username,
    subjectUsername: r.subject_username,
    logonType: r.logon_type,
    processName: r.process_name,
    processId: r.process_id,
    parentProcessName: r.parent_process_name,
    parentProcessId: r.parent_process_id,
    commandLine: r.command_line,
    serviceName: r.service_name,
    taskName: r.task_name,
    targetGroup: r.target_group,
    statusCode: r.status_code,
    subStatus: r.sub_status,
    timestamp: r.event_timestamp,
    severity: r.severity,
    category: r.category,
    srcIp: r.src_ip,
    destIp: r.dest_ip,
    message: r.original_message,
    normalizedFields: r.normalized_fields,
    structuredData: r.structured_data,
    rawXml: includeRawXml ? r.raw_xml : null,
    relatedAlertId: r.related_alert_id,
    relatedIncidentId: r.related_incident_id
  };
}

function mapSecurityEventRow(r: Record<string, any>) {
  return {
    id: r.id,
    timestamp: new Date(r.timestamp).toISOString().replace('T', ' ').slice(0, 19),
    sourceName: r.source_name,
    sourceType: r.source_type,
    hostname: r.hostname,
    username: r.username || undefined,
    srcIp: r.src_ip || undefined,
    destIp: r.dest_ip || undefined,
    category: r.category,
    severity: r.severity,
    originalMessage: r.original_message,
    normalizedFields: r.normalized_fields || {},
    relatedAlertId: r.related_alert_id || undefined,
    relatedIncidentId: r.related_incident_id || undefined,
    collectionTimestamp: new Date(r.collection_timestamp).toISOString().replace('T', ' ').slice(0, 19),
    parsingStatus: r.parsing_status,
    windowsEventId: r.windows_event_id || undefined,
    agentId: r.agent_id || undefined
  };
}
