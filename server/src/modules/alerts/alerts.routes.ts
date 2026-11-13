import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  acknowledgeAlert,
  assignAlert,
  escalateAlertToIncident,
  investigateAlert,
  linkAlertToIncident,
  listAlerts,
  markAlertFalsePositive,
  resolveAlert
} from './alerts.service.js';

const router = Router();

const AssignSchema = z.object({ analyst: z.string().min(1).max(255) });
const FalsePositiveSchema = z.object({ reason: z.string().min(3).max(2000) });
const ResolveSchema = z.object({ note: z.string().min(2).max(2000).optional() });
const LinkSchema = z.object({ incidentId: z.string().min(1).max(64) });

const TRIAGE_ROLES = [
  'Security Administrator',
  'SOC Analyst',
  'Incident Responder'
] as const;

router.get('/alerts', requireAuth, async (req, res, next) => {
  try {
    const alerts = await listAlerts({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined
    });
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/alerts/:id/acknowledge',
  requireAuth,
  requireRole(...TRIAGE_ROLES),
  async (req, res, next) => {
    try {
      const alert = await acknowledgeAlert(String(req.params.id), req.user!);
      res.json({ alert });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/alerts/:id/assign',
  requireAuth,
  requireRole(...TRIAGE_ROLES),
  validateBody(AssignSchema),
  async (req, res, next) => {
    try {
      const alert = await assignAlert(String(req.params.id), req.body.analyst, req.user!);
      res.json({ alert });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/alerts/:id/investigate',
  requireAuth,
  requireRole(...TRIAGE_ROLES),
  async (req, res, next) => {
    try {
      const alert = await investigateAlert(String(req.params.id), req.user!);
      res.json({ alert });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/alerts/:id/false-positive',
  requireAuth,
  requireRole(...TRIAGE_ROLES),
  validateBody(FalsePositiveSchema),
  async (req, res, next) => {
    try {
      const alert = await markAlertFalsePositive(String(req.params.id), req.body.reason, req.user!);
      res.json({ alert });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/alerts/:id/resolve',
  requireAuth,
  requireRole(...TRIAGE_ROLES),
  validateBody(ResolveSchema),
  async (req, res, next) => {
    try {
      const alert = await resolveAlert(
        String(req.params.id),
        req.body.note || 'Alert resolved by analyst',
        req.user!
      );
      res.json({ alert });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/alerts/:id/escalate',
  requireAuth,
  requireRole(...TRIAGE_ROLES),
  async (req, res, next) => {
    try {
      const result = await escalateAlertToIncident(String(req.params.id), req.user!);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/alerts/:id/link',
  requireAuth,
  requireRole(...TRIAGE_ROLES),
  validateBody(LinkSchema),
  async (req, res, next) => {
    try {
      const alert = await linkAlertToIncident(String(req.params.id), req.body.incidentId, req.user!);
      res.json({ alert });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
