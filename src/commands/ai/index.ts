import { Command } from 'commander';
import { listPrompts, createPrompt, getPrompt, deletePrompt } from '../../store/prompt.js';

export function registerAICommand(program: Command) {
  const cmd = program.command('ai').description('🤖 AI 工具链');

  cmd.command('prompt')
    .description('Prompt 模板管理')
    .addCommand(
      new Command('list')
        .description('列出模板')
        .option('-c, --category <cat>', '按分类筛选')
        .action((opts) => {
          const prompts = listPrompts(opts.category) as any[];
          if (prompts.length === 0) {
            console.log('暂无 Prompt 模板');
            return;
          }
          prompts.forEach(p => {
            console.log(`\n📌 ${p.name} [${p.category}]`);
            console.log(`   ${p.content.slice(0, 100)}${p.content.length > 100 ? '…' : ''}`);
            console.log(`   ID: ${p.id.slice(0, 6)}`);
          });
        })
    )
    .addCommand(
      new Command('add <name>')
        .description('添加模板')
        .option('-c, --category <cat>', '分类', 'general')
        .action((name, opts) => {
          // Read from stdin or --content
          console.log('请输入 prompt 内容（输入 END 结束）:');
          process.stdin.setEncoding('utf8');
          let content = '';
          process.stdin.on('data', (chunk) => {
            if (chunk.trim() === 'END') {
              const p = createPrompt({ name, category: opts.category, content: content.trim() });
              console.log(`\n✅ Prompt 已保存: ${p.name} (${p.id.slice(0, 6)})`);
              process.exit(0);
            }
            content += chunk;
          });
        })
    )
    .addCommand(
      new Command('show <id>')
        .description('查看模板详情')
        .action((id) => {
          const p = getPrompt(id);
          if (!p) { console.log('❌ 未找到'); return; }
          console.log(`\n📌 ${p.name} [${p.category}]\n${p.content}\n`);
        })
    )
    .addCommand(
      new Command('rm <id>')
        .description('删除模板')
        .action((id) => {
          deletePrompt(id);
          console.log('🗑️ 已删除');
        })
    );
}
