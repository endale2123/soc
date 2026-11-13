import { getPool } from '../../database/pool.js';
import { AppError } from '../../middleware/errorHandler.js';
import { recordAuditLog } from '../../services/auditService.js';
import { sseHub } from '../../services/sseHub.js';

export async function listIncidents() {
  const pool = await getPool();
  const incRes = await pool.query<Record<string, any>>(
    'SELECT * FROM incidents ORDER BY last_updated DESC'
  );
  if (incRes.rows.length === 0) return [];

  const incIds = incRes.rows.map((r) => r.id);
  const [tlRes, notesRes, actionsRes] = await Promise.all([
    pool.query<Record<string, any>>(
      'SELECT * FROM incident_timeline WHERE incident_id = ANY($1::varchar[]) ORDER BY timestamp ASC',
      [incIds]
    ),
    pool.query<Record<string, any>>(
      'SELECT * FROM investigation_notes WHERE incident_id = ANY($1::varchar[]) ORDER BY timestamp ASC',
      [incIds]
    ),
    pool.query<Record<string, any>>(
      'SELECT * FROM response_actions WHERE incident_id = ANY($1::varchar[]) ORDER BY timestamp ASC',
      [incIds]
    )
  ]);

  const tlMap = new Map<string, any[]>();
  for (const t of tlRes.rows) {
    const arr = tlMap.get(t.incident_id) || [];
    arr.push({
      id: t.id,
      timestamp: formatTs(t.timestamp),
      user: t.user_name,
      action: t.action,
      note: t.note || undefined,
      type: t.type
    });
    tlMap.set(t.incident_id, arr);
  }

  const notesMap = new Map<string, any[]>();
  for (const n of notesRes.rows) {
    const arr = notesMap.get(n.incident_id) || [];
    arr.push({
      id: n.id,
      author: n.author,
      role: n.role,
      timestamp: formatTs(n.timestamp),
      text: n.text
    });
    notesMap.set(n.incident_id, arr);
  }

  const actionsMap = new Map<string, any[]>();
  for (const a of actionsRes.rows) {
    const arr = actionsMap.get(a.incident_id) || [];
    arr.push({
      id: a.id,
      actionName: a.action_name,
      targetAsset: a.target_asset,
      initiatedBy: a.initiated_by,
      timestamp: formatTs(a.timestamp),
      status: a.status,
      resultDetails: a.result_details
    });
    actionsMap.set(a.incident_id, arr);
  }

  return incRes.rows.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    status: r.status,
    detectionTime: formatTs(r.detection_time),
    lastUpdated: formatTs(r.last_updated),
    affectedAssets: r.affected_assets || [],
    assignedAnalyst: r.assigned_analyst,
    source: r.source,
    summary: r.summary,
    description: r.description,
    relatedEventIds: r.related_event_ids || [],
    relatedAlertIds: r.related_alert_ids || [],
    timeline: tlMap.get(r.id) || [],
    notes: notesMap.get(r.id) || [],
    responseActions: actionsMap.get(r.id) || [],
    closedResolution: r.closed_resolution || undefined
  }));
}

export async function getIncidentById(incidentId: string) {
  const all = await listIncidents();
  const found = all.find((i) => i.id === incidentId);
  if (!found) throw new AppError(404, 'Incident not found');
  return found;
}

export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  note: string | undefined,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  await pool.withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE incidents SET status = $1, last_updated = NOW() WHERE id = $2 RETURNING id`,
      [status, incidentId]
    );
    if (res.rows.length === 0) throw new AppError(404, 'Incident not found');

    await client.query(
      `INSERT INTO incident_timeline (incident_id, user_name, action, note, type)
       VALUES ($1, $2, $3, $4, 'status_change')`,
      [incidentId, `${actor.name} (${actor.role})`, `Status updated to ${status.toUpperCase()}`, note || null]
    );

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Incident Status Updated',
        target: `Incident: ${incidentId}`,
        result: 'Success',
        details: `Status changed to ${status.toUpperCase()}${note ? ` Note: ${note}` : ''}`
      },
      client
    );
  });

  const updated = await getIncidentById(incidentId);
  sseHub.publish('incident:updated', updated);
  return updated;
}

export async function updateIncidentSeverity(
  incidentId: string,
  severity: string,
  reason: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  await pool.withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE incidents SET severity = $1, last_updated = NOW() WHERE id = $2 RETURNING id`,
      [severity, incidentId]
    );
    if (res.rows.length === 0) throw new AppError(404, 'Incident not found');

    await client.query(
      `INSERT INTO incident_timeline (incident_id, user_name, action, note, type)
       VALUES ($1, $2, $3, $4, 'severity_change')`,
      [incidentId, `${actor.name} (${actor.role})`, `Severity reclassified to ${severity.toUpperCase()}`, reason]
    );

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Incident Severity Changed',
        target: `Incident: ${incidentId}`,
        result: 'Success',
        details: `Reclassified to ${severity.toUpperCase()}. Reason: ${reason}`
      },
      client
    );
  });

  const updated = await getIncidentById(incidentId);
  sseHub.publish('incident:updated', updated);
  return updated;
}

export async function assignIncident(
  incidentId: string,
  analystName: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  await pool.withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE incidents SET assigned_analyst = $1, last_updated = NOW() WHERE id = $2 RETURNING id`,
      [analystName, incidentId]
    );
    if (res.rows.length === 0) throw new AppError(404, 'Incident not found');

    await client.query(
      `INSERT INTO incident_timeline (incident_id, user_name, action, type)
       VALUES ($1, $2, $3, 'assignment')`,
      [incidentId, `${actor.name} (${actor.role})`, `Reassigned to ${analystName}`]
    );

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Incident Reassigned',
        target: `Incident: ${incidentId}`,
        result: 'Success',
        details: `Assigned to ${analystName}`
      },
      client
    );
  });

  const updated = await getIncidentById(incidentId);
  sseHub.publish('incident:updated', updated);
  return updated;
}

export async function addIncidentNote(
  incidentId: string,
  text: string,
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  await pool.withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE incidents SET last_updated = NOW() WHERE id = $1 RETURNING id`,
      [incidentId]
    );
    if (res.rows.length === 0) throw new AppError(404, 'Incident not found');

    await client.query(
      `INSERT INTO investigation_notes (incident_id, author, role, text)
       VALUES ($1, $2, $3, $4)`,
      [incidentId, actor.name, actor.role, text]
    );

    await client.query(
      `INSERT INTO incident_timeline (incident_id, user_name, action, type)
       VALUES ($1, $2, 'Investigation note added', 'note_added')`,
      [incidentId, `${actor.name} (${actor.role})`]
    );

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Investigation Note Added',
        target: `Incident: ${incidentId}`,
        result: 'Success',
        details: `Added note: "${text.slice(0, 60)}"`
      },
      client
    );
  });

  const updated = await getIncidentById(incidentId);
  sseHub.publish('incident:updated', updated);
  return updated;
}

export async function addIncidentResponseAction(
  incidentId: string,
  input: { actionName: string; targetAsset: string; details: string },
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  await pool.withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE incidents SET last_updated = NOW() WHERE id = $1 RETURNING id`,
      [incidentId]
    );
    if (res.rows.length === 0) throw new AppError(404, 'Incident not found');

    await client.query(
      `INSERT INTO response_actions (incident_id, action_name, target_asset, initiated_by, status, result_details)
       VALUES ($1, $2, $3, $4, 'completed', $5)`,
      [incidentId, input.actionName, input.targetAsset, actor.name, input.details]
    );

    await client.query(
      `INSERT INTO incident_timeline (incident_id, user_name, action, type)
       VALUES ($1, $2, $3, 'action_taken')`,
      [
        incidentId,
        `${actor.name} (${actor.role})`,
        `Executed action: ${input.actionName} on ${input.targetAsset}`
      ]
    );

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Response Action Executed',
        target: `Target: ${input.targetAsset}`,
        result: 'Success',
        details: `${input.actionName}: ${input.details}`
      },
      client
    );
  });

  const updated = await getIncidentById(incidentId);
  sseHub.publish('incident:updated', updated);
  return updated;
}

export async function closeIncidentWithResolution(
  incidentId: string,
  resolution: { rootCause: string; resolutionSummary: string; preventativeAction: string },
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const payload = {
    resolvedAt: formatTs(new Date().toISOString()),
    resolvedBy: actor.name,
    rootCause: resolution.rootCause,
    resolutionSummary: resolution.resolutionSummary,
    preventativeAction: resolution.preventativeAction
  };

  await pool.withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE incidents SET status = 'closed', closed_resolution = $1::jsonb, last_updated = NOW()
       WHERE id = $2 RETURNING id`,
      [JSON.stringify(payload), incidentId]
    );
    if (res.rows.length === 0) throw new AppError(404, 'Incident not found');

    await client.query(
      `INSERT INTO incident_timeline (incident_id, user_name, action, type)
       VALUES ($1, $2, 'Incident officially closed with documented resolution', 'status_change')`,
      [incidentId, `${actor.name} (${actor.role})`]
    );

    await recordAuditLog(
      {
        userName: actor.name,
        role: actor.role,
        action: 'Incident Closed',
        target: `Incident: ${incidentId}`,
        result: 'Success',
        details: `Closed by ${actor.name}. Root cause: ${resolution.rootCause.slice(0, 80)}`
      },
      client
    );
  });

  const updated = await getIncidentById(incidentId);
  sseHub.publish('incident:updated', updated);
  return updated;
}

function formatTs(ts: string): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
}
