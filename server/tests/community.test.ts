import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, query } from '../src/db/index.js';
import { initDb } from '../src/db/init.js';

describe('Game Communities & Threaded Discussions API Battery', () => {
  const app = createApp();
  let adminToken: string;
  let userToken1: string;
  let userToken2: string;
  let gameId: number;
  let communityId: number;
  let createdPostId: number;
  let topCommentId: number;

  beforeAll(async () => {
    await initDb();

    // Authenticate as default admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'admin', password: 'admin' });
    adminToken = adminLoginRes.body.data.token;

    // Register two users
    const u1 = `gamer_comm_1_${Date.now()}`;
    const regRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: u1, email: `${u1}@metagaming.com`, password: 'password123' });
    userToken1 = regRes1.body.data.token;

    const u2 = `gamer_comm_2_${Date.now()}`;
    const regRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: u2, email: `${u2}@metagaming.com`, password: 'password123' });
    userToken2 = regRes2.body.data.token;
  });

  afterAll(async () => {
    if (gameId) {
      await query('DELETE FROM games WHERE id = $1', [gameId]);
    }
    await pool.end();
  });

  describe('Automatic Community Creation', () => {
    it('automatically creates a community when an admin creates a new game', async () => {
      const createGameRes = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Hollow Knight Silksong ${Date.now()}`,
          description: 'Explore, fight and survive in a whole new world ruled by silk and song.',
          platforms: ['PC', 'Nintendo Switch']
        });

      expect(createGameRes.status).toBe(201);
      gameId = createGameRes.body.data.game.id;
      expect(gameId).toBeDefined();

      // Access community by gameId
      const commRes = await request(app).get(`/api/v1/communities/by-game/${gameId}`);
      expect(commRes.status).toBe(200);
      expect(commRes.body.status).toBe('success');
      expect(commRes.body.data.community).toBeDefined();
      expect(commRes.body.data.community.game_id).toBe(gameId);
      expect(commRes.body.data.community.name).toContain('Hollow Knight Silksong');
      communityId = commRes.body.data.community.id;
    });

    it('returns 404 when querying community for a non-existent game', async () => {
      const res = await request(app).get('/api/v1/communities/by-game/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('Community Questions / Posts', () => {
    it('rejects post creation when unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/${communityId}/posts`)
        .send({
          title: 'Where do I find the crest?',
          content: 'I have explored the Citadel but cannot locate the crest.'
        });

      expect(res.status).toBe(401);
    });

    it('rejects post with missing or empty title/content', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: '',
          content: 'Some content'
        });

      expect(res.status).toBe(400);
    });

    it('allows authenticated user to ask a question in the community', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: 'Where do I find the crest?',
          content: 'I have explored the Citadel but cannot locate the crest.'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.post.title).toBe('Where do I find the crest?');
      expect(res.body.data.post.community_id).toBe(communityId);
      expect(res.body.data.post.comments_count).toBe(0);
      createdPostId = res.body.data.post.id;
    });

    it('lists posts for a community with author and comment count', async () => {
      const res = await request(app).get(`/api/v1/communities/${communityId}/posts`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.posts.find((p: any) => p.id === createdPostId);
      expect(found).toBeDefined();
      expect(found.username).toBeDefined();
    });
  });

  describe('Threaded Answers & Nested Discussion', () => {
    it('rejects comment creation when unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .send({
          content: 'You need to defeat the sentinel first!'
        });

      expect(res.status).toBe(401);
    });

    it('rejects comment with empty content', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          content: '   '
        });

      expect(res.status).toBe(400);
    });

    it('allows a user to post a top-level answer to a question', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          content: 'You need to defeat the Moss Sentinel at the upper bell tower.'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.comment.post_id).toBe(createdPostId);
      expect(res.body.data.comment.parent_comment_id).toBeNull();
      topCommentId = res.body.data.comment.id;
    });

    it('allows another user to answer/reply to an existing comment (nested reply)', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          content: 'Thanks! What weapon or tool works best against him?',
          parent_comment_id: topCommentId
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.comment.parent_comment_id).toBe(topCommentId);
    });

    it('returns the post with hierarchical threaded comments', async () => {
      const res = await request(app).get(`/api/v1/communities/posts/${createdPostId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const { post, comments } = res.body.data;
      expect(post.id).toBe(createdPostId);
      expect(post.comments_count).toBe(2);

      // Top level comments should contain topCommentId
      expect(comments.length).toBe(1);
      expect(comments[0].id).toBe(topCommentId);

      // Nested replies inside topCommentId
      expect(comments[0].replies).toBeDefined();
      expect(comments[0].replies.length).toBe(1);
      expect(comments[0].replies[0].parent_comment_id).toBe(topCommentId);
      expect(comments[0].replies[0].content).toContain('What weapon or tool works best');
    });

    it('returns 404 when replying to a non-existent parent comment ID', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          content: 'This should fail',
          parent_comment_id: 999999
        });

      expect(res.status).toBe(404);
    });
  });
});
