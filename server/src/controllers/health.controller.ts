import type { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service.js';

export class HealthController {
  public static getHealth(_req: Request, res: Response): void {
    const health = HealthService.getSystemHealth();
    res.status(200).json(health);
  }

  public static async getDatabaseHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbHealth = await HealthService.getDatabaseHealth();
      res.status(200).json({
        status: 'ok',
        database: 'connected',
        name: dbHealth.database,
        version: dbHealth.version,
        timestamp: dbHealth.timestamp
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error'
      });
    }
  }
}
