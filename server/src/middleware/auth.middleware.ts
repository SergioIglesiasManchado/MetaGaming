import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import type { UserProfile } from '../services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication token required'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';

  try {
    const decoded = jwt.verify(token, jwtSecret) as UserProfile;
    // Check if user account is banned
    const banCheck = await query('SELECT is_banned FROM users WHERE id = $1', [decoded.id]);
    if (banCheck.rows.length === 0 || banCheck.rows[0].is_banned) {
      res.status(403).json({
        status: 'error',
        message: 'This account has been banned by an administrator.'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
    return;
  }
  next();
};
