#!/usr/bin/env bash
set -e

# ============================================================
#  Nova CLI — 一键安装脚本 (兼容 Linux / macOS)
#  用法: curl -fsSL https://raw.githubusercontent.com/Corps-Cy/nova/main/install.sh | bash
# ============================================================

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

info()  { echo -e "${COLOR_CYAN}◆${COLOR_RESET} $1"; }
ok()    { echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"; }
warn()  { echo -e "${COLOR_YELLOW}!${COLOR_RESET} $1"; }
fail()  { echo -e "${COLOR_RED}✗${COLOR_RESET} $1"; exit 1; }

# ============================================================
# 1. 环境检测
# ============================================================

echo ""
echo -e "${COLOR_CYAN}╔══════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_CYAN}║  ◆ Nova CLI — Freelancer Toolkit    ║${COLOR_RESET}"
echo -e "${COLOR_CYAN}║  一键安装                           ║${COLOR_RESET}"
echo -e "${COLOR_CYAN}╚══════════════════════════════════════╝${COLOR_RESET}"
echo ""

# 检查依赖
missing=()
for cmd in git node npm; do
  command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
done
[ ${#missing[@]} -gt 0 ] && fail "缺少依赖: ${missing[*]}\n  macOS: brew install ${missing[*]}\n  Ubuntu: sudo apt install ${missing[*]}"

# Node >= 18
node_major=$(node -e "console.log(process.versions.node.split('.')[0])")
[ "$node_major" -lt 18 ] && fail "Node.js >= 18 required (当前 v${node_major})"

ok "Node.js $(node -v)  ·  npm $(npm -v)"

# ============================================================
# 2. 克隆 / 更新
# ============================================================

INSTALL_DIR="$HOME/.nova-cli"
REPO_URL="https://github.com/Corps-Cy/nova.git"

if [ -d "$INSTALL_DIR/.git" ]; then
  info "更新已有安装..."
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || {
    warn "git pull 失败，重新安装..."
    rm -rf "$INSTALL_DIR"
  }
fi

if [ ! -d "$INSTALL_DIR" ]; then
  info "克隆仓库..."
  git clone "$REPO_URL" "$INSTALL_DIR" || fail "克隆失败，请检查网络"
fi

# ============================================================
# 3. 安装依赖 + 构建
# ============================================================

cd "$INSTALL_DIR"
info "安装依赖（含构建工具）..."
npm install 2>&1 | tail -1

info "构建..."
npm run build 2>&1 | tail -1
ok "构建完成"

# ============================================================
# 4. 创建 wrapper 脚本（不依赖 npm link）
# ============================================================

BIN_DIR="$HOME/.nova-cli/bin"
mkdir -p "$BIN_DIR"

cat > "$BIN_DIR/nova" << 'WRAPPER'
#!/usr/bin/env bash
exec node "$(dirname "$0")/../dist/index.js" "$@"
WRAPPER
chmod +x "$BIN_DIR/nova"

ok "nova 可执行文件已创建: $BIN_DIR/nova"

# ============================================================
# 5. 确保 PATH 包含 BIN_DIR（兼容多系统）
# ============================================================

# 检测当前 shell 配置文件
detect_shell_rc() {
  local shell_name
  shell_name="$(basename "${SHELL:-/bin/bash}")"
  case "$shell_name" in
    zsh)  echo "$HOME/.zshrc" ;;
    bash) echo "$HOME/.bashrc" ;;
    fish) echo "$HOME/.config/fish/config.fish" ;;
    *)    echo "$HOME/.bashrc" ;;  # fallback
  esac
}

ensure_path() {
  local bin_dir="$1"
  local rc_file
  rc_file="$(detect_shell_rc)"

  # 检查 nova 是否已在 PATH 中
  if command -v nova >/dev/null 2>&1 && [ "$(command -v nova)" = "$bin_dir/nova" ]; then
    ok "nova 已在 PATH 中"
    return 0
  fi

  local path_line
  if [ "$(basename "${SHELL:-}")" = "fish" ]; then
    path_line="set -gx PATH $bin_dir \$PATH"
    # fish: set -U for universal
    fish -c "set -U fish_user_paths $bin_dir \$fish_user_paths" 2>/dev/null && {
      ok "已添加到 Fish universal PATH"
      return 0
    }
  else
    path_line='export PATH="$HOME/.nova-cli/bin:$PATH"'
  fi

  # 检查是否已写入
  if [ -f "$rc_file" ] && grep -qF '.nova-cli/bin' "$rc_file" 2>/dev/null; then
    # 已有但当前 shell 未生效
    export PATH="$bin_dir:$PATH"
    ok "PATH 已写入 $rc_file，当前 shell 已刷新"
  else
    echo "" >> "$rc_file"
    echo "# Nova CLI" >> "$rc_file"
    echo "$path_line" >> "$rc_file"
    export PATH="$bin_dir:$PATH"
    ok "已添加到 $rc_file"
  fi
}

ensure_path "$BIN_DIR"

# ============================================================
# 6. 验证
# ============================================================

echo ""
if nova --version >/dev/null 2>&1; then
  ok "nova $(nova --version 2>/dev/null) 安装成功"
else
  warn "nova 命令暂时不可用，请重新打开终端窗口或运行:"
  echo -e "  ${COLOR_CYAN}source $(detect_shell_rc)${COLOR_RESET}"
fi

# ============================================================
# 7. 提示
# ============================================================

echo ""
echo -e "${COLOR_GREEN}══════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_GREEN}  ✅ Nova CLI 安装完成！${COLOR_RESET}"
echo -e "${COLOR_GREEN}══════════════════════════════════════${COLOR_RESET}"
echo ""
echo "  🚀 快速开始:"
echo "    nova                    交互式 TUI"
echo "    nova c add \"客户名\"     添加客户"
echo "    nova t board            任务看板"
echo "    nova week report        生成周报"
echo ""
echo "  🤖 配置 AI（可选）:"
echo "    nova ai provider set zhipu <key> --default"
echo "    nova ai provider set qwen <key>"
echo "    nova ai provider set minimax <key>"
echo ""
echo "  📂 安装位置: $INSTALL_DIR"
echo "  🔄 更新: cd $INSTALL_DIR && git pull && npm install && npm run build"
echo "  🗑️ 卸载: rm -rf ~/.nova-cli ~/.nova"
echo ""
