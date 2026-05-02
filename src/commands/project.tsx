import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { Box, Text } from 'ink';
import { listProjects, createProject, getProject, updateProject, deleteProject } from '../store/project.js';
import { Table, Header, Money, ProgressBar, StatusBadge, Divider } from '../ui/index.js';
import { ensureDb } from '../store/db.js';

export function registerProjectCommand(program: Command) {
  const cmd = program.command('project').alias('p').description('📦 项目管理');

  cmd.command('list').alias('ls')
    .description('列出所有项目')
    .option('-s, --status <status>', '按状态筛选')
    .action(async (opts) => {
      let projects = (await listProjects()) as any[];
      if (opts.status) projects = projects.filter((p: any) => p.status === opts.status);
      render(
        <Box flexDirection="column">
          <Header title="项目列表" subtitle={`${projects.length} 个项目`} />
          <Table
            columns={[
              { key: 'name', label: '项目名', width: 18 },
              { key: 'client_name', label: '客户', width: 12 },
              { key: '_budget', label: '预算', width: 12, render: (v: string) => <Money amount={parseFloat(v.replace(/[^0-9.-]/g, '')) || 0} /> },
              { key: '_received', label: '已收', width: 12, render: (v: string) => <Money amount={parseFloat(v.replace(/[^0-9.-]/g, '')) || 0} /> },
              { key: 'status', label: '状态', width: 10, render: (v: string) => <StatusBadge status={v} /> },
              { key: '_id', label: 'ID', width: 8 },
            ]}
            rows={projects.map((p: any) => ({
              ...p,
              _budget: `¥${p.budget.toLocaleString()}`,
              _received: `¥${p.received.toLocaleString()}`,
              _id: p.id.slice(0, 6),
            }))}
            footer={`合计预算: ¥${projects.reduce((s: number, p: any) => s + (p.budget || 0), 0).toLocaleString()}`}
          />
        </Box>
      );
    });

  cmd.command('add <name>')
    .description('添加项目')
    .requiredOption('-C, --client-id <clientId>', '客户ID')
    .option('-b, --budget <budget>', '预算金额', Number, 0)
    .action(async (name, opts) => {
      const project = await createProject({ client_id: opts.clientId, name, budget: opts.budget });
      console.log(`\n✅ 项目已添加: ${project.name} (${project.id.slice(0, 6)})`);
    });

  cmd.command('edit <id>')
    .description('编辑项目')
    .option('-n, --name <name>', '项目名')
    .option('-b, --budget <budget>', '预算', Number)
    .option('--notes <notes>', '备注')
    .action(async (id, opts) => {
      const data: Record<string, any> = {};
      if (opts.name !== undefined) data.name = opts.name;
      if (opts.budget !== undefined) data.budget = opts.budget;
      if (opts.notes !== undefined) data.notes = opts.notes;
      if (Object.keys(data).length === 0) { console.log('❌ 请至少指定一个要修改的字段'); return; }
      await updateProject(id, data);
      console.log('✅ 项目信息已更新');
    });

  cmd.command('status <id> <status>')
    .description('更新项目状态')
    .action(async (id, status) => {
      const valid = ['requirement', 'development', 'review', 'delivered'];
      if (!valid.includes(status)) {
        console.log(`❌ 无效状态，可选: ${valid.join(', ')}`);
        return;
      }
      const db = await ensureDb();
      db.prepare("UPDATE project SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
      console.log(`✅ 项目状态已更新为: ${status}`);
    });

  cmd.command('pay <id> <amount>')
    .description('记录收款')
    .action(async (id, amount) => {
      const db = await ensureDb();
      db.prepare("UPDATE project SET received = received + ?, updated_at = datetime('now') WHERE id = ?").run(Number(amount), id);
      console.log(`\n💰 已记录收款: ¥${Number(amount).toLocaleString()}`);
    });

  cmd.command('show <id>')
    .description('查看项目详情')
    .action(async (id) => {
      const p = (await getProject(id)) as any;
      if (!p) { console.log('❌ 未找到'); return; }
      console.log(`\n📦 ${p.name}`);
      console.log(`   状态: ${p.status}`);
      console.log(`   预算: ¥${(p.budget || 0).toLocaleString()}`);
      console.log(`   已收: ¥${(p.received || 0).toLocaleString()}`);
      if (p.budget > 0) {
        const pct = Math.round((p.received / p.budget) * 100);
        const filled = Math.round(pct / 5);
        const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
        console.log(`   进度: ${bar} ${pct}%`);
      }
      if (p.notes) console.log(`   备注: ${p.notes}`);
      console.log('');
    });

  cmd.command('rm <id>').description('删除项目').action(async (id) => {
    await deleteProject(id);
    console.log('🗑️ 项目已删除');
  });
}
