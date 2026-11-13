import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = env.nodeEnv === 'test';

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: isTest ? 10_000 : env.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again shortly.' }
});

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: isTest ? 1_000 : env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait before trying again.' }
});

export const agentIngestRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: isTest ? 10_000 : env.agentIngestRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Agent ingestion rate limit exceeded.' }
});
