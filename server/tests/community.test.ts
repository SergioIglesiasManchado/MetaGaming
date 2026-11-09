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
  let userToken3: string;
  let gameId: number;
  let secondGameId: number;
  let communityId: number;
  let secondCommunityId: number;
  let createdPostId: number;
  let topCommentId: number;
  let nestedCommentId: number;

  beforeAll(async () => {
    await initDb();

    // Authenticate as default admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'admin', password: 'admin' });
    adminToken = adminLoginRes.body.data.token;

    // Register test users
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

    const u3 = `gamer_comm_3_${Date.now()}`;
    const regRes3 = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: u3, email: `${u3}@metagaming.com`, password: 'password123' });
    userToken3 = regRes3.body.data.token;
  });

  afterAll(async () => {
    if (gameId) {
      await query('DELETE FROM games WHERE id = $1', [gameId]);
    }
    if (secondGameId) {
      await query('DELETE FROM games WHERE id = $1', [secondGameId]);
    }
    await pool.end();
  });

  describe('1. Normal Cases: Automatic Creation & Community Access', () => {
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

    it('can fetch community by its community ID directly', async () => {
      const res = await request(app).get(`/api/v1/communities/${communityId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.community.id).toBe(communityId);
      expect(res.body.data.community.game_id).toBe(gameId);
    });

    it('returns an empty posts array when a brand new community has no questions yet', async () => {
      const res = await request(app).get(`/api/v1/communities/${communityId}/posts`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.posts).toEqual([]);
    });
  });

  describe('2. Normal Cases: Questions & Threaded Discussions (Multi-level)', () => {
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
      expect(res.body.data.posts.length).toBe(1);

      const found = res.body.data.posts[0];
      expect(found.id).toBe(createdPostId);
      expect(found.title).toBe('Where do I find the crest?');
      expect(found.username).toBeDefined();
    });

    it('allows a second user to post a top-level answer (level 1)', async () => {
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

    it('allows the author or another user to reply to that answer (level 2: people can answer them)', async () => {
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
      nestedCommentId = res.body.data.comment.id;
    });

    it('allows a third user to reply to that reply (level 3: people can answer that people, etc.)', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userToken3}`)
        .send({
          content: 'Use the needle dart with silk enchant, it staggers him fast!',
          parent_comment_id: nestedCommentId
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.comment.parent_comment_id).toBe(nestedCommentId);
    });

    it('returns the post with hierarchical multi-level threaded replies', async () => {
      const res = await request(app).get(`/api/v1/communities/posts/${createdPostId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const { post, comments } = res.body.data;
      expect(post.id).toBe(createdPostId);
      expect(post.comments_count).toBe(3);

      // Level 1: topCommentId
      expect(comments.length).toBe(1);
      const top = comments[0];
      expect(top.id).toBe(topCommentId);

      // Level 2: nestedCommentId
      expect(top.replies.length).toBe(1);
      const level2 = top.replies[0];
      expect(level2.id).toBe(nestedCommentId);
      expect(level2.parent_comment_id).toBe(topCommentId);

      // Level 3: reply to nestedCommentId
      expect(level2.replies.length).toBe(1);
      const level3 = level2.replies[0];
      expect(level3.parent_comment_id).toBe(nestedCommentId);
      expect(level3.content).toContain('needle dart');
    });

    it('creates multiple posts and sorts them with most recent first', async () => {
      const post2Res = await request(app)
        .post(`/api/v1/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          title: 'Second topic: Lore speculation',
          content: 'What do you think happened to the Weaver kingdom?'
        });
      expect(post2Res.status).toBe(201);

      const listRes = await request(app).get(`/api/v1/communities/${communityId}/posts`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.posts.length).toBe(2);
      expect(listRes.body.data.posts[0].id).toBe(post2Res.body.data.post.id);
      expect(listRes.body.data.posts[1].id).toBe(createdPostId);
    });
  });

  describe('3. Expected Errors & Authorization Checks', () => {
    it('rejects post creation when unauthenticated (401)', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/${communityId}/posts`)
        .send({
          title: 'Unauthenticated question',
          content: 'This should not be allowed'
        });

      expect(res.status).toBe(401);
    });

    it('rejects comment creation when unauthenticated (401)', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .send({
          content: 'Unauthenticated comment'
        });

      expect(res.status).toBe(401);
    });

    it('rejects post with missing title (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: '',
          content: 'Valid content'
        });

      expect(res.status).toBe(400);
    });

    it('rejects post with missing content (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: 'Valid Title',
          content: '   '
        });

      expect(res.status).toBe(400);
    });

    it('rejects comment with empty content (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          content: '   '
        });

      expect(res.status).toBe(400);
    });
  });

  describe('4. Edge Cases: Non-existent Resources & Malformed IDs', () => {
    it('returns 404 when querying community for non-existent game ID', async () => {
      const res = await request(app).get('/api/v1/communities/by-game/999999');
      expect(res.status).toBe(404);
    });

    it('returns 400 when gameId is not a valid integer', async () => {
      const res = await request(app).get('/api/v1/communities/by-game/invalid-id');
      expect(res.status).toBe(400);
    });

    it('returns 404 when querying non-existent community ID', async () => {
      const res = await request(app).get('/api/v1/communities/999999');
      expect(res.status).toBe(404);
    });

    it('returns 400 when community ID is not a valid integer', async () => {
      const res = await request(app).get('/api/v1/communities/not-a-number');
      expect(res.status).toBe(400);
    });

    it('returns 404 when trying to post in a non-existent community ID', async () => {
      const res = await request(app)
        .post('/api/v1/communities/999999/posts')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: 'Ghost town question',
          content: 'Does this community exist?'
        });

      expect(res.status).toBe(404);
    });

    it('returns 404 when fetching a non-existent post', async () => {
      const res = await request(app).get('/api/v1/communities/posts/999999');
      expect(res.status).toBe(404);
    });

    it('returns 400 when postId is not a valid integer', async () => {
      const res = await request(app).get('/api/v1/communities/posts/invalid-id');
      expect(res.status).toBe(400);
    });

    it('returns 404 when commenting on a non-existent post', async () => {
      const res = await request(app)
        .post('/api/v1/communities/posts/999999/comments')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          content: 'Ghost comment'
        });

      expect(res.status).toBe(404);
    });

    it('returns 404 when replying to a non-existent parent comment ID', async () => {
      const res = await request(app)
        .post(`/api/v1/communities/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          content: 'Replying to ghost comment',
          parent_comment_id: 999999
        });

      expect(res.status).toBe(404);
    });

    it('returns 404 when replying to a parent comment that belongs to a different post', async () => {
      // Create a second game and post
      const game2Res = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Another Game ${Date.now()}`,
          description: 'A different game description',
          platforms: ['PC']
        });
      secondGameId = game2Res.body.data.game.id;

      const comm2Res = await request(app).get(`/api/v1/communities/by-game/${secondGameId}`);
      secondCommunityId = comm2Res.body.data.community.id;

      const post2Res = await request(app)
        .post(`/api/v1/communities/${secondCommunityId}/posts`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: 'Post on Game 2',
          content: 'Content on Game 2'
        });
      const secondPostId = post2Res.body.data.post.id;

      // Try replying to secondPostId with topCommentId (which belongs to createdPostId)
      const crossReplyRes = await request(app)
        .post(`/api/v1/communities/posts/${secondPostId}/comments`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          content: 'Attempting cross-post reply injection',
          parent_comment_id: topCommentId
        });

      expect(crossReplyRes.status).toBe(404);
    });
  });
});
