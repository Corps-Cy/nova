import { Command } from 'commander';
import { createTag, listTags, deleteTag, addTaskTag, removeTaskTag, getTaskTags } from '../store/tag.js';

export function registerTagCommand(program: Command) {
  const cmd = program.command('tag').alias('tg').description('🏷️  标签管理');

  cmd.command('list').alias('ls')
    .description('列出所有标签')
    .action(async () => {
      const tags = await listTags() as any[];
      if (tags.length === 0) {
        console.log('\n  💤 暂无标签\n');
        return;
      }
      console.log('\n🏷️  标签列表\n');
      tags.forEach(t => {
        const count = (t as any)._count !== undefined ? ` (${(t as any)._count})` : '';
        console.log(`  ${t.name}${count}`);
      });
      console.log('');
    });

  cmd.command('add <name>')
    .description('创建标签')
    .option('-c, --color <color>', '颜色 (hex)', '#8b5cf6')
    .action(async (name, opts) => {
      try {
        const tag = await createTag({ name, color: opts.color });
        console.log(`\n✅ 标签已创建: ${tag.name}`);
      } catch (e: any) {
        console.log(`\n❌ ${e.message}`);
      }
    });

  cmd.command('rm <name>')
    .description('删除标签')
    .action(async (name) => {
      const tag = await (await import('../store/tag.js')).getTagByName(name) as any;
      if (!tag) { console.log(`\n❌ 标签 "${name}" 不存在`); return; }
      await deleteTag(tag.id);
      console.log(`\n🗑️ 标签已删除: ${name}`);
    });

  // Task tag management
  cmd.command('add-to <taskId> <tagName>')
    .description('给任务添加标签')
    .action(async (taskId, tagName) => {
      await addTaskTag(taskId, tagName);
      console.log(`\n✅ 已添加标签: ${tagName}`);
    });

  cmd.command('rm-from <taskId> <tagName>')
    .description('移除任务标签')
    .action(async (taskId, tagName) => {
      await removeTaskTag(taskId, tagName);
      console.log(`\n✅ 已移除标签: ${tagName}`);
    });

  cmd.command('show <taskId>')
    .description('查看任务标签')
    .action(async (taskId) => {
      const tags = await getTaskTags(taskId) as any[];
      if (tags.length === 0) {
        console.log('\n  💤 无标签\n');
        return;
      }
      console.log(`\n🏷️  任务标签:`);
      tags.forEach(t => console.log(`  ${t.name}`));
      console.log('');
    });
}
