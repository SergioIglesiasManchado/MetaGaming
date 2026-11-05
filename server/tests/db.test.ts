import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, checkDbConnection, getDbConfig, query } from '../src/db/index.js';
import { HealthService } from '../src/services/health.service.js';

describe('Primary Database Connectivity & Service Layer', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('correctly configures DB connection parameters from environment or defaults', () => {
    const config = getDbConfig();
    if ('connectionString' in config) {
      expect(config.connectionString).toBeDefined();
    } else {
      expect(config.host).toBeDefined();
      expect(config.port).toBe(5432);
      expect(config.database).toBe('metagaming');
    }
  });

  it('successfully reaches the database on the selected port and verifies it is up and running', async () => {
    const result = await checkDbConnection();
    expect(result.ok).toBe(true);
    expect(result.database).toBe('metagaming');
    expect(result.timestamp).toBeDefined();
  });

  it('executes parameterized queries safely without errors', async () => {
    const testValue = 'metagaming_core_test';
    const result = await query<{ echo: string }>('SELECT $1::text as echo', [testValue]);
    expect(result.rows[0]?.echo).toBe(testValue);
  });

  it('HealthService retrieves detailed database health and version information', async () => {
    const dbHealth = await HealthService.getDatabaseHealth();
    expect(dbHealth.ok).toBe(true);
    expect(dbHealth.database).toBe('metagaming');
    expect(dbHealth.version).toContain('PostgreSQL');
  });

  it('GET /health/db returns 200 with connected status', async () => {
    const app = createApp();
    const response = await request(app).get('/health/db');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('name', 'metagaming');
  });
});
