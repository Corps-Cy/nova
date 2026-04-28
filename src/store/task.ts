import { randomUUID } from 'crypto';
import { getDb } from './db.js';

export function createTask(data: { title: string; description?: string; priority?: string; project_id?: string; due_date?: string }) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO task (id, title, description, priority, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, data.title, data.description || '', data.priority || 'medium', data.project_id || null, data.due_date || '');
  return { id, ...data, status: 'todo', time_spent: 0 };
}

export function listTasks(filter?: { status?: string }) {
  const db = getDb();
  if (filter?.status) {
    return db.prepare('SELECT * FROM task WHERE status = ? ORDER BY updated_at DESC').all(filter.status);
  }
  return db.prepare('SELECT * FROM task ORDER BY updated_at DESC').all();
}

export function updateTaskStatus(id: string, status: string) {
  getDb().prepare('UPDATE task SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
}

export function updateTaskTime(id: string, hours: number) {
  getDb().prepare('UPDATE task SET time_spent = time_spent + ?, updated_at = datetime(\'now\') WHERE id = ?').run(hours, id);
}

export function deleteTask(id: string) {
  getDb().prepare('DELETE FROM task WHERE id = ?').run(id);
}

export function getTaskStats() {
  return getDb().prepare(`
    SELECT status, COUNT(*) as count FROM task GROUP BY status
  `).all();
}
