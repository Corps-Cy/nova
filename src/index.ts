#!/usr/bin/env node
import { Command } from 'commander';
import { registerClientCommand, registerProjectCommand } from './commands/client/index.js';
import { registerTaskCommand } from './commands/task/index.js';
import { registerAICommand } from './commands/ai/index.js';

const program = new Command();

program
  .name('mycli')
  .description('🚀 个人 CLI 工具箱 - 接单/任务/AI 一站式管理')
  .version('0.1.0');

registerClientCommand(program);
registerProjectCommand(program);
registerTaskCommand(program);
registerAICommand(program);

program.parse();
