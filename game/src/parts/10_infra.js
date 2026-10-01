/* ==========================================================================
   ЧАСТЬ 10 · ИНФРАСТРУКТУРА НОВЫХ ЭПИЗОДОВ
   Русский алфавит, пиксельные иконки, сцены, экранная клавиатура
   ========================================================================== */

/* --- русский алфавит для шифров (с Ё) --- */
const ALPH = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const AL_N = ALPH.length;                       // 33
const aIdx = ch => ALPH.indexOf(ch.toUpperCase());
const aCh  = n => ALPH[((n-1)%AL_N+AL_N)%AL_N]; // 1..33 -> буква

/* --- обёртка: сцена внутри уровня (u_/d_/t_/k_ + имя сцены) --- */
function scenes(lv){
  lv.t = 0; lv.scene = lv.scene || 'start'; lv.sceneT = 0;
  lv.setScene = function(name){
    this.scene = name; this.sceneT = 0;
    if(typeof this['on_'+name] === 'function') this['on_'+name]();
  };
  lv.update = function(dt){
    this.t += dt; this.sceneT += dt;
    if(this.extraUpdate) this.extraUpdate.call(this, dt);   // доп. логика уровня
    const f = this['u_'+this.scene]; if(f) f.call(this, dt);
  };
  lv.draw = function(){
    const f = this['d_'+this.scene]; if(f) f.call(this);
  };
  lv.key = function(k){ const f = this['k_'+this.scene]; if(f) f.call(this, k); };
  lv.tap = function(x,y){ const f = this['t_'+this.scene]; if(f) f.call(this, x, y); };
  return lv;
}

/* --- общий фон эпизодов: тёмное «звёздное» стекло + лёгкая виньетка --- */
function epBg(t, opt){
  opt = opt || {};
  const top = opt.top || '#0b0620', bot = opt.bot || '#1d0f33';
  ctx.drawImage(bgCache('epbg', paint=>{ ditherGradVTo(paint, 0,0,W,H, top, bot, 14); }), 0, 0);
  // редкие пылинки
  ctx.fillStyle = 'rgba(255,246,232,.16)';
  for(let i=0;i<26;i++){
    const x = ((i*97)%W), y = ((i*53 + Math.floor(t*6))%H);
    ctx.fillRect(x, y, 1, 1);
  }
  vignette(0.45);
}
/** Мягкое свечение-точка (для звёзд/свечей). */
function starAt(x, y, r, col, a){
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.globalAlpha = a*0.35;
  ctx.beginPath(); ctx.arc(x, y, r*2.2, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  if(r >= 1.4){
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x-r*2.6), Math.round(y-0.5), Math.round(r*5.2), 1);
    ctx.fillRect(Math.round(x-0.5), Math.round(y-r*2.6), 1, Math.round(r*5.2));
  }
}

/* --- панель-«окно» внутри уровня --- */
function epPanel(x, y, w, h, title, col){
  ctx.fillStyle = 'rgba(11,6,24,.55)'; ctx.fillRect(x+2, y+3, w, h);
  ctx.fillStyle = UI.dark; ctx.fillRect(x-2, y-2, w+4, h+4);
  ctx.fillStyle = UI.line; ctx.fillRect(x-1, y-1, w+2, h+2);
  ctx.fillStyle = UI.face; ctx.fillRect(x, y, w, h);
  bevel(x, y, w, 3, 'rgba(255,255,255,.10)', 'rgba(0,0,0,.3)');
  if(title){
    const th = 12;
    ctx.fillStyle = col || '#3a2560'; ctx.fillRect(x, y, w, th);
    ctx.fillStyle = UI.dark; ctx.fillRect(x, y+th, w, 1);
    text(title, x+4, y+1, {sc:1, color:UI.text});
    return {x:x, y:y+th+1, w:w, h:h-th-1};
  }
  return {x:x, y:y, w:w, h:h};
}

/* --- экранная клавиатура из уникальных символов --- */
function makeKeys(chars, opt){
  opt = opt || {};
  const kbW = opt.w || Math.min(W-8, 220);
  const keyH = opt.h || 17;
  const maxCols = Math.max(4, Math.floor(kbW/19));
  const keyW = Math.floor(kbW/maxCols);
  const rowsN = Math.ceil(chars.length/maxCols);
  const kbX = Math.round((W - maxCols*keyW)/2);
  const kbY = (opt.y != null) ? opt.y : (H - 10 - rowsN*(keyH+3));
  return {
    keys: chars.map((ch,i)=>({ch:ch, x:kbX+(i%maxCols)*keyW, y:kbY+Math.floor(i/maxCols)*(keyH+3), w:keyW-2, h:keyH})),
    top: kbY, rows: rowsN, keyW:keyW, keyH:keyH, x:kbX, w:maxCols*keyW
  };
}
function drawKeys(K, hov, label){
  for(const k of K.keys){
    const on = hov && hov.x>k.x && hov.x<k.x+k.w && hov.y>k.y && hov.y<k.y+k.h;
    drawBtn(k.x, k.y, k.w, k.h, label ? (label(k)||k.ch) : k.ch, {press:on});
  }
}
function keyAt(K, x, y){
  for(const k of K.keys) if(x>k.x && x<k.x+k.w && y>k.y && y<k.y+k.h) return k;
  return null;
}

/* --- «лента» шифра: прокручивающаяся алфавитная полоса --- */
function drawStrip(chars, cx, cy, w, h, sel, col){
  ctx.fillStyle = '#1d1136'; ctx.fillRect(cx-w/2, cy-h/2, w, h);
  ctx.fillStyle = '#3a2560'; ctx.fillRect(cx-w/2, cy-h/2, w, 1); ctx.fillRect(cx-w/2, cy+h/2-1, w, 1);
  const step = 9, n = Math.floor(w/step);
  const off = (sel - Math.floor(n/2))*step + Math.sin(0)*0;
  for(let i=0;i<n;i++){
    const ci = sel - Math.floor(n/2) + i;
    const ch = chars[((ci%chars.length)+chars.length)%chars.length];
    const x = cx - w/2 + 2 + i*step;
    const mid = (i === Math.floor(n/2));
    text(ch, x, cy-3, {sc:1, color: mid ? (col||CONFIG.P.gold) : '#a08cd8'});
    if(mid){
      ctx.fillStyle = col || CONFIG.P.gold;
      ctx.fillRect(x-1, cy-h/2+2, 1, 2); ctx.fillRect(x+5, cy-h/2+2, 1, 2);
    }
  }
}

/* --- пиксельные иконки новых эпизодов --- */
const EP_BIT = {
  cipher:['..####..','..#..#..','..#..#..','.######.','.#....#.','.#.##.#.','.#.##.#.','.######.'],
  stars :['.#......','.#.###..','..#.#.#.','...#...#','..#...#.','###....#','#.......','........'],
  music :['##.##.##','##.##.##','########','########','########','########','########','########'],
  case_ :['..####..','.#....#.','#......#','#......#','#......#','.#....#.','..####..','.....##.'],
  room  :['.######.','.#....#.','.#.##.#.','.#.##.#.','.#.##.#.','.#.#..#.','.#....#.','.######.'],
  dice  :['.######.','.#....#.','.#.##.#.','.#....#.','.#.##.#.','.#....#.','.######.','........'],
  term  :['........','########','#......#','#.##...#','#......#','#..##..#','#......#','########'],
  beat  :['.##...##','.#######','########','###..###','.##..##.','##....##','#......#','.#....#.'],
  maze  :['########','#.#....#','#.####.#','#....#.#','####.#.#','#.#..#.#','#.#....#','########'],
  code  :['#.....##','.#...#.#','..#.#..#','...#...#','..#.#..#','.#...#.#','#.....##','........'],
  set   :['...##...','..####..','.#....#.','.#....#.','########','.######.','########','.######.'],
  heart :['.##.##..','########','########','########','.######.','.######.','..####..','...##...']
};
function blitBits(rows, cx, cy, s, col){
  const w = rows[0].length, h = rows.length;
  const x0 = Math.round(cx - w*s/2), y0 = Math.round(cy - h*s/2);
  ctx.fillStyle = col;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++)
    if(rows[y][x]==='#') ctx.fillRect(x0+x*s, y0+y*s, s, s);
}
const _drawIconAt0 = drawIconAt;
drawIconAt = function(name, cx, cy, s, col){
  if(EP_BIT[name]){ blitBits(EP_BIT[name], cx, cy, s, col); return; }
  _drawIconAt0(name, cx, cy, s, col);
};
/* созвездие рисуем линиями */
const _drawIcon0 = drawIcon;
drawIcon = function(name, x, y, s, col){
  if(name==='stars'){
    const pts=[[0,3],[3,0],[5,4],[1,6],[4,8]];
    ctx.fillStyle = col;
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1], n=Math.max(Math.abs(b[0]-a[0]), Math.abs(b[1]-a[1]));
      for(let k=0;k<=n;k++) ctx.fillRect(x + (a[0]+(b[0]-a[0])*k/n)*s, y + (a[1]+(b[1]-a[1])*k/n)*s, s, s);
    }
    for(const p of pts) ctx.fillRect(x+p[0]*s-1, y+p[1]*s-1, s+2, s+2);
    return;
  }
  _drawIcon0(name, x, y, s, col);
};
ICON_H.stars = 9;
/* иконка «программы» на рабочем столе: подставим битмапы */
EP_BIT.cipherI = EP_BIT.cipher; EP_BIT.musicI = EP_BIT.music;
EP_BIT.caseI  = EP_BIT.case_; EP_BIT.roomI = EP_BIT.room;
EP_BIT.diceI  = EP_BIT.dice;

/* --- кнопка-стрелка: треугольник рисуем пикселями, а не шрифтом --- */
function dirBtn(x, y, w, h, dir, o){
  o = o || {};
  const r = glassBtn(x, y, w, h, '', o);
  const cx = x + w/2, cy = y + h/2, u = Math.min(9, Math.round(h/2) + 1);
  ctx.fillStyle = o.dis ? '#6b5a8f' : (o.tc || '#fff6e8');
  for(let i=0;i<u;i++){
    const len = u - i;
    let px, py;
    if(dir === 'l'){ px = cx - u/2 + i;     py = cy - len/2; }
    else if(dir === 'r'){ px = cx + u/2 - i - 1; py = cy - len/2; }
    else if(dir === 'u'){ px = cx - len/2;  py = cy - u/2 + i; }
    else { px = cx - len/2; py = cy + u/2 - i - 1; }
    ctx.fillRect(Math.round(px), Math.round(py), 1, len);
  }
  return r;
}

/* --- пиксельные знаки, которых нет в шрифте --- */
function symShape(kind, x, y, col, s){
  const u = s || 7;
  ctx.fillStyle = col;
  if(kind === 'up'){                                  // △
    for(let i=0;i<u;i++){ const w2 = i*2+1; ctx.fillRect(Math.round(x-w2/2), Math.round(y+u/2-i), w2, 1); }
  } else if(kind === 'dn'){                           // ○ (кольцо)
    ctx.fillStyle = col;
    for(let i=0;i<u;i++){
      const w2 = Math.max(1, Math.round(Math.sqrt(Math.max(0, u*u - (i-u/2)*(i-u/2)*4))));
      ctx.fillRect(Math.round(x-w2/2), Math.round(y-u/2+i), w2, 1);
    }
    ctx.fillStyle = '#120a24';
    for(let i=2;i<u-2;i++) ctx.fillRect(Math.round(x-(u-4)/2), Math.round(y-u/2+i), u-4, 1);
  } else {                                            // □
    ctx.fillRect(Math.round(x-u/2), Math.round(y-u/2), u, u);
    ctx.fillStyle = '#120a24';
    ctx.fillRect(Math.round(x-u/2+2), Math.round(y-u/2+2), u-4, u-4);
  }
}
function pxTri(x, y, dir, col, s){                     // стрелка влево/вправо
  const u = s || 6;
  ctx.fillStyle = col;
  for(let i=0;i<u;i++) ctx.fillRect(Math.round(x + dir*(u/2-i) - (dir<0?0:0)), Math.round(y-u/2+i), 1, u-i*2);
}
function pxCheck(x, y, col){                           // галочка
  ctx.fillStyle = col;
  ctx.fillRect(x,   y+3, 1, 3);
  ctx.fillRect(x+1, y+5, 1, 2);
  ctx.fillRect(x+2, y+3, 1, 3);
  ctx.fillRect(x+3, y+1, 1, 5);
  ctx.fillRect(x+4, y,   1, 3);
  ctx.fillRect(x+5, y,   1, 2);
}
/* --- ряд кнопок внизу экрана (равные доли с зазором) --- */
function bottomButtons(y, h, items, hot){
  const n = items.length, gap = 4, bw = Math.floor((W-8-gap*(n-1))/n);
  const out = [];
  for(let i=0;i<n;i++){
    const x = 4 + i*(bw+gap);
    const on = hot && hot.x>x && hot.x<x+bw && hot.y>y && hot.y<y+h;
    drawBtn(x, y, bw, h, items[i].t, {press:on, dis:items[i].dis, color:items[i].color});
    out.push({x:x, y:y, w:bw, h:h, i:i});
  }
  return out;
}
