import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getWindowsEventDetail,
  listSecurityEvents,
  listWindowsEvents
} from './events.service.js';

const router = Router();

router.get('/events', requireAuth, async (req, res, next) => {
  try {
    const result = await listSecurityEvents({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      source: typeof req.query.source === 'string' ? req.query.source : undefined,
      hostname: typeof req.query.hostname === 'string' ? req.query.hostname : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/windows-events', requireAuth, async (req, res, next) => {
  try {
    const result = await listWindowsEvents({
      eventId: req.query.eventId ? Number(req.query.eventId) : undefined,
      hostname: typeof req.query.hostname === 'string' ? req.query.hostname : undefined,
      username: typeof req.query.username === 'string' ? req.query.username : undefined,
      severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
      channel: typeof req.query.channel === 'string' ? req.query.channel : undefined,
      srcIp: typeof req.query.srcIp === 'string' ? req.query.srcIp : undefined,
      startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/windows-events/:id', requireAuth, async (req, res, next) => {
  try {
    // Authorized analysts, responders, admins, and auditors can inspect raw Windows XML
    const canInspectXml = [
      'Security Administrator',
      'SOC Analyst',
      'Incident Responder',
      'Auditor'
    ].includes(req.user!.role);

    const detail = await getWindowsEventDetail(String(req.params.id), canInspectXml);
    res.json({ event: detail });
  } catch (err) {
    next(err);
  }
});

export default router;
