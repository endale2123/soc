import pg, { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface DbClient {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>>;
  exec?(sql: string): Promise<void>;
}

export interface DbPool extends DbClient {
  withTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  isPglite(): boolean;
}

class PostgresPoolWrapper implements DbPool {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async withTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({
        query: <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
          client.query<R>(text, params)
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  isPglite(): boolean {
    return false;
  }
}

class PglitePoolWrapper implements DbPool {
  private db: any;

  constructor(pgliteInstance: any) {
    this.db = pgliteInstance;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const res = await this.db.query(text, params);
    return {
      rows: res.rows as T[],
      rowCount: res.affectedRows ?? res.rows.length,
      command: '',
      oid: 0,
      fields: res.fields || []
    };
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  async withTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: any) => {
      return fn({
        query: async <R extends QueryResultRow = QueryResultRow>(
          text: string,
          params?: unknown[]
        ): Promise<QueryResult<R>> => {
          const res = await tx.query(text, params);
          return {
            rows: res.rows as R[],
            rowCount: res.affectedRows ?? res.rows.length,
            command: '',
            oid: 0,
            fields: res.fields || []
          };
        }
      });
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  isPglite(): boolean {
    return true;
  }
}

let activePool: DbPool | null = null;
let initializingPromise: Promise<DbPool> | null = null;

export async function createDbPool(overridePgliteInstance?: any): Promise<DbPool> {
  if (overridePgliteInstance) {
    const wrapper = new PglitePoolWrapper(overridePgliteInstance);
    activePool = wrapper;
    return wrapper;
  }

  if (env.usePglite) {
    const { PGlite } = await import('@electric-sql/pglite');
    const dataDir = env.nodeEnv === 'test' ? 'memory://' : env.pgliteDataDir;
    const instance = new PGlite(dataDir);
    await instance.waitReady;
    logger.info('Initialized PostgreSQL-compatible PGlite engine', {
      mode: env.nodeEnv === 'test' ? 'memory' : 'persisted'
    });
    const wrapper = new PglitePoolWrapper(instance);
    activePool = wrapper;
    return wrapper;
  }

  const poolConfig: pg.PoolConfig = env.databaseUrl
    ? {
        connectionString: env.databaseUrl,
        ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000
      }
    : {
        host: env.pgHost,
        port: env.pgPort,
        user: env.pgUser,
        password: env.pgPassword,
        database: env.pgDatabase,
        ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000
      };

  const pool = new Pool(poolConfig);
  pool.on('error', (err) => {
    logger.error('Unexpected idle PostgreSQL client error', { error: err.message });
  });

  const wrapper = new PostgresPoolWrapper(pool);
  activePool = wrapper;
  return wrapper;
}

export async function getPool(): Promise<DbPool> {
  if (activePool) return activePool;
  if (!initializingPromise) {
    initializingPromise = createDbPool().finally(() => {
      initializingPromise = null;
    });
  }
  return initializingPromise;
}

export function setPool(pool: DbPool): void {
  activePool = pool;
}

export async function closePool(): Promise<void> {
  if (activePool) {
    await activePool.close();
    activePool = null;
  }
}
