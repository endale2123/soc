import { env } from './config/env.js';
import { runMigrations } from './database/migrate.js';
import { closePool } from './database/pool.js';
import { seedDefaults } from './database/seed.js';
import { refreshStaleAgents } from './modules/heartbeat/heartbeat.service.js';
import { sseHub } from './services/sseHub.js';
import { logger } from './utils/logger.js';
import { createApp } from './app.js';

async function bootstrap() {
  await runMigrations();
  await seedDefaults();

  const app = createApp();
  const server = app.listen(env.port, '0.0.0.0', () => {
    logger.info('MoR SOC Backend Server started', {
      port: env.port,
      nodeEnv: env.nodeEnv,
      usePglite: env.usePglite
    });
  });

  // Periodic background sweep for missed agent heartbeats
  const staleCheckTimer = setInterval(() => {
    refreshStaleAgents().catch((err) => {
      logger.error('Failed to sweep stale agents', {
        error: err instanceof Error ? err.message : 'Unknown'
      });
    });
  }, 30_000);

  const shutdown = async (signal: string) => {
    logger.info('Shutting down MoR SOC Backend', { signal });
    clearInterval(staleCheckTimer);
    sseHub.closeAll();
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
