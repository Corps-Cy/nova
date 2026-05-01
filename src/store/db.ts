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

export interface ProviderConfig {
  api_key: string;
  base_url: string;
  default_model: string;
}

export interface NovaConfig {
  // Legacy keys (kept for backward compat)
  openai_api_key?: string;
  openai_base_url?: string;
  anthropic_api_key?: string;
  // Provider presets: { provider_name: ProviderConfig }
  providers?: Record<string, ProviderConfig>;
  // Active provider
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
  // Deep merge for providers
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
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini', 'o3-mini'],
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
    name: 'deepseek',
    label: 'DeepSeek 深度求索',
    base_url: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    config_key_hint: 'sk-...',
  },
  {
    name: 'zhipu',
    label: '智谱 GLM',
    base_url: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-plus', 'glm-4-flash', 'glm-4-long'],
    config_key_hint: '...',
  },
  {
    name: 'moonshot',
    label: 'Moonshot 月之暗面',
    base_url: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
    config_key_hint: 'sk-...',
  },
  {
    name: 'qwen',
    label: '通义千问 Qwen',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
    config_key_hint: 'sk-...',
  },
  {
    name: 'yi',
    label: '零一万物 Yi',
    base_url: 'https://api.lingyiwanwu.com/v1',
    models: ['yi-lightning', 'yi-large', 'yi-medium'],
    config_key_hint: '...',
  },
  {
    name: 'minimax',
    label: 'MiniMax',
    base_url: 'https://api.minimax.chat/v1',
    models: ['MiniMax-Text-01', 'abab6.5s-chat'],
    config_key_hint: '...',
  },
  {
    name: 'doubao',
    label: '豆包 Doubao (字节)',
    base_url: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-pro-32k', 'doubao-pro-128k'],
    config_key_hint: '...',
  },
  {
    name: 'siliconflow',
    label: 'SiliconFlow 硅基流动',
    base_url: 'https://api.siliconflow.cn/v1',
    models: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'THUDM/glm-4-9b-chat'],
    config_key_hint: 'sk-...',
  },
  {
    name: 'spark',
    label: '讯飞星火 Spark',
    base_url: 'https://spark-api-open.xf-yun.com/v1',
    models: ['generalv3.5', 'generalv3', '4.0Ultra'],
    config_key_hint: '...',
  },
  {
    name: 'baichuan',
    label: '百川 Baichuan',
    base_url: 'https://api.baichuan-ai.com/v1',
    models: ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan3-Turbo-128k'],
    config_key_hint: 'sk-...',
  },
];

/** Resolve provider config for a given model string */
export function resolveProvider(config: NovaConfig, model?: string): { apiKey: string; baseUrl: string; resolvedModel: string; isAnthropic: boolean } {
  const useProvider = config.default_provider || 'openai';
  const useModel = model || config.default_model || 'gpt-4o-mini';

  // 1. If model name suggests a specific provider, try to match
  if (useModel.includes('claude')) {
    const key = config.providers?.anthropic?.api_key || config.anthropic_api_key || process.env.ANTHROPIC_API_KEY || '';
    if (key) return { apiKey: key, baseUrl: 'anthropic', resolvedModel: useModel, isAnthropic: true };
  }

  // 2. Try to find a provider preset that contains this model
  for (const preset of PROVIDER_PRESETS) {
    if (preset.models.includes(useModel) && config.providers?.[preset.name]?.api_key) {
      const prov = config.providers[preset.name];
      return { apiKey: prov.api_key, baseUrl: prov.base_url, resolvedModel: useModel, isAnthropic: preset.name === 'anthropic' };
    }
  }

  // 3. Fall back to active provider
  const activeConfig = config.providers?.[useProvider];
  if (activeConfig?.api_key) {
    return {
      apiKey: activeConfig.api_key,
      baseUrl: activeConfig.base_url,
      resolvedModel: useModel,
      isAnthropic: useProvider === 'anthropic' || activeConfig.base_url === 'anthropic',
    };
  }

  // 4. Legacy fallback: openai config or env
  const legacyKey = config.openai_api_key || process.env.OPENAI_API_KEY || '';
  const legacyUrl = config.openai_base_url || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  if (legacyKey) return { apiKey: legacyKey, baseUrl: legacyUrl, resolvedModel: useModel, isAnthropic: false };

  return { apiKey: '', baseUrl: '', resolvedModel: useModel, isAnthropic: false };
}
