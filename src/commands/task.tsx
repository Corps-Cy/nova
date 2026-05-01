import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { listTasks, createTask, updateTaskStatus, updateTaskTime, deleteTask, getTaskStats, getTask, updateTask } from '../store/task.js';
import { Box, Text } from 'ink';
import { Header, Select, StatusBadge, PriorityBadge, Divider } from '../ui/index.js';

const STATUS_OPTIONS = ['todo', 'doing', 'done'];

export function registerTaskCommand(program: Command) {
  const cmd = program.command('task').alias('t').description('📋 任务管理');

  cmd.command('list').alias('ls')
    .description('列出任务')
    .option('-s, --status <status>', '按状态筛选')
    .option('-P, --project-id <projectId>', '按项目筛选')
    .action((opts) => {
      const tasks = listTasks({
        status: opts.status,
        project_id: opts.projectId,
      } as any) as any[];
      render(
        <Box flexDirection="column">
          <Header title="任务列表" subtitle={`${tasks.length} 个任务`} />
          {tasks.length === 0 ? (
            <Box marginY={1}><Text dimColor>  💤 暂无任务</Text></Box>
          ) : tasks.map(t => (
            <Box key={t.id} flexDirection="row" marginY={0}>
              <Text width={3}>  </Text>
              <Text width={30} wrap="truncate-end">{t.title}</Text>
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              {t.time_spent > 0 && <Text dimColor> ⏱{t.time_spent}h</Text>}
              <Text dimColor> {t.id.slice(0, 6)}</Text>
            </Box>
          ))}
        </Box>
      );
    });

  cmd.command('board').alias('b')
    .description('看板视图')
    .option('-P, --project-id <projectId>', '按项目筛选')
    .action((opts) => {
      const all = listTasks({ project_id: opts.projectId } as any) as any[];
      const groups = [
        { label: '📋 待办', status: 'todo', color: 'gray' },
        { label: '🔄 进行中', status: 'doing', color: 'yellow' },
        { label: '✅ 已完成', status: 'done', color: 'green' },
      ];
      const maxItems = Math.max(...groups.map(g => all.filter(t => t.status === g.status).length));

      render(
        <Box flexDirection="column">
          <Header title="任务看板" subtitle={opts.projectId ? `项目: ${opts.projectId.slice(0, 6)}` : undefined} />
          <Box>
            {groups.map(g => {
              const items = all.filter(t => t.status === g.status);
              return (
                <Box key={g.status} flexDirection="column" marginRight={2} width={34}>
                  <Box>
                    <Text bold color={g.color}>{g.label}</Text>
                    <Text dimColor> ({items.length})</Text>
                  </Box>
                  <Text color="gray">{'─'.repeat(32)}</Text>
                  {items.length === 0 && <Text dimColor>  (空)</Text>}
                  {items.map(t => (
                    <Box key={t.id} flexDirection="column" marginBottom={1}>
                      <Text>{t.title}</Text>
                      <Box>
                        {t.priority !== 'medium' && (
                          <Text color={t.priority === 'high' ? 'red' : 'gray'} dimColor>
                            {t.priority === 'high' ? '🔴' : '⚪'} {t.priority}
                          </Text>
                        )}
                        {t.time_spent > 0 && <Text dimColor> ⏱ {t.time_spent}h</Text>}
                        {t.due_date && <Text dimColor> 📅 {t.due_date}</Text>}
                      </Box>
                    </Box>
                  ))}
                  {/* Spacer to align columns */}
                  {items.length < maxItems && (
                    <Box flexDirection="column">
                      {Array.from({ length: maxItems - items.length }, (_, i) => (
                        <Text key={i}> </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    });

  cmd.command('add <title>')
    .description('添加任务')
    .option('-d, --description <desc>', '描述')
    .option('-p, --priority <priority>', '优先级 (high/medium/low)', 'medium')
    .option('-P, --project-id <projectId>', '关联项目ID')
    .option('--due <date>', '截止日期')
    .action((title, opts) => {
      const task = createTask({ title, ...opts });
      console.log(`\n✅ 任务已添加: ${task.title} (${task.id.slice(0, 6)})`);
    });

  cmd.command('edit <id>')
    .description('编辑任务')
    .option('-t, --title <title>', '标题')
    .option('-d, --description <desc>', '描述')
    .option('-p, --priority <priority>', '优先级')
    .option('--due <date>', '截止日期')
    .action((id, opts) => {
      const data: Record<string, any> = {};
      if (opts.title !== undefined) data.title = opts.title;
      if (opts.description !== undefined) data.description = opts.description;
      if (opts.priority !== undefined) data.priority = opts.priority;
      if (opts.due !== undefined) data.due_date = opts.due;
      if (Object.keys(data).length === 0) { console.log('❌ 请至少指定一个要修改的字段'); return; }
      updateTask(id, data);
      console.log('✅ 任务已更新');
    });

  cmd.command('status <id> <status>')
    .description('更新任务状态')
    .action((id, status) => {
      if (!STATUS_OPTIONS.includes(status)) {
        console.log(`❌ 无效状态，可选: ${STATUS_OPTIONS.join(', ')}`);
        return;
      }
      updateTaskStatus(id, status);
      console.log(`✅ 任务状态已更新为: ${status}`);
    });

  cmd.command('time <id> <hours>')
    .description('记录工时（小时）')
    .action((id, hours) => {
      updateTaskTime(id, Number(hours));
      console.log(`\n⏱️ 已记录 ${hours} 小时`);
    });

  cmd.command('show <id>')
    .description('查看任务详情')
    .action((id) => {
      const t = getTask(id);
      if (!t) { console.log('❌ 未找到'); return; }
      console.log(`\n📋 ${t.title}`);
      console.log(`   状态: ${t.status} | 优先级: ${t.priority}`);
      if (t.description) console.log(`   描述: ${t.description}`);
      if (t.due_date) console.log(`   截止: ${t.due_date}`);
      if (t.time_spent > 0) console.log(`   工时: ${t.time_spent}h`);
      console.log(`   创建: ${t.created_at}\n`);
    });

  cmd.command('rm <id>').description('删除任务').action((id) => {
    deleteTask(id);
    console.log('🗑️ 任务已删除');
  });

  cmd.command('stats').description('任务统计').action(() => {
    const stats = getTaskStats() as any[];
    const total = stats.reduce((s, r: any) => s + r.count, 0);
    console.log('\n📊 任务统计');
    console.log('─────────────────────────');
    const labels: Record<string, string> = { todo: '待办', doing: '进行中', done: '已完成' };
    stats.forEach((s: any) => {
      const label = labels[s.status] || s.status;
      const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
      const filled = total > 0 ? Math.round((s.count / total) * 20) : 0;
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
      console.log(`  ${label.padEnd(6)} ${bar} ${s.count} (${pct}%)`);
    });
    console.log(`  ${'总计'.padEnd(6)} ${'█'.repeat(20)} ${total}`);
    console.log('');
  });
}
