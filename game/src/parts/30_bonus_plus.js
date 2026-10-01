/* ==========================================================================
   ЧАСТЬ 30 · ВТОРАЯ ВОЛНА — новые механики и графика для 7 бонусных игр
   Ничего не ломаем: оборачиваем enter/update/draw и добавляем своё состояние
   с префиксом bp_. Все новые поля опциональны — если их нет, игра работает
   как раньше.
   5 РУКА       — ГОРЯЧАЯ РУКА (искры ловятся рукой, двойной обогрев)
   6 РИТМ       — ЦЕПЬ (серия из 6 попаданий: слоумо + вспышка)
   7 ДОЖДЬ      — ЛИВЕНЬ + МОЛНИЯ (магнит на 3 секунды)
   8 ЛАБИРИНТ   — СВЕТЛЯЧОК (отстающий огонёк, подсказка к цели)
   9 НЕ ПРОМОКНИ— РЫВОК (рывок + инерция, каденция 2.6 с)
   10 КОД        — КОНСОЛЬ (живой лог режима и ошибок)
   11 ПЕЧАТЬ     — ЛЕНТА (бумага с текстом, разворот в финале)
   ========================================================================== */

const BP = {};
const BP_R = Math.PI*2;

/** безопасно обернуть метод уровня */
function bpWrap(L, name, after){
  const old = L[name];
  L[name] = function(){
    const r = old.apply(this, arguments);
    after.call(this, arguments);
    return r;
  };
  return old;
}
/** новые поля уровня (bp_*) */
function bpFields(L, def){
  const old = L.enter;
  L.enter = function(){
    if(old) old.apply(this, arguments);
    for(const k in def) this[k] = def[k];
  };
}
function bpNow(){ return G.state === 'level' && LEVELS[G.level] === this; }

/* маленький прибор: заряд-шкала в едином стиле */
function bpGauge(x, y, w, h, v, col, glowCol){
  ctx.fillStyle = '#120a24'; ctx.fillRect(x-1, y-1, w+2, h+2);
  ctx.fillStyle = '#241445'; ctx.fillRect(x, y, w, h);
  const f = Math.max(0, Math.round((w-2)*clamp(v,0,1)));
  ctx.fillStyle = col; ctx.fillRect(x+1, y+1, f, h-2);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x+1, y+1, f, 1);
  if(glowCol && f > w*0.85){
    ctx.globalAlpha = 0.20 + 0.20*Math.abs(Math.sin(performance.now()/120));
    ctx.fillStyle = glowCol; ctx.fillRect(x-2, y-2, w+4, h+4);
    ctx.globalAlpha = 1;
  }
}

/* ==========================================================================
   5 · РУКА — ГОРЯЧАЯ РУКА
   ========================================================================== */
(function(){
const L = LEVELS[5]; if(!L) return;
BP.ruka = L;
bpFields(L, {bpHeat:0, bpHot:0, bpSparks:[], bpSparkT:0});
const _say = L.say;
L.say = function(t, col){
  _say.call(this, t, col);
  if(t === 'ИДЕАЛЬНО!') this.bpHeat = Math.min(100, this.bpHeat + 13);
  else if(t === 'ЗОЛОТОЙ УЛОВ!') this.bpHeat = Math.min(100, this.bpHeat + 22);
  else if(t === 'МИМО' || t === 'ПУСТОТА') this.bpHeat = Math.max(0, this.bpHeat - 12);
};
const R = Math.PI*2;
bpWrap(L, 'update', function(){
  const dt = 1/60;
  if(this.bpHot > 0){
    this.bpHot -= dt;
    this.bpSparkT -= dt;
    if(this.bpSparkT <= 0){
      this.bpSparkT = 0.42;
      this.bpSparks.push({a:rnd(0,R), r:this.R + 26, sp:rnd(26,44), t:0});
    }
    for(let i=this.bpSparks.length-1;i>=0;i--){
      const s = this.bpSparks[i];
      s.t += dt; s.r -= s.sp*dt; s.a += dt*0.5;
      const px = this.cx + Math.cos(s.a)*s.r, py = this.cy + Math.sin(s.a)*s.r;
      let d = s.a - this.a;
      while(d > Math.PI) d -= R; while(d < -Math.PI) d += R;
      if(s.r < this.R + 20 && Math.abs(d) < 0.19){
        this.meter = Math.min(100, this.meter + 7);
        popText(px, py-6, '+7', CONFIG.P.gold);
        ring(px, py, CONFIG.P.gold, 16, 0.26);
        fx(px, py, 5, CONFIG.P.gold, 60, 0.4, {g:30});
        Snd.coin();
        this.bpSparks.splice(i,1);
        if(this.meter >= 100 && bpNow.call(this)){ this.meter = 100; this.win(); }
        continue;
      }
      if(s.r < 8 || s.t > 4) this.bpSparks.splice(i,1);
    }
    if(this.bpHot <= 0){
      this.bpHot = 0; this.bpSparks.length = 0;
      this.say('РУКА ОСТЫЛА', CONFIG.P.dim);
    }
  } else if(this.bpHeat >= 100){
    this.bpHeat = 0; this.bpHot = 6.5; this.bpSparkT = 0;
    Snd.fanfare(); punch(.10); flashScreen(CONFIG.P.gold, .30); shake(5);
    ring(this.cx, this.cy, CONFIG.P.gold, this.R+30, .8, 1);
    ring(this.cx, this.cy, CONFIG.P.pink, this.R+14, .6, 1);
    this.say('РУКА ГОРЯЧАЯ!', CONFIG.P.gold);
  }
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.t;
  // искры
  for(const s of this.bpSparks){
    const px = Math.round(this.cx + Math.cos(s.a)*s.r), py = Math.round(this.cy + Math.sin(s.a)*s.r);
    const a = clamp(1 - s.t/3, 0, 1);
    ctx.globalAlpha = a;
    if(FXQ > .4) glowAt(px, py, 9, P.gold, .25);
    ctx.fillStyle = P.gold; ctx.fillRect(px-1, py-1, 3, 3);
    ctx.fillStyle = '#fff6e8'; ctx.fillRect(px, py, 1, 1);
    ctx.globalAlpha = 1;
  }
  // шкала тепла — в левом нижнем углу, над счётчиком серии
  const pw = 74, ph = 15, px0 = 4, py0 = H-ph-18;
  ctx.fillStyle = 'rgba(9,5,20,.78)'; ctx.fillRect(px0, py0, pw, ph);
  ctx.fillStyle = this.bpHot > 0 ? 'rgba(255,209,103,.7)' : 'rgba(107,79,160,.5)';
  ctx.fillRect(px0, py0, 1, ph);
  if(this.bpHot > 0){
    ctx.globalAlpha = .10 + .05*Math.sin(t*8);
    ctx.fillStyle = P.gold; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  const lab = this.bpHot > 0 ? ('ГОРЯЧАЯ ' + Math.ceil(this.bpHot)) : 'ТЕПЛО';
  text(lab, px0+5, py0+1, {sc:1, color: this.bpHot>0 ? P.gold : P.dim});
  bpGauge(px0+4, py0+9, pw-8, 5,
          this.bpHot > 0 ? this.bpHot/6.5 : this.bpHeat/100,
          this.bpHot > 0 ? P.gold : P.pink2, P.gold);
  if(this.bpHot > 0 && FXQ > .4) glowAt(px0+pw/2, py0+ph/2, 30, P.gold, .12);
});
})();

/* ==========================================================================
   6 · РИТМ — ЦЕПЬ
   ========================================================================== */
(function(){
const L = LEVELS[6]; if(!L || !L.hit) return;
BP.ritm = L;
bpFields(L, {bpChain:0, bpEcho:[]});
const _say = L.say;
L.say = function(t, col){
  _say.call(this, t, col);
  if(t === 'МИМО') this.bpChain = 0;
};
bpWrap(L, 'hit', function(){
  this.bpChain++;
  this.bpEcho.push({t:0, k:this.bpChain});
  if(this.bpEcho.length > 6) this.bpEcho.shift();
  if(this.bpChain % 6 === 0){
    slowmo(0.5, 0.12);
    flashScreen(CONFIG.P.gold, .14);
    ring(this.tx, this.ty, CONFIG.P.gold, 40, .45, 1);
    popText(this.tx, this.ty-34, 'ЦЕПЬ x'+this.bpChain, CONFIG.P.gold);
    Snd.fanfare();
  }
});
bpWrap(L, 'update', function(){
  for(let i=this.bpEcho.length-1;i>=0;i--){
    this.bpEcho[i].t += 1/60;
    if(this.bpEcho[i].t > 1.1) this.bpEcho.splice(i,1);
  }
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.t;
  // кольцо обратного отсчёта до следующей ноты
  let nx = null;
  for(const b of this.beats) if(b.tb >= this.t - 0.02){ nx = b.tb; break; }
  if(nx !== null){
    const k = clamp(1 - (nx - this.t)*3.2, 0, 1);
    const col = k > 0.82 ? P.gold : P.pink2;
    const r = 13;
    for(let i=0;i<14;i++){
      const a = i/14*BP_R - Math.PI/2;
      if(i/14 <= k){
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(this.tx+Math.cos(a)*r), Math.round(this.ty+Math.sin(a)*r), 2, 2);
      }
    }
    if(k > 0.82 && FXQ > .4) glowAt(this.tx, this.ty, 16, P.gold, .2*k);
  }
  // эхо-волны попаданий
  for(const e of this.bpEcho){
    const k = clamp(e.t/1.1, 0, 1), r = 6 + k*30;
    ctx.globalAlpha = (1-k)*0.5;
    ringPix(this.tx, this.ty, r, e.k%6===0 ? CONFIG.P.gold : 'rgba(255,246,232,'+(0.5*(1-k)).toFixed(2)+')', 1);
    ctx.globalAlpha = 1;
  }
  // счётчик цепи
  if(this.bpChain >= 2){
    const n = this.bpChain % 6, col = this.bpChain >= 6 ? CONFIG.P.gold : P.pink2;
    for(let i=0;i<6;i++){
      const on = i < n;
      ctx.fillStyle = on ? col : '#3a2560';
      ctx.fillRect(W-6-(5-i)*6, 8, 4, 4);
    }
  }
});
})();

/* ==========================================================================
   7 · ДОЖДЬ ИЗ СЕРДЕЦ — ЛИВЕНЬ + МОЛНИЯ
   ========================================================================== */
(function(){
const L = LEVELS[7]; if(!L) return;
BP.rain = L;
bpFields(L, {bpBolt:0, bpBoltT:rnd(2.5,6), bpMag:0, bpMagT:0});
bpWrap(L, 'update', function(){
  const dt = 1/60;
  this.bpMag = this.bpMagT > 0 ? clamp(this.bpMagT/3, 0, 1) : 0;
  if(this.bpMagT > 0){
    this.bpMagT -= dt;
    for(const it of this.items){
      if(it.done) continue;
      const d = it.x - this.px;
      if(Math.abs(d) < 78 && it.y < this.py - 10){
        it.x -= Math.sign(d)*Math.min(Math.abs(d), 120*dt);
        if(it.sway !== undefined) it.sway *= 0.6;
      }
    }
  }
  this.bpBoltT -= dt;
  if(this.bpBoltT <= 0){
    this.bpBoltT = rnd(4.5, 9);
    this.bpBolt = 0.45; this.bpMagT = 3;
    Snd.hurt(); shake(4); flashScreen('#cfe0ff', .30);
    ring(this.px, this.py-34, '#8ce99a', 40, .5);
    popText(this.px, this.py-52, 'МАГНИТ!', CONFIG.P.green);
  }
  if(this.bpBolt > 0) this.bpBolt -= dt*1.6;
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.t;
  // ливень: плотнее к концу игры
  const st = clamp((this.caught||0)/Math.max(1,this.need||24), 0, 1);
  const n = Math.round(10 + st*22);
  ctx.globalAlpha = 0.16 + st*0.14;
  ctx.fillStyle = P.sky;
  for(let i=0;i<n;i++){
    const sp = 150 + (i%5)*30;
    const y = ((i*97 + t*sp) % (H+20)) - 10;
    const x = ((i*53 + t*(this.windy||0)*1.4) % (W+20)) - 10;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 3 + (i%3));
  }
  ctx.globalAlpha = 1;
  if(this.bpBolt > 0){
    ctx.globalAlpha = this.bpBolt*0.30;
    ctx.fillStyle = '#dce8ff'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // молния
    const bx = Math.round(W*0.2 + ((t*97)%(W*0.6)));
    ctx.fillStyle = '#ffffff';
    for(let i=0;i<7;i++) ctx.fillRect(bx + ((i%2)?2:-2)*i, 8 + i*7, 2, 7);
  }
  if(this.bpMagT > 0){
    ctx.globalAlpha = .12 + .06*Math.sin(t*7);
    glowAt(this.px, this.py-20, 46, CONFIG.P.green, 1);
    ctx.globalAlpha = 1;
    bpGauge(6, H-26, 30, 5, this.bpMagT/3, CONFIG.P.green, CONFIG.P.green);
  }
});
})();

/* ==========================================================================
   8 · ЛАБИРИНТ — СВЕТЛЯЧОК
   ========================================================================== */
(function(){
const L = LEVELS[8]; if(!L) return;
BP.maze = L;
bpFields(L, {bpTrail:[], bpFly:null, bpIdle:0, bpFlyT:0});
bpWrap(L, 'update', function(){
  const dt = 1/60, p = this.p;
  if(!p) return;
  this.bpTrail.push({x:p.x, y:p.y});
  if(this.bpTrail.length > 26) this.bpTrail.shift();
  if(this.bpIdle === undefined) this.bpIdle = 0;
  if((this.got||0) !== (this.bpLastGot||0)){ this.bpLastGot = this.got||0; this.bpIdle = 0; }
  else this.bpIdle += dt;
  if(!this.bpFly){
    const back = this.bpTrail[Math.max(0, this.bpTrail.length-9)] || p;
    this.bpFly = {x:back.x, y:back.y, a:Math.random()*6.28};
  }
  const bk = this.bpTrail[Math.max(0, this.bpTrail.length-9)] || p;
  this.bpFly.x = lerp(this.bpFly.x, bk.x, 0.06);
  this.bpFly.y = lerp(this.bpFly.y, bk.y, 0.06);
  this.bpFly.a += dt*2.4;
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.t, f = this.bpFly;
  if(!f) return;
  for(let i=0;i<this.bpTrail.length;i++){
    const p = this.bpTrail[i], k = i/this.bpTrail.length;
    ctx.globalAlpha = k*0.10;
    ctx.fillStyle = '#8ce99a';
    ctx.fillRect(Math.round(p.x)-1, Math.round(p.y)-1, 2, 2);
    ctx.globalAlpha = 1;
  }
  const bx = Math.round(f.x + Math.cos(f.a)*3), by = Math.round(f.y + Math.sin(f.a*1.3)*2);
  if(FXQ > .4) glowAt(bx, by, 14, '#8ce99a', .22);
  ctx.fillStyle = '#8ce99a'; ctx.fillRect(bx-1, by-1, 3, 3);
  ctx.fillStyle = '#e8ffe8'; ctx.fillRect(bx, by, 1, 1);
  // подсказка к цели, если давно ничего не подобрала
  if(this.bpIdle > 10 && this.goal){
    const gx = this.ox + (this.goal.x+0.5)*this.tile, gy = this.oy + (this.goal.y+0.5)*this.tile;
    const a = .25 + .25*Math.abs(Math.sin(t*3));
    ctx.globalAlpha = a;
    const d = 10 + 2*Math.sin(t*4);
    for(let i=0;i<8;i++){
      const an = i/8*Math.PI*2;
      const px = Math.round(gx + Math.cos(an)*d), py = Math.round(gy + Math.sin(an)*d);
      ctx.fillStyle = P.gold; ctx.fillRect(px-1, py-1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
});
})();

/* ==========================================================================
   9 · РАДУЖНЫЙ ЗОНТ — защитим сердце от дождя
   ========================================================================== */
(function(){
const L = LEVELS[9]; if(!L) return;
BP.zont = L;
bpFields(L, {bpDash:0, bpCd:0, bpGhost:[], bpLastTap:0, bpLastX:0});
const _u = L.update;
L.update = function(dt){
  _u.call(this, dt);
  if(this.bpDash > 0){
    this.bpDash -= dt;
    const sp = 210*dt;
    if(key.left) this.px -= sp;
    if(key.right) this.px += sp;
    this.px = clamp(this.px, 10, W-10);
    this.bpGhost.push({x:this.px, t:0});
    if(Math.random() < 0.5) fx(Math.round(this.px), H-14, 2, CONFIG.P.sky, 60, .3, {g:20});
  }
  if(this.bpCd > 0) this.bpCd -= dt;
  for(let i=this.bpGhost.length-1;i>=0;i--){
    this.bpGhost[i].t += dt;
    if(this.bpGhost[i].t > 0.35) this.bpGhost.splice(i,1);
  }
};
L.key = function(k){
  if(k === ' ' || k === 'Enter' || k === 'ArrowUp' || k === 'Shift' || k === 'у' || k === 'У') this.bpStart();
};
L.tap = function(x, y){
  const now = G.t;
  if(Math.abs(x - this.bpLastX) > 22 && now - this.bpLastTap < 0.4){ this.bpStart(); }
  this.bpLastTap = now; this.bpLastX = x;
};
L.bpStart = function(){
  if(this.bpCd > 0 || this.bpDash > 0) return;
  this.bpDash = 0.16; this.bpCd = 2.6;
  Snd.coin(); popText(this.px, H-40, 'РЫВОК', CONFIG.P.sky);
  ring(this.px, H-16, CONFIG.P.sky, 26, .35);
};
bpWrap(L, 'draw', function(){
  const P = CONFIG.P;
  for(const g of this.bpGhost){
    ctx.globalAlpha = (1 - g.t/0.35)*0.35;
    ctx.fillStyle = P.sky;
    ctx.fillRect(Math.round(g.x)-4, H-22, 8, 10);
    ctx.globalAlpha = 1;
  }
  if(this.bpDash > 0){
    ctx.globalAlpha = .25; ctx.fillStyle = '#dbe9ff'; ctx.fillRect(0, H-30, W, 30);
    ctx.globalAlpha = 1;
  }
  const ready = this.bpCd <= 0;
  const bx = W-36, by = H-14;
  ctx.fillStyle = '#120a24'; ctx.fillRect(bx-1, by-1, 34, 14);
  ctx.fillStyle = ready ? 'rgba(140,233,154,.35)' : 'rgba(107,79,160,.25)';
  ctx.fillRect(bx, by, 32, 12);
  text(ready ? 'РЫВОК' : Math.ceil(this.bpCd)+'с', bx+16, by+2, {sc:1, align:'center', color: ready ? CONFIG.P.green : P.dim});
  if(ready && FXQ > .4) glowAt(bx+16, by+6, 14, CONFIG.P.green, .12);
});
})();

/* ==========================================================================
   10 · КОД — КОНСОЛЬ
   ========================================================================== */
(function(){
const L = LEVELS[10]; if(!L) return;
BP.code = L;
bpFields(L, {bpScan:0, bpErrT:0});
bpFields(L, {bpLog:''});
bpWrap(L, 'update', function(){
  this.bpScan += 1/60;
  if((this.mistakes||0) > (this.bpLastMis||0)){
    this.bpLastMis = this.mistakes; this.bpErrT = 0.9;
    this.bpLog = 'ошибка в строке ' + (1 + ((this.bpLastMis-1) % 6));
  }
  const m = (this.mode||'') + '|' + (this.step||0);
  if(m !== this.bpLastMode){
    this.bpLastMode = m;
    if(this.mode === 'comp') this.bpLog = 'компиляция...';
    else if(this.mode === 'fix') this.bpLog = 'нужно чинить программу';
    else if(this.mode === 'print') this.bpLog = 'вывод...';
  }
  if(this.bpErrT > 0) this.bpErrT -= 1/60;
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.t;
  // тонкая «терминальная» полоса внизу — не мешает интерфейсу уровня
  const h = 7, y = H-h;
  ctx.fillStyle = 'rgba(6,12,8,.85)'; ctx.fillRect(0, y, W, h);
  ctx.fillStyle = 'rgba(140,233,154,.30)'; ctx.fillRect(0, y, W, 1);
  const sx = ((this.bpScan*30) % (W+26)) - 13;
  ctx.fillStyle = 'rgba(140,233,154,.20)';
  ctx.fillRect(Math.round(sx), y+1, 24, h-2);
  const mode = (this.mode||'?').toUpperCase();
  const lg = (this.bpLog || mode).toUpperCase();
  text('>'+lg.slice(0, Math.max(1, Math.floor((W-60)/6))), 4, y-12,
       {sc:1, color:'rgba(140,233,154,.75)'});
  if(this.bpErrT > 0){
    const a = clamp(this.bpErrT, 0, 1);
    ctx.globalAlpha = a*0.5;
    ctx.fillStyle = P.red; ctx.fillRect(0, 0, W, 3); ctx.fillRect(0, H-3, W, 3);
    ctx.globalAlpha = 1;
    popText(W/2, H-58, 'ОШИБКА КОМПИЛЯЦИИ', P.red);
    shake(2);
  }
});
})();

/* ==========================================================================
   11 · ПЕЧАТЬ — ЛЕНТА БУМАГИ
   ========================================================================== */
(function(){
const L = LEVELS[11]; if(!L || !L.phrase) return;
BP.print = L;
bpFields(L, {bpWave:0, bpLastI:0});
bpWrap(L, 'update', function(){
  this.bpWave += 1/60;
  if(this.i > (this.bpLastI || 0)){
    this.bpLastI = this.i;
    const px = W/2, py = H*0.42;
    if(Math.random() < 0.45)
      fx(px + rnd(-26,26), py + rnd(-6,6), 2, CONFIG.P.pink2, 40, .35, {g:20});
  }
});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P, t = this.bpWave;
  const doneN = Math.min(this.i, this.phrase.length);
  if(!doneN) return;
  const s = 1;
  const txt = this.phrase.slice(0, doneN);
  const wpx = Math.min(W-16, textW(txt, s) + 8);
  const x0 = Math.round((W - wpx)/2), y0 = 6;
  // бумага с лёгкой волной
  for(let i=0;i<wpx;i+=2){
    const wob = Math.round(Math.sin(i*0.09 + t*2.2)*0.9);
    ctx.fillStyle = P.paper; ctx.fillRect(x0+i, y0+wob, 2, 11);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x0+i, y0+wob+10, 2, 1);
  }
  // текст на ленте
  ctx.fillStyle = '#2a1b3a';
  for(let i=0;i<txt.length;i++){
    const px = x0 + 4 + textW(txt.slice(0,i), s);
    const wob = Math.round(Math.sin(px*0.09 + t*2.2)*0.9);
    text(txt[i], px, y0+wob+2, {sc:s, color:'#2a1b3a'});
  }
  // ролик подачи
  const rx = x0 + wpx + 2;
  if(rx < W-4){
    ctx.fillStyle = '#3a3358'; ctx.fillRect(rx, y0-2, 4, 15);
    ctx.fillStyle = '#5b5280'; ctx.fillRect(rx, y0-2, 1, 15);
  }
  if(this.jam > 0){
    ctx.globalAlpha = .25 + .15*Math.sin(t*12);
    ctx.fillStyle = P.red; ctx.fillRect(x0, y0-2, wpx+6, 15);
    ctx.globalAlpha = 1;
  }
  // финальный разворот
  if(this.done){
    const k = clamp((this.doneT-0.3)/1.0, 0, 1);
    if(k > 0){
      ctx.globalAlpha = k*0.9;
      const line = this.phrase;
      const lsc = fitSc(line, W-20, 1);
      text(line, W/2, H*0.42, {sc:lsc, align:'center', color:P.pink});
      ctx.globalAlpha = 1;
    }
  }
});
})();
