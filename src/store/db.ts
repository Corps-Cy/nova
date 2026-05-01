import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

// === Database ===
const DB_DIR = join(homedir(), '.nova');
const DB_PATH = join(DB_DIR, 'data.db');

mkdirSync(DB_DIR, { recursive: true });

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    migrate();
  }
  return db;
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS client (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT DEFAULT '',
      contact TEXT DEFAULT '',
      email TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES client(id),
      name TEXT NOT NULL,
      status TEXT DEFAULT 'requirement',
      budget REAL DEFAULT 0,
      received REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      project_id TEXT DEFAULT NULL REFERENCES project(id),
      time_spent REAL DEFAULT 0,
      due_date TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prompt_template (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id);
  `);
}

// === Config ===
const CONFIG_PATH = join(DB_DIR, 'config.json');

interface NovaConfig {
  openai_api_key?: string;
  openai_base_url?: string;
  anthropic_api_key?: string;
  default_model?: string;
}

export function getConfig(): NovaConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export function setConfig(partial: Partial<NovaConfig>) {
  const config = getConfig();
  Object.assign(config, partial);
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getConfigDir() {
  return DB_DIR;
}
