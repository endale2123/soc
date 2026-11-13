import { DbClient, getPool } from '../database/pool.js';

export interface AuditLogInput {
  userName: string;
  role: string;
  action: string;
  target: string;
  result: 'Success' | 'Failed' | 'Denied';
  details: string;
}

export async function recordAuditLog(input: AuditLogInput, db?: DbClient): Promise<void> {
  const client = db ?? (await getPool());
  await client.query(
    `INSERT INTO audit_logs (id, user_name, role, action, target, result, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      input.userName,
      input.role,
      input.action,
      input.target,
      input.result,
      input.details
    ]
  );
}
