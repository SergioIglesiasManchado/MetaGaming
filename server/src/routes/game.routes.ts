import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { GameController } from '../controllers/game.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Configure multer for disk storage (use /tmp on serverless environments like Vercel)
const uploadsDir = process.env.VERCEL
  ? path.resolve(os.tmpdir(), 'uploads')
  : path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {
    // Ignored in read-only filesystems
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `game-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'));
    }
  }
});

// Image upload for games (admin only)
router.post(
  '/upload-image',
  requireAuth,
  requireAdmin,
  upload.single('image') as any,
  GameController.uploadImage
);

// Followed games routes (specific routes before /:id)
router.get('/followed', requireAuth, GameController.getFollowedGames);

// Public routes for games
router.get('/', GameController.searchGames);
router.get('/:id', GameController.getGameById);

// Admin-only route to create games
router.post('/', requireAuth, requireAdmin, GameController.createGame);

// Follow status & toggle routes
router.get('/:id/follow-status', requireAuth, GameController.getFollowStatus);
router.post('/:id/follow', requireAuth, GameController.followGame);
router.delete('/:id/follow', requireAuth, GameController.unfollowGame);

// Reviews routes
router.get('/:id/reviews', GameController.getGameReviews);
router.post('/:id/reviews', requireAuth, GameController.createOrUpdateReview);

export default router;
