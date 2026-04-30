import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export function registerDevCommand(program: Command) {
  const cmd = program.command('dev').alias('d').description('🔧 开发提效');

  cmd.command('init <name>')
    .description('初始化项目（Node.js）')
    .option('-t, --type <type>', '项目类型 (node/web/api)', 'node')
    .option('-d, --desc <description>', '项目描述')
    .action((name, opts) => {
      const dir = join(process.cwd(), name);
      if (existsSync(dir)) { console.log(`❌ 目录 ${name} 已存在`); return; }

      mkdirSync(dir, { recursive: true });
      mkdirSync(join(dir, 'src'), { recursive: true });

      const pkg = {
        name,
        version: '0.1.0',
        description: opts.desc || '',
        type: 'module',
        scripts: {
          dev: 'tsx src/index.ts',
          build: 'tsup src/index.ts --format esm --dts',
          start: 'node dist/index.js',
        },
        devDependencies: {
          typescript: '^5.5.0',
          tsx: '^4.0.0',
          tsup: '^8.0.0',
        },
      };

      writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
      writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', strict: true, outDir: 'dist', rootDir: 'src', skipLibCheck: true },
        include: ['src'],
      }, null, 2));
      writeFileSync(join(dir, 'src', 'index.ts'), `// ${name}\nconsole.log('Hello from ${name}');\n`);
      writeFileSync(join(dir, '.gitignore'), 'node_modules/\ndist/\n');

      console.log(`✅ 项目 ${name} 已初始化`);
      console.log(`   cd ${name} && npm install`);
    });

  cmd.command('run <script>')
    .description('快速运行 npm script')
    .action((script) => {
      try {
        const result = execSync(`npm run ${script}`, { encoding: 'utf8', stdio: 'inherit' });
      } catch (e: any) {
        console.log(`❌ 运行失败: ${e.message}`);
      }
    });

  cmd.command('env')
    .description('查看项目环境信息')
    .action(() => {
      const pkg = JSON.parse(existsSync('package.json') ? require('fs').readFileSync('package.json', 'utf8') : '{}');
      const nodeV = process.version;
      const npmV = execSync('npm --version', { encoding: 'utf8' }).trim();
      const gitB = existsSync('.git') ? execSync('git branch --show-current', { encoding: 'utf8' }).trim() : '(none)';

      console.log(`\n🔧 项目环境`);
      console.log(`   名称: ${pkg.name || '(未设置)'}`);
      console.log(`   Node: ${nodeV}`);
      console.log(`   npm:  ${npmV}`);
      console.log(`   Git:  ${gitB}`);
      console.log(`   依赖: ${Object.keys(pkg.dependencies || {}).length} prod / ${Object.keys(pkg.devDependencies || {}).length} dev\n`);
    });
}
