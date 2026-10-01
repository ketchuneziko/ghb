/* ==========================================================================
   ЧАСТЬ 19 · СБОРКА: 5 эпизодов (8 сердец) + 7 бонусных мини-игр + финал
   ========================================================================== */

/* --- порядок уровней: сначала сюжет, потом бонус --- */
if(LEVELS.indexOf(L8) < 0) LEVELS.push(L8);      // восьмая мини-игра была потеряна
LEVELS.unshift(EP1, EP2, EP3, EP4, EP5);

const STORY_META = [
  {name:'ШИФР',             short:'ШИФР',     sub:'сдвинь и прочти',   h:1},
  {name:'РИТМ СЕРДЦА',      short:'РИТМ',     sub:'поймай такт',      h:1},
  {name:'ВОСПОМИНАНИЯ',     short:'ПАМЯТЬ',   sub:'три момента',      h:2},
  {name:'ЛАБИРИНТ И ДОЖДЬ', short:'ЛАБИРИНТ', sub:'дойди до огонька', h:2},
  {name:'ИСПРАВЛЕНИЕ КОДА', short:'КОД',      sub:'почини программу', h:2}
];
const ARC_META = [
  {name:'РУКА',    short:'РУКА',    sub:'лови цели',       icon:'hand'},
  {name:'РИТМ',    short:'РИТМ',    sub:'жми в такт',      icon:'beat'},
  {name:'СЕРДЦА',  short:'СЕРДЦА',  sub:'лови капли',      icon:'heart'},
  {name:'ЛАБИРИНТ',short:'ЛАБИРИНТ',sub:'найди меня',      icon:'maze'},
  {name:'РАДУЖНЫЙ ЗОНТ', short:'ЗОНТ', sub:'уклонись от грусти', icon:'umbrella'},
  {name:'КОД',     short:'КОД',     sub:'почини программу',icon:'code'},
  {name:'PRINT',   short:'ПЕЧАТЬ',  sub:'напечатай главное',icon:'printer'}
];
/* иконки для бонусных уровней (те же 8x8, что у сюжетных) */
EP_BIT.hand    = ['..####..','..#..#..','.#....#.','#..##..#','#..##..#','#......#','.#....#.','..####..'];
EP_BIT.umbrella= ['...##...','..####..','.##..##.','########','.######.','..#..#..','..#..#..','..####..'];
EP_BIT.printer = ['..####..','.#....#.','########','########','........','.######.','.#....#.','.######.'];
NODE_META.length = 0;
for(const m of STORY_META) NODE_META.push(m);
for(const m of ARC_META)   NODE_META.push(m);
const FINALE_NODE = NODE_META.length;
NODE_META.push({name:'ФИНАЛ', short:'ФИНАЛ', sub:'восемь сердец в одном'});
const LETTER_NODE = FINALE_NODE;      // старые ссылки оставим рабочими
const EP_FILES = ['ШИФР.exe','РИТМ.exe','ВОСПОМИНАНИЯ.exe','ЛАБИРИНТ.exe','КОД.exe'];

/* --- иконки узлов карты --- */
const EP_ICON_NAMES = ['cipher','beat','stars','maze','code'];
const _nodeIcon = drawNodeIcon;
drawNodeIcon = function(i, x, y, col){
  if(i === FINALE_NODE){ drawIconAt('heart', x, y, 2, col); return; }
  if(i < EP_N){ blitBits(EP_BIT[EP_ICON_NAMES[i]], x, y, 2, col); return; }
  if(i === EP_N + 5){ blitBits(EP_BIT.code, x, y, 2, col); return; }    // бонус «КОД»
  if(i === EP_N + 6){ _nodeIcon(6, x, y, col); return; }               // бонус «PRINT»
  if(i < FINALE_NODE){ _nodeIcon(i-EP_N, x, y, col); return; }
  drawIconAt('letter', x, y, 2, col);
};
/* --- иконки программ на рабочем столе --- */
const _fileIcon = drawFileIcon;
function paperSheet(cx, cy, o){
  const w = 16, h = 18, x = Math.round(cx - w/2), y = Math.round(cy - h/2);
  ctx.fillStyle = UI.dark; ctx.fillRect(x-1, y-1, w+2, h+2);
  ctx.fillStyle = o.sel ? '#fff6e8' : UI.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#b3a8cc'; ctx.fillRect(x+w-5, y, 5, 5);
  ctx.fillStyle = o.sel ? '#c9bde8' : '#8f83ad';
  ctx.fillRect(x+w-5, y, 1, 5); ctx.fillRect(x+w-5, y+4, 5, 1);
  return {x:x, y:y, w:w, h:h};
}
drawFileIcon = function(node, cx, cy, o){
  o = o || {};
  const col = o.sel ? '#3a2560' : '#4a3670';
  if(node === 'stars'){ const r = paperSheet(cx, cy, o); drawIcon('stars', cx-10, cy-4, 2, col); return r; }
  if(node === 'heart'){ const r = paperSheet(cx, cy, o); drawIconAt('heart', cx, cy-1, 2, '#c2405a'); return r; }
  if(node === 'letter'){ const r = paperSheet(cx, cy, o); drawIconAt('letter', cx, cy-1, 2, col); return r; }
  if(EP_BIT[node]){ const r = paperSheet(cx, cy, o); blitBits(EP_BIT[node], cx, cy-1, 2, col); return r; }
  return _fileIcon.call(this, node, cx, cy, o);
};

/* ==========================================================================
   КАРТА ПРОГРЕССА — общая отрисовка (окно + полноэкранная версия)
   ========================================================================== */
function mapCore(x, y, w, h, tab, t, sel){
  const P = CONFIG.P;
  const out = {nodes:[], tabs:[]};
  const tw = Math.floor((w-10)/2);
  drawBtn(x+4, y+2, tw, 13, 'СЮЖЕТ', {press:tab===0, color: tab===0?P.gold:UI.text});
  drawBtn(x+4+tw, y+2, tw, 13, 'БОНУС', {press:tab===1, color: tab===1?P.gold:UI.text});
  out.tabs.push({x:x+4, y:y+2, w:tw, h:13}, {x:x+4+tw, y:y+2, w:tw, h:13});
  // счётчик сердец главной линии
  const hy = y + 19;
  const cnt = 'Собрано сердец: ' + storyDone() + ' / ' + CH;
  heart(x+5, hy, 1, P.pink);
  const rw = finaleReady() ? 62 : 58;
  text(cnt, x+15, hy, {sc:fitSc(cnt, w-rw-20, 1), color: storyDone()>=CH ? P.green : UI.text});
  if(finaleReady()){
    const a = 0.4+0.4*Math.abs(Math.sin(t*3));
    ctx.globalAlpha = a;
    text('ФИНАЛ ЖДЁТ', x+w-5, hy, {sc:1, align:'right', color:P.green});
    ctx.globalAlpha = 1;
  } else {
    text('БОНУС '+arcDone()+'/'+AR_N, x+w-5, hy, {sc:1, align:'right', color:'#5a4680'});
  }
  // ряд из восьми сердец
  for(let i=0;i<CH;i++) heart(x+6+i*11, hy+11, 1, G.hearts[EP_HEART_IDX[i]] ? P.pink : '#3a2560');
  // сетка узлов
  const list = tab===0 ? EP_N+1 : AR_N;
  const base = tab===0 ? 0 : EP_N;
  const gy = hy + 23, gh = y + h - gy - 16;
  const cols = (w >= 250) ? 3 : (tab===0 ? 2 : 2);
  const rows = Math.ceil(list/cols);
  const cw = w/cols, ch = gh/rows;
  const showLabels = ch >= 38;
  const R2 = Math.max(9, Math.min(15, Math.floor(Math.min(cw, ch)/2) - 3));
  for(let k=0;k<list;k++){
    const i = (tab===0 && k===EP_N) ? FINALE_NODE : base + k;
    const isFin = (i === FINALE_NODE);
    const cx = Math.round(x + cw*(k%cols + 0.5));
    const cy = Math.round(gy + ch*(Math.floor(k/cols) + 0.5));
    const got = isFin ? finaleReady() : G.hearts[i];
    const locked = isFin && !got;
    const isSel = (i === sel);
    const bob = isSel ? Math.round(Math.sin(t*5)*2) : 0;
    const ny = cy + bob;
    out.nodes.push({x:cx, y:ny, i:i, r:R2});
    if(isFin && got){
      const a = 0.22+0.32*Math.abs(Math.sin(t*2.5));
      ctx.fillStyle = 'rgba(255,209,102,'+a.toFixed(2)+')';
      ctx.fillRect(cx-R2-4, ny-R2-4, (R2+4)*2, (R2+4)*2);
    }
    if(isSel){ ctx.fillStyle = 'rgba(255,209,102,.16)'; ctx.fillRect(cx-R2-3, ny-R2-3, (R2+3)*2, (R2+3)*2); }
    ctx.fillStyle = locked ? '#1d1136' : (got ? '#4a1f3d' : '#2d1a54');
    ctx.fillRect(cx-R2, ny-R2, R2*2, R2*2);
    ctx.fillStyle = locked ? '#3a2560' : (isSel?P.gold:(got?P.pink:'#6b4fa0'));
    ctx.fillRect(cx-R2, ny-R2, R2*2, 2); ctx.fillRect(cx-R2, ny+R2-2, R2*2, 2);
    ctx.fillRect(cx-R2, ny-R2, 2, R2*2); ctx.fillRect(cx+R2-2, ny-R2, 2, R2*2);
    drawNodeIcon(i, cx, ny, locked ? '#4a3670' : (got?P.pink2:P.gold));
    if(showLabels){
      const nm = NODE_META[i].short || NODE_META[i].name;
      const lsc = fitSc(nm, cw-4, 1);
      text(nm, cx, ny+R2+1, {sc:lsc, align:'center', color: locked?'#5a4680':(isSel?P.ink:P.dim)});
    }
    if(got && !isFin) heart(cx+R2-3, ny-R2-3, 1, P.pink);
  }
  // подвал
  const nm = NODE_META[clamp(sel,0,NODE_META.length-1)];
  const foot = (sel===FINALE_NODE) ? (finaleReady() ? 'ОТКРЫТЬ ФИНАЛ ♥' : 'СОБЕРИ ВСЕ '+CH+' СЕРДЕЦ') : nm.sub;
  text(foot, x+w/2, y+h-12, {sc:fitSc(foot, w-10, 1), align:'center', color: sel===FINALE_NODE?P.green:P.dim});
  return out;
}
/* какой узел «даёт» i-е сердце (для ряда из 8 сердец) */
const EP_HEART_IDX = (function(){
  const a = []; for(let i=0;i<EP_N;i++) for(let k=0;k<(STORY_META[i].h||1);k++) a.push(i);
  return a;
})();
function mapHit(m, x, y){
  for(const t of m.tabs) if(x>t.x && x<t.x+t.w && y>t.y && y<t.y+t.h) return {tab:true, i:m.tabs.indexOf(t)};
  for(const n of m.nodes) if(Math.abs(x-n.x)<n.r+4 && Math.abs(y-n.y)<n.r+5) return {tab:false, i:n.i};
  return null;
}
function mapPick(i){
  if(i === FINALE_NODE){
    if(finaleReady()){ Snd.fanfare(); go('finale'); }
    else { Snd.bad(); openSys('ЕЩЁ РАНО', ['Финал откроется, когда','ты соберёшь все', CH+' сердец.','Сейчас: '+storyDone()]); }
    return;
  }
  if(i >= EP_N && i < FINALE_NODE){ G.sel = EP_N; startLevel(i); return; }
  startLevel(i);
}
function mapTabOf(i){ return (i < EP_N || i === FINALE_NODE) ? 0 : 1; }

/* --- окно «ДОСТИЖЕНИЯ.exe» --- */
mapWindowContent = function(win){
  const r = Win.inner(win);
  if(win.tab == null) win.tab = mapTabOf(G.sel);
  if(G.sel != null) win.tab = mapTabOf(G.sel);
  const m = mapCore(r.x, r.y, r.w, r.h, win.tab, win.t, G.sel);
  win.mapRects = m;
  win.nodesXY = m.nodes;
  win.onTap = function(x, y){
    const h = mapHit(m, x, y);
    if(!h) return;
    if(h.tab){ G.screens.map.tab = h.i; G.sel = h.i===0 ? 0 : EP_N; Snd.blip(); return; }
    G.sel = h.i; Snd.blip(); mapPick(h.i);
  };
};

/* --- полноэкранная карта --- */
G.screens.map = {
  enter(){ this.t = 0; G.sel = (G.sel==null || G.sel<0) ? 0 : G.sel; this.tab = mapTabOf(G.sel); },
  update(dt){ this.t += dt; },
  draw(){
    skyBg(this.t); clouds(this.t, 10, 3, 0.15);
    this.m = mapCore(0, 0, W, H-6, this.tab, this.t, G.sel);
    text(IS_TOUCH ? 'ТАПАЙ ПО УЗЛАМ' : 'СТРЕЛКИ — ВЫБОР, ПРОБЕЛ — ВХОД', W/2, H-4, {sc:1, align:'center', color:'#6b4fa0'});
    vignette(0.5); crtOverlay(this.t);
  },
  choose(){ mapPick(G.sel); },
  key(k){
    const list = this.tab===0 ? EP_N+1 : AR_N, base = this.tab===0?0:EP_N;
    const cols = this.tab===0 ? (W>=250?3:2) : clamp(Math.floor(W/72), 2, 4);
    if(k==='ArrowLeft'){ G.sel = base + (G.sel - base - 1 + list) % list; Snd.blip(); }
    if(k==='ArrowRight'){ G.sel = base + (G.sel - base + 1) % list; Snd.blip(); }
    if(k==='ArrowUp'){ G.sel = base + (G.sel - base - cols + list*2) % list; Snd.blip(); }
    if(k==='ArrowDown'){ G.sel = base + (G.sel - base + cols) % list; Snd.blip(); }
    if(k==='Tab'){ this.tab = 1-this.tab; G.sel = this.tab===0?0:EP_N; Snd.blip(); }
    if(k===' '||k==='Enter') mapPick(G.sel);
  },
  tap(x,y){
    const h = mapHit(this.m, x, y);
    if(!h) return;
    if(h.tab){ this.tab = h.i; G.sel = h.i===0 ? 0 : EP_N; Snd.blip(); return; }
    G.sel = h.i; Snd.blip(); mapPick(h.i);
  }
};

/* ==========================================================================
   РАБОЧИЙ СТОЛ
   ========================================================================== */
G.screens.desktop.buildIcons = function(){
  this.icons = [
    {kind:'level',   idx:0, icon:'cipher', name:'ШИФР.exe',      node:0},
    {kind:'arcade',  idx:EP_N, icon:'dice', name:'ДОСТИЖЕНИЯ.exe', node:EP_N},
    {kind:'term',    icon:'term', name:'КОМАНДНАЯ СТРОКА'},
    {kind:'set',     icon:'set',  name:'ПАРАМЕТРЫ'},
    {kind:'readme',  icon:'txt',  name:'README.txt'},
    {kind:'bin',     icon:'bin',  name:'КОРЗИНА'}
  ];
  this.jit = []; const R = mulberry32(5);
  for(let i=0;i<24;i++) this.jit.push(R());
};

/* --- запуск иконок --- */
const _launchW = G.screens.desktop.launch;
G.screens.desktop.launch = function(it, dbl){
  if(it.kind === 'term'){ openTerm(it); return; }
  if(it.kind === 'set'){ Snd.blip(); ripple(it.tx, it.ty); openSettings(); return; }
  if(it.kind==='arcade'){
    Snd.coin(); ripple(it.tx, it.ty);
    G.sel = EP_N;
    if(!(G.win && G.win.kind==='map')) Win.open('map','ДОСТИЖЕНИЯ.exe',{w:Math.min(W-8,224), h:Math.min(H-30,320), from:{x:it.tx-20,y:it.ty-16,w:40,h:32}});
    if(G.win && G.win.kind==='map') G.win.tab = 1;
    return;
  }
  if(it.kind==='level' && !dbl){
    Snd.blip(); ripple(it.tx, it.ty);
    G.sel = it.idx;
    if(G.win && G.win.kind==='map'){ G.win.tab = mapTabOf(it.idx); }
    else Win.open('map','ДОСТИЖЕНИЯ.exe',{w:Math.min(W-8,224), h:Math.min(H-30,320), from:{x:it.tx-20,y:it.ty-16,w:40,h:32}});
    if(G.win && G.win.kind==='map') G.win.tab = mapTabOf(it.idx);
    return;
  }
  if(it.kind==='level' && dbl){
    Snd.coin(); ripple(it.tx, it.ty);
    G.pending = {type:'level', idx:it.idx, t:0};
    Win.open('load', 'ЗАПУСК ' + NODE_META[it.idx].name + '.exe', {w:170, h:56, from:{x:it.tx-20, y:it.ty-16, w:40, h:32}});
    return;
  }
  return _launchW.call(this, it, dbl);
};
const _deskTap = G.screens.desktop.tap;
G.screens.desktop.tap = function(x, y){
  const w = G.win;
  if(G.state==='desktop' && w && w.kind==='map' && !w.closing && w.anim > 0.9 && Win.hit(w, x, y)){
    const h = mapHit(w.mapRects||{}, x, y);
    if(h){
      if(h.tab){ w.tab = h.i; G.sel = h.i===0?0:EP_N; Snd.blip(); return; }
      G.sel = h.i; w.tab = mapTabOf(h.i);
      mapPick(h.i); return;
    }
    return;
  }
  return _deskTap.call(this, x, y);
};

/* ==========================================================================
   НАГРАДА: 8 сердец главной линии
   ========================================================================== */
G.screens.reward.draw = function(){
  const P = CONFIG.P, t = this.t, cx = W/2, cy = Math.round(H/2-12);
  skyBg(t); clouds(t,20,4,0.2);
  nebulaBg(t, {c1:'#5a1f4a', c2:'#2b1c5e', c3:'#1b3a6b', seed: 9});
  motes(t, 24, '#ffd166', .35);
  for(let i=0;i<3;i++){
    const k = (t*0.5 + i/3) % 1;
    ctx.globalAlpha = (1-k)*0.35; ctx.fillStyle = P.pink;
    ctx.beginPath(); ctx.arc(cx, cy, 20+k*70, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for(let i=0;i<14;i++){
    const a = t*1.4 + i*0.7, rr = 24+i*3.2;
    heart(cx+Math.cos(a)*rr*0.7, cy+Math.sin(a)*rr*0.45, 1, 'rgba(255,93,143,'+Math.max(0,0.5-i*0.028).toFixed(2)+')');
  }
  const pop = t<0.25 ? lerp(0.4, 1.15, easeOut(t/0.25)) : (t<0.45 ? lerp(1.15, 1, (t-0.25)/0.2) : 1);
  const s2 = Math.max(1, Math.round(3*pop*(1 + Math.max(0,Math.sin((t-0.4)*4))*0.08)));
  ditherGlow(cx, cy, 60, P.pink, 0.22+0.10*Math.abs(Math.sin(t*3)));
  heart(cx-4*s2, cy-3*s2, s2, P.pink);
  const by2 = cy + 26;
  ctx.fillStyle = 'rgba(11,6,24,.78)'; ctx.fillRect(4, by2, W-8, 14);
  ctx.fillStyle = P.pink; ctx.fillRect(4, by2, 2, 14);
  text('СЕРДЕЧКО ПОЛУЧЕНО!', cx, by2+1, {sc:1, align:'center', color:P.gold});
  // ряд из 8 сердец
  const hw = CH*14, bx0 = cx - hw/2;
  for(let i=0;i<CH;i++) heart(bx0+i*14+3, by2+18, 2, G.hearts[EP_HEART_IDX[i]] ? P.pink : '#3a2560');
  text('Собрано сердец: '+storyDone()+' / '+CH, cx, by2+36, {sc:1, align:'center', color:P.dim});
  if(finaleReady()){
    const a = 0.5+0.5*Math.abs(Math.sin(t*4));
    ctx.globalAlpha = a;
    text('ВСЕ 8 СОБРАНЫ. ОТКРОЙ ФИНАЛ.exe', cx, by2+50, {sc:1, align:'center', color:P.green});
    ctx.globalAlpha = 1;
  }
  vignette(0.5); crtOverlay(t); bezel();
};
