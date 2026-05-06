import { ensureDb, nanoid } from './db.js';

/**
 * Create a virtual table for vector search using sqlite-vec.
 * Dimensions should match the embedding model output (e.g., 1536 for OpenAI ada-002).
 */
export function ensureVectorTable(dims: number = 1536) {
  const db = ensureDb();
  try {
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
      id TEXT PRIMARY KEY,
      kb_id TEXT,
      embedding float[${dims}]
    )`);
  } catch (e: any) {
    if (!e.message?.includes('already exists')) throw e;
  }
}

/**
 * Insert a chunk with its embedding vector.
 */
export function insertVector(kbId: string, chunkId: string, embedding: number[]) {
  const db = ensureDb();
  const vecStr = JSON.stringify(embedding);
  db.prepare('INSERT INTO vec_chunks (id, kb_id, embedding) VALUES (?, ?, ?)')
    .run(chunkId, kbId, vecStr);
}

/**
 * Delete all vectors for a document.
 */
export function deleteVectorsByDoc(docId: string) {
  const db = ensureDb();
  db.prepare(`DELETE FROM vec_chunks WHERE id IN (SELECT id FROM chunk WHERE doc_id = ?)`)
    .run(docId);
}

/**
 * Delete all vectors for a knowledge base.
 */
export function deleteVectorsByKb(kbId: string) {
  const db = ensureDb();
  db.prepare(`DELETE FROM vec_chunks WHERE kb_id = ?`).run(kbId);
}

/**
 * Search for top-K nearest neighbors.
 * Returns chunk IDs and distances.
 */
export function searchVectors(kbId: string, queryEmbedding: number[], topK: number = 5): { id: string; distance: number }[] {
  const db = ensureDb();
  const vecStr = JSON.stringify(queryEmbedding);
  try {
    const rows = db.prepare(`
      SELECT id, distance
      FROM vec_chunks
      WHERE kb_id = ?
      AND embedding MATCH ?
      ORDER BY distance
      LIMIT ?
    `).all(kbId, vecStr, topK) as any[];
    return rows.map(r => ({ id: r.id, distance: r.distance }));
  } catch (e: any) {
    // Fallback: if vec0 search fails, return empty
    console.error('Vector search error:', e.message);
    return [];
  }
}
