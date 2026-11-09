import { Request, Response, NextFunction } from 'express';
import { CommunityService } from '../services/community.service.js';

export class CommunityController {
  public static async getCommunityByGameId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gameId = parseInt(req.params.gameId, 10);
      if (isNaN(gameId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid game ID'
        });
        return;
      }

      const community = await CommunityService.getCommunityByGameId(gameId);
      res.status(200).json({
        status: 'success',
        data: { community }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCommunityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const communityId = parseInt(req.params.id, 10);
      if (isNaN(communityId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid community ID'
        });
        return;
      }

      const community = await CommunityService.getCommunityById(communityId);
      res.status(200).json({
        status: 'success',
        data: { community }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCommunityPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const communityId = parseInt(req.params.communityId, 10);
      if (isNaN(communityId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid community ID'
        });
        return;
      }

      const posts = await CommunityService.getCommunityPosts(communityId);
      res.status(200).json({
        status: 'success',
        data: { posts }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const communityId = parseInt(req.params.communityId, 10);
      if (isNaN(communityId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid community ID'
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Unauthorized'
        });
        return;
      }

      const { title, content } = req.body;
      const post = await CommunityService.createPost(communityId, userId, { title, content });

      res.status(201).json({
        status: 'success',
        message: 'Question posted successfully',
        data: { post }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getPostWithComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const postId = parseInt(req.params.postId, 10);
      if (isNaN(postId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid post ID'
        });
        return;
      }

      const result = await CommunityService.getPostWithComments(postId);
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const postId = parseInt(req.params.postId, 10);
      if (isNaN(postId)) {
        res.status(400).json({
          status: 'fail',
          message: 'Invalid post ID'
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Unauthorized'
        });
        return;
      }

      const { content, parent_comment_id } = req.body;
      const parsedParentId =
        parent_comment_id !== undefined && parent_comment_id !== null && parent_comment_id !== ''
          ? parseInt(parent_comment_id, 10)
          : null;

      const comment = await CommunityService.createComment(postId, userId, {
        content,
        parent_comment_id: parsedParentId
      });

      res.status(201).json({
        status: 'success',
        message: 'Comment posted successfully',
        data: { comment }
      });
    } catch (error) {
      next(error);
    }
  }
}
