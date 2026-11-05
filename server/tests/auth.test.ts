import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, query } from '../src/db/index.js';
import { initDb } from '../src/db/init.js';

describe('Authentication API (/api/v1/auth)', () => {
  const app = createApp();
  const testUser = {
    username: `gamer_${Date.now()}`,
    email: `gamer_${Date.now()}@example.com`,
    password: 'SecurePassword123!'
  };

  const testAdmin = {
    username: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    password: 'AdminSuperPassword123!',
    role: 'admin' as const
  };

  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    // Clean up test users
    await query('DELETE FROM users WHERE username IN ($1, $2)', [
      testUser.username,
      testAdmin.username
    ]);
    await pool.end();
  });

  it('registers a regular user with encoded password and returns user profile and JWT', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.is_admin).toBe(false);
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.token).toBeDefined();

    userToken = res.body.data.token;

    // Verify stored password in DB is securely hashed (starts with $2a$ or $2b$)
    const dbCheck = await query('SELECT password_hash FROM users WHERE username = $1', [
      testUser.username
    ]);
    const storedHash = dbCheck.rows[0].password_hash;
    expect(storedHash).not.toBe(testUser.password);
    expect(storedHash.startsWith('$2')).toBe(true);
  });

  it('registers an admin user with is_admin flagged as true', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testAdmin);

    expect(res.status).toBe(201);
    expect(res.body.data.user.username).toBe(testAdmin.username);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.is_admin).toBe(true);

    adminToken = res.body.data.token;
  });

  it('rejects registration with duplicate username', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: testUser.username,
      email: 'unique_email_123@example.com',
      password: 'ValidPassword123'
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Username is already taken');
  });

  it('rejects registration with invalid email or short password', async () => {
    const res1 = await request(app).post('/api/v1/auth/register').send({
      username: 'validuser',
      email: 'invalid-email',
      password: 'ValidPassword123'
    });
    expect(res1.status).toBe(400);

    const res2 = await request(app).post('/api/v1/auth/register').send({
      username: 'validuser',
      email: 'valid@example.com',
      password: 'short'
    });
    expect(res2.status).toBe(400);
  });

  it('logs in user via username with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      usernameOrEmail: testUser.username,
      password: testUser.password
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.user.is_admin).toBe(false);
  });

  it('logs in user via email with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      usernameOrEmail: testUser.email,
      password: testUser.password
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('logs in admin and flags is_admin as true', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      usernameOrEmail: testAdmin.username,
      password: testAdmin.password
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.is_admin).toBe(true);
  });

  it('rejects login with invalid password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      usernameOrEmail: testUser.username,
      password: 'WrongPassword999'
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid credentials');
  });

  it('fetches current user profile via GET /api/v1/auth/me', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(testUser.username);
    expect(res.body.data.is_admin).toBe(false);
  });

  it('fetches admin profile via GET /api/v1/auth/me with admin privileges', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(testAdmin.username);
    expect(res.body.data.is_admin).toBe(true);
    expect(res.body.data.role).toBe('admin');
  });

  it('rejects GET /api/v1/auth/me without authorization token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
