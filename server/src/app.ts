import express, { type Application } from 'express';
import cors from 'cors';
import { rootRouter } from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = (): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount application routes
  app.use('/', rootRouter);

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
};
