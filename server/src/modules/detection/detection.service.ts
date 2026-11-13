import { getPool } from '../../database/pool.js';
import { AuthenticatedAgent } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { recordAuditLog } from '../../services/auditService.js';
import { sseHub } from '../../services/sseHub.js';
import { NormalizedSeverity, NormalizedWindowsEvent } from '../ingestion/windowsNormalizer.js';

interface DbDetectionRule {
  id: string;
  rule_key: string | null;
  name: string;
  description: string;
  severity: NormalizedSeverity;
  category: string;
  detection_logic: string;
  required_sources: string[];
  enabled: boolean;
  last_triggered: string | null;
  time_window_minutes: number;
  threshold_count: number;
  investigation_guidance: string;
  config: Record<string, unknown>;
}

interface AlertCandidate {
  rule: DbDetectionRule;
  title: string;
  severity: NormalizedSeverity;
  affectedAsset: string;
  sourceIp: string | null;
  dedupKey: string;
  eventIds: string[];
  eventCount: number;
  evidence: { label: string; value: string }[];
  detectionTimestamp: string;
}

const PRIVILEGED_GROUPS = [
  'administrators',
  'domain admins',
  'enterprise admins',
  'schema admins',
  'account operators',
  'backup operators',
  'dnsadmins'
];

const EXCLUDED_PRIVILEGED_SUBJECTS = new Set([
  'system',
  'local service',
  'network service',
  'dwm-1',
  'umfd-0',
  'umfd-1'
]);

const SUSPICIOUS_POWERSHELL_PATTERNS = [
  '-enc',
  '-encodedcommand',
  '-w hidden',
  '-windowstyle hidden',
  'executionpolicy bypass',
  '-ep bypass',
  'iex',
  'invoke-expression',
  'downloadstring',
  'frombase64string',
  'net.webclient'
];

const LOLBINS = [
  'certutil.exe',
  'mshta.exe',
  'regsvr32.exe',
  'rundll32.exe',
  'bitsadmin.exe',
  'wmic.exe',
  'vssadmin.exe',
  'nltest.exe',
  'mimikatz.exe'
];

const SUSPICIOUS_PARENTS = [
  'winword.exe',
  'excel.exe',
  'powerpnt.exe',
  'outlook.exe',
  'w3wp.exe',
  'sqlservr.exe'
];

export async function evaluateDetectionRulesForEvents(
  agent: AuthenticatedAgent,
  events: NormalizedWindowsEvent[]
): Promise<{ alertsTriggered: number }> {
  const pool = await getPool();
  const rulesRes = await pool.query<DbDetectionRule>(
    `SELECT id, rule_key, name, description, severity, category, detection_logic,
            required_sources, enabled, last_triggered, time_window_minutes,
            threshold_count, investigation_guidance, config
     FROM detection_rules
     WHERE enabled = TRUE`
  );

  const rulesByKey = new Map<string, DbDetectionRule>();
  for (const r of rulesRes.rows) {
    if (r.rule_key) rulesByKey.set(r.rule_key, r);
  }

  const candidates: AlertCandidate[] = [];

  // 1. Multiple failed Windows login attempts (4625, 4771, 4776 with non-zero failure)
  const failedRule = rulesByKey.get('multiple_failed_logins');
  if (failedRule) {
    const failedEvents = events.filter(
      (e) =>
        e.windowsEventId === 4625 ||
        e.windowsEventId === 4771 ||
        (e.windowsEventId === 4776 && e.statusCode && e.statusCode !== '0x0')
    );

    if (failedEvents.length > 0) {
      const groupedKeys = new Map<string, NormalizedWindowsEvent[]>();
      for (const evt of failedEvents) {
        const key = `${evt.hostname}|${evt.username || 'unknown'}|${evt.srcIp || 'local'}`;
        const list = groupedKeys.get(key) || [];
        list.push(evt);
        groupedKeys.set(key, list);
      }

      for (const [groupKey, groupEvents] of groupedKeys.entries()) {
        const sample = groupEvents.reduce(
          (latest, current) => (current.timestamp > latest.timestamp ? current : latest),
          groupEvents[0]
        );
        const countRes = await pool.query<{ cnt: string }>(
          `SELECT COUNT(*)::text AS cnt
           FROM windows_event_details wed
           JOIN security_events se ON se.id = wed.security_event_id
           WHERE wed.agent_id = $1
             AND wed.windows_event_id IN (4625, 4771, 4776)
             AND COALESCE(wed.target_username, 'unknown') = $2
             AND COALESCE(host(se.src_ip), 'local') = $3
             AND wed.event_timestamp >= ($4::timestamptz - ($5::int * INTERVAL '1 minute'))
             AND wed.event_timestamp <= $4::timestamptz`,
          [
            agent.id,
            sample.username || 'unknown',
            sample.srcIp || 'local',
            sample.timestamp,
            failedRule.time_window_minutes
          ]
        );
        const totalInWindow = Number.parseInt(countRes.rows[0]?.cnt || '0', 10);
        if (totalInWindow >= failedRule.threshold_count) {
          candidates.push({
            rule: failedRule,
            title: `Multiple Failed Windows Logins (${totalInWindow} attempts) on ${sample.hostname}`,
            severity: totalInWindow >= failedRule.threshold_count * 2 ? 'critical' : failedRule.severity,
            affectedAsset: sample.hostname,
            sourceIp: sample.srcIp,
            dedupKey: `RULE-WIN-001:${agent.id}:${groupKey}`,
            eventIds: groupEvents.map((e) => e.securityEventId),
            eventCount: totalInWindow,
            detectionTimestamp: sample.timestamp,
            evidence: [
              { label: 'Target Username', value: sample.username || 'N/A' },
              { label: 'Source IP', value: sample.srcIp || 'Local' },
              { label: 'Failure Count', value: `${totalInWindow} in ${failedRule.time_window_minutes}m` },
              { label: 'Status Code', value: sample.statusCode || '0xC000006D' }
            ]
          });
        }
      }
    }
  }

  // 2. Successful login following multiple failed attempts (4624 after >= threshold prior 4625/4771)
  const successAfterFailRule = rulesByKey.get('success_after_failed_logins');
  if (successAfterFailRule) {
    const successEvents = events.filter((e) => e.windowsEventId === 4624 && e.username);
    for (const evt of successEvents) {
      const priorRes = await pool.query<{ cnt: string }>(
        `SELECT COUNT(*)::text AS cnt
         FROM windows_event_details wed
         JOIN security_events se ON se.id = wed.security_event_id
         WHERE wed.agent_id = $1
           AND wed.windows_event_id IN (4625, 4771)
           AND (LOWER(COALESCE(wed.target_username, '')) = LOWER($2) OR ($3::text IS NOT NULL AND host(se.src_ip) = $3))
           AND wed.event_timestamp >= ($4::timestamptz - ($5::int * INTERVAL '1 minute'))
           AND wed.event_timestamp <= $4::timestamptz`,
        [
          agent.id,
          evt.username,
          evt.srcIp,
          evt.timestamp,
          successAfterFailRule.time_window_minutes
        ]
      );
      const priorFailures = Number.parseInt(priorRes.rows[0]?.cnt || '0', 10);
      if (priorFailures >= successAfterFailRule.threshold_count) {
        candidates.push({
          rule: successAfterFailRule,
          title: `Successful Logon After ${priorFailures} Failed Attempts (${evt.username})`,
          severity: successAfterFailRule.severity,
          affectedAsset: evt.hostname,
          sourceIp: evt.srcIp,
          dedupKey: `RULE-WIN-002:${agent.id}:${evt.username}:${evt.srcIp || 'local'}`,
          eventIds: [evt.securityEventId],
          eventCount: priorFailures + 1,
          detectionTimestamp: evt.timestamp,
          evidence: [
            { label: 'Account', value: evt.username || 'N/A' },
            { label: 'Source IP', value: evt.srcIp || 'Local' },
            { label: 'Prior Failures', value: String(priorFailures) },
            { label: 'Logon Type', value: String(evt.logonType ?? 'N/A') }
          ]
        });
      }
    }
  }

  // 3. Privileged account activity (4672, 4648)
  const privRule = rulesByKey.get('privileged_account_activity');
  if (privRule) {
    for (const evt of events) {
      if (evt.windowsEventId === 4672 || evt.windowsEventId === 4648) {
        const actor = (evt.subjectUsername || evt.username || '').toLowerCase();
        if (!actor || EXCLUDED_PRIVILEGED_SUBJECTS.has(actor) || actor.endsWith('$')) {
          continue;
        }
        candidates.push({
          rule: privRule,
          title: `Privileged Account Activity (${evt.windowsEventId}) by ${evt.username || actor}`,
          severity: privRule.severity,
          affectedAsset: evt.hostname,
          sourceIp: evt.srcIp,
          dedupKey: `RULE-WIN-003:${agent.id}:${actor}`,
          eventIds: [evt.securityEventId],
          eventCount: 1,
          detectionTimestamp: evt.timestamp,
          evidence: [
            { label: 'Event ID', value: String(evt.windowsEventId) },
            { label: 'Account', value: evt.username || actor },
            { label: 'Host', value: evt.hostname },
            { label: 'Source IP', value: evt.srcIp || 'Local' }
          ]
        });
      }
    }
  }

  // 4. New user account creation (4720, 4722)
  const newUserRule = rulesByKey.get('new_user_account_created');
  if (newUserRule) {
    for (const evt of events) {
      if (evt.windowsEventId === 4720 || evt.windowsEventId === 4722) {
        candidates.push({
          rule: newUserRule,
          title: `Windows User Account ${evt.windowsEventId === 4720 ? 'Created' : 'Enabled'}: ${
            evt.targetUsername || evt.username || 'Unknown'
          }`,
          severity: newUserRule.severity,
          affectedAsset: evt.hostname,
          sourceIp: evt.srcIp,
          dedupKey: `RULE-WIN-004:${agent.id}:${evt.targetUsername || evt.securityEventId}`,
          eventIds: [evt.securityEventId],
          eventCount: 1,
          detectionTimestamp: evt.timestamp,
          evidence: [
            { label: 'Target Account', value: evt.targetUsername || evt.username || 'Unknown' },
            { label: 'Performed By', value: evt.subjectUsername || 'Unknown' },
            { label: 'Host', value: evt.hostname }
          ]
        });
      }
    }
  }

  // 5. Administrator group modification (4728, 4732)
  const adminGroupRule = rulesByKey.get('admin_group_modification');
  if (adminGroupRule) {
    for (const evt of events) {
      if (evt.windowsEventId === 4728 || evt.windowsEventId === 4732) {
        const grp = (evt.targetGroup || '').toLowerCase();
        const isPrivGroup = !grp || PRIVILEGED_GROUPS.some((g) => grp.includes(g));
        if (!isPrivGroup) continue;
        candidates.push({
          rule: adminGroupRule,
          title: `Privileged Group Modification (${evt.targetGroup || 'Administrators'}) on ${evt.hostname}`,
          severity: adminGroupRule.severity,
          affectedAsset: evt.hostname,
          sourceIp: evt.srcIp,
          dedupKey: `RULE-WIN-005:${agent.id}:${evt.targetGroup || 'admins'}`,
          eventIds: [evt.securityEventId],
          eventCount: 1,
          detectionTimestamp: evt.timestamp,
          evidence: [
            { label: 'Group', value: evt.targetGroup || 'Administrators' },
            { label: 'Member Added', value: evt.targetUsername || evt.username || 'Unknown' },
            { label: 'Actor', value: evt.subjectUsername || 'Unknown' }
          ]
        });
      }
    }
  }

  // 6. Suspicious PowerShell execution (4688)
  const psRule = rulesByKey.get('suspicious_powershell_execution');
  if (psRule) {
    for (const evt of events) {
      if (evt.windowsEventId === 4688) {
        const proc = (evt.processName || '').toLowerCase();
        const cmd = (evt.commandLine || '').toLowerCase();
        if (
          (proc.includes('powershell') || proc.includes('pwsh')) &&
          SUSPICIOUS_POWERSHELL_PATTERNS.some((p) => cmd.includes(p))
        ) {
          candidates.push({
            rule: psRule,
            title: `Suspicious PowerShell Command Execution on ${evt.hostname}`,
            severity: psRule.severity,
            affectedAsset: evt.hostname,
            sourceIp: evt.srcIp,
            dedupKey: `RULE-WIN-006:${agent.id}:${evt.username || 'unknown'}`,
            eventIds: [evt.securityEventId],
            eventCount: 1,
            detectionTimestamp: evt.timestamp,
            evidence: [
              { label: 'Process', value: evt.processName || 'powershell.exe' },
              { label: 'Command Line', value: (evt.commandLine || '').slice(0, 220) },
              { label: 'Parent Process', value: evt.parentProcessName || 'Unknown' },
              { label: 'User', value: evt.username || 'Unknown' }
            ]
          });
        }
      }
    }
  }

  // 7. New Windows service installation (7045, 4697)
  const svcRule = rulesByKey.get('new_windows_service_installed');
  if (svcRule) {
    for (const evt of events) {
      if (evt.windowsEventId === 7045 || evt.windowsEventId === 4697) {
        candidates.push({
          rule: svcRule,
          title: `New Windows Service Installed: ${evt.serviceName || 'Unnamed Service'}`,
          severity: svcRule.severity,
          affectedAsset: evt.hostname,
          sourceIp: evt.srcIp,
          dedupKey: `RULE-WIN-007:${agent.id}:${evt.serviceName || evt.securityEventId}`,
          eventIds: [evt.securityEventId],
          eventCount: 1,
          detectionTimestamp: evt.timestamp,
          evidence: [
            { label: 'Service Name', value: evt.serviceName || 'Unknown' },
            { label: 'Command / Binary', value: (evt.commandLine || evt.processName || 'N/A').slice(0, 200) },
            { label: 'User', value: evt.username || 'SYSTEM' }
          ]
        });
      }
    }
  }

  // 8. Windows Security Event Log Cleared (1102)
  const logClearRule = rulesByKey.get('security_event_log_cleared');
  if (logClearRule) {
    for (const evt of events) {
      if (evt.windowsEventId === 1102) {
        candidates.push({
          rule: logClearRule,
          title: `Windows Security Audit Log Cleared on ${evt.hostname}`,
          severity: 'critical',
          affectedAsset: evt.hostname,
          sourceIp: evt.srcIp,
          dedupKey: `RULE-WIN-008:${agent.id}`,
          eventIds: [evt.securityEventId],
          eventCount: 1,
          detectionTimestamp: evt.timestamp,
          evidence: [
            { label: 'Host', value: evt.hostname },
            { label: 'Actor', value: evt.subjectUsername || evt.username || 'Unknown' },
            { label: 'Channel', value: evt.channel }
          ]
        });
      }
    }
  }

  // 9. Scheduled task creation (4698, 4702)
  const taskRule = rulesByKey.get('scheduled_task_creation');
  if (taskRule) {
    for (const evt of events) {
      if (evt.windowsEventId === 4698 || evt.windowsEventId === 4702) {
        candidates.push({
          rule: taskRule,
          title: `Scheduled Task ${evt.windowsEventId === 4698 ? 'Created' : 'Modified'}: ${
            evt.taskName || 'Unknown Task'
          }`,
          severity: taskRule.severity,
          affectedAsset: evt.hostname,
          sourceIp: evt.srcIp,
          dedupKey: `RULE-WIN-009:${agent.id}:${evt.taskName || evt.securityEventId}`,
          eventIds: [evt.securityEventId],
          eventCount: 1,
          detectionTimestamp: evt.timestamp,
          evidence: [
            { label: 'Task Name', value: evt.taskName || 'Unknown' },
            { label: 'Actor', value: evt.username || 'Unknown' },
            { label: 'Host', value: evt.hostname }
          ]
        });
      }
    }
  }

  // 10. Suspicious process execution (4688 LOLBins or suspicious parent-child chains)
  const procRule = rulesByKey.get('suspicious_process_execution');
  if (procRule) {
    for (const evt of events) {
      if (evt.windowsEventId !== 4688) continue;
      const proc = (evt.processName || '').toLowerCase();
      const parent = (evt.parentProcessName || '').toLowerCase();
      const cmd = (evt.commandLine || '').toLowerCase();

      const isLolbin = LOLBINS.some((bin) => proc.endsWith(bin) || proc.includes(`\\${bin}`));
      const isSuspiciousChain =
        SUSPICIOUS_PARENTS.some((p) => parent.includes(p)) &&
        (proc.includes('cmd.exe') || proc.includes('powershell') || proc.includes('wscript'));
      const isShadowDelete = cmd.includes('delete shadows') || cmd.includes('shadowcopy delete');

      // Avoid double firing if PowerShell rule already captured it
      if (!isLolbin && !isSuspiciousChain && !isShadowDelete) continue;

      candidates.push({
        rule: procRule,
        title: `Suspicious Process Execution (${evt.processName || 'unknown'}) on ${evt.hostname}`,
        severity: isShadowDelete ? 'critical' : procRule.severity,
        affectedAsset: evt.hostname,
        sourceIp: evt.srcIp,
        dedupKey: `RULE-WIN-010:${agent.id}:${proc.split('\\').pop() || 'proc'}`,
        eventIds: [evt.securityEventId],
        eventCount: 1,
        detectionTimestamp: evt.timestamp,
        evidence: [
          { label: 'Process', value: evt.processName || 'Unknown' },
          { label: 'Parent Process', value: evt.parentProcessName || 'Unknown' },
          { label: 'Command Line', value: (evt.commandLine || 'N/A').slice(0, 220) },
          { label: 'User', value: evt.username || 'Unknown' }
        ]
      });
    }
  }

  if (candidates.length === 0) {
    return { alertsTriggered: 0 };
  }

  let alertsTriggered = 0;

  for (const cand of candidates) {
    await pool.withTransaction(async (client) => {
      // Check for an active deduplicated alert within the rule's time window
      const existingRes = await client.query<{
        id: string;
        event_count: number;
      }>(
        `SELECT id, event_count
         FROM alerts
         WHERE dedup_key = $1
           AND status IN ('new', 'acknowledged', 'assigned', 'investigating')
           AND last_detected >= NOW() - ($2::int * INTERVAL '1 minute')
         ORDER BY last_detected DESC
         LIMIT 1`,
        [cand.dedupKey, Math.max(cand.rule.time_window_minutes, 15)]
      );

      let alertId: string;
      let isNew = false;

      if (existingRes.rows.length > 0) {
        alertId = existingRes.rows[0].id;
        await client.query(
          `UPDATE alerts
           SET last_detected = $1::timestamptz,
               event_count = GREATEST(event_count + $2, $3),
               severity = $4,
               evidence = $5::jsonb
           WHERE id = $6`,
          [
            cand.detectionTimestamp,
            cand.eventIds.length,
            cand.eventCount,
            cand.severity,
            JSON.stringify(cand.evidence),
            alertId
          ]
        );
      } else {
        isNew = true;
        alertId = `ALT-WIN-${Date.now().toString(36).toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;

        await client.query(
          `INSERT INTO alerts (
            id, title, detection_rule_id, detection_rule_name, severity,
            first_detected, last_detected, source_system, affected_asset,
            source_ip, agent_id, dedup_key, status, evidence, event_count
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6::timestamptz, $6::timestamptz, $7, $8,
            $9::inet, $10, $11, 'new', $12::jsonb, $13
          )`,
          [
            alertId,
            cand.title,
            cand.rule.id,
            cand.rule.name,
            cand.severity,
            cand.detectionTimestamp,
            `WinAgent · ${agent.hostname}`,
            cand.affectedAsset,
            cand.sourceIp,
            agent.id,
            cand.dedupKey,
            JSON.stringify(cand.evidence),
            cand.eventCount
          ]
        );
        alertsTriggered += 1;
      }

      if (cand.eventIds.length > 0) {
        await client.query(
          `UPDATE security_events SET related_alert_id = $1 WHERE id = ANY($2::varchar[])`,
          [alertId, cand.eventIds]
        );
      }

      await client.query(
        `UPDATE detection_rules SET last_triggered = NOW(), updated_at = NOW() WHERE id = $1`,
        [cand.rule.id]
      );

      sseHub.publish(isNew ? 'alert:created' : 'alert:updated', {
        id: alertId,
        title: cand.title,
        detectionRuleId: cand.rule.id,
        detectionRuleName: cand.rule.name,
        severity: cand.severity,
        firstDetected: cand.detectionTimestamp,
        lastDetected: cand.detectionTimestamp,
        sourceSystem: `WinAgent · ${agent.hostname}`,
        affectedAsset: cand.affectedAsset,
        sourceIp: cand.sourceIp,
        status: 'new',
        evidence: cand.evidence,
        eventCount: cand.eventCount
      });
    });
  }

  return { alertsTriggered };
}

export async function listDetectionRules() {
  const pool = await getPool();
  const res = await pool.query<DbDetectionRule>(
    `SELECT id, rule_key, name, description, severity, category, detection_logic,
            required_sources, enabled, last_triggered, time_window_minutes,
            threshold_count, investigation_guidance, config
     FROM detection_rules
     ORDER BY id ASC`
  );

  return res.rows.map((r) => ({
    id: r.id,
    ruleKey: r.rule_key,
    name: r.name,
    description: r.description,
    severity: r.severity,
    category: r.category,
    detectionLogic: r.detection_logic,
    requiredSources: r.required_sources,
    enabled: r.enabled,
    lastTriggered: r.last_triggered
      ? new Date(r.last_triggered).toISOString().replace('T', ' ').slice(0, 19)
      : 'Never',
    timeWindowMinutes: r.time_window_minutes,
    thresholdCount: r.threshold_count,
    investigationGuidance: r.investigation_guidance,
    config: r.config
  }));
}

export async function updateDetectionRule(
  ruleId: string,
  input: { enabled?: boolean; timeWindowMinutes?: number; thresholdCount?: number },
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const res = await pool.query<DbDetectionRule>(
    `UPDATE detection_rules
     SET enabled = COALESCE($1, enabled),
         time_window_minutes = COALESCE($2, time_window_minutes),
         threshold_count = COALESCE($3, threshold_count),
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, rule_key, name, description, severity, category, detection_logic,
               required_sources, enabled, last_triggered, time_window_minutes,
               threshold_count, investigation_guidance, config`,
    [
      input.enabled ?? null,
      input.timeWindowMinutes ?? null,
      input.thresholdCount ?? null,
      ruleId
    ]
  );

  if (res.rows.length === 0) {
    throw new AppError(404, 'Detection rule not found');
  }

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'Detection Rule Updated',
    target: `Rule: ${res.rows[0].name} (${ruleId})`,
    result: 'Success',
    details: JSON.stringify(input)
  });

  const r = res.rows[0];
  return {
    id: r.id,
    ruleKey: r.rule_key,
    name: r.name,
    description: r.description,
    severity: r.severity,
    category: r.category,
    detectionLogic: r.detection_logic,
    requiredSources: r.required_sources,
    enabled: r.enabled,
    lastTriggered: r.last_triggered
      ? new Date(r.last_triggered).toISOString().replace('T', ' ').slice(0, 19)
      : 'Never',
    timeWindowMinutes: r.time_window_minutes,
    thresholdCount: r.threshold_count,
    investigationGuidance: r.investigation_guidance
  };
}
