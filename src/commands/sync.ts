import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { ensureDb } from '../store/db.js';
import { randomUUID } from 'crypto';

export function registerSyncCommand(program: Command) {
  const cmd = program.command('sync').alias('s').description('🔄 数据同步');

  cmd.command('export <file>')
    .description('导出数据到文件')
    .action(async (file) => {
      const db = await ensureDb();
      const data = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        clients: db.prepare('SELECT * FROM client').all(),
        projects: db.prepare('SELECT * FROM project').all(),
        tasks: db.prepare('SELECT * FROM task').all(),
        tags: db.prepare('SELECT * FROM tag').all(),
        task_tags: db.prepare('SELECT * FROM task_tag').all(),
        notes: db.prepare('SELECT * FROM project_note').all(),
        prompts: db.prepare('SELECT * FROM prompt_template').all(),
      };
      writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`\n✅ 数据已导出到 ${file}`);
      console.log(`   客户: ${data.clients.length}  项目: ${data.projects.length}  任务: ${data.tasks.length}\n`);
    });

  cmd.command('import <file>')
    .description('从文件导入数据')
    .option('--merge', '合并模式（保留现有数据）', false)
    .option('--replace', '替换模式（清空后导入）', false)
    .action(async (file) => {
      if (!existsSync(file)) {
        console.log(`\n❌ 文件不存在: ${file}`);
        return;
      }

      const data = JSON.parse(readFileSync(file, 'utf8'));
      if (!data.version) {
        console.log(`\n❌ 无效的数据文件`);
        return;
      }

      const db = await ensureDb();

      if (data.replace || !data.merge) {
        console.log('\n⚠️  替换模式：将清空现有数据');
        db.exec('DELETE FROM task_tag');
        db.exec('DELETE FROM project_note');
        db.exec('DELETE FROM task');
        db.exec('DELETE FROM project');
        db.exec('DELETE FROM client');
        db.exec('DELETE FROM tag');
        db.exec('DELETE FROM prompt_template');
        db.exec('DELETE FROM chat_history');
      }

      // Import clients
      let imported = 0;
      const idMap: Record<string, string> = {};
      if (data.clients) {
        for (const c of data.clients) {
          idMap[c.id] = c.id;
          const exists = db.prepare('SELECT 1 FROM client WHERE id = ?').get(c.id);
          if (exists && data.merge) continue;
          db.prepare('INSERT OR REPLACE INTO client (id, name, company, contact, email, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
            .run(c.id, c.name, c.company || '', c.contact || '', c.email || '', c.notes || '', c.created_at, c.updated_at);
          imported++;
        }
      }
      console.log(`  客户: ${imported}`);

      // Import projects
      imported = 0;
      if (data.projects) {
        for (const p of data.projects) {
          const exists = db.prepare('SELECT 1 FROM project WHERE id = ?').get(p.id);
          if (exists && data.merge) continue;
          db.prepare('INSERT OR REPLACE INTO project (id, client_id, name, status, budget, received, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
            .run(p.id, p.client_id, p.name, p.status, p.budget || 0, p.received || 0, p.notes || '', p.created_at, p.updated_at);
          imported++;
        }
      }
      console.log(`  项目: ${imported}`);

      // Import tasks
      imported = 0;
      if (data.tasks) {
        for (const t of data.tasks) {
          const exists = db.prepare('SELECT 1 FROM task WHERE id = ?').get(t.id);
          if (exists && data.merge) continue;
          db.prepare('INSERT OR REPLACE INTO task (id, title, description, status, priority, project_id, time_spent, due_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
            .run(t.id, t.title, t.description || '', t.status, t.priority, t.project_id, t.time_spent || 0, t.due_date || '', t.created_at, t.updated_at);
          imported++;
        }
      }
      console.log(`  任务: ${imported}`);

      // Import tags
      imported = 0;
      if (data.tags) {
        for (const t of data.tags) {
          db.prepare('INSERT OR REPLACE INTO tag (id, name, color, created_at) VALUES (?,?,?,?)')
            .run(t.id, t.name, t.color || '#8b5cf6', t.created_at);
          imported++;
        }
      }
      console.log(`  标签: ${imported}`);

      // Import task_tags
      if (data.task_tags) {
        for (const tt of data.task_tags) {
          db.prepare('INSERT OR REPLACE INTO task_tag (task_id, tag_id) VALUES (?,?)').run(tt.task_id, tt.tag_id);
        }
      }

      // Import notes
      if (data.notes) {
        for (const n of data.notes) {
          db.prepare('INSERT OR REPLACE INTO project_note (id, project_id, title, content, created_at, updated_at) VALUES (?,?,?,?,?,?)')
            .run(n.id, n.project_id, n.title, n.content || '', n.created_at, n.updated_at);
        }
      }

      console.log(`\n✅ 数据导入完成\n`);
    });
}
