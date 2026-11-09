import express, { type Application } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { rootRouter } from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = (): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Static serving for uploaded game images
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Mount application routes
  app.use('/', rootRouter);

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
};
