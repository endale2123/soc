import { env } from '../config/env.js';
import { hashPassword } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { DbPool, getPool, closePool } from './pool.js';
import { runMigrations } from './migrate.js';

export interface SeedAccount {
  id: string;
  name: string;
  email: string;
  role:
    | 'Security Administrator'
    | 'SOC Analyst'
    | 'Incident Responder'
    | 'Auditor'
    | 'Management / Read-only Viewer';
  department: string;
  password: string;
}

export async function seedDefaults(providedPool?: DbPool): Promise<{ usersSeeded: number }> {
  const pool = providedPool ?? (await getPool());

  const existing = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  const userCount = Number.parseInt(existing.rows[0]?.count || '0', 10);

  if (userCount > 0) {
    return { usersSeeded: 0 };
  }

  const defaultPassword = env.bootstrapAdminPassword;
  const accounts: SeedAccount[] = [
    {
      id: 'USR-001',
      name: 'Endale Aychew',
      email: env.bootstrapAdminEmail,
      role: 'Security Administrator',
      department: 'Directorate of Cybersecurity & Infrastructure',
      password: defaultPassword
    },
    {
      id: 'USR-002',
      name: 'Biks Biset',
      email: 'biks.b@revenue.gov.et',
      role: 'SOC Analyst',
      department: 'SOC Operations Level 2',
      password: defaultPassword
    },
    {
      id: 'USR-003',
      name: 'Bethlehem Haile',
      email: 'bethlehem.h@revenue.gov.et',
      role: 'Incident Responder',
      department: 'Cyber Incident Response Team (CIRT)',
      password: defaultPassword
    },
    {
      id: 'USR-004',
      name: 'Mekonnen Wolde',
      email: 'mekonnen.w@revenue.gov.et',
      role: 'Auditor',
      department: 'Internal Audit & Compliance',
      password: defaultPassword
    },
    {
      id: 'USR-005',
      name: 'Hon. Almaz Mengistu',
      email: 'almaz.m@revenue.gov.et',
      role: 'Management / Read-only Viewer',
      department: 'Executive Leadership & IT Governance',
      password: defaultPassword
    }
  ];

  let usersSeeded = 0;
  for (const acc of accounts) {
    const passwordHash = await hashPassword(acc.password);
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, department, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active')
       ON CONFLICT (email) DO NOTHING`,
      [acc.id, acc.name, acc.email.toLowerCase(), passwordHash, acc.role, acc.department]
    );
    usersSeeded += 1;
  }

  logger.info('Seeded initial RBAC SOC users', { usersSeeded });
  return { usersSeeded };
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runMigrations()
    .then(() => seedDefaults())
    .then(async (res) => {
      console.log(`Seed complete: ${res.usersSeeded} users created.`);
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await closePool();
      process.exit(1);
    });
}
