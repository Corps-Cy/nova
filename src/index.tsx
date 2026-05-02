#!/usr/bin/env node
import { Command } from 'commander';
import { VERSION } from './ui/theme.js';
import { Logo } from './ui/components/Logo.js';
import { render } from 'ink';
import React from 'react';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('nova')
  .description('◆ nova — freelancer toolkit')
  .version(VERSION);

// Default: show logo
program.action(() => {
  render(<Logo />);
});

registerAllCommands(program);

// TUI command — interactive dashboard
program.command('tui')
  .description('🖥️  交互式 TUI 面板')
  .action(async () => {
    const { default: Dashboard } = await import('./ui/components/Dashboard.js');
    render(<Dashboard />);
  });

program.parse();
