import { Command } from 'commander';
import { getConfig, setConfig, getConfigDir } from '../store/db.js';

export function registerConfigCommand(program: Command) {
  const cmd = program.command('config').alias('cfg').description('⚙️ 配置管理');

  cmd.command('set <key> [value]')
    .description('设置配置项 (set openai_api_key sk-... 或 set default_model gpt-4o)')
    .action((key, value) => {
      const validKeys = ['openai_api_key', 'openai_base_url', 'anthropic_api_key', 'default_model'];
      if (!validKeys.includes(key)) {
        console.log(`❌ 无效配置项，可选: ${validKeys.join(', ')}`);
        return;
      }
      if (!value) {
        console.log('❌ 请提供值');
        return;
      }
      setConfig({ [key]: value });
      console.log(`✅ 已设置 ${key}`);
    });

  cmd.command('get [key]')
    .description('查看配置（不传 key 查看全部）')
    .action((key) => {
      const config = getConfig();
      if (key) {
        const val = (config as any)[key];
        if (val) {
          // Mask API keys
          if (key.includes('key')) {
            console.log(`${key} = ${val.slice(0, 6)}...${val.slice(-4)}`);
          } else {
            console.log(`${key} = ${val}`);
          }
        } else {
          console.log(`  ${key} = (未设置)`);
        }
      } else {
        console.log(`\n⚙️ Nova 配置 (${getConfigDir()})\n`);
        const entries = Object.entries(config);
        if (entries.length === 0) {
          console.log('  (空)\n');
          console.log('  设置示例:');
          console.log('  nova config set openai_api_key sk-...');
          console.log('  nova config set default_model gpt-4o\n');
        } else {
          entries.forEach(([k, v]) => {
            const display = k.includes('key') ? `${String(v).slice(0, 6)}...${String(v).slice(-4)}` : String(v);
            console.log(`  ${k.padEnd(20)} ${display}`);
          });
          console.log('');
        }
      }
    });

  cmd.command('rm <key>')
    .description('删除配置项')
    .action((key) => {
      const config = getConfig();
      if (!(key in config)) { console.log(`❌ ${key} 不存在`); return; }
      delete (config as any)[key];
      require('fs').writeFileSync(require('path').join(getConfigDir(), 'config.json'), JSON.stringify(config, null, 2));
      console.log(`✅ 已删除 ${key}`);
    });
}
