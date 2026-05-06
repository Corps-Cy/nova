import { Command } from 'commander';
import { createKnowledgeBase, listKnowledgeBases, getKnowledgeBase, deleteKnowledgeBase, updateKnowledgeBase } from '../store/knowledgeBase.js';
import { listDocuments, deleteDocument } from '../store/document.js';
import { ingestFile, ingestUrl, ingestText } from '../services/ingest.js';
import { queryKnowledgeBase } from '../services/rag.js';
import { resolveEmbeddingConfig } from '../services/embedding.js';
import { ensureDb } from '../store/db.js';

export function registerKbCommand(program: Command) {
  const kb = program.command('kb').description('📚 知识库管理');

  kb.command('create <name>')
    .description('创建知识库')
    .option('-d, --description <desc>', '描述')
    .option('-m, --model <model>', 'Embedding 模型')
    .option('-k, --api-key <key>', 'API Key')
    .option('-u, --base-url <url>', 'API Base URL')
    .action(async (name, opts) => {
      const result = createKnowledgeBase({ name, description: opts.description, model: opts.model, api_key: opts.apiKey, base_url: opts.baseUrl });
      console.log(`\n✅ 知识库已创建: ${result.name} (${result.id})`);
      console.log(`   上传文档: nova kb upload <file> ${result.id}\n`);
    });

  kb.command('list').alias('ls')
    .description('列出知识库')
    .action(() => {
      const kbs = listKnowledgeBases() as any[];
      if (kbs.length === 0) {
        console.log('\n  💤 暂无知识库\n');
        return;
      }
      console.log('\n📚 知识库列表\n');
      kbs.forEach(k => {
        console.log(`  ${k.name} (${k.id})`);
        console.log(`    文档: ${k.doc_count}  |  分块: ${k.total_chunks}`);
        if (k.description) console.log(`    ${k.description}`);
      });
      console.log('');
    });

  kb.command('delete <id>')
    .description('删除知识库')
    .option('-f, --force', '跳过确认')
    .action(async (id, opts) => {
      const k = getKnowledgeBase(id) as any;
      if (!k) { console.log(`\n❌ 知识库不存在\n`); return; }
      if (!opts.force) {
        console.log(`\n⚠️  将删除知识库 "${k.name}" 及其所有文档`);
        console.log(`   使用 -f 跳过确认`);
        return;
      }
      deleteKnowledgeBase(id);
      console.log(`\n🗑️ 已删除: ${k.name}\n`);
    });

  kb.command('upload <file> <kbId>')
    .description('上传文件到知识库')
    .action(async (file, kbId) => {
      const k = getKnowledgeBase(kbId);
      if (!k) { console.log(`\n❌ 知识库不存在\n`); return; }
      console.log(`\n📥 正在解析和向量化 ${file}...`);
      try {
        const result = await ingestFile(kbId, file);
        console.log(`✅ 已导入: ${result.chunks} 个分块 (${result.doc_id})\n`);
      } catch (e: any) {
        console.log(`\n❌ 导入失败: ${e.message}\n`);
      }
    });

  kb.command('url <url> <kbId>')
    .description('抓取网页内容到知识库')
    .action(async (url, kbId) => {
      const k = getKnowledgeBase(kbId);
      if (!k) { console.log(`\n❌ 知识库不存在\n`); return; }
      console.log(`\n🌐 正在抓取 ${url}...`);
      try {
        const result = await ingestUrl(kbId, url);
        console.log(`✅ 已导入: ${result.chunks} 个分块 (${result.doc_id})\n`);
      } catch (e: any) {
        console.log(`\n❌ 导入失败: ${e.message}\n`);
      }
    });

  kb.command('text <kbId>')
    .description('直接输入文本内容到知识库')
    .option('-f, --filename <name>', '文件名', 'inline.txt')
    .action(async (kbId, opts) => {
      const k = getKnowledgeBase(kbId);
      if (!k) { console.log(`\n❌ 知识库不存在\n`); return; }
      // Read from stdin
      const chunks: string[] = [];
      process.stdin.setEncoding('utf-8');
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      const text = chunks.join('');
      if (!text.trim()) { console.log('❌ 无内容'); return; }
      console.log('\n📥 正在向量化...');
      try {
        const result = await ingestText(kbId, text, opts.filename);
        console.log(`✅ 已导入: ${result.chunks} 个分块 (${result.doc_id})\n`);
      } catch (e: any) {
        console.log(`\n❌ 导入失败: ${e.message}\n`);
      }
    });

  kb.command('query <kbId> <question>')
    .description('测试查询知识库')
    .option('--top <n>', '返回结果数', '5')
    .action(async (kbId, question, opts) => {
      const k = getKnowledgeBase(kbId);
      if (!k) { console.log(`\n❌ 知识库不存在\n`); return; }
      console.log(`\n🔍 正在查询: ${question}\n`);
      try {
        const result = await queryKnowledgeBase(kbId, question, undefined, undefined, undefined, parseInt(opts.top));
        console.log(`💬 回答 (${result.latency_ms}ms):`);
        console.log(`\n${result.answer}\n`);
        if (result.sources.length > 0) {
          console.log(`📎 来源 (${result.sources.length}):`);
          result.sources.forEach((s, i) => {
            console.log(`  [${i + 1}] ${s.filename}: ${s.content.slice(0, 80)}...`);
          });
        }
        console.log('');
      } catch (e: any) {
        console.log(`\n❌ 查询失败: ${e.message}\n`);
      }
    });

  kb.command('docs <kbId>')
    .description('列出知识库中的文档')
    .action((kbId) => {
      const docs = listDocuments(kbId) as any[];
      if (docs.length === 0) {
        console.log('\n  💤 暂无文档\n');
        return;
      }
      console.log(`\n📄 文档列表 (${docs.length})\n`);
      docs.forEach(d => {
        console.log(`  [${d.id}] ${d.filename} — ${d.chunk_count} 分块 (${d.source_type})`);
      });
      console.log('');
    });

  kb.command('rm-doc <docId>')
    .description('删除文档')
    .action((docId) => {
      deleteDocument(docId);
      console.log('🗑️ 文档已删除');
    });
}
