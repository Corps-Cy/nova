import { randomUUID } from 'crypto';
import { ensureDb } from './db.js';

export async function createPrompt(data: { name: string; category?: string; content: string }) {
  const id = randomUUID();
  const db = await ensureDb();
  db.prepare(`INSERT INTO prompt_template (id, name, category, content) VALUES (?, ?, ?, ?)`)
    .run(id, data.name, data.category || 'general', data.content);
  return { id, ...data };
}

export async function listPrompts(category?: string) {
  const db = await ensureDb();
  if (category) {
    return db.prepare('SELECT * FROM prompt_template WHERE category = ? ORDER BY created_at DESC').all(category);
  }
  return db.prepare('SELECT * FROM prompt_template ORDER BY created_at DESC').all();
}

export async function getPrompt(id: string) {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM prompt_template WHERE id = ?').get(id);
}

export async function deletePrompt(id: string) {
  const db = await ensureDb();
  db.prepare('DELETE FROM prompt_template WHERE id = ?').run(id);
}
