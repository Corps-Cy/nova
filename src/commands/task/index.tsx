import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { listTasks, createTask, updateTaskStatus, updateTaskTime, deleteTask, getTaskStats } from '../../store/task.js';
import { Box, Text } from 'ink';
import { Header } from '../../ui/index.js';
import { colorizeStatus } from '../../ui/utils.js';

const STATUS_OPTIONS = ['todo', 'doing', 'done'];

export function registerTaskCommand(program: Command) {
  const cmd = program.command('task').description('📋 任务管理');

  cmd.command('list')
    .description('列出任务')
    .option('-s, --status <status>', '按状态筛选')
    .action((opts) => {
      const tasks = listTasks(opts.status ? { status: opts.status } : undefined) as any[];
      render(
        <Box flexDirection="column">
          <Header title="任务看板" />
          <TaskBoard tasks={tasks} />
        </Box>
      );
    });

  cmd.command('board').description('看板视图').action(() => {
    const all = listTasks() as any[];
    const todo = all.filter(t => t.status === 'todo');
    const doing = all.filter(t => t.status === 'doing');
    const done = all.filter(t => t.status === 'done');

    render(
      <Box flexDirection="column">
        <Header title="📋 任务看板" />
        <Box>
          <Box flexDirection="column" marginRight={2}>
            <Text bold color="gray">📋 待办 ({todo.length})</Text>
            {todo.map(t => <TaskItem key={t.id} task={t} />)}
          </Box>
          <Box flexDirection="column" marginRight={2}>
            <Text bold color="yellow">🔄 进行中 ({doing.length})</Text>
            {doing.map(t => <TaskItem key={t.id} task={t} />)}
          </Box>
          <Box flexDirection="column">
            <Text bold color="green">✅ 已完成 ({done.length})</Text>
            {done.map(t => <TaskItem key={t.id} task={t} />)}
          </Box>
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

  cmd.command('rm <id>')
    .description('删除任务')
    .action((id) => {
      deleteTask(id);
      console.log(`🗑️ 任务已删除`);
    });

  cmd.command('stats').description('任务统计').action(() => {
    const stats = getTaskStats() as any[];
    console.log('\n📊 任务统计:');
    stats.forEach(s => {
      console.log(`  ${colorizeStatus(s.status).props.children}: ${s.count} 个`);
    });
    console.log('');
  });
}

function TaskBoard({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) return <Text dimColor>  暂无任务</Text>;
  return (
    <Box flexDirection="column">
      {tasks.map(t => <TaskItem key={t.id} task={t} />)}
    </Box>
  );
}

function TaskItem({ task }: { task: any }) {
  return (
    <Box>
      <Text>{task.title}</Text>
      <Text> </Text>
      {colorizeStatus(task.status)}
      {task.time_spent > 0 && <Text dimColor> [{task.time_spent}h]</Text>}
    </Box>
  );
}
