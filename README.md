<p align="center">
  <img src="https://img.shields.io/badge/version-0.2.0-cyan?style=flat-square" alt="version"/>
  <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square" alt="node"/>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"/>
</p>

<h1 align="center">
  <span style="color:#06b6d4">◆</span> <span style="color:#06b6d4">c</span><span style="color:#3b82f6">y</span>
</h1>

<p align="center">
  <strong>Freelancer Toolkit</strong> — 一站式接单管理 CLI 工具
</p>

<p align="center">
  客户管理 · 项目跟踪 · 任务看板 · AI 工具链
</p>

---

## ✨ 特性

- 🏢 **客户管理** — 客户信息 CRUD、联系方式、备注
- 📦 **项目管理** — 项目状态流转、预算跟踪、收款记录
- 📋 **任务看板** — TUI 看板视图、优先级、工时记录
- 🤖 **AI 工具链** — Prompt 模板管理、多模型对话、快速提问
- 🎨 **赛博朋克主题** — 24-bit 真彩色渐变 Logo、专业终端 UI
- 💾 **本地 SQLite** — 零配置、数据完全本地、隐私安全

## 📦 安装

```bash
git clone https://github.com/your-username/cy.git
cd cy
npm install
```

## 🚀 使用

```bash
# 开发模式
npm run dev <command>

# 构建
npm run build

# 运行（构建后）
npm start <command>
```

运行 `cy` 不带参数显示渐变 Logo。

## 📖 命令速查

### 客户管理 `cy client` / `cy c`

| 命令 | 说明 |
|------|------|
| `cy c add <name>` | 添加客户（`-c` 公司 `-t` 联系人 `-e` 邮箱） |
| `cy c list` / `cy c ls` | 客户列表 |
| `cy c edit <id>` | 编辑客户信息 |
| `cy c rm <id>` | 删除客户 |

### 项目管理 `cy project` / `cy p`

| 命令 | 说明 |
|------|------|
| `cy p add <name> -C <clientId>` | 添加项目（`-b` 预算） |
| `cy p list` | 项目列表 |
| `cy p status <id> <status>` | 更新状态（requirement/development/review/delivered） |
| `cy p pay <id> <amount>` | 记录收款 |

### 任务管理 `cy task` / `cy t`

| 命令 | 说明 |
|------|------|
| `cy t add <title>` | 添加任务（`-p` 优先级 `-P` 关联项目 `--due` 截止日期） |
| `cy t list [-s status]` | 任务列表 |
| `cy t board` / `cy t b` | 🎯 TUI 看板视图 |
| `cy t status <id> <status>` | 更新状态（todo/doing/done） |
| `cy t time <id> <hours>` | 记录工时 |
| `cy t stats` | 任务统计 |

### AI 工具链 `cy ai`

| 命令 | 说明 |
|------|------|
| `cy ai prompt add <name>` | 添加 Prompt 模板（`-c` 分类 `--content` 或 `--file`） |
| `cy ai prompt list` | 模板列表 |
| `cy ai prompt show <id>` | 查看模板 |
| `cy ai chat` | 💬 持续对话（`-m` 模型 `-s` 系统提示） |
| `cy ai ask <message>` | 快速单次提问 |

## ⚙️ 环境变量

```bash
# AI 功能（可选）
export OPENAI_API_KEY=sk-...
export OPENAI_BASE_URL=https://your-proxy.com/v1  # 自定义 API 地址
export ANTHROPIC_API_KEY=sk-ant-...               # Claude 支持
```

## 🎨 主题

cy 使用赛博朋克风格主题色系统，支持 24-bit 真彩色渐变：

| 角色 | 颜色 | 用途 |
|------|------|------|
| Primary | `#06b6d4` cyan | 品牌、标题、边框 |
| Accent | `#f59e0b` amber | 辅助强调 |
| Success | `#22c55e` green | 完成状态 |
| Warning | `#eab308` yellow | 进行中 |
| Error | `#ef4444` red | 错误、高优先级 |

自定义主题：编辑 `src/ui/theme.ts`。

## 🛠️ 技术栈

- **Runtime**: Node.js ≥ 18
- **Language**: TypeScript + JSX
- **CLI Framework**: Commander.js
- **TUI**: Ink (React for CLI)
- **Database**: better-sqlite3
- **Build**: tsup

## 📂 项目结构

```
cy/
├── src/
│   ├── index.tsx              # 入口
│   ├── commands/
│   │   ├── index.ts           # 命令注册
│   │   ├── client.tsx         # 客户管理
│   │   ├── project.tsx        # 项目管理
│   │   ├── task.tsx           # 任务管理
│   │   └── ai.tsx             # AI 工具链
│   ├── store/
│   │   ├── index.ts           # 数据层导出
│   │   ├── db.ts              # SQLite 初始化
│   │   ├── client.ts          # 客户数据操作
│   │   ├── project.ts         # 项目数据操作
│   │   ├── task.ts            # 任务数据操作
│   │   └── prompt.ts          # Prompt 模板操作
│   └── ui/
│       ├── index.ts           # UI 导出
│       ├── components/
│       │   ├── Header.tsx     # 标题组件
│       │   ├── Input.tsx      # 终端输入
│       │   ├── Logo.tsx       # 渐变 Logo
│       │   ├── Select.tsx     # 键盘选择
│       │   └── Table.tsx      # 表格
│       ├── theme.ts           # 主题色系统
│       └── utils.tsx          # 工具函数
├── package.json
├── tsconfig.json
└── .gitignore
```

## 📄 License

MIT
