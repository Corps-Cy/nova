import { Command } from 'commander';
import { registerClientCommand } from './client.js';
import { registerProjectCommand } from './project.js';
import { registerTaskCommand } from './task.js';
import { registerAICommand } from './ai.js';
import { registerDevCommand } from './dev.js';

export function registerAllCommands(program: Command) {
  registerClientCommand(program);
  registerProjectCommand(program);
  registerTaskCommand(program);
  registerAICommand(program);
  registerDevCommand(program);
}
