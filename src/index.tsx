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

// No subcommand → launch interactive TUI
program.action(async () => {
  // Lazy import to avoid loading TUI for CLI commands
  const { default: Dashboard } = await import('./ui/components/Dashboard.js');
  render(<Dashboard />);
});

registerAllCommands(program);
program.parse();
