import { randomUUID } from 'crypto';
import { getDb } from './db.js';

export function createProject(data: { client_id: string; name: string; budget?: number }) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO project (id, client_id, name, budget) VALUES (?, ?, ?, ?)`)
    .run(id, data.client_id, data.name, data.budget || 0);
  return { id, ...data, status: 'requirement', received: 0 };
}

export function listProjects() {
  return getDb().prepare(`
    SELECT p.*, c.name as client_name FROM project p
    LEFT JOIN client c ON p.client_id = c.id
    ORDER BY p.updated_at DESC
  `).all();
}

export function updateProjectStatus(id: string, status: string) {
  getDb().prepare('UPDATE project SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
}

export function updateProjectPayment(id: string, amount: number) {
  getDb().prepare('UPDATE project SET received = received + ?, updated_at = datetime(\'now\') WHERE id = ?').run(amount, id);
}

export function deleteProject(id: string) {
  getDb().prepare('DELETE FROM project WHERE id = ?').run(id);
}

export function getProject(id: string) {
  return getDb().prepare('SELECT * FROM project WHERE id = ?').get(id);
}

export function updateProject(id: string, data: Record<string, any>) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  getDb().prepare(`UPDATE project SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}
