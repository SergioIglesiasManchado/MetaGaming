import { query } from '../db/index.js';
import { CreateGameDto, CreateReviewDto, Game, Review } from '../types/game.js';

export class GameService {
  public static async createGame(dto: CreateGameDto): Promise<Game> {
    const { title, description, platforms, photos = [] } = dto;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      const error = new Error('Game title is required');
      (error as any).statusCode = 400;
      throw error;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      const error = new Error('Game description is required');
      (error as any).statusCode = 400;
      throw error;
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      const error = new Error('At least one platform is required');
      (error as any).statusCode = 400;
      throw error;
    }

    const cleanedPlatforms = platforms
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter((p) => p.length > 0);

    if (cleanedPlatforms.length === 0) {
      const error = new Error('Platforms cannot be empty strings');
      (error as any).statusCode = 400;
      throw error;
    }

    const cleanedPhotos = Array.isArray(photos)
      ? photos.map((url) => (typeof url === 'string' ? url.trim() : '')).filter((url) => url.length > 0)
      : [];

    const insertQuery = `
      INSERT INTO games (title, description, platforms, photos)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, platforms, photos, created_at, updated_at
    `;

    const result = await query(insertQuery, [
      title.trim(),
      description.trim(),
      cleanedPlatforms,
      cleanedPhotos
    ]);

    const row = result.rows[0];

    // Automatically create community for the game
    await query(
      `INSERT INTO communities (game_id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (game_id) DO NOTHING`,
      [row.id, row.title, row.description]
    );

    return {
      ...row,
      average_rating: 0,
      reviews_count: 0
    };
  }

  public static async searchGames(search?: string): Promise<Game[]> {
    let sql = `
      SELECT 
        g.id,
        g.title,
        g.description,
        g.platforms,
        g.photos,
        g.created_at,
        g.updated_at,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS average_rating,
        COUNT(r.id)::int AS reviews_count
      FROM games g
      LEFT JOIN reviews r ON g.id = r.game_id
    `;

    const params: any[] = [];
    if (search && search.trim().length > 0) {
      sql += ` WHERE LOWER(g.title) LIKE LOWER($1) `;
      params.push(`%${search.trim()}%`);
    }

    sql += `
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `;

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      average_rating: Number(row.average_rating),
      reviews_count: Number(row.reviews_count)
    }));
  }

  public static async getGameById(id: number): Promise<Game | null> {
    const sql = `
      SELECT 
        g.id,
        g.title,
        g.description,
        g.platforms,
        g.photos,
        g.created_at,
        g.updated_at,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS average_rating,
        COUNT(r.id)::int AS reviews_count
      FROM games g
      LEFT JOIN reviews r ON g.id = r.game_id
      WHERE g.id = $1
      GROUP BY g.id
    `;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      average_rating: Number(row.average_rating),
      reviews_count: Number(row.reviews_count)
    };
  }

  public static async getGameReviews(gameId: number): Promise<Review[]> {
    const game = await this.getGameById(gameId);
    if (!game) {
      const error = new Error('Game not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const sql = `
      SELECT 
        r.id,
        r.game_id,
        r.user_id,
        u.username,
        r.rating::float AS rating,
        r.comment,
        r.created_at,
        r.updated_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.game_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await query(sql, [gameId]);
    return result.rows.map((row) => ({
      ...row,
      rating: Number(row.rating)
    }));
  }

  public static async createOrUpdateReview(
    gameId: number,
    userId: number,
    dto: CreateReviewDto
  ): Promise<{ review: Review; gameOverall: { average_rating: number; reviews_count: number } }> {
    const { rating, comment } = dto;

    if (rating === undefined || rating === null || typeof rating !== 'number' || isNaN(rating)) {
      const error = new Error('Rating must be a valid number between 0 and 10');
      (error as any).statusCode = 400;
      throw error;
    }

    if (rating < 0 || rating > 10) {
      const error = new Error('Rating must be between 0 and 10');
      (error as any).statusCode = 400;
      throw error;
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      const error = new Error('Review comment cannot be empty');
      (error as any).statusCode = 400;
      throw error;
    }

    const game = await this.getGameById(gameId);
    if (!game) {
      const error = new Error('Game not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const upsertSql = `
      INSERT INTO reviews (game_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (game_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
      RETURNING id, game_id, user_id, rating::float, comment, created_at, updated_at
    `;

    const result = await query(upsertSql, [gameId, userId, rating, comment.trim()]);
    const reviewRow = result.rows[0];

    const userRes = await query('SELECT username FROM users WHERE id = $1', [userId]);
    const username = userRes.rows[0]?.username || 'Anonymous';

    // Fetch updated score for the game
    const updatedGame = await this.getGameById(gameId);

    return {
      review: {
        ...reviewRow,
        username,
        rating: Number(reviewRow.rating)
      },
      gameOverall: {
        average_rating: updatedGame?.average_rating ?? 0,
        reviews_count: updatedGame?.reviews_count ?? 0
      }
    };
  }

  public static async followGame(gameId: number, userId: number): Promise<boolean> {
    const game = await this.getGameById(gameId);
    if (!game) {
      const error = new Error('Game not found');
      (error as any).statusCode = 404;
      throw error;
    }

    await query(
      `INSERT INTO game_follows (user_id, game_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, game_id) DO NOTHING`,
      [userId, gameId]
    );

    return true;
  }

  public static async unfollowGame(gameId: number, userId: number): Promise<boolean> {
    await query('DELETE FROM game_follows WHERE user_id = $1 AND game_id = $2', [userId, gameId]);
    return true;
  }

  public static async isFollowingGame(gameId: number, userId: number): Promise<boolean> {
    const res = await query('SELECT id FROM game_follows WHERE user_id = $1 AND game_id = $2', [userId, gameId]);
    return res.rows.length > 0;
  }

  public static async getFollowedGames(userId: number): Promise<Game[]> {
    const sql = `
      SELECT 
        g.id,
        g.title,
        g.description,
        g.platforms,
        g.photos,
        g.created_at,
        g.updated_at,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS average_rating,
        COUNT(r.id)::int AS reviews_count
      FROM games g
      INNER JOIN game_follows gf ON g.id = gf.game_id
      LEFT JOIN reviews r ON g.id = r.game_id
      WHERE gf.user_id = $1
      GROUP BY g.id, gf.created_at
      ORDER BY gf.created_at DESC
    `;

    const result = await query(sql, [userId]);
    return result.rows.map((row) => ({
      ...row,
      average_rating: Number(row.average_rating),
      reviews_count: Number(row.reviews_count)
    }));
  }
}
