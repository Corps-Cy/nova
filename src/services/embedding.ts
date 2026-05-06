import { ensureDb } from '../store/db.js';

interface EmbeddingConfig {
  model: string;
  api_key: string;
  base_url: string;
}

export function resolveEmbeddingConfig(kbModel?: string, kbApiKey?: string, kbBaseUrl?: string): EmbeddingConfig {
  const db = ensureDb();
  const config = db.prepare("SELECT key, value FROM config WHERE key IN ('embedding_model', 'embedding_api_key', 'embedding_base_url')").all() as any[];
  const cfg: Record<string, string> = {};
  config.forEach((c: any) => cfg[c.key] = c.value);

  return {
    model: kbModel || cfg.embedding_model || 'text-embedding-3-small',
    api_key: kbApiKey || cfg.embedding_api_key || process.env.OPENAI_API_KEY || '',
    base_url: kbBaseUrl || cfg.embedding_base_url || 'https://api.openai.com/v1',
  };
}

export async function getEmbeddings(texts: string[], config: EmbeddingConfig): Promise<number[][]> {
  const url = `${config.base_url}/embeddings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({ input: texts, model: config.model }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API error: ${res.status} - ${err}`);
  }

  const data = await res.json() as any;
  return data.data.map((d: any) => d.embedding);
}

export async function getEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
  const results = await getEmbeddings([text], config);
  return results[0];
}
