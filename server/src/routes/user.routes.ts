import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

export const userRouter = Router();

userRouter.get('/', requireAuth, requireAdmin, UserController.searchUsers);
userRouter.patch('/:id/role', requireAuth, requireAdmin, UserController.updateRole);
