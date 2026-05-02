import { randomUUID } from 'crypto';
import { ensureDb } from './db.js';

export async function createTask(data: { title: string; description?: string; priority?: string; project_id?: string; due_date?: string }) {
  const db = await ensureDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO task (id, title, description, priority, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, data.title, data.description || '', data.priority || 'medium', data.project_id || null, data.due_date || '');
  return { id, ...data, status: 'todo', time_spent: 0 };
}

export async function listTasks(filter?: { status?: string; project_id?: string }) {
  const db = await ensureDb();
  if (filter?.status && filter?.project_id) {
    return db.prepare('SELECT * FROM task WHERE status = ? AND project_id = ? ORDER BY updated_at DESC').all(filter.status, filter.project_id);
  }
  if (filter?.status) {
    return db.prepare('SELECT * FROM task WHERE status = ? ORDER BY updated_at DESC').all(filter.status);
  }
  if (filter?.project_id) {
    return db.prepare('SELECT * FROM task WHERE project_id = ? ORDER BY updated_at DESC').all(filter.project_id);
  }
  return db.prepare('SELECT * FROM task ORDER BY updated_at DESC').all();
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
