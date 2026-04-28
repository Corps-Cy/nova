#!/usr/bin/env node
import { Command } from 'commander';
import { registerClientCommand, registerProjectCommand } from './commands/client/index.js';
import { registerTaskCommand } from './commands/task/index.js';
import { registerAICommand } from './commands/ai/index.js';

const program = new Command();

program
  .name('fx')
  .description('🦊 fx - Freelancer toolkit')
  .version('0.1.0');

registerClientCommand(program);
registerProjectCommand(program);
registerTaskCommand(program);
registerAICommand(program);

program.parse();
