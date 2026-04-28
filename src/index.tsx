#!/usr/bin/env node
import { Command } from 'commander';
import { VERSION } from './ui/theme.js';
import { Logo } from './ui/components/Logo.js';
import { render } from 'ink';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('nova')
  .description('◆ nova — freelancer toolkit')
  .version(VERSION)
  .action(() => {
    render(<Logo />);
  });

registerAllCommands(program);
program.parse();
