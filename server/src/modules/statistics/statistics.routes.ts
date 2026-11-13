import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  getDashboardStatistics,
  listAuditLogs,
  listLogSources,
  toggleLogSource
} from './statistics.service.js';

const router = Router();

router.get('/statistics/dashboard', requireAuth, async (req, res, next) => {
  try {
    const timeRange = typeof req.query.timeRange === 'string' ? req.query.timeRange : undefined;
    const stats = await getDashboardStatistics(timeRange);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/audit-logs',
  requireAuth,
  requireRole('Security Administrator', 'Auditor'),
  async (req, res, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 200;
      const auditLogs = await listAuditLogs(limit);
      res.json({ auditLogs });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/log-sources', requireAuth, async (_req, res, next) => {
  try {
    const logSources = await listLogSources();
    res.json({ logSources });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/log-sources/:id/toggle',
  requireAuth,
  requireRole('Security Administrator'),
  async (req, res, next) => {
    try {
      const updated = await toggleLogSource(String(req.params.id), req.user!);
      res.json({ logSource: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
