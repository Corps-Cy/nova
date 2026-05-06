import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validateApiKey } from '../store/apiKey.js';
import { queryKnowledgeBase } from '../services/rag.js';
import { ingestFile, ingestUrl, ingestText } from '../services/ingest.js';
import { listKnowledgeBases, getKnowledgeBase } from '../store/knowledgeBase.js';
import { checkRateLimit, logUsage, getUsageStats, getGlobalStats } from '../services/usage.js';

export function createApiServer() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Auth middleware
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

  // Rate limit middleware
  const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = (req as any).apiKey;
    if (!apiKey) { next(); return; }
    const limit = apiKey.rate_limit || 100;
    const check = checkRateLimit(apiKey.id, limit);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', check.remaining);
    if (!check.allowed) {
      res.status(429).json({ error: 'Rate limit exceeded. Try again in a moment.' });
      return;
    }
    next();
  };

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.0.0' });
  });

  // === External API (requires API key) ===

  app.post('/api/v1/query', authenticate, rateLimit, async (req, res) => {
    const start = Date.now();
    try {
      const { kb_id, question, top_k } = req.body;
      if (!kb_id || !question) {
        res.status(400).json({ error: 'Missing kb_id or question' });
        return;
      }
      const result = await queryKnowledgeBase(kb_id, question, undefined, undefined, undefined, top_k || 5);
      logUsage({ api_key_id: (req as any).apiKey.id, kb_id, query: question, latency_ms: Date.now() - start });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/v1/ingest/file', authenticate, rateLimit, async (req, res) => {
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

  app.post('/api/v1/ingest/url', authenticate, rateLimit, async (req, res) => {
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

  app.get('/api/v1/kb', authenticate, (_req, res) => {
    res.json(listKnowledgeBases());
  });

  // === Dashboard API (no auth, meant for web UI on same server) ===

  app.get('/api/v1/stats/usage', (_req, res) => {
    try {
      const days = parseInt((_req as any).query?.days as string) || 30;
      res.json(getGlobalStats(days));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/v1/stats/usage/:kbId', (req, res) => {
    try {
      const days = parseInt((req as any).query?.days as string) || 30;
      res.json(getUsageStats(req.params.kbId, days));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // KB CRUD for dashboard
  app.get('/api/v1/dashboard/kb', (_req, res) => {
    res.json(listKnowledgeBases());
  });

  app.post('/api/v1/dashboard/kb', async (req, res) => {
    try {
      const { createKnowledgeBase } = await import('../store/knowledgeBase.js');
      const result = createKnowledgeBase(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/v1/dashboard/kb/:id', (req, res) => {
    try {
      const { deleteKnowledgeBase } = require('../store/knowledgeBase.js');
      deleteKnowledgeBase(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Document management for dashboard
  app.get('/api/v1/dashboard/docs/:kbId', (req, res) => {
    try {
      const { listDocuments } = require('../store/document.js');
      res.json(listDocuments(req.params.kbId));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/v1/dashboard/ingest/file', async (req, res) => {
    try {
      const { kb_id, content, filename } = req.body;
      if (!kb_id || !content) { res.status(400).json({ error: 'Missing kb_id or content' }); return; }
      const result = await ingestText(kb_id, content, filename || 'inline.txt');
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/v1/dashboard/ingest/url', async (req, res) => {
    try {
      const { kb_id, url } = req.body;
      if (!kb_id || !url) { res.status(400).json({ error: 'Missing kb_id or url' }); return; }
      const result = await ingestUrl(kb_id, url);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Query test for dashboard
  app.post('/api/v1/dashboard/query', async (req, res) => {
    try {
      const { kb_id, question } = req.body;
      if (!kb_id || !question) { res.status(400).json({ error: 'Missing kb_id or question' }); return; }
      const result = await queryKnowledgeBase(kb_id, question);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // API Key management for dashboard
  app.get('/api/v1/dashboard/api-keys', (_req, res) => {
    const { listApiKeys } = require('../store/apiKey.js');
    res.json(listApiKeys());
  });

  app.post('/api/v1/dashboard/api-keys', (req, res) => {
    const { createApiKey } = require('../store/apiKey.js');
    const result = createApiKey(req.body);
    res.json(result);
  });

  app.delete('/api/v1/dashboard/api-keys/:id', (req, res) => {
    const { deleteApiKey } = require('../store/apiKey.js');
    deleteApiKey(req.params.id);
    res.json({ success: true });
  });

  // Serve embedded widget script
  app.get('/widget.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const host = (_req as any).headers.host || 'localhost:3000';
    res.send(generateWidgetScript(host));
  });

  return app;
}

function generateWidgetScript(host: string): string {
  return `(function(){
  var w = document.createElement('div');
  w.id = 'nova-widget-root';
  w.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  document.body.appendChild(w);

  var s = document.createElement('div');
  s.id = 'nova-chat-btn';
  s.style.cssText = 'width:56px;height:56px;border-radius:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 20px rgba(99,102,241,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s,box-shadow 0.2s;';
  s.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  s.onmouseenter = function(){ s.style.transform='scale(1.1)'; s.style.boxShadow='0 6px 28px rgba(99,102,241,0.5)'; };
  s.onmouseleave = function(){ s.style.transform='scale(1)'; s.style.boxShadow='0 4px 20px rgba(99,102,241,0.4)'; };
  s.onclick = toggle;
  w.appendChild(s);

  var open = false;
  var panel = document.createElement('div');
  panel.style.cssText = 'position:absolute;bottom:72px;right:0;width:380px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;display:none;flex-direction:column;';
  panel.innerHTML = '<div style="padding:20px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:600;font-size:16px;">AI 智能问答</div><div id="nova-messages" style="flex:1;overflow-y:auto;padding:16px;max-height:320px;min-height:200px;"></div><div style="padding:12px 16px;border-top:1px solid #eee;display:flex;gap:8px;"><input id="nova-input" type="text" placeholder="输入您的问题..." style="flex:1;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;outline:none;font-size:14px;transition:border-color 0.2s;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'" onkeydown="if(event.key===\'Enter\')send()"><button onclick="send()" style="padding:10px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;white-space:nowrap;transition:opacity 0.2s;" onmouseenter="this.style.opacity=0.9" onmouseleave="this.style.opacity=1">发送</button></div>';
  w.appendChild(panel);

  function toggle(){
    open=!open;
    panel.style.display=open?'flex':'none';
    if(open){var i=document.getElementById('nova-input');if(i)i.focus();}
  }

  window.novaSend = function(){
    var i=document.getElementById('nova-input');
    var q=i.value.trim();if(!q)return;
    i.value='';
    var m=document.getElementById('nova-messages');
    m.innerHTML+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:10px 16px;border-radius:14px 14px 4px 14px;max-width:80%;font-size:14px;line-height:1.5;">'+esc(q)+'</div></div>';
    m.innerHTML+='<div id="nova-loading" style="display:flex;justify-content:flex-start;margin-bottom:12px;"><div style="background:#f1f5f9;padding:10px 16px;border-radius:14px 14px 14px 4px;"><span style="display:inline-block;width:8px;height:8px;background:#94a3b8;border-radius:50%;animation:nova-bounce 1.4s infinite ease-in-out both;vertical-align:middle;margin:0 2px;"></span><span style="display:inline-block;width:8px;height:8px;background:#94a3b8;border-radius:50%;animation:nova-bounce 1.4s infinite ease-in-out both;vertical-align:middle;margin:0 2px;animation-delay:0.16s;"></span><span style="display:inline-block;width:8px;height:8px;background:#94a3b8;border-radius:50%;animation:nova-bounce 1.4s infinite ease-in-out both;vertical-align:middle;margin:0 2px;animation-delay:0.32s;"></span></div></div>';
    m.scrollTop=m.scrollHeight;
    fetch('http://${host}/api/v1/query',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+window.novaApiKey},body:JSON.stringify({kb_id:window.novaKbId,question:q})}).then(function(r){return r.json();}).then(function(d){
      var l=document.getElementById('nova-loading');if(l)l.remove();
      var a=d.answer||'抱歉，无法回答此问题。';
      m.innerHTML+='<div style="display:flex;justify-content:flex-start;margin-bottom:12px;"><div style="background:#f1f5f9;padding:10px 16px;border-radius:14px 14px 14px 4px;max-width:80%;font-size:14px;line-height:1.5;color:#334155;">'+a+'</div></div>';
      m.scrollTop=m.scrollHeight;
    }).catch(function(e){var l=document.getElementById('nova-loading');if(l)l.remove();m.innerHTML+='<div style="color:#ef4444;font-size:13px;padding:8px;">请求失败，请检查配置</div>';});
  };
  var send = window.novaSend;

  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}

  var style=document.createElement('style');
  style.textContent='@keyframes nova-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}';
  document.head.appendChild(style);
})();`;
}
