import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Server Health and Info Endpoints', () => {
  const app = createApp();

  it('GET /health returns 200 with status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1 returns API details', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('MetaGaming API');
    expect(response.body.version).toBe('1.0.0');
  });
});
