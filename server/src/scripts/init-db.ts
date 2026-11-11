import { initDb } from '../db/init.js';

initDb()
  .then(() => {
    console.log('✅ Database schema and admin initialized successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });
