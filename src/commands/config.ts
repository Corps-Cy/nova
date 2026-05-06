import { Command } from 'commander';
import { ensureDb, getConfigDir } from '../store/db.js';
import { resolveEmbeddingConfig } from '../services/embedding.js';

export function registerConfigCommand(program: Command) {
  const cmd = program.command('config').description('⚙️  配置管理');

  cmd.command('set <key> <value>')
    .description('设置配置项')
    .action((key, value) => {
      const db = ensureDb();
      db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(key, value);
      console.log(`✅ ${key} = ${value}`);
    });

  cmd.command('get <key>')
    .description('查看配置项')
    .action((key) => {
      const db = ensureDb();
      const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as any;
      if (row) console.log(`${key} = ${row.value}`);
      else console.log(`❌ 未找到: ${key}`);
    });

  cmd.command('ls')
    .description('列出所有配置')
    .action(() => {
      const db = ensureDb();
      try {
        const rows = db.prepare('SELECT * FROM config').all() as any[];
        if (rows.length === 0) {
          console.log('\n  💤 暂无配置\n');
          return;
        }
        console.log('\n⚙️  配置\n');
        rows.forEach(r => {
          const val = r.key.includes('key') || r.key.includes('secret') ? r.value.slice(0, 10) + '...' : r.value;
          console.log(`  ${r.key} = ${val}`);
        });
        console.log('');
      } catch {
        console.log('\n  💤 暂无配置\n');
      }
    });

  cmd.command('path')
    .description('查看数据目录')
    .action(() => {
      console.log(`\n📂 数据目录: ${getConfigDir()}\n`);
    });
}
