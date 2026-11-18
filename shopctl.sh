#!/bin/bash
# ============================================================
# shopctl.sh —— 游戏账号租赁店铺 管理脚本
# 功能：安装/重新部署、卸载、修改端口、查看日志、重启、状态、退出
# 用法：
#   ./shopctl.sh              # 进入交互菜单
#   ./shopctl.sh install      # 直接执行某项
#   ./shopctl.sh uninstall
#   ./shopctl.sh port
#   ./shopctl.sh logs
#   ./shopctl.sh restart
#   ./shopctl.sh status
# 安装源：/root/shop-deploy.tar.gz（如需升级版本，替换此包即可）
# ============================================================

APP_DIR="/opt/shop"
SERVICE="shop.service"
SERVICE_FILE="/etc/systemd/system/${SERVICE}"
SRC_TAR="/root/shop-deploy.tar.gz"
NODE_BIN="/usr/bin/node"
DEFAULT_PORT=3000

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info(){ echo -e "${GREEN}[INFO]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
err(){  echo -e "${RED}[ERR]${NC} $1"; }

require_root(){
  if [ "$(id -u)" -ne 0 ]; then err "请用 root 运行（sudo -i 后执行）"; return 1; fi
}

# 读取当前端口
get_port(){
  [ -f "$SERVICE_FILE" ] && grep -oP 'Environment=PORT=\K[0-9]+' "$SERVICE_FILE" 2>/dev/null | head -1
}

# 读取后台入口路径
get_admin_path(){
  grep -o '"adminPath"[[:space:]]*:[[:space:]]*"[^"]*"' "$APP_DIR/data/db.json" 2>/dev/null \
    | head -1 | sed 's/.*: *"//; s/"$//'
}

# 生成 systemd 服务文件
write_service(){
  local port="$1"
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Game Account Rental Shop
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} ${APP_DIR}/server.js
Environment=PORT=${port}
Environment=HOST=0.0.0.0
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=shop
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
EOF
}

port_in_use(){
  ss -tln 2>/dev/null | grep -qE ":${1}[[:space:]]"
}

# ---------- 安装 / 重新部署 ----------
do_install(){
  require_root || return 1
  info "开始安装 / 重新部署..."

  # 重新部署时保留现有数据（db.json 与 backups），避免覆盖你测试产生的内容
  if [ -d "$APP_DIR/data" ]; then
    local tmpbk="/tmp/_shop_data_bk_$$.tar.gz"
    if tar -czf "$tmpbk" -C "$APP_DIR" data 2>/dev/null; then
      info "已暂存现有数据"
    else
      tmpbk=""
    fi
  fi

  if [ -f "$SRC_TAR" ]; then
    rm -rf "$APP_DIR"
    mkdir -p "$APP_DIR"
    tar -xzf "$SRC_TAR" -C "$APP_DIR" --strip-components=1 || { err "解压失败"; return 1; }
    info "已从 $SRC_TAR 部署代码"
  elif [ -d "$APP_DIR/server.js" ] || [ -f "$APP_DIR/server.js" ]; then
    warn "未找到源包，使用现有目录代码"
  else
    err "未找到安装源 $SRC_TAR，且目标目录无代码，无法安装"; return 1
  fi

  # 还原数据
  if [ -n "$tmpbk" ] && [ -f "$tmpbk" ]; then
    tar -xzf "$tmpbk" -C "$APP_DIR" && info "已还原原有数据"
    rm -f "$tmpbk"
  fi

  local port; port="$(get_port)"; [ -z "$port" ] && port="$DEFAULT_PORT"
  write_service "$port"
  systemctl daemon-reload
  systemctl enable shop >/dev/null 2>&1
  systemctl restart shop
  sleep 1.5

  if systemctl is-active --quiet shop; then
    local ap; ap="$(get_admin_path)"
    info "安装完成 ✅  端口 ${port}"
    echo -e "  前台: ${BLUE}http://服务器IP:${port}/${NC}"
    echo -e "  后台: ${BLUE}http://服务器IP:${port}/${ap}${NC}  (账号 admin / admin123)"
  else
    err "服务启动失败，最近日志："
    journalctl -u shop -n 20 --no-pager
    return 1
  fi
}

# ---------- 卸载 ----------
do_uninstall(){
  require_root || return 1
  warn "卸载将停止服务并删除 ${APP_DIR} 及全部数据！"
  read -rp "确认卸载？输入 yes 继续: " ans
  [ "$ans" != "yes" ] && { info "已取消"; return 0; }

  systemctl stop shop 2>/dev/null || true
  systemctl disable shop >/dev/null 2>&1 || true
  rm -f "$SERVICE_FILE"
  systemctl daemon-reload

  # 卸载前整目录备份，留退路
  if [ -d "$APP_DIR" ]; then
    local bk="/root/shop-full-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$bk" -C / opt/shop 2>/dev/null && info "卸载前已备份到: $bk"
  fi
  rm -rf "$APP_DIR"
  info "卸载完成 ✅（服务、程序、数据均已删除）"
}

# ---------- 修改端口 ----------
do_port(){
  require_root || return 1
  local cur; cur="$(get_port)"; [ -z "$cur" ] && cur="未安装"
  echo -n "当前端口: ${cur}，请输入新端口: "; read -r new
  if [[ ! "$new" =~ ^[0-9]+$ ]] || [ "$new" -lt 1 ] || [ "$new" -gt 65535 ]; then
    err "端口不合法（应为 1-65535 的数字）"; return 1
  fi
  if [ ! -f "$SERVICE_FILE" ]; then err "服务未安装，请先安装"; return 1; fi
  if [ "$new" != "$cur" ] && port_in_use "$new"; then err "端口 ${new} 已被占用"; return 1; fi

  local old; old="$cur"
  write_service "$new"
  systemctl daemon-reload
  systemctl restart shop
  sleep 1.5

  if systemctl is-active --quiet shop; then
    local ap; ap="$(get_admin_path)"
    info "端口已修改为 ${new} ✅"
    echo -e "  前台: ${BLUE}http://服务器IP:${new}/${NC}"
    echo -e "  后台: ${BLUE}http://服务器IP:${new}/${ap}${NC}"
  else
    err "重启失败，正在回滚到原端口 ${old}..."
    [ "$old" != "未安装" ] && write_service "$old"
    systemctl daemon-reload
    systemctl restart shop
    return 1
  fi
}

# ---------- 查看日志 ----------
do_logs(){
  info "实时日志（按 Ctrl+C 退出）..."
  journalctl -u shop -f --no-pager
}

# ---------- 重启 ----------
do_restart(){
  require_root || return 1
  systemctl restart shop && info "服务已重启 ✅"
}

# ---------- 状态 ----------
do_status(){
  systemctl status shop --no-pager 2>&1 | head -15
  echo
  local p; p="$(get_port)"
  [ -n "$p" ] && echo -e "访问端口: ${BLUE}${p}${NC}"
}

# ---------- 菜单 ----------
menu(){
  local p; p="$(get_port)"; [ -z "$p" ] && p="未安装"
  echo
  echo -e "${BLUE}============================================${NC}"
  echo -e "  🎮 游戏账号租赁店铺 · 管理"
  echo -e "${BLUE}============================================${NC}"
  echo -e "  当前端口: ${GREEN}${p}${NC}"
  echo "  1) 安装 / 重新部署"
  echo "  2) 卸载"
  echo "  3) 修改端口"
  echo "  4) 查看日志（实时）"
  echo "  5) 重启服务"
  echo "  6) 查看状态"
  echo "  7) 退出"
  echo -e "${BLUE}============================================${NC}"
  read -rp "请选择 [1-7]: " choice
  case "$choice" in
    1) do_install ;;
    2) do_uninstall ;;
    3) do_port ;;
    4) do_logs ;;
    5) do_restart ;;
    6) do_status ;;
    7) info "再见"; exit 0 ;;
    *) err "无效选择" ;;
  esac
  echo
  read -rp "按回车返回菜单..." _
}

# ---------- 入口 ----------
case "${1:-}" in
  install)   do_install ;;
  uninstall) do_uninstall ;;
  port)      do_port ;;
  logs)      do_logs ;;
  restart)   do_restart ;;
  status)    do_status ;;
  "")        while true; do menu; done ;;
  *) echo "用法: $0 {install|uninstall|port|logs|restart|status}"; exit 1 ;;
esac
