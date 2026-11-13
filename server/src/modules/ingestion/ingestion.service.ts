import { getPool } from '../../database/pool.js';
import { AuthenticatedAgent } from '../../middleware/auth.js';
import { sseHub } from '../../services/sseHub.js';
import { logger } from '../../utils/logger.js';
import { evaluateDetectionRulesForEvents } from '../detection/detection.service.js';
import {
  NormalizedWindowsEvent,
  normalizeWindowsEvent,
  RawWindowsEventInput
} from './windowsNormalizer.js';

export interface BatchIngestResult {
  received: number;
  inserted: number;
  deduplicated: number;
  failed: number;
  alertsTriggered: number;
  insertedEventIds: string[];
  errors: { index: number; message: string }[];
}

export async function ingestWindowsEventBatch(
  agent: AuthenticatedAgent,
  rawEvents: RawWindowsEventInput[]
): Promise<BatchIngestResult> {
  const pool = await getPool();
  const normalizedList: NormalizedWindowsEvent[] = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < rawEvents.length; i++) {
    try {
      const normalized = normalizeWindowsEvent(rawEvents[i], {
        id: agent.id,
        hostname: agent.hostname,
        ipAddress: agent.ipAddress
      });
      normalizedList.push(normalized);
    } catch (err) {
      errors.push({
        index: i,
        message: err instanceof Error ? err.message : 'Normalization failed'
      });
    }
  }

  let insertedEvents: NormalizedWindowsEvent[] = [];
  let deduplicatedCount = 0;

  if (normalizedList.length > 0) {
    await pool.withTransaction(async (client) => {
      for (const evt of normalizedList) {
        const insertRes = await client.query<{ id: string }>(
          `INSERT INTO security_events (
            id, timestamp, source_id, source_name, source_type, hostname, username,
            src_ip, dest_ip, category, severity, original_message, normalized_fields,
            agent_id, dedup_hash, windows_event_id, parsing_status
          ) VALUES (
            $1, $2::timestamptz, $3, $4, $5, $6, $7,
            $8::inet, $9::inet, $10, $11, $12, $13::jsonb,
            $14, $15, $16, 'parsed'
          )
          ON CONFLICT (dedup_hash) WHERE dedup_hash IS NOT NULL DO NOTHING
          RETURNING id`,
          [
            evt.securityEventId,
            evt.timestamp,
            agent.logSourceId,
            `WinAgent · ${agent.hostname}`,
            'Windows Endpoint Agent',
            evt.hostname,
            evt.username,
            evt.srcIp,
            evt.destIp,
            evt.category,
            evt.severity,
            evt.originalMessage,
            JSON.stringify(evt.normalizedFields),
            agent.id,
            evt.dedupHash,
            evt.windowsEventId
          ]
        );

        if (insertRes.rows.length === 0) {
          deduplicatedCount += 1;
          continue;
        }

        await client.query(
          `INSERT INTO windows_event_details (
            security_event_id, agent_id, windows_event_id, record_id, dedup_hash,
            channel, provider_name, computer_name, domain_name,
            target_username, subject_username, logon_type,
            process_name, process_id, parent_process_name, parent_process_id,
            command_line, service_name, task_name, target_group,
            status_code, sub_status, raw_xml, structured_data, event_timestamp
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12,
            $13, $14, $15, $16,
            $17, $18, $19, $20,
            $21, $22, $23, $24::jsonb, $25::timestamptz
          )
          ON CONFLICT (dedup_hash) DO NOTHING`,
          [
            evt.securityEventId,
            agent.id,
            evt.windowsEventId,
            evt.recordId,
            evt.dedupHash,
            evt.channel,
            evt.providerName,
            evt.hostname,
            evt.domain,
            evt.targetUsername,
            evt.subjectUsername,
            evt.logonType,
            evt.processName,
            evt.processId,
            evt.parentProcessName,
            evt.parentProcessId,
            evt.commandLine,
            evt.serviceName,
            evt.taskName,
            evt.targetGroup,
            evt.statusCode,
            evt.subStatus,
            evt.rawXml,
            JSON.stringify(evt.structuredData),
            evt.timestamp
          ]
        );

        insertedEvents.push(evt);
      }

      if (insertedEvents.length > 0) {
        await client.query(
          `UPDATE endpoint_agents
           SET total_events_collected = total_events_collected + $1,
               last_event_at = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [insertedEvents.length, agent.id]
        );

        if (agent.logSourceId) {
          await client.query(
            `UPDATE log_sources
             SET total_events_processed = total_events_processed + $1,
                 last_event_received = NOW(),
                 events_per_minute = GREATEST(events_per_minute, $1)
             WHERE id = $2`,
            [insertedEvents.length, agent.logSourceId]
          );
        }
      }

      // Upsert hourly ingestion stats
      const bucketHour = new Date();
      bucketHour.setUTCMinutes(0, 0, 0);

      await client.query(
        `INSERT INTO ingestion_stats (
          agent_id, bucket_hour, events_received, events_inserted, events_deduplicated, events_failed, last_event_at
        ) VALUES ($1, $2::timestamptz, $3, $4, $5, $6, NOW())
        ON CONFLICT (agent_id, bucket_hour) DO UPDATE SET
          events_received = ingestion_stats.events_received + EXCLUDED.events_received,
          events_inserted = ingestion_stats.events_inserted + EXCLUDED.events_inserted,
          events_deduplicated = ingestion_stats.events_deduplicated + EXCLUDED.events_deduplicated,
          events_failed = ingestion_stats.events_failed + EXCLUDED.events_failed,
          last_event_at = NOW()`,
        [
          agent.id,
          bucketHour.toISOString(),
          rawEvents.length,
          insertedEvents.length,
          deduplicatedCount,
          errors.length
        ]
      );
    });
  }

  let alertsTriggered = 0;
  if (insertedEvents.length > 0) {
    try {
      const detectionRes = await evaluateDetectionRulesForEvents(agent, insertedEvents);
      alertsTriggered = detectionRes.alertsTriggered;

      if (alertsTriggered > 0) {
        const bucketHour = new Date();
        bucketHour.setUTCMinutes(0, 0, 0);
        await pool.query(
          `UPDATE ingestion_stats
           SET alerts_triggered = alerts_triggered + $1
           WHERE agent_id = $2 AND bucket_hour = $3::timestamptz`,
          [alertsTriggered, agent.id, bucketHour.toISOString()]
        );
      }
    } catch (err) {
      logger.error('Detection evaluation error after ingestion', {
        agentId: agent.id,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    for (const evt of insertedEvents.slice(0, 20)) {
      sseHub.publish('event:created', {
        id: evt.securityEventId,
        timestamp: evt.timestamp,
        sourceName: `WinAgent · ${agent.hostname}`,
        sourceType: 'Windows Endpoint Agent',
        hostname: evt.hostname,
        username: evt.username,
        srcIp: evt.srcIp,
        destIp: evt.destIp,
        category: evt.category,
        severity: evt.severity,
        originalMessage: evt.originalMessage,
        windowsEventId: evt.windowsEventId,
        agentId: agent.id
      });
    }

    sseHub.publish('stats:updated', {
      agentId: agent.id,
      inserted: insertedEvents.length,
      alertsTriggered,
      timestamp: new Date().toISOString()
    });
  }

  return {
    received: rawEvents.length,
    inserted: insertedEvents.length,
    deduplicated: deduplicatedCount,
    failed: errors.length,
    alertsTriggered,
    insertedEventIds: insertedEvents.map((e) => e.securityEventId),
    errors
  };
}
