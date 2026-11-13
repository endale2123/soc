import { Router } from 'express';
import { z } from 'zod';
import { requireAgentAuth, requireAuth, requireRole } from '../../middleware/auth.js';
import { agentIngestRateLimiter } from '../../middleware/rateLimit.js';
import { validateBody } from '../../middleware/validate.js';
import {
  createEnrollmentToken,
  deactivateAgent,
  DEFAULT_MONITORED_WINDOWS_EVENT_IDS,
  DEFAULT_WINDOWS_CHANNELS,
  enrollAgent,
  getAgentConfiguration,
  listAgents,
  listEnrollmentTokens,
  revokeEnrollmentToken,
  updateAgentConfiguration
} from './agents.service.js';

const router = Router();

const CreateTokenSchema = z.object({
  label: z.string().min(2).max(255),
  expiresInHours: z.number().int().min(1).max(720).optional(),
  maxUses: z.number().int().min(1).max(100).optional()
});

const EnrollAgentSchema = z.object({
  enrollmentToken: z.string().min(10),
  hostname: z.string().min(1).max(255),
  fqdn: z.string().max(255).optional(),
  ipAddress: z.string().max(64).optional(),
  macAddress: z.string().max(64).optional(),
  os: z.string().max(255).optional(),
  osVersion: z.string().max(128).optional(),
  osBuild: z.string().max(64).optional(),
  domainName: z.string().max(255).optional(),
  workgroup: z.string().max(255).optional(),
  architecture: z.string().max(32).optional(),
  agentVersion: z.string().max(64).optional(),
  cpuModel: z.string().max(255).optional(),
  cpuCores: z.number().int().positive().optional(),
  totalMemoryMb: z.number().int().positive().optional(),
  diskTotalGb: z.number().positive().optional(),
  hardwareVendor: z.string().max(255).optional(),
  hardwareModel: z.string().max(255).optional(),
  serialNumber: z.string().max(128).optional(),
  ipAddresses: z.array(z.string()).optional(),
  macAddresses: z.array(z.string()).optional()
});

const UpdateConfigSchema = z.object({
  heartbeatIntervalSec: z.number().int().min(10).max(3600).optional(),
  offlineThresholdSec: z.number().int().min(30).max(7200).optional(),
  batchSize: z.number().int().min(1).max(500).optional(),
  flushIntervalSec: z.number().int().min(1).max(300).optional(),
  enabledChannels: z.array(z.string().min(1)).min(1).optional(),
  monitoredEventIds: z.array(z.number().int().positive()).min(1).optional()
});

// Create enrollment token (Security Administrator only)
router.post(
  '/enrollment-tokens',
  requireAuth,
  requireRole('Security Administrator'),
  validateBody(CreateTokenSchema),
  async (req, res, next) => {
    try {
      const token = await createEnrollmentToken(req.body, req.user!);
      res.status(201).json(token);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/enrollment-tokens',
  requireAuth,
  requireRole('Security Administrator'),
  async (_req, res, next) => {
    try {
      const tokens = await listEnrollmentTokens();
      res.json({ tokens });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/enrollment-tokens/:id/revoke',
  requireAuth,
  requireRole('Security Administrator'),
  async (req, res, next) => {
    try {
      const result = await revokeEnrollmentToken(String(req.params.id), req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Public agent enrollment endpoint protected by one-time enrollment token + rate limiter
router.post(
  '/agents/enroll',
  agentIngestRateLimiter,
  validateBody(EnrollAgentSchema),
  async (req, res, next) => {
    try {
      const enrolled = await enrollAgent(req.body);
      res.status(201).json(enrolled);
    } catch (err) {
      next(err);
    }
  }
);

// Get configuration (either authenticated agent itself or Security Admin via ?agentId=)
router.get('/agents/configuration', async (req, res, next) => {
  try {
    const hasAgentHeader =
      Boolean(req.headers['x-agent-key']) ||
      (typeof req.headers.authorization === 'string' &&
        req.headers.authorization.includes('mor_agt_'));

    if (hasAgentHeader) {
      await new Promise<void>((resolve, reject) => {
        requireAgentAuth(req, res, (err?: unknown) => {
          if (err) reject(err);
          else if (res.headersSent) reject(new Error('__HANDLED__'));
          else resolve();
        });
      });
      const config = await getAgentConfiguration(req.agent!.id);
      res.json(config);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      requireAuth(req, res, (err?: unknown) => {
        if (err) reject(err);
        else if (res.headersSent) reject(new Error('__HANDLED__'));
        else resolve();
      });
    });

    const targetAgentId = typeof req.query.agentId === 'string' ? req.query.agentId : '';
    if (!targetAgentId) {
      res.json({
        defaultConfiguration: {
          heartbeatIntervalSec: 30,
          offlineThresholdSec: 120,
          batchSize: 50,
          flushIntervalSec: 10,
          enabledChannels: DEFAULT_WINDOWS_CHANNELS,
          monitoredEventIds: DEFAULT_MONITORED_WINDOWS_EVENT_IDS
        }
      });
      return;
    }

    const config = await getAgentConfiguration(targetAgentId);
    res.json(config);
  } catch (err) {
    if (err instanceof Error && err.message === '__HANDLED__') return;
    next(err);
  }
});

router.put(
  '/agents/:id/configuration',
  requireAuth,
  requireRole('Security Administrator'),
  validateBody(UpdateConfigSchema),
  async (req, res, next) => {
    try {
      const updated = await updateAgentConfiguration(String(req.params.id), req.body, req.user!);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/agents/:id/deactivate',
  requireAuth,
  requireRole('Security Administrator'),
  async (req, res, next) => {
    try {
      const result = await deactivateAgent(String(req.params.id), req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/agents', requireAuth, async (_req, res, next) => {
  try {
    const agents = await listAgents();
    res.json({ agents });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/agents/installer-info',
  requireAuth,
  requireRole('Security Administrator'),
  async (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:4000';
    const serverUrl = `${protocol}://${host}`;

    res.json({
      serverUrl,
      supportedWindowsEventIds: DEFAULT_MONITORED_WINDOWS_EVENT_IDS,
      defaultChannels: DEFAULT_WINDOWS_CHANNELS,
      agentBinaryAvailable: false,
      agentPackageStatus: 'Phase 3 .NET Windows Service Agent (API-ready)',
      powershellInstallCommand: `$env:MOR_SOC_URL="${serverUrl}"; $env:MOR_ENROLLMENT_TOKEN="<PASTE_ONE_TIME_TOKEN>"; .\\MoR.SocAgent.exe --enroll --install-service`,
      enrollApiSample: {
        endpoint: `${serverUrl}/api/agents/enroll`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          enrollmentToken: '<PASTE_ONE_TIME_TOKEN>',
          hostname: 'WS-FINANCE-01.revenue.gov.et',
          ipAddress: '10.100.40.25',
          os: 'Windows 11 Enterprise',
          osVersion: '23H2',
          osBuild: '22631.4169',
          domainName: 'REVENUE.GOV.ET',
          agentVersion: '1.0.0'
        }
      }
    });
  }
);

export default router;
