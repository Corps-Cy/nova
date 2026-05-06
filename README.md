# nova v2.0 — AI RAG Knowledge Base API Service

## 安装

```bash
curl -fsSL https://raw.githubusercontent.com/Corps-Cy/nova/main/install.sh | bash
```

## 快速开始

```bash
# 1. 配置 API Key（用于 Embedding 和 LLM）
nova config set embedding_api_key sk-your-key
nova config set embedding_base_url https://api.openai.com/v1

# 2. 创建知识库
nova kb create "产品文档"

# 3. 上传文档
nova kb upload README.md <kb_id>
nova kb url https://example.com/docs <kb_id>

# 4. 测试查询
nova kb query <kb_id> "怎么安装？"

# 5. 创建 API Key 并启动服务
nova api create -n "生产环境"
nova serve --port 3000
```

## API 使用

```bash
# 查询知识库
curl -X POST http://localhost:3000/api/v1/query \
  -H "Authorization: Bearer nova_xxx" \
  -H "Content-Type: application/json" \
  -d '{"kb_id": "xxx", "question": "如何退款？"}'
```

## CLI 命令

| 命令 | 说明 |
|------|------|
| `nova kb create <name>` | 创建知识库 |
| `nova kb ls` | 列出知识库 |
| `nova kb upload <file> <kb_id>` | 上传文件 |
| `nova kb url <url> <kb_id>` | 抓取网页 |
| `nova kb text <kb_id>` | 从 stdin 导入文本 |
| `nova kb query <kb_id> <question>` | 查询测试 |
| `nova kb docs <kb_id>` | 列出文档 |
| `nova api create` | 创建 API Key |
| `nova api ls` | 列出 API Key |
| `nova serve` | 启动 API 服务 |
| `nova config set <key> <value>` | 设置配置 |

## 技术栈

- Node.js + TypeScript
- SQLite + sqlite-vec（向量搜索）
- Express（API 服务）
- 支持多种 LLM：OpenAI / Anthropic / 智谱 / 通义千问

## License

MIT
