import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/index.js';

describe('Server Health and Info Endpoints', () => {
  const app = createApp();

  afterAll(async () => {
    await pool.end();
  });

  it('GET /health returns 200 with status ok and uptime', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('GET /health/db returns 200 with connected status and db info', async () => {
    const response = await request(app).get('/health/db');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('connected');
    expect(response.body.name).toBe('metagaming');
    expect(response.body).toHaveProperty('version');
  });

  it('GET /api/v1 returns API details and endpoint directory', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('MetaGaming API');
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.endpoints).toBeDefined();
  });

  it('GET /non-existent-route returns 404 with standard error format', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('Route not found');
  });
});
