import { Router } from 'express';
import { z } from 'zod';
import { requireAgentAuth } from '../../middleware/auth.js';
import { agentIngestRateLimiter } from '../../middleware/rateLimit.js';
import { validateBody } from '../../middleware/validate.js';
import { ingestWindowsEventBatch } from './ingestion.service.js';

const router = Router();

const RawWindowsEventSchema = z.object({
  eventId: z.number().int().positive(),
  recordId: z.union([z.number(), z.string()]).nullable().optional(),
  channel: z.string().max(128).optional(),
  providerName: z.string().max(255).optional(),
  computerName: z.string().max(255).optional(),
  timestamp: z.string().optional(),
  username: z.string().max(255).optional(),
  targetUsername: z.string().max(255).optional(),
  subjectUsername: z.string().max(255).optional(),
  domain: z.string().max(255).optional(),
  sourceIp: z.string().max(128).optional(),
  destinationIp: z.string().max(128).optional(),
  logonType: z.union([z.number(), z.string()]).nullable().optional(),
  processName: z.string().max(1024).optional(),
  processId: z.union([z.number(), z.string()]).nullable().optional(),
  parentProcess: z.string().max(1024).optional(),
  parentProcessId: z.union([z.number(), z.string()]).nullable().optional(),
  commandLine: z.string().max(8192).optional(),
  serviceName: z.string().max(255).optional(),
  taskName: z.string().max(255).optional(),
  targetGroup: z.string().max(255).optional(),
  statusCode: z.string().max(64).optional(),
  subStatus: z.string().max(64).optional(),
  message: z.string().max(16384).optional(),
  rawXml: z.string().max(65536).optional(),
  additionalFields: z.record(z.unknown()).optional()
});

const IngestBatchSchema = z.object({
  events: z.array(RawWindowsEventSchema).min(1).max(500)
});

router.post(
  '/agents/events',
  agentIngestRateLimiter,
  requireAgentAuth,
  validateBody(IngestBatchSchema),
  async (req, res, next) => {
    try {
      const result = await ingestWindowsEventBatch(req.agent!, req.body.events);
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
