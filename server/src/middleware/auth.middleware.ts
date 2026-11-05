import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserProfile } from '../services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};
