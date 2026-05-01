import { Command } from 'commander';
import { listPrompts, createPrompt, getPrompt, deletePrompt } from '../store/prompt.js';
import { getConfig } from '../store/db.js';
import { render } from 'ink';
import React from 'react';
import { Box, Text } from 'ink';
import { Header } from '../ui/index.js';
import { randomUUID } from 'crypto';
import { getDb } from '../store/db.js';

export function registerAICommand(program: Command) {
  const cmd = program.command('ai').description('🤖 AI 工具链');

  cmd.command('prompt')
    .alias('pt')
    .description('Prompt 模板管理')
    .addCommand(
      new Command('list').alias('ls')
        .description('列出模板')
        .option('-c, --category <cat>', '按分类筛选')
        .action((opts) => {
          const prompts = listPrompts(opts.category) as any[];
          render(
            <Box flexDirection="column">
              <Header title="Prompt 模板" />
              {prompts.length === 0 ? (
                <Text dimColor>  暂无模板</Text>
              ) : prompts.map(p => (
                <Box key={p.id} flexDirection="column" marginBottom={1}>
                  <Box>
                    <Text bold>{p.name}</Text>
                    <Text dimColor> [{p.category}]</Text>
                    <Text dimColor> {p.id.slice(0, 6)}</Text>
                  </Box>
                  <Text dimColor>  {p.content.slice(0, 80)}{p.content.length > 80 ? '…' : ''}</Text>
                </Box>
              ))}
            </Box>
          );
        })
    )
    .addCommand(
      new Command('add <name>')
        .description('添加模板')
        .option('-c, --category <cat>', '分类', 'general')
        .option('-f, --file <path>', '从文件读取内容')
        .option('--content <text>', '直接指定内容')
        .action((name, opts) => {
          if (opts.content) {
            const p = createPrompt({ name, category: opts.category, content: opts.content });
            console.log(`✅ Prompt 已保存: ${p.name} (${p.id.slice(0, 6)})`);
            return;
          }
          if (opts.file) {
            const fs = require('fs');
            const content = fs.readFileSync(opts.file, 'utf8');
            const p = createPrompt({ name, category: opts.category, content: content.trim() });
            console.log(`✅ Prompt 已保存: ${p.name} (${p.id.slice(0, 6)})`);
            return;
          }
          // Read from stdin
          console.log('请输入 prompt 内容（输入 END 结束）:');
          process.stdin.setEncoding('utf8');
          let content = '';
          process.stdin.on('data', (chunk) => {
            if (chunk.trim() === 'END') {
              const p = createPrompt({ name, category: opts.category, content: content.trim() });
              console.log(`\n✅ Prompt 已保存: ${p.name} (${p.id.slice(0, 6)})`);
              process.exit(0);
            }
            content += chunk;
          });
        })
    )
    .addCommand(
      new Command('show <id>')
        .description('查看模板详情')
        .action((id) => {
          const p = getPrompt(id);
          if (!p) { console.log('❌ 未找到'); return; }
          console.log(`\n📌 ${p.name} [${p.category}]\n${p.content}\n`);
        })
    )
    .addCommand(
      new Command('rm <id>')
        .description('删除模板')
        .action((id) => {
          deletePrompt(id);
          console.log('🗑️ 已删除');
        })
    );

  // LLM chat with history persistence
  cmd.command('chat')
    .description('💬 与 LLM 对话')
    .option('-m, --model <model>', '模型', '')
    .option('-s, --system <prompt>', '系统提示词')
    .option('-p, --prompt-id <id>', '使用已保存的 prompt 模板作为系统提示')
    .option('-r, --resume <sessionId>', '恢复历史对话')
    .action(async (opts) => {
      const config = getConfig();
      const model = opts.model || config.default_model || 'gpt-4o-mini';

      let systemPrompt = opts.system || '';
      if (opts.promptId) {
        const template = getPrompt(opts.promptId);
        if (template) systemPrompt = template.content;
        else console.log(`⚠️ 未找到 prompt ${opts.promptId}`);
      }

      const db = getDb();
      const sessionId = opts.resume || randomUUID();

      const messages: any[] = [];

      if (opts.resume) {
        // Load history
        const history = db.prepare('SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY id ASC').all(sessionId) as any[];
        if (history.length > 0) {
          console.log(`📂 已加载 ${history.length} 条历史消息`);
          history.forEach(h => messages.push({ role: h.role, content: h.content }));
        }
      }

      if (systemPrompt && messages.length === 0) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      if (opts.resume) {
        console.log(`\n💬 继续对话 (session: ${sessionId.slice(0, 8)})`);
      } else {
        console.log(`\n💬 新对话 (session: ${sessionId.slice(0, 8)})`);
      }

      console.log('  /exit 退出 | /system <text> 设置系统提示 | /clear 清空\n');

      const saveMsg = (role: string, content: string) => {
        db.prepare('INSERT INTO chat_history (session_id, role, content, model) VALUES (?, ?, ?, ?)').run(sessionId, role, content, model);
      };

      process.stdin.setEncoding('utf8');
      process.stdout.write('▸ ');
      let buffer = '';
      process.stdin.on('data', async (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const input = line.trim();
          if (!input) continue;

          if (input === '/exit') {
            console.log(`\n👋 再见！session: ${sessionId.slice(0, 8)}`);
            console.log(`   恢复: nova ai chat -r ${sessionId}\n`);
            process.exit(0);
          }
          if (input.startsWith('/system ')) {
            messages.length = 0;
            messages.push({ role: 'system', content: input.slice(8) });
            saveMsg('system', input.slice(8));
            console.log('✅ 系统提示已更新');
            process.stdout.write('▸ ');
            continue;
          }
          if (input === '/clear') {
            messages.length = 0;
            console.log('✅ 已清空对话');
            process.stdout.write('▸ ');
            continue;
          }

          messages.push({ role: 'user', content: input });
          saveMsg('user', input);

          try {
            const response = await callLLM(model, messages);
            messages.push({ role: 'assistant', content: response });
            saveMsg('assistant', response);
            console.log(response);
          } catch (err: any) {
            console.log(`❌ ${err.message}`);
          }
          process.stdout.write('▸ ');
        }
      });
    });

  // Single ask
  cmd.command('ask <message>')
    .description('快速提问')
    .option('-m, --model <model>', '模型', '')
    .option('-s, --system <prompt>', '系统提示')
    .action(async (message, opts) => {
      const config = getConfig();
      const model = opts.model || config.default_model || 'gpt-4o-mini';

      const messages: any[] = [];
      if (opts.system) messages.push({ role: 'system', content: opts.system });
      messages.push({ role: 'user', content: message });

      try {
        process.stdout.write('思考中');
        const response = await callLLM(model, messages);
        console.log(`\r${response}`);
      } catch (err: any) {
        console.log(`❌ ${err.message}`);
      }
    });

  // Chat history
  cmd.command('history')
    .alias('hs')
    .description('查看对话历史')
    .option('-l, --limit <n>', '显示条数', '5')
    .action((opts) => {
      const db = getDb();
      const sessions = db.prepare(`
        SELECT session_id, model, COUNT(*) as count,
               MIN(created_at) as started_at,
               MAX(created_at) as last_at
        FROM chat_history GROUP BY session_id ORDER BY last_at DESC LIMIT ?
      `).all(Number(opts.limit)) as any[];

      if (sessions.length === 0) {
        console.log('  暂无对话记录');
        return;
      }

      console.log('\n💬 对话历史\n');
      sessions.forEach(s => {
        console.log(`  ${s.session_id.slice(0, 8)}  ${s.model.padEnd(20)} ${String(s.count).padStart(3)}条  ${s.last_at}`);
      });
      console.log(`\n  恢复: nova ai chat -r <sessionId>\n`);
    });
}

async function callLLM(model: string, messages: any[]): Promise<string> {
  const config = getConfig();

  if (model.includes('claude')) {
    const apiKey = config.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('请设置 API key: nova config set anthropic_api_key sk-ant-...');
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 4096, messages }),
    });
    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  }

  // OpenAI compatible
  const apiKey = config.openai_api_key || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('请设置 API key: nova config set openai_api_key sk-...');
  const baseURL = config.openai_base_url || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  const data = await resp.json() as any;
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}
