const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'enrollmentToken',
  'agentSecret',
  'apiKey',
  'api_key',
  'authorization',
  'x-agent-key',
  'cookie'
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k) || SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'test') return;
    console.log(
      JSON.stringify({
        level: 'info',
        ts: new Date().toISOString(),
        message,
        ...(meta ? (redact(meta) as Record<string, unknown>) : {})
      })
    );
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'test') return;
    console.warn(
      JSON.stringify({
        level: 'warn',
        ts: new Date().toISOString(),
        message,
        ...(meta ? (redact(meta) as Record<string, unknown>) : {})
      })
    );
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(
      JSON.stringify({
        level: 'error',
        ts: new Date().toISOString(),
        message,
        ...(meta ? (redact(meta) as Record<string, unknown>) : {})
      })
    );
  }
};
