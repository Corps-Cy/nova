import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import * as sqliteVec from 'sqlite-vec';

const DATA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '/root', '.nova');
const DB_PATH = path.join(DATA_DIR, 'nova.db');

let db: Database.Database;

export function ensureDb(): Database.Database.Database {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Load sqlite-vec extension
  sqliteVec.load(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      model TEXT DEFAULT '',
      api_key TEXT DEFAULT '',
      base_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS document (
      id TEXT PRIMARY KEY,
      kb_id TEXT NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      source_type TEXT DEFAULT 'file',
      source_url TEXT DEFAULT '',
      chunk_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ready',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chunk (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS api_key (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '',
      kb_id TEXT REFERENCES knowledge_base(id) ON DELETE SET NULL,
      rate_limit INTEGER DEFAULT 100,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_log (
      id TEXT PRIMARY KEY,
      api_key_id TEXT,
      kb_id TEXT NOT NULL,
      query TEXT,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_doc_kb ON document(kb_id);
    CREATE INDEX IF NOT EXISTS idx_chunk_doc ON chunk(doc_id);
    CREATE INDEX IF NOT EXISTS idx_usage_kb ON usage_log(kb_id);
    CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_log(created_at);

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

export function getConfigDir() { return DATA_DIR; }
export function getDbPath() { return DB_PATH; }
export { nanoid };
