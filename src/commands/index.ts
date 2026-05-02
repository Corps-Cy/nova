import { Command } from 'commander';
import { registerClientCommand } from './client.js';
import { registerProjectCommand } from './project.js';
import { registerTaskCommand } from './task.js';
import { registerAICommand } from './ai.js';
import { registerDevCommand } from './dev.js';
import { registerConfigCommand } from './config.js';
import { registerExportCommand } from './export.js';
import { registerWeekCommand } from './week.js';
import { registerTagCommand } from './tag.js';
import { registerReportCommand } from './report.js';
import { registerNoteCommand } from './note.js';
import { registerCalendarCommand } from './calendar.js';
import { registerReminderCommand } from './reminder.js';
import { registerSyncCommand } from './sync.js';

export function registerAllCommands(program: Command) {
  registerClientCommand(program);
  registerProjectCommand(program);
  registerTaskCommand(program);
  registerAICommand(program);
  registerDevCommand(program);
  registerConfigCommand(program);
  registerExportCommand(program);
  registerWeekCommand(program);
  registerTagCommand(program);
  registerReportCommand(program);
  registerNoteCommand(program);
  registerCalendarCommand(program);
  registerReminderCommand(program);
  registerSyncCommand(program);
}
