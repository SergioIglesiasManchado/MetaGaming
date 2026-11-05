import type { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class AuthController {
  public static async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, role } = req.body;
      const result = await AuthService.register({ username, email, password, role });
      res.status(201).json({
        status: 'ok',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { usernameOrEmail, password } = req.body;
      const result = await AuthService.login({ usernameOrEmail, password });
      res.status(200).json({
        status: 'ok',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }
      const user = await AuthService.getProfile(req.user.id);
      res.status(200).json({
        status: 'ok',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}
