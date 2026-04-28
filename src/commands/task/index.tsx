import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { listTasks, createTask, updateTaskStatus, updateTaskTime, deleteTask, getTaskStats } from '../../store/task.js';
import { Box, Text } from 'ink';
import { Header, Select } from '../../ui/index.js';
import { colorizeStatus } from '../../ui/utils.js';

const STATUS_OPTIONS = ['todo', 'doing', 'done'];

export function registerTaskCommand(program: Command) {
  const cmd = program.command('task').alias('t').description('📋 任务管理');

  cmd.command('list').alias('ls')
    .description('列出任务')
    .option('-s, --status <status>', '按状态筛选')
    .action((opts) => {
      const tasks = listTasks(opts.status ? { status: opts.status } : undefined) as any[];
      render(
        <Box flexDirection="column">
          <Header title="任务列表" />
          {tasks.length === 0 ? (
            <Text dimColor>  暂无任务</Text>
          ) : tasks.map(t => (
            <Box key={t.id} marginBottom={0}>
              <Text width={2}>{'  '}</Text>
              <Text width={30} wrap="truncate-end">{t.title}</Text>
              <Text width={8}> </Text>
              {colorizeStatus(t.status)}
              {t.priority !== 'medium' && (
                <Text> <Text color={t.priority === 'high' ? 'red' : 'gray'}>[{t.priority}]</Text></Text>
              )}
              {t.time_spent > 0 && <Text dimColor> {t.time_spent}h</Text>}
            </Box>
          ))}
        </Box>
      );
    });

  cmd.command('board').alias('b').description('看板视图').action(() => {
    const all = listTasks() as any[];
    const groups = [
      { label: '📋 待办', items: all.filter(t => t.status === 'todo'), color: 'gray' },
      { label: '🔄 进行中', items: all.filter(t => t.status === 'doing'), color: 'yellow' },
      { label: '✅ 已完成', items: all.filter(t => t.status === 'done'), color: 'green' },
    ];

    render(
      <Box flexDirection="column">
        <Header title="任务看板" />
        <Box>
          {groups.map(g => (
            <Box key={g.label} flexDirection="column" marginRight={2} width={32}>
              <Text bold color={g.color}>{g.label} ({g.items.length})</Text>
              <Text>──────────────────────────</Text>
              {g.items.length === 0 && <Text dimColor>  (空)</Text>}
              {g.items.map(t => (
                <Box key={t.id} flexDirection="column" marginBottom={1}>
                  <Text>{t.title}</Text>
                  {t.time_spent > 0 && <Text dimColor>  ⏱ {t.time_spent}h</Text>}
                </Box>
              ))}
            </Box>
          ))}
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
      console.log(`✅ 任务已添加: ${task.title} (${task.id.slice(0, 6)})`);
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
      console.log(`⏱️ 已记录 ${hours} 小时`);
    });

  cmd.command('rm <id>').description('删除任务').action((id) => {
    deleteTask(id);
    console.log(`🗑️ 任务已删除`);
  });

  cmd.command('stats').description('任务统计').action(() => {
    const stats = getTaskStats() as any[];
    const total = stats.reduce((s, r) => s + r.count, 0);
    console.log('\n📊 任务统计:');
    stats.forEach(s => {
      const bar = '█'.repeat(s.count) + '░'.repeat(Math.max(0, (total || 1) - s.count));
      console.log(`  ${s.status.padEnd(10)} ${bar} ${s.count}`);
    });
    console.log(`  ${'总计'.padEnd(10)} ${'█'.repeat(total)} ${total}\n`);
  });
}
