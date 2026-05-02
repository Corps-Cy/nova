import { randomUUID } from 'crypto';
import { ensureDb } from './db.js';

export async function createTask(data: { title: string; description?: string; priority?: string; project_id?: string; due_date?: string }) {
  const db = await ensureDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO task (id, title, description, priority, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, data.title, data.description || '', data.priority || 'medium', data.project_id || null, data.due_date || '');
  return { id, ...data, status: 'todo', time_spent: 0 };
}

export async function listTasks(filter?: { status?: string; project_id?: string; search?: string; tag?: string }) {
  const db = await ensureDb();
  let sql = 'SELECT DISTINCT t.* FROM task t';
  const params: any[] = [];
  const conditions: string[] = [];
  if (filter?.tag) {
    sql += ' JOIN task_tag tt ON t.id = tt.task_id JOIN tag tg ON tt.tag_id = tg.id';
    conditions.push('tg.name = ?'); params.push(filter.tag);
  }
  if (filter?.status) { conditions.push('t.status = ?'); params.push(filter.status); }
  if (filter?.project_id) { conditions.push('t.project_id = ?'); params.push(filter.project_id); }
  if (filter?.search) { conditions.push('(t.title LIKE ? OR t.description LIKE ?)'); params.push(`%${filter.search}%`, `%${filter.search}%`); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY t.updated_at DESC';
  return db.prepare(sql).all(...params);
}

export async function updateTaskStatus(id: string, status: string) {
  const db = await ensureDb();
  db.prepare("UPDATE task SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export async function updateTaskTime(id: string, hours: number) {
  const db = await ensureDb();
  db.prepare("UPDATE task SET time_spent = time_spent + ?, updated_at = datetime('now') WHERE id = ?").run(hours, id);
}

export async function deleteTask(id: string) {
  const db = await ensureDb();
  db.prepare('DELETE FROM task WHERE id = ?').run(id);
}

export async function getTaskStats() {
  const db = await ensureDb();
  return db.prepare(`SELECT status, COUNT(*) as count FROM task GROUP BY status`).all();
}

export async function getTask(id: string) {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM task WHERE id = ?').get(id);
}

export async function updateTask(id: string, data: Record<string, any>) {
  const db = await ensureDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE task SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}
