import { getPool } from '../../database/pool.js';
import { AppError } from '../../middleware/errorHandler.js';
import { recordAuditLog } from '../../services/auditService.js';
import { sseHub } from '../../services/sseHub.js';

export async function listAlerts(filters?: { status?: string; severity?: string; search?: string }) {
  const pool = await getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.status && filters.status !== 'ALL') {
    params.push(filters.status);
    conditions.push(`status::text = $${params.length}`);
  }
  if (filters?.severity && filters.severity !== 'ALL') {
    params.push(filters.severity);
    conditions.push(`severity::text = $${params.length}`);
  }
  if (filters?.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(id ILIKE ${p} OR title ILIKE ${p} OR detection_rule_name ILIKE ${p} OR affected_asset ILIKE ${p} OR source_system ILIKE ${p})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await pool.query(
    `SELECT id, title, detection_rule_id, detection_rule_name, severity,
            first_detected, last_detected, source_system, affected_asset,
            host(source_ip) AS source_ip, related_incident_id, status, evidence,
            false_positive_reason, false_positive_by, assigned_to, event_count,
            resolved_at, resolved_by, resolution_note, agent_id
     FROM alerts
     ${whereClause}
     ORDER BY last_detected DESC`,
    params
  );

  return res.rows.map(mapAlertRow);
}

export async function acknowledgeAlert(alertId: string, actor: { name: string; role: string }) {
  const pool = await getPool();
  const res = await pool.query(
    `UPDATE alerts
     SET status = 'acknowledged', assigned_to = COALESCE(assigned_to, $1)
     WHERE id = $2
     RETURNING *, host(source_ip) AS source_ip`,
    [actor.name, alertId]
  );
  if (res.rows.length === 0) throw new AppError(404, 'Alert not found');

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Alert Acknowledged',
    target: `Alert: ${alertId}`,
    result: 'Success',
    details: `Acknowledged by ${actor.name}`
  });

  const mapped = mapAlertRow(res.rows[0]);
  sseHub.publish('alert:updated', mapped);
  return mapped;
}

export async function assignAlert(
  alertId: string,
  analyst: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const res = await pool.query(
    `UPDATE alerts
     SET status = 'assigned', assigned_to = $1
     WHERE id = $2
     RETURNING *, host(source_ip) AS source_ip`,
    [analyst, alertId]
  );
  if (res.rows.length === 0) throw new AppError(404, 'Alert not found');

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Alert Assigned',
    target: `Alert: ${alertId}`,
    result: 'Success',
    details: `Assigned to ${analyst}`
  });

  const mapped = mapAlertRow(res.rows[0]);
  sseHub.publish('alert:updated', mapped);
  return mapped;
}

export async function investigateAlert(alertId: string, actor: { name: string; role: string }) {
  const pool = await getPool();
  const res = await pool.query(
    `UPDATE alerts
     SET status = 'investigating', assigned_to = COALESCE(assigned_to, $1)
     WHERE id = $2
     RETURNING *, host(source_ip) AS source_ip`,
    [actor.name, alertId]
  );
  if (res.rows.length === 0) throw new AppError(404, 'Alert not found');

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Alert Under Investigation',
    target: `Alert: ${alertId}`,
    result: 'Success',
    details: `Investigation started by ${actor.name}`
  });

  const mapped = mapAlertRow(res.rows[0]);
  sseHub.publish('alert:updated', mapped);
  return mapped;
}

export async function markAlertFalsePositive(
  alertId: string,
  reason: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const res = await pool.query(
    `UPDATE alerts
     SET status = 'false_positive', false_positive_reason = $1, false_positive_by = $2
     WHERE id = $3
     RETURNING *, host(source_ip) AS source_ip`,
    [reason, actor.name, alertId]
  );
  if (res.rows.length === 0) throw new AppError(404, 'Alert not found');

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Alert Marked False Positive',
    target: `Alert: ${alertId}`,
    result: 'Success',
    details: `Reason: ${reason}`
  });

  const mapped = mapAlertRow(res.rows[0]);
  sseHub.publish('alert:updated', mapped);
  return mapped;
}

export async function resolveAlert(
  alertId: string,
  note: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const res = await pool.query(
    `UPDATE alerts
     SET status = 'resolved', resolved_at = NOW(), resolved_by = $1, resolution_note = $2
     WHERE id = $3
     RETURNING *, host(source_ip) AS source_ip`,
    [actor.name, note, alertId]
  );
  if (res.rows.length === 0) throw new AppError(404, 'Alert not found');

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Alert Resolved',
    target: `Alert: ${alertId}`,
    result: 'Success',
    details: note
  });

  const mapped = mapAlertRow(res.rows[0]);
  sseHub.publish('alert:updated', mapped);
  return mapped;
}

export async function escalateAlertToIncident(
  alertId: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();

  const { incident, alert } = await pool.withTransaction(async (client) => {
    const alertRes = await client.query<Record<string, any>>(
      'SELECT *, host(source_ip) AS source_ip FROM alerts WHERE id = $1 FOR UPDATE',
      [alertId]
    );
    const targetAlert = alertRes.rows[0];
    if (!targetAlert) throw new AppError(404, 'Alert not found');

    const evtsRes = await client.query<{ id: string }>(
      'SELECT id FROM security_events WHERE related_alert_id = $1 LIMIT 50',
      [alertId]
    );
    const relatedEventIds = evtsRes.rows.map((r) => r.id);

    const incId = `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const evidenceList = Array.isArray(targetAlert.evidence)
      ? targetAlert.evidence.map((e: any) => `${e.label}: ${e.value}`).join(' | ')
      : '';

    const incRes = await client.query<Record<string, any>>(
      `INSERT INTO incidents (
        id, title, severity, status, affected_assets, assigned_analyst,
        source, summary, description, related_event_ids, related_alert_ids, agent_id
      ) VALUES (
        $1, $2, $3, 'new', $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      RETURNING *`,
      [
        incId,
        `Escalated from Alert ${alertId}: ${targetAlert.title}`,
        targetAlert.severity,
        [targetAlert.affected_asset],
        actor.name,
        targetAlert.source_system,
        `Automated alert escalation. Rule: ${targetAlert.detection_rule_name}`,
        `Alert evidence: ${evidenceList}`,
        relatedEventIds,
        [alertId],
        targetAlert.agent_id || null
      ]
    );

    await client.query(
      `INSERT INTO incident_timeline (incident_id, user_name, action, type)
       VALUES ($1, $2, $3, 'status_change')`,
      [incId, `${actor.name} (${actor.role})`, `Incident escalated from alert ${alertId}`]
    );

    const updatedAlertRes = await client.query<Record<string, any>>(
      `UPDATE alerts SET related_incident_id = $1, status = 'linked'
       WHERE id = $2
       RETURNING *, host(source_ip) AS source_ip`,
      [incId, alertId]
    );

    if (relatedEventIds.length > 0) {
      await client.query(
        `UPDATE security_events SET related_incident_id = $1 WHERE id = ANY($2::varchar[])`,
        [incId, relatedEventIds]
      );
    }

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Alert Escalated to Incident',
        target: `Alert: ${alertId} -> Incident: ${incId}`,
        result: 'Success',
        details: `Created incident ${incId} with severity ${targetAlert.severity}`
      },
      client
    );

    return {
      incident: incRes.rows[0],
      alert: mapAlertRow(updatedAlertRes.rows[0])
    };
  });

  sseHub.publish('alert:updated', alert);
  sseHub.publish('incident:created', incident);

  return { incident, alert };
}

export async function linkAlertToIncident(
  alertId: string,
  incidentId: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();

  const updatedAlert = await pool.withTransaction(async (client) => {
    const incCheck = await client.query('SELECT id FROM incidents WHERE id = $1', [incidentId]);
    if (incCheck.rows.length === 0) throw new AppError(404, 'Target incident not found');

    const alertRes = await client.query<Record<string, any>>(
      `UPDATE alerts SET related_incident_id = $1, status = 'linked'
       WHERE id = $2
       RETURNING *, host(source_ip) AS source_ip`,
      [incidentId, alertId]
    );
    if (alertRes.rows.length === 0) throw new AppError(404, 'Alert not found');

    await client.query(
      `UPDATE incidents
       SET related_alert_ids = ARRAY(SELECT DISTINCT unnest(related_alert_ids || ARRAY[$1::text])),
           last_updated = NOW()
       WHERE id = $2`,
      [alertId, incidentId]
    );

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Alert Linked to Incident',
        target: `Alert: ${alertId} -> Incident: ${incidentId}`,
        result: 'Success',
        details: 'Linked alert record to existing incident'
      },
      client
    );

    return mapAlertRow(alertRes.rows[0]);
  });

  sseHub.publish('alert:updated', updatedAlert);
  sseHub.publish('incident:updated', { id: incidentId });
  return updatedAlert;
}

function mapAlertRow(r: Record<string, any>) {
  return {
    id: r.id,
    title: r.title,
    detectionRuleId: r.detection_rule_id || '',
    detectionRuleName: r.detection_rule_name,
    severity: r.severity,
    firstDetected: new Date(r.first_detected).toISOString().replace('T', ' ').slice(0, 19),
    lastDetected: new Date(r.last_detected).toISOString().replace('T', ' ').slice(0, 19),
    sourceSystem: r.source_system,
    affectedAsset: r.affected_asset,
    sourceIp: r.source_ip || undefined,
    relatedIncidentId: r.related_incident_id || undefined,
    status: r.status,
    evidence: r.evidence || [],
    falsePositiveReason: r.false_positive_reason || undefined,
    falsePositiveBy: r.false_positive_by || undefined,
    assignedTo: r.assigned_to || undefined,
    eventCount: r.event_count,
    resolvedAt: r.resolved_at || undefined,
    resolvedBy: r.resolved_by || undefined,
    resolutionNote: r.resolution_note || undefined,
    agentId: r.agent_id || undefined
  };
}
