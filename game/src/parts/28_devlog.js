/* ==========================================================================
   ЧАСТЬ 28 · DEV LOG, последний файл и «следы Марии»
   Текстовые файлы на рабочем столе: журнал разработчика, README_FINAL.txt.
   Ничего не ломает в старом контенте — это только окна с текстом.
   ========================================================================== */

const DEVLOGS = {
  'DEV_LOG_01.txt': {day:'Day 01', lines:[
    'Я решил сделать маленькую игру.',
    '',
    'Пока она вообще не похожа',
    'на то, что я представлял.'
  ]},
  'DEV_LOG_02.txt': {day:'Day 02', lines:[
    'Сегодня я наконец-то',
    'заставил сердце двигаться.',
    '',
    'Это было сложнее,',
    'чем должно было быть.'
  ]},
  'DEV_LOG_03.txt': {day:'Day 07', lines:[
    'Половина картинки — это код.',
    'Он рисует пиксель за пикселем.',
    '',
    'Я долго смотрел на небо',
    'и не понимал, зачем оно.',
    'Потом понял.'
  ]},
  'DEV_LOG_04.txt': {day:'Day 11', lines:[
    'Сегодня она нашла пасхалку',
    'раньше, чем я рассчитывал.',
    '',
    'Я ничего не менял.',
    'Пусть остаётся как было.'
  ]},
  'DEV_LOG_FINAL.txt': {day:'Day 40', lines:[
    'Если ты это читаешь,',
    'значит я всё-таки закончил.',
    '',
    'Теперь это уже не просто код.',
    '',
    'Это всё для тебя.'
  ]}
};

const README_FINAL = {
  day:'последний файл',
  lines:[
    'Если ты это читаешь,',
    'значит ты действительно',
    'посмотрела всё.',
    '',
    'Я не знаю,',
    'какая часть тебе понравилась больше.',
    '',
    'Но я точно знаю одно.',
    '',
    'Я сделал это не потому,',
    'что нужно было сделать игру.',
    '',
    'Я сделал это,',
    'потому что хотел оставить',
    'для тебя что-то,',
    'что нельзя просто отправить',
    'одним сообщением.',
    '',
    'Что-то, что можно открыть снова.',
    'Когда-нибудь.',
    '',
    'И снова увидеть,',
    'что я был здесь.',
    '',
    'И что всё это',
    'было для тебя.'
  ],
  tail:['END OF FILE', '', 'there is no end.', '', '♥']
};

/* ------------------------------------------------------------------
   Универсальное окно с текстом (прокрутка)
   ------------------------------------------------------------------ */
function openTxtFile(name, from, back){
  const doc = (name === 'README_FINAL.txt') ? README_FINAL : DEVLOGS[name];
  if(!doc){ openSys('НЕТ ТАКОГО ФАЙЛА', ['Файл не найден.']); return; }
  Snd.blip();
  const w = Math.min(W-14, 200), h = Math.min(H-30, 150);
  const win = Win.open('txtfile', name, {w:w, h:h, from:from || null});
  win.data.name = name;
  win.data.doc = doc;
  win.data.scroll = 0;
  win.data.maxScroll = 0;
  win.data.fade = 0;
  win.data.back = back || null;
  return win;
}
function txtLines(doc, maxW){
  const out = [];
  if(doc.day) out.push({t:doc.day, c:'#ffd166'});
  out.push({t:'-'.repeat(Math.min(18, Math.floor(maxW/6))), c:'#4a3670'});
  for(const l of doc.lines){
    if(l === '') out.push({t:'', c:'#e6dcf7'});
    else for(const w of wrap(l, maxW, 1)) out.push({t:w, c:'#e6dcf7'});
  }
  if(doc.tail) for(const l of doc.tail) out.push({t:l, c:'#ff5d8f'});
  return out;
}
function drawTxtFile(win){
  const P = CONFIG.P, r = Win.inner(win), t = win.t, d = win.data;
  const maxW = r.w - (d.name.indexOf('FINAL') >= 0 ? 24 : 10);
  const lines = txtLines(d.doc, maxW);
  const lh = 11, rows = Math.max(1, Math.floor((r.h - 16)/lh));
  d.maxScroll = Math.max(0, lines.length - rows);
  if(d.scroll > d.maxScroll) d.scroll = d.maxScroll;
  ctx.fillStyle = '#150c26'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(107,79,160,.18)'; ctx.fillRect(r.x, r.y, r.w, 1);
  // портрет автора в углу (не перекрывает текст, меньше размер)
  if(d.name.indexOf('FINAL') >= 0 && IMG.him && IMG.him.complete) {
    ctx.globalAlpha = .9;
    ctx.drawImage(IMG.him, r.x+r.w-22, r.y+r.h-22, 18, 18);
    ctx.globalAlpha = 1;
  }
  // строки
  const vis = lines.slice(d.scroll, d.scroll + rows);
  let y = r.y + 4;
  for(const l of vis){
    if(l.t) text(l.t, r.x+5, y, {sc:1, color:l.c});
    y += lh;
  }
  // подсказка прокрутки
  if(d.maxScroll > 0){
    const a = 0.45+0.35*Math.abs(Math.sin(t*3));
    ctx.globalAlpha = a;
    text(IS_TOUCH ? 'ЛИСТАЙ ВНИЗ' : 'СТРЕЛКИ - ЛИСТАТЬ', r.x+r.w/2, r.y+r.h-11, {sc:1, align:'center', color:P.gold});
    ctx.globalAlpha = 1;
    // полоска
    const bx = r.x+r.w-5, bh = r.h-10;
    const kh = Math.max(6, Math.round(bh * rows/lines.length));
    const ky = r.y+5 + Math.round((bh-kh) * (d.scroll/Math.max(1, d.maxScroll)));
    ctx.fillStyle = 'rgba(107,79,160,.5)'; ctx.fillRect(bx, r.y+5, 2, bh);
    ctx.fillStyle = P.gold; ctx.fillRect(bx, ky, 2, kh);
  }
  if(d.doc.tail && d.scroll >= d.maxScroll){
    const a = 0.5+0.5*Math.abs(Math.sin(t*2));
    ctx.globalAlpha = a;
    heart(r.x+r.w-12, r.y+r.h-12, 1, P.pink);
    ctx.globalAlpha = 1;
  }
}
/* маршрутизация ввода в окно txtfile */
const _dwT0 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'txtfile'){ drawWinFrame(win, true); drawTxtFile(win); return; }
  return _dwT0.call(this, win);
};
const _dkT0 = G.screens.desktop.key;
G.screens.desktop.key = function(k){
  const win = G.win;
  if(win && win.kind === 'txtfile' && !win.closing){
    const d = win.data;
    if(k === 'Escape'){
      if(d.back){ Win.close(); openDevList(); return; }
      Win.close(); return;
    }
    if(k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter'){
      if(d.scroll < d.maxScroll){ d.scroll = Math.min(d.maxScroll, d.scroll + 1); Snd.blip(); }
      else if(k === ' ' || k === 'Enter'){ Snd.blip(); }
      return;
    }
    if(k === 'ArrowUp' || k === 'PageUp'){ d.scroll = Math.max(0, d.scroll - 1); Snd.blip(); return; }
    if(Win.titleHit(win, 0, 0)){}
    return;
  }
  return _dkT0.call(this, k);
};
const _dtT0 = G.screens.desktop.tap;
G.screens.desktop.tap = function(x,y){
  const win = G.win;
  if(win && win.kind === 'txtfile' && !win.closing){
    const d = win.data;
    if(Win.closeHit(win,x,y)){ if(d.back){ Win.close(); openDevList(); return; } Win.close(); return; }
    if(Win.titleHit(win,x,y)){ this.drag = true; return; }
    if(Win.hit(win,x,y)){
      d.scroll = Math.min(d.maxScroll, d.scroll + 3);
      Snd.blip();
      return;
    }
  }
  return _dtT0.call(this, x, y);
};

/* ------------------------------------------------------------------
   Окно-список журнала разработчика
   ------------------------------------------------------------------ */
const DEVLOG_ORDER = ['DEV_LOG_01.txt','DEV_LOG_02.txt','DEV_LOG_03.txt','DEV_LOG_04.txt','DEV_LOG_FINAL.txt'];
function openDevList(from){
  Snd.blip();
  const w = Math.min(W-14, 186), h = Math.min(H-30, 128);
  const win = Win.open('devlist','ЖУРНАЛ',{w:w, h:h, from:from || null});
  win.data.sel = 0;
  return win;
}
function drawDevList(win){
  const P = CONFIG.P, r = Win.inner(win), t = win.t, d = win.data;
  ctx.fillStyle = '#150c26'; ctx.fillRect(r.x, r.y, r.w, r.h);
  let y = r.y + 5;
  text('записи разработчика', r.x+r.w/2, y, {sc:1, align:'center', color:'#6b5a8f'}); y += 13;
  d.rows = [];
  for(let i=0;i<DEVLOG_ORDER.length;i++){
    const name = DEVLOG_ORDER[i];
    const sel = d.sel === i;
    const on = ptr.x>r.x && ptr.x<r.x+r.w && ptr.y>=y-1 && ptr.y<=y+12;
    ctx.fillStyle = sel ? 'rgba(255,209,102,.16)' : (on ? 'rgba(107,79,160,.20)' : 'rgba(11,6,24,.4)');
    ctx.fillRect(r.x+3, y-1, r.w-6, 12);
    const doc = DEVLOGS[name];
    text(name, r.x+6, y, {sc:1, color: sel ? P.ink : UI.text});
    text(doc.day, r.x+r.w-6, y, {sc:1, align:'right', color: sel ? P.gold : '#5a4680'});
    if(FXQ > .4 && sel) shineRect(r.x+3, y-1, r.w-6, 12, t, '#ffffff', 24);
    d.rows.push({x:r.x+3, y:y-1, w:r.w-6, h:12, i:i});
    y += 13;
  }
  text(IS_TOUCH ? 'ТАПНИ, ЧТОБЫ ОТКРЫТЬ' : 'ПРОБЕЛ - ОТКРЫТЬ', r.x+r.w/2, r.y+r.h-23, {sc:1, align:'center', color:'#6b4fa0'});
  text('ESC - ЗАКРЫТЬ', r.x+r.w/2, r.y+r.h-12, {sc:1, align:'center', color:'#4a3670'});
}
const _dwL0 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'devlist'){ drawWinFrame(win, true); drawDevList(win); return; }
  return _dwL0.call(this, win);
};
const _dkL0 = G.screens.desktop.key;
G.screens.desktop.key = function(k){
  const win = G.win;
  if(win && win.kind === 'devlist' && !win.closing){
    const d = win.data, n = DEVLOG_ORDER.length;
    if(k === 'Escape'){ Win.close(); return; }
    if(k === 'ArrowDown'){ d.sel = (d.sel+1) % n; Snd.blip(); return; }
    if(k === 'ArrowUp'){ d.sel = (d.sel+n-1) % n; Snd.blip(); return; }
    if(k === ' ' || k === 'Enter'){
      Snd.coin();
      const r = Win.rect(win);
      openTxtFile(DEVLOG_ORDER[d.sel], {x:r.x+4, y:r.y+16, w:40, h:20}, 'devlist');
      return;
    }
    return;
  }
  return _dkL0.call(this, k);
};
const _dtL0 = G.screens.desktop.tap;
G.screens.desktop.tap = function(x,y){
  const win = G.win;
  if(win && win.kind === 'devlist' && !win.closing){
    if(Win.closeHit(win,x,y)){ Win.close(); return; }
    if(Win.titleHit(win,x,y)){ this.drag = true; return; }
    for(const r of (win.data.rows || [])){
      if(x>=r.x && x<=x+r.w && y>=r.y && y<=y+r.h){
        win.data.sel = r.i; Snd.coin();
        const rr = Win.rect(win);
        openTxtFile(DEVLOG_ORDER[r.i], {x:rr.x+4, y:rr.y+16, w:40, h:20}, 'devlist');
        return;
      }
    }
    return;
  }
  return _dtL0.call(this, x, y);
};

/* ------------------------------------------------------------------
   Иконки файлов на рабочем столе
   ------------------------------------------------------------------ */
/** появляется только когда пройдено абсолютно всё */
function lastFileReady(){
  return heartsDone() >= NH && AR.doneCount() >= ARCH_N;
}
function ensureExtraIcons(){
  const d = G.screens.desktop;
  if(!d || !d.icons) return;
  let changed = false;
  if(!d.icons.some(i => i.kind === 'devlog')){
    d.icons.push({kind:'devlog', icon:'txt', name:'DEV_LOG.txt', node:-1, tip:'ЖУРНАЛ РАЗРАБОТЧИКА'});
    changed = true;
  }
  // иконка архива доступна всегда
  if(!d.icons.some(i => i.kind === 'arch')){
    d.icons.push({kind:'arch', icon:'arch', name:'ARCHIVE.exe', node:-1, tip:'ТАЙНЫЙ АРХИВ'});
    changed = true;
  }
  if(lastFileReady() && !d.icons.some(i => i.file === 'README_FINAL.txt')){
    d.icons.push({kind:'txtfile', icon:'txt', file:'README_FINAL.txt', name:'README_FINAL.txt', node:-1, tip:'ПОСЛЕДНИЙ ФАЙЛ'});
    changed = true;
    d._lastFileToast = 1.6;
  }
  if(changed) d.layout();
}
const _biE0 = G.screens.desktop.buildIcons;
G.screens.desktop.buildIcons = function(){
  _biE0.call(this);
  ensureExtraIcons();
};
const _laE0 = G.screens.desktop.launch;
G.screens.desktop.launch = function(it, dbl){
  if(it.kind === 'devlog'){
    Snd.blip(); ripple(it.tx, it.ty);
    if(G.win && G.win.kind === 'map') Win.close();
    if(G.win && G.win.kind === 'devlist'){ Win.close(); return; }
    openDevList({x:it.tx-20, y:it.ty-16, w:40, h:30});
    return;
  }
  if(it.kind === 'arch'){
    Snd.blip(); ripple(it.tx, it.ty);
    if(G.win && G.win.kind === 'archive'){ Win.close(); return; }
    openArchiveWin({x:it.tx-20, y:it.ty-16, w:40, h:32});
    return;
  }
  if(it.kind === 'txtfile'){
    Snd.blip(); ripple(it.tx, it.ty);
    if(G.win && G.win.kind === 'map') Win.close();
    if(G.win && G.win.kind === 'txtfile'){ Win.close(); return; }
    openTxtFile(it.file, {x:it.tx-20, y:it.ty-16, w:40, h:30});
    return;
  }
  return _laE0.call(this, it, dbl);
};

// иконка архива — запечатанный ящик с сердечком
const _drawIconArch = drawFileIcon;
drawFileIcon = function(node, cx, cy, o){
  o = o || {};
  if(node === 'arch'){
    const w = 16, h = 14, x = Math.round(cx-w/2), y = Math.round(cy-h/2);
    ctx.fillStyle = UI.dark; ctx.fillRect(x-1, y-1, w+2, h+2);
    ctx.fillStyle = '#3a2560'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = o.sel ? CONFIG.P.gold : '#5a3f96';
    ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y+h-2, w, 2);
    ctx.fillStyle = o.sel ? '#fff6e8' : '#8a6ab0';
    ctx.fillRect(x+3, y+4, 2, 2); ctx.fillRect(x+w-5, y+4, 2, 2);
    ctx.fillStyle = o.sel ? CONFIG.P.pink : CONFIG.P.pink2;
    heart(Math.round(cx)-3, Math.round(cy)-3, 1, o.sel ? CONFIG.P.pink : '#5a3f96');
    if(o.sel){ ctx.globalAlpha=0.25; ctx.fillStyle=CONFIG.P.gold; ctx.fillRect(x-3,y-3,w+6,h+6); ctx.globalAlpha=1; }
    return {x:x, y:y, w:w, h:h};
  }
  return _drawIconArch(node, cx, cy, o);
};

/* ------------------------------------------------------------------
   README.txt: неожиданные три строки
   ------------------------------------------------------------------ */
const _dR0 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'readme'){
    const P = CONFIG.P, r = Win.inner(win);
    win.h = Math.min(H-26, 140);
    const rr = Win.inner(win);
    drawWinFrame(win, true);
    const lines = [];
    for(const l of wrap('Привет, Мария. Это не вирус и не программа — просто я. Я написал её, потому что словами получается хуже.', rr.w-8, 1)) lines.push({t:l, c:UI.text});
    lines.push({t:'', c:UI.text});
    lines.push({t:'— ' + CONFIG.him, c:P.sky});
    lines.push({t:'', c:UI.text});
    for(const l of wrap('Если ты это читаешь — значит, ты действительно дошла сюда. Я очень рад. Правда рад.', rr.w-8, 1)) lines.push({t:l, c:'#c9bde8'});
    let yy = rr.y+4;
    for(const l of lines){ if(l.t) text(l.t, rr.x+4, yy, {sc:1, color:l.c}); yy += 11; }
    if(bothP()) ctx.drawImage(IMG.him, rr.x+rr.w-30, rr.y+rr.h-30, 26, 26);
    return;
  }
  return _dR0.call(this, win);
};

/* ------------------------------------------------------------------
   Следы Марии: редкие реплики системы
   ------------------------------------------------------------------ */
const MARIYA_TRACES = [
  'USER DETECTED',
  'MARIYA',
  'WELCOME BACK, MARIYA',
  'LAST USER: MARIYA',
  'СИСТЕМА: КТО-ТО СНОВА ЗДЕСЬ.',
  'СИСТЕМА: ЭТО ТЫ, МАРИЯ?'
];
const _upE0 = G.screens.desktop.update;
G.screens.desktop.update = function(dt){
  _upE0.call(this, dt);
  if(this._lastFileToast > 0){
    this._lastFileToast -= dt;
    if(this._lastFileToast <= 0) sysToast('ПОСЛЕДНИЙ ФАЙЛ ПОЯВИЛСЯ НА РАБОЧЕМ СТОЛЕ.', '#ff5d8f');
  }
  // изредка — очень редко — система называет её по имени
  if(this.traceT === undefined) this.traceT = 150 + Math.random()*200;
  this.traceT -= dt;
  if(this.traceT <= 0){
    this.traceT = 240 + Math.random()*360;
    if(!G.win){
      sysToast(MARIYA_TRACES[Math.floor(Math.random()*MARIYA_TRACES.length)], '#8ce99a');
      Snd.coin();
    }
  }
};
