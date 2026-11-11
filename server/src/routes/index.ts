import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { apiRouter } from './api.routes.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import gameRouter from './game.routes.js';
import communityRouter from './community.routes.js';

export const rootRouter = Router();

rootRouter.use('/health', healthRouter);
rootRouter.use('/api/health', healthRouter);
rootRouter.use('/api/v1/health', healthRouter);
rootRouter.use('/api/v1', apiRouter);
rootRouter.use('/api/v1/auth', authRouter);
rootRouter.use('/api/v1/users', userRouter);
rootRouter.use('/api/v1/games', gameRouter);
rootRouter.use('/api/v1/communities', communityRouter);
