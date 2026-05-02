import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { Box, Text } from 'ink';
import { listClients, createClient, deleteClient, updateClient, getClient } from '../store/client.js';
import { Table, Header, Divider } from '../ui/index.js';

export function registerClientCommand(program: Command) {
  const cmd = program.command('client').alias('c').description('🏢 客户管理');

  cmd.command('list').alias('ls')
    .description('列出所有客户')
    .option('-k, --search <keyword>', '搜索客户')
    .action(async (opts) => {
      const clients = (await listClients(opts.search)) as any[];
      render(
        <Box flexDirection="column">
          <Header title="客户列表" subtitle={`${clients.length} 位客户`} />
          <Table
            columns={[
              { key: 'name', label: '名称', width: 16 },
              { key: 'company', label: '公司', width: 16 },
              { key: 'contact', label: '联系人', width: 10 },
              { key: 'email', label: '邮箱', width: 24 },
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
    .action(async (name, opts) => {
      const client = await createClient({ name, ...opts });
      console.log(`\n✅ 客户已添加: ${client.name} (${client.id.slice(0, 6)})`);
    });

  cmd.command('show <id>')
    .description('查看客户详情')
    .action(async (id) => {
      const c = await getClient(id);
      if (!c) { console.log('❌ 未找到客户'); return; }
      console.log(`\n🏢 ${c.name}`);
      if (c.company) console.log(`   公司: ${c.company}`);
      if (c.contact) console.log(`   联系: ${c.contact}`);
      if (c.email) console.log(`   邮箱: ${c.email}`);
      if (c.notes) console.log(`   备注: ${c.notes}`);
      console.log(`   创建: ${c.created_at}\n`);
    });

  cmd.command('edit <id>')
    .description('编辑客户')
    .option('-c, --company <company>')
    .option('-t, --contact <contact>')
    .option('-e, --email <email>')
    .option('-n, --notes <notes>')
    .action(async (id, opts) => {
      const data: Record<string, string> = {};
      if (opts.company !== undefined) data.company = opts.company;
      if (opts.contact !== undefined) data.contact = opts.contact;
      if (opts.email !== undefined) data.email = opts.email;
      if (opts.notes !== undefined) data.notes = opts.notes;
      if (Object.keys(data).length === 0) { console.log('❌ 请至少指定一个要修改的字段'); return; }
      await updateClient(id, data);
      console.log('✅ 客户信息已更新');
    });

  cmd.command('rm <id>').description('删除客户').action(async (id) => {
    await deleteClient(id);
    console.log('🗑️ 客户已删除');
  });
}
