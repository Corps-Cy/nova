import { ensureDb } from '../store/db.js';
import { searchVectors } from '../store/vector.js';
import { getEmbedding } from '../services/embedding.js';
import { chatCompletion, resolveChatConfig } from '../services/chat.js';
import { resolveEmbeddingConfig } from '../services/embedding.js';

interface QueryResult {
  answer: string;
  sources: { content: string; doc_id: string; filename: string }[];
  latency_ms: number;
}

export async function queryKnowledgeBase(
  kbId: string,
  question: string,
  kbModel?: string,
  kbApiKey?: string,
  kbBaseUrl?: string,
  topK: number = 5
): Promise<QueryResult> {
  const start = Date.now();
  const db = ensureDb();

  // Get KB info
  const kb = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(kbId) as any;
  if (!kb) throw new Error(`知识库 ${kbId} 不存在`);

  // Resolve configs
  const embConfig = resolveEmbeddingConfig(kb?.model, kb?.api_key, kb?.base_url);
  const chatConfig = resolveChatConfig(kbModel || kb?.model, kbApiKey || kb?.api_key, kbBaseUrl || kb?.base_url);

  // Embed the query
  const queryVec = await getEmbedding(question, embConfig);

  // Search for relevant chunks
  const results = searchVectors(kbId, queryVec, topK);

  if (results.length === 0) {
    return {
      answer: '抱歉，我在知识库中没有找到相关内容来回答您的问题。',
      sources: [],
      latency_ms: Date.now() - start,
    };
  }

  // Fetch chunk content
  const placeholders = results.map(() => '?').join(',');
  const chunks = db.prepare(`
    SELECT c.*, d.filename
    FROM chunk c
    JOIN document d ON c.doc_id = d.id
    WHERE c.id IN (${placeholders})
  `).all(...results.map(r => r.id)) as any[];

  // Build context
  const context = chunks.map((c, i) => `[${i + 1}] (${c.filename})\n${c.content}`).join('\n\n---\n\n');

  // Generate answer using LLM
  const messages = [
    {
      role: 'system',
      content: `你是知识库问答助手。根据以下参考资料回答用户问题。
规则：
- 只基于参考资料回答，不要编造信息
- 如果参考资料不足以回答，请说明
- 回答时引用来源编号，如 [1] [2]
- 用中文回答`,
    },
    {
      role: 'user',
      content: `参考资料：\n${context}\n\n用户问题：${question}`,
    },
  ];

  const answer = await chatCompletion(messages, chatConfig);

  // Log usage
  db.prepare(`INSERT INTO usage_log (id, kb_id, query, latency_ms) VALUES (?, ?, ?, ?)`)
    .run(kbId + Date.now().toString(36), kbId, question, Date.now() - start);

  return {
    answer,
    sources: chunks.map(c => ({ content: c.content, doc_id: c.doc_id, filename: c.filename })),
    latency_ms: Date.now() - start,
  };
}
