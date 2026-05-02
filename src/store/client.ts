import { randomUUID } from 'crypto';
import { ensureDb } from './db.js';

export async function createClient(data: { name: string; company?: string; contact?: string; email?: string; notes?: string }) {
  const db = await ensureDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO client (id, name, company, contact, email, notes) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, data.name, data.company || '', data.contact || '', data.email || '', data.notes || '');
  return { id, ...data };
}

export async function listClients(search?: string) {
  const db = await ensureDb();
  if (search) {
    return db.prepare('SELECT * FROM client WHERE name LIKE ? OR company LIKE ? OR contact LIKE ? ORDER BY updated_at DESC')
      .all(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  return db.prepare('SELECT * FROM client ORDER BY updated_at DESC').all();
}

export async function getClient(id: string) {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM client WHERE id = ?').get(id);
}

export async function updateClient(id: string, data: Record<string, any>) {
  const db = await ensureDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE client SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}

export async function deleteClient(id: string) {
  const db = await ensureDb();
  db.prepare('DELETE FROM client WHERE id = ?').run(id);
}
