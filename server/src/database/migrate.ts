import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DbPool, getPool, closePool } from './pool.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(providedPool?: DbPool): Promise<string[]> {
  const pool = providedPool ?? (await getPool());

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedRes = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations'
  );
  const appliedSet = new Set(appliedRes.rows.map((r) => r.filename));

  const newlyApplied: string[] = [];

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');

    if (pool.isPglite() && pool.exec) {
      await pool.exec('BEGIN;');
      try {
        await pool.exec(sql);
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await pool.exec('COMMIT;');
      } catch (err) {
        await pool.exec('ROLLBACK;');
        throw err;
      }
    } else {
      await pool.withTransaction(async (client) => {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      });
    }

    newlyApplied.push(file);
    logger.info('Applied SQL migration', { file });
  }

  return newlyApplied;
}

// Allow CLI execution: npm run migrate
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(async (applied) => {
      console.log(
        applied.length > 0
          ? `Migrations applied: ${applied.join(', ')}`
          : 'All migrations already applied.'
      );
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Migration failed:', err);
      await closePool();
      process.exit(1);
    });
}
