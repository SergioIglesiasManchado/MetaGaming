import type { Request, Response } from 'express';

export class ApiController {
  public static getInfo(_req: Request, res: Response): void {
    res.status(200).json({
      name: 'MetaGaming API',
      version: '1.0.0',
      description: 'Platform API for gamers, communities, chats, and collections',
      endpoints: {
        health: '/health',
        dbHealth: '/health/db',
        apiRoot: '/api/v1'
      }
    });
  }
}
