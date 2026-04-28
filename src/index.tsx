#!/usr/bin/env node
import { Command } from 'commander';
import { VERSION } from './ui/theme.js';
import { Logo } from './ui/Logo.js';
import { render } from 'ink';
import { registerClientCommand, registerProjectCommand } from './commands/client/index.js';
import { registerTaskCommand } from './commands/task/index.js';
import { registerAICommand } from './commands/ai/index.js';

const program = new Command();

program
  .name('cy')
  .description('◆ cy — freelancer toolkit')
  .version(VERSION)
  .action(() => {
    // 无子命令时显示 logo + help
    render(<Logo />);
  });

registerClientCommand(program);
registerProjectCommand(program);
registerTaskCommand(program);
registerAICommand(program);

program.parse();
