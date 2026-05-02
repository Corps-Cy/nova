#!/usr/bin/env node
import { Command } from 'commander';
import { VERSION } from './ui/theme.js';
import { Logo } from './ui/components/Logo.js';
import { render } from 'ink';
import React from 'react';
import { registerAllCommands } from './commands/index.js';
import { ensureDb } from './store/db.js';

const program = new Command();

program
  .name('nova')
  .description('◆ nova — freelancer toolkit')
  .version(VERSION);

// Default: show logo + reminders
program.action(async () => {
  render(<Logo />);
  const db = await ensureDb();
  const overdue = db.prepare(`
    SELECT t.*, p.name as project_name FROM task t
    LEFT JOIN project p ON t.project_id = p.id
    WHERE t.status != 'done' AND t.due_date != '' AND t.due_date < date('now')
  `).all() as any[];
  const upcoming = db.prepare(`
    SELECT t.*, p.name as project_name FROM task t
    LEFT JOIN project p ON t.project_id = p.id
    WHERE t.status != 'done' AND t.due_date != '' AND t.due_date >= date('now') AND t.due_date <= date('now', '+3 days')
  `).all() as any[];

  if (overdue.length > 0) {
    console.log(`\n⚠️  逾期任务 (${overdue.length}):`);
    overdue.forEach(t => {
      const proj = t.project_name ? ` [${t.project_name}]` : '';
      console.log(`  🔴 ${t.title}${proj} (截止: ${t.due_date})`);
    });
  }
  if (upcoming.length > 0) {
    console.log(`\n⏰ 近期截止 (${upcoming.length}):`);
    upcoming.forEach(t => {
      const proj = t.project_name ? ` [${t.project_name}]` : '';
      console.log(`  🟡 ${t.title}${proj} (截止: ${t.due_date})`);
    });
  }
  if (overdue.length === 0 && upcoming.length === 0) {
    console.log('\n✅ 没有需要关注的任务');
  }
  console.log('');
});

registerAllCommands(program);

// TUI command
program.command('tui')
  .description('交互式 TUI 面板')
  .action(async () => {
    const { default: Dashboard } = await import('./ui/components/Dashboard.js');
    render(<Dashboard />);
  });

program.parse();
