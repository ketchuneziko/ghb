/* ==========================================================================
   ЧАСТЬ 27 · НОВЫЕ ТЕКСТЫ: рабочий стол, настройки, MARIYA.txt
   Иконка архива, подпись «ТУТ ЕСТЬ ЕЩЁ КОЕ-ЧТО.», пункт в меню «Пуск»,
   личный экран MARIYA.txt после полного архива, тосты и редкие реплики
   системы. Основную линию, письмо и финал не трогаем.
   ========================================================================== */

/* ------------------------------------------------------------------
   1. Пункт «HEART ARCHIVE» в меню «Пуск»
   ------------------------------------------------------------------ */
const _siD0 = G.screens.desktop.startItems;
G.screens.desktop.startItems = function(){
  const it = _siD0.call(this);
  const k = it.findIndex(x => x.t === 'КОМАНДНАЯ СТРОКА');
  it.splice(k >= 0 ? k + 1 : 1, 0, {t:'HEART ARCHIVE', f:()=>{ if(G.win && G.win.kind === 'arch') return; openArchiveWin(); }});
  return it;
};

/* ------------------------------------------------------------------
   2. Иконка архива: подпись и подсказка при наведении
   ------------------------------------------------------------------ */
const _biD0 = G.screens.desktop.buildIcons;
G.screens.desktop.buildIcons = function(){
  _biD0.call(this);
  // подпись иконки архива — по спецификации
  for(const it of this.icons){
    if(it.kind === 'arch'){
      it.name = 'АРХИВ.exe';
      it.tip  = 'ДОПОЛНИТЕЛЬНЫЕ ФРАГМЕНТЫ';
    }
  }
};
/* всплывающая подсказка под курсором */
function deskTip(txt, tx, ty, col){
  if(!txt) return;
  const sc = fitSc(txt, Math.max(80, W-20), 1);
  const tw = textW(txt, sc) + 8, th = 12;
  let x = Math.round(clamp(tx - tw/2, 4, W-tw-4));
  let y = Math.round(ty + 14);
  if(y + th > H-18) y = Math.round(ty - 20);
  ctx.fillStyle = 'rgba(10,6,22,.92)'; ctx.fillRect(x, y, tw, th);
  ctx.fillStyle = col || '#6b4fa0'; ctx.fillRect(x, y, tw, 1); ctx.fillRect(x, y+th-1, tw, 1);
  text(txt, x+4, y+2, {sc:sc, color:'#c9bde8'});
}
const _ddD0 = G.screens.desktop.draw;
G.screens.desktop.draw = function(){
  _ddD0.call(this);
  const it = this.icons[this.hover];
  if(it && it.kind === 'arch'){
    const a = 0.6 + 0.4*Math.abs(Math.sin(this.t*2.4));
    ctx.globalAlpha = a;
    deskTip('ТУТ ЕСТЬ ЕЩЁ КОЕ-ЧТО.', it.tx, it.ty, CONFIG.P.gold);
    ctx.globalAlpha = 1;
  }
};

/* ------------------------------------------------------------------
   3. MARIYA.txt — личный экран, который появляется после полного архива
   ------------------------------------------------------------------ */
const MARIYA_TXT = [
  'status: special',
  'memory: too many',
  'smile: detected',
  'heart: occupied',
  'owner: ' + CONFIG.her,
  'access: forever'
];
function mariaReady(){ return AR.doneCount() >= ARCH_N; }
/** открыть личный экран */
function launchMariya(){
  if(!mariaReady()){
    openSys('MARIYA.txt', [
      'Файл не найден.',
      'Сначала закончи архив.'
    ]);
    return;
  }
  Snd.coin();
  ripple(0,0);
  const w = Math.min(W-14, 190), h = 142;
  Win.open('maria', 'MARIYA.txt', {w:w, h:h});
}
function drawMariya(win){
  const P = CONFIG.P, r = Win.inner(win), t = win.t;
  ctx.fillStyle = '#160c28'; ctx.fillRect(r.x, r.y, r.w, r.h);
  let y = r.y + 4;
  text('ДЛЯ ТЕБЯ', r.x+r.w/2, y, {sc:1, align:'center', color:P.pink});
  y += 13;
  ctx.fillStyle = '#3a2560'; ctx.fillRect(r.x+6, y, r.w-12, 1);
  y += 5;
  for(let i=0;i<MARIYA_TXT.length;i++){
    const line = MARIYA_TXT[i];
    const a = clamp(t*1.6 - i*0.22, 0, 1);
    ctx.globalAlpha = a;
    const k = line.indexOf(':');
    const key = line.slice(0, k+1), val = line.slice(k+2);
    text(key, r.x+7, y, {sc:1, color:'#6b5a8f'});
    text(val, r.x+r.w-7, y, {sc:1, align:'right', color: i === 4 ? P.gold : P.ink});
    ctx.globalAlpha = 1;
    y += 12;
  }
  y += 11;
  const a2 = clamp(t*1.6 - 3.6, 0, 1);
  if(a2 > 0){
    ctx.globalAlpha = a2;
    text('Этот файл нельзя удалить.', r.x+r.w/2, y, {sc:1, align:'center', color:'#8f83ad'});
    ctx.globalAlpha = a2*(0.7+0.3*Math.abs(Math.sin(t*2)));
    text('И не надо. Он твой.', r.x+r.w/2, y+11, {sc:1, align:'center', color:P.pink});
    ctx.globalAlpha = 1;
  }
  heart(r.x+r.w-12, r.y+r.h-12, 1, 'rgba(255,93,143,.5)');
}
const _dwM0 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'maria'){ drawWinFrame(win, true); drawMariya(win); return; }
  return _dwM0.call(this, win);
};
const _dtM0 = G.screens.desktop.tap;
G.screens.desktop.tap = function(x,y){
  const win = G.win;
  if(win && win.kind === 'maria' && !win.closing){
    if(Win.closeHit(win,x,y)){ Win.close(); return; }
    if(Win.titleHit(win,x,y)){ this.drag = true; return; }
  }
  return _dtM0.call(this, x, y);
};
/* иконка MARIYA.txt на рабочем столе */
const _fileD0 = drawFileIcon;
drawFileIcon = function(node, cx, cy, o){
  if(node === 'maria'){
    const w = 13, h = 16, x = Math.round(cx-w/2), y = Math.round(cy-h/2);
    ctx.fillStyle = '#2a1040'; ctx.fillRect(x+2, y, w, h);
    ctx.fillStyle = UI.dark; ctx.fillRect(x+1, y+1, w+1, h-1);
    ctx.fillStyle = o.sel ? '#ffd7e6' : '#e9d9f5'; ctx.fillRect(x+2, y+1, w-1, h-2);
    ctx.fillStyle = '#c9bde8';
    for(let i=0;i<4;i++) ctx.fillRect(x+4, y+4+i*2, 7, 1);
    heart(x+4, y+11, 1, '#ff5d8f');
    if(o.sel){ ctx.globalAlpha=0.25; ctx.fillStyle='#ff5d8f'; ctx.fillRect(x-2,y-2,w+4,h+4); ctx.globalAlpha=1; }
    return {x:x, y:y, w:w, h:h};
  }
  return _fileD0.call(this, node, cx, cy, o);
};
const _biM0 = G.screens.desktop.buildIcons;
G.screens.desktop.buildIcons = function(){
  _biM0.call(this);
  const arch = this.icons.find(i => i.kind === 'arch');
  if(mariaReady() && !this.icons.some(i => i.kind === 'maria')){
    const at = arch ? this.icons.indexOf(arch) + 1 : 2;
    this.icons.splice(at, 0, {kind:'maria', icon:'maria', name:'MARIYA.txt', node:-1, tip:'ЛИЧНЫЙ ФАЙЛ'});
    this.layout();
  }
};
const _laM0 = G.screens.desktop.launch;
G.screens.desktop.launch = function(it, dbl){
  if(it.kind === 'maria'){
    Snd.coin(); ripple(it.tx, it.ty);
    if(G.win && G.win.kind === 'map') Win.close();
    if(G.win && G.win.kind === 'maria'){ Win.close(); return; }
    launchMariya();
    return;
  }
  return _laM0.call(this, it, dbl);
};
/* подсказка при наведении на личный файл */
const _ddM1 = G.screens.desktop.draw;
G.screens.desktop.draw = function(){
  _ddM1.call(this);
  const it = this.icons[this.hover];
  if(it && it.kind === 'maria' && it.tip){
    ctx.globalAlpha = 0.85;
    deskTip(it.tip, it.tx, it.ty, '#ff5d8f');
    ctx.globalAlpha = 1;
  }
};

/* ------------------------------------------------------------------
   4. Настройки: строка про звук
   ------------------------------------------------------------------ */
const _openSet0 = openSettings;
openSettings = function(){
  _openSet0();
  const w = G.win;
  if(w && w.kind === 'set') w.h = 138;      // + строка про звук
};
const _dwS0 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'set'){
    _dwS0.call(this, win);
    const r = Win.inner(win);
    const P = CONFIG.P;
    const line = Snd.on ? 'HEARTOS работает лучше, когда звук включён.' : 'Тихо. Совсем тихо.';
    const ls = wrap(line, r.w-10, 1).slice(0, 2);
    const y = r.y + r.h - 8 - ls.length*11;
    ctx.fillStyle = '#3a2560'; ctx.fillRect(r.x+6, y-5, r.w-12, 1);
    for(let i=0;i<ls.length;i++)
      text(ls[i], r.x + r.w/2, y + i*11, {sc:1, align:'center', color: Snd.on ? P.gold : '#6b5a8f'});
    return;
  }
  return _dwS0.call(this, win);
};

/* ------------------------------------------------------------------
   5. Тосты и редкие реплики системы
   ------------------------------------------------------------------ */
function sysToast(txt, col){ G.toast = txt; G.toastT = 2.6; G.toastCol = col || CONFIG.P.gold; }
const SYS_LINES = [
  'СИСТЕМА: ВСЁ РАБОТАЕТ. Я ПРОВЕРИЛ ТРИЖДЫ.',
  'СИСТЕМА: ПАМЯТЬ ПЕРЕПОЛНЕНА. ХОРОШИМ.',
  'СИСТЕМА: ОЖИДАНИЕ. ЭТО НЕ ОШИБКА.',
  'СИСТЕМА: КТО-ТО СМОТРИТ НА ТЕБЯ. ЭТО Я.',
  'СИСТЕМА: ФАЙЛОВ МНОГО. ЛЮБИМЫЙ — ОДИН.',
  'СИСТЕМА: НИЧЕГО НЕ СЛОМАЛОСЬ. ПОКА.',
  'СИСТЕМА: ТЫ ЗДЕСЬ. ЭТО ГЛАВНОЕ.'
];
/* приветствие рабочего стола — редко и только когда игрок ждёт */
let SYS_NEXT = 42;
const _duD0 = G.screens.desktop.update;
G.screens.desktop.update = function(dt){
  _duD0.call(this, dt);
  if(this.idleT !== undefined){
    this.idleT += dt;
    if(this.idleT > SYS_NEXT){
      this.idleT = 6;
      SYS_NEXT = 48 + Math.random()*40;
      sysToast(SYS_LINES[Math.floor(Math.random()*SYS_LINES.length)], '#8ce99a');
    }
  }
};
const _dkD0 = G.screens.desktop.key;
G.screens.desktop.key = function(k){
  this.idleT = 0;
  return _dkD0.call(this, k);
};
const _dtpD0 = G.screens.desktop.tap;
G.screens.desktop.tap = function(x,y){
  this.idleT = 0;
  return _dtpD0.call(this, x, y);
};
/** добавить MARIYA.txt на рабочий стол, когда архив пройден полностью */
function ensureMariyaIcon(){
  const d = G.screens.desktop;
  if(!d || !d.icons) return;
  if(!mariaReady() || d.icons.some(i => i.kind === 'maria')) return;
  const at = d.icons.findIndex(i => i.kind === 'arch');
  d.icons.splice(at >= 0 ? at + 1 : 2, 0, {kind:'maria', icon:'maria', name:'MARIYA.txt', node:-1, tip:'ЛИЧНЫЙ ФАЙЛ', anim:0, delay:0.2});
  d.layout();
  d.sel = -1;
}
const _deD0 = G.screens.desktop.enter;
G.screens.desktop.enter = function(){
  _deD0.call(this);
  ensureMariyaIcon();
  if(this.idleT === undefined) this.idleT = 0;
  // первый полный архив: радостный тост
  if(mariaReady() && !this._mariaToasted){
    this._mariaToasted = true;
    this._mariaT = 1.4;
  }
  if(this._mariaT > 0){
    this._mariaT -= 1/60;
    if(this._mariaT <= 0) sysToast('НА РАБОЧИЙ СТОЛ ПОЯВИЛСЯ НОВЫЙ ФАЙЛ.', '#ff5d8f');
  }
};

/* тост при запуске архива с рабочего стола */
const _laD0 = G.screens.desktop.launch;
G.screens.desktop.launch = function(it, dbl){
  const r = _laD0.call(this, it, dbl);
  if(it.kind === 'arch'){
    G.toast = 'АРХИВ: ' + AR.doneCount() + ' / ' + ARCH_N;
    G.toastT = 1.4;
  }
  return r;
};
