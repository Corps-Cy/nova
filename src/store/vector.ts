import { ensureDb, nanoid } from './db.js';

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

export function insertVector(kbId: string, chunkId: string, embedding: number[]) {
  const db = ensureDb();
  const vecStr = JSON.stringify(embedding);
  db.prepare('INSERT INTO vec_chunks (id, kb_id, embedding) VALUES (?, ?, ?)')
    .run(chunkId, kbId, vecStr);
}

export function deleteVectorsByDoc(docId: string) {
  const db = ensureDb();
  db.prepare(`DELETE FROM vec_chunks WHERE id IN (SELECT id FROM chunks WHERE doc_id = ?)`)
    .run(docId);
}

export function deleteByDocId(docId: string) {
  deleteVectorsByDoc(docId);
}

export function deleteVectorsByKb(kbId: string) {
  const db = ensureDb();
  db.prepare(`DELETE FROM vec_chunks WHERE kb_id = ?`).run(kbId);
}

export function searchVectors(kbId: string, queryEmbedding: number[], topK: number = 5) {
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
    return rows.map((r: any) => ({ id: r.id, distance: r.distance }));
  } catch (e: any) {
    console.error('Vector search error:', e.message);
    return [];
  }
}
