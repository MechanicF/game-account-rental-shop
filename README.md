# 游戏账号租赁店铺

一个开箱即用的游戏账号租赁店铺系统：**零第三方依赖**，只需 Node.js 18+ 即可运行。前台支持浏览、筛选、自助上架，后台可管理商品、审核申请、自定义字段与页面内容，数据持久化到本地 JSON 文件。

## ✨ 特性

- **零依赖部署** — 纯 Node.js 内置模块（http/fs/crypto/zlib），无需 `npm install`、无需数据库。
- **前台浏览** — 搜索、多条件筛选、卡片/表格双视图、明暗主题、复制编号或全部信息。
- **自助上架** — 访客提交账号资料（选填截图），进入待审核队列，店主通过后自动上架。
- **后台管理** — 商品增删改、上下架、置顶、高亮，待审核一键通过/拒绝，实时统计。
- **灵活配置** — 自定义商品字段（名称/说明/是否仅管理员可见/是否参与筛选/展示顺序）、店名、联系方式、客服悬浮窗（含二维码）、公告弹窗、阅读协议。
- **本地数据** — JSON 文件存储，原子写入防损坏；每日自动备份（保留 14 天），支持一键导出/恢复。
- **WebDAV 异地备份** — 每次生成新备份自动上传到支持 WebDAV 的网盘（坚果云/Nextcloud/群晖等），含测试连接与同步状态；密码仅存服务器不下发浏览器。
- **安全加固** — 异步 scrypt 密码哈希、安全响应头、登录/提交限流、敏感字段过滤、富文本白名单清洗、强制首登改密（详见下文）。
- **运维友好** — 附带 systemd 服务模板与交互式管理脚本 `shopctl`。

## 🚀 快速开始

环境要求：**Node.js 18 或更高版本**。

```bash
git clone https://github.com/MechanicF/game-account-rental-shop.git
cd game-account-rental-shop
node server.js
```

打开 <http://localhost:3000> 即可访问店铺。

配置文件监听地址与端口（默认 `0.0.0.0:3000`）：

```bash
HOST=127.0.0.1 PORT=8080 node server.js
```

无需 `npm install`，无构建步骤。也可使用 `npm start`。

## 🔐 首次登录

1. 启动后查看终端日志，会打印随机生成的**后台入口路径**（形如 `/admin_xxxxxx`）。
2. 访问 `http://<服务器>:<端口>/<后台入口路径>`。
3. 默认账号 `admin`，初始密码 `admin123`。

> **v1.1.0 起，首次用默认密码登录会强制引导修改密码。** 请立即修改，并妥善保管后台入口路径——不要在仍使用默认密码时把服务暴露到公网。

## 📁 目录结构

```
.
├── server.js          # 零依赖后端：API、鉴权、静态服务、备份
├── public/
│   ├── index.html     # 页面骨架（前台 + 后台）
│   ├── app.js         # 核心逻辑：渲染、登录、商品/设置操作、Hook 机制
│   ├── adapt.js       # 扩展模块：筛选/字段配置/表格视图/客服/公告/协议
│   └── style.css      # 样式（含明暗主题）
├── data/              # 运行数据（已 gitignore，不入库）
│   ├── db.json        # 数据库文件
│   └── backups/       # 每日自动备份（保留 14 份）
├── package.json       # 启动脚本与 Node 版本声明
├── shop.service       # systemd 服务模板
├── shopctl.sh         # 服务器管理脚本
└── 部署说明.md         # 完整生产部署指南
```

## 🛠️ 服务器部署

生产环境的完整步骤（Nginx 反向代理 + HTTPS、防火墙、备份策略）见 **[部署说明.md](部署说明.md)**。

快速使用附带的管理脚本：

```bash
# 安装为全局命令
sudo cp shopctl.sh /usr/local/bin/shopctl && sudo chmod +x /usr/local/bin/shopctl

shopctl          # 交互菜单
shopctl install  # 安装/重新部署
shopctl port     # 修改端口
shopctl logs     # 实时日志（Ctrl+C 退出）
shopctl restart  # 重启服务
shopctl status   # 查看状态
shopctl uninstall# 卸载（自动先备份数据）
```

> `shopctl install` 的安装源默认为 `/root/shop-deploy.tar.gz`，使用前请按实际情况调整脚本顶部变量，或直接用 systemd 模板部署本仓库代码。

## ⚙️ 工作原理

- **数据层**：所有数据存于 `data/db.json`，写入采用「临时文件 + 原子重命名」，避免写一半损坏；损坏时自动另存为 `db.json.bak` 并重建。
- **价格合计**：由服务端 `calcTotalServer()` 统一计算（哈夫币量 ÷ 比例 + 押金），随数据一并下发，前端只负责显示，避免前后端算法漂移。
- **前端扩展**：`app.js` 提供统一 Hook 机制（`renderPrepare` / `renderList` / `renderPost` / `settings` 等阶段），`adapt.js` 的各功能模块通过注册 Hook 介入，避免层层函数包裹导致的调用链断裂与重复渲染。
- **敏感字段**：`coinRate`（比例）、`deposit`（押金）及标记为 `adminOnly` / `show:false` 的字段在服务端下发前台数据时即被剔除。

## 🔒 安全说明

- 密码使用异步 `scrypt` + 随机盐存储，校验用 `timingSafeEqual`，避免时序攻击。
- 全站统一安全响应头（CSP、nosniff、Referrer-Policy、Permissions-Policy）。
- 管理接口 `Cache-Control: no-store`，防止敏感数据被代理/浏览器缓存。
- 静态服务拒绝隐藏文件、数据目录访问与路径穿越；非 GET/HEAD 请求返回 405。
- 公告/协议等富文本经白名单清洗（基于 DOMParser），杜绝 XSS。
- 后台登录、自助上架均有限流；会话 HttpOnly + SameSite=Lax，HTTPS 下自动加 Secure。

## 📦 数据说明

仓库**不包含任何运行数据**——无商品记录、客户联系方式、管理员凭据或数据库备份。运行数据仅保存在本机 `data/db.json` 与 `data/backups/`，已加入 `.gitignore`。请自行妥善保管，迁移或备份时避免公开。

## 📄 许可

未指定开源许可，仅供个人/内部使用。
