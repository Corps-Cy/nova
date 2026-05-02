import { randomUUID } from 'crypto';
import { ensureDb } from './db.js';

export async function createNote(data: { project_id: string; title: string; content?: string }) {
  const db = await ensureDb();
  const id = randomUUID();
  db.prepare('INSERT INTO project_note (id, project_id, title, content) VALUES (?, ?, ?, ?)')
    .run(id, data.project_id, data.title, data.content || '');
  return { id, ...data };
}

export async function listNotes(projectId: string) {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM project_note WHERE project_id = ? ORDER BY updated_at DESC').all(projectId);
}

export async function getNote(id: string) {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM project_note WHERE id = ?').get(id);
}

export async function updateNote(id: string, data: Record<string, any>) {
  const db = await ensureDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE project_note SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}

export async function deleteNote(id: string) {
  const db = await ensureDb();
  db.prepare('DELETE FROM project_note WHERE id = ?').run(id);
}
