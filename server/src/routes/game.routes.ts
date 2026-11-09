import { Router } from 'express';
import { GameController } from '../controllers/game.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes for games
router.get('/', GameController.searchGames);
router.get('/:id', GameController.getGameById);

// Admin-only route to create games
router.post('/', requireAuth, requireAdmin, GameController.createGame);

// Reviews routes
router.get('/:id/reviews', GameController.getGameReviews);
router.post('/:id/reviews', requireAuth, GameController.createOrUpdateReview);

export default router;
