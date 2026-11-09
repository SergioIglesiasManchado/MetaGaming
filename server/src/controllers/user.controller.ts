import type { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class UserController {
  public static async searchUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchQuery = (req.query.q as string) || (req.query.search as string) || '';
      const users = await UserService.searchUsers(searchQuery);

      res.status(200).json({
        status: 'ok',
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({ status: 'error', message: 'Invalid user ID' });
        return;
      }

      const { role } = req.body;
      if (!role) {
        res.status(400).json({ status: 'error', message: 'Role is required' });
        return;
      }

      const updatedUser = await UserService.updateUserRole(userId, role);

      res.status(200).json({
        status: 'ok',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
}
