/* ==========================================================================
   ЧАСТЬ 18 · РАСШИРЕНИЕ «СОЧНОСТИ»
   Новые easing-функции, безопасные круги, составные эффекты,
   экранная «шторка», звёзды, пылинки, дождь, блёстки на кнопках.
   Всё поверх уже существующих FX/RINGS/POPS из части 06 — без дублей.
   ========================================================================== */

/* ---------- easing ---------- */
const eOut    = t => 1 - Math.pow(1-clamp(t,0,1), 3);
const eIn     = t => Math.pow(clamp(t,0,1), 3);
const eInOut  = t => { t = clamp(t,0,1); return t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; };
const eBack   = t => { t = clamp(t,0,1); const c = 1.75; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); };
const eElastic= t => { t = clamp(t,0,1); if(t===0||t===1) return t;
  return Math.pow(2,-9*t)*Math.sin((t*10-0.75)*(2*Math.PI/3))+1; };
/** кадронезависимое приближение a к b */
const approach = (a, b, k, dt) => a + (b-a)*(1 - Math.pow(k, dt*60));
/** масштаб «появился с нуля» */
const popIn = (t, dur) => eBack(clamp(t/(dur||0.25), 0, 1));
/** мягкое покачивание для простаивания */
const wobble = (t, spd, amt) => Math.sin(t*(spd||2))*(amt==null?1:amt);

/* ==========================================================================
   1 · ПИКСЕЛЬНЫЙ КРУГ БЕЗ ctx.arc
   ========================================================================== */
function ringPix(cx, cy, r, col, w){
  r = Math.round(r); w = w || 1;
  if(r <= 0) return;
  ctx.fillStyle = col;
  const px = Math.round(cx), py = Math.round(cy);
  const inner = Math.max(0, r - w);
  for(let dy=-r; dy<=r; dy++){
    const rr = r*r - dy*dy;
    if(rr < 0) continue;
    const dx = Math.floor(Math.sqrt(rr));
    const ir = inner <= 0 ? 0 : Math.floor(Math.sqrt(Math.max(0, inner*inner - dy*dy)));
    const y = py + dy;
    if(px-ir-1 >= px-dx) ctx.fillRect(px-dx, y, (px-ir)-(px-dx), 1);
    if(px+dx >= px+ir+1)   ctx.fillRect(px+ir+1, y, (px+dx)-(px+ir+1), 1);
  }
}
/** маленькая звёздочка */
function drawStar(x, y, s, col){
  s = s || 3; ctx.fillStyle = col;
  ctx.fillRect(x-s, y, s*2+1, 1);
  ctx.fillRect(x, y-s, 1, s*2+1);
  if(s > 2) ctx.fillRect(x-1, y-1, 3, 3);
}

/* ==========================================================================
   2 · СОСТАВНЫЕ ЭФФЕКТЫ (сверху fx/ring/popText/impact)
   ========================================================================== */

/** идеальное попадание: кольцо + искры + надпись + микро-тряска */
function hitSpark(x, y, col, label, sc){
  col = col || CONFIG.P.gold;
  ring(x, y, col, 20, .32, 1);
  fx(x, y, 12, [col, '#fff6e8', CONFIG.P.pink2], 95, .45, {g:70, s:1, shape:'plus'});
  if(label) popText(x, y-10, label, col, sc||1);
  shake(1.6);
}
/** промах: короткое серое кольцо и «тук» */
function missSpark(x, y){
  ring(x, y, '#6b5a8f', 12, .22, 1);
  fx(x, y, 6, '#6b5a8f', 50, .3, {g:120, s:1});
  popText(x, y-8, 'мимо', '#8f83ad', 1);
}
/** кольцо искр по кругу — «взрыв» */
function burstRing(x, y, col, n, rad, sp){
  n = n || 12;
  for(let i=0;i<n;i++){
    const a = i/n*Math.PI*2;
    fx(x + Math.cos(a)*rad, y + Math.sin(a)*rad, 1, col,
       (sp||46)*rnd(.8,1.2), .4, {g:0, s:1, drag:1.2});
  }
}
/** конфетти сверху — победа, финал, любовь */
function confettiRain(n, cols){
  cols = cols || [CONFIG.P.pink, CONFIG.P.pink2, CONFIG.P.gold, '#fff6e8', CONFIG.P.sky, '#8ce99a'];
  for(let i=0;i<(n||30);i++){
    fx(rnd(-6, W+6), rnd(-H*.4, -2), 1, cols[rndi(0, cols.length-1)],
       rnd(24, 70), rnd(1.6, 3.0), {g:34, s:Math.random()<.4?2:1, shape:'line', drag:.12});
  }
}
/** брызги воды / пыль под ногами */
function splash(x, y, col, n, ang){
  for(let i=0;i<(n||6);i++){
    fx(x + rnd(-2,2), y, 1, col || '#6bc7ff', rnd(20, 66), rnd(.22,.5), {g:300, s:1});
  }
}
/** дым/пшик при проигрыше */
function poof(x, y, col){
  for(let i=0;i<9;i++){
    fx(x + rnd(-5,5), y + rnd(-3,3), 1, col || '#6b5a8f', rnd(10, 34), rnd(.3,.6), {g:-20, s:Math.random()<.5?2:1, drag:1.6});
  }
  ring(x, y, col || '#6b5a8f', 18, .3);
}
/** празднование: конфетти + вспышка + надпись */
function celebrate(txt, col){
  confettiRain(46);
  flashScreen(col || CONFIG.P.gold, .35);
  shake(3);
  if(txt) popText(W/2, H*.42, txt, col || CONFIG.P.gold, 2);
}
/** след из сердечек за точкой (мышь/палец/объект) */
const HEART_TRAIL = [];
function heartTrail(x, y, col, every){
  every = every || 3;
  if(HEART_TRAIL.length >= every) HEART_TRAIL.shift();
  HEART_TRAIL.push({x:x, y:y, col:col||CONFIG.P.pink2, t:0});
}
function updateHeartTrail(dt){
  for(let i=HEART_TRAIL.length-1;i>=0;i--){
    const h = HEART_TRAIL[i];
    h.t += dt; h.y -= 12*dt;
    if(h.t > .6) HEART_TRAIL.splice(i,1);
  }
}
function drawHeartTrail(){
  for(let i=0;i<HEART_TRAIL.length;i++){
    const h = HEART_TRAIL[i];
    ctx.globalAlpha = clamp(1 - h.t/.6, 0, 1) * .8;
    heart(Math.round(h.x), Math.round(h.y), i%2?1:1, h.col);
  }
  ctx.globalAlpha = 1;
}

/* ==========================================================================
   3 · «ЖИВОЙ» ИНТЕРФЕЙС
   ========================================================================== */
/** бегущий блик по кнопке/панели (без clip) */
function shineRect(x, y, w, h, t, col, spd){
  spd = spd || 60;
  const p = ((t*spd) % (w + h*2 + 90)) - h - 45;
  ctx.globalAlpha = .13;
  ctx.fillStyle = col || '#fff6e8';
  for(let i=0;i<12;i++){
    const px = Math.round(x + p + i*4);
    if(px < x || px >= x + w) continue;
    ctx.fillRect(px, y, Math.min(2, x + w - px), h);
  }
  ctx.globalAlpha = 1;
}
/** дышащее свечение */
function pulseGlow(x, y, r, col, t, spd, amt){
  glowAt(x, y, r, col, (amt||.3) * (.6 + .4*Math.sin(t*(spd||3))));
}
/** полоса прогресса с бегущим бликом */
function barFlash(x, y, w, h, k, col, t){
  const ww = Math.max(0, Math.min(1, k))*w;
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(ww), h);
  if(ww > 6){
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fillRect(x + Math.round(ww) - 1, y, 1, h);
    const p = ((t*40) % (w + 30)) - 15;
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    for(let i=0;i<4;i++){
      const px = Math.round(x + p + i*4);
      if(px >= x && px < x + ww) ctx.fillRect(px, y, 2, h);
    }
  }
}

/* ==========================================================================
   4 · ФОНОВЫЕ СЛОИ
   ========================================================================== */
const STARS = [];
function initStars(n){
  STARS.length = 0;
  for(let i=0;i<(n||26);i++)
    STARS.push({x: rnd(0,W), y: rnd(0,H*.72), s: Math.random()<.18?2:1, ph: rnd(0,6.283), sp: rnd(.6,2.2)});
}
function drawStars(t, mul){
  ctx.fillStyle = '#cfe0ff';
  for(const s of STARS){
    ctx.globalAlpha = (.2 + .8*Math.abs(Math.sin(t*s.sp + s.ph))) * (mul||1);
    ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
  }
  ctx.globalAlpha = 1;
}
const DUST = [];
function initDust(n){
  DUST.length = 0;
  for(let i=0;i<(n||18);i++)
    DUST.push({x: rnd(0,W), y: rnd(0,H), vy: rnd(-9,-2), a: rnd(.1,.35), s: Math.random()<.3?2:1, ph: rnd(0,6.28)});
}
function updateDust(dt, t){
  for(const d of DUST){
    d.y += d.vy*dt;
    d.x += Math.sin(t*.7 + d.ph)*4*dt;
    if(d.y < -2){ d.y = H+2; d.x = rnd(0,W); }
  }
}
function drawDust(){
  for(const d of DUST){
    ctx.globalAlpha = d.a * (.6 + .4*Math.abs(Math.sin(d.ph*3)));
    ctx.fillStyle = '#ffd9f0';
    ctx.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s);
  }
  ctx.globalAlpha = 1;
}
/** дождь с ударами о землю (cb(x,y) при падении капли) */
const DROPS = [];
function rainStep(n, spd, wind){
  for(let i=0;i<(n||1);i++)
    DROPS.push({x: rnd(-20, W+20), y: rnd(-H, 0), v: rnd(150, 270)*(spd||1), w: (wind||0), len: rnd(4, 11)});
  if(DROPS.length > 240) DROPS.splice(0, DROPS.length-240);
}
function rainUpdate(dt, groundY, cb){
  for(let i=DROPS.length-1;i>=0;i--){
    const d = DROPS[i];
    d.y += d.v*dt; d.x += d.w*dt;
    if(groundY != null && d.y >= groundY){
      if(cb) cb(d.x, groundY);
      DROPS.splice(i,1);
    } else if(d.y > H+20) DROPS.splice(i,1);
  }
}
function rainDraw(col, alpha){
  ctx.globalAlpha = alpha==null?.5:alpha;
  ctx.fillStyle = col || '#8fb8ff';
  for(const d of DROPS) ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, d.len);
  ctx.globalAlpha = 1;
}
function rainClear(){ DROPS.length = 0; }

/* ==========================================================================
   5 · ЭКРАННАЯ «ШТОРКА» (переход между экранами)
   ========================================================================== */
let _wipe = 0, _wipeDir = 1, _wipeCb = null;
function wipe(dir, cb){
  if(_wipe > 0) return;
  _wipe = 0.001; _wipeDir = dir || 1; _wipeCb = cb || null;
}
function updateWipe(dt){
  if(_wipe <= 0) return;
  _wipe += dt;
  if(_wipe > .5){
    if(_wipeCb){ const c = _wipeCb; _wipeCb = null; _wipe = -1; c(); return; }
    if(_wipe > 1) _wipe = 0;
  }
}
function drawWipe(){
  if(_wipe <= 0) return;
  const k = _wipe < .5 ? eIn(_wipe/.5) : 1 - eOut((_wipe-.5)/.5);
  if(k <= 0) return;
  const cell = 6, cols = Math.max(1,Math.ceil(W/cell)), rows = Math.max(1,Math.ceil(H/cell));
  ctx.fillStyle = '#0a0518';
  for(let ry=0; ry<rows; ry++){
    for(let cx=0; cx<cols; cx++){
      const d = _wipeDir > 0 ? (cx/(cols-1)*.6 + ry/(rows-1)*.4) : (1 - (cx/(cols-1)*.6 + ry/(rows-1)*.4));
      const a = clamp((k*1.12 - d) * 5, 0, 1);
      if(a <= 0) continue;
      ctx.globalAlpha = a;
      const g = (1-k)*4;
      ctx.fillRect(cx*cell, ry*cell, Math.max(1, cell-g), Math.max(1, cell-g));
    }
  }
  ctx.globalAlpha = 1;
}
