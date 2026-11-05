import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { apiRouter } from './api.routes.js';

export const rootRouter = Router();

rootRouter.use('/health', healthRouter);
rootRouter.use('/api/v1', apiRouter);
