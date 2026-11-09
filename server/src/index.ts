import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initDb } from './db/init.js';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDb();
    console.log('📦 Database schema initialized successfully');
  } catch (err) {
    console.warn('⚠️ Warning initializing database schema on startup:', err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 MetaGaming server listening on port ${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
