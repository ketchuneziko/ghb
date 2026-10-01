/* ==========================================================================
   ЧАСТЬ 31 · ТРЕТЬЯ ВОЛНА — графика и детали для сюжетных уровней,
   рабочего стола и комнаты памяти. Только добавляем, ничего не ломаем.
   0 ШИФР      — живая подсветка активного кольца + курсор
   2 ВОСПОМИН. — звёздное поле и падающие звёзды
   3 ЛАБИРИНТ  — дождь и фонарь, идущий за тобой
   4 КОД       — зелёный «терминал» и сканлайн
   Рабочий стол — шлейф курсора и дыхание подсветки
   MEMORY ROOM — стук часов и мягкий свет
   ========================================================================== */

/* ---------- общее: используем готовое звёздное поле из 18_juice2 ---------- */
/* падающая звезда — изредка, на 1.2 секунды */
function starfall(t){
  const p = (t % 11) / 11;
  if(p > 0.14) return;
  const k = p/0.14;
  const x = W*(0.15 + 0.7*((t*0.37)%1));
  const y = H*0.12 + k*H*0.45;
  const tail = 14 + k*10;
  ctx.globalAlpha = 0.8*(1-k*0.6);
  for(let i=0;i<tail;i++){
    const f = i/tail;
    ctx.fillStyle = i<3 ? '#fff6e8' : 'rgba(201,189,232,'+(0.5*f).toFixed(2)+')';
    ctx.fillRect(Math.round(x - f*10), Math.round(y - f*4), 1, 1);
  }
  ctx.globalAlpha = 1;
}

/* ==========================================================================
   0 · ШИФР — подсветка активного кольца и курсор набора
   ========================================================================== */
(function(){
const L = LEVELS[0]; if(!L) return;
bpFields(L, {bpSel:0, bpSelT:0});
bpWrap(L, 'update', function(){
  if(this.sel !== undefined && this.sel !== this.bpSel){ this.bpSel = this.sel; this.bpSelT = 0; }
  if(this.bpSelT < 1) this.bpSelT += 1/60;
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P;
  if(this.sh && this.sh.rings && this.sh.rings[this.sel]){
    const r = this.sh.rings[this.sel];
    const a = 0.14 + 0.10*Math.abs(Math.sin(this.t*3.2));
    ctx.globalAlpha = a;
    glowAt(r.cx, r.cy, r.r*1.25, P.gold, 1);
    ctx.globalAlpha = 1;
  }
  if(this.strip && this.strip.cursor && this.strip.show){
    const c = this.strip.cursor;
    if(Math.floor(this.t*3) % 2 === 0){
      ctx.fillStyle = P.gold;
      ctx.fillRect(Math.round(c.x)-1, Math.round(c.y)-1, 2, 8);
    }
  }
});
})();

/* ==========================================================================
   2 · ВОСПОМИНАНИЯ — звёзды
   ========================================================================== */
(function(){
const L = LEVELS[2]; if(!L) return;
bpFields(L, {});
const _e2 = L.enter;
L.enter = function(){ _e2.call(this); initStars(30); };
bpWrap(L, 'draw', function(){
  drawStars(this.t, 0.5);
  starfall(this.t);
  if(this.stop && this.walk){
    const a = 0.18 + 0.10*Math.abs(Math.sin(this.t*2));
    ctx.globalAlpha = a;
    glowAt(this.stop.x, this.stop.y, 22, CONFIG.P.pink, 1);
    ctx.globalAlpha = 1;
  }
});
})();

/* ==========================================================================
   3 · ЛАБИРИНТ И ДОЖДЬ — дождь и фонарь
   ========================================================================== */
(function(){
const L = LEVELS[3]; if(!L) return;
bpFields(L, {bpTrail:[], bpLamp:null});
bpWrap(L, 'update', function(){
  const p = this.p || {x:this.cx, y:this.cy};
  this.bpTrail.push({x:p.x, y:p.y});
  if(this.bpTrail.length > 18) this.bpTrail.shift();
  const back = this.bpTrail[Math.max(0, this.bpTrail.length-6)];
  if(!this.bpLamp) this.bpLamp = {x:back.x, y:back.y};
  this.bpLamp.x = lerp(this.bpLamp.x, back.x, 0.10);
  this.bpLamp.y = lerp(this.bpLamp.y, back.y, 0.10);
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.t;
  // дождь: два слоя
  for(let LAY=0; LAY<2; LAY++){
    const n = LAY ? 14 : 22, sp = LAY ? 190 : 120;
    ctx.globalAlpha = LAY ? 0.18 : 0.10;
    ctx.fillStyle = P.sky;
    for(let i=0;i<n;i++){
      const y = ((i*71 + t*sp) % (H+16)) - 8;
      const x = ((i*113 + t*24) % (W+16)) - 8;
      ctx.fillRect(Math.round(x), Math.round(y), 1, LAY ? 4 : 2);
    }
    ctx.globalAlpha = 1;
  }
  // фонарь отстаёт от игрока
  const lp = this.bpLamp;
  if(lp){
    for(let i=0;i<this.bpTrail.length;i++){
      const p = this.bpTrail[i], k = i/this.bpTrail.length;
      ctx.globalAlpha = k*0.10;
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(Math.round(p.x)-1, Math.round(p.y)-1, 2, 2);
      ctx.globalAlpha = 1;
    }
    const fl = 0.85 + 0.15*Math.sin(t*7);
    ctx.globalAlpha = 0.10*fl;
    glowAt(lp.x, lp.y, 26, '#ffd166', 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe6a8';
    ctx.fillRect(Math.round(lp.x)-1, Math.round(lp.y)-2, 3, 3);
  }
});
})();

/* ==========================================================================
   4 · ИСПРАВЛЕНИЕ КОДА — терминал
   ========================================================================== */
(function(){
const L = LEVELS[4]; if(!L) return;
bpFields(L, {bpScan:0});
bpWrap(L, 'update', function(){ this.bpScan += 1/60; });
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.bpScan;
  // сканлайн
  const y = (t*38) % H;
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = '#8ce99a'; ctx.fillRect(0, Math.round(y), W, 2);
  ctx.globalAlpha = 1;
  // зелёное свечение по краям
  ctx.globalAlpha = 0.05 + 0.02*Math.abs(Math.sin(this.t*1.4));
  ctx.fillStyle = P.green;
  ctx.fillRect(0, 0, 3, H); ctx.fillRect(W-3, 0, 3, H);
  ctx.globalAlpha = 1;
  if(this.err > 0){
    const a = clamp(1 - this.err/3, 0, 1);
    ctx.globalAlpha = 0.10*a;
    ctx.fillStyle = P.red; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
});
})();

/* ==========================================================================
   Рабочий стол — шлейф курсора, дыхание подсветки
   ========================================================================== */
(function(){
const D = G.screens.desktop; if(!D || !D.draw) return;
const _d = D.draw;
D.draw = function(){
  _d.call(this);
  const P = CONFIG.P, t = this.t;
  if(!this.bpTr) this.bpTr = [];
  if(!IS_TOUCH){
    this.bpTr.push({x:ptr.x, y:ptr.y, t:0});
    if(this.bpTr.length > 12) this.bpTr.shift();
    for(const p of this.bpTr){
      p.t += 1/60;
      if(p.t > 0.32) continue;
      ctx.globalAlpha = (1 - p.t/0.32)*0.30;
      ctx.fillStyle = P.pink2;
      ctx.fillRect(Math.round(p.x)-1, Math.round(p.y)-1, 2, 2);
      ctx.globalAlpha = 1;
    }
  }
  // мягкий свет под выбранной иконкой
  const it = this.icons[this.sel];
  if(it){
    const a = 0.10 + 0.05*Math.abs(Math.sin(t*1.8));
    ctx.globalAlpha = a;
    glowAt(it.tx, it.ty-4, 26, P.gold, 1);
    ctx.globalAlpha = 1;
  }
};
})();

/* ==========================================================================
   MEMORY ROOM — стук часов и свет
   ========================================================================== */
(function(){
const M = G.screens.memroom; if(!M || !M.update) return;
const _u = M.update;
let lastTick = -1;
M.update = function(dt){
  _u.call(this, dt);
  this.t += 0;                       // время уже идёт в базовом методе
  const s = Math.floor(this.t);
  if(s !== lastTick){
    lastTick = s;
    if(s % 4 === 0 && this.open < 0) Snd.note(880, 0.03, 'sine', 0.045);   // тик часов
  }
};
const _d = M.draw;
M.draw = function(){
  const g = this.geom();
  _d.call(this);
  // лампа чуть дышит
  ctx.globalAlpha = 0.05 + 0.02*Math.abs(Math.sin(this.t*1.3));
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, g.floorY, W, H-g.floorY);
  ctx.globalAlpha = 1;
};
const _op = M.openPhoto;
M.openPhoto = function(i){
  _op.call(this, i);
  Snd.note(392, 0.10, 'sine', 0.07);
  Snd.note(523, 0.16, 'sine', 0.05);
};
})();
