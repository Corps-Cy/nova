import { Command } from 'commander';
import { createNote, listNotes, getNote, updateNote, deleteNote } from '../store/note.js';

export function registerNoteCommand(program: Command) {
  const cmd = program.command('note').alias('n').description('📝 项目笔记');

  cmd.command('list').alias('ls')
    .description('列出项目笔记')
    .requiredOption('-P, --project-id <projectId>', '项目ID')
    .action(async (opts) => {
      const notes = await listNotes(opts.projectId) as any[];
      if (notes.length === 0) {
        console.log('\n  💤 暂无笔记\n');
        return;
      }
      console.log(`\n📝 项目笔记 (${notes.length})\n`);
      notes.forEach(n => {
        const preview = n.content.length > 50 ? n.content.slice(0, 50) + '...' : n.content;
        console.log(`  [${n.id.slice(0, 6)}] ${n.title}`);
        console.log(`    ${preview}`);
      });
      console.log('');
    });

  cmd.command('add <title>')
    .description('添加笔记')
    .requiredOption('-P, --project-id <projectId>', '项目ID')
    .option('-c, --content <text>', '内容')
    .action(async (title, opts) => {
      const note = await createNote({ project_id: opts.projectId, title, content: opts.content });
      console.log(`\n✅ 笔记已添加: ${note.title} (${note.id.slice(0, 6)})`);
    });

  cmd.command('edit <id>')
    .description('编辑笔记')
    .option('-t, --title <title>', '标题')
    .option('-c, --content <text>', '内容')
    .action(async (id, opts) => {
      const data: Record<string, string> = {};
      if (opts.title !== undefined) data.title = opts.title;
      if (opts.content !== undefined) data.content = opts.content;
      if (Object.keys(data).length === 0) { console.log('❌ 请指定要修改的字段'); return; }
      await updateNote(id, data);
      console.log('✅ 笔记已更新');
    });

  cmd.command('show <id>')
    .description('查看笔记详情')
    .action(async (id) => {
      const n = await getNote(id);
      if (!n) { console.log('❌ 未找到'); return; }
      console.log(`\n📝 ${n.title}`);
      console.log(`   ${'-'.repeat(30)}`);
      console.log(`   ${n.content || '(空)'}`);
      console.log(`   ${'-'.repeat(30)}`);
      console.log(`   更新: ${n.updated_at}\n`);
    });

  cmd.command('rm <id>')
    .description('删除笔记')
    .action(async (id) => {
      await deleteNote(id);
      console.log('🗑️ 笔记已删除');
    });
}
