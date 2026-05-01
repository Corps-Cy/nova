import { Command } from 'commander';
import { getDb } from '../store/db.js';
import { formatMoney } from '../ui/utils.js';

export function registerWeekCommand(program: Command) {
  const cmd = program.command('week').alias('w').description('📅 周报');

  cmd.command('report')
    .description('生成本周报告')
    .action(() => {
      const db = getDb();

      // This week's completed tasks
      const completed = db.prepare(`
        SELECT t.*, p.name as project_name FROM task t
        LEFT JOIN project p ON t.project_id = p.id
        WHERE t.status = 'done'
          AND t.updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
      `).all() as any[];

      // This week's hours
      const hours = db.prepare(`
        SELECT COALESCE(SUM(time_spent), 0) as total FROM task
        WHERE updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
      `).get() as any;

      // This week's payments
      const payments = db.prepare(`
        SELECT COALESCE(SUM(received), 0) as total FROM project
        WHERE updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
          AND received > 0
      `).get() as any;

      // Task stats
      const stats = db.prepare(`
        SELECT status, COUNT(*) as count FROM task
        WHERE updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
        GROUP BY status
      `).all() as any[];

      // Overdue tasks
      const overdue = db.prepare(`
        SELECT t.*, p.name as project_name FROM task t
        LEFT JOIN project p ON t.project_id = p.id
        WHERE t.status != 'done' AND t.due_date != '' AND t.due_date < date('now')
      `).all() as any[];

      const statsText = stats.map((s: any) => `${s.status}: ${s.count}`).join(', ') || '无';

      console.log(`\n📅 周报 — ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}\n`);
      console.log(`📊 本周任务变动: ${statsText}`);
      console.log(`⏱️  累计工时: ${hours.total}h`);
      console.log(`💰 本周收款: ${formatMoney(payments.total)}`);

      if (completed.length > 0) {
        console.log(`\n✅ 已完成任务 (${completed.length}):`);
        completed.forEach((t: any) => {
          const proj = t.project_name ? ` [${t.project_name}]` : '';
          console.log(`   · ${t.title}${proj}`);
        });
      }

      if (overdue.length > 0) {
        console.log(`\n⚠️  逾期任务 (${overdue.length}):`);
        overdue.forEach((t: any) => {
          const proj = t.project_name ? ` [${t.project_name}]` : '';
          console.log(`   · ${t.title} (截止: ${t.due_date})${proj}`);
        });
      }

      console.log('');
    });
}
