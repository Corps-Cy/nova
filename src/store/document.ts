import { ensureDb, nanoid } from './db.js';

export function createDocument(data: { kb_id: string; filename: string; source_type?: string; source_url?: string }) {
  const db = ensureDb();
  const id = nanoid(12);
  db.prepare(`INSERT INTO document (id, kb_id, filename, source_type, source_url) VALUES (?, ?, ?, ?, ?)`)
    .run(id, data.kb_id, data.filename, data.source_type || 'file', data.source_url || '');
  return { id, ...data };
}

export function listDocuments(kbId: string) {
  const db = ensureDb();
  return db.prepare('SELECT * FROM document WHERE kb_id = ? ORDER BY created_at DESC').all(kbId);
}

export function getDocument(id: string) {
  const db = ensureDb();
  return db.prepare('SELECT * FROM document WHERE id = ?').get(id);
}

export function deleteDocument(id: string) {
  const db = ensureDb();
  db.prepare('DELETE FROM document WHERE id = ?').run(id);
}

export function updateDocumentChunks(docId: string, chunkCount: number) {
  const db = ensureDb();
  db.prepare('UPDATE document SET chunk_count = ? WHERE id = ?').run(chunkCount, docId);
}
