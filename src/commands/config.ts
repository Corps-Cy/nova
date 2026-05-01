import { Command } from 'commander';
import { getConfig, setConfig, getConfigDir, PROVIDER_PRESETS } from '../store/db.js';

export function registerConfigCommand(program: Command) {
  const cmd = program.command('config').alias('cfg').description('⚙️ 配置管理');

  cmd.command('set <key> [value]')
    .description('设置配置项')
    .action((key, value) => {
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
        // Provider shortcut: "provider.openai.api_key"
        if (key.startsWith('provider.')) {
          const parts = key.split('.');
          const prov = config.providers?.[parts[1]];
          if (!prov) { console.log(`  未配置供应商: ${parts[1]}`); return; }
          const field = parts.slice(2).join('.');
          const val = (prov as any)[field];
          if (val === undefined) { console.log(`  未设置`); return; }
          if (field.includes('key')) console.log(`${key} = ${String(val).slice(0, 8)}...${String(val).slice(-4)}`);
          else console.log(`${key} = ${val}`);
          return;
        }
        const val = (config as any)[key];
        if (val) {
          if (key.includes('key')) console.log(`${key} = ${String(val).slice(0, 6)}...${String(val).slice(-4)}`);
          else console.log(`${key} = ${val}`);
        } else {
          console.log(`  ${key} = (未设置)`);
        }
      } else {
        console.log(`\n⚙️ Nova 配置 (${getConfigDir()})\n`);
        if (config.default_provider) console.log(`  默认供应商: ${config.default_provider}`);
        if (config.default_model) console.log(`  默认模型:   ${config.default_model}`);

        const providers = config.providers || {};
        const providerNames = Object.keys(providers);
        if (providerNames.length > 0) {
          console.log(`\n  已配置供应商:`);
          for (const name of providerNames) {
            const p = providers[name];
            const preset = PROVIDER_PRESETS.find(pr => pr.name === name);
            const label = preset?.label || name;
            const keyDisplay = p.api_key.slice(0, 8) + '...' + p.api_key.slice(-4);
            const isDefault = config.default_provider === name ? ' 🟢' : '';
            console.log(`    ${label}${isDefault}`);
            console.log(`      key:  ${keyDisplay}`);
            console.log(`      url:  ${p.base_url}`);
            console.log(`      model: ${p.default_model}`);
          }
        } else {
          console.log('\n  (未配置供应商)');
          console.log('  快速开始: nova ai provider set openai sk-...');
        }
        console.log('');
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
