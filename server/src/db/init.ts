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
      is_banned BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);

    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      platforms TEXT[] NOT NULL DEFAULT '{}',
      photos TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_games_title ON games(LOWER(title));

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT unique_game_user_review UNIQUE (game_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_game_id ON reviews(game_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

    CREATE TABLE IF NOT EXISTS game_follows (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT unique_user_game_follow UNIQUE (user_id, game_id)
    );

    CREATE INDEX IF NOT EXISTS idx_game_follows_user_id ON game_follows(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_follows_game_id ON game_follows(game_id);

    CREATE TABLE IF NOT EXISTS communities (
      id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_communities_game_id ON communities(game_id);

    CREATE TABLE IF NOT EXISTS community_posts (
      id SERIAL PRIMARY KEY,
      community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);
    CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);

    CREATE TABLE IF NOT EXISTS community_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_comment_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON community_comments(parent_comment_id);
    CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);

    INSERT INTO communities (game_id, name, description)
    SELECT id, title, description
    FROM games
    WHERE id NOT IN (SELECT game_id FROM communities)
    ON CONFLICT (game_id) DO NOTHING;
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
