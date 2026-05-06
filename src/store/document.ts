import crypto from 'crypto';
import { ensureDb } from './db.js';

function generateId(): string {
  return crypto.randomBytes(12).toString('base64url');
}

export function createDocument(kbId: string, filename: string, sourceType: string, sourceUrl?: string) {
  const db = ensureDb();
  const now = new Date().toISOString();
  const id = generateId();
  db.prepare(`INSERT INTO documents (id, kb_id, filename, source_type, source_url, chunk_count, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 'processing', ?, ?)`)
    .run(id, kbId, filename, sourceType, sourceUrl || null, now, now);
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}

export function updateDocumentStatus(id: string, status: string, chunkCount?: number, errorMsg?: string) {
  const db = ensureDb();
  db.prepare(`UPDATE documents SET status = ?, chunk_count = COALESCE(?, chunk_count), error_msg = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, chunkCount || null, errorMsg || null, id);
}

export function listDocuments(kbId: string) {
  return ensureDb().prepare('SELECT * FROM documents WHERE kb_id = ? ORDER BY created_at DESC').all(kbId);
}

export function deleteDocument(id: string) {
  const db = ensureDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) throw new Error('Document not found');
  const chunksDeleted = db.prepare('DELETE FROM chunks WHERE doc_id = ?').run(id).changes;
  const deleted = db.prepare('DELETE FROM documents WHERE id = ?').run(id).changes;
  // Also clean vectors
  try {
    const { deleteVectorsByDoc } = require('./vector.js');
    deleteVectorsByDoc(id);
  } catch {}
  return { deleted, chunksDeleted };
}

export function initDocumentTables() {
  const db = ensureDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, kb_id TEXT NOT NULL, filename TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'file', source_url TEXT,
      chunk_count INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'processing',
      error_msg TEXT, file_size INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_documents_kb_id ON documents(kb_id);
  `);
}

export function updateDocumentChunks(docId: string, chunkCount: number) {
  ensureDb().prepare("UPDATE documents SET chunk_count = ?, status = 'ready', updated_at = datetime('now') WHERE id = ?")
    .run(chunkCount, docId);
}
