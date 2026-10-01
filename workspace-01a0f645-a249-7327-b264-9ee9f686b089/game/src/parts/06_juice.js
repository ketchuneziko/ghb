/* ==========================================================================
   ЧАСТЬ 6 · «С О К»  —  всё, что делает игру живой
   Пиксельные градиенты, переходы-растворения, комбо, частицы, hit-stop,
   вспышки, всплывающие цифры, настройки экрана. Чистый пиксель-арт.
   ========================================================================== */

/* --------------------------------------------------------------------------
   0. СЛУЖЕБНОЕ: состояние «сока»
   -------------------------------------------------------------------------- */
G.crt   = 1;        // 1 = развёртка/блики, 0 = максимально чётко
G.tr    = null;     // текущий переход между экранами
G.stop  = 0;        // hit-stop: кадры «замирания» после сильного удара
G.slow  = 1; G.slowT = 0;
G.flashA = 0; G.flashCol = '#fff6e8';
G.combo = 0; G.comboT = 0; G.comboMax = 0;
G.tilt  = 0;        // микро-наклон камеры при тряске
const JUICE_MAX_FX = 420;

/* --------------------------------------------------------------------------
   1. ЦВЕТ И ПИКСЕЛЬНЫЕ ГРАДИЕНТЫ (дизеринг — без размытия, строго по пикселям)
   -------------------------------------------------------------------------- */
const BAYER4 = [
  [ 0, 8, 2,10],
  [12, 4,14, 6],
  [ 3,11, 1, 9],
  [15, 7,13, 5]
];
function mixCol(a, b, t){
  const pa = parseInt(a.slice(1),16), pb = parseInt(b.slice(1),16);
  const r = Math.round(lerp((pa>>16)&255, (pb>>16)&255, t));
  const g = Math.round(lerp((pa>>8)&255,  (pb>>8)&255,  t));
  const bl= Math.round(lerp(pa&255,      pb&255,      t));
  return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1);
}
/** Вертикальный дизеринг-градиент. Заливает КАЖДЫЙ пиксель (иначе просвечивает старый кадр). */
function ditherGradVTo(paint, x, y, w, h, cTop, cBot, steps){
  const n = Math.max(2, steps || Math.round(h/4));
  const pal = [];
  for(let i=0;i<=n;i++) pal.push(mixCol(cTop, cBot, i/n));
  for(let py=0; py<h; py++){
    const t = clamp((py+0.5)/h*n - 0.5, 0, n);
    const i0 = clamp(Math.floor(t), 0, n-1);
    const frac = t - i0;
    const cA = pal[i0], cB = pal[i0+1];
    const th = frac*16;                      // упорядоченный дизеринг Байера
    const row = BAYER4[(py+y) & 3];
    for(let px=0; px<w; px++){
      if(row[px & 3] < th) paint(cB, 0, x+px, y+py, 1, 1);
      else                paint(cA, 0, x+px, y+py, 1, 1);
    }
  }
}
/** Мягкое пятно дизерингом: туманность, свечение, луна. */
function veilBlobTo(paint, cx, cy, rad, col){
  const x0 = Math.max(0, Math.floor(cx-rad)), x1 = Math.min(W, Math.ceil(cx+rad));
  const y0 = Math.max(0, Math.floor(cy-rad)), y1 = Math.min(H, Math.ceil(cy+rad));
  for(let py=y0; py<y1; py++){
    const row = BAYER4[py & 3];
    for(let px=x0; px<x1; px++){
      const d = Math.hypot(px-cx, py-cy)/rad;
      if(d>1) continue;
      if(row[px & 3] < (1-d)*(1-d)*16) paint(col, 0, px, py, 1, 1);
    }
  }
}
/** Оборачиваем контекст в «рисовальщик» — так же рисуем в offscreen-кэш. */
function painter(c){
  let last = null;
  return function(c2, th, x, y, w, h){
    if(c2 && c2 !== last){ last = c2; c.fillStyle = c2; }
    c.fillRect(x, y, w, h);
  };
}
function ctxPainter(){
  let last = null;
  return function(c2, th, x, y, w, h){
    if(c2 && c2 !== last){ last = c2; ctx.fillStyle = c2; }
    ctx.fillRect(x, y, w, h);
  };
}
function ditherGradV(x, y, w, h, cTop, cBot, steps){
  ditherGradVTo(ctxPainter(), x, y, w, h, cTop, cBot, steps);
}
/** Полупрозрачная «шторка» дизерингом (туман, затемнение, блик). */
function ditherVeil(x, y, w, h, col, a){
  ctx.fillStyle = col;
  const th = Math.max(0, Math.min(1, a))*16;
  for(let py=0; py<h; py++){
    const row = BAYER4[py & 3];
    for(let px=0; px<w; px++) if(row[px & 3] < th) ctx.fillRect(x+px, y+py, 1, 1);
  }
}
/** Радиальное затемнение по краям кадра (пиксельная виньетка). */
function vignette(str){
  const k = str==null ? 0.5 : str;
  const step = 10;
  for(let i=0;i<step;i++){
    ctx.globalAlpha = (1-i/step)*k*0.16;
    ctx.fillStyle = '#05030c';
    ctx.fillRect(i, i, W-i*2, step);
    ctx.fillRect(i, H-i-step, W-i*2, step);
    ctx.fillRect(i, i+step, step, H-i*2-step*2);
    ctx.fillRect(W-i-step, i+step, step, H-i*2-step*2);
  }
  ctx.globalAlpha = 1;
}
/** Объёмная рамка как в старых окнах. */
function bevel(x, y, w, h, light, dark, fill){
  if(fill){ ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
  ctx.fillStyle = light||'rgba(255,255,255,.22)';
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = dark||'rgba(0,0,0,.45)';
  ctx.fillRect(x, y+h-1, w, 1); ctx.fillRect(x+w-1, y, 1, h);
}
/** Мягкая «тень» под объектом. */
function dropShadow(x, y, w, h, a){
  a = a||0.35;
  ctx.fillStyle = 'rgba(6,3,14,'+a+')'; ctx.fillRect(x+2, y+3, w, h); ctx.fillRect(x+1, y+1, w, h);
  ctx.fillStyle = 'rgba(6,3,14,'+(a*0.5)+')'; ctx.fillRect(x-1, y-1, w, h);
}

/* --------------------------------------------------------------------------
   2. ЧАСТИЦЫ — много форм, гравитация, затухание
   -------------------------------------------------------------------------- */
const RINGS = [];
const POPS  = [];

/** fx(x,y,n,col,spd,life,o) — o: {ang,spread,g,drag,s,shape,fade} */
function fx(x, y, n, col, spd, life, o){
  o = o || {};
  if(FX.length > JUICE_MAX_FX) n = Math.max(1, Math.round(n*0.4));
  for(let i=0;i<n;i++){
    const a = (o.ang!=null) ? o.ang + rnd(-(o.spread||0.6), (o.spread||0.6)) : rnd(0, 6.283);
    const s = (spd==null?60:spd) * rnd(0.35, 1);
    FX.push({
      x:x, y:y,
      vx: Math.cos(a)*s, vy: Math.sin(a)*s - (o.lift||0),
      life: life||0.6, t:0,
      col: Array.isArray(col) ? col[rndi(0,col.length-1)] : col,
      s: o.s || rndi(1,2), g: (o.g==null?130:o.g), drag: (o.drag||0),
      shape: o.shape || 'px', v: s, vr: rnd(-7,7)
    });
  }
}
/** Расходящееся кольцо — удар, попадание, появление. */
function ring(x, y, col, to, life, wgt){
  RINGS.push({x:x, y:y, t:0, life:life||0.4, to:to||14, col:col||'#fff6e8', w:wgt||1});
}
/** Всплывающий текст: очки, «+5», «ИДЕАЛЬНО!». */
function popText(x, y, t, col, sc){
  POPS.push({x:x, y:y, t:t, col:col||CONFIG.P.gold, sc:sc||1, age:0, life:0.85});
}
function updateFx(dt){
  for(let i=FX.length-1;i>=0;i--){
    const p = FX[i];
    p.t += dt;
    if(p.t >= p.life){ FX.splice(i,1); continue; }
    p.vy += p.g*dt;
    if(p.drag){ p.vx -= p.vx*p.drag*dt; p.vy -= p.vy*p.drag*dt; }
    if(p.shape==='spark'){ p.rot += p.vr*dt; p.vx = Math.cos(p.rot)*p.v; p.vy = Math.sin(p.rot)*p.v; }
    p.x += p.vx*dt; p.y += p.vy*dt;
  }
  for(let i=RINGS.length-1;i>=0;i--){
    const r = RINGS[i]; r.t += dt;
    if(r.t >= r.life) RINGS.splice(i,1);
  }
  for(let i=POPS.length-1;i>=0;i--){
    const p = POPS[i]; p.age += dt;
    if(p.age >= p.life) POPS.splice(i,1);
  }
  if(G.comboT>0){ G.comboT -= dt; if(G.comboT<=0) G.combo = 0; }
}
function drawFx(){
  // кольца — под частицами
  for(const r of RINGS){
    const k = r.t/r.life, e = 1-Math.pow(1-k,2);
    const rad = r.to*e;
    ctx.globalAlpha = (1-k)*0.9;
    ringPix(r.x, r.y, rad, r.col, r.w);
    ctx.globalAlpha = 1;
  }
  for(const p of FX){
    const k = p.t/p.life;
    ctx.globalAlpha = clamp(1-k*k, 0, 1);
    ctx.fillStyle = p.col;
    if(p.shape==='line'){
      const l = 1 + p.v*0.012;
      ctx.fillRect(Math.round(p.x - Math.cos(Math.atan2(p.vy,p.vx))*l), Math.round(p.y - Math.sin(Math.atan2(p.vy,p.vx))*l), p.s*2, p.s);
    } else if(p.shape==='plus'){
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s*2, 1);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, p.s*2);
    } else {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
  }
  ctx.globalAlpha = 1;
  // всплывающие надписи
  for(const p of POPS){
    const k = p.age/p.life;
    const rise = -14*easeOut(k);
    const a = k<0.7 ? 1 : 1-(k-0.7)/0.3;
    const pop = k<0.18 ? lerp(0.6, 1, k/0.18) : 1;
    ctx.globalAlpha = clamp(a,0,1);
    const sc = p.sc*(pop>1?1:1);
    text(p.t, Math.round(p.x), Math.round(p.y+rise), {sc:sc, align:'center', color:p.col, shadow:'rgba(10,6,22,.9)'});
    ctx.globalAlpha = 1;
  }
}
function easeOut(k){ return 1-Math.pow(1-clamp(k,0,1),3); }

/* --------------------------------------------------------------------------
   3. КОМБО / СЕРИИ
   -------------------------------------------------------------------------- */
function comboAdd(n){
  n = n || 1;
  G.combo += n; G.comboT = 2.4;
  if(G.combo > G.comboMax) G.comboMax = G.combo;
}
function comboBreak(){ G.combo = 0; G.comboT = 0; }
function comboMul(){ return 1 + Math.min(1.5, Math.floor(G.combo/4)*0.25); }
/** Счётчик серии (с «ударным» появлением). align: center | left | right */
function drawCombo(x, y, label, align){
  if(G.combo < 2) return;
  const k = clamp(G.comboT/2.4, 0, 1);
  const col = G.combo>=12 ? CONFIG.P.gold : CONFIG.P.pink2;
  ctx.globalAlpha = clamp(k*2.2, 0, 1);
  const t = (label||'СЕРИЯ')+' x'+G.combo;
  const w = textW(t,1)+8;
  const X = align==='left' ? Math.round(x) : (align==='right' ? Math.round(x-w) : Math.round(x-w/2));
  const bob = G.comboT > 2.15 ? -1 : 0;
  panel(X, Math.round(y)-2+bob, w, 14, 'rgba(20,10,36,.82)', 'rgba(107,79,160,.75)');
  text(t, X+4, y+1+bob, {sc:1, color:col});
  if(G.combo>=8 && Math.floor(G.comboT*6)%2===0)
    text('★'+comboMul().toFixed(2).slice(1), X+w+3, y+1+bob, {sc:1, color:CONFIG.P.gold});
  ctx.globalAlpha = 1;
}

/* --------------------------------------------------------------------------
   4. ТРЯСКА, HIT-STOP, ВСПЫШКА
   -------------------------------------------------------------------------- */
function hitstop(sec){ G.stop = Math.max(G.stop, sec==null?0.06:sec); }
function slowmo(scale, sec){ G.slow = scale; G.slowT = sec; }
function flashScreen(col, a){ G.flashCol = col||'#fff6e8'; G.flashA = Math.max(G.flashA, a||0.5); }
/** Универсальный «удар»: тряска + стоп-кадр + кольцо + искры. */
function impact(x, y, col, mag, ringTo){
  shake(mag==null?4:mag);
  hitstop(0.05);
  ring(x, y, col||CONFIG.P.ink, ringTo||16, 0.34);
  fx(x, y, 8, col||CONFIG.P.gold, 70, 0.4, {g:60, s:1, shape:'px'});
}

/* --------------------------------------------------------------------------
   5. ПЕРЕХОДЫ: пиксельное «растворение» + бегущая строка развёртки
   -------------------------------------------------------------------------- */
const TR_B = 6;                       // размер «пикселя» растворения
let TR_CELLS = null, TR_W = -1, TR_H = -1;
function trCells(){
  const cw = Math.ceil(W/TR_B), ch = Math.ceil(H/TR_B);
  if(TR_W!==W || TR_H!==H || !TR_CELLS || TR_CELLS.length!==cw*ch){
    const R = mulberry32(1337);
    const arr = [];
    for(let i=0;i<cw*ch;i++) arr.push({i:i, k:R()});
    arr.sort((a,b)=>a.k-b.k);
    TR_CELLS = arr; TR_W = W; TR_H = H;
  }
  return {cw:cw, ch:ch};
}
function go(state, arg){
  if(G.state === state && !arg) return;
  G.tr = {t:0, d:0.30, to:[state, arg]};
  G.fade = 0; G.fadeTo = null;
}
function drawTransOverlay(){
  if(!G.tr) return;
  const tr = G.tr, k = clamp(tr.t/tr.d, 0, 1);
  const {cw, ch} = trCells();
  const n = cw*ch, show = Math.round(n*k);
  ctx.fillStyle = '#0a0616';
  for(let i=0;i<show;i++){
    const c = TR_CELLS[i].i;
    ctx.fillRect((c%cw)*TR_B, Math.floor(c/cw)*TR_B, TR_B, TR_B);
  }
  // бегущая световая строка, как у старого телевизора
  const ly = Math.round((1-k)*H);
  ctx.fillStyle = 'rgba(255,246,232,'+(0.5*(1-k)).toFixed(2)+')';
  ctx.fillRect(0, ly, W, 1);
  ctx.fillStyle = 'rgba(160,140,192,'+(0.25*(1-k)).toFixed(2)+')';
  ctx.fillRect(0, ly+1, W, 1);
}

/* --------------------------------------------------------------------------
   6. НЕБО: кэшированный дизеринг-градиент + параллакс + падающие звёзды
   -------------------------------------------------------------------------- */
/** Затемняющая «шторка» сверху/снизу: плотно у края, дырявенько к центру. */
function scrimTo(paint, x, y, w, h, col, aTop, aBot){
  const n = 7;
  const parts = col.split(',');
  for(let i=0;i<n;i++){
    const y0 = Math.round(y + h*i/n), y1 = Math.round(y + h*(i+1)/n);
    const th = 16*(1 - (i+0.5)/n);
    paint('rgba('+parts[0]+','+parts[1]+','+parts[2]+','+(lerp(aTop,aBot,(i+0.5)/n).toFixed(3))+')', 0);
    for(let py=y0; py<y1; py++){
      const row = BAYER4[py & 3];
      for(let px=0; px<w; px++) if(row[px & 3] < th) paint(null, 0, x+px, py, 1, 1);
    }
  }
}
let SKY = null, SKY_W = -1, SKY_H = -1;
function skyCache(){
  if(SKY && SKY_W===W && SKY_H===H) return SKY;
  SKY_W = W; SKY_H = H;
  SKY = document.createElement('canvas'); SKY.width = W; SKY.height = H;
  const paint = painter(SKY.getContext('2d'));
  const hh = Math.round(H*0.5);
  ditherGradVTo(paint, 0, 0, W, hh, '#2b1a5e', '#181038', Math.max(8, Math.round(hh/4)));
  ditherGradVTo(paint, 0, hh, W, H-hh, '#181038', '#0a0518', Math.max(8, Math.round((H-hh)/4)));
  veilBlobTo(paint, W*0.24, H*0.30, Math.max(W,H)*0.60, 'rgba(126,88,200,.20)');
  veilBlobTo(paint, W*0.82, H*0.12, Math.max(W,H)*0.46, 'rgba(76,201,240,.13)');
  veilBlobTo(paint, W*0.55, H*0.96, Math.max(W,H)*0.42, 'rgba(255,93,143,.10)');
  scrimTo(paint, 0, 0, W, 26, '4,2,14', 0.55, 0.0);      // тёмная полоса под HUD
  return SKY;
}
const SHOOT = [];
function shootingStar(){
  SHOOT.push({x: rnd(0, W*0.55), y: rnd(6, H*0.30), vx: rnd(150,240), vy: rnd(60,110), t:0, life: rnd(0.4,0.65)});
  if(SHOOT.length>3) SHOOT.shift();
}
function stars(t){
  const R = mulberry32(7);
  for(let i=0;i<70;i++){
    const sx = Math.floor(R()*W), sy = Math.floor(R()*H*0.8), ph = R()*6.28;
    const tw = 0.5+0.5*Math.sin(t*1.2+ph);
    const a = 0.14+0.5*tw*tw;
    ctx.fillStyle = 'rgba(255,246,232,'+a.toFixed(2)+')';
    ctx.fillRect(sx, sy, R()<0.15?2:1, 1);
  }
  for(let i=SHOOT.length-1;i>=0;i--){
    const s = SHOOT[i];
    s.t += 1/60; s.x += s.vx/60; s.y += s.vy/60;
    if(s.t>s.life || s.x>W+4 || s.y>H+4){ SHOOT.splice(i,1); continue; }
    const x0 = Math.round(s.x), y0 = Math.round(s.y);
    const a = 0.8*(1-s.t/s.life);
    ctx.fillStyle = 'rgba(255,246,232,'+a.toFixed(2)+')';
    ctx.fillRect(x0, y0, 4, 1);
    ctx.fillStyle = 'rgba(200,180,255,'+(a*0.45).toFixed(2)+')';
    ctx.fillRect(x0-2, y0-1, 2, 1);
  }
}
function skyBg(t){
  const c = skyCache();
  if(c) ctx.drawImage(c, 0, 0);
  if(Math.random() < 0.006) shootingStar();
  stars(t);
  // луна с кратерами и свечением
  const mx = W-30, my = 18;
  ctx.globalAlpha = 0.10; ctx.fillStyle = '#ffeccf';
  ctx.fillRect(mx-5, my-5, 24, 24); ctx.fillRect(mx-3, my-7, 20, 28); ctx.fillRect(mx-7, my-3, 28, 20);
  ctx.globalAlpha = 0.20; ctx.fillRect(mx-3, my-3, 20, 20);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffeccf'; ctx.fillRect(mx, my, 14, 14);
  ctx.fillStyle = '#f3ddba'; ctx.fillRect(mx+2, my+3, 2, 2); ctx.fillRect(mx+8, my+2, 2, 1); ctx.fillRect(mx+5, my+9, 3, 2);
  ctx.fillStyle = '#241350'; ctx.fillRect(mx+4, my-3, 10, 10);
}

/* --------------------------------------------------------------------------
   7. CRT: развёртка стала аккуратнее, её можно выключить (клавиша C)
   -------------------------------------------------------------------------- */
function crtOverlay(t){
  if(!G.crt) return;
  ctx.globalAlpha = 0.045; ctx.fillStyle = '#000000';
  for(let y=0;y<H;y+=2) ctx.fillRect(0,y,W,1);
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0,0,W*0.6,H*0.6);
  g.addColorStop(0,'rgba(255,255,255,.04)'); g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  if(Math.sin(t*0.7) > 0.985){
    ctx.globalAlpha = 0.05; ctx.fillStyle='#fff6e8';
    ctx.fillRect(0, Math.floor((t*260)%H), W, 2); ctx.globalAlpha = 1;
  }
}
const _onKeyOld = G.onKey;
G.onKey = function(k){
  const typing = (this.state==='level' && LEVELS[this.level] && LEVELS[this.level].typing)
              || (this.state==='desktop' && G.win && G.win.kind==='term');
  if(!typing && (k==='c'||k==='C'||k==='с'||k==='С')){
    G.crt = G.crt ? 0 : 1;
    this.toast = G.crt ? 'ЭФФЕКТЫ ВКЛ' : 'РЕЗКИЙ РЕЖИМ';
    this.toastT = 1.4; Snd.blip(); return;
  }
  _onKeyOld.call(this, k);
};

/* --------------------------------------------------------------------------
   8. КЭШ ФОНОВ И СВЕЧЕНИЙ (иначе дизеринг каждый кадр — слишком тяжело)
   -------------------------------------------------------------------------- */
const BGC = {};
/** Кэшированный фоновый слой: bgCache('ключ', paint => {...}) */
function bgCache(key, build){
  const c = BGC[key];
  if(c && c.width===W && c.height===H) return c;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  build(painter(cv.getContext('2d')), W, H);
  BGC[key] = cv;
  return cv;
}
/** Кэшированное дырявое свечение (радиальное пятно) — рисуется одним drawImage. */
const BLOBS = {};
function blob(col, r){
  const k = col+'|'+r;
  if(BLOBS[k]) return BLOBS[k];
  const d = r*2+2;
  const cv = document.createElement('canvas'); cv.width = d; cv.height = d;
  const paint = painter(cv.getContext('2d'));
  for(let py=0; py<d; py++){
    const row = BAYER4[py & 3];
    for(let px=0; px<d; px++){
      const dist = Math.hypot(px-r, py-r)/r;
      if(dist>1) continue;
      if(row[px & 3] < (1-dist)*(1-dist)*16) paint(col, 0, px, py, 1, 1);
    }
  }
  BLOBS[k] = cv;
  return cv;
}
/** Мягкое пятно на экране: ditherGlow(x, y, r, col, alpha). */
function ditherGlow(x, y, r, col, a){
  const b = blob(col, Math.max(8, Math.round(r/2)));
  ctx.globalAlpha = a;
  ctx.drawImage(b, Math.round(x-b.width/2), Math.round(y-b.height/2));
  ctx.globalAlpha = 1;
}
