import { ensureDb } from '../store/db.js';
import { createDocument, updateDocumentChunks } from '../store/document.js';
import { insertVector, deleteVectorsByDoc, ensureVectorTable } from '../store/vector.js';
import { getEmbeddings, resolveEmbeddingConfig } from '../services/embedding.js';
import { parseTextFile, parsePdfFile, parseUrl, parseText, getParser } from '../parsers/index.js';
import { nanoid } from '../store/db.js';

/**
 * Ingest a file into a knowledge base.
 */
export async function ingestFile(kbId: string, filePath: string): Promise<{ doc_id: string; chunks: number }> {
  const parserType = getParser(filePath);
  let chunks: string[];

  if (parserType === 'pdf') {
    chunks = await parsePdfFile(filePath);
  } else {
    chunks = parseTextFile(filePath);
  }

  return await storeChunks(kbId, chunks, filePath.split('/').pop() || 'unknown');
}

/**
 * Ingest a URL into a knowledge base.
 */
export async function ingestUrl(kbId: string, url: string): Promise<{ doc_id: string; chunks: number }> {
  const chunks = await parseUrl(url);
  return await storeChunks(kbId, chunks, url, 'url', url);
}

/**
 * Ingest raw text into a knowledge base.
 */
export async function ingestText(kbId: string, text: string, filename: string): Promise<{ doc_id: string; chunks: number }> {
  const chunks = parseText(text);
  return await storeChunks(kbId, chunks, filename);
}

/**
 * Store chunks in DB + vectorize them.
 */
async function storeChunks(
  kbId: string,
  chunks: string[],
  filename: string,
  sourceType: string = 'file',
  sourceUrl: string = ''
): Promise<{ doc_id: string; chunks: number }> {
  const db = ensureDb();
  const doc = createDocument({ kb_id: kbId, filename, source_type: sourceType, source_url: sourceUrl });

  // Get embedding config from KB
  const kb = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(kbId) as any;
  const embConfig = resolveEmbeddingConfig(kb?.model, kb?.api_key, kb?.base_url);

  // Ensure vector table exists
  ensureVectorTable(getEmbeddingDims(embConfig.model));

  // Insert chunks and vectorize in batches of 20
  const BATCH_SIZE = 20;
  let totalInserted = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Get embeddings for batch
    const embeddings = await getEmbeddings(batch, embConfig);

    // Insert into DB
    const insertChunk = db.prepare('INSERT INTO chunk (id, doc_id, content) VALUES (?, ?, ?)');
    const insertVec = db.prepare('INSERT INTO vec_chunks (id, kb_id, embedding) VALUES (?, ?, ?)');

    const tx = db.transaction(() => {
      for (let j = 0; j < batch.length; j++) {
        const chunkId = nanoid(12);
        insertChunk.run(chunkId, doc.id, batch[j]);
        insertVec.run(chunkId, kbId, JSON.stringify(embeddings[j]));
      }
    });
    tx();
    totalInserted += batch.length;
  }

  updateDocumentChunks(doc.id, totalInserted);
  return { doc_id: doc.id, chunks: totalInserted };
}

function getEmbeddingDims(model: string): number {
  if (model.includes('3-small')) return 1536;
  if (model.includes('3-large')) return 3072;
  if (model.includes('ada')) return 1536;
  if (model.includes('bge') && model.includes('large')) return 1024;
  if (model.includes('bge')) return 768;
  return 1536; // default for most models
}
