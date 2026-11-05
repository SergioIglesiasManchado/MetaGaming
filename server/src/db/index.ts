import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL
    };
  }

  return {
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'metagaming'
  };
};

export const pool = new Pool(getDbConfig());

/**
 * Execute parameterized query safely using the connection pool
 */
export const query = async <T extends pg.QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> => {
  return pool.query<T>(text, params);
};

export interface DbHealthResult {
  ok: boolean;
  database: string;
  timestamp: string;
}

export const checkDbConnection = async (): Promise<DbHealthResult> => {
  const result = await query<{ connected: number; current_time: string; db_name: string }>(
    'SELECT 1 as connected, NOW() as current_time, current_database() as db_name'
  );

  return {
    ok: Boolean(result.rows[0]?.connected),
    database: result.rows[0]?.db_name ?? 'unknown',
    timestamp: result.rows[0]?.current_time ?? new Date().toISOString()
  };
};
