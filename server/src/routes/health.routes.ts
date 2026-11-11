import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', HealthController.getHealth);
healthRouter.get('/db', HealthController.getDatabaseHealth);
healthRouter.get('/env', HealthController.getEnvDiagnostic);
healthRouter.get('/init-db', HealthController.initDatabase);
healthRouter.post('/init-db', HealthController.initDatabase);

