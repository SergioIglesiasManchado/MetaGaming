import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const getDbConfig = () => {
  // Candidate environment variable keys in order of preference
  const explicitKeys = [
    'DATABASE_URL_POOLED',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL',
    'DIRECT_URL'
  ];

  // Also collect any prefixed variants created by Prisma/Vercel (e.g. PRISMA_DATABASE_URL, PRISMA_POSTGRES_URL)
  const envKeys = Object.keys(process.env);
  const dynamicKeys = envKeys.filter((k) =>
    k.endsWith('DATABASE_URL') ||
    k.endsWith('DATABASE_URL_POOLED') ||
    k.endsWith('POSTGRES_URL') ||
    k.endsWith('PRISMA_URL') ||
    k.endsWith('DIRECT_URL')
  );

  const allKeys = Array.from(new Set([...explicitKeys, ...dynamicKeys]));

  // First pass: look for a remote cloud database URL (ignores docker/localhost URLs like @postgres:5432)
  let connectionString: string | undefined;
  let sourceKey: string | undefined;

  for (const key of allKeys) {
    const val = process.env[key];
    if (val && typeof val === 'string' && val.trim() !== '') {
      const isDockerOrLocal =
        val.includes('@postgres:') ||
        val.includes('@postgres/') ||
        val.includes('localhost') ||
        val.includes('127.0.0.1');

      if (!isDockerOrLocal) {
        connectionString = val.trim();
        sourceKey = key;
        break;
      }
    }
  }

  // Second pass: if no remote URL is found, allow local/docker connection strings
  if (!connectionString) {
    for (const key of allKeys) {
      const val = process.env[key];
      if (val && typeof val === 'string' && val.trim() !== '') {
        connectionString = val.trim();
        sourceKey = key;
        break;
      }
    }
  }

  if (connectionString) {
    console.log(`🔌 Initializing database connection using environment variable: ${sourceKey}`);

    if (connectionString.startsWith('prisma+postgres://')) {
      connectionString = connectionString.replace('prisma+postgres://', 'postgresql://');
    }

    const isLocal =
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1') ||
      connectionString.includes('@postgres:5432') ||
      connectionString.includes('@postgres/');

    const useSsl =
      process.env.DATABASE_SSL === 'true' ||
      (!isLocal && process.env.DATABASE_SSL !== 'false');

    return {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 5
    };
  }

  if (process.env.VERCEL) {
    console.warn(
      '⚠️ Running on Vercel but no remote database connection string was resolved. Checked: ' +
        allKeys.join(', ')
    );
  }

  const host =
    process.env.VERCEL && process.env.POSTGRES_HOST === 'postgres'
      ? 'localhost'
      : process.env.POSTGRES_HOST || 'localhost';

  return {
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'metagaming',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 5
  };
};

export const pool = new Pool(getDbConfig());

// Handle idle connection errors without crashing process
pool.on('error', (err) => {
  console.error('⚠️ Unexpected idle client database error:', err.message);
});

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
