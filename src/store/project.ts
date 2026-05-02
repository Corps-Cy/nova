import { randomUUID } from 'crypto';
import { ensureDb } from './db.js';

export async function createProject(data: { client_id: string; name: string; budget?: number }) {
  const db = await ensureDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO project (id, client_id, name, budget) VALUES (?, ?, ?, ?)`)
    .run(id, data.client_id, data.name, data.budget || 0);
  return { id, ...data, status: 'requirement', received: 0 };
}

export async function listProjects() {
  const db = await ensureDb();
  return db.prepare(`
    SELECT p.*, c.name as client_name FROM project p
    LEFT JOIN client c ON p.client_id = c.id
    ORDER BY p.updated_at DESC
  `).all();
}

export async function updateProjectStatus(id: string, status: string) {
  const db = await ensureDb();
  db.prepare("UPDATE project SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export async function updateProjectPayment(id: string, amount: number) {
  const db = await ensureDb();
  db.prepare("UPDATE project SET received = received + ?, updated_at = datetime('now') WHERE id = ?").run(amount, id);
}

export async function deleteProject(id: string) {
  const db = await ensureDb();
  db.prepare('DELETE FROM project WHERE id = ?').run(id);
}

export async function getProject(id: string) {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM project WHERE id = ?').get(id);
}

export async function updateProject(id: string, data: Record<string, any>) {
  const db = await ensureDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE project SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}
