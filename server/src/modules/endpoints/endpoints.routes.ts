import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getAgentStatistics,
  getEndpointAlerts,
  getEndpointDetails,
  getEndpointEvents,
  getEndpointIncidents,
  listEndpoints
} from './endpoints.service.js';

const router = Router();

router.get('/endpoints', requireAuth, async (req, res, next) => {
  try {
    const result = await listEndpoints({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      os: typeof req.query.os === 'string' ? req.query.os : undefined,
      sortBy: typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : undefined,
      sortDir: req.query.sortDir === 'asc' ? 'asc' : 'desc',
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/endpoints/:id', requireAuth, async (req, res, next) => {
  try {
    const details = await getEndpointDetails(String(req.params.id));
    res.json(details);
  } catch (err) {
    next(err);
  }
});

router.get('/endpoints/:id/events', requireAuth, async (req, res, next) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 25;
    const events = await getEndpointEvents(String(req.params.id), page, pageSize);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.get('/endpoints/:id/alerts', requireAuth, async (req, res, next) => {
  try {
    const alerts = await getEndpointAlerts(String(req.params.id));
    res.json({ items: alerts });
  } catch (err) {
    next(err);
  }
});

router.get('/endpoints/:id/incidents', requireAuth, async (req, res, next) => {
  try {
    const incidents = await getEndpointIncidents(String(req.params.id));
    res.json({ items: incidents });
  } catch (err) {
    next(err);
  }
});

router.get('/agent-statistics', requireAuth, async (_req, res, next) => {
  try {
    const stats = await getAgentStatistics();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
