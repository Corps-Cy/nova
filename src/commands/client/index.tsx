import React from 'react';
import { render, Box, Text } from 'ink';
import { Command } from 'commander';
import { listClients, createClient, deleteClient } from '../../store/client.js';
import { listProjects, createProject } from '../../store/project.js';
import { Table, Header } from '../../ui/index.js';
// @ts-ignore JSX
import { colorizeStatus, formatMoney } from '../../ui/utils.js';

const STATUS_OPTIONS = ['requirement', 'development', 'review', 'delivered'];

export function registerClientCommand(program: Command) {
  const cmd = program.command('client').description('🏢 客户管理');

  cmd.command('list').description('列出所有客户').action(() => {
    const clients = listClients() as any[];
    render(
      <Box flexDirection="column">
        <Header title="客户列表" />
        <Table title="" items={clients.map(c => [
          c.name, c.company || '-', c.contact || '-', c.email || '-', c.id.slice(0, 6)
        ])} widths={[16, 14, 12, 20, 8]} />
      </Box>
    );
  });

  cmd.command('add <name>')
    .description('添加客户')
    .option('-c, --company <company>', '公司名称')
    .option('-t, --contact <contact>', '联系人')
    .option('-e, --email <email>', '邮箱')
    .action((name, opts) => {
      const client = createClient({ name, ...opts });
      console.log(`✅ 客户已添加: ${client.name} (${client.id.slice(0, 6)})`);
    });

  cmd.command('rm <id>')
    .description('删除客户')
    .action((id) => {
      deleteClient(id);
      console.log(`🗑️ 客户已删除`);
    });
}

export function registerProjectCommand(program: Command) {
  const cmd = program.command('project').description('📦 项目管理');

  cmd.command('list').description('列出所有项目').action(() => {
    const projects = listProjects() as any[];
    render(
      <Box flexDirection="column">
        <Header title="项目列表" />
        <Table title="" items={projects.map(p => [
          p.name, p.client_name || '-', formatMoney(p.budget), formatMoney(p.received), p.status
        ])} widths={[20, 12, 10, 10, 10]} />
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
      if (!STATUS_OPTIONS.includes(status)) {
        console.log(`❌ 无效状态，可选: ${STATUS_OPTIONS.join(', ')}`);
        return;
      }
      updateProjectStatus(id, status);
      console.log(`✅ 项目状态已更新为: ${status}`);
    });

  cmd.command('pay <id> <amount>')
    .description('记录收款')
    .action((id, amount) => {
      updateProjectPayment(id, Number(amount));
      console.log(`💰 已记录收款: ¥${amount}`);
    });
}

function updateProjectStatus(id: string, status: string) {
  const { getDb } = require('../../store/db.js');
  getDb().prepare('UPDATE project SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
}

function updateProjectPayment(id: string, amount: number) {
  const { getDb } = require('../../store/db.js');
  getDb().prepare('UPDATE project SET received = received + ?, updated_at = datetime(\'now\') WHERE id = ?').run(amount, id);
}
