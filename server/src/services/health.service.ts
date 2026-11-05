import { checkDbConnection, query, type DbHealthResult } from '../db/index.js';

export interface SystemHealth {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export interface DetailedDbHealth extends DbHealthResult {
  version: string;
}

export class HealthService {
  public static getSystemHealth(): SystemHealth {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  public static async getDatabaseHealth(): Promise<DetailedDbHealth> {
    const baseHealth = await checkDbConnection();
    
    // Execute parameterized query to get postgres version
    const versionRes = await query<{ version: string }>('SELECT version()');
    
    return {
      ...baseHealth,
      version: versionRes.rows[0]?.version ?? 'PostgreSQL'
    };
  }
}
