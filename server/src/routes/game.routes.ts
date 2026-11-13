import { Router } from "express";
import multer from "multer";
import { GameController } from "../controllers/game.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB (Vercel rejects bodies over ~4.5 MB)
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed"));
    }
  },
});

// Image upload for games (admin only)
router.post(
  "/upload-image",
  requireAuth,
  requireAdmin,
  upload.single("image") as any,
  GameController.uploadImage,
);

// Followed games routes (specific routes before /:id)
router.get("/followed", requireAuth, GameController.getFollowedGames);

// Public routes for games
router.get("/", GameController.searchGames);
router.get("/:id", GameController.getGameById);

// Admin-only route to create games
router.post("/", requireAuth, requireAdmin, GameController.createGame);

// Follow status & toggle routes
router.get("/:id/follow-status", requireAuth, GameController.getFollowStatus);
router.post("/:id/follow", requireAuth, GameController.followGame);
router.delete("/:id/follow", requireAuth, GameController.unfollowGame);

// Reviews routes
router.get("/:id/reviews", GameController.getGameReviews);
router.post("/:id/reviews", requireAuth, GameController.createOrUpdateReview);

export default router;
