import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { apiRouter } from './api.routes.js';
import { authRouter } from './auth.routes.js';

export const rootRouter = Router();

rootRouter.use('/health', healthRouter);
rootRouter.use('/api/v1', apiRouter);
rootRouter.use('/api/v1/auth', authRouter);
