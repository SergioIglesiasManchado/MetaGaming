import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
}

interface UserDbRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export class AuthService {
  private static getJwtSecret(): string {
    return process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
  }

  public static generateToken(user: UserProfile): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_admin: user.is_admin
      },
      this.getJwtSecret(),
      { expiresIn: '7d' }
    );
  }

  public static async register(input: RegisterInput): Promise<AuthResponse> {
    const { username, email, password, role = 'user' } = input;

    // 1. Validation checks
    if (!username || username.trim().length < 3) {
      const err = new Error('Username must be at least 3 characters long');
      (err as any).statusCode = 400;
      throw err;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const err = new Error('A valid email address is required');
      (err as any).statusCode = 400;
      throw err;
    }

    if (!password || password.length < 8) {
      const err = new Error('Password must be at least 8 characters long');
      (err as any).statusCode = 400;
      throw err;
    }

    const normalizedRole = role === 'admin' ? 'admin' : 'user';

    // 2. Check for duplicate username or email
    const existing = await query<UserDbRow>(
      'SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [username.trim(), email.trim()]
    );

    if (existing.rows.length > 0) {
      const isDuplicateUsername = existing.rows.some(
        (r) => r.username.toLowerCase() === username.trim().toLowerCase()
      );
      const err = new Error(
        isDuplicateUsername ? 'Username is already taken' : 'Email is already registered'
      );
      (err as any).statusCode = 409;
      throw err;
    }

    // 3. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert user
    const insertResult = await query<UserDbRow>(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at, updated_at`,
      [username.trim(), email.trim().toLowerCase(), passwordHash, normalizedRole]
    );

    const row = insertResult.rows[0];
    const userProfile: UserProfile = {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      is_admin: row.role === 'admin',
      created_at: row.created_at
    };

    const token = this.generateToken(userProfile);

    return {
      user: userProfile,
      token
    };
  }

  public static async login(input: LoginInput): Promise<AuthResponse> {
    const { usernameOrEmail, password } = input;

    if (!usernameOrEmail || !password) {
      const err = new Error('Username/email and password are required');
      (err as any).statusCode = 400;
      throw err;
    }

    // Search user by username or email
    const result = await query<UserDbRow>(
      `SELECT id, username, email, password_hash, role, created_at
       FROM users
       WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
      [usernameOrEmail.trim()]
    );

    const user = result.rows[0];
    if (!user) {
      const err = new Error('Invalid credentials');
      (err as any).statusCode = 401;
      throw err;
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const err = new Error('Invalid credentials');
      (err as any).statusCode = 401;
      throw err;
    }

    const userProfile: UserProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_admin: user.role === 'admin',
      created_at: user.created_at
    };

    const token = this.generateToken(userProfile);

    return {
      user: userProfile,
      token
    };
  }

  public static async getProfile(userId: number): Promise<UserProfile> {
    const result = await query<UserDbRow>(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_admin: user.role === 'admin',
      created_at: user.created_at
    };
  }
}
