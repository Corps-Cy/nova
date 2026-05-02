import { Command } from 'commander';
import { ensureDb } from '../store/db.js';

export function registerCalendarCommand(program: Command) {
  program.command('calendar').alias('cal')
    .description('📅 日历视图')
    .option('-m, --month <month>', '指定月份 (YYYY-MM), 默认当月')
    .action(async (opts) => {
      const db = await ensureDb();

      const now = new Date();
      const year = opts.month ? parseInt(opts.month.split('-')[0]) : now.getFullYear();
      const month = opts.month ? parseInt(opts.month.split('-')[1]) - 1 : now.getMonth();

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const today = new Date();
      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
      const todayDate = today.getDate();

      // Get tasks with due dates in this month
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const tasks = db.prepare(`
        SELECT t.*, p.name as project_name FROM task t
        LEFT JOIN project p ON t.project_id = p.id
        WHERE t.due_date != '' AND t.due_date LIKE ?
        ORDER BY t.due_date
      `).all(`${monthStr}%`) as any[];

      // Group tasks by date
      const byDate: Record<string, any[]> = {};
      tasks.forEach(t => {
        const day = t.due_date.slice(8, 10);
        if (!byDate[day]) byDate[day] = [];
        byDate[day].push(t);
      });

      const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

      console.log(`\n📅 ${year}年 ${monthNames[month]}\n`);
      console.log('  日  一  二  三  四  五  六');
      console.log('  ' + '─'.repeat(28));

      // Print calendar grid
      let line = '  ';
      for (let i = 0; i < firstDay; i++) line += '   ';

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const hasTasks = byDate[dayStr] && byDate[dayStr].length > 0;
        const isToday = isCurrentMonth && day === todayDate;

        let marker = String(day).padStart(2);
        if (isToday) marker = `*${String(day).padStart(1)}`;  // will handle differently
        if (hasTasks) marker += '•';

        line += marker + ' ';

        if ((day + firstDay) % 7 === 0 || day === daysInMonth) {
          // Pad remaining
          while ((day + firstDay) % 7 !== 0 && day === daysInMonth) {
            line += '   ';
            break;
          }
          console.log(line);
          line = '  ';
        }
      }

      // Print tasks with dates
      if (tasks.length > 0) {
        console.log(`\n📋 本月任务 (${tasks.length})\n`);
        const sortedDates = Object.keys(byDate).sort();
        for (const day of sortedDates) {
          console.log(`  ${monthStr}-${day}:`);
          byDate[day].forEach((t: any) => {
            const statusIcon = t.status === 'done' ? '✅' : t.status === 'doing' ? '🔄' : t.status === 'todo' ? '⬜' : '❓';
            const proj = t.project_name ? ` [${t.project_name}]` : '';
            console.log(`    ${statusIcon} ${t.title}${proj}`);
          });
        }
      } else {
        console.log('\n  💤 本月无截止日期任务\n');
      }
    });
}
