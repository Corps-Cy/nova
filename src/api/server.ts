import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validateApiKey } from '../store/apiKey.js';
import { queryKnowledgeBase } from '../services/rag.js';
import { ingestFile, ingestUrl, ingestText } from '../services/ingest.js';
import { listKnowledgeBases, getKnowledgeBase } from '../store/knowledgeBase.js';
import { nanoid } from '../store/db.js';

export function createApiServer() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Auth middleware
  const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing API key. Use Authorization: Bearer nova_xxx' });
      return;
    }
    const key = auth.slice(7);
    const apiKey = validateApiKey(key);
    if (!apiKey) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    (req as any).apiKey = apiKey;
    next();
  };

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.0.0' });
  });

  // Query knowledge base
  app.post('/api/v1/query', authenticate, async (req, res) => {
    try {
      const { kb_id, question, top_k } = req.body;
      if (!kb_id || !question) {
        res.status(400).json({ error: 'Missing kb_id or question' });
        return;
      }

      const result = await queryKnowledgeBase(kb_id, question, undefined, undefined, undefined, top_k || 5);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Upload document
  app.post('/api/v1/ingest/file', authenticate, async (req, res) => {
    try {
      const { kb_id, content, filename } = req.body;
      if (!kb_id || !content) {
        res.status(400).json({ error: 'Missing kb_id or content' });
        return;
      }

      const result = await ingestText(kb_id, content, filename || 'inline.txt');
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Ingest URL
  app.post('/api/v1/ingest/url', authenticate, async (req, res) => {
    try {
      const { kb_id, url } = req.body;
      if (!kb_id || !url) {
        res.status(400).json({ error: 'Missing kb_id or url' });
        return;
      }

      const result = await ingestUrl(kb_id, url);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // List knowledge bases
  app.get('/api/v1/kb', authenticate, (_req, res) => {
    const kbs = listKnowledgeBases();
    res.json(kbs);
  });

  return app;
}
