import { query } from '../db/index.js';
import type { UserProfile } from './auth.service.js';

interface UserDbRow {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export class UserService {
  public static async searchUsers(searchQuery?: string, limit: number = 50): Promise<UserProfile[]> {
    let sql = 'SELECT id, username, email, role, is_banned, created_at, updated_at FROM users WHERE is_banned = FALSE';
    const params: unknown[] = [];

    if (searchQuery && searchQuery.trim().length > 0) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`);
      sql += ' AND (LOWER(username) LIKE $1 OR LOWER(email) LIKE $1)';
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query<UserDbRow>(sql, params);

    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      is_admin: row.role === 'admin',
      is_banned: row.is_banned,
      created_at: row.created_at
    }));
  }

  public static async getBannedUsers(searchQuery?: string, limit: number = 50): Promise<UserProfile[]> {
    let sql = 'SELECT id, username, email, role, is_banned, created_at, updated_at FROM users WHERE is_banned = TRUE';
    const params: unknown[] = [];

    if (searchQuery && searchQuery.trim().length > 0) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`);
      sql += ' AND (LOWER(username) LIKE $1 OR LOWER(email) LIKE $1)';
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query<UserDbRow>(sql, params);

    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      is_admin: row.role === 'admin',
      is_banned: row.is_banned,
      created_at: row.created_at
    }));
  }

  public static async banUser(userId: number, currentAdminId: number): Promise<UserProfile> {
    if (userId === currentAdminId) {
      const err = new Error('You cannot ban your own account');
      (err as any).statusCode = 400;
      throw err;
    }

    const check = await query<UserDbRow>('SELECT id, role, is_banned FROM users WHERE id = $1', [userId]);
    const targetUser = check.rows[0];
    if (!targetUser) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (targetUser.role === 'admin') {
      const err = new Error('Administrators cannot be banned');
      (err as any).statusCode = 403;
      throw err;
    }

    const result = await query<UserDbRow>(
      `UPDATE users
       SET is_banned = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING id, username, email, role, is_banned, created_at, updated_at`,
      [userId]
    );

    const updated = result.rows[0];
    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      is_admin: updated.role === 'admin',
      is_banned: updated.is_banned,
      created_at: updated.created_at
    };
  }

  public static async unbanUser(userId: number): Promise<UserProfile> {
    const result = await query<UserDbRow>(
      `UPDATE users
       SET is_banned = FALSE, updated_at = NOW()
       WHERE id = $1
       RETURNING id, username, email, role, is_banned, created_at, updated_at`,
      [userId]
    );

    const updated = result.rows[0];
    if (!updated) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      is_admin: updated.role === 'admin',
      is_banned: updated.is_banned,
      created_at: updated.created_at
    };
  }

  public static async updateUserRole(userId: number, role: 'user' | 'admin'): Promise<UserProfile> {
    if (!['user', 'admin'].includes(role)) {
      const err = new Error('Invalid role specified. Must be either "user" or "admin".');
      (err as any).statusCode = 400;
      throw err;
    }

    const result = await query<UserDbRow>(
      `UPDATE users
       SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, role, is_banned, created_at, updated_at`,
      [role, userId]
    );

    const updatedUser = result.rows[0];
    if (!updatedUser) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      is_admin: updatedUser.role === 'admin',
      is_banned: updatedUser.is_banned,
      created_at: updatedUser.created_at
    };
  }
}
