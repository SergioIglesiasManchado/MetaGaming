import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, query } from '../src/db/index.js';
import { initDb } from '../src/db/init.js';

describe('Videogames & Reviews API Battery', () => {
  const app = createApp();
  let adminToken: string;
  let userToken1: string;
  let userToken2: string;
  let userToken3: string;
  let createdGameId: number;

  beforeAll(async () => {
    await initDb();

    // Authenticate as default admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'admin', password: 'admin' });
    adminToken = adminLoginRes.body.data.token;

    // Register 3 regular users for testing reviews and role access
    const u1 = `gamer_one_${Date.now()}`;
    const regRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: u1, email: `${u1}@metagaming.com`, password: 'password123' });
    userToken1 = regRes1.body.data.token;

    const u2 = `gamer_two_${Date.now()}`;
    const regRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: u2, email: `${u2}@metagaming.com`, password: 'password123' });
    userToken2 = regRes2.body.data.token;

    const u3 = `gamer_three_${Date.now()}`;
    const regRes3 = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: u3, email: `${u3}@metagaming.com`, password: 'password123' });
    userToken3 = regRes3.body.data.token;
  });

  afterAll(async () => {
    if (createdGameId) {
      await query('DELETE FROM games WHERE id = $1', [createdGameId]);
    }
    await pool.end();
  });

  describe('Game Creation (Admin Capabilities & Access Control)', () => {
    it('allows an admin to introduce a new game with platforms and photos', async () => {
      const payload = {
        title: `The Legend of Zelda: Echoes ${Date.now()}`,
        description: 'An expansive open-world fantasy adventure.',
        platforms: ['Nintendo Switch', 'Switch 2'],
        photos: [
          'https://images.unsplash.com/photo-zelda-1.jpg',
          'https://images.unsplash.com/photo-zelda-2.jpg'
        ]
      };

      const res = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.game).toHaveProperty('id');
      expect(res.body.data.game.title).toBe(payload.title);
      expect(res.body.data.game.description).toBe(payload.description);
      expect(res.body.data.game.platforms).toEqual(payload.platforms);
      expect(res.body.data.game.photos).toEqual(payload.photos);
      expect(res.body.data.game.average_rating).toBe(0);
      expect(res.body.data.game.reviews_count).toBe(0);

      createdGameId = res.body.data.game.id;
    });

    it('rejects game creation by a regular non-admin user (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: 'Unauthorized Game',
          description: 'Should not be allowed',
          platforms: ['PC']
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('rejects unauthenticated game creation (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/v1/games')
        .send({
          title: 'Guest Game',
          description: 'No auth',
          platforms: ['PC']
        });

      expect(res.status).toBe(401);
    });

    it('rejects game creation when title or description is missing or blank', async () => {
      const resMissingTitle = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '   ',
          description: 'A valid description',
          platforms: ['PC']
        });

      expect(resMissingTitle.status).toBe(400);

      const resMissingDesc = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Valid Title',
          description: '',
          platforms: ['PC']
        });

      expect(resMissingDesc.status).toBe(400);
    });

    it('rejects game creation when platforms are empty or invalid', async () => {
      const resNoPlatforms = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Game without platforms',
          description: 'Some description',
          platforms: []
        });

      expect(resNoPlatforms.status).toBe(400);

      const resBlankPlatform = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Game with blank platform',
          description: 'Some description',
          platforms: ['   ']
        });

      expect(resBlankPlatform.status).toBe(400);
    });
  });

  describe('Game Search & Listing', () => {
    it('returns all games publicly and supports case-insensitive search', async () => {
      const searchRes = await request(app).get('/api/v1/games?search=echoes');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.status).toBe('success');
      expect(Array.isArray(searchRes.body.data.games)).toBe(true);
      expect(searchRes.body.data.games.length).toBeGreaterThanOrEqual(1);

      const found = searchRes.body.data.games.find((g: any) => g.id === createdGameId);
      expect(found).toBeDefined();
      expect(found.average_rating).toBe(0);
      expect(found.reviews_count).toBe(0);
    });

    it('returns empty array when search query matches no games', async () => {
      const searchRes = await request(app).get('/api/v1/games?search=xyz_completely_non_existent_12345');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.games).toEqual([]);
    });

    it('fetches single game details by valid ID', async () => {
      const res = await request(app).get(`/api/v1/games/${createdGameId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.game.id).toBe(createdGameId);
    });

    it('returns 400 for invalid game ID format', async () => {
      const res = await request(app).get('/api/v1/games/abc-not-a-number');
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent game ID', async () => {
      const res = await request(app).get('/api/v1/games/99999999');
      expect(res.status).toBe(404);
    });
  });

  describe('Reviews & Overall Score Battery', () => {
    it('rejects posting a review without authentication (401)', async () => {
      const res = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .send({ rating: 8, comment: 'Awesome game!' });

      expect(res.status).toBe(401);
    });

    it('rejects reviews with invalid rating (negative, over 10, or non-numeric)', async () => {
      const resNegative = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ rating: -1, comment: 'Terrible' });
      expect(resNegative.status).toBe(400);

      const resOver10 = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ rating: 10.5, comment: 'Too good' });
      expect(resOver10.status).toBe(400);

      const resNotNumber = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ rating: 'masterpiece', comment: 'Loved it' });
      expect(resNotNumber.status).toBe(400);
    });

    it('rejects reviews with empty comments', async () => {
      const res = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ rating: 7, comment: '   ' });

      expect(res.status).toBe(400);
    });

    it('rejects posting review for a non-existent game (404)', async () => {
      const res = await request(app)
        .post('/api/v1/games/99999999/reviews')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ rating: 9, comment: 'Ghost game' });

      expect(res.status).toBe(404);
    });

    it('allows user 1 to post a review and updates overall note to that review rating', async () => {
      const res = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ rating: 8.0, comment: 'Great graphics and smooth mechanics!' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.rating).toBe(8.0);
      expect(res.body.data.review.comment).toBe('Great graphics and smooth mechanics!');
      expect(res.body.data.gameOverall.average_rating).toBe(8.0);
      expect(res.body.data.gameOverall.reviews_count).toBe(1);

      // Verify game endpoint immediately reflects new score
      const gameRes = await request(app).get(`/api/v1/games/${createdGameId}`);
      expect(gameRes.body.data.game.average_rating).toBe(8.0);
      expect(gameRes.body.data.game.reviews_count).toBe(1);
    });

    it('allows user 2 to post a review (10.0) and updates overall note to (8.0 + 10.0) / 2 = 9.0', async () => {
      const res = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({ rating: 10.0, comment: 'One of the best games ever made!' });

      expect(res.status).toBe(201);
      expect(res.body.data.gameOverall.average_rating).toBe(9.0);
      expect(res.body.data.gameOverall.reviews_count).toBe(2);

      const gameRes = await request(app).get(`/api/v1/games/${createdGameId}`);
      expect(gameRes.body.data.game.average_rating).toBe(9.0);
      expect(gameRes.body.data.game.reviews_count).toBe(2);
    });

    it('allows user 3 to post a review (6.0) and updates overall note to (8+10+6) / 3 = 8.0', async () => {
      const res = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken3}`)
        .send({ rating: 6.0, comment: 'Decent, but has some performance bugs.' });

      expect(res.status).toBe(201);
      expect(res.body.data.gameOverall.average_rating).toBe(8.0);
      expect(res.body.data.gameOverall.reviews_count).toBe(3);
    });

    it('allows a user to update their existing review and recalculates overall note', async () => {
      // User 1 changes review from 8.0 to 2.0. New average: (2 + 10 + 6) / 3 = 6.0
      const res = await request(app)
        .post(`/api/v1/games/${createdGameId}/reviews`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ rating: 2.0, comment: 'Encountered game-breaking bug on patch 1.2!' });

      expect(res.status).toBe(201);
      expect(res.body.data.gameOverall.average_rating).toBe(6.0);
      expect(res.body.data.gameOverall.reviews_count).toBe(3);

      const gameRes = await request(app).get(`/api/v1/games/${createdGameId}`);
      expect(gameRes.body.data.game.average_rating).toBe(6.0);
    });

    it('publicly lists all reviews for the game with usernames and comments', async () => {
      const res = await request(app).get(`/api/v1/games/${createdGameId}/reviews`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
      expect(res.body.data.reviews.length).toBe(3);

      const comments = res.body.data.reviews.map((r: any) => r.comment);
      expect(comments).toContain('One of the best games ever made!');
      expect(comments).toContain('Encountered game-breaking bug on patch 1.2!');
    });

    it('returns 404 when listing reviews for non-existent game', async () => {
      const res = await request(app).get('/api/v1/games/99999999/reviews');
      expect(res.status).toBe(404);
    });
  });
});
