import { ensureDb } from '../store/db.js';
import { nanoid } from '../store/db.js';

/**
 * Check rate limit for an API key.
 * Returns { allowed: boolean, remaining: number, reset_at?: string }
 */
export function checkRateLimit(apiKeyId: string, limit: number): { allowed: boolean; remaining: number } {
  const db = ensureDb();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 1000).toISOString(); // 1 min window

  const row = db.prepare(`
    SELECT COUNT(*) as count FROM usage_log
    WHERE api_key_id = ? AND created_at > ?
  `).get(apiKeyId, windowStart) as any;

  const used = row?.count || 0;
  const remaining = Math.max(0, limit - used);

  if (used >= limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining };
}

/**
 * Log API usage.
 */
export function logUsage(data: {
  api_key_id?: string;
  kb_id: string;
  query: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms: number;
}) {
  const db = ensureDb();
  db.prepare(`
    INSERT INTO usage_log (id, api_key_id, kb_id, query, input_tokens, output_tokens, latency_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    nanoid(12),
    data.api_key_id || null,
    data.kb_id,
    data.query,
    data.input_tokens || 0,
    data.output_tokens || 0,
    data.latency_ms
  );
}

/**
 * Get usage stats for a knowledge base.
 */
export function getUsageStats(kbId: string, days: number = 30) {
  const db = ensureDb();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const total = db.prepare(`
    SELECT COUNT(*) as queries, COALESCE(SUM(latency_ms), 0) as total_latency,
           COALESCE(AVG(latency_ms), 0) as avg_latency
    FROM usage_log WHERE kb_id = ? AND created_at > ?
  `).get(kbId, since) as any;

  const daily = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as queries, AVG(latency_ms) as avg_latency
    FROM usage_log WHERE kb_id = ? AND created_at > ?
    GROUP BY date(created_at) ORDER BY date(created_at)
  `).all(kbId, since) as any[];

  const topQueries = db.prepare(`
    SELECT query, COUNT(*) as count
    FROM usage_log WHERE kb_id = ? AND created_at > ?
    GROUP BY query ORDER BY count DESC LIMIT 10
  `).all(kbId, since) as any[];

  return { total, daily, topQueries };
}

/**
 * Get overall usage stats (all KBs).
 */
export function getGlobalStats(days: number = 30) {
  const db = ensureDb();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const total = db.prepare(`
    SELECT COUNT(*) as queries, COUNT(DISTINCT kb_id) as active_kbs,
           COALESCE(AVG(latency_ms), 0) as avg_latency
    FROM usage_log WHERE created_at > ?
  `).get(since) as any;

  const daily = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as queries
    FROM usage_log WHERE created_at > ?
    GROUP BY date(created_at) ORDER BY date(created_at)
  `).all(since) as any[];

  return { total, daily };
}
