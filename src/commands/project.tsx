import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { Box } from 'ink';
import { listProjects, createProject } from '../store/project.js';
import { Table, Header, formatMoney } from '../ui/index.js';
import { getDb } from '../store/db.js';

export function registerProjectCommand(program: Command) {
  const cmd = program.command('project').alias('p').description('📦 项目管理');

  cmd.command('list').alias('ls').description('列出所有项目').action(() => {
    const projects = listProjects() as any[];
    render(
      <Box flexDirection="column">
        <Header title="项目列表" />
        <Table
          columns={[
            { key: 'name', label: '项目名', width: 20 },
            { key: 'client_name', label: '客户', width: 14 },
            { key: '_budget', label: '预算', width: 12 },
            { key: '_received', label: '已收', width: 12 },
            { key: 'status', label: '状态', width: 10 },
          ]}
          rows={projects.map(p => ({
            ...p,
            _budget: formatMoney(p.budget),
            _received: formatMoney(p.received),
          }))}
        />
      </Box>
    );
  });

  cmd.command('add <name>')
    .description('添加项目')
    .requiredOption('-C, --client-id <clientId>', '客户ID')
    .option('-b, --budget <budget>', '预算金额', Number, 0)
    .action((name, opts) => {
      const project = createProject({ client_id: opts.clientId, name, budget: opts.budget });
      console.log(`✅ 项目已添加: ${project.name} (${project.id.slice(0, 6)})`);
    });

  cmd.command('status <id> <status>')
    .description('更新项目状态')
    .action((id, status) => {
      const valid = ['requirement', 'development', 'review', 'delivered'];
      if (!valid.includes(status)) {
        console.log(`❌ 无效状态，可选: ${valid.join(', ')}`);
        return;
      }
      getDb().prepare("UPDATE project SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
      console.log(`✅ 项目状态已更新为: ${status}`);
    });

  cmd.command('pay <id> <amount>')
    .description('记录收款')
    .action((id, amount) => {
      getDb().prepare("UPDATE project SET received = received + ?, updated_at = datetime('now') WHERE id = ?").run(Number(amount), id);
      console.log(`💰 已记录收款: ¥${amount}`);
    });
}
