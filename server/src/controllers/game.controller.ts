import { Request, Response, NextFunction } from 'express';
import { GameService } from '../services/game.service.js';

export class GameController {
  public static async createGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, platforms, photos } = req.body;
      const game = await GameService.createGame({ title, description, platforms, photos });

      res.status(201).json({
        status: 'success',
        message: 'Game created successfully',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async searchGames(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const games = await GameService.searchGames(search);

      res.status(200).json({
        status: 'success',
        data: { games }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getGameById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gameId = parseInt(req.params.id, 10);
      if (isNaN(gameId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid game ID'
        });
        return;
      }

      const game = await GameService.getGameById(gameId);
      if (!game) {
        res.status(404).json({
          status: 'fail',
          message: 'Game not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getGameReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gameId = parseInt(req.params.id, 10);
      if (isNaN(gameId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid game ID'
        });
        return;
      }

      const reviews = await GameService.getGameReviews(gameId);

      res.status(200).json({
        status: 'success',
        data: { reviews }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createOrUpdateReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const gameId = parseInt(req.params.id, 10);
      if (isNaN(gameId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid game ID'
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Authentication required'
        });
        return;
      }

      const { rating, comment } = req.body;
      const parsedRating = typeof rating === 'string' ? parseFloat(rating) : rating;

      const result = await GameService.createOrUpdateReview(gameId, userId, {
        rating: parsedRating,
        comment
      });

      res.status(201).json({
        status: 'success',
        message: 'Review submitted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
