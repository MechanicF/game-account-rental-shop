'use strict';
/* ============================================================
 * 游戏账号租赁店铺 - 后端服务（零依赖，仅需 Node.js 18+）
 * 启动：node server.js  （端口默认 3000，可用环境变量 PORT 修改）
 * 数据保存在 data/db.json，备份只需复制这个文件
 * ============================================================ */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};

/* ---------------- 数据层（JSON 文件） ---------------- */
function defaultDB() {
  // 首次启动内置一条示例商品（就是店主提供的那条数据），可登录后台删除
  return {
    products: [{
      id: '0001', name: '云边的兔', image: '', status: 'on', createdAt: Date.now(),
      fields: {
        level: '60', rank: '三角洲巅峰8', kd: '2.8/1', coins: '249M',
        armor: '6', helm: '10', aw: '146', stamina: '满', load: '满', insurance: '9格',
        skins: '水墨，黑狼，天际线，暗星，坠星者，北极星，重塑',
        region: 'V', pwd: '', rent: '', contactTime: '白天', realname: '是', phone: '',
      },
    }],
    pending: [],
    settings: { storeName: '游戏账号租赁', contact: '', copyTemplate: '编号：{id}（{name}）', nextId: 2 },
    admin: null, // null = 未修改过密码，默认账号 admin / 密码 admin123
  };
}

function writeDB(db) {
  const dir = path.dirname(DATA_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE); // 原子写入，避免写一半损坏
}

function genAdminPath() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = 'admin_';
  for (let i = 0; i < 6; i++) s += chars[crypto.randomInt(chars.length)];
  return s;
}
let db;
(function initDB() {
  if (!fs.existsSync(DATA_FILE)) {
    db = defaultDB();
    writeDB(db);
    console.log('[shop] 首次启动，已初始化数据文件:', DATA_FILE);
  } else {
    try {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      console.error('[shop] 数据文件损坏，已重建（旧文件保留为 db.json.bak）');
      try { fs.copyFileSync(DATA_FILE, DATA_FILE + '.bak'); } catch (e2) {}
      db = defaultDB();
      writeDB(db);
    }
  }
  if (!db.settings) db.settings = {};
  if (!db.settings.adminPath) {
    db.settings.adminPath = genAdminPath();
    writeDB(db);
    console.log('[shop] 已生成后台入口路径: /' + db.settings.adminPath);
  }
})();
function saveDB() { try { writeDB(db); } catch (e) { console.error('[shop] 保存数据失败:', e); } }

/* ---------------- 数据备份 ---------------- */
function backupDB(force) {
  try {
    const dir = path.join(__dirname, 'data', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const d = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    const stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    if (!force) {
      const daily = 'db-' + stamp + '.json';
      if (fs.existsSync(path.join(dir, daily))) return daily;
      fs.writeFileSync(path.join(dir, daily), fs.readFileSync(DATA_FILE));
      const files = fs.readdirSync(dir).filter((x) => x.startsWith('db-') && x.endsWith('.json')).sort();
      while (files.length > 14) { const old = files.shift(); try { fs.unlinkSync(path.join(dir, old)); } catch (e) {} }
      console.log('[shop] 每日自动备份:', daily);
      return daily;
    }
    const manual = 'db-manual-' + stamp + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.json';
    fs.writeFileSync(path.join(dir, manual), fs.readFileSync(DATA_FILE));
    console.log('[shop] 手动快照:', manual);
    return manual;
  } catch (e) { console.error('[shop] 备份失败:', e); return null; }
}
backupDB();
setInterval(() => { backupDB(); }, 3600 * 1000).unref();

/* ---------------- 会话与密码 ---------------- */
const sessions = new Map(); // token -> { exp }
const SESSION_TTL = 3 * 24 * 3600 * 1000; // 3 天

// [安全] 使用异步 scrypt，避免同步 KDF 阻塞事件循环（并发登录/恶意请求会卡死服务）
function hashPassword(pw, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(pw), salt, 64, (err, key) => err ? reject(err) : resolve(key));
  });
}
async function verifyAdmin(username, password) {
  if (!db.admin) {
    // 未改过密码：默认 admin / admin123
    return String(username || '').trim() === 'admin' && password === 'admin123';
  }
  if (String(username || '').trim() !== db.admin.username) return false;
  const h = await hashPassword(password, db.admin.salt);
  const stored = Buffer.from(db.admin.hash, 'hex');
  if (h.length !== stored.length) return false;
  return crypto.timingSafeEqual(h, stored);
}

/* ---------------- 工具 ---------------- */
function etagFor(buf) {
  return '"' + crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16) + '"';
}
function wantsGzip(req) {
  return /gzip/.test((req && req.headers && req.headers['accept-encoding']) || '');
}
// [安全] 统一安全响应头。CSP 允许内联脚本（首页注入 __BOOT / 主题脚本），故不用严格 CSP，
// 但通过 object-src / base-uri / frame-ancestors 等指令收敛攻击面。
function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'"
  };
}
function sendBuffer(res, req, buf, contentType, cacheControl, pre) {
  const etag = (pre && pre.etag) || etagFor(buf);
  if (req.method === 'GET' && req.headers['if-none-match'] === etag) {
    res.writeHead(304, Object.assign({ 'ETag': etag, 'Cache-Control': cacheControl }, securityHeaders()));
    return res.end();
  }
  const isText = /^(text\/|application\/(json|javascript))/.test(contentType);
  let out = buf;
  const headers = Object.assign({ 'Content-Type': contentType, 'ETag': etag, 'Cache-Control': cacheControl, 'Vary': 'Accept-Encoding' }, securityHeaders());
  if (isText && buf.length > 1024 && wantsGzip(req)) {
    if (pre && pre.gz) { out = pre.gz; }
    else { out = zlib.gzipSync(buf); if (pre) pre.gz = out; }
    headers['Content-Encoding'] = 'gzip';
  }
  headers['Content-Length'] = out.length;
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  res.end(out);
}
function sendJSON(res, req, status, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  const etag = etagFor(body);
  // [安全] 管理类/状态类 JSON 不进共享缓存，避免敏感数据被代理或浏览器缓存复用。
  const isPrivate = /^\/api\/admin\//.test((req && req.url) || '') || status >= 400;
  const cc = isPrivate ? 'no-store' : 'public, max-age=0, must-revalidate';
  if (req.method === 'GET' && req.headers['if-none-match'] === etag) {
    res.writeHead(304, Object.assign({ 'ETag': etag, 'Cache-Control': cc }, securityHeaders()));
    return res.end();
  }
  let out = body;
  const headers = Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'ETag': etag, 'Cache-Control': cc, 'Vary': 'Accept-Encoding' }, securityHeaders());
  if (body.length > 1024 && wantsGzip(req)) { out = zlib.gzipSync(body); headers['Content-Encoding'] = 'gzip'; }
  headers['Content-Length'] = out.length;
  res.writeHead(status, headers);
  res.end(out);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 8 * 1024 * 1024) { reject(new Error('请求过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function getCookies(req) {
  const out = {};
  const h = req.headers.cookie;
  if (!h) return out;
  h.split(';').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i > -1) out[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  });
  return out;
}
function isSecureReq(req) {
  return !!(req && ((req.socket && req.socket.encrypted) || req.headers['x-forwarded-proto'] === 'https'));
}
function setSession(res, token, req) {
  let c = 'shop_session=' + token + '; HttpOnly; Path=/; SameSite=Lax; Max-Age=' + (SESSION_TTL / 1000);
  if (isSecureReq(req)) c += '; Secure';
  res.setHeader('Set-Cookie', c);
}
function clearSession(res, req) {
  let c = 'shop_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
  if (isSecureReq(req)) c += '; Secure';
  res.setHeader('Set-Cookie', c);
}

/* 自助上架接口的简单限流：每 IP 10 分钟最多 10 次 */
const limits = new Map();
function limited(ip) {
  const now = Date.now();
  let e = limits.get(ip);
  if (!e || e.reset < now) e = { n: 0, reset: now + 10 * 60 * 1000 };
  e.n++;
  limits.set(ip, e);
  return e.n > 10;
}

/* 后台登录限流：每 IP + 账号，15 分钟最多 10 次失败 */
const loginAttempts = new Map();
function loginKey(ip, username) { return (ip || 'unknown') + '|' + String(username || '').trim().toLowerCase(); }
function isLoginBlocked(ip, username) {
  const e = loginAttempts.get(loginKey(ip, username));
  if (!e) return false;
  if (e.reset < Date.now()) { loginAttempts.delete(loginKey(ip, username)); return false; }
  return e.n >= 10;
}
function recordLoginFailure(ip, username) {
  const key = loginKey(ip, username);
  let e = loginAttempts.get(key);
  if (!e || e.reset < Date.now()) e = { n: 0, reset: Date.now() + 15 * 60 * 1000 };
  e.n++;
  loginAttempts.set(key, e);
}
function clearLoginAttempts(ip, username) { loginAttempts.delete(loginKey(ip, username)); }

/* 输入清理 */
function cleanStr(v, max) {
  return String(v === undefined || v === null ? '' : v).trim().slice(0, max);
}
function cleanFields(f) {
  const out = {};
  if (!f || typeof f !== 'object') return out;
  for (const k in f) {
    if (typeof f[k] !== 'string') continue;
    const v = f[k].trim();
    if (v) out[k] = v.slice(0, 500);
  }
  return out;
}
function cleanImage(s) {
  if (typeof s !== 'string') return '';
  if (!(s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://'))) return '';
  if (s.length > 2 * 1024 * 1024) return '';
  return s;
}

/* ---------------- 鉴权 ---------------- */
function authed(req) {
  const c = getCookies(req).shop_session;
  const s = c ? sessions.get(c) : null;
  if (!s || s.exp < Date.now()) return false;
  return true;
}
function authRoute(req, res, fn) {
  if (!authed(req)) return sendJSON(res, req, 401, { ok: false, msg: '未登录或登录已过期' });
  return fn();
}

/* ---------------- 接口 ---------------- */
function publicFieldHiddenKeys() {
  const pf = db.settings && Array.isArray(db.settings.productFields) ? db.settings.productFields : null;
  if (!pf) return null;
  const hidden = new Set();
  for (const fd of pf) { if (fd && (fd.adminOnly || fd.show === false)) hidden.add(fd.key); }
  return hidden;
}
function calcTotalServer(p) {
  const f = (p && p.fields) || {};
  const raw = String(f.coins || '').trim();
  if (!raw) return '';
  const c = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (isNaN(c) || c <= 0) return '';
  let wan;
  if (/亿/.test(raw)) wan = c * 10000;
  else if (/万/.test(raw)) wan = c * 1;
  else wan = c * 100;
  const ratioStr = String(f.coinRate || '').trim();
  if (!ratioStr) return '';
  let ratio = null;
  const m = ratioStr.match(/^\s*1?\s*[:：比]\s*(\d+(?:\.\d+)?)/);
  if (m) ratio = parseFloat(m[1]);
  else ratio = parseFloat(ratioStr.replace(/[^\d.]/g, ''));
  if (isNaN(ratio) || ratio <= 0) return '';
  let total = wan / ratio;
  const depStr = String(f.deposit || '').replace(/[^\d.]/g, '');
  if (depStr) { const d = parseFloat(depStr); if (!isNaN(d) && d > 0) total += d; }
  return '¥' + String(Math.round(total));
}
function publicProduct(p) {
  const hidden = publicFieldHiddenKeys();
  const fields = {};
  const src = p.fields || {};
  for (const k in src) {
    if (hidden) { if (hidden.has(k)) continue; }
    else if (k === 'coinRate' || k === 'deposit') continue;
    fields[k] = src[k];
  }
  return { id: p.id, name: p.name, fields, image: p.image || '', status: p.status, createdAt: p.createdAt, total: calcTotalServer(p), pinned: !!p.pinned, highlight: !!p.highlight };
}
function publicProducts() {
  return (db.products || []).filter((x) => x.status === 'on').map(publicProduct);
}
function cleanRestoredPending(list, fallback) {
  if (!Array.isArray(list)) return fallback || [];
  return list.filter((x) => x && typeof x === 'object' && x.id).slice(0, 500).map((x) => ({
    id: cleanStr(x.id, 40), name: cleanStr(x.name, 60), contact: cleanStr(x.contact, 100),
    fields: cleanFields(x.fields), image: cleanImage(x.image), createdAt: Number(x.createdAt) || Date.now(),
  }));
}
function cleanRestoredSettings(cur, inc) {
  if (!inc || typeof inc !== 'object') return cur;
  const out = Object.assign({}, cur);
  if (inc.storeName !== undefined) out.storeName = cleanStr(inc.storeName, 40) || '游戏账号租赁';
  if (inc.contact !== undefined) out.contact = cleanStr(inc.contact, 100);
  if (inc.copyTemplate !== undefined) out.copyTemplate = cleanStr(inc.copyTemplate, 80) || '编号：{id}（{name}）';
  if (inc.nextId !== undefined) { const n = parseInt(inc.nextId, 10); if (n && n >= 1) out.nextId = n; }
  if (inc.adminPath !== undefined) {
    const ap = cleanStr(inc.adminPath, 80).replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '').replace(/[^A-Za-z0-9_-]/g, '');
    if (ap.length >= 4 && !/^(api|index\.html)$/i.test(ap)) out.adminPath = ap;
  }
  if (inc.filters !== undefined) {
    out.filters = Array.isArray(inc.filters) ? inc.filters.slice(0, 20).map(function(g){ return { id: cleanStr(g && g.id, 40), label: cleanStr(g && g.label, 20), field: cleanStr(g && g.field, 20), auto: !!(g && g.auto), multi: !!(g && g.multi), options: Array.isArray(g && g.options) ? g.options.slice(0, 50).map(function(o){ return cleanStr(o, 40); }).filter(function(o){ return o; }) : [] }; }) : [];
  }
  if (inc.productFields !== undefined) {
    out.productFields = Array.isArray(inc.productFields) ? inc.productFields.slice(0, 40).map(function(fd){ return { key: cleanStr(fd && fd.key, 40), label: cleanStr(fd && fd.label, 30), short: cleanStr(fd && fd.short, 30), note: cleanStr(fd && fd.note, 100), type: (fd && (fd.type === 'select' || fd.type === 'textarea' || fd.type === 'multi' || fd.type === 'expcard')) ? fd.type : 'text', options: Array.isArray(fd && fd.options) ? fd.options.slice(0, 50).map(function(o){ return cleanStr(o, 40); }) : [], adminOnly: !!(fd && fd.adminOnly), filter: !!(fd && fd.filter), show: !!(fd && fd.show), required: !!(fd && fd.required), frozen: !!(fd && fd.frozen) }; }) : [];
  }
  if (inc.cs !== undefined) {
    const cs = (inc.cs && typeof inc.cs === 'object') ? inc.cs : {};
    out.cs = { enabled: cs.enabled !== false, wechat: cleanStr(cs.wechat, 100), qq: cleanStr(cs.qq, 100), phone: cleanStr(cs.phone, 100), hours: cleanStr(cs.hours, 100), note: cleanStr(cs.note, 500), qrImage: cleanImage(cs.qrImage) };
  }
  if (inc.popup !== undefined) {
    const pop = (inc.popup && typeof inc.popup === 'object') ? inc.popup : {};
    out.popup = { enabled: pop.enabled !== false, content: cleanStr(pop.content, 4000) };
  }
  if (inc.agreement !== undefined) {
    const agr = (inc.agreement && typeof inc.agreement === 'object') ? inc.agreement : {};
    out.agreement = { enabled: agr.enabled !== false, title: cleanStr(agr.title, 50), content: cleanStr(agr.content, 4000) };
  }
  if (!out.adminPath) out.adminPath = genAdminPath();
  return out;
}
function publicSettings() {
  const s = db.settings || {};
  return { storeName: s.storeName || '游戏账号租赁', contact: s.contact || '', copyTemplate: s.copyTemplate || '编号：{id}（{name}）', filters: Array.isArray(s.filters) ? s.filters : null, productFields: Array.isArray(s.productFields) ? s.productFields : null, cs: (s.cs && typeof s.cs === 'object') ? s.cs : null, popup: (s.popup && typeof s.popup === 'object') ? s.popup : null, agreement: (s.agreement && typeof s.agreement === 'object') ? s.agreement : null };
}
function statePayload() {
  // [安全] mustChangePassword 用于前端强制引导首次修改默认密码（admin/admin123）
  // [重构] total 统一由服务端 calcTotalServer 计算，前端只消费，不再重复实现价格算法
  var products = (db.products || []).map(function(p){
    return Object.assign({}, p, { total: calcTotalServer(p) });
  });
  return { ok: true, mustChangePassword: !db.admin, settings: db.settings || {}, products: products, pending: db.pending || [] };
}
function padId(n) { return String(n).padStart(4, '0'); }
function nextProductId() {
  const s = db.settings || {};
  let n = parseInt(s.nextId, 10); if (!n || n < 1) n = 1;
  let id = padId(n);
  while ((db.products || []).some((p) => p.id === id)) { n++; id = padId(n); }
  s.nextId = n + 1;
  return id;
}

async function apiRoute(req, res, u, p) {
  const method = req.method || 'GET';

  if (method === 'GET' && p === '/api/health') return sendJSON(res, req, 200, { ok: true });
  if (method === 'GET' && p === '/api/store') {
    return sendJSON(res, req, 200, {
      ok: true,
      settings: publicSettings(),
      products: publicProducts(),
    });
  }

  if (method === 'POST' && p === '/api/apply') {
    const ip = req.socket.remoteAddress || 'unknown';
    if (limited(ip)) return sendJSON(res, req, 429, { ok: false, msg: '提交太频繁，请稍后再试' });
    let b;
    try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '请求格式错误' }); }
    const name = cleanStr(b.name, 60);
    const contact = cleanStr(b.contact, 100);
    if (!name) return sendJSON(res, req, 400, { ok: false, msg: '请填写游戏昵称' });
    if (!contact) return sendJSON(res, req, 400, { ok: false, msg: '请填写联系方式' });
    db.pending = db.pending || [];
    db.pending.unshift({
      id: crypto.randomBytes(6).toString('hex'),
      name, contact,
      fields: cleanFields(b.fields),
      image: cleanImage(b.image),
      createdAt: Date.now(),
    });
    saveDB();
    console.log('[shop] 收到自助上架申请:', name, '来自', ip);
    return sendJSON(res, req, 200, { ok: true, msg: '申请已提交，店主审核通过后展示' });
  }

  if (method === 'POST' && p === '/api/admin/login') {
    let b;
    try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '请求格式错误' }); }
    const loginIp = req.socket.remoteAddress || 'unknown';
    if (isLoginBlocked(loginIp, b.username)) {
      return sendJSON(res, req, 429, { ok: false, msg: '登录尝试过多，请 15 分钟后再试' });
    }
    if (!await verifyAdmin(b.username, b.password)) {
      recordLoginFailure(loginIp, b.username);
      return sendJSON(res, req, 401, { ok: false, msg: '账号或密码错误' });
    }
    clearLoginAttempts(loginIp, b.username);
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { exp: Date.now() + SESSION_TTL });
    setSession(res, token, req);
    console.log('[shop] 管理员登录成功');
    return sendJSON(res, req, 200, statePayload());
  }

  if (method === 'POST' && p === '/api/admin/logout') {
    const c = getCookies(req).shop_session;
    if (c) sessions.delete(c);
    clearSession(res, req);
    return sendJSON(res, req, 200, { ok: true });
  }

  if (method === 'GET' && p === '/api/admin/state') {
    return authRoute(req, res, () => sendJSON(res, req, 200, statePayload()));
  }

  if (method === 'PUT' && p === '/api/admin/settings') {
    return authRoute(req, res, async () => {
      let b;
      try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '请求格式错误' }); }
      db.settings = db.settings || {};
      if (b.adminPath !== undefined) {
        let ap = cleanStr(b.adminPath, 80).replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '').replace(/[^A-Za-z0-9_-]/g, '');
        if (ap.length < 4) return sendJSON(res, req, 400, { ok: false, msg: '后台入口路径至少 4 位（字母/数字/_/-）' });
        if (/^(api|index\.html)$/i.test(ap)) return sendJSON(res, req, 400, { ok: false, msg: '该路径不可用，请换一个' });
        db.settings.adminPath = ap;
      }
      if (b.storeName !== undefined) db.settings.storeName = cleanStr(b.storeName, 40) || '游戏账号租赁';
      if (b.contact !== undefined) db.settings.contact = cleanStr(b.contact, 100);
      if (b.copyTemplate !== undefined) db.settings.copyTemplate = cleanStr(b.copyTemplate, 80) || '编号：{id}（{name}）';
      if (b.filters !== undefined) {
        db.settings.filters = Array.isArray(b.filters) ? b.filters.slice(0, 20).map(function(g){ return { id: cleanStr(g && g.id, 40), label: cleanStr(g && g.label, 20), field: cleanStr(g && g.field, 20), auto: !!(g && g.auto), multi: !!(g && g.multi), options: Array.isArray(g && g.options) ? g.options.slice(0, 50).map(function(o){ return cleanStr(o, 40); }).filter(function(o){ return o; }) : [] }; }) : [];
      }
      if (b.productFields !== undefined) {
        db.settings.productFields = Array.isArray(b.productFields) ? b.productFields.slice(0, 40).map(function(fd){ return { key: cleanStr(fd && fd.key, 40), label: cleanStr(fd && fd.label, 30), short: cleanStr(fd && fd.short, 30), note: cleanStr(fd && fd.note, 100), type: (fd && (fd.type === 'select' || fd.type === 'textarea' || fd.type === 'multi' || fd.type === 'expcard')) ? fd.type : 'text', options: Array.isArray(fd && fd.options) ? fd.options.slice(0, 50).map(function(o){ return cleanStr(o, 40); }) : [], adminOnly: !!(fd && fd.adminOnly), filter: !!(fd && fd.filter), show: !!(fd && fd.show), required: !!(fd && fd.required), frozen: !!(fd && fd.frozen) }; }) : [];
      }
      if (b.cs !== undefined) {
        var cs = (b.cs && typeof b.cs === 'object') ? b.cs : {};
        db.settings.cs = {
          enabled: cs.enabled !== false,
          wechat: cleanStr(cs.wechat, 100),
          qq: cleanStr(cs.qq, 100),
          phone: cleanStr(cs.phone, 100),
          hours: cleanStr(cs.hours, 100),
          note: cleanStr(cs.note, 500),
          qrImage: cleanImage(cs.qrImage)
        };
      }
      if (b.popup !== undefined) {
        var pop = (b.popup && typeof b.popup === 'object') ? b.popup : {};
        db.settings.popup = {
          enabled: pop.enabled !== false,
          content: cleanStr(pop.content, 4000)
        };
      }
      if (b.agreement !== undefined) {
        var agr = (b.agreement && typeof b.agreement === 'object') ? b.agreement : {};
        db.settings.agreement = {
          enabled: agr.enabled !== false,
          title: cleanStr(agr.title, 50),
          content: cleanStr(agr.content, 4000)
        };
      }
      saveDB();
      return sendJSON(res, req, 200, { ok: true });
    });
  }

  if (method === 'POST' && p === '/api/admin/password') {
    return authRoute(req, res, async () => {
      let b;
      try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '请求格式错误' }); }
      const oldP = String(b.old || '');
      const newP = String(b.new || '');
      const curOk = db.admin
        ? await (async () => { const h = await hashPassword(oldP, db.admin.salt); const st = Buffer.from(db.admin.hash, 'hex'); return h.length === st.length && crypto.timingSafeEqual(h, st); })()
        : (oldP === 'admin123');
      if (!curOk) return sendJSON(res, req, 400, { ok: false, msg: '原密码错误' });
      if (newP.length < 8) return sendJSON(res, req, 400, { ok: false, msg: '新密码至少 8 位' });
      const curUser = db.admin ? db.admin.username : 'admin';
      let newUser = curUser;
      if (b.username !== undefined && String(b.username).trim() !== '') {
        newUser = cleanStr(b.username, 40);
        if (newUser.length < 2) return sendJSON(res, req, 400, { ok: false, msg: '用户名至少 2 个字符' });
        if (/\s/.test(newUser)) return sendJSON(res, req, 400, { ok: false, msg: '用户名不能包含空格' });
      }
      const salt = crypto.randomBytes(16).toString('hex');
      db.admin = { username: newUser, salt, hash: (await hashPassword(newP, salt)).toString('hex') };
      saveDB();
      // 让其他设备上的会话失效，本会话保持登录
      const cur = getCookies(req).shop_session;
      for (const k of sessions.keys()) { if (k !== cur) sessions.delete(k); }
      return sendJSON(res, req, 200, { ok: true, msg: '密码修改成功' });
    });
  }

  if (method === 'POST' && p === '/api/admin/products') {
    return authRoute(req, res, async () => {
      let b;
      try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '请求格式错误' }); }
      const name = cleanStr(b.name, 60);
      if (!name) return sendJSON(res, req, 400, { ok: false, msg: '请填写游戏昵称' });
      const prod = {
        id: nextProductId(), name,
        fields: cleanFields(b.fields),
        image: cleanImage(b.image),
        status: b.status === 'off' ? 'off' : 'on',
        createdAt: Date.now(),
        pinned: !!b.pinned,
        highlight: !!b.highlight,
      };
      db.products = db.products || [];
      db.products.unshift(prod);
      saveDB();
      return sendJSON(res, req, 200, { ok: true, id: prod.id });
    });
  }

  let m = p.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (method === 'PUT') {
      return authRoute(req, res, async () => {
        const prod = (db.products || []).find((x) => x.id === id);
        if (!prod) return sendJSON(res, req, 404, { ok: false, msg: '商品不存在' });
        let b;
        try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '请求格式错误' }); }
        if (b.name !== undefined) {
          const name = cleanStr(b.name, 60);
          if (!name) return sendJSON(res, req, 400, { ok: false, msg: '请填写游戏昵称' });
          prod.name = name;
        }
        if (b.fields !== undefined) prod.fields = cleanFields(b.fields);
        if (b.image !== undefined) prod.image = cleanImage(b.image);
        if (b.status !== undefined) prod.status = b.status === 'off' ? 'off' : 'on';
        if (b.pinned !== undefined) prod.pinned = !!b.pinned;
        if (b.highlight !== undefined) prod.highlight = !!b.highlight;
        saveDB();
        return sendJSON(res, req, 200, { ok: true });
      });
    }
    if (method === 'DELETE') {
      return authRoute(req, res, () => {
        db.products = (db.products || []).filter((x) => x.id !== id);
        saveDB();
        return sendJSON(res, req, 200, { ok: true });
      });
    }
  }

  m = p.match(/^\/api\/admin\/pending\/([^/]+)$/);
  if (m && method === 'PUT') {
    const id = decodeURIComponent(m[1]);
    return authRoute(req, res, async () => {
      const it = (db.pending || []).find((x) => x.id === id);
      if (!it) return sendJSON(res, req, 404, { ok: false, msg: '申请不存在' });
      let b;
      try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '请求格式错误' }); }
      if (b.name !== undefined) {
        const name = cleanStr(b.name, 60);
        if (!name) return sendJSON(res, req, 400, { ok: false, msg: '请填写游戏昵称' });
        it.name = name;
      }
      if (b.fields !== undefined) it.fields = cleanFields(b.fields);
      if (b.image !== undefined) it.image = cleanImage(b.image);
      if (b.contact !== undefined) it.contact = cleanStr(b.contact, 100);
      saveDB();
      console.log('[shop] 已编辑待审核申请:', it.name);
      return sendJSON(res, req, 200, { ok: true });
    });
  }

  m = p.match(/^\/api\/admin\/pending\/([^/]+)\/(approve|reject)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    const action = m[2];
    return authRoute(req, res, () => {
      db.pending = db.pending || [];
      const idx = db.pending.findIndex((x) => x.id === id);
      if (idx < 0) return sendJSON(res, req, 404, { ok: false, msg: '申请不存在' });
      const it = db.pending[idx];
      if (action === 'approve') {
        const prod = {
          id: nextProductId(), name: it.name, fields: it.fields || {},
          image: it.image || '', status: 'on', createdAt: Date.now(),
        };
        db.products = db.products || [];
        db.products.unshift(prod);
        console.log('[shop] 审核通过并上架:', it.name, '编号', prod.id);
      }
      db.pending.splice(idx, 1);
      saveDB();
      return sendJSON(res, req, 200, { ok: true });
    });
  }

  if (method === 'GET' && p === '/api/admin/backup') {
    return authRoute(req, res, () => {
      const payload = { ok: true, app: 'shop', exportedAt: new Date().toISOString(), settings: db.settings || {}, products: db.products || [], pending: db.pending || [] };
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="shop-backup.json"' });
      res.end(JSON.stringify(payload, null, 2));
    });
  }

  if (method === 'POST' && p === '/api/admin/restore') {
    return authRoute(req, res, async () => {
      let b;
      try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, req, 400, { ok: false, msg: '备份文件格式错误' }); }
      if (!b || typeof b !== 'object' || !Array.isArray(b.products)) return sendJSON(res, req, 400, { ok: false, msg: '备份文件缺少商品数据' });
      backupDB(true);
      const prods = [];
      for (const x of b.products) {
        if (!x || typeof x !== 'object' || !x.id || !x.name) continue;
        prods.push({ id: cleanStr(x.id, 40), name: cleanStr(x.name, 60), fields: cleanFields(x.fields), image: cleanImage(x.image), status: x.status === 'off' ? 'off' : 'on', createdAt: Number(x.createdAt) || Date.now(), pinned: !!x.pinned, highlight: !!x.highlight });
        if (prods.length >= 3000) break;
      }
      db.products = prods;
      db.settings = cleanRestoredSettings(db.settings || {}, b.settings);
      db.pending = cleanRestoredPending(b.pending, db.pending);
      if (!db.settings.adminPath) db.settings.adminPath = genAdminPath();
      saveDB();
      console.log('[shop] 已从备份恢复数据');
      return sendJSON(res, req, 200, { ok: true, msg: '数据已恢复' });
    });
  }

  if (method === 'GET' && p === '/api/admin/backups') {
    return authRoute(req, res, () => {
      const dir = path.join(__dirname, 'data', 'backups');
      let files = [];
      try {
        files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
          let st = null;
          try { st = fs.statSync(path.join(dir, f)); } catch (e) {}
          return { name: f, size: st ? st.size : 0, mtime: st ? st.mtime.getTime() : 0 };
        }).sort((a, b) => b.mtime - a.mtime);
      } catch (e) {}
      return sendJSON(res, req, 200, { ok: true, files });
    });
  }

  const mb = p.match(/^\/api\/admin\/backups\/([^/]+)$/);
  if (mb) {
    const name = decodeURIComponent(mb[1]);
    if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) return sendJSON(res, req, 400, { ok: false, msg: '文件名不合法' });
    return authRoute(req, res, () => {
      const fp = path.join(__dirname, 'data', 'backups', name);
      if (method === 'DELETE') {
        try { fs.unlinkSync(fp); console.log('[shop] 已删除备份:', name); return sendJSON(res, req, 200, { ok: true }); }
        catch (e) { return sendJSON(res, req, 404, { ok: false, msg: '备份不存在' }); }
      }
      if (method === 'POST') {
        let b;
        try { b = JSON.parse(fs.readFileSync(fp, 'utf8')); }
        catch (e) { return sendJSON(res, req, 404, { ok: false, msg: '备份不存在或已损坏' }); }
        if (!b || typeof b !== 'object' || !Array.isArray(b.products)) return sendJSON(res, req, 400, { ok: false, msg: '备份文件数据不完整' });
        backupDB(true);
        const prods = [];
        for (const x of b.products) {
          if (!x || typeof x !== 'object' || !x.id || !x.name) continue;
          prods.push({ id: cleanStr(x.id, 40), name: cleanStr(x.name, 60), fields: cleanFields(x.fields), image: cleanImage(x.image), status: x.status === 'off' ? 'off' : 'on', createdAt: Number(x.createdAt) || Date.now(), pinned: !!x.pinned, highlight: !!x.highlight });
          if (prods.length >= 3000) break;
        }
        db.products = prods;
        db.settings = cleanRestoredSettings(db.settings || {}, b.settings);
        db.pending = cleanRestoredPending(b.pending, db.pending);
        if (!db.settings.adminPath) db.settings.adminPath = genAdminPath();
        saveDB();
        console.log('[shop] 已从本地备份恢复:', name);
        return sendJSON(res, req, 200, { ok: true, msg: '数据已恢复' });
      }
      return sendJSON(res, req, 405, { ok: false, msg: '不支持该方法' });
    });
  }

  return sendJSON(res, req, 404, { ok: false, msg: '接口不存在' });
}

function serveAdminEntry(res) {
  fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('文件不存在'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    const html = injectBoot(buf)
      .replace('<head>', '<head><style id="amCss">body.admin-mode .site-header,body.admin-mode main.container,body.admin-mode .site-footer{display:none!important}body.admin-mode #adminLoginView{display:flex!important}</style>')
      .replace('<body>', '<body class="admin-mode">');
    res.end(html);
  });
}

function escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function injectBoot(buf) {
  const pub = publicSettings();
  const payload = JSON.stringify({
    settings: pub,
    products: publicProducts().map((p) => ({ id: p.id, name: p.name, fields: p.fields, status: p.status, total: p.total, pinned: p.pinned, highlight: p.highlight })),
  }).replace(/</g, '\\u003c');
  let html = buf.toString('utf8').replace('<head>', '<head><script>window.__BOOT=' + payload + ';</script>');
  const nm = escHtml(pub.storeName || '游戏账号租赁');
  html = html.split('>游戏账号租赁<').join('>' + nm + '<');
  return html;
}

/* ---------------- 静态文件 ---------------- */
const staticCache = new Map(); // full path -> { buf, etag, gz, mtimeMs, size }
function getStaticFile(full) {
  let st;
  try { st = fs.statSync(full); } catch (e) { return null; }
  const cached = staticCache.get(full);
  if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size) return cached;
  const buf = fs.readFileSync(full);
  const entry = { buf, etag: etagFor(buf), gz: null, mtimeMs: st.mtimeMs, size: st.size };
  staticCache.set(full, entry);
  return entry;
}
function serveStatic(req, res, p) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJSON(res, req, 405, { ok: false, msg: '不支持该方法' });
  }
  const rel = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
  // [安全] 纵深防御：拒绝空字节、以点开头的隐藏文件、以及任何路径穿越尝试。
  // 数据/备份目录位于 shop/data（PUBLIC_DIR 之外），下面的前缀校验已能挡住；这里再显式拒绝敏感路径。
  if (rel.indexOf('\0') !== -1 || /(^|\/)\./.test(rel) || /(^|\/)(data|backups)(\/|$)/i.test(rel)) {
    return sendJSON(res, req, 403, { ok: false, msg: '禁止访问' });
  }
  const full = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!full.startsWith(PUBLIC_DIR + path.sep)) {
    return sendJSON(res, req, 403, { ok: false, msg: '禁止访问' });
  }
  const entry = getStaticFile(full);
  if (!entry) return sendJSON(res, req, 404, { ok: false, msg: '文件不存在' });
  const ext = path.extname(full).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  if (ext === '.html') {
    // 首页是动态注入商品数据的，不做长缓存，但支持 ETag 304，重复访问不重复传数据
    const html = injectBoot(entry.buf);
    return sendBuffer(res, req, Buffer.from(html, 'utf8'), contentType, 'public, max-age=0, must-revalidate');
  }
  return sendBuffer(res, req, entry.buf, contentType, 'public, max-age=0, must-revalidate', entry);
}

/* ---------------- 主服务 ---------------- */
const server = http.createServer((req, res) => {
  let u, p;
  try {
    u = new URL(req.url, 'http://localhost');
    p = decodeURIComponent(u.pathname);
  } catch (e) {
    return sendJSON(res, req, 400, { ok: false, msg: '请求地址错误' });
  }
  Promise.resolve()
    .then(() => {
      if (p.startsWith('/api/')) return apiRoute(req, res, u, p);
      const ap = db.settings && db.settings.adminPath;
      if (ap && p === '/' + ap) return serveAdminEntry(res);
      return serveStatic(req, res, p);
    })
    .catch((e) => {
      console.error('[shop] 请求处理出错:', e);
      try { sendJSON(res, req, 500, { ok: false, msg: '服务器内部错误' }); } catch (e2) {}
    });
});

server.listen(PORT, HOST, () => {
  console.log('==============================================');
  console.log('  🎮 游戏账号租赁店铺已启动');
  console.log('  前台访问:  http://服务器IP:' + PORT + '/');
  console.log('  后台入口:  http://服务器IP:' + PORT + '/' + ((db.settings && db.settings.adminPath) || ''));
  console.log('  后台登录:  页面底部「后台管理」（默认 admin / admin123）');
  console.log('  数据文件:  ' + DATA_FILE + ' （备份复制它即可）');
  console.log('==============================================');
});

/* 定期清理过期会话 */
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) { if (v.exp < now) sessions.delete(k); }
}, 3600 * 1000).unref();
