import { Command } from 'commander';
import { listClients } from '../store/client.js';
import { listProjects } from '../store/project.js';
import { listTasks, getTaskStats } from '../store/task.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export function registerExportCommand(program: Command) {
  const cmd = program.command('export').alias('e').description('📤 导出数据');

  cmd.command('json')
    .description('导出全部数据为 JSON')
    .option('-o, --output <file>', '输出文件路径')
    .action((opts) => {
      const data = {
        exported_at: new Date().toISOString(),
        clients: listClients(),
        projects: listProjects(),
        tasks: listTasks(),
        stats: getTaskStats(),
      };
      const json = JSON.stringify(data, null, 2);
      if (opts.output) {
        writeFileSync(opts.output, json, 'utf8');
        console.log(`✅ 已导出到 ${opts.output}`);
      } else {
        console.log(json);
      }
    });

  cmd.command('csv <type>')
    .description('导出指定类型为 CSV (client/project/task)')
    .option('-o, --output <file>', '输出文件路径')
    .action((type, opts) => {
      let rows: any[];
      let headers: string[];

      switch (type) {
        case 'client':
          rows = listClients() as any[];
          headers = ['id', 'name', 'company', 'contact', 'email', 'notes', 'created_at'];
          break;
        case 'project':
          rows = listProjects() as any[];
          headers = ['id', 'name', 'client_name', 'status', 'budget', 'received', 'notes', 'created_at'];
          break;
        case 'task':
          rows = listTasks() as any[];
          headers = ['id', 'title', 'status', 'priority', 'project_id', 'time_spent', 'due_date', 'created_at'];
          break;
        default:
          console.log('❌ 类型无效，可选: client, project, task');
          return;
      }

      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => {
          const val = String(r[h] ?? '');
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(','))
      ].join('\n');

      if (opts.output) {
        writeFileSync(opts.output, csv, 'utf8');
        console.log(`✅ 已导出到 ${opts.output}`);
      } else {
        console.log(csv);
      }
    });
}
