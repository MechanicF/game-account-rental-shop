# 游戏账号租赁店铺

一个零依赖的 Node.js 店铺管理服务，Node.js 18 或更高版本即可运行。

## 界面预览

以下截图来自本地全新启动的默认演示数据，不含真实店铺记录或联系方式。

### 店铺首页

![店铺首页：账号列表、筛选和卡片展示](docs/screenshots/storefront.png)

### 后台商品管理

![后台商品管理：商品状态与管理操作](docs/screenshots/admin-products.png)

### 自助上架申请

![自助上架表单：访客提交资料后由店主审核](docs/screenshots/self-service-form.png)

## 功能一览

- **访客浏览：** 搜索商品、按页面条件筛选、切换卡片或表格视图，并复制商品编号或详情。
- **自助上架：** 访客可提交账号资料和选填图片；申请先进入待审核列表，通过后才会展示。
- **商品管理：** 新增、编辑、上下架、置顶或高亮商品，并查看在售和待审核数量。
- **店铺配置：** 设置店名、联系方式、展示字段和筛选项，也可配置客服信息、公告及租赁须知。
- **本地数据：** 无需数据库服务；数据存放在本机 JSON 文件中，并支持备份与恢复。

## 快速开始

需要 **Node.js 18 或更高版本**。克隆仓库后直接运行：

```bash
git clone https://github.com/MechanicF/game-account-rental-shop.git
cd game-account-rental-shop
node server.js
```

打开 <http://localhost:3000> 访问店铺。默认监听 `0.0.0.0:3000`，可通过 `HOST` 和 `PORT` 调整监听地址及端口：

```bash
HOST=127.0.0.1 PORT=8080 node server.js
```

无需运行 `npm install`，也不需要单独的构建步骤。也可以用 `npm start`（需 Node 18+）。

## 首次登录与安全

首次启动时，服务端日志会打印后台入口路径。默认账号为 `admin`，初始密码为 `admin123`。**v1.1.0 起，首次用默认密码登录后系统会强制引导你修改密码。** 不要在仍使用默认密码或未完成安全配置时把服务直接暴露到公网；公网部署建议使用 HTTPS 反向代理和防火墙。服务器每日会保存本地自动快照；运行数据库和备份文件均已加入 `.gitignore`。

## 服务器部署

`部署说明.md` 包含完整的生产部署步骤（Nginx 反代 + HTTPS、防火墙、备份策略）。`shop.service` 是可直接使用的 systemd 单元模板；`shopctl.sh` 是一键管理脚本（安装/卸载/修改端口/查看日志/重启/状态）。

```bash
# 安装管理脚本
sudo cp shopctl.sh /usr/local/bin/shopctl && sudo chmod +x /usr/local/bin/shopctl

# 交互菜单
shopctl

# 或直接子命令
shopctl install      # 安装/重新部署
shopctl port         # 修改端口
shopctl logs         # 实时日志
shopctl status       # 查看状态
```

> 注意：`shopctl install` 的安装源默认为 `/root/shop-deploy.tar.gz`，请按你的实际路径调整脚本顶部变量。

## v1.1.0 变更

- **安全：** 密码哈希改为异步 scrypt（不再阻塞事件循环）；统一安全响应头（CSP/nosniff/Referrer-Policy/Permissions-Policy）；管理接口禁止缓存；静态服务拒绝隐藏文件与数据目录访问；公告/协议富文本改为白名单清洗；对外复制内容过滤管理员字段；首次登录强制改密。
- **架构：** 引入统一 Hook 机制替代前端层层函数包裹，消除 `renderFrontend` 重复渲染与调用链断裂风险。
- **一致性：** 价格合计由服务端唯一计算并下发，前后端不再重复实现算法。
- **工程：** 补齐 package.json、systemd 单元、管理脚本与部署说明。

## 数据说明

仓库不包含任何运行中的店铺数据、产品记录、客户联系方式、管理员凭据或数据库备份。运行数据只保存在本机的 `data/db.json` 和 `data/backups/` 中。请自行保护这些文件，并在迁移或备份时避免将其公开。
