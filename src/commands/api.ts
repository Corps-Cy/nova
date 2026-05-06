import { Command } from 'commander';
import { createApiKey, listApiKeys, deleteApiKey } from '../store/apiKey.js';

export function registerApiCommand(program: Command) {
  const cmd = program.command('api').description('🔑 API Key 管理');

  cmd.command('keys').alias('ls')
    .description('列出所有 API Key')
    .action(() => {
      const keys = listApiKeys() as any[];
      if (keys.length === 0) {
        console.log('\n  💤 暂无 API Key\n');
        return;
      }
      console.log('\n🔑 API Keys\n');
      keys.forEach(k => {
        const keyPreview = k.key.slice(0, 15) + '...' + k.key.slice(-8);
        const kbName = k.kb_name ? ` [${k.kb_name}]` : ' [全部]';
        console.log(`  ${keyPreview} — ${k.name || '未命名'}${kbName}`);
      });
      console.log('');
    });

  cmd.command('create')
    .description('创建 API Key')
    .option('-n, --name <name>', '名称')
    .option('-k, --kb <kbId>', '绑定知识库')
    .action((opts) => {
      const result = createApiKey({ name: opts.name, kb_id: opts.kb });
      console.log(`\n✅ API Key 已创建\n`);
      console.log(`  Key: ${result.key}`);
      if (result.name) console.log(`  名称: ${result.name}`);
      console.log(`\n  使用方式:`);
      console.log(`  Authorization: Bearer ${result.key}\n`);
    });

  cmd.command('delete <id>')
    .description('删除 API Key')
    .action((id) => {
      deleteApiKey(id);
      console.log('🗑️ API Key 已删除');
    });
}
