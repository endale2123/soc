import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load server/.env first, then fallback to workspace root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function toInt(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const parsed = Number.parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(val: string | undefined, fallback: boolean): boolean {
  if (val === undefined) return fallback;
  return val.toLowerCase() === 'true' || val === '1';
}

const hasExternalPostgresConfig = Boolean(
  process.env.DATABASE_URL || process.env.PGHOST || process.env.PGDATABASE
);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  pgHost: process.env.PGHOST || 'localhost',
  pgPort: toInt(process.env.PGPORT, 5432),
  pgUser: process.env.PGUSER || 'postgres',
  pgPassword: process.env.PGPASSWORD || '',
  pgDatabase: process.env.PGDATABASE || 'mor_soc',
  pgSsl: toBool(process.env.PGSSL, false),
  usePglite:
    process.env.USE_PGLITE !== undefined
      ? toBool(process.env.USE_PGLITE, false)
      : !hasExternalPostgresConfig && process.env.NODE_ENV !== 'production',
  pgliteDataDir: process.env.PGLITE_DATA_DIR || path.resolve(__dirname, '../../.pglite-data'),

  // Auth & Session
  sessionSecret: process.env.SESSION_SECRET || 'mor-soc-dev-session-secret-change-in-production',
  sessionTtlHours: toInt(process.env.SESSION_TTL_HOURS, 12),
  cookieSecure: toBool(process.env.COOKIE_SECURE, false),
  sessionCookieName: 'mor_soc_session',

  // Agent Monitoring & Retention
  defaultHeartbeatIntervalSec: toInt(process.env.DEFAULT_HEARTBEAT_INTERVAL_SEC, 30),
  defaultOfflineThresholdSec: toInt(process.env.DEFAULT_OFFLINE_THRESHOLD_SEC, 120),
  eventRetentionDays: toInt(process.env.EVENT_RETENTION_DAYS, 180),

  // Rate Limits
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
  authRateLimitMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  agentIngestRateLimitMax: toInt(process.env.AGENT_INGEST_RATE_LIMIT_MAX, 600),

  // Bootstrap Admin (seed only)
  bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL || 'endale.a@revenue.gov.et',
  bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'MorSoc@Admin2026!'
};
