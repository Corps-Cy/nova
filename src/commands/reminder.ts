import { Command } from 'commander';
import { ensureDb } from '../store/db.js';
import { formatMoney } from '../ui/utils.js';

export function registerReminderCommand(program: Command) {
  program.command('check')
    .description('🔔 检查提醒（逾期任务 + 近期截止）')
    .action(async () => {
      const db = await ensureDb();

      // Overdue tasks
      const overdue = db.prepare(`
        SELECT t.*, p.name as project_name FROM task t
        LEFT JOIN project p ON t.project_id = p.id
        WHERE t.status != 'done' AND t.due_date != '' AND t.due_date < date('now')
        ORDER BY t.due_date
      `).all() as any[];

      // Due within 3 days
      const upcoming = db.prepare(`
        SELECT t.*, p.name as project_name FROM task t
        LEFT JOIN project p ON t.project_id = p.id
        WHERE t.status != 'done' AND t.due_date != '' AND t.due_date >= date('now') AND t.due_date <= date('now', '+3 days')
        ORDER BY t.due_date
      `).all() as any[];

      if (overdue.length === 0 && upcoming.length === 0) {
        console.log('\n✅ 一切正常，没有需要关注的任务\n');
        return;
      }

      if (overdue.length > 0) {
        console.log(`\n⚠️  逾期任务 (${overdue.length})\n`);
        overdue.forEach(t => {
          const proj = t.project_name ? ` [${t.project_name}]` : '';
          console.log(`  🔴 ${t.title}${proj}`);
          console.log(`     截止: ${t.due_date}  |  状态: ${t.status}`);
        });
      }

      if (upcoming.length > 0) {
        console.log(`\n⏰ 近期截止 (${upcoming.length})\n`);
        upcoming.forEach(t => {
          const proj = t.project_name ? ` [${t.project_name}]` : '';
          const daysLeft = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86400000);
          const urgency = daysLeft === 0 ? '🔴 今天' : daysLeft === 1 ? '🟡 明天' : `🟢 ${daysLeft}天后`;
          console.log(`  ${urgency} ${t.title}${proj}`);
          console.log(`     截止: ${t.due_date}`);
        });
      }

      console.log('');
    });
}
