# 游戏账号租赁店铺

一个开箱即用的游戏账号租赁店铺系统。后端零第三方依赖，只需 Node.js 18+ 即可运行；前台支持浏览、筛选、自助上架，后台提供商品管理、待审审核、自定义字段、内容配置与异地备份。数据持久化到本地 JSON 文件，不依赖任何数据库服务。

> **v1.3.0** · 新增 WebDAV 异地备份与远程版本管理、卡片式字段编辑器、设置页分栏导航。

## 特性

### 面向访客
- **商品浏览** — 搜索、多条件筛选、卡片 / 表格双视图、明暗主题、一键复制编号与详情。
- **自助上架** — 访客提交账号资料（选填截图），进入待审核队列，店主通过后才展示。
- **信息透明** — 客服悬浮窗（微信 / QQ / 电话 / 二维码）、公告弹窗、租赁协议，均可后台配置。

### 面向店主
- **商品管理** — 新增、编辑、上下架、置顶、高亮，实时查看在售与待审数量。
- **审核管理** — 待上架申请一键通过 / 拒绝，支持编辑后再通过。
- **字段自定义** — 自由增删商品字段，设置名称、卡片标签、说明文字、类型（文本 / 多行 / 下拉 / 多选 / 体验卡）与选项；可控制是否前台展示、是否参与筛选、是否仅管理员可见、是否必填。卡片式编辑器支持拖拽排序、实时预览。
- **店铺配置** — 店名、联系方式、复制模板、后台入口路径等，设置页按分类分区，切换不迷路。

### 面向运维
- **零依赖** — 纯 Node.js 内置模块（http / fs / crypto / zlib），无需 `npm install`，无构建步骤。
- **本地备份** — JSON 文件原子写入防损坏，自动每日快照（保留 14 份），支持导出 / 恢复 / 从快照恢复。
- **WebDAV 异地备份** — 每次生成新备份自动上传到 WebDAV 网盘（坚果云 / Nextcloud / 群晖 NAS 等）；可查看远程版本列表、下载到本地、选择任意版本恢复（恢复前自动留快照）。密码仅存服务器，绝不下发浏览器。
- **安全加固** — 异步 scrypt 密码哈希、安全响应头、登录 / 提交限流、敏感字段过滤、富文本白名单清洗、强制首登改密。
- **运维脚本** — 附带 systemd 服务模板与交互式管理脚本 `shopctl`。

## 快速开始

需要 **Node.js 18 或更高版本**。

```bash
git clone https://github.com/MechanicF/game-account-rental-shop.git
cd game-account-rental-shop
node server.js
```

打开 <http://localhost:3000> 访问店铺。默认监听 `0.0.0.0:3000`，可用环境变量调整：

```bash
HOST=127.0.0.1 PORT=8080 node server.js
```

也可使用 `npm start`。首次启动任意访问一次后，会生成 `data/db.json` 与首份备份。

## 首次登录

1. 启动后查看终端日志，会打印随机生成的**后台入口路径**（形如 `/admin_xxxxxx`）。
2. 访问 `http://<服务器>:<端口>/<后台入口路径>`，页面底部也有「后台管理」入口。
3. 默认账号 `admin`，初始密码 `admin123`。

> **v1.1.0 起，首次用默认密码登录会强制引导修改密码。** 请立即修改并妥善保管后台入口路径——不要在仍使用默认密码时把服务暴露到公网。

## 目录结构

```
.
├── server.js            # 零依赖后端：API、鉴权、静态服务、备份、WebDAV 同步
├── public/
│   ├── index.html       # 页面骨架（前台 + 后台）
│   ├── app.js           # 核心逻辑：渲染、登录、商品/设置操作、Hook 机制
│   ├── adapt.js         # 扩展模块：字段编辑、筛选、表格视图、客服、公告、协议、WebDAV
│   └── style.css        # 样式（含明暗主题）
├── data/                # 运行数据（已 gitignore，不入库）
│   ├── db.json          # 数据库文件
│   └── backups/         # 自动快照（保留 14 份）
├── package.json         # 启动脚本与 Node 版本声明
├── shop.service         # systemd 服务模板
├── shopctl.sh           # 服务器管理脚本
└── 部署说明.md           # 完整生产部署指南
```

## 服务器部署

生产环境完整步骤（Nginx 反向代理 + HTTPS、防火墙、备份策略）见 **[部署说明.md](部署说明.md)**。

快速使用附带的管理脚本：

```bash
# 安装为全局命令
sudo cp shopctl.sh /usr/local/bin/shopctl && sudo chmod +x /usr/local/bin/shopctl

shopctl             # 交互菜单
shopctl install     # 安装 / 重新部署（保留现有数据）
shopctl port        # 修改端口
shopctl logs        # 实时日志（Ctrl+C 退出）
shopctl restart     # 重启服务
shopctl status      # 查看状态
shopctl uninstall   # 卸载（自动先备份数据）
```

> `shopctl install` 的安装源默认为 `/root/shop-deploy.tar.gz`，使用前请按实际情况调整脚本顶部变量，或直接用 `shop.service` 部署本仓库代码。

## 设计说明

- **数据层**：数据存于 `data/db.json`，写入采用「临时文件 + 原子重命名」，避免写一半损坏；损坏时自动另存为 `db.json.bak` 并重建。
- **价格合计**：由服务端 `calcTotalServer()` 统一计算，随数据一并下发，前端只负责显示，避免前后端算法漂移。
- **前端扩展**：`app.js` 提供统一 Hook 机制（`renderPrepare` / `renderList` / `renderPost` / `settings` 等阶段），`adapt.js` 的功能模块通过注册 Hook 介入，避免层层函数包裹导致的调用链断裂与重复渲染。
- **敏感字段**：`coinRate`（比例）、`deposit`（押金）及标记为 `adminOnly` / `show:false` 的字段，在服务端下发前台数据时即被剔除。
- **异地备份**：生成新备份后延迟异步上传 WebDAV，不阻塞请求；列目录用 PROPFIND、上传用 PUT、下载用 GET，均为标准 WebDAV 方法，零第三方依赖。

## 安全说明

- 密码使用异步 `scrypt` + 随机盐存储，校验用 `timingSafeEqual`，避免时序攻击。
- 全站统一安全响应头（CSP、nosniff、Referrer-Policy、Permissions-Policy）。
- 管理接口 `Cache-Control: no-store`，防止敏感数据被代理 / 浏览器缓存。
- 静态服务拒绝隐藏文件、数据目录访问与路径穿越；非 GET / HEAD 请求返回 405。
- 公告 / 协议等富文本经白名单清洗（基于 DOMParser），杜绝 XSS。
- 后台登录、自助上架均有限流；会话 HttpOnly + SameSite=Lax，HTTPS 下自动加 Secure。
- WebDAV 密码只加密保存在服务器，不下发浏览器；远程备份文件名有白名单校验，防路径穿越。

## 数据说明

仓库**不包含任何运行数据**——无商品记录、客户联系方式、管理员凭据或数据库备份。运行数据仅保存在本机 `data/db.json` 与 `data/backups/`，已加入 `.gitignore`。仓库中出现的账号密码示例均为默认值，请自行修改并妥善保管，迁移或备份时避免公开。

## 许可

未指定开源许可，仅供个人 / 内部使用。
