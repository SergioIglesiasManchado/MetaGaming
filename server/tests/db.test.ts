import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, checkDbConnection, getDbConfig } from '../src/db/index.js';

describe('Primary Database Connectivity & Health', () => {
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

  it('GET /health/db returns 200 with connected status', async () => {
    const app = createApp();
    const response = await request(app).get('/health/db');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('name', 'metagaming');
  });
});
