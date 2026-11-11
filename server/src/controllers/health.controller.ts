import type { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service.js';
import { initDb } from '../db/init.js';

export class HealthController {
  public static getHealth(_req: Request, res: Response): void {
    const health = HealthService.getSystemHealth();
    res.status(200).json(health);
  }

  public static async getDatabaseHealth(_req: Request, res: Response, _next?: NextFunction): Promise<void> {
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

  public static getEnvDiagnostic(_req: Request, res: Response): void {
    const envKeys = Object.keys(process.env);
    const dbKeys = envKeys
      .filter((k) => k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('PRISMA'))
      .map((k) => {
        const val = process.env[k] || '';
        const masked = val.replace(/:([^:@]+)@/, ':***@');
        return { key: k, value: masked.length > 50 ? `${masked.slice(0, 30)}...` : masked };
      });

    res.status(200).json({
      environment: process.env.NODE_ENV || 'unknown',
      isVercel: Boolean(process.env.VERCEL),
      detectedDbKeys: dbKeys
    });
  }

  public static async initDatabase(_req: Request, res: Response): Promise<void> {
    try {
      await initDb();
      res.status(200).json({
        status: 'ok',
        message: 'Database schema and default admin initialized successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Database initialization failed'
      });
    }
  }
}

