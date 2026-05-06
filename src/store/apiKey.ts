import { ensureDb, nanoid } from './db.js';

export function createApiKey(data: { name?: string; kb_id?: string; rate_limit?: number }) {
  const db = ensureDb();
  const id = nanoid(12);
  const key = `nova_${nanoid(32)}`;
  db.prepare(`INSERT INTO api_key (id, key, name, kb_id, rate_limit) VALUES (?, ?, ?, ?, ?)`)
    .run(id, key, data.name || '', data.kb_id || null, data.rate_limit || 100);
  return { id, key, ...data };
}

export function listApiKeys() {
  const db = ensureDb();
  return db.prepare(`
    SELECT ak.*, kb.name as kb_name
    FROM api_key ak
    LEFT JOIN knowledge_base kb ON ak.kb_id = kb.id
    ORDER BY ak.created_at DESC
  `).all();
}

export function validateApiKey(key: string) {
  const db = ensureDb();
  const row = db.prepare('SELECT * FROM api_key WHERE key = ? AND is_active = 1').get(key) as any;
  return row || null;
}

export function deleteApiKey(id: string) {
  const db = ensureDb();
  db.prepare('DELETE FROM api_key WHERE id = ?').run(id);
}
