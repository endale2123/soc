import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { getPool } from '../database/pool.js';
import { hashToken } from '../utils/crypto.js';
import { recordAuditLog } from '../services/auditService.js';

export type SocUserRole =
  | 'Security Administrator'
  | 'SOC Analyst'
  | 'Incident Responder'
  | 'Auditor'
  | 'Management / Read-only Viewer';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: SocUserRole;
  department: string;
  sessionId: string;
}

export interface AuthenticatedAgent {
  id: string;
  hostname: string;
  status: string;
  agentVersion: string;
  ipAddress: string | null;
  logSourceId: string | null;
  assetId: string | null;
  credentialId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      agent?: AuthenticatedAgent;
    }
  }
}

export function extractSessionToken(req: Request): string | null {
  const cookieToken = req.cookies?.[env.sessionCookieName];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const tokenHash = hashToken(token);
    const pool = await getPool();

    const result = await pool.query<{
      session_id: string;
      user_id: string;
      name: string;
      email: string;
      role: SocUserRole;
      department: string;
      user_status: string;
      expires_at: string;
      revoked_at: string | null;
    }>(
      `SELECT s.id AS session_id, s.expires_at, s.revoked_at,
              u.id AS user_id, u.name, u.email, u.role, u.department, u.status AS user_status
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    const row = result.rows[0];
    if (!row || row.revoked_at !== null || new Date(row.expires_at).getTime() <= Date.now()) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    if (row.user_status !== 'Active') {
      res.status(403).json({ error: 'User account is disabled' });
      return;
    }

    req.user = {
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department,
      sessionId: row.session_id
    };

    // Update last_active_at non-blockingly
    pool
      .query('UPDATE user_sessions SET last_active_at = NOW() WHERE id = $1', [row.session_id])
      .catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles: SocUserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      await recordAuditLog({
        userName: req.user.name,
        role: req.user.role,
        action: 'Unauthorized Access Attempt',
        target: `${req.method} ${req.originalUrl}`,
        result: 'Denied',
        details: `Role "${req.user.role}" lacks required permission (${allowedRoles.join(', ')})`
      }).catch(() => {});

      res.status(403).json({
        error: 'Forbidden: insufficient role permissions',
        requiredRoles: allowedRoles
      });
      return;
    }

    next();
  };
}

export async function requireAgentAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headerKey = req.headers['x-agent-key'];
    const authHeader = req.headers.authorization;

    let rawKey: string | null = null;
    if (typeof headerKey === 'string' && headerKey.trim().length > 0) {
      rawKey = headerKey.trim();
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.slice(7).trim();
    }

    if (!rawKey) {
      res.status(401).json({ error: 'Missing agent authentication credential' });
      return;
    }

    const keyHash = hashToken(rawKey);
    const pool = await getPool();

    const result = await pool.query<{
      credential_id: string;
      credential_status: string;
      agent_id: string;
      hostname: string;
      status: string;
      agent_version: string;
      ip_address: string | null;
      log_source_id: string | null;
      asset_id: string | null;
    }>(
      `SELECT c.id AS credential_id, c.status AS credential_status,
              a.id AS agent_id, a.hostname, a.status, a.agent_version,
              host(a.ip_address) AS ip_address, a.log_source_id, a.asset_id
       FROM agent_credentials c
       JOIN endpoint_agents a ON a.id = c.agent_id
       WHERE c.api_key_hash = $1
       LIMIT 1`,
      [keyHash]
    );

    const row = result.rows[0];
    if (!row || row.credential_status !== 'active') {
      res.status(401).json({ error: 'Invalid or revoked agent credential' });
      return;
    }

    if (row.status === 'Disabled') {
      res.status(403).json({ error: 'Endpoint agent is deactivated' });
      return;
    }

    req.agent = {
      id: row.agent_id,
      hostname: row.hostname,
      status: row.status,
      agentVersion: row.agent_version,
      ipAddress: row.ip_address,
      logSourceId: row.log_source_id,
      assetId: row.asset_id,
      credentialId: row.credential_id
    };

    pool
      .query('UPDATE agent_credentials SET last_used_at = NOW() WHERE id = $1', [row.credential_id])
      .catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
}
