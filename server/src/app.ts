import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';

export const createApp = (): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Base API information
  app.get('/api/v1', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'MetaGaming API',
      version: '1.0.0',
      description: 'Platform API for gamers, communities, chats, and collections'
    });
  });

  return app;
};
