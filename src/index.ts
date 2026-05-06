#!/usr/bin/env node
import { Command } from 'commander';
import { fileURLToPath } from 'url';
import path from 'path';
import { registerKbCommand } from './commands/kb.js';
import { registerApiCommand } from './commands/api.js';
import { registerConfigCommand } from './commands/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSION = '2.1.0';

const program = new Command();

program
  .name('nova')
  .description('◆ nova — AI RAG Knowledge Base API Service')
  .version(VERSION);

program.action(() => {
  console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║  ███  ████  ██  █                        ║
║      N   O   V   A                      ║
║  ━━━━━━━━━━ ◆ ━━━━━━━━━━                  ║
║    knowledge base api v2.1                ║
║                                          ║
╚══════════════════════════════════════════╝

  AI RAG 知识库 API 服务

  快速开始:
    nova config set embedding_api_key <your-key>
    nova kb create "我的知识库"
    nova kb upload README.md <kb_id>
    nova kb query <kb_id> "这个问题是什么意思？"
    nova serve
`);
});

registerKbCommand(program);
registerApiCommand(program);
registerConfigCommand(program);

// Serve command - uses the new server.js
program.command('serve')
  .description('启动 API 服务')
  .option('-p, --port <port>', '端口', '3000')
  .option('-h, --host <host>', '主机', '0.0.0.0')
  .action(async (opts) => {
    // Dynamic import uses .js extension which resolves server.js first
    const { createApiServer } = await import('./api/server.js');
    const app = createApiServer();
    
    app.listen(parseInt(opts.port), opts.host, () => {
      console.log(`\n🚀 Nova API 服务已启动`);
      console.log(`   Web 管理台: http://localhost:${opts.port}`);
      console.log(`   API 接口:    http://localhost:${opts.port}/api/v1/`);
      console.log(`   健康检查:    http://localhost:${opts.port}/health\n`);
    });
  });

program.parse();
