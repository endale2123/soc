import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { listDetectionRules, updateDetectionRule } from './detection.service.js';

const router = Router();

const UpdateRuleSchema = z.object({
  enabled: z.boolean().optional(),
  timeWindowMinutes: z.number().int().min(1).max(1440).optional(),
  thresholdCount: z.number().int().min(1).max(1000).optional()
});

router.get('/detection-rules', requireAuth, async (_req, res, next) => {
  try {
    const rules = await listDetectionRules();
    res.json({ rules });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/detection-rules/:id',
  requireAuth,
  requireRole('Security Administrator'),
  validateBody(UpdateRuleSchema),
  async (req, res, next) => {
    try {
      const rule = await updateDetectionRule(String(req.params.id), req.body, req.user!);
      res.json({ rule });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
