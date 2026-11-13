import { getPool } from '../../database/pool.js';
import {
  generateSecureToken,
  hashPassword,
  hashToken,
  verifyPassword
} from '../../utils/crypto.js';
import { AppError } from '../../middleware/errorHandler.js';
import { recordAuditLog } from '../../services/auditService.js';
import { env } from '../../config/env.js';
import { SocUserRole } from '../../middleware/auth.js';

export interface RolePermissions {
  canManageUsers: boolean;
  canManageAgents: boolean;
  canViewEvents: boolean;
  canManageAlerts: boolean;
  canManageIncidents: boolean;
  canManageRules: boolean;
  canViewAuditLogs: boolean;
  canExportReports: boolean;
}

export function getPermissionsForRole(role: SocUserRole): RolePermissions {
  switch (role) {
    case 'Security Administrator':
      return {
        canManageUsers: true,
        canManageAgents: true,
        canViewEvents: true,
        canManageAlerts: true,
        canManageIncidents: true,
        canManageRules: true,
        canViewAuditLogs: true,
        canExportReports: true
      };
    case 'SOC Analyst':
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: true,
        canManageAlerts: true,
        canManageIncidents: true,
        canManageRules: false,
        canViewAuditLogs: false,
        canExportReports: true
      };
    case 'Incident Responder':
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: true,
        canManageAlerts: true,
        canManageIncidents: true,
        canManageRules: false,
        canViewAuditLogs: false,
        canExportReports: true
      };
    case 'Auditor':
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: true,
        canManageAlerts: false,
        canManageIncidents: false,
        canManageRules: false,
        canViewAuditLogs: true,
        canExportReports: true
      };
    case 'Management / Read-only Viewer':
    default:
      return {
        canManageUsers: false,
        canManageAgents: false,
        canViewEvents: true,
        canManageAlerts: false,
        canManageIncidents: false,
        canManageRules: false,
        canViewAuditLogs: false,
        canExportReports: true
      };
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const pool = await getPool();
  const normalizedEmail = input.email.trim().toLowerCase();

  const userRes = await pool.query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: SocUserRole;
    department: string;
    status: string;
  }>(
    `SELECT id, name, email, password_hash, role, department, status
     FROM users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [normalizedEmail]
  );

  const user = userRes.rows[0];
  if (!user) {
    await recordAuditLog({
      userName: normalizedEmail,
      role: 'Unknown',
      action: 'User Login Failed',
      target: 'Authentication',
      result: 'Failed',
      details: `Failed login attempt for unknown email ${normalizedEmail}`
    }).catch(() => {});
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.status !== 'Active') {
    await recordAuditLog({
      userName: user.name,
      role: user.role,
      action: 'User Login Denied',
      target: 'Authentication',
      result: 'Denied',
      details: `Account status is ${user.status}`
    }).catch(() => {});
    throw new AppError(403, 'User account is disabled or inactive');
  }

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) {
    await recordAuditLog({
      userName: user.name,
      role: user.role,
      action: 'User Login Failed',
      target: 'Authentication',
      result: 'Failed',
      details: 'Invalid password supplied'
    }).catch(() => {});
    throw new AppError(401, 'Invalid email or password');
  }

  const sessionToken = generateSecureToken('mor_ses', 32);
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 3600 * 1000);

  await pool.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, input.ipAddress || null, input.userAgent || null, expiresAt.toISOString()]
    );
    await client.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [
      user.id
    ]);
  });

  await recordAuditLog({
    userName: user.name,
    role: user.role,
    action: 'User Login Success',
    target: `User: ${user.email}`,
    result: 'Success',
    details: `Authenticated session started from ${input.ipAddress || 'unknown IP'}`
  });

  return {
    sessionToken,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      lastLogin: new Date().toISOString()
    },
    permissions: getPermissionsForRole(user.role)
  };
}

export async function logoutSession(sessionId: string, actor?: { name: string; role: string }) {
  const pool = await getPool();
  await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [sessionId]);
  if (actor) {
    await recordAuditLog({
      userName: actor.name,
      role: actor.role,
      action: 'User Logout',
      target: `Session: ${sessionId}`,
      result: 'Success',
      details: 'User logged out and session revoked'
    });
  }
}

export async function listUsers() {
  const pool = await getPool();
  const res = await pool.query<{
    id: string;
    name: string;
    email: string;
    role: SocUserRole;
    department: string;
    status: string;
    last_login: string | null;
    created_at: string;
  }>(
    `SELECT id, name, email, role, department, status, last_login, created_at
     FROM users
     ORDER BY created_at ASC`
  );

  return res.rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    status: u.status,
    lastLogin: u.last_login ? new Date(u.last_login).toISOString().replace('T', ' ').slice(0, 19) : 'Never'
  }));
}

export async function createUser(
  input: {
    name: string;
    email: string;
    password: string;
    role: SocUserRole;
    department: string;
    status?: 'Active' | 'Inactive' | 'Disabled';
  },
  actor: { name: string; role: string }
) {
  const pool = await getPool();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new AppError(409, 'A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const id = `USR-${Date.now().toString().slice(-6)}`;
  const status = input.status || 'Active';

  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, department, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, input.name.trim(), normalizedEmail, passwordHash, input.role, input.department.trim(), status]
  );

  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'User Account Created',
    target: `User: ${normalizedEmail}`,
    result: 'Success',
    details: `Created ${input.role} account in ${input.department}`
  });

  return {
    id,
    name: input.name.trim(),
    email: normalizedEmail,
    role: input.role,
    department: input.department.trim(),
    status,
    lastLogin: 'Never'
  };
}

export async function updateUserStatus(
  userId: string,
  status: 'Active' | 'Inactive' | 'Disabled',
  actor: { id: string; name: string; role: string }
) {
  if (userId === actor.id && status !== 'Active') {
    throw new AppError(400, 'Cannot disable your own active administrator session');
  }
  const pool = await getPool();
  const res = await pool.query<{ id: string; email: string }>(
    `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email`,
    [status, userId]
  );
  if (res.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }
  if (status !== 'Active') {
    await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [
      userId
    ]);
  }
  await recordAuditLog({
    userName: actor.name,
    role: actor.role,
    action: 'User Status Updated',
    target: `User: ${res.rows[0].email}`,
    result: 'Success',
    details: `Updated status to ${status}`
  });
  return { id: userId, status };
}
