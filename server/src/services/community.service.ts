import { query } from '../db/index.js';
import {
  Community,
  CommunityComment,
  CommunityPost,
  CreateCommentDto,
  CreatePostDto
} from '../types/community.js';

export class CommunityService {
  public static async getCommunityByGameId(gameId: number): Promise<Community> {
    const communityQuery = `
      SELECT 
        c.id,
        c.game_id,
        c.name,
        c.description,
        c.created_at,
        c.updated_at,
        g.title AS game_title,
        g.photos AS game_photos
      FROM communities c
      JOIN games g ON c.game_id = g.id
      WHERE c.game_id = $1
    `;

    const result = await query(communityQuery, [gameId]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // If community does not exist yet, check if game exists and auto-create
    const gameResult = await query('SELECT id, title, description, photos FROM games WHERE id = $1', [gameId]);
    if (gameResult.rows.length === 0) {
      const error = new Error('Game not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const game = gameResult.rows[0];
    const insertResult = await query(
      `INSERT INTO communities (game_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, game_id, name, description, created_at, updated_at`,
      [game.id, game.title, game.description]
    );

    return {
      ...insertResult.rows[0],
      game_title: game.title,
      game_photos: game.photos
    };
  }

  public static async getCommunityById(communityId: number): Promise<Community> {
    const communityQuery = `
      SELECT 
        c.id,
        c.game_id,
        c.name,
        c.description,
        c.created_at,
        c.updated_at,
        g.title AS game_title,
        g.photos AS game_photos
      FROM communities c
      JOIN games g ON c.game_id = g.id
      WHERE c.id = $1
    `;

    const result = await query(communityQuery, [communityId]);
    if (result.rows.length === 0) {
      const error = new Error('Community not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  public static async getCommunityPosts(communityId: number): Promise<CommunityPost[]> {
    // Verify community exists
    await this.getCommunityById(communityId);

    const sql = `
      SELECT 
        p.id,
        p.community_id,
        p.user_id,
        u.username,
        p.title,
        p.content,
        p.created_at,
        p.updated_at,
        COUNT(c.id)::int AS comments_count
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN community_comments c ON c.post_id = p.id
      WHERE p.community_id = $1
      GROUP BY p.id, u.username
      ORDER BY p.created_at DESC
    `;

    const result = await query(sql, [communityId]);
    return result.rows;
  }

  public static async createPost(
    communityId: number,
    userId: number,
    dto: CreatePostDto
  ): Promise<CommunityPost> {
    await this.getCommunityById(communityId);

    const { title, content } = dto;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      const error = new Error('Question title is required');
      (error as any).statusCode = 400;
      throw error;
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const error = new Error('Question content is required');
      (error as any).statusCode = 400;
      throw error;
    }

    const insertSql = `
      INSERT INTO community_posts (community_id, user_id, title, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, community_id, user_id, title, content, created_at, updated_at
    `;

    const insertResult = await query(insertSql, [
      communityId,
      userId,
      title.trim(),
      content.trim()
    ]);

    const userResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
    const username = userResult.rows[0]?.username || 'Unknown';

    return {
      ...insertResult.rows[0],
      username,
      comments_count: 0
    };
  }

  public static async getPostWithComments(
    postId: number
  ): Promise<{ post: CommunityPost; comments: CommunityComment[] }> {
    const postSql = `
      SELECT 
        p.id,
        p.community_id,
        p.user_id,
        u.username,
        p.title,
        p.content,
        p.created_at,
        p.updated_at,
        COUNT(c.id)::int AS comments_count
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN community_comments c ON c.post_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, u.username
    `;

    const postResult = await query(postSql, [postId]);
    if (postResult.rows.length === 0) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const commentsSql = `
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        u.username,
        c.parent_comment_id,
        c.content,
        c.created_at,
        c.updated_at
      FROM community_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;

    const commentsResult = await query(commentsSql, [postId]);
    const flatComments: CommunityComment[] = commentsResult.rows.map((row) => ({
      ...row,
      replies: []
    }));

    // Build threaded hierarchy
    const commentMap = new Map<number, CommunityComment>();
    flatComments.forEach((c) => commentMap.set(c.id, c));

    const topLevelComments: CommunityComment[] = [];

    flatComments.forEach((c) => {
      if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
        const parent = commentMap.get(c.parent_comment_id)!;
        if (!parent.replies) {
          parent.replies = [];
        }
        parent.replies.push(c);
      } else {
        topLevelComments.push(c);
      }
    });

    return {
      post: postResult.rows[0],
      comments: topLevelComments
    };
  }

  public static async createComment(
    postId: number,
    userId: number,
    dto: CreateCommentDto
  ): Promise<CommunityComment> {
    const { content, parent_comment_id = null } = dto;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const error = new Error('Comment content cannot be empty');
      (error as any).statusCode = 400;
      throw error;
    }

    // Verify post exists
    const postCheck = await query('SELECT id FROM community_posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      const error = new Error('Post not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // If parent_comment_id is provided, verify it exists and belongs to the same post
    if (parent_comment_id !== null && parent_comment_id !== undefined) {
      const parentCheck = await query(
        'SELECT id FROM community_comments WHERE id = $1 AND post_id = $2',
        [parent_comment_id, postId]
      );
      if (parentCheck.rows.length === 0) {
        const error = new Error('Parent comment not found for this post');
        (error as any).statusCode = 404;
        throw error;
      }
    }

    const insertSql = `
      INSERT INTO community_comments (post_id, user_id, parent_comment_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, post_id, user_id, parent_comment_id, content, created_at, updated_at
    `;

    const insertResult = await query(insertSql, [
      postId,
      userId,
      parent_comment_id,
      content.trim()
    ]);

    const userResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
    const username = userResult.rows[0]?.username || 'Unknown';

    return {
      ...insertResult.rows[0],
      username,
      replies: []
    };
  }
}
