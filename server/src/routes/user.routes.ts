import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

export const userRouter = Router();

userRouter.get('/', requireAuth, requireAdmin, UserController.searchUsers);
userRouter.get('/banned', requireAuth, requireAdmin, UserController.getBannedUsers);
userRouter.patch('/:id/role', requireAuth, requireAdmin, UserController.updateRole);
userRouter.patch('/:id/ban', requireAuth, requireAdmin, UserController.banUser);
userRouter.patch('/:id/unban', requireAuth, requireAdmin, UserController.unbanUser);
