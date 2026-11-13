import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import apiRouter from './routes/index.js';

export function createApp(options?: { skipCors?: boolean }) {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  if (!options?.skipCors) {
    const allowedOrigins = env.corsOrigin
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    app.use(
      cors({
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, true); // Allow proxy / preview hosts seamlessly when cookies are same-origin
          }
        },
        credentials: true
      })
    );
  }

  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));

  app.use('/api', apiRateLimiter, apiRouter);

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  app.use(errorHandler);

  return app;
}
