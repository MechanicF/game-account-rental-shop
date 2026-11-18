/* ===== filter-adapt-v6 筛选（按字段管理自动生成，多选） ===== */
(function(){
  if(window.__filterV6Ready){ return; }
  window.__filterV6Ready = true;
  var F = {};
  var expanded = (window.innerWidth > 760);
  var escFn = (typeof esc === 'function') ? esc : function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  function cssOnce(){
    if(document.getElementById('filterCssV6')){ return; }
    var st=document.createElement('style');
    st.id='filterCssV6';
    st.textContent='.filter-panel{background:#131a28;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;margin:0 0 18px}.fp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.fp-title{font-size:14px;font-weight:700;color:#eef2f9}.fp-actions{display:flex;gap:8px;align-items:center}.fp-reset,.fp-toggle{background:transparent;border:1px solid rgba(255,255,255,.08);color:#98a2b8;border-radius:8px;padding:5px 12px;font-size:12.5px;cursor:pointer;font-family:inherit}.fp-body{display:flex;flex-direction:column;gap:8px}.frow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.frow-label{font-size:12px;color:#98a2b8;flex-shrink:0;min-width:34px}.fchip{background:#151d2e;border:1px solid rgba(255,255,255,.08);color:#98a2b8;border-radius:999px;padding:6px 14px;font-size:13px;cursor:pointer;transition:.15s;font-family:inherit}.fchip.active{background:linear-gradient(135deg,#f6b93b,#ff8a3d);color:#1a1206;border-color:transparent;font-weight:700}.fadm-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.fadm-label{flex:1;min-width:120px}.fadm-opts{flex:2;min-width:150px}.fadm-row input,.fadm-row select{background:#0f1626;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px;color:#eef2f9;font-size:13px;outline:none;box-sizing:border-box}.fadm-auto{display:flex;align-items:center;gap:4px;font-size:12px;color:#98a2b8;white-space:nowrap}.fadm-auto input{width:auto}.fadm-del{background:rgba(248,113,113,.12);color:#f87171;border:1px solid rgba(248,113,113,.3);border-radius:8px;padding:8px 12px;cursor:pointer;font-size:13px}';
    document.head.appendChild(st);
  }
  function splitSkins(s){ if(!s){return[];} return String(s).split(/[,，、;；\s]+/).filter(function(x){return x;}); }
  function onSale(){ return store.products.filter(function(p){ return p.status==='on'; }); }
  function filterFields(){
    return (typeof FIELDS!=='undefined' ? FIELDS : []).filter(function(fd){ return fd.filter !== false && fd.show !== false; });
  }
  function fieldOptions(fd){
    var out=[];
    var prods=onSale();
    if(fd.key==='region'){ out=['Q','V']; }
    else if(fd.key==='pwd'){ out=['是','否']; }
    else if(fd.key==='insurance'){
      prods.forEach(function(p){
        var raw=String((p.fields||{}).insurance||'').trim();
        if(!raw){ return; }
        var im=raw.match(/(\d+)\s*格/g);
        if(im){ im.forEach(function(x){ var s=String(parseInt(x,10))+'格'; if(out.indexOf(s)<0){ out.push(s); } }); }
        else if(out.indexOf(raw)<0){ out.push(raw); }
      });
      out.sort(function(a,b){
        function num(x){ var m=String(x).match(/\d+/); return m?parseInt(m[0],10):9999; }
        return num(a)-num(b);
      });
    }
    else if(fd.multi||fd.textarea){
      prods.forEach(function(p){ splitSkins((p.fields||{})[fd.key]).forEach(function(k){ if(out.indexOf(k)<0){ out.push(k); } }); });
    }
    else {
      prods.forEach(function(p){ var v=String((p.fields||{})[fd.key]||'').trim(); if(v&&out.indexOf(v)<0){ out.push(v); } });
    }
    return out;
  }
  function optLabel(fd, opt){
    if(fd.key==='region'){ return opt+'区'; }
    if(fd.key==='pwd'){ return opt==='是'?'支持账密':(opt==='否'?'不支持':opt); }
    return opt;
  }
  function matches(p, fd, opt){
    var f=p.fields||{};
    if(fd.key==='region'||fd.key==='pwd'){ return f[fd.key]===opt; }
    if(fd.key==='insurance'){ return String(f.insurance||'').indexOf(opt)>-1; }
    if(fd.multi||fd.textarea){ return splitSkins(f[fd.key]).indexOf(opt)>-1; }
    return String(f[fd.key]||'').trim()===opt;
  }
  function chip(fd, opt, active){
    return '<button type="button" class="fchip'+(active?' active':'')+'" data-gid="'+escFn(fd.key)+'" data-val="'+escFn(opt)+'">'+escFn(optLabel(fd,opt))+'</button>';
  }
  function row(label, inner){ return '<div class="frow"><span class="frow-label">'+escFn(label)+'</span>'+inner+'</div>'; }
  function toggleExpand(){ expanded = !expanded; buildPanel(); }
  function buildPanel(){
    cssOnce();
    var host=document.getElementById('filterPanel');
    if(!host){
      var tb=document.querySelector('.toolbar');
      if(!tb){ return; }
      host=document.createElement('div');
      host.className='filter-panel';
      host.id='filterPanel';
      tb.parentNode.insertBefore(host, tb.nextSibling);
      host.addEventListener('click', function(e){
        var t=e.target;
        while(t && t!==host && !(t.className && String(t.className).indexOf('fchip')>-1) && !(t.className && String(t.className).indexOf('fp-reset')>-1) && !(t.className && String(t.className).indexOf('fp-toggle')>-1)){ t=t.parentNode; }
        if(!t || t===host){ return; }
        var cn=String(t.className||'');
        if(cn.indexOf('fp-toggle')>-1){ toggleExpand(); return; }
        if(cn.indexOf('fp-reset')>-1){ F={}; var si=document.getElementById('searchInput'); if(si){ si.value=''; } renderFrontend(); return; }
        var gid=t.getAttribute('data-gid');
        var val=t.getAttribute('data-val');
        if(val===''){ delete F[gid]; }
        else {
          var arr=F[gid]||[];
          var idx=arr.indexOf(val);
          if(idx>-1){ arr.splice(idx,1); if(!arr.length){ delete F[gid]; } }
          else { arr.push(val); F[gid]=arr; }
        }
        renderFrontend();
      });
    }
    var html='<div class="fp-head"><span class="fp-title">筛选</span><span class="fp-actions">'
      +'<button type="button" class="fp-reset">↻ 刷新</button>'
      +'<button type="button" class="fp-toggle">'+(expanded?'收起 ▲':'展开 ▼')+'</button>'
      +'</span></div>'
      +'<div class="fp-body"'+(expanded?'':' style="display:none"')+'>';
    var anyRow=false;
    filterFields().forEach(function(fd){
      var opts=fieldOptions(fd);
      if(!opts.length){ return; }
      anyRow=true;
      var sel=F[fd.key]||[];
      var ih=chip(fd,'',sel.length===0);
      opts.forEach(function(o){ ih+=chip(fd,o,sel.indexOf(o)>-1); });
      html+=row(fd.short||fd.label, ih);
    });
    html+='</div>';
    host.innerHTML=html;
    host.style.display=anyRow?'':'none';
  }
  // [重构] 只负责计算筛选后的列表并返回，grid 渲染交给核心 renderFrontend 一次完成
  function computeList(){
    var q='';
    var si=document.getElementById('searchInput');
    if(si){ q=String(si.value||'').trim().toLowerCase(); }
    var list=onSale();
    if(q){ list=list.filter(function(p){ return String(JSON.stringify([p.id,p.name,p.fields])).toLowerCase().indexOf(q)>-1; }); }
    filterFields().forEach(function(fd){
      var sel=F[fd.key];
      if(!sel || !sel.length){ return; }
      list=list.filter(function(p){ return sel.some(function(o){ return matches(p,fd,o); }); });
    });
    return list.slice().sort(function(a,b){ return (b.pinned?1:0)-(a.pinned?1:0); });
  }
  addHook('renderList', computeList);
  addHook('renderPost', buildPanel);
  var si=document.getElementById('searchInput');
  if(si){ si.addEventListener('input', renderFrontend); }
})();

/* ===== fieldcfg-adapt-v1 商品字段后台可配置 ===== */
(function(){
  if(window.__fieldCfgReady){ return; }
  window.__fieldCfgReady = true;
  var escFn = (typeof esc === 'function') ? esc : function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var lastSig = '';
  function mapping(cf){
    var label = cf.label || cf.key || '';
    var sel = (cf.type === 'select' && cf.options && cf.options.length) ? cf.options : undefined;
    var mul = (cf.type === 'multi' && cf.options && cf.options.length) ? true : false;
    return { key: cf.key, label: label, short: cf.short || label, note: cf.note || '', placeholder: '', select: sel, options: cf.options || [], textarea: cf.type === 'textarea', multi: mul, expcard: cf.type === 'expcard', wide: (cf.type === 'textarea' || mul), adminOnly: !!cf.adminOnly, filter: cf.filter !== false, show: cf.show !== false, required: cf.required === true, frozen: cf.frozen === true };
  }
  function apply(){
    var s = (typeof store !== 'undefined' && store.settings) ? store.settings : {};
    var sig = JSON.stringify(s.productFields || null);
    if(sig === lastSig){ return; }
    lastSig = sig;
    if(s.productFields && s.productFields.length){
      FIELDS = s.productFields.map(mapping);
      genFields('formFields','f_');
      genFields('applyFields','a_');
      buildMultiInputs();
      buildExpInputs();
    }
  }
  (function(){
    if(document.getElementById('multiCss')){ return; }
    var st=document.createElement('style');
    st.id='multiCss';
    st.textContent='.multi-chips{display:flex;flex-wrap:wrap;gap:6px}.mchip{display:inline-flex;align-items:center;gap:4px;background:#151d2e;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;font-size:13px;color:#eef2f9;cursor:pointer;user-select:none}.mchip input{accent-color:#f6b93b;margin:0}.mchip:has(input:checked){border-color:rgba(246,185,59,.6);background:rgba(246,185,59,.1)}';
    document.head.appendChild(st);
  })();
  function splitSkins2(s){ if(!s){return[];} return String(s).split(/[,，、;；\s]+/).filter(function(x){return x;}); }
  (function(){
    if(document.getElementById('expCss')){ return; }
    var st=document.createElement('style');
    st.id='expCss';
    st.textContent='.exp-wrap{display:flex;flex-direction:column;gap:8px}.exp-sel{width:100%;background:#0f1626;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px;color:#eef2f9;font-size:13px;outline:none;box-sizing:border-box}body.light .exp-sel{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}.exp-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.exp-row .exp-sel{width:auto;flex:1;min-width:110px}.exp-txt{width:100%;background:#0f1626;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px;color:#eef2f9;font-size:13px;outline:none;box-sizing:border-box}body.light .exp-txt{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}';
    document.head.appendChild(st);
  })();
  function buildExpInputs(){
    (typeof FIELDS==='undefined'?[]:FIELDS).forEach(function(fd){
      if(!fd.expcard){ return; }
      ['f_','a_'].forEach(function(prefix){
        var el=document.getElementById(prefix+fd.key);
        if(!el || el.type==='hidden'){ return; }
        var val=el.value||'';
        var wrap=document.createElement('div');
        wrap.className='exp-wrap';
        wrap.id='expwrap_'+prefix+fd.key;
        var opts=fd.options&&fd.options.length?fd.options:['无','有'];
        var base=val||'';
        var det='';
        var has=false;
        if(base.indexOf('+')>-1){ has=true; det=base.slice(base.indexOf('+')+1); base=base.slice(0,base.indexOf('+')); }
        else if(base.indexOf('，有体验卡')>-1){ has=true; base=base.slice(0,base.indexOf('，有体验卡')); }
        var optHtml=opts.map(function(o){
          return '<option value="'+escFn(o)+'"'+(o===base?' selected':'')+'>'+escFn(o)+'</option>';
        }).join('');
        if(base && opts.indexOf(base)<0){ optHtml+='<option value="'+escFn(base)+'" selected>'+escFn(base)+'</option>'; }
        wrap.innerHTML='<div class="exp-row"><select class="exp-sel">'+optHtml+'</select>'
          +'<label class="check-line"><input type="checkbox" class="exp-chk"'+(has?' checked':'')+'> 是否有体验卡</label></div>'
          +'<input type="text" class="exp-txt" placeholder="体验卡详情，如：3天2张" style="'+(has?'':'display:none')+'" value="'+escFn(det)+'">'
          +'<input type="hidden" id="'+prefix+fd.key+'" value="'+escFn(val)+'">';
        el.parentNode.replaceChild(wrap, el);
        function rebuild(){
          var sel=wrap.querySelector('.exp-sel');
          var chk=wrap.querySelector('.exp-chk');
          var txt=wrap.querySelector('.exp-txt');
          var hid=wrap.querySelector('input[type=hidden]');
          txt.style.display=chk.checked?'':'none';
          var b=sel.value;
          var d=txt.value.trim();
          if(!chk.checked){ hid.value=b; }
          else if(!b){ hid.value=d?d:'有体验卡'; }
          else { hid.value=b+(d?'+'+d:'，有体验卡'); }
        }
        wrap.addEventListener('change', rebuild);
        wrap.addEventListener('input', function(e){ if(e.target && e.target.className==='exp-txt'){ rebuild(); } });
      });
    });
  }
  function syncExp(prefix){
    (typeof FIELDS==='undefined'?[]:FIELDS).forEach(function(fd){
      if(!fd.expcard){ return; }
      var hid=document.getElementById(prefix+fd.key);
      var wrap=document.getElementById('expwrap_'+prefix+fd.key);
      if(!hid||!wrap){ return; }
      var v=hid.value||'';
      var base=v||'';
      var det='';
      var has=false;
      if(base.indexOf('+')>-1){ has=true; det=base.slice(base.indexOf('+')+1); base=base.slice(0,base.indexOf('+')); }
      else if(base.indexOf('，有体验卡')>-1){ has=true; base=base.slice(0,base.indexOf('，有体验卡')); }
      var sel=wrap.querySelector('.exp-sel');
      if(sel){
        var found=false;
        for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===base){ sel.value=base; found=true; break; } }
        if(!found && base){
          var o=document.createElement('option');
          o.value=base;
          o.textContent=base;
          sel.appendChild(o);
          sel.value=base;
        }
        if(!base){ sel.value=''; }
      }
      var chk=wrap.querySelector('.exp-chk');
      if(chk){ chk.checked=has; }
      var txt=wrap.querySelector('.exp-txt');
      if(txt){ txt.value=det; txt.style.display=has?'':'none'; }
    });
  }
  function buildMultiInputs(){
    (typeof FIELDS === 'undefined' ? [] : FIELDS).forEach(function(fd){
      if(!fd.multi){ return; }
      ['f_','a_'].forEach(function(prefix){
        var el=document.getElementById(prefix+fd.key);
        if(!el || el.type==='hidden'){ return; }
        var val=el.value||'';
        var wrap=document.createElement('div');
        wrap.className='multi-wrap';
        wrap.id='mwrap_'+prefix+fd.key;
        wrap.innerHTML='<input type="hidden" id="'+prefix+fd.key+'" value="'+escFn(val)+'">'
          +'<div class="multi-chips">'
          +(fd.options||[]).map(function(o,i){
            return '<label class="mchip"><input type="checkbox" data-mval="'+escFn(o)+'" '+(splitSkins2(val).indexOf(o)>-1?'checked':'')+'> '+escFn(o)+'</label>';
          }).join('')
          +'</div>';
        el.parentNode.replaceChild(wrap, el);
        wrap.addEventListener('change', function(e){
          var t=e.target;
          if(t && t.type==='checkbox'){
            var hidden=wrap.querySelector('input[type=hidden]');
            var vals=[];
            wrap.querySelectorAll('input[type=checkbox]:checked').forEach(function(cb){ vals.push(cb.getAttribute('data-mval')); });
            hidden.value=vals.join('，');
          }
        });
      });
    });
  }
  function syncMulti(prefix){
    (typeof FIELDS === 'undefined' ? [] : FIELDS).forEach(function(fd){
      if(!fd.multi){ return; }
      var hidden=document.getElementById(prefix+fd.key);
      var wrap=document.getElementById('mwrap_'+prefix+fd.key);
      if(!hidden || !wrap){ return; }
      var vals=splitSkins2(hidden.value||'');
      wrap.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.checked = vals.indexOf(cb.getAttribute('data-mval')) > -1; });
    });
  }
  window.syncMulti=syncMulti; window.syncExp=syncExp;
  // [重构] 用统一钩子替代函数包裹
  addHook('formOpen', function(){ syncMulti('f_'); syncExp('f_'); });
  addHook('applyReset', function(){ syncMulti('a_'); syncExp('a_'); });
  addHook('renderPrepare', apply); // 字段映射须在渲染前完成，确保最先执行
  var fieldGroups = [];
  var FIELD_TYPES=[['text','文本'],['textarea','多行文本'],['select','下拉选项'],['multi','多选项'],['expcard','体验卡']];
  var faExpanded={}; // 展开状态记忆（重渲染后保留）
  function typeOptions(cur){
    return FIELD_TYPES.map(function(o){ return '<option value="'+o[0]+'"'+(cur===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('');
  }
  // 卡片式字段管理器样式（独立 id，支持明暗主题）
  (function(){
    if(document.getElementById('faMgrCss')){ return; }
    var st=document.createElement('style');
    st.id='faMgrCss';
    st.textContent='.fa-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px}'
      +'.fa-card{background:var(--card);border:1px solid var(--line);border-radius:12px;margin-bottom:10px;overflow:hidden;transition:border-color .15s,opacity .15s}'
      +'.fa-card:hover{border-color:rgba(246,185,59,.35)}'
      +'.fa-card.fa-drag{opacity:.55;border:1px dashed var(--gold);transform:scale(.985);box-shadow:0 16px 34px rgba(0,0,0,.28);z-index:5;position:relative}'
      +'.fa-card.fa-ins-before,.fa-card.fa-ins-after{position:relative;background:rgba(246,185,59,.07)}'
      +'.fa-card.fa-ins-before::before,.fa-card.fa-ins-after::after{content:"";position:absolute;left:0;right:0;height:6px;background:var(--gold);border-radius:4px;z-index:6;pointer-events:none}'
      +'.fa-card.fa-ins-before::before{top:-4px;box-shadow:0 -8px 22px 3px rgba(246,185,59,.55)}'
      +'.fa-card.fa-ins-after::after{bottom:-4px;box-shadow:0 8px 22px 3px rgba(246,185,59,.55)}'
      +'.fa-head{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:grab;flex-wrap:wrap;touch-action:pan-y}'
      +'.fa-head:active{cursor:grabbing}'
      +'.fa-head .fa-sw,.fa-head .fa-sw i,.fa-head button{cursor:pointer}'
      +'.fa-grip{display:inline-flex;align-items:center;justify-content:center;width:26px;height:30px;color:var(--muted);cursor:grab;user-select:none;touch-action:none;border-radius:7px;flex-shrink:0;transition:background .15s,color .15s}'
      +'.fa-grip:hover{background:rgba(246,185,59,.12);color:var(--gold)}'
      +'.fa-grip:active{cursor:grabbing;background:rgba(246,185,59,.2)}'
      +'.fa-grip svg{width:12px;height:18px;display:block;pointer-events:none;fill:currentColor}'
      +'.fa-switches{display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap}'
      +'@media(max-width:900px){.fa-switches{gap:8px;width:100%;padding-left:36px}}'
      +'.fa-idx{font-size:11px;color:var(--gold);font-weight:700;min-width:22px;font-variant-numeric:tabular-nums}'
      +'.fa-name{font-size:14px;font-weight:700;flex:1;min-width:100px;word-break:break-all;color:var(--text)}'
      +'.fa-type-badge{font-size:11px;color:var(--muted);background:rgba(128,128,128,.12);border:1px solid var(--line);border-radius:999px;padding:3px 10px;white-space:nowrap}'
      +'.fa-tog{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--muted);white-space:nowrap;cursor:pointer}'
      +'.fa-sw{position:relative;width:30px;height:17px;display:inline-block;flex-shrink:0}'
      +'.fa-sw input{position:absolute;opacity:0;width:0;height:0}'
      +'.fa-sw i{position:absolute;inset:0;background:#c9cfd9;border-radius:999px;transition:.18s;cursor:pointer}'
      +'body.dark .fa-sw i,body:not(.light) .fa-sw i{background:#39435a}'
      +'.fa-sw i::before{content:"";position:absolute;width:13px;height:13px;left:2px;top:2px;background:#fff;border-radius:50%;transition:.18s;box-shadow:0 1px 2px rgba(0,0,0,.18)}'
      +'.fa-sw input:checked + i{background:var(--gold)}'
      +'body.light .fa-sw input:checked + i{background:#f59e0b}'
      +'.fa-sw input:checked + i::before{transform:translateX(13px);background:#fff}'
      +'.fa-chev{width:8px;height:8px;border-right:2px solid var(--muted);border-bottom:2px solid var(--muted);transform:rotate(45deg);flex-shrink:0;margin:0 3px 5px 2px;transition:transform .18s}'
      +'.fa-card.open .fa-chev{transform:rotate(225deg);margin:4px 3px 0 2px}'
      +'.fa-x{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:8px;width:28px;height:28px;line-height:1;cursor:pointer;font-size:14px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;transition:.15s}'
      +'.fa-x:hover{color:var(--red);border-color:rgba(248,113,113,.45);background:rgba(248,113,113,.08)}'
      +'.fa-body{display:none;border-top:1px solid var(--line);padding:14px}'
      +'.fa-card.open .fa-body{display:block}'
      +'.fa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-bottom:13px}'
      +'@media(max-width:760px){.fa-grid{grid-template-columns:1fr}}'
      +'.fa-f label{display:block;font-size:11.5px;color:var(--muted);margin-bottom:5px}'
      +'.fa-f input,.fa-f textarea,.fa-f select{width:100%;background:#0f1626;border:1px solid var(--line);border-radius:9px;padding:9px 11px;color:var(--text);font-size:13px;outline:none;transition:.15s;box-sizing:border-box}'
      +'body.light .fa-f input,body.light .fa-f textarea,body.light .fa-f select{background:#fff;color:#1f2937;border-color:rgba(15,23,42,.12)}'
      +'.fa-f input:focus,.fa-f textarea:focus{border-color:rgba(246,185,59,.6);box-shadow:0 0 0 3px rgba(246,185,59,.12)}'
      +'.fa-sec{margin-top:12px}'
      +'.fa-sec>.fa-lbl{display:block;font-size:11.5px;color:var(--muted);margin-bottom:7px}'
      +'.fa-seg{display:flex;gap:6px;flex-wrap:wrap}'
      +'.fa-seg button{background:#151d2e;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:7px 13px;font-size:12.5px;cursor:pointer;font-family:inherit;transition:.15s}'
      +'body.light .fa-seg button{background:#eef1f6;color:#4b5563;border-color:rgba(15,23,42,.1)}'
      +'.fa-seg button.on{color:#1a1206;background:var(--grad);border-color:transparent;font-weight:700}'
      +'.fa-opts-wrap{position:relative}.fa-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;min-height:2px}'
      +'.fa-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(246,185,59,.1);border:1px solid rgba(246,185,59,.3);color:var(--gold);border-radius:999px;padding:3px 6px 3px 10px;font-size:11.5px}'
      +'.fa-chip button{background:transparent;border:none;color:inherit;cursor:pointer;font-size:12px;line-height:1;padding:0 2px;opacity:.7}'
      +'.fa-chip button:hover{opacity:1}'
      +'.fa-foot{display:flex;align-items:center;gap:8px;margin-top:13px;flex-wrap:wrap}'
      +'.fa-mv{background:#151d2e;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:6px 11px;cursor:pointer;font-size:12px;font-family:inherit}'
      +'body.light .fa-mv{background:#eef1f6;color:#4b5563}'
      +'.fa-preview{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:14px}'
      +'.fa-preview h5{margin:0 0 4px;font-size:13px;font-weight:700}'
      +'.fa-preview .fa-pv-hint{font-size:11.5px;color:var(--muted);margin-bottom:12px}'
      +'.fa-pv-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.03);border-radius:9px;padding:10px 12px;flex-wrap:wrap}'
      +'body.light .fa-pv-row{background:#f4f6fa}'
      +'.fa-pv-k{font-size:11px;color:var(--muted);min-width:52px}'
      +'.fa-pv-v{font-size:13px;flex:1;word-break:break-all;min-width:80px}'
      +'.fa-pv-badge{font-size:11px;padding:2px 9px;border-radius:6px;background:rgba(246,185,59,.14);color:var(--gold)}';
    document.head.appendChild(st);
  })();
  function typeLabel(t){ for(var i=0;i<FIELD_TYPES.length;i++){ if(FIELD_TYPES[i][0]===t) return FIELD_TYPES[i][1]; } return '文本'; }
  function switchHTML(cls,on,label){
    return '<label class="fa-tog"><span class="fa-sw"><input type="checkbox" class="'+cls+'"'+(on?' checked':'')+'><i></i></span>'+label+'</label>';
  }
  function updatePreview(card){
    var pv=document.getElementById('faPreview'); if(!pv || !card){ return; }
    var name=String((card.querySelector('.fadm-f-label')||{}).value||'字段名').trim()||'字段名';
    var short=String((card.querySelector('.fadm-f-short')||{}).value||'').trim()||name;
    var note=String((card.querySelector('.fadm-f-note')||{}).value||'').trim();
    var type=(card.querySelector('.fadm-f-type')||{}).value||'text';
    var optsStr=String((card.querySelector('.fadm-f-opts')||{}).value||'');
    var firstOpt=optsStr.split(/[,，、]/).map(function(x){return x.trim();}).filter(function(x){return x;})[0];
    var sample={ text:'示例值', textarea:'多行文本示例内容…', select:(firstOpt||'选项值'), multi:(firstOpt||'标签值'), expcard:'无 + 3天2张' }[type]||'示例值';
    var badge=type==='select'?'下拉':(type==='multi'?'多选':(type==='expcard'?'体验卡':''));
    pv.innerHTML='<div class="fa-pv-row"><span class="fa-pv-k">'+escFn(short)+'</span>'
      +'<span class="fa-pv-v">'+escFn(sample)+(note?'<i class="fld-note">'+escFn(note)+'</i>':'')+'</span>'
      +(badge?'<span class="fa-pv-badge">'+badge+'</span>':'')+'</div>';
  }
  function renderFieldRows(){
    var list=document.getElementById('fieldAdminList');
    if(!list){ return; }
    list.innerHTML=fieldGroups.map(function(g,i){
      var opts=(g.options||[]).map(function(o){ return o===''?'不填':o; }).join('，');
      var needOpts=(g.type==='select'||g.type==='multi'||g.type==='expcard');
      var isOpen=!!faExpanded[g.key];
      return '<div class="fadm-row fa-card'+(isOpen?' open':'')+'" data-idx="'+i+'">'
        +'<div class="fa-head">'
        +  '<span class="fa-grip" title="按住卡片任意空白处即可拖动排序"><svg viewBox="0 0 12 18" aria-hidden="true"><circle cx="3" cy="3" r="1.3"/><circle cx="9" cy="3" r="1.3"/><circle cx="3" cy="9" r="1.3"/><circle cx="9" cy="9" r="1.3"/><circle cx="3" cy="15" r="1.3"/><circle cx="9" cy="15" r="1.3"/></svg></span>'
        +  '<span class="fa-idx">'+String(i+1).padStart(2,'0')+'</span>'
        +  '<span class="fa-name">'+escFn(g.label||'未命名字段')+'</span>'
        +  '<span class="fa-type-badge">'+escFn(typeLabel(g.type||'text'))+'</span>'
        +  '<span class="fa-switches">'
        +    switchHTML('fadm-f-show', g.show!==false, '展示')
        +    switchHTML('fadm-f-filter', g.filter!==false, '筛选')
        +    switchHTML('fadm-f-admin', !!g.adminOnly, '管理员')
        +    switchHTML('fadm-f-req', !!g.required, '必填')
        +  '</span>'
        +  '<span class="fa-chev"></span>'
        +  '<button type="button" class="fa-x fadm-del" title="删除字段">×</button>'
        +'</div>'
        +'<div class="fa-body">'
        +  '<input type="text" class="fadm-f-key" value="'+escFn(g.key)+'" style="display:none">'
        +  '<div class="fa-grid">'
        +    '<div class="fa-f"><label>字段名称</label><input type="text" class="fadm-f-label" value="'+escFn(g.label)+'" placeholder="如：账号等级"></div>'
        +    '<div class="fa-f"><label>卡片标签</label><input type="text" class="fadm-f-short" value="'+escFn(g.short||'')+'" placeholder="留空则用字段名称"></div>'
        +    '<div class="fa-f"><label>说明文字</label><input type="text" class="fadm-f-note" value="'+escFn(g.note||'')+'" placeholder="如：另结2元/件"></div>'
        +  '</div>'
        +  '<div class="fa-sec"><span class="fa-lbl">字段类型</span>'
        +    '<input type="hidden" class="fadm-f-type" value="'+escFn(g.type||'text')+'">'
        +    '<div class="fa-seg">'+FIELD_TYPES.map(function(t){ return '<button type="button" class="fa-type-btn'+((g.type||'text')===t[0]?' on':'')+'" data-type="'+t[0]+'">'+t[1]+'</button>'; }).join('')+'</div>'
        +  '</div>'
        +  '<div class="fa-sec fa-opts-sec"'+(needOpts?'':' style="display:none"')+'><span class="fa-lbl">可选项（逗号分隔，下拉/多选/体验卡使用）</span>'
        +    '<div class="fa-opts-wrap"><input type="text" class="fadm-f-opts" value="'+escFn(opts)+'" placeholder="如：Q，V，是，否"><div class="fa-chips"></div></div>'
        +  '</div>'
        +  '<div class="fa-sec"><span class="fa-lbl">其它</span>'
        +    switchHTML('fadm-f-frozen', !!g.frozen, '冻结（锁定，防止误删）')
        +  '</div>'
        +  '<div class="fa-foot">'
        +    '<button type="button" class="fa-mv fadm-move" data-mv="-1">↑ 上移</button>'
        +    '<button type="button" class="fa-mv fadm-move" data-mv="1">↓ 下移</button>'
        +  '</div>'
        +'</div>'
        +'</div>';
    }).join('');
    bindFieldCardEvents(list);
    // 默认预览第一个字段
    var first=list.querySelector('.fa-card'); if(first){ updatePreview(first); }
  }
  function renderChips(card){
    var wrap=card.querySelector('.fa-opts-wrap'); if(!wrap){ return; }
    var input=wrap.querySelector('.fadm-f-opts');
    var box=wrap.querySelector('.fa-chips');
    var vals=String(input.value||'').split(/[,，、]/).map(function(x){return x.trim();}).filter(function(x){return x;});
    box.innerHTML=vals.map(function(v,i){
      return '<span class="fa-chip">'+escFn(v)+'<button type="button" data-opt="'+i+'" title="移除">×</button></span>';
    }).join('');
    box.querySelectorAll('button[data-opt]').forEach(function(b){
      b.addEventListener('click', function(){
        var idx=parseInt(b.getAttribute('data-opt'),10);
        var arr=String(input.value||'').split(/[,，、]/).map(function(x){return x.trim();}).filter(function(x){return x;});
        arr.splice(idx,1);
        input.value=arr.join('，');
        renderChips(card); updatePreview(card);
      });
    });
  }
  function bindFieldCardEvents(list){
    // 字段内容变化 → 同步卡头名称/徽章/预览/选项标签
    list.querySelectorAll('.fa-card').forEach(function(card){
      var lbl=card.querySelector('.fadm-f-label');
      if(lbl){ lbl.addEventListener('input', function(){ var nm=card.querySelector('.fa-name'); if(nm) nm.textContent=lbl.value.trim()||'未命名字段'; updatePreview(card); }); }
      var sh=card.querySelector('.fadm-f-short'); if(sh){ sh.addEventListener('input', function(){ updatePreview(card); }); }
      var nt=card.querySelector('.fadm-f-note'); if(nt){ nt.addEventListener('input', function(){ updatePreview(card); }); }
      var op=card.querySelector('.fadm-f-opts'); if(op){ op.addEventListener('input', function(){ renderChips(card); updatePreview(card); }); renderChips(card); }
      card.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.addEventListener('change', function(){ updatePreview(card); }); });
      // 类型分段按钮
      card.querySelectorAll('.fa-type-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var t=btn.getAttribute('data-type');
          card.querySelectorAll('.fa-type-btn').forEach(function(b){ b.classList.toggle('on', b===btn); });
          var hid=card.querySelector('.fadm-f-type'); if(hid){ hid.value=t; }
          var badge=card.querySelector('.fa-type-badge'); if(badge){ badge.textContent=typeLabel(t); }
          var os=card.querySelector('.fa-opts-sec'); if(os){ os.style.display=(t==='select'||t==='multi'||t==='expcard')?'':'none'; }
          updatePreview(card);
        });
      });
      // 拖拽：整个卡头都可拖（排除开关/按钮），移动超过阈值才算拖拽，否则视为点击展开
      var head=card.querySelector('.fa-head');
      if(head){
        head.addEventListener('pointerdown', function(e){
          if(e.target.closest('.fa-sw') || e.target.closest('button')){ return; }
          if(e.pointerType==='mouse' && e.button!==0){ return; }
          var from=parseInt(card.getAttribute('data-idx'),10);
          if(isNaN(from)){ return; }
          var sx=e.clientX, sy=e.clientY, dragging=false;
          var overCard=null, insertAfter=false;
          function clearMark(c){ if(c){ c.classList.remove('fa-ins-before','fa-ins-after'); } }
          function move(ev){
            if(!dragging){
              if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy) < 6){ return; } // 阈值：区分点击与拖拽
              dragging=true;
              card.classList.add('fa-drag');
              document.body.style.userSelect='none';
            }
            var el=document.elementFromPoint(ev.clientX,ev.clientY);
            var tgt=el?el.closest('.fa-card'):null;
            if(tgt===card){ tgt=null; }
            clearMark(overCard);
            overCard=tgt; insertAfter=false;
            if(tgt){
              var rect=tgt.getBoundingClientRect();
              insertAfter=(ev.clientY-rect.top)>rect.height/2;
              tgt.classList.add(insertAfter?'fa-ins-after':'fa-ins-before');
            }
          }
          function up(ev){
            document.removeEventListener('pointermove',move);
            document.removeEventListener('pointerup',up);
            document.removeEventListener('pointercancel',up);
            document.body.style.userSelect='';
            card.classList.remove('fa-drag');
            if(!dragging){
              // 未拖动 → 当作点击，展开/折叠
              var key=String((card.querySelector('.fadm-f-key')||{}).value||'');
              var open=card.classList.toggle('open');
              faExpanded[key]=open;
              if(open){ updatePreview(card); }
              return;
            }
            var el=document.elementFromPoint(ev.clientX,ev.clientY);
            var tgt=el?el.closest('.fa-card'):null;
            var after=insertAfter;
            if(tgt===card){ tgt=null; }
            clearMark(overCard); clearMark(tgt);
            if(tgt && tgt!==card){
              var to=parseInt(tgt.getAttribute('data-idx'),10);
              if(!isNaN(to)){
                var item=fieldGroups.splice(from,1)[0];
                var dest=to+(after?1:0);
                if(from<to){ dest-=1; }
                if(dest<0){ dest=0; } if(dest>fieldGroups.length){ dest=fieldGroups.length; }
                fieldGroups.splice(dest,0,item);
                renderFieldRows();
                toast('已调整字段顺序：'+String(dest+1).padStart(2,'0'));
              }
            }
          }
          document.addEventListener('pointermove',move);
          document.addEventListener('pointerup',up);
          document.addEventListener('pointercancel',up);
        });
      }
    });
    // 删除（按 data-idx 定位，避免闭包索引错乱）
    list.querySelectorAll('.fadm-del').forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        var card=b.closest('.fa-card');
        var idx=parseInt(card.getAttribute('data-idx'),10);
        fieldGroups.splice(idx,1);
        renderFieldRows();
      });
    });
    // 上移/下移（兜底，兼容不支持拖拽的场景）
    list.querySelectorAll('.fadm-move').forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        var card=b.closest('.fa-card');
        var i=parseInt(card.getAttribute('data-idx'),10);
        var j=i+parseInt(b.getAttribute('data-mv'),10);
        if(j<0||j>=fieldGroups.length){ return; }
        var tmp=fieldGroups[i]; fieldGroups[i]=fieldGroups[j]; fieldGroups[j]=tmp;
        renderFieldRows();
      });
    });
  }
  function buildFieldCard(){
    var sec=document.getElementById('view-settings');
    if(!sec || document.getElementById('fieldAdminCard')){ return; }
    var card=document.createElement('div');
    card.className='set-card';
    card.id='fieldAdminCard';
    card.innerHTML='<h4>📋 字段管理 <span style="font-size:12px;color:var(--muted);font-weight:400">· 商品表单与前台展示项</span></h4>'
      +'<p class="form-hint" style="margin-bottom:12px">按住卡片<b>任意空白处</b>拖动排序（顺序即前台表格列顺序），拖到目标卡片上半部插到其前、下半部插到其后；轻点卡片展开编辑。「说明文字」显示在标签旁小字和复制文本中；「展示」控制前台是否显示；「筛选」把字段加入前台筛选面板；「管理员」勾选后客户自助上架看不到；「必填」在保存商品和自助上架时校验。建议改名而非删除重建（删除后无法找回已填数据）。</p>'
      +'<div class="fa-toolbar">'
      +  '<button type="button" class="btn small" id="faExpandAll">全部展开</button>'
      +  '<button type="button" class="btn small" id="faCollapseAll">全部收起</button>'
      +  '<span style="flex:1"></span>'
      +  '<button type="button" class="btn small" id="fieldAdminAdd">➕ 添加字段</button>'
      +  '<button type="button" class="btn small btn-primary" id="fieldAdminSave">💾 保存设置</button>'
      +'</div>'
      +'<div class="fa-preview" id="faPreview"><h5>前台实时预览</h5><div class="fa-pv-hint">点开任一字段卡片，这里显示它在前台的呈现效果</div></div>'
      +'<div id="fieldAdminList"></div>';
    sec.insertBefore(card, sec.lastElementChild);
    var ab=document.getElementById('fieldAdminAdd');
    if(ab){ ab.addEventListener('click', function(){ fieldGroups.push({ key:'cf'+Date.now(), label:'新字段', short:'', note:'', type:'text', options:[], adminOnly:false, filter:true, show:true, required:false, frozen:false }); renderFieldRows(); var cards=document.querySelectorAll('#fieldAdminList .fa-card'); if(cards.length){ var last=cards[cards.length-1]; last.classList.add('open'); last.scrollIntoView({block:'nearest'}); } }); }
    var sb=document.getElementById('fieldAdminSave');
    if(sb){ sb.addEventListener('click', saveFieldConfig); }
    var ea=document.getElementById('faExpandAll');
    if(ea){ ea.addEventListener('click', function(){ fieldGroups.forEach(function(g){ faExpanded[g.key]=true; }); document.querySelectorAll('#fieldAdminList .fa-card').forEach(function(c){ c.classList.add('open'); }); }); }
    var ca=document.getElementById('faCollapseAll');
    if(ca){ ca.addEventListener('click', function(){ fieldGroups.forEach(function(g){ faExpanded[g.key]=false; }); document.querySelectorAll('#fieldAdminList .fa-card').forEach(function(c){ c.classList.remove('open'); }); }); }
  }
  function saveFieldConfig(){
    var rows=document.querySelectorAll('#fieldAdminList .fadm-row');
    var arr=[];
    rows.forEach(function(r){
      var label=String(r.querySelector('.fadm-f-label').value||'').trim();
      if(!label){ return; }
      arr.push({
        key: String(r.querySelector('.fadm-f-key').value||'').trim(),
        label: label,
        short: String(r.querySelector('.fadm-f-short').value||'').trim(),
        note: String(r.querySelector('.fadm-f-note').value||'').trim(),
        type: r.querySelector('.fadm-f-type').value,
        options: String(r.querySelector('.fadm-f-opts').value||'').split(/[,，、]/).map(function(x){ return x.trim(); }).filter(function(x){ return x; }).map(function(x){ return x==='不填'?'':x; }),
        adminOnly: r.querySelector('.fadm-f-admin').checked,
        filter: r.querySelector('.fadm-f-filter').checked,
        show: r.querySelector('.fadm-f-show').checked,
        required: r.querySelector('.fadm-f-req').checked,
        frozen: r.querySelector('.fadm-f-frozen').checked
      });
    });
    api('/api/admin/settings',{method:'PUT',body:JSON.stringify({productFields:arr})}).then(function(){
      lastSig='';
      return refreshState();
    }).then(function(){
      toast('字段设置已保存 ✅');
    }).catch(function(e){ toast(e.message); });
  }
  // [重构] 用统一钩子替代函数包裹
  function fillFieldCfgUI(){
    buildFieldCard();
    var s=(typeof store!=='undefined'&&store.settings)?store.settings:{};
    if(s.productFields && s.productFields.length){
      fieldGroups=s.productFields.map(function(g){ return { key:g.key, label:g.label, short:g.short||'', note:g.note||'', type:g.type||'text', options:(g.options||[]).slice(), adminOnly:!!g.adminOnly, filter:g.filter!==false, show:g.show!==false, required:!!g.required, frozen:!!g.frozen }; });
    } else {
      fieldGroups=(typeof FIELDS!=='undefined'?FIELDS:[]).map(function(fd){ return { key:fd.key, label:fd.label, short:fd.short||'', note:fd.note||'', type:fd.expcard?'expcard':(fd.select?'select':(fd.textarea?'textarea':(fd.multi?'multi':'text'))), options:fd.select?fd.select.slice():[], adminOnly:!!fd.adminOnly, filter:fd.filter!==false, show:fd.show!==false, required:!!fd.required, frozen:!!fd.frozen }; });
    }
    renderFieldRows();
  }
  addHook('settings', fillFieldCfgUI);
  buildFieldCard();
})();

/* ===== img-off-adapt-v1 移除图片上传功能 ===== */
(function(){
  if(window.__imgOff){ return; }
  window.__imgOff = true;
  function hideImg(){
    var g=document.querySelectorAll('.img-group');
    for(var i=0;i<g.length;i++){ g[i].style.display='none'; }
  }
  hideImg();
  if(!document.getElementById('imgOffCss')){
    var st=document.createElement('style');
    st.id='imgOffCss';
    st.textContent='.t-thumb{display:none!important}';
    document.head.appendChild(st);
  }
  addHook('renderPost', hideImg);
})();

/* ===== cs-adapt-v2 联系客服悬浮窗（支持二维码图片） ===== */
(function(){
  if(window.__csReady){ return; }
  window.__csReady = true;
  var escFn = (typeof esc === 'function') ? esc : function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var csQrImage='';
  (function(){
    if(document.getElementById('csCss')){ return; }
    var st=document.createElement('style');
    st.id='csCss';
    st.textContent='#csFloat{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:90;display:flex;flex-direction:column;align-items:flex-end;gap:10px}#csBtn{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f6b93b,#ff8a3d);color:#1a1206;border:none;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(255,150,50,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}#csBtn span{font-size:20px}#csPanel{display:none;width:264px;background:#131a28;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.45)}#csPanel.open{display:block}#csPanel h4{margin:0 0 8px;font-size:15px}.cs-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,.08);font-size:13px}.cs-row:last-of-type{border-bottom:none}.cs-row b{color:#98a2b8;font-weight:400;flex-shrink:0}.cs-row .cs-val{color:#eef2f9;word-break:break-all;flex:1;text-align:right}.cs-copy{background:transparent;border:1px solid rgba(246,185,59,.4);color:#f6b93b;border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer;flex-shrink:0;font-family:inherit}#csNote{font-size:12px;color:#98a2b8;margin-top:10px;line-height:1.7;white-space:pre-wrap}#adminPanel:not([hidden]) ~ #csFloat,#loginModal:not([hidden]) ~ #csFloat,#applyModal:not([hidden]) ~ #csFloat{display:none!important}';
    document.head.appendChild(st);
  })();
  (function(){
    if(document.getElementById('csCss2')){ return; }
    var st=document.createElement('style');
    st.id='csCss2';
    st.textContent='#csQrOverlay{display:none;position:fixed;inset:0;z-index:120;background:rgba(5,8,14,.85);align-items:center;justify-content:center;padding:24px;cursor:zoom-out}#csQrOverlay img{max-width:min(80vw,360px);max-height:80vh;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.6)}.cs-qr-row{display:flex;align-items:center;gap:10px;margin-top:10px;cursor:zoom-in}.cs-qr-thumb{width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid rgba(255,255,255,.1)}.cs-qr-tip{font-size:12px;color:#f6b93b}';
    document.head.appendChild(st);
  })();
  function openQr(src){
    var ov=document.getElementById('csQrOverlay');
    if(!ov){
      ov=document.createElement('div');
      ov.id='csQrOverlay';
      ov.innerHTML='<img id="csQrBig" alt="二维码">';
      document.body.appendChild(ov);
      ov.addEventListener('click', function(){ ov.style.display='none'; });
    }
    var im=document.getElementById('csQrBig');
    if(im){ im.src=src; }
    ov.style.display='flex';
  }
  var bodyBound=false;
  function buildFloat(){
    if(document.body.className.indexOf('admin-mode')>-1){ return; }
    var host=document.getElementById('csFloat');
    if(!host){
      host=document.createElement('div');
      host.id='csFloat';
      host.innerHTML='<div id="csPanel"><h4>💬 联系客服</h4><div id="csBody"></div></div><button type="button" id="csBtn"><span>💬</span>客服</button>';
      document.body.appendChild(host);
      var btn=document.getElementById('csBtn');
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var p=document.getElementById('csPanel');
        if(p){ p.classList.toggle('open'); }
      });
      document.addEventListener('click', function(e){
        var p=document.getElementById('csPanel');
        var b=document.getElementById('csBtn');
        if(p && b && e.target!==b && !b.contains(e.target) && !p.contains(e.target)){ p.classList.remove('open'); }
      });
    }
    var cs=(typeof store!=='undefined'&&store.settings&&store.settings.cs)?store.settings.cs:null;
    var has=cs&&cs.enabled!==false&&(cs.wechat||cs.qq||cs.phone||cs.hours||cs.note||cs.qrImage);
    host.style.display=has?'':'none';
    if(!has){ return; }
    var bd=document.getElementById('csBody');
    if(!bd){ return; }
    var html='';
    function row(label,val){
      return '<div class="cs-row"><b>'+escFn(label)+'</b><span class="cs-val">'+escFn(val)+'</span><button type="button" class="cs-copy" data-txt="'+escFn(val)+'">复制</button></div>';
    }
    if(cs.wechat){ html+=row('微信',cs.wechat); }
    if(cs.qq){ html+=row('QQ',cs.qq); }
    if(cs.phone){ html+=row('电话',cs.phone); }
    if(cs.hours){ html+=row('营业时间',cs.hours); }
    if(cs.note){ html+='<div id="csNote">'+escFn(cs.note)+'</div>'; }
    if(cs.qrImage){ html+='<div class="cs-qr-row"><img class="cs-qr-thumb" src="'+escFn(cs.qrImage)+'" alt="二维码"><span class="cs-qr-tip">点击查看大图</span></div>'; }
    bd.innerHTML=html;
    if(!bodyBound){
      bodyBound=true;
      bd.addEventListener('click', function(e){
        var t=e.target;
        if(t && t.getAttribute && t.getAttribute('data-txt')!==null){
          copyText(t.getAttribute('data-txt'), '已复制 ✅');
          return;
        }
        var q=t;
        while(q && q!==bd && !(q.className && String(q.className).indexOf('cs-qr-row')>-1)){ q=q.parentNode; }
        if(q && q!==bd && cs && cs.qrImage){ openQr(cs.qrImage); }
      });
    }
  }
  function csQrPreview(){
    var im=document.getElementById('csQrImg');
    var ph=document.getElementById('csQrPh');
    if(!im){ return; }
    if(csQrImage){ im.src=csQrImage; im.style.display='block'; if(ph){ ph.style.display='none'; } }
    else { im.removeAttribute('src'); im.style.display='none'; if(ph){ ph.style.display='flex'; } }
  }
  function buildCsCard(){
    var sec=document.getElementById('view-settings');
    if(!sec || document.getElementById('csAdminCard')){ return; }
    var card=document.createElement('div');
    card.className='set-card';
    card.id='csAdminCard';
    card.innerHTML='<h4>💬 客服设置（前台悬浮窗）</h4>'
      +'<div class="form-grid">'
      +  '<div class="form-group"><label>微信</label><input type="text" id="csWechat" placeholder="微信号"></div>'
      +  '<div class="form-group"><label>QQ</label><input type="text" id="csQq" placeholder="QQ号"></div>'
      +  '<div class="form-group"><label>电话</label><input type="text" id="csPhone" placeholder="手机号"></div>'
      +  '<div class="form-group"><label>营业时间</label><input type="text" id="csHours" placeholder="如：全天"></div>'
      +  '<div class="form-group wide"><label>备注（可多行）</label><textarea id="csNote2" rows="2" placeholder="如：加好友请备注租号"></textarea></div>'
      +'</div>'
      +'<div style="margin-bottom:14px"><label style="font-size:13px;color:#98a2b8;display:block;margin-bottom:6px">客服二维码（选填，前台点开悬浮窗可看大图）</label><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><div id="csQrPrev" style="width:110px;height:110px;border:1.5px dashed rgba(255,255,255,.08);border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#0f1626;flex-shrink:0"><img id="csQrImg" alt="预览" style="display:none;width:100%;height:100%;object-fit:cover"><span id="csQrPh" style="color:#98a2b8;font-size:26px">📱</span></div><div style="display:flex;flex-direction:column;gap:8px"><input type="file" id="csQrFile" accept="image/*" hidden><button type="button" class="btn small" id="csQrPick">📁 选择图片</button><button type="button" class="btn small danger" id="csQrClear">移除图片</button></div></div></div>'
      +'<label class="check-line" style="margin-bottom:12px"><input type="checkbox" id="csEnabled" checked> 前台显示客服悬浮窗</label>'
      +'<button type="button" class="btn btn-primary" id="csSave">💾 保存客服设置</button>';
    sec.insertBefore(card, sec.lastElementChild);
    var sb=document.getElementById('csSave');
    if(sb){ sb.addEventListener('click', saveCs); }
    var pk=document.getElementById('csQrPick');
    if(pk){ pk.addEventListener('click', function(){ var f=document.getElementById('csQrFile'); if(f){ f.click(); } }); }
    var fe=document.getElementById('csQrFile');
    if(fe){ fe.addEventListener('change', function(){ var f=fe.files&&fe.files[0]; if(f){ readImageFile(f, function(d){ csQrImage=d; csQrPreview(); toast('二维码已添加'); }); } fe.value=''; }); }
    var cl=document.getElementById('csQrClear');
    if(cl){ cl.addEventListener('click', function(){ csQrImage=''; csQrPreview(); }); }
  }
  function fillCsUI(){
    var cs=(typeof store!=='undefined'&&store.settings&&store.settings.cs)?store.settings.cs:null;
    var w=document.getElementById('csWechat'); if(w){ w.value=(cs&&cs.wechat)||''; }
    var q=document.getElementById('csQq'); if(q){ q.value=(cs&&cs.qq)||''; }
    var p=document.getElementById('csPhone'); if(p){ p.value=(cs&&cs.phone)||''; }
    var h=document.getElementById('csHours'); if(h){ h.value=(cs&&cs.hours)||''; }
    var n2=document.getElementById('csNote2'); if(n2){ n2.value=(cs&&cs.note)||''; }
    var en=document.getElementById('csEnabled'); if(en){ en.checked=!(cs&&cs.enabled===false); }
    csQrImage=(cs&&cs.qrImage)||'';
    csQrPreview();
  }
  function saveCs(){
    var cs={
      enabled: document.getElementById('csEnabled').checked,
      wechat: String(document.getElementById('csWechat').value||'').trim(),
      qq: String(document.getElementById('csQq').value||'').trim(),
      phone: String(document.getElementById('csPhone').value||'').trim(),
      hours: String(document.getElementById('csHours').value||'').trim(),
      note: String(document.getElementById('csNote2').value||'').trim(),
      qrImage: csQrImage
    };
    api('/api/admin/settings',{method:'PUT',body:JSON.stringify({cs:cs})}).then(function(){
      return refreshState();
    }).then(function(){ toast('客服设置已保存 ✅'); }).catch(function(e){ toast(e.message); });
  }
  // [重构] 用统一钩子替代函数包裹
  addHook('settings', function(){ buildCsCard(); fillCsUI(); });
  addHook('renderPost', buildFloat);
  buildCsCard();
  buildFloat();
})();

/* ===== light-adapt-v2 统一主题 + 色调切换 ===== */
(function(){
  if(window.__lightReady2){ return; }
  window.__lightReady2 = true;
  function getTheme(){
    try{ return localStorage.getItem('shop_theme')==='dark' ? 'dark' : 'light'; }catch(e){ return 'light'; }
  }
  function applyTheme(t){
    document.body.classList.toggle('light', t==='light');
    document.body.classList.toggle('dark', t==='dark');
  }
  window.toggleTheme=function(){
    var t=getTheme()==='dark'?'light':'dark';
    try{ localStorage.setItem('shop_theme', t); }catch(e){}
    applyTheme(t);
    var els=document.querySelectorAll('.theme-btn');
    for(var i=0;i<els.length;i++){ els[i].textContent=t==='dark'?'☀️':'🌙'; }
  };
  function addBtns(){
    var hd=document.querySelector('.header-inner');
    if(hd && !hd.querySelector('.theme-btn')){
      var b=document.createElement('button');
      b.type='button';
      b.className='theme-btn'; b.setAttribute('aria-label','切换主题');
      b.textContent=getTheme()==='dark'?'☀️':'🌙';
      b.addEventListener('click', function(){ window.toggleTheme(); });
      hd.appendChild(b);
    }
    var at=document.querySelector('.admin-top');
    if(at && !at.querySelector('.theme-btn')){
      var b2=document.createElement('button');
      b2.type='button';
      b2.className='theme-btn'; b2.setAttribute('aria-label','切换主题');
      b2.textContent=getTheme()==='dark'?'☀️':'🌙';
      b2.addEventListener('click', function(){ window.toggleTheme(); });
      var lo=at.querySelector('#adminLogout');
      at.insertBefore(b2, lo);
    }
  }
  var st=document.createElement('style');
  st.id='lightCss2';
  st.textContent='body.light{--bg:#f4f6fa;--card:#ffffff;--card2:#eef1f6;--line:rgba(15,23,42,.10);--text:#1f2937;--muted:#6b7280;--gold:#d97706;--orange:#ea580c;--green:#059669;--red:#dc2626;--grad:linear-gradient(135deg,#f59e0b,#f97316);--shadow:0 8px 24px rgba(15,23,42,.08);background:#f4f6fa;color-scheme:light}body.dark{color-scheme:dark}body.light .site-header{background:rgba(255,255,255,.88);box-shadow:0 1px 0 rgba(15,23,42,.06)}body.light .hero h1{background:linear-gradient(120deg,#d97706,#ea580c);-webkit-background-clip:text;background-clip:text;color:transparent}body.light .hero-sub{color:#6b7280}body.light .toolbar input{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}body.light .toolbar input:focus{border-color:rgba(245,158,11,.5);box-shadow:0 0 0 3px rgba(245,158,11,.15)}body.light .filter-panel{background:#ffffff;border-color:rgba(15,23,42,.10);box-shadow:0 2px 10px rgba(15,23,42,.05)}body.light .fp-title{color:#1f2937}body.light .fp-reset,body.light .fp-toggle{border-color:rgba(15,23,42,.15);color:#6b7280}body.light .frow-label{color:#6b7280}body.light .fchip{background:#eef1f6;border-color:rgba(15,23,42,.10);color:#4b5563}body.light .fchip.active{background:linear-gradient(135deg,#f59e0b,#f97316);color:#ffffff;border-color:transparent}body.light .trow{background:#ffffff;border-color:rgba(15,23,42,.08);box-shadow:0 1px 4px rgba(15,23,42,.04)}body.light .trow.thead{background:#f1f5f9}body.light .trow:hover{background:#f8fafc}body.light .tcell{border-right-color:rgba(15,23,42,.05);color:#1f2937}body.light .tcell.th{color:#6b7280}body.light .t-name{color:#111827}body.light .t-num{color:#d97706}body.light .tbtn{box-shadow:0 2px 8px rgba(245,158,11,.3)}body.light .tbtn.ghost{border-color:rgba(15,23,42,.12);color:#4b5563}body.light .empty-state{color:#6b7280}body.light .site-footer{color:#6b7280}body.light .contact-chip{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.4);color:#b45309}body.light .rotate-tip{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.35);color:#b45309}body.light #toast{background:#ffffff;color:#1f2937;border-color:rgba(245,158,11,.5);box-shadow:0 6px 20px rgba(15,23,42,.15)}body.light #csPanel{background:#ffffff;border-color:rgba(15,23,42,.10);box-shadow:0 10px 30px rgba(15,23,42,.15)}body.light .cs-row{border-bottom-color:rgba(15,23,42,.08)}body.light .cs-row b{color:#6b7280}body.light .cs-row .cs-val{color:#1f2937}body.light .cs-copy{color:#d97706;border-color:rgba(217,119,6,.4)}body.light #csNote{color:#6b7280}body.light #applyModal .modal-card{background:#ffffff}body.light #applyModal input,body.light #applyModal select,body.light #applyModal textarea{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}body.light .mchip{background:#eef1f6;border-color:rgba(15,23,42,.10);color:#1f2937}body.light #loginModal .modal-card{background:#ffffff;color:#1f2937}body.light #loginModal .modal-card input{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}body.light #loginModal .modal-card .hint{color:#6b7280}body.light #adminPanel{--bg:#f4f6fa;--card:#ffffff;--card2:#eef1f6;--line:rgba(15,23,42,.10);--text:#1f2937;--muted:#6b7280;--gold:#d97706;--orange:#ea580c;--green:#059669;--red:#dc2626;--grad:linear-gradient(135deg,#f59e0b,#f97316);color:#1f2937;color-scheme:light}body.light .admin-top{background:rgba(255,255,255,.9);border-bottom-color:rgba(15,23,42,.08)}body.light .admin-tabs{background:linear-gradient(#f4f6fa 82%, transparent)}body.light .tab{background:#eef1f6;border-color:rgba(15,23,42,.10);color:#4b5563}body.light .tab.active{background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff}body.light .admin-stats{color:#6b7280}body.light .admin-stats b{color:#d97706}body.light .tag-on{color:#059669;border-color:rgba(5,150,105,.4)}body.light .tag-off{color:#6b7280;border-color:rgba(15,23,42,.12)}body.light .switch .slider{background:#cbd5e1}body.light .switch .slider::before{background:#ffffff}body.light .switch input:checked + .slider{background:linear-gradient(135deg,#f59e0b,#f97316)}body.light .form-group input,body.light .form-group select,body.light .form-group textarea{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}body.light .fadm-row input,body.light .fadm-row select{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}body.light .pending-import textarea{background:#ffffff;color:#1f2937;border-color:rgba(15,23,42,.12)}body.light .admin-empty{color:#6b7280;border-color:rgba(15,23,42,.15)}body.light .btn.ghost{color:#1f2937;border-color:rgba(15,23,42,.12)}body.light .btn.danger{color:#dc2626;background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.3)}body.light .fadm-del{color:#dc2626;background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.3)}body.light .fadm-move{background:#eef1f6;color:#4b5563;border-color:rgba(15,23,42,.12)}body.light .a-chip{background:rgba(15,23,42,.04);color:#6b7280;border-color:rgba(15,23,42,.10)}body.light .a-chip.gold{color:#d97706;border-color:rgba(217,119,6,.35);background:rgba(245,158,11,.08)}body.dark .tag-chip{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#eef2f9}body.dark .mcard{background:#131a28;border-color:rgba(255,255,255,.08)}body.dark .m-name{color:#eef2f9}body.dark .m-num{color:#f6b93b}body.dark .m-summary{color:#98a2b8}body.dark .m-arrow{color:#98a2b8}body.dark .mf{background:rgba(255,255,255,.03)}body.dark .mf-k{color:#98a2b8}body.dark .mf-v{color:#eef2f9}body.dark .mf-total{color:#f6b93b}body.dark .ms-chip{background:#151d2e;border-color:rgba(255,255,255,.08);color:#98a2b8}body.dark .ms-chip.active{background:linear-gradient(135deg,#f6b93b,#ff8a3d);color:#1a1206}body.dark .t-total{color:#f6b93b}.theme-btn{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:5px 9px;font-size:14px;cursor:pointer;line-height:1;margin-left:8px;flex-shrink:0;font-family:inherit}.set-card h4{padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:14px}body.light .set-card{box-shadow:0 2px 10px rgba(15,23,42,.05)}';
  document.head.appendChild(st);
  applyTheme(getTheme());
  addBtns();
})();

/* ===== table-adapt-v3 前台列表（PC单行宽表格 / 手机折叠卡片） ===== */
(function(){
  if(window.__tableReady3){ return; }
  window.__tableReady3 = true;
  var openIds={}; // 展开状态记忆：重渲染后保留
  var pcOpen={};
  var tableMode='narrow';
  try{ tableMode=localStorage.getItem('shop_table_mode')||'narrow'; }catch(e){}
  if(tableMode!=='all') tableMode='narrow';
  var viewMode='card';
  try{ viewMode=localStorage.getItem('shop_view_mode')||'card'; }catch(e){}
  if(viewMode!=='table') viewMode='card';
  window.toggleViewMode=function(){
    viewMode = (viewMode==='table') ? 'card' : 'table';
    try{ localStorage.setItem('shop_view_mode', viewMode); }catch(e){}
    renderFrontend();
  };
  function isCardPc(){ return viewMode==='card' && window.innerWidth>760; }
  function pcKeyCols(){
    var all=visibleCols();
    return all.filter(function(k){
      var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
      return isKeyField(fd);
    });
  }
  window.togglePcDetail=function(id){
    if(isCardPc()){
      var card=document.querySelector('.pc-card[data-id="'+id+'"]');
      if(card){
        var det=card.querySelector('.pc-detail');
        var btn=card.querySelector('.pc-detail-btn');
        if(det){
          var opening=!pcOpen[id];
          if(opening){ pcOpen[id]=1; det.classList.add('open'); det.setAttribute('aria-hidden','false'); if(btn) btn.textContent='详情 收起'; }
          else { delete pcOpen[id]; det.classList.remove('open'); det.setAttribute('aria-hidden','true'); if(btn) btn.textContent='详情 展开'; }
          return;
        }
      }
    }
    if(pcOpen[id]){ delete pcOpen[id]; } else { pcOpen[id]=1; }
    renderFrontend();
  };
  window.toggleTableMode=function(){
    tableMode = (tableMode==='all') ? 'narrow' : 'all';
    try{ localStorage.setItem('shop_table_mode', tableMode); }catch(e){}
    renderFrontend();
  };
  function isKeyField(fd){
    if(!fd) return false;
    var short=fd.short||'', label=fd.label||'';
    if(label.indexOf('红皮')>-1 || label.indexOf('刀皮')>-1 || short.indexOf('红皮')>-1 || short.indexOf('刀皮')>-1) return true;
    var keys=['等级','段位','机密/绝密KD','哈夫币(M)','哈夫币','大区','体力','租期','负重','保险'];
    return keys.indexOf(short)>-1 || keys.indexOf(label)>-1;
  }
  function displayCols(){
    var all=visibleCols();
    if(tableMode==='all' || window.innerWidth<=760) return all;
    var keys=all.filter(function(k){
      var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
      return isKeyField(fd);
    });
    return keys.length ? keys : all;
  }
  function isNarrowPc(){ return tableMode==='narrow' && window.innerWidth>760; }
  var escFn = (typeof esc === 'function') ? esc : function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  (function(){
    if(document.getElementById('tableCss3')){ return; }
    var st=document.createElement('style');
    st.id='tableCss3';
    st.textContent='#productGrid{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}@media (max-width:760px){#productGrid{overflow-x:visible}}.tbtn{background:linear-gradient(135deg,#f6b93b,#ff8a3d);color:#1a1206;border:none;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:700;cursor:pointer;width:100%;font-family:inherit}.tbtn.ghost{background:transparent;border:1px solid rgba(255,255,255,.08);color:#eef2f9;font-weight:400}.tag-chip{display:inline-block;background:#eef1f6;border:1px solid rgba(15,23,42,.12);color:#374151;border-radius:6px;padding:1px 8px;font-size:12px;line-height:1.6;white-space:nowrap}body.dark .tag-chip{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#eef2f9}.trow{display:grid;grid-template-columns:var(--tcols);align-items:stretch;background:#131a28;border:1px solid rgba(255,255,255,.08);border-radius:10px;margin-bottom:8px}.trow.thead{background:#151d2e}.trow:hover{background:#161f33}.tcell{padding:8px 10px;font-size:13px;display:flex;align-items:center;gap:8px;border-right:1px solid rgba(255,255,255,.05);min-width:0;word-break:break-all;color:#eef2f9;flex-wrap:wrap}.tcell:last-child{border-right:none}.tcell.th{color:#98a2b8;font-size:12px;font-weight:700;padding:9px 10px}.t-idwrap{min-width:0;display:flex;flex-direction:column}.t-num{font-size:12px;color:#f6b93b;font-weight:700}.t-name{font-size:13.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.t-act{flex-direction:column;gap:6px;justify-content:center;min-width:150px}.t-total{font-weight:700;color:#f6b93b;justify-content:center;font-variant-numeric:tabular-nums}.th-sort{cursor:pointer;user-select:none}.th-sort:hover{color:#d97706}.t-freeze{position:sticky;z-index:2;background:#ffffff;border-right:1px solid rgba(15,23,42,.08)}body.dark .t-freeze{background:#131a28;border-right-color:rgba(255,255,255,.08)}.trow.thead .t-freeze{background:#f1f5f9}body.dark .trow.thead .t-freeze{background:#151d2e}.t-freeze-r{position:sticky;z-index:2;background:#ffffff;border-left:1px solid rgba(15,23,42,.08)}body.dark .t-freeze-r{background:#131a28;border-left-color:rgba(255,255,255,.08)}.trow.thead .t-freeze-r{background:#f1f5f9}body.dark .trow.thead .t-freeze-r{background:#151d2e}.t-id.t-freeze{border-radius:10px 0 0 10px}.t-act.t-freeze-r{border-radius:0 10px 10px 0}.tag-red{background:rgba(220,38,38,.12);border-color:rgba(220,38,38,.35);color:#b91c1c}.tag-gold{background:rgba(245,158,11,.15);border-color:rgba(217,119,6,.4);color:#b45309}body.dark .tag-red{background:rgba(248,113,113,.15);border-color:rgba(248,113,113,.4);color:#fca5a5}body.dark .tag-gold{background:rgba(246,185,59,.15);border-color:rgba(246,185,59,.4);color:#fcd34d}.mcard{background:#ffffff;border:1px solid rgba(15,23,42,.08);border-radius:12px;padding:12px 14px;box-shadow:0 1px 4px rgba(15,23,42,.04)}.mcard-top{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;cursor:pointer}.m-num{font-size:12px;color:#d97706;font-weight:700}.m-name{font-size:16px;font-weight:700;color:#111827}.m-arrow{margin-left:auto;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;padding:6px 12px;border:1px solid rgba(15,23,42,.15);border-radius:8px;font-size:13px;font-weight:600;color:#6b7280;background:#f4f6fa;white-space:nowrap;cursor:pointer;line-height:1}body.dark .m-arrow{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#98a2b8}.m-summary{flex-basis:100%;font-size:12.5px;color:#6b7280;line-height:1.5}.mcard-detail{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-bottom:2px;border-top:1px solid rgba(15,23,42,.08);padding-top:6px}.mf{display:flex;flex-direction:row;align-items:baseline;justify-content:space-between;gap:8px;background:transparent;border-radius:0;border-bottom:1px solid rgba(15,23,42,.06);padding:6px 2px;min-width:0}.mf-k{font-size:11px;color:#6b7280;flex-shrink:0}.mf-v{font-size:13px;color:#1f2937;word-break:break-all;display:flex;flex-wrap:wrap;gap:4px;flex:1;min-width:0;justify-content:flex-end;text-align:right}.mf-total{color:#d97706;font-weight:700}.mcard-btns{display:flex;gap:10px;margin-top:12px}.mcard-btns .tbtn{width:auto;flex:1}.m-sortbar{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;-webkit-overflow-scrolling:touch}.ms-chip{flex-shrink:0;background:#eef1f6;border:1px solid rgba(15,23,42,.10);color:#4b5563;border-radius:999px;padding:5px 12px;font-size:12.5px;cursor:pointer;font-family:inherit;white-space:nowrap}.ms-chip.active{background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;border-color:transparent;font-weight:700}body.dark .mf{background:transparent;border-bottom-color:rgba(255,255,255,.06)}body.dark .mcard-detail{border-top-color:rgba(255,255,255,.08)}@media (max-width:760px){.mf{flex-direction:column;align-items:flex-start;gap:2px}.mf-v{text-align:left;justify-content:flex-start}}@media (min-width:761px){#productGrid{max-height:max(calc(100vh - 360px),520px);overflow-y:auto}.trow.thead{position:sticky;top:0;z-index:3;box-shadow:0 3px 10px rgba(0,0,0,.18)}}.tdetail{display:block;padding:12px 14px;background:var(--card2);border:1px solid var(--line);border-radius:10px;margin-bottom:8px}.tdetail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 14px}@media (max-width:1100px){.tdetail-grid{grid-template-columns:repeat(2,1fr)}}.tdetail-item{font-size:13px;line-height:1.6;min-width:0}.tdetail-k{color:var(--muted);font-size:12px;margin-right:6px}.tdetail-v{color:var(--text);word-break:break-all}.table-mode-bar{display:flex;gap:8px;align-items:center;margin:0 0 10px}.table-mode-note{color:var(--muted);font-size:12.5px} #productGrid.pc-cards{display:flex !important;flex-wrap:nowrap !important;gap:16px !important;align-items:flex-start !important;overflow:visible !important;max-height:none !important;max-width:100% !important;box-sizing:border-box} @media (max-width:1100px){#productGrid.pc-cards{flex-direction:column !important}} .pc-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow);break-inside:avoid;margin-bottom:0} .pc-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap} .pc-num{color:var(--gold);font-weight:700;font-size:13px} .pc-name{font-weight:700;font-size:16px;color:var(--text)} .pc-chip{display:inline-block;background:var(--card2);border:1px solid var(--line);color:var(--muted);border-radius:999px;padding:2px 10px;font-size:12.5px} .pc-chip.gold{color:var(--gold);border-color:rgba(246,185,59,.4)} .pc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px} .pc-stat{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;min-width:0} .pc-stat-k{color:var(--muted);font-size:11.5px} .pc-stat-v{color:var(--text);font-size:14px;font-weight:600;word-break:break-all} .pc-skins{display:flex;flex-wrap:wrap;gap:6px;align-items:center} .pc-skins-k{color:var(--muted);font-size:12px;flex-shrink:0} .pc-btns{display:flex;gap:10px;margin-top:2px} .pc-btns .tbtn{flex:1} .pc-card{transition:transform .25s ease,box-shadow .25s ease} .pc-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.14)} @keyframes pcIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} .pc-detail{display:grid;grid-template-rows:0fr;transition:grid-template-rows .38s cubic-bezier(.22,.8,.3,1),opacity .3s ease;opacity:0;margin-top:2px} .pc-detail.open{grid-template-rows:1fr;opacity:1} .pc-detail-inner{overflow:hidden;min-height:0} .tdetail{animation:tdetailIn .3s ease both} @keyframes tdetailIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}} .tbtn{transition:background .2s ease,transform .15s ease,box-shadow .2s ease} .tbtn:active{transform:scale(.97)} .ms-chip{transition:background .2s ease,color .2s ease} @media (prefers-reduced-motion:reduce){.pc-card,.tdetail{animation:none}.pc-detail{transition:none}.tbtn{transition:none}} .pc-card.highlight{border-color:rgba(246,185,59,.65);box-shadow:0 0 0 1px rgba(246,185,59,.35),0 10px 28px rgba(245,158,11,.18)} .pc-card.highlight:hover{box-shadow:0 0 0 1px rgba(246,185,59,.4),0 12px 30px rgba(245,158,11,.22)} .pc-chip.pin{background:rgba(220,38,38,.12);color:#b91c1c;border-color:rgba(220,38,38,.35)} .pc-chip.hl{background:rgba(245,158,11,.15);color:#b45309;border-color:rgba(217,119,6,.4)} .trow.highlight{background:rgba(245,158,11,.08)} .mcard.highlight{border-color:rgba(246,185,59,.6);box-shadow:0 0 0 1px rgba(246,185,59,.3)} .load-more-bar{display:flex;justify-content:center;margin:16px 0} body{overflow-x:clip} .container{width:100%} #productGrid{max-width:100%} .pc-col{flex:1 1 0;min-width:0;max-width:100%;display:flex;flex-direction:column;gap:16px} .pc-card{min-width:0;max-width:100%} .pc-stats{grid-template-columns:repeat(3,minmax(0,1fr))} .pc-top,.pc-btns,.pc-skins{min-width:0} .pc-btns .tbtn{min-width:0} .pc-skins .tag-chip{white-space:normal;word-break:break-all} .filter-panel{max-width:100%} .frow{min-width:0} .fchip{max-width:100%;white-space:normal;word-break:break-all} .m-sortbar,.table-mode-bar{min-width:0;max-width:100%} .fc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:2px 0 4px} .fcell{position:relative;overflow:hidden;background:linear-gradient(145deg,var(--card2),var(--card));border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-width:0;display:flex;flex-direction:column;gap:5px;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease} .fcell:hover{transform:translateY(-2px);border-color:rgba(246,185,59,.5);box-shadow:0 6px 18px rgba(15,23,42,.12)} body.dark .fcell:hover{box-shadow:0 6px 18px rgba(0,0,0,.35)} .fcell.wide{grid-column:1/-1} .fc-k{font-size:11px;letter-spacing:.02em;color:var(--muted);font-weight:500;line-height:1.2} .fc-v{font-size:15px;font-weight:700;color:var(--text);word-break:break-all;line-height:1.35;font-variant-numeric:tabular-nums} .fc-chips{display:flex;flex-wrap:wrap;gap:6px} @media(max-width:1100px){.fc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}} @media(max-width:760px){.fc-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px} .fcell{padding:9px 10px} .fc-v{font-size:14px}} @media(prefers-reduced-motion:reduce){.fcell{transition:none}} ';
    document.head.appendChild(st);
  })();
  function onSale(){ return store.products.filter(function(p){ return p.status==='on'; }); }
  function visibleCols(){
    var keys=[];
    var flist=(typeof FIELDS!=='undefined') ? FIELDS : [];
    flist.forEach(function(fd){ if(fd.show !== false && !fd.adminOnly){ keys.push(fd.key); } });
    return keys;
  }
  function splitChips(s){ if(!s){return[];} return String(s).split(/[,，、;；\s]+/).filter(function(x){return x;}); }
  // [重构] 价格算法统一在服务端 calcTotalServer 计算并随数据下发（含后台 state），
  // 前端仅读取 p.total，删除原先与服务端重复且易漂移的实现。
  function calcTotal(p){
    return (p && p.total) ? p.total : '';
  }
  window.calcTotal=calcTotal;
  function maskDisplay(name){ return (typeof maskName==='function')?maskName(name):name; }
  var sortState={key:null,dir:0};
  function sortVal(k,p){
    if(k==='id'){ var idn=parseInt(String(p.id||'').replace(/\D/g,''),10); return isNaN(idn)?null:idn; }
    if(k==='total'){ var t=calcTotal(p); var m2=String(t||'').match(/\d+(?:\.\d+)?/); return m2?parseFloat(m2[1]):null; }
    var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
    var v=(p.fields||{})[k];
    var s=String(v===undefined||v===null?'':v).trim();
    if(!s){ return null; }
    if(fd && (fd.multi||fd.textarea)){ return splitChips(s).length; }
    if(/满/.test(s) && !/\d/.test(s)){ return 9999; }
    var num=null;
    if(fd && fd.key==='coinRate'){
      var m=s.match(/[:：比]\s*(\d+(?:\.\d+)?)/);
      if(m){ num=parseFloat(m[1]); }
      else { num=parseFloat(s.replace(/[^\d.]/g,'')); }
    } else {
      var m3=s.match(/\d+(?:\.\d+)?/);
      if(m3){ num=parseFloat(m3[0]); }
    }
    return (num===null||isNaN(num))?null:num;
  }
  function cmp(a,b){
    var va=sortVal(sortState.key,a);
    var vb=sortVal(sortState.key,b);
    if(va===null&&vb===null){ return 0; }
    if(va===null){ return 1; }
    if(vb===null){ return -1; }
    return sortState.dir===1 ? (va<vb?1:(va>vb?-1:0)) : (va<vb?-1:(va>vb?1:0));
  }
  function tableSort(k){
    if(sortState.key===k){
      sortState.dir = sortState.dir===1 ? -1 : (sortState.dir===-1 ? 0 : 1);
    } else {
      sortState.key=k;
      sortState.dir=1;
    }
    if(sortState.dir===0){ sortState.key=null; }
    renderFrontend();
  }
  function applySort(){
    if(!sortState.key){ return; }
    var grid=document.getElementById('productGrid');
    var list=window.__filteredList;
    if(!grid || !list || !list.length){ return; }
    grid.innerHTML=list.slice().sort(cmp).map(cardHTML).join('');
  }
  function freezeOffsets(keys){
    var offs={};
    var narrow=isNarrowPc();
    var left=narrow?130:150;
    keys.forEach(function(k){
      var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
      if(fd && fd.frozen){ offs[k]=left; left+=narrow?100:110; }
    });
    window.__freezeOffsets=offs;
    return offs;
  }
  function buildTcols(keys){
    var narrow=isNarrowPc();
    var t=narrow?'130px ':'150px ';
    keys.forEach(function(k){
      var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
      if(fd && fd.frozen){ t+=narrow?'100px ':'110px '; }
      else { t += (fd&&(fd.multi||fd.textarea)) ? (narrow?'minmax(130px,2fr) ':'minmax(150px,2fr) ') : (narrow?'minmax(64px,1fr) ':'minmax(72px,1fr) '); }
    });
    t+=narrow?'90px 140px':'110px 150px';
    return t;
  }
  function buildTmin(keys){
    var narrow=isNarrowPc();
    var m=narrow?130:150;
    keys.forEach(function(k){
      var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
      if(fd && fd.frozen){ m+=narrow?100:110; }
      else { m += (fd&&(fd.multi||fd.textarea)) ? (narrow?130:150) : (narrow?64:72); }
    });
    return m+(narrow?90+140:110+150);
  }
  function chipCls(fd){
    var lbl=fd?(fd.label||''):'';
    if(lbl.indexOf('红皮')>-1){ return 'tag-chip tag-red'; }
    if(lbl.indexOf('刀皮')>-1){ return 'tag-chip tag-gold'; }
    return 'tag-chip';
  }
  function tableRowHTML(p){
    var keys=window.__visibleCols||[];
    var f=p.fields||{};
    var total=calcTotal(p);
    var offs=window.__freezeOffsets||{};
    var cells='<div class="tcell t-id t-freeze" style="left:0"><div class="t-idwrap"><span class="t-num">'+escFn(p.id)+'</span><span class="t-name">'+escFn(maskDisplay(p.name))+'</span>'+(p.pinned?'<span class="tag-chip">📌 置顶</span>':'')+(p.highlight?'<span class="tag-chip tag-gold">⭐ 高亮</span>':'')+'</div></div>';
    keys.forEach(function(k){
      var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
      var v=f[k];
      if(v===undefined||v===null){ v=''; }
      var skinLike=fd&&(fd.multi||fd.textarea);
      var inner= skinLike&&v ? splitChips(String(v)).map(function(t){ return '<span class="'+chipCls(fd)+'">'+escFn(t)+'</span>'; }).join('') : escFn(v);
      var fz=(offs[k]!==undefined);
      cells+='<div class="tcell'+(fz?' t-freeze':'')+'"'+(fz?' style="left:'+offs[k]+'px"':'')+' title="'+(fd?escFn(fullLabel(fd)):'')+'">'+inner+'</div>';
    });
    cells+='<div class="tcell t-total t-freeze-r" style="right:150px">'+(total?escFn(total):'')+'</div>';
    var allKeys=visibleCols();
    var hiddenKeys=allKeys.filter(function(k){ return keys.indexOf(k)===-1; }).filter(function(k){
      var v=f[k]; return v!==undefined && v!==null && String(v).trim()!=='';
    });
    var showDetailBtn=isNarrowPc() && hiddenKeys.length>0;
    var isPcOpen=!!pcOpen[p.id];
    cells+='<div class="tcell t-act t-freeze-r" style="right:0">'
      +'<button type="button" class="tbtn" onclick="copyId(\''+p.id+'\')">复制编号</button>'
      +'<button type="button" class="tbtn ghost" onclick="copyAll(\''+p.id+'\')">全部信息</button>'
      +(showDetailBtn?'<button type="button" class="tbtn ghost" onclick="togglePcDetail(\''+p.id+'\')">详情 '+(isPcOpen?'收起':'展开')+'</button>':'')
      +'</div>';
    var out='<div class="trow'+(p.highlight?' highlight':'')+'" style="min-width:'+window.__tmin+'px">'+cells+'</div>';
    if(showDetailBtn && isPcOpen){
      var detail='';
      hiddenKeys.forEach(function(k){
        var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
        var v=f[k];
        var skinLike=fd&&(fd.multi||fd.textarea);
        var vHtml=skinLike ? splitChips(String(v)).map(function(t){ return '<span class="'+chipCls(fd)+'">'+escFn(t)+'</span>'; }).join('') : escFn(v);
        detail+='<div class="tdetail-item"><span class="tdetail-k">'+escFn(fd?(fd.short||fd.label):k)+'</span><span class="tdetail-v">'+vHtml+'</span></div>';
      });
      out+='<div class="tdetail"><div class="tdetail-grid">'+detail+'</div></div>';
    }
    return out;
  }
  function mSummary(p){
    var f=p.fields||{};
    var parts=[];
    if(f.level){ parts.push('Lv.'+f.level); }
    if(f.rank){ parts.push(f.rank); }
    if(f.kd){ parts.push('KD '+f.kd); }
    if(f.stamina){ parts.push('体力'+f.stamina); }
    if(f.coins){ parts.push(f.coins); }
    if(f.coinRate){ parts.push('比例 '+f.coinRate); }
    var t=calcTotal(p);
    if(t){ parts.push(t); }
    return parts.join(' · ');
  }
  function toggleMcard(topEl){
    var card=topEl.parentNode;
    var d=card.querySelector('.mcard-detail');
    var a=card.querySelector('.m-arrow');
    var open=(d && d.style.display!=='none');
    if(d){ d.style.display = open ? 'none' : 'grid'; }
    if(a){ a.textContent = open ? '展开' : '收起'; }
    var id=card.getAttribute('data-id');
    if(id){ if(open){ delete openIds[id]; } else { openIds[id]=1; } }
  }
  window.toggleMcard=toggleMcard;
  function mobileCardHTML(p){
    var f=p.fields||{};
    var isOpen=openIds[p.id]?true:false;
    var total=calcTotal(p);
    var filled=orderedFilledFields(p);
    var primary=filled.slice(0,PRIMARY_COUNT);
    var rest=filled.slice(PRIMARY_COUNT);
    var html='<div class="mcard-top" onclick="toggleMcard(this)">'
      +'<span class="m-num">'+escFn(p.id)+'</span>'
      +'<span class="m-name">'+escFn(maskDisplay(p.name))+'</span>'
      +(p.pinned?'<span class="tag-chip">📌 置顶</span>':'')
      +(p.highlight?'<span class="tag-chip tag-gold">⭐ 高亮</span>':'')
      +(total?'<span class="tag-chip tag-gold">'+escFn(total)+'</span>':'')
      +(rest.length?'<span class="m-arrow">'+(isOpen?'收起':'展开')+'</span>':'')
      +'</div>'
      +'<div class="fc-grid">'+primary.map(fieldCell).join('')+'</div>';
    if(rest.length){
      html+='<div class="mcard-detail"'+(isOpen?'':' style="display:none"')+'><div class="fc-grid">'+rest.map(fieldCell).join('')+'</div></div>';
    }
    html+='<div class="mcard-btns">'
      +'<button type="button" class="tbtn" onclick="copyId(\''+p.id+'\')">复制编号</button>'
      +'<button type="button" class="tbtn ghost" onclick="copyAll(\''+p.id+'\')">全部信息</button>'
      +'</div>';
    return '<div class="mcard'+(p.highlight?' highlight':'')+'" data-id="'+escFn(p.id)+'">'+html+'</div>';
  }
  /* 按后台字段顺序，收集当前商品中「有值且可见」的字段（含短名/多值类型） */
  function orderedFilledFields(p){
    var f=p.fields||{};
    var out=[];
    (typeof FIELDS!=='undefined'?FIELDS:[]).forEach(function(fd){
      if(!fd || fd.show===false || fd.adminOnly) return;
      var v=f[fd.key];
      if(v===undefined||v===null||String(v).trim()==='') return;
      out.push({ key:fd.key, fd:fd, v:String(v), multi:!!(fd.multi||fd.textarea) });
    });
    return out;
  }
  /* 单个字段格子（现代样式）：标签在上、值在下；多值字段渲染成 chip 并占整行 */
  function fieldCell(it){
    var name=escFn(it.fd.short||it.fd.label||it.key);
    if(it.multi){
      return '<div class="fcell wide"><div class="fc-k">'+name+'</div><div class="fc-chips">'
        +splitChips(it.v).map(function(t){ return '<span class="'+chipCls(it.fd)+'">'+escFn(t)+'</span>'; }).join('')
        +'</div></div>';
    }
    return '<div class="fcell"><div class="fc-k">'+name+'</div><div class="fc-v">'+escFn(it.v)+'</div></div>';
  }
  var PRIMARY_COUNT=9; // 首页直接展示的字段数量，其余进入「详情」展开区
  function pcCardHTML(p){
    var f=p.fields||{};
    var total=calcTotal(p);
    var isOpen=!!pcOpen[p.id];
    var filled=orderedFilledFields(p);
    var primary=filled.slice(0,PRIMARY_COUNT);
    var rest=filled.slice(PRIMARY_COUNT);
    var html='<div class="pc-card'+(p.highlight?' highlight':'')+'" data-id="'+escFn(p.id)+'">'
      +'<div class="pc-top"><span class="pc-num">'+escFn(p.id)+'</span><span class="pc-name">'+escFn(maskDisplay(p.name))+'</span>'
      +(p.pinned?'<span class="pc-chip pin">📌 置顶</span>':'')
      +(p.highlight?'<span class="pc-chip hl">⭐ 高亮</span>':'')
      +(total?'<span class="pc-chip gold">'+escFn(total)+'</span>':'')
      +'</div>'
      +'<div class="fc-grid">'+primary.map(fieldCell).join('')+'</div>'
      +'<div class="pc-btns">'
      +'<button type="button" class="tbtn" onclick="copyId(\''+p.id+'\')">复制编号</button>'
      +'<button type="button" class="tbtn ghost" onclick="copyAll(\''+p.id+'\')">全部信息</button>'
      +(rest.length?'<button type="button" class="tbtn ghost pc-detail-btn" onclick="togglePcDetail(\''+p.id+'\')">详情 '+(isOpen?'收起':'展开')+'</button>':'')
      +'</div>';
    if(rest.length){
      html+='<div class="pc-detail'+(isOpen?' open':'')+'" aria-hidden="'+(isOpen?'false':'true')+'"><div class="pc-detail-inner"><div class="fc-grid">'+rest.map(fieldCell).join('')+'</div></div></div>';
    }
    html+='</div>';
    return html;
  }
  cardHTML=function(p){
    if(window.innerWidth<=760){ return mobileCardHTML(p); }
    if(isCardPc()){ return pcCardHTML(p); }
    return tableRowHTML(p);
  };
  function ensureHeader(){
    var grid=document.getElementById('productGrid');
    if(!grid){ return; }
    var first=grid.firstChild;
    if(first && first.className && String(first.className).indexOf('thead')>-1){ return; }
    if(!grid.querySelector('.trow')){ return; }
    var keys=window.__visibleCols||[];
    var offs=window.__freezeOffsets||{};
    var html='<div class="tcell th th-sort t-freeze" style="left:0" data-key="id">账号'+(sortState.key==='id'?(sortState.dir===1?' ▾':' ▴'):'')+'</div>';
    keys.forEach(function(k){
      var fd=FIELDS.filter(function(x){ return x.key===k; })[0];
      var arrow = sortState.key===k ? (sortState.dir===1?' ▾':' ▴') : '';
      var fz=(offs[k]!==undefined);
      html+='<div class="tcell th th-sort'+(fz?' t-freeze':'')+'"'+(fz?' style="left:'+offs[k]+'px"':'')+' data-key="'+escFn(k)+'">'+(fd?escFn(fd.short||fd.label):escFn(k))+arrow+'</div>';
    });
    html+='<div class="tcell th th-sort t-freeze-r" style="right:150px" data-key="total">合计'+(sortState.key==='total'?(sortState.dir===1?' ▾':' ▴'):'')+'</div>';
    html+='<div class="tcell th t-freeze-r" style="right:0">操作</div>';
    var h=document.createElement('div');
    h.className='trow thead';
    h.style.minWidth=window.__tmin+'px';
    h.innerHTML=html;
    grid.insertBefore(h, grid.firstChild);
  }
  function buildSortBar(){
    var bar=document.getElementById('mSortBar');
    if(!bar){
      var anchor=document.getElementById('filterPanel') || document.querySelector('.toolbar');
      if(!anchor){ return; }
      bar=document.createElement('div');
      bar.id='mSortBar';
      bar.className='m-sortbar';
      anchor.parentNode.insertBefore(bar, anchor.nextSibling);
      bar.addEventListener('click', function(e){
        var t=e.target;
        while(t && t!==bar && !(t.className && String(t.className).indexOf('ms-chip')>-1)){ t=t.parentNode; }
        if(!t || t===bar){ return; }
        var k=t.getAttribute('data-key');
        if(k===null){ return; }
        if(k==='none'){ sortState.key=null; sortState.dir=0; }
        else if(sortState.key===k){ sortState.dir = sortState.dir===1 ? -1 : 1; }
        else { sortState.key=k; sortState.dir=1; }
        renderFrontend();
      });
    }
    var opts=[['none','默认'],['total','合计'],['coins','哈夫币'],['level','等级'],['coinRate','比例'],['armor','六甲'],['helm','六头'],['aw','aw子弹'],['kd','KD']];
    var html='';
    opts.forEach(function(o){
      var active=(o[0]!=='none'&&sortState.key===o[0])||(o[0]==='none'&&!sortState.key);
      var arrow=active&&o[0]!=='none'?(sortState.dir===1?' ▾':' ▴'):'';
      html+='<button type="button" class="ms-chip'+(active?' active':'')+'" data-key="'+o[0]+'">'+o[1]+arrow+'</button>';
    });
    bar.innerHTML=html;
    bar.style.display='';
  }
  (function(){
    var grid=document.getElementById('productGrid');
    if(!grid){ return; }
    grid.addEventListener('click', function(e){
      var t=e.target;
      while(t && t!==grid && !(t.className && String(t.className).indexOf('th')>-1)){ t=t.parentNode; }
      if(!t || t===grid){ return; }
      var k=t.getAttribute('data-key');
      if(k===null){ return; }
      tableSort(k);
    });
  })();
  function splitColumns(){
    if(!isCardPc()) return;
    var grid=document.getElementById('productGrid'); if(!grid) return;
    if(window.innerWidth<=1100) return;
    if(grid.querySelector('.pc-col')) return;
    var cards=Array.prototype.slice.call(grid.querySelectorAll('.pc-card'));
    if(cards.length<=1) return;
    var left=document.createElement('div'); left.className='pc-col';
    var right=document.createElement('div'); right.className='pc-col';
    cards.forEach(function(c,i){ if(i%2===0){ left.appendChild(c); } else { right.appendChild(c); } });
    grid.innerHTML='';
    grid.appendChild(left);
    if(right.childNodes.length){ grid.appendChild(right); }
  }
  window.__pageSize=window.__pageSize||40;
  window.loadMoreProducts=function(){ window.__pageSize=(window.__pageSize||40)+40; renderFrontend(); };
  function ensureLoadMore(){
    var old=document.getElementById('loadMoreBar'); if(old) old.remove();
    if(!isCardPc()) return;
    var grid=document.getElementById('productGrid'); if(!grid) return;
    var list=window.__filteredList||[];
    var total=list.length; if(!total) return;
    var cards=grid.querySelectorAll('.pc-card');
    var shown=cards.length;
    if(shown>window.__pageSize){
      for(var i=cards.length-1;i>=window.__pageSize;i--){ cards[i].remove(); }
      shown=window.__pageSize;
    }
    if(shown>=total) return;
    var bar=document.createElement('div'); bar.id='loadMoreBar'; bar.className='load-more-bar';
    bar.innerHTML='<button type="button" class="ms-chip" onclick="loadMoreProducts()">加载更多（已显示 '+shown+' / 共 '+total+' 个）</button>';
    grid.parentNode.insertBefore(bar, grid.nextSibling);
  }
  function ensureViewBar(){
    var prevWrap=document.querySelector('.table-mode-bar');
    if(prevWrap) prevWrap.remove();
    if(window.innerWidth<=760) return;
    var bar=document.getElementById('mSortBar');
    var anchor=bar || document.querySelector('.toolbar');
    if(!anchor) return;
    var wrap=document.createElement('div');
    wrap.className='table-mode-bar';
    if(viewMode==='card'){
      wrap.innerHTML='<button type="button" class="ms-chip" id="viewModeBtn">切换到表格</button><span class="table-mode-note">当前：卡片，点详情看其余字段</span>';
    } else {
      wrap.innerHTML='<button type="button" class="ms-chip" id="viewModeBtn">切换到卡片</button><button type="button" class="ms-chip" id="tableModeBtn">'+(tableMode==='all'?'只看关键列':'显示全部列')+'</button><span class="table-mode-note">'+(tableMode==='all'?'当前：表格全部列，表格较宽':'当前：表格关键列，点详情看其余字段')+'</span>';
    }
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    var vb=document.getElementById('viewModeBtn');
    if(vb) vb.addEventListener('click', function(){ window.toggleViewMode(); });
    var tb=document.getElementById('tableModeBtn');
    if(tb) tb.addEventListener('click', function(){ window.toggleTableMode(); });
  }
  // [重构] 原实现调用 prevRender() 两次造成 grid 重复渲染两次；拆为准备/后处理两阶段。
  // 列配置必须在 grid 渲染前算好（cardHTML 依赖 __visibleCols/__tmin/__freezeOffsets）。
  function prepareCols(){
    var keys=displayCols();
    window.__visibleCols=keys;
    window.__tmin=buildTmin(keys);
    freezeOffsets(keys);
    var grid=document.getElementById('productGrid');
    if(grid){ grid.style.setProperty('--tcols', buildTcols(keys)); }
  }
  function postRender(){
    applySort();
    ensureHeader();
    buildSortBar();
    ensureViewBar();
    var _g=document.getElementById('productGrid');
    if(_g){ if(isCardPc()){ _g.classList.add('pc-cards'); } else { _g.classList.remove('pc-cards'); } }
    var _si=document.getElementById('searchInput'); var _q=_si?String(_si.value||''):''; if(_q!==window.__lastPageQuery){ window.__pageSize=40; window.__lastPageQuery=_q; }
    ensureLoadMore();
    splitColumns();
  }
  addHook('renderPrepare', prepareCols);
  addHook('renderPost', postRender);
  var si=document.getElementById('searchInput');
  if(si){ si.addEventListener('input', renderFrontend); }
  var rt=null, lastW=window.innerWidth;
  window.addEventListener('resize', function(){
    if(rt){ clearTimeout(rt); }
    rt=setTimeout(function(){
      if(window.innerWidth===lastW){ return; }
      lastW=window.innerWidth;
      renderFrontend();
    }, 150);
  });
  renderFrontend();
})();

/* ===== popup-adapt-v1 公告弹窗（后台可开关，内容支持 HTML） ===== */
(function(){
  if(window.__popupReady){ return; }
  window.__popupReady = true;
  var shown=false;
  function remember(){
    try{ localStorage.setItem('shop_popup_hidden', String(Date.now())); }catch(e){}
  }
  function isRemembered(){
    try{
      var v=localStorage.getItem('shop_popup_hidden');
      if(!v){ return false; }
      var t=parseInt(v,10);
      if(isNaN(t)){ return false; }
      return (Date.now()-t) < 7*24*3600*1000;
    }catch(e){ return false; }
  }
  (function(){
    if(document.getElementById('popupCss')){ return; }
    var st=document.createElement('style');
    st.id='popupCss';
    st.textContent='#annPop{position:fixed;inset:0;z-index:110;background:rgba(5,8,14,.6);display:none;align-items:center;justify-content:center;padding:16px}.ann-card{width:100%;max-width:420px;max-height:80vh;overflow-y:auto;background:#ffffff;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:18px 20px;box-shadow:0 20px 60px rgba(0,0,0,.3);color:#1f2937}.ann-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:16px;font-weight:700}.ann-close{background:transparent;border:none;color:#6b7280;font-size:18px;cursor:pointer;line-height:1;padding:4px}.ann-body{font-size:14px;line-height:1.8;word-break:break-word}.ann-body a{color:#d97706}.ann-foot{margin-top:12px;display:flex;align-items:center;gap:8px;font-size:12.5px;color:#6b7280}body.dark .ann-card{background:#131a28;border-color:rgba(255,255,255,.08);color:#eef2f9}body.dark .ann-body a{color:#f6b93b}';
    document.head.appendChild(st);
  })();
  function hidePopup(){
    var host=document.getElementById('annPop');
    var nm=document.getElementById('annNoMore');
    if(nm && nm.checked){ remember(); }
    if(host){ host.style.display='none'; }
  }
  function buildPopup(){
    if(document.body.className.indexOf('admin-mode')>-1){ return; }
    var host=document.getElementById('annPop');
    if(!host){
      host=document.createElement('div');
      host.id='annPop';
      host.innerHTML='<div class="ann-card">'
        +'<div class="ann-head"><span>📢 公告</span><button type="button" class="ann-close" id="annClose">✕</button></div>'
        +'<div class="ann-body" id="annBody"></div>'
        +'<div class="ann-foot"><label><input type="checkbox" id="annNoMore"> 7天内不再提示</label></div>'
        +'</div>';
      document.body.appendChild(host);
      var close=document.getElementById('annClose');
      if(close){ close.addEventListener('click', hidePopup); }
      host.addEventListener('click', function(e){ if(e.target===host){ hidePopup(); } });
    }
    if(shown){ return; }
    var p=(typeof store!=='undefined'&&store.settings&&store.settings.popup)?store.settings.popup:null;
    if(!p || p.enabled===false || !p.content){ host.style.display='none'; return; }
    if(isRemembered()){ host.style.display='none'; return; }
    var body=document.getElementById('annBody');
    if(body){ body.innerHTML=sanitizeHTML(p.content); }
    host.style.display='flex';
    shown=true;
  }
  function previewPop(){
    var c=document.getElementById('popContent');
    var body=document.getElementById('annBody');
    var host=document.getElementById('annPop');
    if(c && body && host){
      body.innerHTML=sanitizeHTML(c.value);
      host.style.display='flex';
    }
  }
  function buildAnnCard(){
    var sec=document.getElementById('view-settings');
    if(!sec || document.getElementById('annAdminCard')){ return; }
    var card=document.createElement('div');
    card.className='set-card';
    card.id='annAdminCard';
    card.innerHTML='<h4>📢 公告弹窗</h4>'
      +'<div class="form-group wide" style="margin-bottom:12px"><label>弹窗内容（支持 HTML）</label>'
      +'<textarea id="popContent" rows="6" placeholder="例：&lt;b&gt;新号到店&lt;/b&gt;&lt;br&gt;今晚 8 点统一发货。"></textarea>'
      +'<p class="form-hint">支持 &lt;b&gt;加粗&lt;/b&gt;、&lt;br&gt;换行、&lt;a href=&quot;链接&quot;&gt;文字&lt;/a&gt;、&lt;span style=&quot;color:red&quot;&gt;颜色&lt;/span&gt; 等 HTML 标签。</p></div>'
      +'<label class="check-line" style="margin-bottom:12px"><input type="checkbox" id="popEnabled" checked> 前台开启公告弹窗</label>'
      +'<div class="btn-row">'
      +  '<button type="button" class="btn btn-primary" id="popSave">💾 保存公告设置</button>'
      +  '<button type="button" class="btn ghost" id="popPreview">👁️ 预览</button>'
      +'</div>';
    sec.insertBefore(card, sec.lastElementChild);
    var sb=document.getElementById('popSave');
    if(sb){ sb.addEventListener('click', savePop); }
    var pv=document.getElementById('popPreview');
    if(pv){ pv.addEventListener('click', previewPop); }
  }
  function fillPopUI(){
    var p=(typeof store!=='undefined'&&store.settings&&store.settings.popup)?store.settings.popup:null;
    var c=document.getElementById('popContent'); if(c){ c.value=(p&&p.content)||''; }
    var e=document.getElementById('popEnabled'); if(e){ e.checked=!(p&&p.enabled===false); }
  }
  function savePop(){
    var pop={
      enabled: document.getElementById('popEnabled').checked,
      content: String(document.getElementById('popContent').value||'').trim()
    };
    api('/api/admin/settings',{method:'PUT',body:JSON.stringify({popup:pop})}).then(function(){
      return refreshState();
    }).then(function(){ toast('公告设置已保存 ✅'); }).catch(function(e){ toast(e.message); });
  }
  // [重构] 用统一钩子替代函数包裹
  addHook('settings', function(){ buildAnnCard(); fillPopUI(); });
  addHook('renderPost', buildPopup);
  buildAnnCard();
  buildPopup();
})();

/* ===== agree-adapt-v1 阅读协议（后台自定义，同意后才能浏览） ===== */
(function(){
  if(window.__agreeReady){ return; }
  window.__agreeReady = true;
  var shown=false;
  function sig(c){
    var s=0;
    for(var i=0;i<c.length;i++){ s=(s*31+c.charCodeAt(i))%1000000007; }
    return String(c.length)+'-'+s;
  }
  function isAgreed(c){
    try{ return localStorage.getItem('shop_agreed')===sig(c); }catch(e){ return false; }
  }
  (function(){
    if(document.getElementById('agreeCss')){ return; }
    var st=document.createElement('style');
    st.id='agreeCss';
    st.textContent='#agreeModal{position:fixed;inset:0;z-index:200;background:rgba(5,8,14,.85);display:none;align-items:center;justify-content:center;padding:16px}.agree-card{width:100%;max-width:560px;max-height:85vh;display:flex;flex-direction:column;background:#ffffff;border:1px solid rgba(15,23,42,.10);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);color:#1f2937;overflow:hidden}.agree-head{padding:16px 20px;font-size:16px;font-weight:700;border-bottom:1px solid rgba(15,23,42,.08)}.agree-body{padding:16px 20px;overflow-y:auto;font-size:14px;line-height:1.9;word-break:break-word;flex:1}.agree-body a{color:#d97706}.agree-hint{padding:0 20px 10px;font-size:12.5px;color:#dc2626;display:none}.agree-btns{display:flex;gap:10px;padding:14px 20px;border-top:1px solid rgba(15,23,42,.08)}.agree-btns button{flex:1;border-radius:10px;padding:11px 14px;font-size:14px;cursor:pointer;font-family:inherit}.agree-reject{background:transparent;border:1px solid rgba(15,23,42,.15);color:#6b7280}.agree-accept{background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;border:none;font-weight:700}body.dark .agree-card{background:#131a28;border-color:rgba(255,255,255,.08);color:#eef2f9}body.dark .agree-head{border-bottom-color:rgba(255,255,255,.08)}body.dark .agree-body a{color:#f6b93b}body.dark .agree-btns{border-top-color:rgba(255,255,255,.08)}body.dark .agree-reject{border-color:rgba(255,255,255,.15);color:#98a2b8}';
    document.head.appendChild(st);
  })();
  function hideAgree(){
    var m=document.getElementById('agreeModal');
    if(m){ m.style.display='none'; }
    document.body.style.overflow='';
  }
  function buildAgree(){
    if(document.body.className.indexOf('admin-mode')>-1){ return; }
    var host=document.getElementById('agreeModal');
    if(!host){
      host=document.createElement('div');
      host.id='agreeModal';
      host.innerHTML='<div class="agree-card">'
        +'<div class="agree-head" id="agreeTitle">📜 用户协议</div>'
        +'<div class="agree-body" id="agreeBody"></div>'
        +'<div class="agree-hint" id="agreeHint">您需要同意本协议后才能继续浏览</div>'
        +'<div class="agree-btns">'
        +  '<button type="button" class="agree-reject" id="agreeReject">不同意</button>'
        +  '<button type="button" class="agree-accept" id="agreeAccept">我接受并继续</button>'
        +'</div>'
        +'</div>';
      document.body.appendChild(host);
      var acc=document.getElementById('agreeAccept');
      if(acc){ acc.addEventListener('click', function(){
        var p=(typeof store!=='undefined'&&store.settings&&store.settings.agreement)?store.settings.agreement:null;
        if(p && p.content){ try{ localStorage.setItem('shop_agreed', sig(p.content)); }catch(e){} }
        hideAgree();
      }); }
      var rej=document.getElementById('agreeReject');
      if(rej){ rej.addEventListener('click', function(){
        var h=document.getElementById('agreeHint');
        if(h){ h.style.display='block'; }
      }); }
    }
    if(shown){ return; }
    var p=(typeof store!=='undefined'&&store.settings&&store.settings.agreement)?store.settings.agreement:null;
    if(!p || p.enabled===false || !p.content){ host.style.display='none'; return; }
    if(isAgreed(p.content)){ host.style.display='none'; return; }
    var t=document.getElementById('agreeTitle');
    if(t){ t.textContent='📜 '+(p.title||'用户协议'); }
    var b=document.getElementById('agreeBody');
    if(b){ b.innerHTML=sanitizeHTML(p.content); }
    var h2=document.getElementById('agreeHint');
    if(h2){ h2.style.display='none'; }
    host.style.display='flex';
    document.body.style.overflow='hidden';
    shown=true;
  }
  function previewAgree(){
    var c=document.getElementById('agrContent');
    var tt=document.getElementById('agrTitle');
    var body=document.getElementById('agreeBody');
    var head=document.getElementById('agreeTitle');
    var host=document.getElementById('agreeModal');
    if(!c || !host){ return; }
    if(head){ head.textContent='📜 '+(tt&&tt.value?tt.value.trim():'用户协议'); }
    if(body){ body.innerHTML=sanitizeHTML(c.value); }
    host.style.display='flex';
    document.body.style.overflow='hidden';
  }
  function buildAgrCard(){
    var sec=document.getElementById('view-settings');
    if(!sec || document.getElementById('agrAdminCard')){ return; }
    var card=document.createElement('div');
    card.className='set-card';
    card.id='agrAdminCard';
    card.innerHTML='<h4>📜 阅读协议</h4>'
      +'<div class="form-grid">'
      +  '<div class="form-group"><label>协议标题</label><input type="text" id="agrTitle" placeholder="如：用户协议 / 租号须知"></div>'
      +  '<div class="form-group"><label>启用</label><label class="check-line" style="margin-top:8px"><input type="checkbox" id="agrEnabled" checked> 前台开启阅读协议</label></div>'
      +'</div>'
      +'<div class="form-group wide" style="margin-bottom:12px"><label>协议内容（支持 HTML / 多行文本）</label>'
      +'<textarea id="agrContent" rows="8" placeholder="第 1 条：……&#10;第 2 条：……"></textarea>'
      +'<p class="form-hint">支持 &lt;b&gt;加粗&lt;/b&gt;、&lt;br&gt;换行、&lt;a href=&quot;链接&quot;&gt;文字&lt;/a&gt; 等 HTML 标签；纯文本直接换行即可。内容修改后，已同意的访客会被要求重新同意。</p></div>'
      +'<div class="btn-row">'
      +  '<button type="button" class="btn btn-primary" id="agrSave">💾 保存协议设置</button>'
      +  '<button type="button" class="btn ghost" id="agrPreview">👁️ 预览（访客视角）</button>'
      +'</div>';
    sec.insertBefore(card, sec.lastElementChild);
    var sb=document.getElementById('agrSave');
    if(sb){ sb.addEventListener('click', saveAgr); }
    var pv=document.getElementById('agrPreview');
    if(pv){ pv.addEventListener('click', previewAgree); }
  }
  function fillAgrUI(){
    var p=(typeof store!=='undefined'&&store.settings&&store.settings.agreement)?store.settings.agreement:null;
    var t=document.getElementById('agrTitle'); if(t){ t.value=(p&&p.title)||''; }
    var c=document.getElementById('agrContent'); if(c){ c.value=(p&&p.content)||''; }
    var e=document.getElementById('agrEnabled'); if(e){ e.checked=!(p&&p.enabled===false); }
  }
  function saveAgr(){
    var agr={
      enabled: document.getElementById('agrEnabled').checked,
      title: String(document.getElementById('agrTitle').value||'').trim(),
      content: String(document.getElementById('agrContent').value||'').trim()
    };
    api('/api/admin/settings',{method:'PUT',body:JSON.stringify({agreement:agr})}).then(function(){
      return refreshState();
    }).then(function(){ toast('协议设置已保存 ✅'); }).catch(function(e){ toast(e.message); });
  }
  // [重构] 用统一钩子替代函数包裹
  addHook('settings', function(){ buildAgrCard(); fillAgrUI(); });
  addHook('renderPost', buildAgree);
  buildAgrCard();
  buildAgree();
})();

/* ===== webdav-adapt: WebDAV 异地备份设置 ===== */
(function(){
  if(window.__webdavReady){ return; }
  window.__webdavReady=true;
  var escFn=(typeof esc==='function')?esc:function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  if(!document.getElementById('wdVerCss')){
    var vst=document.createElement('style');
    vst.id='wdVerCss';
    vst.textContent='.wd-vlist{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto}'
      +'.wd-vrow{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:10px 12px}'
      +'.wd-vinfo{flex:1;min-width:150px}'
      +'.wd-vname{font-size:13px;font-weight:700;word-break:break-all}'
      +'.wd-vmeta{font-size:11.5px;color:var(--muted);margin-top:3px}'
      +'.wd-vbtns{display:flex;gap:7px;flex-wrap:wrap}';
    document.head.appendChild(vst);
  }
  function buildCard(){
    var sec=document.getElementById('view-settings');
    if(!sec || document.getElementById('webdavCard')){ return; }
    var card=document.createElement('div');
    card.className='set-card';
    card.id='webdavCard';
    card.setAttribute('data-set-group','backup'); // 与「数据备份」归入同一导航分类
    card.innerHTML='<h4>☁️ WebDAV 异地备份 <span style="font-size:12px;color:var(--muted);font-weight:400">· 自动上传每日快照</span></h4>'
      +'<p class="form-hint" style="margin-bottom:12px">配置支持 WebDAV 的网盘（坚果云 / Nextcloud / 群晖 NAS 等）。<b>每次生成新备份后会自动上传</b>，实现异地容灾。密码只保存在服务器，不会下发到浏览器；留空表示不修改已保存的密码。</p>'
      +'<div class="form-grid">'
      +  '<div class="form-group wide"><label>WebDAV 地址</label><input type="text" id="wdUrl" placeholder="如：https://dav.jianguoyun.com/dav/"></div>'
      +  '<div class="form-group"><label>账号</label><input type="text" id="wdUser" placeholder="WebDAV 用户名" autocomplete="off"></div>'
      +  '<div class="form-group"><label>密码 / 应用密码</label><input type="password" id="wdPass" placeholder="留空=保持原密码" autocomplete="new-password"></div>'
      +  '<div class="form-group wide"><label>远程目录（不存在会自动创建）</label><input type="text" id="wdDir" placeholder="shop-backups"></div>'
      +'</div>'
      +'<label class="check-line" style="margin:4px 0 12px"><input type="checkbox" id="wdEnabled" checked> 启用自动备份到 WebDAV</label>'
      +'<div id="wdStatus" style="font-size:12.5px;color:var(--muted);margin-bottom:12px;line-height:1.7"></div>'
      +'<div class="btn-row">'
      +  '<button type="button" class="btn small btn-primary" id="wdSave">💾 保存配置</button>'
      +  '<button type="button" class="btn small" id="wdTest">🔌 测试连接</button>'
      +  '<button type="button" class="btn small" id="wdSync">⬆️ 立即上传</button>'
      +'</div>'
      +'<div class="wd-versions" style="margin-top:18px;border-top:1px solid var(--line);padding-top:14px">'
      +  '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
      +    '<h5 style="margin:0;font-size:13.5px;flex:1">📚 已上传的版本</h5>'
      +    '<button type="button" class="btn small ghost" id="wdRefreshList">🔄 刷新列表</button>'
      +  '</div>'
      +  '<div id="wdVersionList"><span style="font-size:12.5px;color:var(--muted)">点「刷新列表」查看网盘中的备份版本</span></div>'
      +'</div>';
    sec.insertBefore(card, sec.lastElementChild);
    var sv=document.getElementById('wdSave'); if(sv){ sv.addEventListener('click', saveWd); }
    var ts=document.getElementById('wdTest'); if(ts){ ts.addEventListener('click', testWd); }
    var sy=document.getElementById('wdSync'); if(sy){ sy.addEventListener('click', syncWd); }
    var rf=document.getElementById('wdRefreshList'); if(rf){ rf.addEventListener('click', function(){ loadVersionList(true); }); }
  }
  function fmtSize(n){ n=Number(n)||0; return n>=1048576?(n/1048576).toFixed(1)+' MB':(n>=1024?(n/1024).toFixed(0)+' KB':n+' B'); }
  function loadVersionList(showToast){
    var host=document.getElementById('wdVersionList'); if(!host){ return; }
    host.innerHTML='<span style="font-size:12.5px;color:var(--muted)">加载中…</span>';
    api('/api/admin/webdav/backups',{method:'GET'}).then(function(r){
      if(!r.ok){ throw new Error(r.msg||'加载失败'); }
      var files=r.files||[];
      if(!files.length){ host.innerHTML='<span style="font-size:12.5px;color:var(--muted)">网盘中暂无备份版本，点「立即上传」创建第一个</span>'; return; }
      host.innerHTML='<div class="wd-vlist">'+files.map(function(f){
        var dt=f.mtime?new Date(f.mtime):null;
        var date=dt?dt.toLocaleString('zh-CN'):escFn(f.stamp||'');
        var isLatest=false;
        return '<div class="wd-vrow">'
          +'<div class="wd-vinfo"><div class="wd-vname">📦 '+escFn(f.name)+(isLatest?'':'')+'</div>'
          +'<div class="wd-vmeta">'+escFn(date)+' · '+fmtSize(f.size)+'</div></div>'
          +'<div class="wd-vbtns">'
          +  '<button type="button" class="fa-mv wd-dl" data-name="'+escFn(f.name)+'">⬇ 下载到本地</button>'
          +  '<button type="button" class="fa-mv wd-rs" data-name="'+escFn(f.name)+'" style="color:var(--red);border-color:rgba(248,113,113,.35)">↺ 恢复此版本</button>'
          +'</div></div>';
      }).join('')+'</div>';
      // 标记第一项为最新
      var first=host.querySelector('.wd-vname'); if(first){ first.innerHTML+=' <span style="font-size:10.5px;color:var(--gold);border:1px solid rgba(246,185,59,.4);border-radius:5px;padding:0 6px">最新</span>'; }
      host.querySelectorAll('.wd-dl').forEach(function(b){ b.addEventListener('click', function(){ downloadVersion(b.getAttribute('data-name'), b); }); });
      host.querySelectorAll('.wd-rs').forEach(function(b){ b.addEventListener('click', function(){ restoreVersion(b.getAttribute('data-name')); }); });
      if(showToast){ toast('已加载 '+files.length+' 个版本'); }
    }).catch(function(e){ host.innerHTML='<span style="font-size:12.5px;color:var(--red)">加载失败：'+escFn(e.message)+'</span>'; });
  }
  function downloadVersion(name, btn){
    if(!btn){ return; }
    var old=btn.textContent; btn.disabled=true; btn.textContent='下载中…';
    api('/api/admin/webdav/download',{method:'POST',body:JSON.stringify({name:name})}).then(function(r){
      toast(r.msg||'已下载'); if(r.name){ toast('已存为本地备份：'+r.name); }
    }).catch(function(e){ toast(e.message); }).finally(function(){ btn.disabled=false; btn.textContent=old; });
  }
  function restoreVersion(name){
    if(!window.confirm('⚠️ 确认恢复到此版本？\n\n「'+name+'」\n\n当前数据会先自动留一份本地快照，然后用该版本覆盖商品、设置与待审核列表。此操作不可撤销（但可从快照或网盘恢复）。')){ return; }
    var host=document.getElementById('wdVersionList');
    if(host){ host.innerHTML='<span style="font-size:12.5px;color:var(--muted)">正在恢复…</span>'; }
    api('/api/admin/webdav/restore',{method:'POST',body:JSON.stringify({name:name})}).then(function(r){
      toast(r.msg||'恢复成功'); return refreshState();
    }).then(function(){ loadVersionList(false); }).catch(function(e){ toast(e.message); loadVersionList(false); });
  }
  function fillUI(){
    buildCard();
    var w=(typeof store!=='undefined'&&store.settings&&store.settings.webdav)?store.settings.webdav:{};
    var u=document.getElementById('wdUrl'); if(u){ u.value=w.url||''; }
    var un=document.getElementById('wdUser'); if(un){ un.value=w.username||''; }
    var d=document.getElementById('wdDir'); if(d){ d.value=w.remoteDir||'shop-backups'; }
    var en=document.getElementById('wdEnabled'); if(en){ en.checked=w.enabled!==false; }
    var pw=document.getElementById('wdPass'); if(pw){ pw.value=''; pw.placeholder=w.hasPassword?'已设置密码，留空保持':'留空=不设置密码'; }
    var st=document.getElementById('wdStatus');
    if(st){
      if(w.lastSyncAt){
        var dt=new Date(w.lastSyncAt);
        var ok=!!w.lastSyncOk;
        st.innerHTML='上次同步：<b style="color:'+(ok?'var(--green)':'var(--red)')+'">'+(ok?'✅ 成功':'❌ 失败')+'</b> · '+escFn(String(dt.toLocaleString('zh-CN')))
          +(w.lastSyncMsg?'<br><span style="color:var(--muted)">'+escFn(w.lastSyncMsg)+'</span>':'')
          +(w.hasPassword?'<br><span style="color:var(--muted)">密码已保存</span>':'');
      } else {
        st.textContent='尚未同步过'+(w.hasPassword?'（密码已保存）':'');
      }
    }
  }
  function collect(){
    return {
      url: String((document.getElementById('wdUrl')||{}).value||'').trim(),
      username: String((document.getElementById('wdUser')||{}).value||'').trim(),
      password: String((document.getElementById('wdPass')||{}).value||''),
      remoteDir: String((document.getElementById('wdDir')||{}).value||'').trim()||'shop-backups',
      enabled: !!(document.getElementById('wdEnabled')&&document.getElementById('wdEnabled').checked)
    };
  }
  function btnBusy(id, on, txt){
    var b=document.getElementById(id); if(!b){ return; }
    b.disabled=!!on;
    if(on){ b.setAttribute('data-txt', b.textContent); b.textContent=txt||'处理中…'; }
    else { var old=b.getAttribute('data-txt'); if(old){ b.textContent=old; b.removeAttribute('data-txt'); } }
  }
  function saveWd(){
    var cfg=collect();
    if(cfg.enabled && !cfg.url){ toast('请填写 WebDAV 地址'); return; }
    api('/api/admin/settings',{method:'PUT',body:JSON.stringify({webdav:cfg})}).then(function(){
      return refreshState();
    }).then(function(){ toast('WebDAV 配置已保存 ✅'); }).catch(function(e){ toast(e.message); });
  }
  function testWd(){
    var cfg=collect();
    if(!cfg.url){ toast('请填写 WebDAV 地址'); return; }
    btnBusy('wdTest',true,'测试中…');
    api('/api/admin/webdav/test',{method:'POST',body:JSON.stringify(cfg)}).then(function(r){
      toast(r.msg||'连接成功'); fillUI();
    }).catch(function(e){ toast(e.message); }).finally(function(){ btnBusy('wdTest',false); });
  }
  function syncWd(){
    btnBusy('wdSync',true,'上传中…');
    api('/api/admin/webdav/sync',{method:'POST',body:'{}'}).then(function(r){
      toast(r.msg||'上传成功'); return refreshState();
    }).then(function(){ fillUI(); loadVersionList(false); }).catch(function(e){ toast(e.message); }).finally(function(){ btnBusy('wdSync',false); });
  }
  var listLoaded=false;
  addHook('settings', function(){
    fillUI();
    // 首次进入设置时加载一次远程版本列表（此后用户可手动刷新）
    if(!listLoaded){ listLoaded=true; setTimeout(function(){ loadVersionList(false); }, 100); }
  });
  buildCard();
})();

/* ===== settings-nav: 设置页左侧分栏导航 =====
 * 自动扫描 view-settings 下所有 .set-card（含各模块动态注入的），生成侧边导航，
 * 点选切换显示、记忆上次位置。窄屏自动变横向标签。 */
(function(){
  if(window.__settingsNavReady){ return; }
  var sec=document.getElementById('view-settings');
  if(!sec || sec.querySelector('.set-nav')){ return; }
  // 等所有动态卡片注入完成后再构建（本 IIFE 在文件末尾，卡片均已存在）
  var cards=[];
  Array.prototype.forEach.call(sec.children, function(c){
    if(c.nodeType===1 && c.classList && c.classList.contains('set-card')){ cards.push(c); }
  });
  if(cards.length<2){ return; }
  window.__settingsNavReady=true;
  var escFn=(typeof esc==='function')?esc:function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };

  if(!document.getElementById('setNavCss')){
    var st=document.createElement('style');
    st.id='setNavCss';
    st.textContent='#view-settings{display:flex;gap:16px;align-items:flex-start}'
      +'.set-nav{flex:0 0 168px;position:sticky;top:112px;display:flex;flex-direction:column;gap:3px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px;box-sizing:border-box}'
      +'.set-nav-title{font-size:11px;color:var(--muted);padding:6px 10px 8px;letter-spacing:.5px}'
      +'.set-nav-item{display:block;width:100%;text-align:left;background:transparent;border:none;border-radius:9px;padding:10px 12px;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit;transition:.15s;line-height:1.3}'
      +'.set-nav-item:hover{background:rgba(246,185,59,.09);color:var(--text)}'
      +'.set-nav-item.active{background:var(--grad);color:#1a1206;font-weight:700;box-shadow:0 3px 10px rgba(255,150,50,.25)}'
      +'body.light .set-nav-item.active{color:#fff}'
      +'.set-content{flex:1;min-width:0}'
      +'.set-content .set-card{margin-bottom:14px}'
      +'.set-content .set-card:last-child{margin-bottom:0}'
      +'@media(max-width:820px){#view-settings{display:block}.set-nav{position:static;flex-direction:row;overflow-x:auto;margin-bottom:13px;padding:6px;-webkit-overflow-scrolling:touch}.set-nav-title{display:none}.set-nav-item{width:auto;white-space:nowrap;flex:0 0 auto;padding:8px 12px}}';
    document.head.appendChild(st);
  }

  // 把「数据备份」与「WebDAV 异地备份」归入同一分类
  cards.forEach(function(c){
    var h4=c.querySelector('h4');
    var t=h4?String(h4.textContent||''):'';
    if(t.indexOf('数据备份')>-1){ c.setAttribute('data-set-group','backup'); }
  });
  // 按 data-set-group 聚合：同组卡片共用一条导航
  var groups=[]; // [{title, cards:[]}]
  var groupMap={};
  cards.forEach(function(c,i){
    var h4=c.querySelector('h4');
    var t=h4?String(h4.textContent||''):('设置 '+(i+1));
    t=t.split('·')[0].replace(/\s+/g,' ').trim()||('设置 '+(i+1));
    var g=c.getAttribute('data-set-group');
    if(g && groupMap[g]!==undefined){
      groupMap[g].cards.push(c);
      return;
    }
    var item={title:t, cards:[c]};
    groups.push(item);
    if(g){ groupMap[g]=item; } // 存对象本身，供同组后续卡片合并
  });
  var nav=document.createElement('aside');
  nav.className='set-nav';
  nav.innerHTML='<div class="set-nav-title">设置分类</div>'+groups.map(function(g,i){
    return '<button type="button" class="set-nav-item" data-i="'+i+'">'+escFn(g.title)+'</button>';
  }).join('');
  var content=document.createElement('div');
  content.className='set-content';
  groups.forEach(function(g){ g.cards.forEach(function(c){ content.appendChild(c); }); });
  sec.appendChild(nav);
  sec.appendChild(content);

  var saved=0;
  try{ saved=parseInt(localStorage.getItem('shop_settings_tab')||'0',10); if(isNaN(saved)){ saved=0; } }catch(e){}
  if(saved<0||saved>=groups.length){ saved=0; }
  function activate(i, skipScroll){
    Array.prototype.forEach.call(nav.querySelectorAll('.set-nav-item'), function(b,j){ b.classList.toggle('active', i===j); });
    groups.forEach(function(g,j){ g.cards.forEach(function(c){ c.style.display=(i===j)?'':'none'; }); });
    try{ localStorage.setItem('shop_settings_tab', String(i)); }catch(e){}
    // 切换分类后滚回顶部，避免停留在上一个分类的滚动位置导致内容被截断
    if(!skipScroll){
      var panel=document.getElementById('adminPanel');
      if(panel){ try{ panel.scrollTop=0; }catch(e){} }
      try{ window.scrollTo(0,0); }catch(e){}
    }
  }
  nav.addEventListener('click', function(e){
    var b=e.target.closest('.set-nav-item');
    if(!b || !nav.contains(b)){ return; }
    activate(parseInt(b.getAttribute('data-i'),10));
  });
  activate(saved);
})();

/* ===== 全部适配模块注册完成后，统一触发一次完整渲染 =====
 * 保证 renderPost 链（悬浮窗/公告/协议/排序条/表头/加载更多等）在首屏全部挂载到位。 */
(function(){
  if(typeof renderFrontend==='function'){ renderFrontend(); }
})();
