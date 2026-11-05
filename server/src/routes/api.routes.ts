import { Router } from 'express';
import { ApiController } from '../controllers/api.controller.js';

export const apiRouter = Router();

apiRouter.get('/', ApiController.getInfo);
