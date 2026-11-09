import { query } from '../db/index.js';
import type { UserProfile } from './auth.service.js';

interface UserDbRow {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export class UserService {
  public static async searchUsers(searchQuery?: string, limit: number = 50): Promise<UserProfile[]> {
    let sql = 'SELECT id, username, email, role, created_at, updated_at FROM users';
    const params: unknown[] = [];

    if (searchQuery && searchQuery.trim().length > 0) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`);
      sql += ' WHERE LOWER(username) LIKE $1 OR LOWER(email) LIKE $1';
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
      created_at: row.created_at
    }));
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
       RETURNING id, username, email, role, created_at, updated_at`,
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
      created_at: updatedUser.created_at
    };
  }
}
