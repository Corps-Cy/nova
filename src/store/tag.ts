import { randomUUID } from 'crypto';
import { ensureDb } from './db.js';

export async function createTag(data: { name: string; color?: string }) {
  const db = await ensureDb();
  const id = randomUUID();
  try {
    db.prepare('INSERT INTO tag (id, name, color) VALUES (?, ?, ?)').run(id, data.name, data.color || '#8b5cf6');
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) throw new Error(`标签 "${data.name}" 已存在`);
    throw e;
  }
  return { id, ...data };
}

export async function listTags() {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM tag ORDER BY name').all();
}

export async function deleteTag(id: string) {
  const db = await ensureDb();
  db.prepare('DELETE FROM tag WHERE id = ?').run(id);
}

export async function addTaskTag(taskId: string, tagName: string) {
  const db = await ensureDb();
  // Resolve short ID
  const task = db.prepare("SELECT id FROM task WHERE id LIKE ? || '%' LIMIT 1").get(taskId) as any;
  const fullTaskId = task ? task.id : taskId;
  // Find or create tag
  let tag = db.prepare('SELECT * FROM tag WHERE name = ?').get(tagName) as any;
  if (!tag) {
    const id = randomUUID();
    db.prepare('INSERT INTO tag (id, name, color) VALUES (?, ?, ?)').run(id, tagName, '#8b5cf6');
    tag = { id };
  }
  // Check existing
  const exists = db.prepare('SELECT 1 FROM task_tag WHERE task_id = ? AND tag_id = ?').get(fullTaskId, tag.id);
  if (!exists) {
    db.prepare('INSERT INTO task_tag (task_id, tag_id) VALUES (?, ?)').run(fullTaskId, tag.id);
  }
}

export async function removeTaskTag(taskId: string, tagName: string) {
  const db = await ensureDb();
  const task = db.prepare("SELECT id FROM task WHERE id LIKE ? || '%' LIMIT 1").get(taskId) as any;
  const fullId = task ? task.id : taskId;
  db.prepare(`DELETE FROM task_tag WHERE task_id = ? AND tag_id = (SELECT id FROM tag WHERE name = ?)`).run(fullId, tagName);
}

export async function getTaskTags(taskId: string) {
  const db = await ensureDb();
  const task = db.prepare("SELECT id FROM task WHERE id LIKE ? || '%' LIMIT 1").get(taskId) as any;
  const fullId = task ? task.id : taskId;
  return db.prepare('SELECT t.* FROM tag t JOIN task_tag tt ON t.id = tt.tag_id WHERE tt.task_id = ?').all(fullId);
}

export async function getTagByName(name: string) {
  const db = await ensureDb();
  return db.prepare('SELECT * FROM tag WHERE name = ?').get(name);
}
