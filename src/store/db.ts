import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

// === Database ===
const DB_DIR = join(homedir(), '.nova');
const DB_PATH = join(DB_DIR, 'data.db');

mkdirSync(DB_DIR, { recursive: true });

let _db: SqlJsDatabase | null = null;

async function initDb() {
  if (_db) return _db;
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const buf = readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }
  migrate();
  return _db;
}

function saveDb() {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

/** Synchronous-style wrapper (calls are actually async but we await internally) */
let _ready: Promise<SqlJsDatabase> | null = null;

function getDbAsync(): Promise<SqlJsDatabase> {
  if (!_ready) _ready = initDb();
  return _ready;
}

/** Lightweight prepare().run() / .all() / .get() adapter matching better-sqlite3 API */
class Statement {
  private sql: string;
  constructor(private db: SqlJsDatabase, sql: string) { this.sql = sql; }

  run(...params: any[]) {
    this.db.run(this.sql, params);
    saveDb();
  }

  all(...params: any[]): any[] {
    const results = this.db.exec(this.sql, params);
    if (results.length === 0) return [];
    const { columns, values } = results[0];
    return values.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  get(...params: any[]): any {
    const rows = this.all(...params);
    return rows.length > 0 ? rows[0] : undefined;
  }
}

export interface NovaDb {
  prepare(sql: string): Statement;
  exec(sql: string): void;
}

/** Get DB synchronously (must be awaited from caller first via ensureDb) */
let _cachedDb: NovaDb | null = null;
let _initPromise: Promise<NovaDb> | null = null;

export async function ensureDb(): Promise<NovaDb> {
  if (_cachedDb) return _cachedDb;
  if (!_initPromise) {
    _initPromise = initDb().then(sqlDb => {
      _cachedDb = {
        prepare(sql: string) { return new Statement(sqlDb, sql); },
        exec(sql: string) { sqlDb.run(sql); saveDb(); },
      };
      return _cachedDb;
    });
  }
  return _initPromise;
}

// Backward compat: sync wrapper that lazy-loads
// NOTE: callers must now use `await ensureDb()` — but for convenience we
// provide a sync fallback that throws a helpful message
export function getDb(): NovaDb {
  if (_cachedDb) return _cachedDb;
  throw new Error('Database not initialized. Call ensureDb() first (async).');
}

function migrate() {
  if (!_db) return;
  _db.run(`
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
  saveDb();
}

// === Config ===
const CONFIG_PATH = join(DB_DIR, 'config.json');

export interface ProviderConfig {
  api_key: string;
  base_url: string;
  default_model: string;
}

export interface NovaConfig {
  openai_api_key?: string;
  openai_base_url?: string;
  anthropic_api_key?: string;
  providers?: Record<string, ProviderConfig>;
  default_provider?: string;
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
  if (partial.providers) {
    config.providers = { ...config.providers, ...partial.providers };
    delete partial.providers;
  }
  Object.assign(config, partial);
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getConfigDir() {
  return DB_DIR;
}

// === Provider Presets ===

export interface ProviderPreset {
  name: string;
  label: string;
  base_url: string;
  models: string[];
  config_key_hint: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'openai',
    label: 'OpenAI',
    base_url: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o3-mini'],
    config_key_hint: 'sk-...',
  },
  {
    name: 'anthropic',
    label: 'Anthropic Claude',
    base_url: 'anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    config_key_hint: 'sk-ant-...',
  },
  {
    name: 'zhipu',
    label: '智谱 GLM',
    base_url: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-5.1', 'glm-5', 'glm-5-turbo', 'glm-4.7', 'glm-4.7-flash', 'glm-4.7-flashx'],
    config_key_hint: '...',
  },
  {
    name: 'qwen',
    label: '通义千问 Qwen',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen3.6-max-preview', 'qwen3.6-plus', 'qwen3.6-flash'],
    config_key_hint: 'sk-...',
  },
  {
    name: 'minimax',
    label: 'MiniMax',
    base_url: 'https://api.minimax.chat/v1',
    models: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5'],
    config_key_hint: '...',
  },
];

export function resolveProvider(config: NovaConfig, model?: string): { apiKey: string; baseUrl: string; resolvedModel: string; isAnthropic: boolean } {
  const useProvider = config.default_provider || 'openai';
  const useModel = model || config.default_model || 'gpt-4o-mini';

  if (useModel.includes('claude')) {
    const key = config.providers?.anthropic?.api_key || config.anthropic_api_key || process.env.ANTHROPIC_API_KEY || '';
    if (key) return { apiKey: key, baseUrl: 'anthropic', resolvedModel: useModel, isAnthropic: true };
  }

  for (const preset of PROVIDER_PRESETS) {
    if (preset.models.includes(useModel) && config.providers?.[preset.name]?.api_key) {
      const prov = config.providers[preset.name];
      return { apiKey: prov.api_key, baseUrl: prov.base_url, resolvedModel: useModel, isAnthropic: preset.name === 'anthropic' };
    }
  }

  const activeConfig = config.providers?.[useProvider];
  if (activeConfig?.api_key) {
    return { apiKey: activeConfig.api_key, baseUrl: activeConfig.base_url, resolvedModel: useModel, isAnthropic: useProvider === 'anthropic' || activeConfig.base_url === 'anthropic' };
  }

  const legacyKey = config.openai_api_key || process.env.OPENAI_API_KEY || '';
  const legacyUrl = config.openai_base_url || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  if (legacyKey) return { apiKey: legacyKey, baseUrl: legacyUrl, resolvedModel: useModel, isAnthropic: false };

  return { apiKey: '', baseUrl: '', resolvedModel: useModel, isAnthropic: false };
}
