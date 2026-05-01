import { Command } from 'commander';
import { registerClientCommand } from './client.js';
import { registerProjectCommand } from './project.js';
import { registerTaskCommand } from './task.js';
import { registerAICommand } from './ai.js';
import { registerDevCommand } from './dev.js';
import { registerConfigCommand } from './config.js';
import { registerExportCommand } from './export.js';
import { registerWeekCommand } from './week.js';

export function registerAllCommands(program: Command) {
  registerClientCommand(program);
  registerProjectCommand(program);
  registerTaskCommand(program);
  registerAICommand(program);
  registerDevCommand(program);
  registerConfigCommand(program);
  registerExportCommand(program);
  registerWeekCommand(program);
}
