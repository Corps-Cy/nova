import { randomUUID } from 'crypto';
import { getDb } from './db.js';

export function createClient(data: { name: string; company?: string; contact?: string; email?: string; notes?: string }) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO client (id, name, company, contact, email, notes) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, data.name, data.company || '', data.contact || '', data.email || '', data.notes || '');
  return { id, ...data };
}

export function listClients() {
  return getDb().prepare('SELECT * FROM client ORDER BY updated_at DESC').all();
}

export function getClient(id: string) {
  return getDb().prepare('SELECT * FROM client WHERE id = ?').get(id) as any;
}

export function updateClient(id: string, data: Record<string, any>) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  getDb().prepare(`UPDATE client SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}

export function deleteClient(id: string) {
  getDb().prepare('DELETE FROM client WHERE id = ?').run(id);
}
