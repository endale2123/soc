import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/src/app.js';
import { runMigrations } from './server/src/database/migrate.js';
import { closePool } from './server/src/database/pool.js';
import { seedDefaults } from './server/src/database/seed.js';
import { refreshStaleAgents } from './server/src/modules/heartbeat/heartbeat.service.js';
import { sseHub } from './server/src/services/sseHub.js';
import { logger } from './server/src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function startUnifiedServer() {
  await runMigrations();
  await seedDefaults();

  const app = createApp();

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Frontend build not found. Run npm run build.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info('MoR SOC Full-Stack Server listening', {
      port: PORT,
      mode: isProduction ? 'production' : 'development'
    });
  });

  const staleTimer = setInterval(() => {
    refreshStaleAgents().catch((err) => {
      logger.error('Failed to sweep stale agents', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    });
  }, 30_000);

  const shutdown = async (signal: string) => {
    logger.info('Shutting down unified SOC server', { signal });
    clearInterval(staleTimer);
    sseHub.closeAll();
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startUnifiedServer().catch((err) => {
  console.error('Failed to start MoR SOC server:', err);
  process.exit(1);
});
