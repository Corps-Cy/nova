import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import * as userService from '../store/user.js';
import * as apiKeyService from '../store/apiKey.js';
import { queryKnowledgeBase } from '../services/rag.js';
import { ingestUrl, ingestText } from '../services/ingest.js';
import { listKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase, getKnowledgeBase, updateKnowledgeBase } from '../store/knowledgeBase.js';
import { listDocuments, deleteDocument } from '../store/document.js';
import { checkRateLimit, logUsage, getUsageStats, getGlobalStats } from '../services/usage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApiServer() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  try { userService.initUserTables(); } catch {}

  // Auth
  app.post('/api/v1/auth/register', (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) { res.status(400).json({ error: 'Missing required fields' }); return; }
      if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
      res.json(userService.createUser(email, password, name));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.post('/api/v1/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) { res.status(400).json({ error: 'Missing email or password' }); return; }
      res.json(userService.loginUser(email, password));
    } catch (e: any) { res.status(401).json({ error: e.message }); }
  });

  app.get('/api/v1/auth/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const user = userService.validateToken(token);
    if (!user) { res.status(401).json({ error: 'Invalid or expired token' }); return; }
    res.json({ user });
  });

  app.put('/api/v1/auth/profile', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const user = userService.validateToken(token);
    if (!user) { res.status(401).json({ error: 'Invalid or expired token' }); return; }
    try {
      const updated = userService.updateUser(user.id, { name: req.body.name, email: req.body.email });
      res.json({ user: updated });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.put('/api/v1/auth/password', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const user = userService.validateToken(token);
    if (!user) { res.status(401).json({ error: 'Invalid or expired token' }); return; }
    try {
      userService.changePassword(user.id, req.body.old_password, req.body.new_password);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // Optional auth middleware
  const optAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) { (req as any).user = userService.validateToken(token) || null; }
    next();
  };

  // API Key auth
  const apiKeyAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'Missing API key' }); return; }
    const key = apiKeyService.validateApiKey(auth.slice(7));
    if (!key) { res.status(401).json({ error: 'Invalid API key' }); return; }
    (req as any).apiKey = key;
    next();
  };

  const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = (req as any).apiKey;
    if (!key) { next(); return; }
    const limit = key.rate_limit || 100;
    const check = checkRateLimit(key.id, limit);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', check.remaining);
    if (!check.allowed) { res.status(429).json({ error: 'Rate limit exceeded' }); return; }
    next();
  };

  // External API (API Key)
  app.post('/api/v1/query', apiKeyAuth, rateLimit, async (req, res) => {
    const start = Date.now();
    try {
      const { kb_id, question, top_k } = req.body;
      if (!kb_id || !question) { res.status(400).json({ error: 'Missing kb_id or question' }); return; }
      const result = await queryKnowledgeBase(kb_id, question, undefined, undefined, undefined, top_k || 5);
      logUsage({ api_key_id: (req as any).apiKey.id, kb_id, query: question, latency_ms: Date.now() - start });
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/v1/ingest/file', apiKeyAuth, rateLimit, async (req, res) => {
    try {
      const { kb_id, content, filename } = req.body;
      if (!kb_id || !content) { res.status(400).json({ error: 'Missing kb_id or content' }); return; }
      const result = await ingestText(kb_id, content, filename || 'inline.txt');
      res.json({ success: true, ...result });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/v1/ingest/url', apiKeyAuth, rateLimit, async (req, res) => {
    try {
      const { kb_id, url } = req.body;
      if (!kb_id || !url) { res.status(400).json({ error: 'Missing kb_id or url' }); return; }
      const result = await ingestUrl(kb_id, url);
      res.json({ success: true, ...result });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/v1/kb', apiKeyAuth, (_req, res) => {
    res.json(listKnowledgeBases());
  });

  // Dashboard API
  app.get('/api/v1/dashboard/kb', optAuth, (_req, res) => {
    res.json(listKnowledgeBases());
  });

  app.post('/api/v1/dashboard/kb', optAuth, (req, res) => {
    try { res.json(createKnowledgeBase(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/v1/dashboard/kb/:id', optAuth, (req, res) => {
    const kb = getKnowledgeBase(req.params.id);
    if (!kb) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(kb);
  });

  app.put('/api/v1/dashboard/kb/:id', optAuth, (req, res) => {
    try { updateKnowledgeBase(req.params.id, req.body); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/v1/dashboard/kb/:id', optAuth, (req, res) => {
    try { deleteKnowledgeBase(req.params.id); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/v1/dashboard/docs/:kbId', optAuth, (req, res) => {
    res.json(listDocuments(req.params.kbId));
  });

  app.delete('/api/v1/dashboard/docs/:docId', optAuth, (req, res) => {
    try { res.json(deleteDocument(req.params.docId)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/v1/dashboard/ingest/file', optAuth, async (req, res) => {
    try {
      const { kb_id, content, filename } = req.body;
      if (!kb_id || !content) { res.status(400).json({ error: 'Missing kb_id or content' }); return; }
      const result = await ingestText(kb_id, content, filename || 'inline.txt');
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/v1/dashboard/ingest/url', optAuth, async (req, res) => {
    try {
      const { kb_id, url } = req.body;
      if (!kb_id || !url) { res.status(400).json({ error: 'Missing kb_id or url' }); return; }
      const result = await ingestUrl(kb_id, url);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/v1/dashboard/query', optAuth, async (req, res) => {
    try {
      const { kb_id, question } = req.body;
      if (!kb_id || !question) { res.status(400).json({ error: 'Missing kb_id or question' }); return; }
      const result = await queryKnowledgeBase(kb_id, question);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/v1/dashboard/api-keys', optAuth, (_req, res) => {
    try { res.json(apiKeyService.listApiKeys()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/v1/dashboard/api-keys', optAuth, (req, res) => {
    try { res.json(apiKeyService.createApiKey(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/v1/dashboard/api-keys/:id', optAuth, (req, res) => {
    try { apiKeyService.deleteApiKey(req.params.id); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Stats
  app.get('/api/v1/stats/usage', (_req, res) => {
    try {
      const days = parseInt((_req as any).query?.days) || 30;
      res.json(getGlobalStats(days));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/v1/stats/usage/:kbId', (req, res) => {
    try {
      const days = parseInt((req as any).query?.days) || 30;
      res.json(getUsageStats(req.params.kbId, days));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Widget
  app.get('/widget.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const host = (_req as any).headers.host || 'localhost:3000';
    res.send(generateWidgetScript(host));
  });

  // Health
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.1.0' });
  });

  // Serve React SPA
  const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
  app.use(express.static(webDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });

  return app;
}

function generateWidgetScript(host: string): string {
  return `(function(){
  var w=document.createElement('div');w.id='nova-widget-root';
  w.style.cssText='position:fixed;bottom:24px;right:24px;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  document.body.appendChild(w);
  var s=document.createElement('div');s.id='nova-chat-btn';
  s.style.cssText='width:56px;height:56px;border-radius:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 20px rgba(99,102,241,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;';
  s.innerHTML='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  s.onclick=toggle;w.appendChild(s);
  var open=false;var panel=document.createElement('div');
  panel.style.cssText='position:absolute;bottom:72px;right:0;width:380px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;display:none;flex-direction:column;';
  panel.innerHTML='<div style="padding:20px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:600;font-size:16px;">AI 智能问答</div><div id="nova-messages" style="flex:1;overflow-y:auto;padding:16px;max-height:320px;min-height:200px;"></div><div style="padding:12px 16px;border-top:1px solid #eee;display:flex;gap:8px;"><input id="nova-input" type="text" placeholder="输入您的问题..." style="flex:1;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;outline:none;font-size:14px;" onkeydown="if(event.key===\'Enter\')send()"><button onclick="send()" style="padding:10px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;">发送</button></div>';
  w.appendChild(panel);
  function toggle(){open=!open;panel.style.display=open?'flex':'none';}
  window.novaSend=function(){var i=document.getElementById('nova-input');var q=i.value.trim();if(!q)return;i.value='';var m=document.getElementById('nova-messages');m.innerHTML+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:10px 16px;border-radius:14px 14px 4px 14px;max-width:80%;font-size:14px;">'+esc(q)+'</div></div>';fetch('/api/v1/query',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+window.novaApiKey},body:JSON.stringify({kb_id:window.novaKbId,question:q})}).then(function(r){return r.json();}).then(function(d){m.innerHTML+='<div style="display:flex;justify-content:flex-start;margin-bottom:12px;"><div style="background:#f1f5f9;padding:10px 16px;border-radius:14px 14px 14px 4px;max-width:80%;font-size:14px;">'+(d.answer||'无法回答')+'</div></div>';}).catch(function(){m.innerHTML+='<div style="color:#ef4444;font-size:13px;">请求失败</div>';});};
  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
})();`;
}
