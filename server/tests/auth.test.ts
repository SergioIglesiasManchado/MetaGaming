import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, query } from '../src/db/index.js';
import { initDb } from '../src/db/init.js';

describe('Authentication API & Admin User Management', () => {
  const app = createApp();
  const testUser = {
    username: `gamer_${Date.now()}`,
    email: `gamer_${Date.now()}@example.com`,
    password: 'SecurePassword123!'
  };

  let userToken: string;
  let adminToken: string;
  let createdUserId: number;

  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    // Clean up test users (keep default admin)
    await query('DELETE FROM users WHERE username = $1', [testUser.username]);
    await pool.end();
  });

  it('default admin (admin : admin) exists and can log in with is_admin flagged true', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      usernameOrEmail: 'admin',
      password: 'admin'
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.user.username).toBe('admin');
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.is_admin).toBe(true);
    expect(res.body.data.token).toBeDefined();

    adminToken = res.body.data.token;
  });

  it('registers a regular user with encoded password and strictly role="user"', async () => {
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
    createdUserId = res.body.data.user.id;

    // Verify stored password in DB is securely hashed
    const dbCheck = await query('SELECT password_hash FROM users WHERE username = $1', [
      testUser.username
    ]);
    const storedHash = dbCheck.rows[0].password_hash;
    expect(storedHash).not.toBe(testUser.password);
    expect(storedHash.startsWith('$2')).toBe(true);
  });

  it('ignores any role in registration payload and forces role to "user"', async () => {
    const attemptedAdminUser = {
      username: `hacker_${Date.now()}`,
      email: `hacker_${Date.now()}@example.com`,
      password: 'SneakyPassword123!',
      role: 'admin'
    };

    const res = await request(app).post('/api/v1/auth/register').send(attemptedAdminUser);

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.is_admin).toBe(false);

    // Clean up
    await query('DELETE FROM users WHERE username = $1', [attemptedAdminUser.username]);
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
    expect(res.body.data.username).toBe('admin');
    expect(res.body.data.is_admin).toBe(true);
    expect(res.body.data.role).toBe('admin');
  });

  it('rejects GET /api/v1/auth/me without authorization token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  // Admin user search and permission management tests
  it('prevents non-admin users from accessing GET /api/v1/users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Admin access required');
  });

  it('allows admin to search users via GET /api/v1/users', async () => {
    const res = await request(app)
      .get(`/api/v1/users?q=${testUser.username}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.find((u: any) => u.username === testUser.username);
    expect(found).toBeDefined();
    expect(found.email).toBe(testUser.email);
  });

  it('prevents non-admin from updating user roles', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${createdUserId}/role`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
  });

  it('allows admin to grant admin permission to a user via PATCH /api/v1/users/:id/role', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${createdUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdUserId);
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.is_admin).toBe(true);
  });

  it('allows admin to revoke admin permission from a user back to user role', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${createdUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdUserId);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.is_admin).toBe(false);
  });
});
