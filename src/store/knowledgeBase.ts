import { ensureDb, nanoid } from './db.js';

export function createKnowledgeBase(data: { name: string; description?: string; model?: string; api_key?: string; base_url?: string }) {
  const db = ensureDb();
  const id = nanoid(12);
  db.prepare(`INSERT INTO knowledge_base (id, name, description, model, api_key, base_url) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, data.name, data.description || '', data.model || '', data.api_key || '', data.base_url || '');
  return { id, ...data };
}

export function listKnowledgeBases() {
  const db = ensureDb();
  return db.prepare(`
    SELECT kb.*,
      COUNT(DISTINCT d.id) as doc_count,
      COALESCE(SUM(d.chunk_count), 0) as total_chunks
    FROM knowledge_base kb
    LEFT JOIN document d ON kb.id = d.kb_id
    GROUP BY kb.id
    ORDER BY kb.updated_at DESC
  `).all();
}

export function getKnowledgeBase(id: string) {
  const db = ensureDb();
  return db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(id);
}

export function deleteKnowledgeBase(id: string) {
  const db = ensureDb();
  db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(id);
}

export function updateKnowledgeBase(id: string, data: Record<string, string>) {
  const db = ensureDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE knowledge_base SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}
