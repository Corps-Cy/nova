import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { Box, Text } from 'ink';
import { listClients, createClient, deleteClient, updateClient } from '../../store/client.js';
import { listProjects, createProject, updateProjectStatus, updateProjectPayment } from '../../store/project.js';
import { Table, Header, Select, Input, colorizeStatus, formatMoney } from '../../ui/index.js';
import { useState } from 'react';
import { useInput, useApp } from 'ink';

export function registerClientCommand(program: Command) {
  const cmd = program.command('client').alias('c').description('🏢 客户管理');

  cmd.command('list').alias('ls').description('列出所有客户').action(() => {
    const clients = listClients() as any[];
    render(
      <Box flexDirection="column">
        <Header title="客户列表" />
        <Table
          title=""
          columns={[
            { key: 'name', label: '名称', width: 16 },
            { key: 'company', label: '公司', width: 16 },
            { key: 'contact', label: '联系人', width: 10 },
            { key: 'email', label: '邮箱', width: 22 },
            { key: '_id', label: 'ID', width: 8 },
          ]}
          rows={clients.map(c => ({ ...c, _id: c.id.slice(0, 6) }))}
        />
      </Box>
    );
  });

  cmd.command('add <name>')
    .description('添加客户')
    .option('-c, --company <company>', '公司名称')
    .option('-t, --contact <contact>', '联系人')
    .option('-e, --email <email>', '邮箱')
    .option('-n, --notes <notes>', '备注')
    .action((name, opts) => {
      const client = createClient({ name, ...opts });
      console.log(`✅ 客户已添加: ${client.name} (${client.id.slice(0, 6)})`);
    });

  cmd.command('edit <id>')
    .description('编辑客户')
    .option('-c, --company <company>')
    .option('-t, --contact <contact>')
    .option('-e, --email <email>')
    .option('-n, --notes <notes>')
    .action((id, opts) => {
      const data: Record<string, string> = {};
      if (opts.company !== undefined) data.company = opts.company;
      if (opts.contact !== undefined) data.contact = opts.contact;
      if (opts.email !== undefined) data.email = opts.email;
      if (opts.notes !== undefined) data.notes = opts.notes;
      if (Object.keys(data).length === 0) {
        console.log('❌ 请至少指定一个要修改的字段');
        return;
      }
      updateClient(id, data);
      console.log(`✅ 客户信息已更新`);
    });

  cmd.command('rm <id>').description('删除客户').action((id) => {
    deleteClient(id);
    console.log(`🗑️ 客户已删除`);
  });
}

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
