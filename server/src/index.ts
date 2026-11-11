import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initDb } from './db/init.js';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3000;

let dbInitPromise: Promise<void> | null = null;
export const ensureDbInitialized = async (): Promise<void> => {
  if (!dbInitPromise) {
    dbInitPromise = initDb()
      .then(() => {
        console.log('📦 Database schema initialized successfully');
      })
      .catch((err) => {
        console.warn('⚠️ Warning initializing database schema on startup:', err);
        dbInitPromise = null;
      });
  }
  return dbInitPromise;
};

const startServer = async () => {
  await ensureDbInitialized();
  app.listen(PORT, () => {
    console.log(`🚀 MetaGaming server listening on port ${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

// Support both ESM and CJS consumers on Vercel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  module.exports.default = app;
}

export default app;
