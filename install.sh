#!/usr/bin/env bash
set -e

# ============================================================
#  Nova CLI — 一键安装脚本
#  用法: curl -fsSL https://raw.githubusercontent.com/Corps-Cy/nova/main/install.sh | bash
#        或: bash install.sh
# ============================================================

COLOR_CYAN='\033[0;36m'
COLOR_YELLOW='\033[0;33m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

info()  { echo -e "${COLOR_CYAN}◆${COLOR_RESET} $1"; }
warn()  { echo -e "${COLOR_YELLOW}!${COLOR_RESET} $1"; }
ok()    { echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"; }
fail()  { echo -e "${COLOR_RED}✗${COLOR_RESET} $1"; exit 1; }

# --- 检查依赖 ---
check_deps() {
  local missing=()
  command -v git >/dev/null 2>&1 || missing+=("git")
  command -v node >/dev/null 2>&1 || missing+=("node")
  command -v npm >/dev/null 2>&1 || missing+=("npm")

  if [ ${#missing[@]} -gt 0 ]; then
    fail "缺少依赖: ${missing[*]}\n  请先安装: https://nodejs.org (含 npm)\n  macOS: brew install git node\n  Ubuntu: apt install git nodejs npm"
  fi
}

# --- 检查 Node 版本 ---
check_node_version() {
  local major
  major=$(node -e "console.log(process.versions.node.split('.')[0])")
  if [ "$major" -lt 18 ]; then
    fail "Node.js 版本过低 (当前 v${major})，需要 >= 18\n  请升级: https://nodejs.org"
  fi
}

# --- 主流程 ---
echo ""
echo -e "${COLOR_CYAN}╔══════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_CYAN}║  ◆ Nova CLI — Freelancer Toolkit    ║${COLOR_RESET}"
echo -e "${COLOR_CYAN}║  一键安装                           ║${COLOR_RESET}"
echo -e "${COLOR_CYAN}╚══════════════════════════════════════╝${COLOR_RESET}"
echo ""

# 1. 检查依赖
info "检查依赖..."
check_deps
check_node_version
ok "Node.js $(node -v)  |  npm $(npm -v)"

# 2. 克隆/更新仓库
INSTALL_DIR="$HOME/.nova-cli"
REPO_URL="https://github.com/Corps-Cy/nova.git"

if [ -d "$INSTALL_DIR/.git" ]; then
  info "检测到已有安装，更新中..."
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || { warn "更新失败，将重新安装"; rm -rf "$INSTALL_DIR"; }
fi

if [ ! -d "$INSTALL_DIR" ]; then
  info "克隆仓库..."
  git clone "$REPO_URL" "$INSTALL_DIR" || fail "克隆失败，请检查网络"
fi

# 3. 安装依赖
info "安装依赖..."
cd "$INSTALL_DIR"
npm install --production 2>&1 | tail -1
ok "依赖安装完成"

# 4. 全局链接
info "注册全局命令..."
npm link 2>&1 | tail -1

# 5. 验证
echo ""
if command -v nova >/dev/null 2>&1; then
  nova --version 2>/dev/null && ok "nova 命令已可用" || true
else
  warn "nova 命令未在 PATH 中，请手动运行:"
  echo -e "  ${COLOR_CYAN}export PATH=\"\$HOME/.nova-cli/node_modules/.bin:\$PATH\"${COLOR_RESET}"
  echo -e "  或使用: ${COLOR_CYAN}cd $INSTALL_DIR && npx tsx src/index.tsx${COLOR_RESET}"
fi

# 6. 下一步提示
echo ""
echo -e "${COLOR_GREEN}══════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_GREEN}  ✅ Nova CLI 安装完成！${COLOR_RESET}"
echo -e "${COLOR_GREEN}══════════════════════════════════════${COLOR_RESET}"
echo ""
echo "  🚀 快速开始:"
echo "    nova                    显示 Logo"
echo "    nova c add \"客户名\"     添加客户"
echo "    nova t board            任务看板"
echo "    nova week report        生成周报"
echo ""
echo "  🤖 配置 AI（可选）:"
echo "    nova ai provider set zhipu <your_key> --default"
echo "    nova ai provider set qwen <your_key>"
echo "    nova ai provider set minimax <your_key>"
echo ""
echo "  📂 安装位置: $INSTALL_DIR"
echo "  🔄 更新: cd $INSTALL_DIR && git pull && npm install"
echo ""
