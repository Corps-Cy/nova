import { randomUUID } from 'crypto';
import { getDb } from './db.js';

export function createPrompt(data: { name: string; category?: string; content: string }) {
  const id = randomUUID();
  getDb().prepare(`INSERT INTO prompt_template (id, name, category, content) VALUES (?, ?, ?, ?)`)
    .run(id, data.name, data.category || 'general', data.content);
  return { id, ...data };
}

export function listPrompts(category?: string) {
  if (category) {
    return getDb().prepare('SELECT * FROM prompt_template WHERE category = ? ORDER BY created_at DESC').all(category);
  }
  return getDb().prepare('SELECT * FROM prompt_template ORDER BY created_at DESC').all();
}

export function getPrompt(id: string) {
  return getDb().prepare('SELECT * FROM prompt_template WHERE id = ?').get(id) as any;
}

export function deletePrompt(id: string) {
  getDb().prepare('DELETE FROM prompt_template WHERE id = ?').run(id);
}
