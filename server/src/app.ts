import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { checkDbConnection } from './db/index.js';

export const createApp = (): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // General server health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Database reachability and status health check endpoint
  app.get('/health/db', async (_req: Request, res: Response) => {
    try {
      const dbHealth = await checkDbConnection();
      res.status(200).json({
        status: 'ok',
        database: 'connected',
        name: dbHealth.database,
        timestamp: dbHealth.timestamp
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error'
      });
    }
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
