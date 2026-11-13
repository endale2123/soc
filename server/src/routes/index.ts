import crypto from 'crypto';
import { Router } from 'express';
import { getPool } from '../database/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { sseHub } from '../services/sseHub.js';
import alertsRoutes from '../modules/alerts/alerts.routes.js';
import agentsRoutes from '../modules/agents/agents.routes.js';
import authRoutes from '../modules/authentication/auth.routes.js';
import detectionRoutes from '../modules/detection/detection.routes.js';
import endpointsRoutes from '../modules/endpoints/endpoints.routes.js';
import eventsRoutes from '../modules/events/events.routes.js';
import heartbeatRoutes from '../modules/heartbeat/heartbeat.routes.js';
import incidentsRoutes from '../modules/incidents/incidents.routes.js';
import ingestionRoutes from '../modules/ingestion/ingestion.routes.js';
import statisticsRoutes from '../modules/statistics/statistics.routes.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      engine: pool.isPglite() ? 'pglite' : 'postgresql',
      sseClients: sseHub.getClientCount(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'Database unreachable'
    });
  }
});

router.get('/stream', requireAuth, (req, res) => {
  const clientId = crypto.randomUUID();
  sseHub.addClient(clientId, req.user!.id, req.user!.role, res);

  req.on('close', () => {
    sseHub.removeClient(clientId);
  });
});

router.use(authRoutes);
router.use(agentsRoutes);
router.use(heartbeatRoutes);
router.use(ingestionRoutes);
router.use(endpointsRoutes);
router.use(eventsRoutes);
router.use(detectionRoutes);
router.use(alertsRoutes);
router.use(incidentsRoutes);
router.use(statisticsRoutes);

export default router;
