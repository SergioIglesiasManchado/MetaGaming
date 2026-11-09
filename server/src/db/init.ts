import bcrypt from 'bcryptjs';
import { query } from './index.js';

export const initDb = async (): Promise<void> => {
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;

  await query(createUsersTableQuery);

  // Seed or ensure default admin credentials (admin : admin)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin', salt);

  const adminCheck = await query('SELECT id FROM users WHERE LOWER(username) = $1', ['admin']);
  if (adminCheck.rows.length === 0) {
    await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', 'admin@metagaming.com', passwordHash, 'admin']
    );
  } else {
    await query(
      `UPDATE users
       SET password_hash = $1, role = 'admin', updated_at = NOW()
       WHERE LOWER(username) = 'admin'`,
      [passwordHash]
    );
  }
};
