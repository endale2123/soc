import { Router } from 'express';
import { z } from 'zod';
import { requireAgentAuth } from '../../middleware/auth.js';
import { agentIngestRateLimiter } from '../../middleware/rateLimit.js';
import { validateBody } from '../../middleware/validate.js';
import { processHeartbeat } from './heartbeat.service.js';

const router = Router();

const HeartbeatSchema = z.object({
  agentVersion: z.string().max(64).optional(),
  hostname: z.string().max(255).optional(),
  ipAddress: z.string().max(64).optional(),
  cpuUsagePct: z.number().min(0).max(100).optional(),
  memoryUsagePct: z.number().min(0).max(100).optional(),
  diskFreeMb: z.number().nonnegative().optional(),
  queueDepth: z.number().int().nonnegative().optional(),
  bufferOverflow: z.boolean().optional(),
  ingestionErrors: z.number().int().nonnegative().optional(),
  errorMessage: z.string().max(1000).optional(),
  reportedAt: z.string().optional()
});

router.post(
  '/agents/heartbeat',
  agentIngestRateLimiter,
  requireAgentAuth,
  validateBody(HeartbeatSchema),
  async (req, res, next) => {
    try {
      const result = await processHeartbeat(req.agent!, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
