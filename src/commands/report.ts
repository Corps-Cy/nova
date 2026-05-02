import { Command } from 'commander';
import { ensureDb } from '../store/db.js';
import { formatMoney } from '../ui/utils.js';

export function registerReportCommand(program: Command) {
  const cmd = program.command('report').alias('r').description('📊 数据报表');

  cmd.command('income')
    .description('收入统计报表')
    .option('-m, --month <month>', '指定月份 (YYYY-MM)')
    .option('-q, --quarter <q>', '指定季度 (1-4)')
    .action(async (opts) => {
      const db = await ensureDb();
      let dateFilter = '';
      let label = '全部';

      if (opts.quarter) {
        const year = new Date().getFullYear();
        const q = parseInt(opts.quarter);
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = q * 3;
        dateFilter = `AND p.updated_at >= '${year}-${String(startMonth).padStart(2, '0')}-01' AND p.updated_at < '${year}-${String(endMonth + 1).padStart(2, '0')}-01'`;
        label = `${year}年 Q${q}`;
      } else if (opts.month) {
        const [y, m] = opts.month.split('-');
        const nextM = parseInt(m) + 1;
        const nextY = nextM > 12 ? parseInt(y) + 1 : parseInt(y);
        const nextMStr = nextM > 12 ? '01' : String(nextM).padStart(2, '0');
        dateFilter = `AND p.updated_at >= '${y}-${m}-01' AND p.updated_at < '${nextY}-${nextMStr}-01'`;
        label = `${y}年${parseInt(m)}月`;
      }

      // Total income
      const total = db.prepare(`SELECT COALESCE(SUM(received), 0) as total FROM project p WHERE 1=1 ${dateFilter}`).get() as any;

      // By project
      const byProject = db.prepare(`SELECT p.name, p.received, p.budget FROM project p WHERE p.received > 0 ${dateFilter} ORDER BY p.received DESC`).all() as any[];

      // By client
      const byClient = db.prepare(`
        SELECT c.name as client_name, SUM(p.received) as total
        FROM project p JOIN client c ON p.client_id = c.id
        WHERE p.received > 0 ${dateFilter}
        GROUP BY c.id ORDER BY total DESC
      `).all() as any[];

      // Budget vs received
      const budgetTotal = db.prepare(`SELECT COALESCE(SUM(budget), 0) as total FROM project p WHERE 1=1 ${dateFilter}`).get() as any;

      const totalBudget = budgetTotal.total || 0;
      const totalReceived = total.total || 0;
      const pct = totalBudget > 0 ? Math.round((totalReceived / totalBudget) * 100) : 0;
      const filled = Math.round(pct / 5);
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

      console.log(`\n📊 收入报表 — ${label}\n`);
      console.log(`  总预算: ${formatMoney(totalBudget)}`);
      console.log(`  已收款: ${formatMoney(totalReceived)}`);
      console.log(`  回款率: ${bar} ${pct}%`);

      if (byProject.length > 0) {
        console.log(`\n  📦 按项目:`);
        byProject.forEach((p: any) => {
          const pPct = p.budget > 0 ? Math.round((p.received / p.budget) * 100) : 100;
          console.log(`    ${p.name.padEnd(16)} ${formatMoney(p.received).padStart(12)} (${pPct}%)`);
        });
      }

      if (byClient.length > 0) {
        console.log(`\n  👤 按客户:`);
        byClient.forEach((c: any) => {
          console.log(`    ${c.client_name.padEnd(16)} ${formatMoney(c.total).padStart(12)}`);
        });
      }

      console.log('');
    });

  cmd.command('time')
    .description('工时统计')
    .option('-m, --month <month>', '指定月份 (YYYY-MM)')
    .action(async (opts) => {
      const db = await ensureDb();
      let dateFilter = '';
      let label = '全部';

      if (opts.month) {
        const [y, m] = opts.month.split('-');
        const nextM = parseInt(m) + 1;
        const nextY = nextM > 12 ? parseInt(y) + 1 : parseInt(y);
        const nextMStr = nextM > 12 ? '01' : String(nextM).padStart(2, '0');
        dateFilter = `AND t.updated_at >= '${y}-${m}-01' AND t.updated_at < '${nextY}-${nextMStr}-01'`;
        label = `${y}年${parseInt(m)}月`;
      }

      const total = db.prepare(`SELECT COALESCE(SUM(time_spent), 0) as total FROM task t WHERE 1=1 ${dateFilter}`).get() as any;
      const byProject = db.prepare(`
        SELECT p.name as project_name, SUM(t.time_spent) as hours
        FROM task t LEFT JOIN project p ON t.project_id = p.id
        WHERE t.time_spent > 0 ${dateFilter}
        GROUP BY t.project_id ORDER BY hours DESC
      `).all() as any[];

      console.log(`\n⏱️  工时报表 — ${label}\n`);
      console.log(`  总工时: ${total.total}h`);

      if (byProject.length > 0) {
        console.log(`\n  按项目:`);
        byProject.forEach((p: any) => {
          const barLen = Math.min(20, Math.round((p.hours / total.total) * 20));
          console.log(`    ${p.project_name.padEnd(16)} ${p.hours}h ${'█'.repeat(barLen)}`);
        });
      }
      console.log('');
    });
}
