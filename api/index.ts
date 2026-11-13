/**
 * Vercel Serverless Function entrypoint.
 *
 * @vercel/node compiles this TypeScript file and routes all API requests here.
 * We re-export the Express app instance so Vercel wraps it as a serverless handler.
 */
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from '../server/src/app.js';

const app = createApp();

export default app;
