
'use strict';
/* ======================= 基础工具 ======================= */
var $ = function(id){ return document.getElementById(id); };
var store = { settings: {}, products: [], pending: [] };
var ADMIN_MODE = document.body.className.indexOf('admin-mode') > -1;

/* ===== 统一扩展钩子（替代原 adapt.js 的层层函数包裹） =====
 * 各适配模块通过 addHook 注册，核心函数按固定阶段调用，杜绝包装链断裂与重复渲染。 */
var HOOKS = { renderPrepare: [], renderList: [], renderPost: [], settings: [], formOpen: [], applyReset: [] };
function addHook(name, fn){ if(!HOOKS[name]) HOOKS[name]=[]; HOOKS[name].push(fn); }
function runHooks(name, a, b){
  (HOOKS[name]||[]).forEach(function(fn){ try{ fn(a,b); }catch(e){ console.error('[hook '+name+']',e); } });
}

function esc(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

async function api(path, opts){
  var o=opts||{};
  o.headers=Object.assign({'Content-Type':'application/json'}, o.headers||{});
  var res;
  try{ res=await fetch(path, o); }
  catch(e){ throw new Error('网络连接失败，请刷新重试'); }
  var data=null;
  try{ data=await res.json(); }catch(e){}
  if(!res.ok) throw new Error((data&&data.msg)||('请求失败（'+res.status+'）'));
  return data;
}

var toastTimer=null;
function toast(msg){
  var t=$('toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){ t.classList.remove('show'); }, 2400);
}

function copyText(text, okMsg){
  var done=function(){ toast(okMsg||('已复制：'+text)); };
  var fallback=function(){
    var ta=document.createElement('textarea');
    ta.value=text; ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }catch(e){ toast('复制失败，请手动长按复制'); }
    ta.remove();
  };
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else { fallback(); }
}

/* ======================= 商品字段定义 ======================= */
var FIELDS = [
  { key:'level',       label:'账号等级',           short:'等级',        placeholder:'如：60' },
  { key:'rank',        label:'游戏段位',           short:'段位',        placeholder:'如：三角洲巅峰8' },
  { key:'kd',          label:'机密/绝密KD',        short:'机密/绝密KD', placeholder:'如：2.8/1' },
  { key:'coins',       label:'哈夫币量',           short:'哈夫币',      placeholder:'如：249M' },
  { key:'coinRate',    label:'哈夫币比例',         short:'哈夫币比例',  adminOnly:true, placeholder:'如：1:100' },
  { key:'armor',       label:'六甲数量',           short:'六甲',        note:'另结2元/件，不填默认无', placeholder:'如：6' },
  { key:'helm',        label:'六头数量',           short:'六头',        note:'另结1元/件，不填默认无', placeholder:'如：10' },
  { key:'aw',          label:'aw子弹数量',         short:'aw子弹',      note:'另结0.8元/发，不填默认无', placeholder:'如：146' },
  { key:'stamina',     label:'体力等级',           short:'体力',        placeholder:'如：满' },
  { key:'load',        label:'负重等级',           short:'负重',        placeholder:'如：满' },
  { key:'insurance',   label:'保险',               short:'保险',        note:'体验卡标明格数+几天+几张', placeholder:'如：9格' },
  { key:'skins',       label:'红皮或刀皮',         short:'红皮/刀皮',   wide:true, textarea:true, placeholder:'多个皮肤用逗号分隔，如：水墨，黑狼，天际线' },
  { key:'region',      label:'大区(Q/V)',          short:'大区',        select:['Q','V'] },
  { key:'pwd',         label:'是否支持账密',       short:'支持账密',    note:'V区不用填', select:['','是','否'] },
  { key:'rent',        label:'租期',               short:'租期',        placeholder:'如：日租 / 周租 / 月租' },
  { key:'deposit',     label:'押金',               short:'押金',        adminOnly:true, placeholder:'如：50元' },
  { key:'contactTime', label:'可以联系到的时间段', short:'联系时间段',  placeholder:'如：白天' },
  { key:'realname',    label:'是否为本人实名',     short:'本人实名',    select:['是','否'] },
  { key:'phone',       label:'联系电话',           short:'联系电话',    placeholder:'选填，默认仅后台可见' }
];
function fullLabel(fd){ return fd.label + (fd.note ? '（'+fd.note+'）' : ''); }

/* ======================= 前台渲染 ======================= */
function cardHTML(p){
  var f=p.fields||{};
  var img=p.image
    ? '<img src="'+esc(p.image)+'" alt="'+esc(p.name)+'" loading="lazy">'
    : '<div class="img-ph"><span>🎮</span></div>';
  var rows='';
  FIELDS.forEach(function(fd){
    if(fd.adminOnly || fd.show===false) return;
    var v=f[fd.key];
    if(v===undefined||v===null||String(v).trim()==='') return;
    rows += '<div class="fld'+(fd.wide?' wide':'')+(fd.key==='skins'?' skins':'')+'" title="'+esc(fullLabel(fd))+'">'
      + '<span class="fld-k">'+esc(fd.short)+'</span>'
      + '<span class="fld-v">'+esc(v)+(fd.note?'<i class="fld-note">'+esc(fd.note)+'</i>':'')+'</span>'
      + '</div>';
  });
  return '<article class="card">'
    + '<div class="card-media">'+img
    +   '<span class="badge-id">编号 '+esc(p.id)+'</span>'
    +   (f.region ? '<span class="badge-region">'+esc(f.region)+'区</span>' : '')
    + '</div>'
    + '<div class="card-body">'
    +   '<div class="card-top">'
    +     '<div class="card-name"><span class="nm">'+esc(p.name)+'</span>'+(f.level?'<span class="lv-chip">Lv.'+esc(f.level)+'</span>':'')+'</div>'
    +   '</div>'
    +   '<div class="card-fields">'+rows+'</div>'
    +   '<div class="card-btns">'
    +     '<button type="button" class="btn btn-primary" onclick="copyId(\''+p.id+'\')">📋 复制编号</button>'
    +     '<button type="button" class="btn btn-ghost" onclick="copyAll(\''+p.id+'\')">📄 复制全部信息</button>'
    +   '</div>'
    + '</div>'
    + '</article>';
}

function findProduct(id){ return store.products.find(function(p){ return p.id===id; }); }

function maskName(name){
  var s=String(name===undefined||name===null?'':name).trim();
  if(s.length<=1){ return s; }
  if(s.length===2){ return s.charAt(0)+'*'; }
  var mid='';
  for(var i=0;i<s.length-2;i++){ mid+='*'; }
  return s.charAt(0)+mid+s.charAt(s.length-1);
}
function copyId(id){
  var p=findProduct(id); if(!p) return;
  var tpl=store.settings.copyTemplate||'编号：{id}（{name}）';
  copyText(tpl.split('{id}').join(p.id).split('{name}').join(maskName(p.name)), '编号已复制，快去发给店主吧 ✅');
}
function copyAll(id){
  var p=findProduct(id); if(!p) return;
  var f=p.fields||{}, lines=[];
  lines.push('【游戏账号信息】');
  lines.push('编号：'+p.id);
  lines.push('游戏昵称：'+maskName(p.name));
  FIELDS.forEach(function(fd){
    // [安全] 与卡片渲染保持一致：show===false 或 adminOnly 的字段都不进入对外复制内容
    if(fd.show === false || fd.adminOnly){ return; }
    var v=f[fd.key];
    if(v!==undefined&&v!==null&&String(v).trim()!=='') lines.push(fullLabel(fd)+'：'+v);
  });
  if(store.settings.contact) lines.push('店主联系方式：'+store.settings.contact);
  copyText(lines.join('\n'), '全部信息已复制 ✅');
}

function renderFrontend(){
  // 阶段1：各适配模块准备（字段映射、列配置、筛选面板重建等），一次完成
  runHooks('renderPrepare');
  var name=store.settings.storeName||'游戏账号租赁';
  document.title=name;
  var hd=$('headerStore'); if(hd) hd.textContent=name;
  var ht=$('heroTitle'); if(ht) ht.textContent=name;
  var all=store.products.filter(function(p){ return p.status==='on'; });
  // 阶段2：让筛选模块覆盖列表（返回数组则采用），实现搜索 + 多选筛选一次到位
  var list=all;
  var filtered=runHooksReturnFirst('renderList', all);
  if(filtered) list=filtered;
  var hs=$('heroStats'); if(hs) hs.innerHTML='🔥 在售 <b>'+all.length+'</b> 个账号';
  window.__filteredList=list;
  var grid=$('productGrid'); if(grid) grid.innerHTML=list.map(cardHTML).join('');
  var es=$('emptyState');
  if(es){
    es.hidden=list.length>0;
    var msg=$('emptyMsg');
    if(msg) msg.textContent = all.length ? '没有找到匹配的商品' : '店主暂未上架商品，请稍后再来看看～';
  }
  var c=store.settings.contact ? '📞 '+store.settings.contact : '';
  var hc=$('headerContact'); if(hc){ hc.textContent=c; hc.hidden=!store.settings.contact; }
  var fc=$('footerContact'); if(fc) fc.textContent=c;
  // 阶段3：渲染后处理（排序、表头、悬浮窗、公告、协议、加载更多等），只渲染一次 grid
  runHooks('renderPost', list);
}
// 取第一个返回数组的 hook 结果（用于列表筛选覆盖）
function runHooksReturnFirst(name, arg){
  var hs=HOOKS[name]||[];
  for(var i=0;i<hs.length;i++){
    try{ var r=hs[i](arg); if(Array.isArray(r)) return r; }catch(e){ console.error('[hook '+name+']',e); }
  }
  return null;
}

/* ======================= 登录 ======================= */
function openLogin(){
  var m=$('loginModal'); if(!m) return;
  m.hidden=false;
  var u=$('loginUser'); if(u){ var last='admin'; try{ last=localStorage.getItem('shop_admin_user')||'admin'; }catch(e){} u.value=last; }
  var p=$('loginPass'); if(p){ p.value=''; setTimeout(function(){ p.focus(); },50); }
}
function closeLogin(){ var m=$('loginModal'); if(m) m.hidden=true; }

async function doAdminLogin(){
  var u=($('aUser')||{}).value;
  var pw=($('aPass')||{}).value||'';
  var btn=$('aLoginBtn'); if(btn) btn.disabled=true;
  var h=$('aloginHint'); if(h) h.textContent='';
  try{
    var d=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:u,password:pw})});
    try{ localStorage.setItem('shop_admin_user', String(u||'').trim()); }catch(e){}
    applyState(d);
    showAdmin();
    toast('登录成功，欢迎回来 👋');
  }catch(e){ toast(e.message); if(h) h.textContent=e.message; }
  if(btn) btn.disabled=false;
}
async function doLogin(){
  var u=($('loginUser')||{}).value;
  var pw=($('loginPass')||{}).value||'';
  var btn=$('loginBtn'); if(btn) btn.disabled=true;
  try{
    var d=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:u,password:pw})});
    try{ sessionStorage.setItem('shop_login','1'); }catch(e){}
    try{ localStorage.setItem('shop_admin_user', String(u||'').trim()); }catch(e){}
    closeLogin();
    applyState(d);
    showAdmin();
    toast('登录成功，欢迎回来 👋');
  }catch(e){ toast(e.message); }
  if(btn) btn.disabled=false;
}
async function logout(){
  try{ await api('/api/admin/logout',{method:'POST'}); }catch(e){}
  try{ sessionStorage.removeItem('shop_login'); }catch(e){}
  hideAdmin(); toast('已退出登录');
}

/* ======================= 后台面板 ======================= */
function applyState(d){
  store.settings=d.settings||{};
  store.products=d.products||[];
  store.pending=d.pending||[];
  store.mustChangePassword=!!d.mustChangePassword;
  renderFrontend();
  renderAdmin();
}
async function refreshState(){
  var d=await api('/api/admin/state');
  applyState(d);
  if(!$('view-pending').hidden) renderPending();
}
function showAdmin(){
  var p=$('adminPanel'); if(!p) return;
  p.hidden=false; showView('list');
  var lv=$('adminLoginView'); if(lv){ lv.hidden=true; lv.style.setProperty('display','none','important'); }
  // [安全] 首次登录仍在使用默认密码时，强制引导到「修改密码」并提示
  if(store.mustChangePassword){
    showView('settings');
    if(typeof fillSettingsUI==='function') fillSettingsUI();
    var op=$('oldPass'); if(op) setTimeout(function(){ op.focus(); },80);
    toast('⚠️ 安全提示：请先修改默认密码（admin / admin123）');
  }
}
function hideAdmin(){ var p=$('adminPanel'); if(p) p.hidden=true; if(ADMIN_MODE){ var lv=$('adminLoginView'); if(lv){ lv.hidden=false; lv.style.removeProperty('display'); } } }
function showView(v){
  ['list','pending','form','settings'].forEach(function(name){
    var sec=$('view-'+name); if(sec) sec.hidden=(name!==v);
    var tab=$('tab-'+name); if(tab) tab.classList.toggle('active', name===v);
  });
}

function renderAdmin(){
  var prods=store.products;
  var on=prods.filter(function(p){ return p.status==='on'; }).length;
  var off=prods.length-on;
  var pend=store.pending.length;
  var st=$('adminStats');
  if(st) st.innerHTML=
    '<div class="stat-cards">'
    +'<div class="stat-card"><span class="stat-num">'+on+'</span><span class="stat-label">在售</span></div>'
    +'<div class="stat-card"><span class="stat-num">'+off+'</span><span class="stat-label">已下架</span></div>'
    +'<div class="stat-card"><span class="stat-num">'+pend+'</span><span class="stat-label">待审核</span></div>'
    +'<div class="stat-card"><span class="stat-num">'+prods.length+'</span><span class="stat-label">商品总数</span></div>'
    +'</div>';
  var pb=$('pendingBadge');
  if(pb){ pb.textContent=pend; pb.hidden=(pend===0); }
  var list=$('adminList'); if(!list) return;
  var aq=$('adminSearch'); var q=aq?String(aq.value||'').trim().toLowerCase():'';
  var shown=q ? prods.filter(function(p){ return String(JSON.stringify([p.id,p.name,p.fields])).toLowerCase().indexOf(q)>-1; }) : prods;
  if(!prods.length){
    list.innerHTML='<div class="admin-empty">还没有商品，点击上方「➕ 新增商品」添加第一条吧</div>';
    return;
  }
  if(!shown.length){
    list.innerHTML='<div class="admin-empty">没有找到匹配的商品，换个关键词试试～</div>';
    return;
  }
  list.innerHTML=shown.map(function(p){
    var f=p.fields||{};
    var total=window.calcTotal?window.calcTotal(p):'';
    var chips='';
    if(f.region){ chips+='<span class="a-chip gold">'+esc(f.region)+'区</span>'; }
    if(f.rank){ chips+='<span class="a-chip">'+esc(f.rank)+'</span>'; }
    if(f.level){ chips+='<span class="a-chip">Lv.'+esc(f.level)+'</span>'; }
    if(f.coins){ chips+='<span class="a-chip">'+esc(f.coins)+'</span>'; }
    if(f.coinRate){ chips+='<span class="a-chip">比例 '+esc(f.coinRate)+'</span>'; }
    if(total){ chips+='<span class="a-chip gold">'+esc(total)+'</span>'; }
    if(p.pinned){ chips+='<span class="a-chip gold">📌 置顶</span>'; }
    if(p.highlight){ chips+='<span class="a-chip gold">⭐ 高亮</span>'; }
    return '<div class="admin-row'+(p.status==='off'?' off':'')+'">'
      +'<div class="a-info">'
      +  '<div class="a-title"><span class="a-num">'+esc(p.id)+'</span> '+esc(p.name)
      +    (p.status==='off'?'<span class="tag-off">已下架</span>':'<span class="tag-on">在售</span>')
      +  '</div>'
      +  '<div class="a-chips">'+chips+'</div>'
      +'</div>'
      +'<label class="switch" title="上架 / 下架"><input type="checkbox"'+(p.status==='on'?' checked':'')+' onchange="toggleStatus(\''+p.id+'\', this.checked)"><span class="slider"></span></label>'
      +'<div class="a-btns">'
      +  '<button type="button" class="btn small" onclick="togglePin(\''+p.id+'\', '+(p.pinned?'false':'true')+')">'+(p.pinned?'取消置顶':'📌 置顶')+'</button>'
      +  '<button type="button" class="btn small" onclick="toggleHighlight(\''+p.id+'\', '+(p.highlight?'false':'true')+')">'+(p.highlight?'取消高亮':'⭐ 高亮')+'</button>'
      +  '<button type="button" class="btn small" onclick="editProduct(\''+p.id+'\')">编辑</button>'
      +  '<button type="button" class="btn small danger" onclick="delProduct(\''+p.id+'\')">删除</button>'
      +'</div>'
      +'</div>';
  }).join('');
}

async function toggleStatus(id, checked){
  try{
    await api('/api/admin/products/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({status:checked?'on':'off'})});
    await refreshState();
    var p=findProduct(id);
    toast(checked?'已上架'+(p?'：'+p.name:''):'已下架'+(p?'：'+p.name:''));
  }catch(e){ toast(e.message); }
}
async function togglePin(id, val){
  try{ await api('/api/admin/products/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({pinned:val})}); await refreshState(); toast(val?'已置顶':'已取消置顶'); }catch(e){ toast(e.message); }
}
async function toggleHighlight(id, val){
  try{ await api('/api/admin/products/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({highlight:val})}); await refreshState(); toast(val?'已高亮':'已取消高亮'); }catch(e){ toast(e.message); }
}
async function delProduct(id){
  if(!confirm('确定删除该商品吗？删除后不可恢复。')) return;
  try{
    await api('/api/admin/products/'+encodeURIComponent(id),{method:'DELETE'});
    await refreshState();
    toast('已删除');
  }catch(e){ toast(e.message); }
}

/* ======================= 商品表单 ======================= */
var editId=null, formImage='';

function genFields(containerId, prefix){
  var wrap=$(containerId); if(!wrap) return;
  var html='';
  FIELDS.forEach(function(fd){
    if(containerId==='applyFields' && fd.adminOnly){ return; }
    var fid=prefix+fd.key;
    html+='<div class="form-group'+(fd.wide?' wide':'')+'">';
    html+='<label for="'+fid+'">'+esc(fd.label)+(fd.required?'<span class="req">*</span>':'')+(fd.note?'<span class="fnote">'+esc(fd.note)+'</span>':'')+'</label>';
    if(fd.select){
      html+='<select id="'+fid+'">'+fd.select.map(function(o){
        return '<option value="'+esc(o)+'">'+(o===''?'（不填）':esc(o))+'</option>';
      }).join('')+'</select>';
    } else if(fd.textarea){
      html+='<textarea id="'+fid+'" rows="2" placeholder="'+esc(fd.placeholder||'')+'"></textarea>';
    } else {
      html+='<input id="'+fid+'" type="text" placeholder="'+esc(fd.placeholder||'')+'">';
    }
    html+='</div>';
  });
  wrap.innerHTML=html;
}

function openForm(p){
  pendEditId=null;
  editId=p?p.id:null;
  formImage=p?(p.image||''):'';
  var t=$('formTitle'); if(t) t.textContent=p?('编辑商品 · 编号 '+p.id):'新增商品';
  var nameIn=$('f_name'); if(nameIn) nameIn.value=p?p.name:'';
  FIELDS.forEach(function(fd){
    var el=$('f_'+fd.key);
    if(el){ var v=(p&&p.fields)?p.fields[fd.key]:''; el.value=(v==null?'':v); }
  });
  var st=$('f_status'); if(st) st.checked=p?(p.status==='on'):true;
  var pn=$('f_pinned'); if(pn) pn.checked=p?!!p.pinned:false;
  var hl=$('f_highlight'); if(hl) hl.checked=p?!!p.highlight:false;
  var stc=document.getElementById('f_status'); if(stc) stc.parentNode.style.display='';
  var sbb=document.querySelector('#productForm button[type=submit]'); if(sbb) sbb.textContent='💾 保存商品';
  var cg=document.getElementById('peContactGroup'); if(cg) cg.style.display='none';
  updateImagePreview();
  showView('form');
  runHooks('formOpen'); // 多选/体验卡字段控件同步
}
function editProduct(id){
  var p=findProduct(id);
  if(p) openForm(p); else toast('未找到该商品');
}

function updateImagePreview(){
  var pv=$('imgPreview'), ph=$('imgPh');
  if(!pv) return;
  if(formImage){ pv.src=formImage; pv.style.display='block'; if(ph) ph.style.display='none'; }
  else { pv.removeAttribute('src'); pv.style.display='none'; if(ph) ph.style.display='flex'; }
}

async function saveProduct(ev){
  if(ev) ev.preventDefault();
  var nameEl=$('f_name');
  var nameVal=nameEl?String(nameEl.value||'').trim():'';
  if(!nameVal){ toast('请填写「游戏昵称」'); return; }
  var fields={};
  FIELDS.forEach(function(fd){
    var el=$('f_'+fd.key);
    fields[fd.key]=el?String(el.value||'').trim():'';
  });
  // 六甲/六头/aw 未填时默认记为「无」，避免前台空缺
  ['armor','helm','aw'].forEach(function(k){ if(!fields[k]) fields[k]='无'; });
  for(var i=0;i<FIELDS.length;i++){
    var fd=FIELDS[i];
    if(fd.required && !fields[fd.key]){ toast('请填写「'+fd.label+'」'); return; }
  }
  if(pendEditId){
    try{
      var pc=($('pe_contact2')||{}).value||'';
      await api('/api/admin/pending/'+encodeURIComponent(pendEditId),{method:'PUT',body:JSON.stringify({name:nameVal,fields:fields,image:formImage,contact:String(pc).trim()})});
      var autoOn=$('f_status')?$('f_status').checked:false;
      if(autoOn){
        await api('/api/admin/pending/'+encodeURIComponent(pendEditId)+'/approve',{method:'POST'});
      }
      pendEditId=null;
      toast(autoOn?'已保存并上架 ✅':'修改已保存，点「✅ 通过」即可上架');
      showView('pending');
      await refreshState();
    }catch(e){ toast(e.message); }
    return;
  }
  var on=$('f_status')?$('f_status').checked:true;
  var body={ name:nameVal, fields:fields, image:formImage, status:on?'on':'off', pinned:!!($('f_pinned')&&$('f_pinned').checked), highlight:!!($('f_highlight')&&$('f_highlight').checked) };
  try{
    if(editId){
      await api('/api/admin/products/'+encodeURIComponent(editId),{method:'PUT',body:JSON.stringify(body)});
    } else {
      await api('/api/admin/products',{method:'POST',body:JSON.stringify(body)});
    }
    editId=null;
    toast('已保存 ✅');
    showView('list');
    await refreshState();
  }catch(e){ toast(e.message); }
}

/* ======================= 图片上传（后台表单） ======================= */
function readImageFile(file, cb){
  if(!file.type || file.type.indexOf('image/')!==0){ toast('请选择图片文件'); return; }
  if(file.size>8*1024*1024){ toast('图片过大（超过 8MB），请先压缩'); return; }
  var rd=new FileReader();
  rd.onload=function(e){
    var img=new Image();
    img.onload=function(){
      var MAX=900, w=img.naturalWidth, h=img.naturalHeight;
      if(!w||!h){ toast('图片读取失败'); return; }
      if(w>MAX){ h=Math.round(h*MAX/w); w=MAX; }
      var c=document.createElement('canvas'); c.width=w; c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      cb(c.toDataURL('image/jpeg',0.82));
    };
    img.onerror=function(){ toast('图片读取失败'); };
    img.src=e.target.result;
  };
  rd.readAsDataURL(file);
}
function applyImageUrl(){
  var u=String(($('imgUrl')||{}).value||'').trim();
  if(!u){ toast('请先粘贴图片链接'); return; }
  formImage=u; updateImagePreview(); toast('已使用该图片链接');
}
function clearImage(){
  formImage='';
  var u=$('imgUrl'); if(u) u.value='';
  updateImagePreview();
}

/* ======================= 自助上架 ======================= */
var applyImage='';
var pendEditId=null;

function openApply(){
  var m=$('applyModal'); if(!m) return;
  var r=$('applyResult'); if(r) r.hidden=true;
  var w=$('applyFormWrap'); if(w) w.hidden=false;
  resetApplyForm();
  m.hidden=false;
  var n=$('a_name'); if(n) setTimeout(function(){ n.focus(); },50);
}
function closeApply(){
  var m=$('applyModal'); if(m) m.hidden=true;
  pendEditId=null;
  var w=$('applyFormWrap');
  if(w){ var tt=w.querySelector('h3'); if(tt) tt.textContent='📤 自助上架'; }
  var sb=$('applySubmitBtn'); if(sb) sb.textContent='🚀 提交上架申请';
}

function resetApplyForm(){
  var n=$('a_name'); if(n) n.value='';
  var c=$('a_contact'); if(c) c.value='';
  FIELDS.forEach(function(fd){ var el=$('a_'+fd.key); if(el) el.value=''; });
  applyImage='';
  var u=$('applyImgUrl'); if(u) u.value='';
  updateApplyPreview();
  runHooks('applyReset'); // 多选/体验卡字段控件同步
}
function updateApplyPreview(){
  var pv=$('applyImgPreview'), ph=$('applyImgPh');
  if(!pv) return;
  if(applyImage){ pv.src=applyImage; pv.style.display='block'; if(ph) ph.style.display='none'; }
  else { pv.removeAttribute('src'); pv.style.display='none'; if(ph) ph.style.display='flex'; }
}
function applyImageUrlUse(){
  var u=String(($('applyImgUrl')||{}).value||'').trim();
  if(!u){ toast('请先粘贴图片链接'); return; }
  applyImage=u; updateApplyPreview(); toast('已使用该图片链接');
}
function applyImageClear(){
  applyImage='';
  var u=$('applyImgUrl'); if(u) u.value='';
  updateApplyPreview();
}

async function submitApply(ev){
  if(ev) ev.preventDefault();
  var name=String(($('a_name')||{}).value||'').trim();
  var contact=String(($('a_contact')||{}).value||'').trim();
  if(!name){ toast('请填写「游戏昵称」'); return; }
  if(!contact){ toast('请填写联系方式，方便店主联系你'); return; }
  var fields={};
  FIELDS.forEach(function(fd){
    var el=$('a_'+fd.key);
    fields[fd.key]=el?String(el.value||'').trim():'';
  });
  // 六甲/六头/aw 未填时默认记为「无」，避免前台空缺
  ['armor','helm','aw'].forEach(function(k){ if(!fields[k]) fields[k]='无'; });
  for(var i=0;i<FIELDS.length;i++){
    var fd=FIELDS[i];
    if(fd.required && !fd.adminOnly && !fields[fd.key]){ toast('请填写「'+fd.label+'」'); return; }
  }
  if(pendEditId){
    var esub=$('applySubmitBtn');
    if(esub) esub.disabled=true;
    try{
      await api('/api/admin/pending/'+encodeURIComponent(pendEditId),{method:'PUT',body:JSON.stringify({name:name,contact:contact,fields:fields,image:applyImage})});
      await refreshState();
      closeApply();
      toast('修改已保存，点「✅ 通过」即可上架');
    }catch(e){ toast(e.message); }
    if(esub) esub.disabled=false;
    return;
  }
  var sub=$('applySubmitBtn');
  if(sub) sub.disabled=true;
  try{
    await api('/api/apply',{method:'POST',body:JSON.stringify({name:name,contact:contact,fields:fields,image:applyImage})});
    var w=$('applyFormWrap'); if(w) w.hidden=true;
    var r=$('applyResult'); if(r) r.hidden=false;
    var ch=$('applyContactHint');
    if(ch) ch.textContent = store.settings.contact ? ('店主联系方式：'+store.settings.contact) : '';
  }catch(e){ toast(e.message); }
  if(sub) sub.disabled=false;
}

/* ======================= 后台：待审核 ======================= */
function renderPending(){
  var pend=store.pending;
  var st=$('pendingStats'); if(st) st.innerHTML='待审核 <b>'+pend.length+'</b> 条申请 · 审核通过后自动上架';
  var wrap=$('pendingList'); if(!wrap) return;
  if(!pend.length){
    wrap.innerHTML='<div class="admin-empty">暂无待审核的申请。<br>客户在前台点「📤 自助上架」提交后，会直接出现在这里。</div>';
    return;
  }
  wrap.innerHTML=pend.map(function(it,i){
    var f=it.fields||{};
    var d=''; try{ d=new Date(it.createdAt).toLocaleString('zh-CN',{hour12:false}); }catch(e){}
    var chips='<span class="a-chip">提交于 '+esc(d)+'</span>';
    if(f.region){ chips+='<span class="a-chip gold">'+esc(f.region)+'区</span>'; }
    if(f.rank){ chips+='<span class="a-chip">'+esc(f.rank)+'</span>'; }
    if(f.coins){ chips+='<span class="a-chip">'+esc(f.coins)+'</span>'; }
    chips+='<span class="a-chip">联系：'+esc(it.contact||'未填写')+'</span>';
    return '<div class="p-row">'
      +'<div class="p-row-top">'
      +  '<div class="a-info">'
      +    '<div class="a-title"><span class="a-num">📥</span> '+esc(it.name)+' <span class="tag-off">待审核</span></div>'
      +    '<div class="a-chips">'+chips+'</div>'
      +  '</div>'
      +  '<div class="a-btns">'
      +    '<button type="button" class="btn small" onclick="togglePendingDetail('+i+')">查看</button>'
      +    '<button type="button" class="btn small ghost" onclick="openPendingEdit(\''+esc(it.id)+'\')">编辑</button>'
      +    '<button type="button" class="btn small btn-primary" onclick="approvePending(\''+esc(it.id)+'\')">✅ 通过</button>'
      +    '<button type="button" class="btn small danger" onclick="rejectPending(\''+esc(it.id)+'\')">拒绝</button>'
      +  '</div>'
      +'</div>'
      +'<div class="p-detail" id="pdetail-'+i+'" hidden>'+applyDetailHTML(it)+'</div>'
      +'</div>';
  }).join('');
}
function applyDetailHTML(it){
  var f=it.fields||{}, html='';
  FIELDS.forEach(function(fd){
    var v=f[fd.key];
    if(v===undefined||v===null||String(v).trim()==='') return;
    html+='<div class="pd'+(fd.wide?' wide':'')+'"><b>'+esc(fullLabel(fd))+'</b>'+esc(v)+'</div>';
  });
  html+='<div class="pd wide"><b>提交人联系方式</b>'+esc(it.contact||'未填写')+'</div>';
  return html;
}
function togglePendingDetail(i){ var el=$('pdetail-'+i); if(el) el.hidden=!el.hidden; }

async function approvePending(id){
  var it=store.pending.find(function(x){ return x.id===id; });
  if(!it) return;
  if(!confirm('通过该申请并立即上架吗？\n（'+it.name+' · 提交人：'+(it.contact||'未填写')+'）')) return;
  try{
    await api('/api/admin/pending/'+encodeURIComponent(id)+'/approve',{method:'POST'});
    await refreshState();
    toast('已通过并上架：'+it.name+' ✅');
  }catch(e){ toast(e.message); }
}
async function rejectPending(id){
  var it=store.pending.find(function(x){ return x.id===id; });
  if(!it) return;
  if(!confirm('确定拒绝该申请吗？\n（'+it.name+'）')) return;
  try{
    await api('/api/admin/pending/'+encodeURIComponent(id)+'/reject',{method:'POST'});
    await refreshState();
    toast('已拒绝该申请');
  }catch(e){ toast(e.message); }
}

function openPendingEdit(id){
  var it=store.pending.find(function(x){ return x.id===id; });
  if(!it){ toast('申请不存在'); return; }
  openForm(null);
  pendEditId=id;
  var t=$('formTitle'); if(t) t.textContent='✏️ 编辑申请 · '+esc(it.id);
  var nameIn=$('f_name'); if(nameIn) nameIn.value=it.name||'';
  var f=it.fields||{};
  FIELDS.forEach(function(fd){
    var el=$('f_'+fd.key);
    if(el){ var v=f[fd.key]; el.value=(v==null?'':v); }
  });
  if(typeof window.syncMulti==='function'){ window.syncMulti('f_'); }
  if(typeof window.syncExp==='function'){ window.syncExp('f_'); }
  formImage=it.image||'';
  updateImagePreview();
  var st2=$('f_status'); if(st2) st2.checked=true;
  var sb=document.querySelector('#productForm button[type=submit]');
  if(sb) sb.textContent='💾 保存修改';
  var cg=document.getElementById('peContactGroup');
  if(!cg){
    cg=document.createElement('div');
    cg.className='form-group wide';
    cg.id='peContactGroup';
    cg.innerHTML='<label for="pe_contact2">提交人联系方式</label><input id="pe_contact2" type="text" placeholder="微信 / QQ / 电话">';
    var fg=document.getElementById('formFields');
    if(fg) fg.appendChild(cg);
  }
  cg.style.display='';
  var pc=document.getElementById('pe_contact2');
  if(pc) pc.value=it.contact||'';
  showView('form');
}

/* ======================= 设置 ======================= */
function fillSettingsUI(){
  var a=$('setStoreName'); if(a) a.value=store.settings.storeName||'';
  var b=$('setContact'); if(b) b.value=store.settings.contact||'';
  var c=$('setCopyTemplate'); if(c) c.value=store.settings.copyTemplate||'';
  var d=$('setAdminPath'); if(d) d.value=store.settings.adminPath||'';
  var h=$('adminPathHint');
  if(h) h.textContent='完整入口：'+location.protocol+'//'+location.host+'/'+(store.settings.adminPath||'');
  runHooks('settings'); // 各设置卡片（字段/客服/公告/协议/备份列表）统一填充
}
async function saveSettingsUI(){
  var body={
    storeName:String(($('setStoreName')||{}).value||'').trim(),
    contact:String(($('setContact')||{}).value||'').trim(),
    copyTemplate:String(($('setCopyTemplate')||{}).value||'').trim()
  };
  var ap=String(($('setAdminPath')||{}).value||'').trim();
  if(ap){ body.adminPath=ap; }
  try{
    await api('/api/admin/settings',{method:'PUT',body:JSON.stringify(body)});
    await refreshState();
    toast('设置已保存 ✅');
  }catch(e){ toast(e.message); }
}
async function changePassword(){
  var newU=($('newUser')||{}).value||'';
  var oldP=($('oldPass')||{}).value||'';
  var newP=($('newPass')||{}).value||'';
  var cfm=($('newPass2')||{}).value||'';
  newU=String(newU).trim();
  if(newU && newU.length<2){ toast('用户名至少 2 个字符'); return; }
  if(/\s/.test(newU)){ toast('用户名不能包含空格'); return; }
  if(newP.length<6){ toast('新密码至少 6 位'); return; }
  if(newP!==cfm){ toast('两次输入的新密码不一致'); return; }
  try{
    await api('/api/admin/password',{method:'POST',body:JSON.stringify({old:oldP,new:newP,username:newU})});
    store.mustChangePassword=false;
    ['newUser','oldPass','newPass','newPass2'].forEach(function(id){ var el=$(id); if(el) el.value=''; });
    toast('账号信息已更新 🔑');
  }catch(e){ toast(e.message); }
}

/* ======================= 数据备份 ======================= */
async function doBackupDownload(){
  try{
    var res=await fetch('/api/admin/backup');
    if(!res.ok){ var ed=null; try{ ed=await res.json(); }catch(e){} throw new Error((ed&&ed.msg)||('下载失败（'+res.status+'）')); }
    var blob=await res.blob();
    var d=new Date();
    var pad=function(x){ return String(x).padStart(2,'0'); };
    var fn='店铺备份-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+'.json';
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=fn;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 3000);
    toast('备份文件已下载 ✅');
  }catch(e){ toast(e.message); }
}
async function doBackupRestore(){
  var f=$('backupFile'); if(!f || !f.files || !f.files[0]) return;
  if(!confirm('确定用该备份覆盖当前全部数据吗？\n\n恢复前服务器会自动留存一份当前数据的快照，但请再次确认你选的是正确的备份文件。')) { f.value=''; return; }
  try{
    var txt=await f.files[0].text();
    var data=JSON.parse(txt);
    await api('/api/admin/restore',{method:'POST',body:JSON.stringify(data)});
    f.value='';
    await refreshState();
    loadBackupList();
    toast('数据已恢复 ✅');
  }catch(e){ toast('恢复失败：'+e.message); f.value=''; }
}

/* ======================= 备份列表 ======================= */
function fmtSize(n){ if(!n){ return '0 KB'; } if(n<1024){ return n+' B'; } if(n<1048576){ return (n/1024).toFixed(1)+' KB'; } return (n/1048576).toFixed(1)+' MB'; }
function formatTime(t){ var d=new Date(t); var pad=function(x){ return String(x).padStart(2,'0'); }; return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes()); }
async function loadBackupList(){
  var el=$('backupList'); if(!el){ return; }
  try{
    var d=await api('/api/admin/backups');
    var files=d.files||[];
    if(!files.length){ el.innerHTML='<p class="form-hint">服务器上暂无本地备份（每天自动生成一份）。</p>'; return; }
    el.innerHTML='<div class="bk-list">'+files.map(function(f){
      return '<div class="bk-row">'
        +'<div class="bk-info"><span class="bk-name">'+esc(f.name)+'</span><span class="bk-meta">'+(f.mtime?esc(formatTime(f.mtime)):'')+' · '+esc(fmtSize(f.size))+'</span></div>'
        +'<div class="bk-btns">'
        +'<button type="button" class="btn small" onclick="restoreLocalBackup(\''+esc(f.name)+'\')">还原</button>'
        +'<button type="button" class="btn small danger" onclick="delLocalBackup(\''+esc(f.name)+'\')">删除</button>'
        +'</div></div>';
    }).join('')+'</div>';
  }catch(e){ el.innerHTML='<p class="form-hint">备份列表加载失败：'+esc(e.message)+'</p>'; }
}
async function restoreLocalBackup(name){
  if(!confirm('确定用服务器上的备份「'+name+'」覆盖当前全部数据吗？\n\n恢复前服务器会自动留存一份当前数据的快照。')){ return; }
  try{
    await api('/api/admin/backups/'+encodeURIComponent(name),{method:'POST'});
    await refreshState();
    loadBackupList();
    toast('已从本地备份恢复 ✅');
  }catch(e){ toast(e.message); }
}
async function delLocalBackup(name){
  if(!confirm('确定删除服务器上的备份「'+name+'」吗？删除后不可恢复。')){ return; }
  try{
    await api('/api/admin/backups/'+encodeURIComponent(name),{method:'DELETE'});
    loadBackupList();
    toast('备份已删除');
  }catch(e){ toast(e.message); }
}

/* ======================= 横屏提示 ======================= */
function updateRotateTip(){
  var t=$('rotateTip'); if(!t) return;
  // 手机已是折叠卡片，竖屏不需要横屏提示；只在 760-820px 平板竖屏、表格较挤时提示
  t.hidden=!(window.innerWidth>=760 && window.innerWidth<820 && window.innerHeight>window.innerWidth);
}

/* ======================= 初始化 ======================= */
async function init(){
  genFields('formFields','f_');
  genFields('applyFields','a_');
  updateRotateTip();

  // 服务端预置数据：首帧即显示自定义内容
  if(window.__BOOT){
    try{ store.settings=window.__BOOT.settings||store.settings; store.products=window.__BOOT.products||[]; }catch(e){}
  }
  if(ADMIN_MODE){
    document.title=(store.settings.storeName||'游戏账号租赁')+' · 后台管理';
    var lt0=$('aloginTitle'); if(lt0) lt0.textContent=store.settings.storeName||'游戏账号租赁';
  }
  renderFrontend();

  // 加载店铺数据
  try{
    var d=await api('/api/store');
    store.settings=d.settings||{};
    store.products=d.products||[];
  }catch(e){ toast(e.message); }
  renderFrontend();

  // 前台交互
  var si=$('searchInput'); if(si) si.addEventListener('input', renderFrontend);
  var as=$('adminSearch');
  function updateAdminSearchClear(){ var c=$('adminSearchClear'); if(c) c.hidden=!as || !as.value; }
  if(as) as.addEventListener('input', function(){ updateAdminSearchClear(); renderAdmin(); });
  var asc=$('adminSearchClear');
  if(asc) asc.addEventListener('click', function(){ if(as){ as.value=''; updateAdminSearchClear(); renderAdmin(); as.focus(); } });
  updateAdminSearchClear();
  var sc=$('searchClear');
  function updateSearchClear(){ if(sc) sc.hidden=!si || !si.value; }
  if(si) si.addEventListener('input', updateSearchClear);
  if(sc) sc.addEventListener('click', function(){ if(si){ si.value=''; renderFrontend(); updateSearchClear(); si.focus(); } });
  updateSearchClear();
  var ae=$('adminEntry');
  if(ae) ae.addEventListener('click', async function(e){
    e.preventDefault();
    try{
      var st=await api('/api/admin/state');
      applyState(st);
      showAdmin();
    }catch(err){ openLogin(); }
  });
  var ab=$('applyBtn'); if(ab) ab.addEventListener('click', openApply);

  // 登录
  var lb=$('loginBtn'); if(lb) lb.addEventListener('click', doLogin);
  var lp=$('loginPass'); if(lp) lp.addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });
  var mb=$('loginModal'); if(mb) mb.addEventListener('click', function(e){ if(e.target===mb) closeLogin(); });
  if(ADMIN_MODE){
    document.title=(store.settings.storeName||'游戏账号租赁')+' · 后台管理';
    var lt=$('aloginTitle'); if(lt) lt.textContent=store.settings.storeName||'游戏账号租赁';
    var au=$('aUser'); if(au){ var last='admin'; try{ last=localStorage.getItem('shop_admin_user')||'admin'; }catch(e){} au.value=last; }
    var ab2=$('aLoginBtn'); if(ab2) ab2.addEventListener('click', doAdminLogin);
    var ap2=$('aPass'); if(ap2) ap2.addEventListener('keydown', function(e){ if(e.key==='Enter') doAdminLogin(); });
    var abk=$('adminBack'); if(abk) abk.style.display='none';
    (async function(){
      try{ var st=await api('/api/admin/state'); applyState(st); showAdmin(); }
      catch(e){ var lv=$('adminLoginView'); if(lv){ lv.hidden=false; lv.style.removeProperty('display'); } }
    })();
  }

  // 自助上架弹窗
  var am=$('applyModal');
  if(am) am.addEventListener('click', function(e){ if(e.target===am) closeApply(); });
  var af=$('applyForm'); if(af) af.addEventListener('submit', submitApply);
  var ac=$('applyCancel'); if(ac) ac.addEventListener('click', closeApply);
  var acl=$('applyClose'); if(acl) acl.addEventListener('click', closeApply);
  var apk=$('applyImgPick'); if(apk) apk.addEventListener('click', function(){ var f=$('applyImgFile'); if(f) f.click(); });
  var afi=$('applyImgFile');
  if(afi) afi.addEventListener('change', function(){ var f=afi.files&&afi.files[0]; if(f) readImageFile(f,function(d){ applyImage=d; updateApplyPreview(); toast('截图已添加'); }); afi.value=''; });
  var aub=$('applyImgUrlBtn'); if(aub) aub.addEventListener('click', applyImageUrlUse);
  var aclr=$('applyImgClear'); if(aclr) aclr.addEventListener('click', applyImageClear);

  // 后台
  var abk=$('adminBack'); if(abk) abk.addEventListener('click', hideAdmin);
  var lo=$('adminLogout'); if(lo) lo.addEventListener('click', logout);
  ['list','pending','form','settings'].forEach(function(v){
    var t=$('tab-'+v); if(!t) return;
    t.addEventListener('click', function(){
      if(v==='form'){ pendEditId=null; openForm(null); }
      if(v==='pending') renderPending();
      if(v==='settings') fillSettingsUI();
      if(v==='list') renderAdmin();
      showView(v);
    });
  });

  var pf=$('productForm'); if(pf) pf.addEventListener('submit', saveProduct);
  var fb=$('formBack'); if(fb) fb.addEventListener('click', function(){ if(pendEditId){ pendEditId=null; showView('pending'); } else { editId=null; showView('list'); } });

  var pick=$('imgPick'); if(pick) pick.addEventListener('click', function(){ var f=$('imgFile'); if(f) f.click(); });
  var fileEl=$('imgFile');
  if(fileEl) fileEl.addEventListener('change', function(){ var f=fileEl.files&&fileEl.files[0]; if(f) readImageFile(f,function(d){ formImage=d; updateImagePreview(); toast('图片已添加'); }); fileEl.value=''; });
  var au=$('imgUrlBtn'); if(au) au.addEventListener('click', applyImageUrl);
  var rm=$('imgClear'); if(rm) rm.addEventListener('click', clearImage);

  var ss=$('setSave'); if(ss) ss.addEventListener('click', saveSettingsUI);
  var bd=$('backupDownload'); if(bd) bd.addEventListener('click', doBackupDownload);
  var br=$('backupRestoreBtn'); if(br) br.addEventListener('click', function(){ var f=$('backupFile'); if(f) f.click(); });
  var bf=$('backupFile'); if(bf) bf.addEventListener('change', doBackupRestore);
  addHook('settings', loadBackupList); // 备份列表随设置面板一并加载
  var apr=$('setAdminPathRand'); if(apr) apr.addEventListener('click', function(){ var el=$('setAdminPath'); if(!el) return; var cs='abcdefghjkmnpqrstuvwxyz23456789', s='admin_';
    for(var i=0;i<6;i++){ s+=cs.charAt(Math.floor(Math.random()*cs.length)); }
    el.value=s; var h=$('adminPathHint'); if(h) h.textContent='完整入口：'+location.protocol+'//'+location.host+'/'+s; });
  var cp=$('passSave'); if(cp) cp.addEventListener('click', changePassword);

  window.addEventListener('resize', updateRotateTip);
  window.addEventListener('orientationchange', updateRotateTip);

  // 前台页面（非后台入口）若本会话已登录过，自动恢复后台面板；失效则清理标记。
  // 注：后台入口页（ADMIN_MODE）已在上方分支完成自动恢复，此处不重复处理。
  if(!ADMIN_MODE){
    try{
      if(sessionStorage.getItem('shop_login')==='1'){
        var st=await api('/api/admin/state');
        applyState(st);
        showAdmin();
      }
    }catch(e){ try{ sessionStorage.removeItem('shop_login'); }catch(e2){} }
  }
}
init();

/* [安全] 基于白名单的 HTML 清洗（用于公告/协议等后台富文本）。
 * 设计：先用 DOM 解析，再只保留白名单标签与白名单属性；任何未知标签降级为纯文本，
 * 从根上杜绝黑名单绕过（如 svg/onload、MathML、CSS url(javascript:) 等）。 */
var SANITIZE_ALLOWED = {
  B:1, STRONG:1, I:1, EM:1, U:1, S:1, BR:1, P:1, DIV:1, SPAN:1,
  H1:1, H2:1, H3:1, H4:1, H5:1, H6:1, UL:1, OL:1, LI:1,
  BLOCKQUOTE:1, CODE:1, PRE:1, HR:1, SMALL:1, SUB:1, SUP:1, A:1, FONT:1
};
var SANITIZE_ATTRS = {
  '*': ['title'],
  A: ['href', 'target', 'rel'],
  FONT: ['color', 'size'],
  DIV: ['style'], SPAN: ['style'], P: ['style']
};
function sanitizeHTML(html) {
  var doc = new DOMParser().parseFromString('<div id="__root">' + String(html || '') + '</div>', 'text/html');
  var root = doc.getElementById('__root');
  if(!root){ return ''; }
  function clean(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(child){
      if(child.nodeType === 3){ return; } // 文本节点保留
      if(child.nodeType !== 1){ child.parentNode.removeChild(child); return; }
      var tag = child.tagName.toUpperCase();
      if(!SANITIZE_ALLOWED[tag]){
        // 未知/危险标签：用其纯文本内容替换，避免 XSS 同时不吞掉信息
        var text = doc.createTextNode(child.textContent || '');
        child.parentNode.replaceChild(text, child);
        return;
      }
      // 清洗属性
      Array.prototype.slice.call(child.attributes).forEach(function(attr){
        var n = attr.name.toLowerCase();
        var v = String(attr.value || '').trim();
        var allowed = (SANITIZE_ATTRS['*']||[]).indexOf(n) > -1 || (SANITIZE_ATTRS[tag]||[]).indexOf(n) > -1;
        var safeUrl = !/^(javascript|vbscript|data):/i.test(v.replace(/[\s\x00-\x1f]/g, ''));
        var safeStyle = n !== 'style' || !/(expression|javascript:|url\s*\(|@import|behavior)/i.test(v);
        if(!allowed || !safeUrl || !safeStyle){ child.removeAttribute(attr.name); return; }
        if(n === 'href' && tag === 'A'){ child.setAttribute('rel','noopener noreferrer'); if(/^https?:/i.test(v)){ child.setAttribute('target','_blank'); } }
      });
      clean(child); // 递归清洗子节点
    });
  }
  clean(root);
  return root.innerHTML;
}
