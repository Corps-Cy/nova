import { Command } from 'commander';
import { listPrompts, createPrompt, getPrompt, deletePrompt } from '../store/prompt.js';
import { getConfig, setConfig, resolveProvider, PROVIDER_PRESETS } from '../store/db.js';
import { render } from 'ink';
import React from 'react';
import { Box, Text } from 'ink';
import { Header } from '../ui/index.js';
import { randomUUID } from 'crypto';
import { getDb } from '../store/db.js';

export function registerAICommand(program: Command) {
  const cmd = program.command('ai').description('🤖 AI 工具链');

  // === Provider Management ===
  const provCmd = cmd.command('provider').alias('prov').description('AI 供应商管理');

  provCmd.command('list').alias('ls').description('列出支持的供应商').action(() => {
    const config = getConfig();
    console.log('\n🤖 支持的 AI 供应商\n');
    console.log('  供应商'.padEnd(24) + '状态'.padEnd(8) + '默认模型');
    console.log('  ' + '─'.repeat(60));
    for (const p of PROVIDER_PRESETS) {
      const hasKey = !!config.providers?.[p.name]?.api_key;
      const isActive = config.default_provider === p.name;
      const status = hasKey ? (isActive ? '🟢 活跃' : '✅') : '⚪';
      const defaultModel = config.providers?.[p.name]?.default_model || p.models[0];
      console.log(`  ${p.label.padEnd(22)} ${status.padEnd(8)} ${defaultModel}`);
    }
    console.log('\n  配置: nova ai provider set <name> <api_key>');
    console.log('  详情: nova ai provider show <name>\n');
  });

  provCmd.command('set <name> <apiKey>')
    .description('配置供应商 API Key')
    .option('-m, --model <model>', '设置该供应商默认模型')
    .option('-u, --url <url>', '自定义 Base URL')
    .option('--default', '设为默认供应商')
    .action((name, apiKey, opts) => {
      const preset = PROVIDER_PRESETS.find(p => p.name === name);
      if (!preset) {
        console.log(`❌ 未知供应商: ${name}`);
        console.log(`   可用: ${PROVIDER_PRESETS.map(p => p.name).join(', ')}`);
        return;
      }
      const providerConfig = {
        api_key: apiKey,
        base_url: opts.url || preset.base_url,
        default_model: opts.model || preset.models[0],
      };
      setConfig({
        providers: { [name]: providerConfig },
        ...(opts.default ? { default_provider: name } : {}),
      });
      console.log(`✅ ${preset.label} 已配置`);
      if (opts.model) console.log(`   默认模型: ${opts.model}`);
      if (opts.default) console.log(`   🟢 已设为默认供应商`);
    });

  provCmd.command('default <name>').description('设置默认供应商').action((name) => {
    const preset = PROVIDER_PRESETS.find(p => p.name === name);
    if (!preset) { console.log('❌ 未知供应商'); return; }
    setConfig({ default_provider: name });
    console.log(`✅ 默认供应商已设为: ${preset.label}`);
  });

  provCmd.command('show <name>').description('查看供应商详情').action((name) => {
    const preset = PROVIDER_PRESETS.find(p => p.name === name);
    if (!preset) { console.log('❌ 未知供应商'); return; }
    const config = getConfig();
    const prov = config.providers?.[name];
    console.log(`\n  ${preset.label}`);
    console.log('  ' + '─'.repeat(40));
    console.log(`  Base URL: ${preset.base_url}`);
    console.log(`  可用模型: ${preset.models.join(', ')}`);
    if (prov) {
      console.log(`  API Key:  ${prov.api_key.slice(0, 8)}...${prov.api_key.slice(-4)}`);
      console.log(`  当前URL: ${prov.base_url}`);
      console.log(`  默认模型: ${prov.default_model}`);
      console.log(`  状态: ✅ 已配置`);
    } else {
      console.log(`  状态: ⚪ 未配置`);
      console.log(`  配置: nova ai provider set ${name} <api_key>`);
    }
    console.log('');
  });

  // === Prompt Management ===
  const ptCmd = cmd.command('prompt').alias('pt').description('Prompt 模板管理');

  ptCmd.command('list').alias('ls').description('列出模板').option('-c, --category <cat>', '按分类筛选').action((opts) => {
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
  });

  ptCmd.command('add <name>').description('添加模板')
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
    });

  ptCmd.command('show <id>').description('查看模板详情').action((id) => {
    const p = getPrompt(id);
    if (!p) { console.log('❌ 未找到'); return; }
    console.log(`\n📌 ${p.name} [${p.category}]\n${p.content}\n`);
  });

  ptCmd.command('rm <id>').description('删除模板').action((id) => {
    deletePrompt(id);
    console.log('🗑️ 已删除');
  });

  // === LLM Chat ===
  cmd.command('chat')
    .description('💬 与 LLM 对话')
    .option('-m, --model <model>', '指定模型')
    .option('-P, --provider <provider>', '指定供应商')
    .option('-s, --system <prompt>', '系统提示词')
    .option('-p, --prompt-id <id>', '使用已保存的 prompt 模板')
    .option('-r, --resume <sessionId>', '恢复历史对话')
    .action(async (opts) => {
      const config = getConfig();
      let model = opts.model;
      if (!model && opts.provider && config.providers?.[opts.provider]) {
        model = config.providers[opts.provider].default_model;
      }
      if (!model) model = config.default_model || 'gpt-4o-mini';

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
        const history = db.prepare('SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY id ASC').all(sessionId) as any[];
        if (history.length > 0) {
          console.log(`📂 已加载 ${history.length} 条历史消息`);
          history.forEach(h => messages.push({ role: h.role, content: h.content }));
        }
      }
      if (systemPrompt && messages.length === 0) messages.push({ role: 'system', content: systemPrompt });

      console.log(`\n💬 对话 (session: ${sessionId.slice(0, 8)}, model: ${model})`);
      console.log('  /exit 退出 | /system <text> | /clear 清空 | /model <m> 切换\n');

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
          if (input === '/exit') { console.log(`\n👋 恢复: nova ai chat -r ${sessionId}\n`); process.exit(0); }
          if (input.startsWith('/system ')) { messages.length = 0; messages.push({ role: 'system', content: input.slice(8) }); saveMsg('system', input.slice(8)); console.log('✅'); process.stdout.write('▸ '); continue; }
          if (input === '/clear') { messages.length = 0; console.log('✅'); process.stdout.write('▸ '); continue; }
          if (input.startsWith('/model ')) { model = input.slice(7); console.log(`✅ → ${model}`); process.stdout.write('▸ '); continue; }
          messages.push({ role: 'user', content: input });
          saveMsg('user', input);
          try {
            const response = await callLLM(config, model, messages);
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

  // === Single Ask ===
  cmd.command('ask <message>')
    .description('快速提问')
    .option('-m, --model <model>', '指定模型')
    .option('-P, --provider <provider>', '指定供应商')
    .option('-s, --system <prompt>', '系统提示')
    .action(async (message, opts) => {
      const config = getConfig();
      let model = opts.model;
      if (!model && opts.provider && config.providers?.[opts.provider]) model = config.providers[opts.provider].default_model;
      if (!model) model = config.default_model || 'gpt-4o-mini';
      const messages: any[] = [];
      if (opts.system) messages.push({ role: 'system', content: opts.system });
      messages.push({ role: 'user', content: message });
      try {
        process.stdout.write('思考中');
        const response = await callLLM(config, model, messages);
        console.log(`\r${response}`);
      } catch (err: any) {
        console.log(`❌ ${err.message}`);
      }
    });

  // === Chat History ===
  cmd.command('history').alias('hs').description('查看对话历史')
    .option('-l, --limit <n>', '显示条数', '5')
    .action((opts) => {
      const db = getDb();
      const sessions = db.prepare(`SELECT session_id, model, COUNT(*) as count, MAX(created_at) as last_at FROM chat_history GROUP BY session_id ORDER BY last_at DESC LIMIT ?`).all(Number(opts.limit)) as any[];
      if (sessions.length === 0) { console.log('  暂无对话记录'); return; }
      console.log('\n💬 对话历史\n');
      sessions.forEach(s => console.log(`  ${s.session_id.slice(0, 8)}  ${(s.model || '-').padEnd(30)} ${String(s.count).padStart(3)}条  ${s.last_at}`));
      console.log(`\n  恢复: nova ai chat -r <sessionId>\n`);
    });
}

async function callLLM(config: ReturnType<typeof getConfig>, model: string, messages: any[]): Promise<string> {
  const resolved = resolveProvider(config, model);
  if (!resolved.apiKey) {
    throw new Error(`未配置 API Key。运行: nova ai provider set <供应商> <api_key>`);
  }

  if (resolved.isAnthropic) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': resolved.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: resolved.resolvedModel, max_tokens: 4096, messages }),
    });
    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  }

  const resp = await fetch(`${resolved.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resolved.apiKey}` },
    body: JSON.stringify({ model: resolved.resolvedModel, messages, stream: false }),
  });
  const data = await resp.json() as any;
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}
