import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  addIncidentNote,
  addIncidentResponseAction,
  assignIncident,
  closeIncidentWithResolution,
  getIncidentById,
  listIncidents,
  updateIncidentSeverity,
  updateIncidentStatus
} from './incidents.service.js';

const router = Router();

const RESPONDER_ROLES = [
  'Security Administrator',
  'SOC Analyst',
  'Incident Responder'
] as const;

const StatusSchema = z.object({
  status: z.enum(['new', 'investigating', 'resolved', 'closed']),
  note: z.string().max(2000).optional()
});

const SeveritySchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  reason: z.string().min(2).max(2000)
});

const AssignSchema = z.object({
  analystName: z.string().min(1).max(255)
});

const NoteSchema = z.object({
  text: z.string().min(1).max(5000)
});

const ActionSchema = z.object({
  actionName: z.string().min(2).max(255),
  targetAsset: z.string().min(1).max(255),
  details: z.string().min(2).max(2000)
});

const CloseSchema = z.object({
  rootCause: z.string().min(2).max(2000),
  resolutionSummary: z.string().min(2).max(2000),
  preventativeAction: z.string().min(2).max(2000)
});

router.get('/incidents', requireAuth, async (_req, res, next) => {
  try {
    const incidents = await listIncidents();
    res.json({ incidents });
  } catch (err) {
    next(err);
  }
});

router.get('/incidents/:id', requireAuth, async (req, res, next) => {
  try {
    const incident = await getIncidentById(String(req.params.id));
    res.json({ incident });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/incidents/:id/status',
  requireAuth,
  requireRole(...RESPONDER_ROLES),
  validateBody(StatusSchema),
  async (req, res, next) => {
    try {
      const incident = await updateIncidentStatus(
        String(req.params.id),
        req.body.status,
        req.body.note,
        req.user!
      );
      res.json({ incident });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/incidents/:id/severity',
  requireAuth,
  requireRole(...RESPONDER_ROLES),
  validateBody(SeveritySchema),
  async (req, res, next) => {
    try {
      const incident = await updateIncidentSeverity(
        String(req.params.id),
        req.body.severity,
        req.body.reason,
        req.user!
      );
      res.json({ incident });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/incidents/:id/assign',
  requireAuth,
  requireRole(...RESPONDER_ROLES),
  validateBody(AssignSchema),
  async (req, res, next) => {
    try {
      const incident = await assignIncident(
        String(req.params.id),
        req.body.analystName,
        req.user!
      );
      res.json({ incident });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/incidents/:id/notes',
  requireAuth,
  requireRole(...RESPONDER_ROLES),
  validateBody(NoteSchema),
  async (req, res, next) => {
    try {
      const incident = await addIncidentNote(String(req.params.id), req.body.text, req.user!);
      res.json({ incident });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/incidents/:id/actions',
  requireAuth,
  requireRole(...RESPONDER_ROLES),
  validateBody(ActionSchema),
  async (req, res, next) => {
    try {
      const incident = await addIncidentResponseAction(
        String(req.params.id),
        req.body,
        req.user!
      );
      res.json({ incident });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/incidents/:id/close',
  requireAuth,
  requireRole(...RESPONDER_ROLES),
  validateBody(CloseSchema),
  async (req, res, next) => {
    try {
      const incident = await closeIncidentWithResolution(
        String(req.params.id),
        req.body,
        req.user!
      );
      res.json({ incident });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
