import crypto from 'crypto';
import { ensureDb } from './db.js';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'owner' | 'member';
  created_at: string;
  updated_at: string;
}

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'nova-salt-v1', 100000, 64, 'sha512').toString('hex');
}

function generateId(): string {
  return crypto.randomBytes(12).toString('base64url');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function createUser(email: string, password: string, name: string) {
  const db = ensureDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('Email already registered');
  
  const id = generateId();
  const now = new Date().toISOString();
  
  db.prepare(`INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, 'owner', ?, ?)`)
    .run(id, email, name, hashPassword(password), now, now);
  
  const token = createSession(id);
  const user = db.prepare('SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?').get(id) as Omit<User, 'password_hash'>;
  return { user, token };
}

export function loginUser(email: string, password: string) {
  const db = ensureDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  if (!row) throw new Error('Invalid email or password');
  if (row.password_hash !== hashPassword(password)) throw new Error('Invalid email or password');
  
  const token = createSession(row.id);
  const user = db.prepare('SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?').get(row.id) as Omit<User, 'password_hash'>;
  return { user, token };
}

function createSession(userId: string): string {
  const db = ensureDb();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO auth_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(generateId(), userId, token, expiresAt, new Date().toISOString());
  return token;
}

export function validateToken(token: string) {
  const db = ensureDb();
  return db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.created_at, u.updated_at 
    FROM auth_tokens t JOIN users u ON t.user_id = u.id
    WHERE t.token = ? AND t.expires_at > datetime('now')
  `).get(token) as Omit<User, 'password_hash'> | undefined;
}

export function updateUser(userId: string, updates: Record<string, string>) {
  const db = ensureDb();
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), userId];
  db.prepare(`UPDATE users SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...values);
  return db.prepare('SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?').get(userId);
}

export function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const db = ensureDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
  if (!user || user.password_hash !== hashPassword(oldPassword)) throw new Error('Current password is incorrect');
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hashPassword(newPassword), userId);
}

export function initUserTables() {
  const db = ensureDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'owner',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
  `);
}
