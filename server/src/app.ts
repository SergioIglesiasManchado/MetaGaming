import express, { type Application } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import os from "os";
import { rootRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const createApp = (): Application => {
  const app = express();
  app.get("/ping", (_req, res) => {
    res.json({ ok: true, vercel: !!process.env.VERCEL });
  });
  app.use(cors());
  app.use(express.json());

  // Static serving for uploaded game images (use /tmp on serverless environments)
  const uploadsDir = process.env.VERCEL
    ? path.resolve(os.tmpdir(), "uploads")
    : path.resolve(process.cwd(), "uploads");

  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch {
      // Ignored for read-only environments
    }
  }
  app.use("/uploads", express.static(uploadsDir));

  // Mount application routes
  app.use("/", rootRouter);

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
