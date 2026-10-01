/* ==========================================================================
   ЧАСТЬ 7.1 · НОВЫЕ МЕХАНИКИ (1/2): общие примитивы + РУКА, РИТМ, СЕРДЦА
   Всё переписано: бонусы, серии, идеальные попадания, «лихорадка», щиты.
   Старые поля (meter/caught/need/beats/...) сохранены — тесты их используют.
   ========================================================================== */

/* --------------------------------------------------------------------------
   ОБЩИЕ МЕЛОЧИ ИНТЕРФЕЙСА
   -------------------------------------------------------------------------- */
/** Табличка-плашка: тёмная подложка, цветная кромка, текст. */
function chip(x, y, label, col, right){
  const w = textW(label,1)+8, X = Math.round(right ? x-w : x);
  ctx.fillStyle = 'rgba(11,6,24,.78)'; ctx.fillRect(X, Math.round(y)-2, w, 14);
  ctx.fillStyle = 'rgba(107,79,160,.75)'; ctx.fillRect(X, Math.round(y)-2, 1, 14);
  ctx.fillStyle = (col||CONFIG.P.ink);
  ctx.fillRect(X+1, Math.round(y)+10, w-2, 1);
  text(label, X+4, y+1, {sc:1, color:col||CONFIG.P.ink});
  return w;
}
/** Шкала с объёмом и свечением на максимуме. */
function hudBar(x, y, w, h, val, col, glowCol){
  ctx.fillStyle = '#120a24'; ctx.fillRect(x-1, y-1, w+2, h+2);
  ctx.fillStyle = '#241445'; ctx.fillRect(x, y, w, h);
  const f = Math.max(0, Math.round((w-2)*clamp(val,0,1)));
  ctx.fillStyle = col; ctx.fillRect(x+1, y+1, f, h-2);
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x+1, y+1, f, 1);
  if(f > w*0.9 && glowCol){
    ctx.globalAlpha = 0.25 + 0.25*Math.abs(Math.sin(performance.now()/140));
    ctx.fillStyle = glowCol; ctx.fillRect(x-2, y-2, w+4, h+4);
    ctx.globalAlpha = 1;
  }
}
/** Иконки бонусов: Магнит / Щит / Замедление. */
const POWERS = [
  {id:'magnet', label:'МАГНИТ', col:'#4cc9f0'},
  {id:'shield', label:'ЩИТ',   col:'#8ce99a'},
  {id:'slow',   label:'СТОП',  col:'#b197fc'}
];
function drawPowerIcon(id, x, y, t){
  const col = (POWERS.find(p=>p.id===id)||{col:'#fff'}).col;
  ctx.fillStyle = '#0d0820'; ctx.fillRect(x-1, y-1, 14, 14);
  ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(x-1, y-1, 14, 1);
  if(id==='magnet'){
    // подкова: корпус + два полюса разного цвета
    ctx.fillStyle = col;
    ctx.fillRect(x+1, y+2, 3, 6); ctx.fillRect(x+7, y+2, 3, 6); ctx.fillRect(x+4, y+1, 3, 3);
    ctx.fillStyle = CONFIG.P.pink;  ctx.fillRect(x+1, y+8, 3, 2);
    ctx.fillStyle = CONFIG.P.sky;   ctx.fillRect(x+7, y+8, 3, 2);
    ctx.fillStyle = '#0d0820'; ctx.fillRect(x+1, y+10, 3, 1); ctx.fillRect(x+7, y+10, 3, 1);
    if(Math.floor(t*6)%2===0){ ctx.fillStyle='#fff6e8'; ctx.fillRect(x+3, y+6, 1, 1); ctx.fillRect(x+6, y+6, 1, 1); }
  } else if(id==='shield'){
    ctx.fillStyle = col;
    ctx.fillRect(x+2, y+1, 7, 2); ctx.fillRect(x+1, y+3, 9, 3); ctx.fillRect(x+2, y+6, 7, 3); ctx.fillRect(x+4, y+9, 3, 2);
    ctx.fillStyle = '#0d0820'; ctx.fillRect(x+3, y+3, 5, 4);
    ctx.fillStyle = col; ctx.fillRect(x+4, y+4, 3, 1); ctx.fillRect(x+4, y+6, 1, 1);
  } else {
    ctx.fillStyle = col;
    ctx.fillRect(x+1, y+1, 9, 2); ctx.fillRect(x+1, y+10, 9, 2);
    ctx.fillRect(x+2, y+3, 7, 1); ctx.fillRect(x+3, y+4, 5, 2); ctx.fillRect(x+2, y+8, 7, 1); ctx.fillRect(x+4, y+6, 3, 2);
    if(Math.floor(t*4)%2===0){ ctx.fillStyle='#fff6e8'; ctx.fillRect(x+4, y+7, 3, 1); }
  }
}
/** Таймер активного бонуса в углу. */
function powerTimer(id, left, max, x, y){
  const w = 34, k = clamp(left/max,0,1);
  ctx.fillStyle = '#120a24'; ctx.fillRect(x-1, y-1, w+2, 15);
  ctx.fillStyle = '#241445'; ctx.fillRect(x, y, w, 13);
  ctx.fillStyle = (POWERS.find(p=>p.id===id)||{col:'#fff'}).col;
  ctx.fillRect(x+1, y+1, Math.round((w-2)*k), 11);
  drawPowerIcon(id, x+2, y+2, performance.now()/1000);
  text(Math.ceil(left)+'с', x+w-3, y+2, {sc:1, align:'right', color:CONFIG.P.ink});
}
function pickPower(){ return POWERS[rndi(0, POWERS.length-1)].id; }

/* ==========================================================================
   1 · РУКА — ловим сердца, золото и щит; серии и «идеально» по центру
   ========================================================================== */
(function(){
const R = Math.PI*2;
L6.enter = function(){
  this.hintY = 30;
  this.t = 0; this.meter = 30; this.a = -Math.PI/2; this.flash = 0; this.bad = 0;
  this.cx = W/2; this.cy = Math.round(H*0.55);
  this.R = Math.round(Math.min(W*0.33, H*0.30));
  this.items = []; this.combo = 0; this.best = 0; this.shield = 0;
  this.trail = []; this.glowT = 0; this.msg = ''; this.msgT = 0;
  this.phase = 1; this.phaseT = 0;
  for(let i=0;i<5;i++) this.items.push(this.make(rnd(0,R), true));
};
L6.make = function(ang, spread){
  const r = Math.random();
  return {
    ang:ang, sp:rnd(0.30,0.62)*(Math.random()<0.5?1:-1),
    kind: (r<0.16) ? 'gold' : (r<0.30 ? 'void' : 'good'),
    cool:spread?rnd(0,0.6):0, pop:0, born:0
  };
};
L6.angDiff = function(x){ let d = x - this.a; while(d>Math.PI) d-=R; while(d<-Math.PI) d+=R; return d; };
L6.say = function(t, col){ this.msg = t; this.msgCol = col; this.msgT = 0.8; };
L6.update = function(dt){
  this.t += dt;
  const hard = this.meter > 60;
  if(hard && this.phase === 1){
    this.phase = 2; this.phaseT = 0;
    this.say('ВТОРАЯ ФАЗА!', CONFIG.P.gold);
    flashScreen(CONFIG.P.gold, .22); shake(4); confettiRain(14);
    ring(this.cx, this.cy, CONFIG.P.gold, this.R+14, .7, 1);
    for(let i=0;i<3;i++) this.items.push(this.make(rnd(0,R), false));
  }
  this.phaseT += dt;
  this.rotK = hard ? 4.1 : 3.2;
  this.decayK = hard ? 3.0 : 2.0;
  const rot = this.rotK*dt;
  if(key.left) this.a -= rot;
  if(key.right) this.a += rot;
  if(ptr.down){
    const want = Math.atan2(ptr.y-this.cy, ptr.x-this.cx);
    this.a += clamp(this.angDiff(want), -rot*1.8, rot*1.8);
  }
  this.meter -= dt*((this.decayK) + this.meter*0.018);
  const sup = 1 + this.meter*0.005;
  // след за рукой
  const tx0 = this.cx + Math.cos(this.a)*this.R, ty0 = this.cy + Math.sin(this.a)*this.R;
  this.trail.push({x:tx0, y:ty0, t:0});
  if(this.trail.length > 16) this.trail.shift();
  for(const tr of this.trail) tr.t += dt;

  for(const it of this.items){
    it.ang += it.sp*sup*dt;
    it.born += dt;
    if(it.pop>0) it.pop -= dt;
    if(it.cool>0){ it.cool -= dt; continue; }
    const d = this.angDiff(it.ang);
    if(Math.abs(d) < 0.20){
      const px = this.cx + Math.cos(it.ang)*this.R, py = this.cy + Math.sin(it.ang)*this.R;
      it.cool = 1.1; it.pop = 0.3;
      const perfect = Math.abs(d) < 0.075;
      if(it.kind === 'good'){
        comboAdd(1); this.combo = G.combo;
        const gain = (perfect ? 15 : 9) * comboMul();
        this.meter += gain; Snd.coin();
        popText(px, py-6, '+'+Math.round(gain), perfect?CONFIG.P.gold:CONFIG.P.pink2);
        ring(px, py, perfect?CONFIG.P.gold:CONFIG.P.pink2, perfect?22:14, 0.32);
        fx(px, py, perfect?10:6, perfect?[CONFIG.P.gold,CONFIG.P.pink2,CONFIG.P.ink]:CONFIG.P.pink, 70, 0.5, {g:40, s:1});
        if(perfect){ shake(2); hitstop(0.035); this.say('ИДЕАЛЬНО!', CONFIG.P.gold); }
        if(G.combo > 0 && G.combo % 5 === 0){
          this.say('СЕРИЯ x'+G.combo+'!', CONFIG.P.pink);
          for(let i=0;i<6;i++) this.items.push(this.make(this.a + rnd(-1.6,1.6), false));
          flashScreen(CONFIG.P.pink, 0.18);
        }
      } else if(it.kind === 'gold'){
        comboAdd(2); this.combo = G.combo;
        this.meter += 24; Snd.fanfare();
        popText(px, py-6, '+24 ЗОЛОТО', CONFIG.P.gold);
        ring(px, py, CONFIG.P.gold, 30, 0.5);
        fx(px, py, 18, [CONFIG.P.gold, '#fff6e8', CONFIG.P.pink2], 110, 0.8, {g:30});
        shake(4); hitstop(0.06); flashScreen(CONFIG.P.gold, 0.22);
        this.say('ЗОЛОТОЙ УЛОВ!', CONFIG.P.gold);
      } else if(it.kind === 'void'){
        comboBreak(); this.combo = 0;
        if(this.shield > 0){
          this.shield--; Snd.clack();
          popText(px, py-6, 'ЩИТ!', CONFIG.P.green);
          ring(px, py, CONFIG.P.green, 24, 0.4);
          fx(px, py, 12, CONFIG.P.green, 90, 0.5);
        } else {
          this.meter -= 20; this.bad++; Snd.hurt();
          impact(px, py, '#b197fc', 6, 26);
          popText(px, py-6, '-20', CONFIG.P.red);
          flashScreen('#6b4fa0', 0.30);
          this.say('ПУСТОТА', '#b197fc');
        }
      } else {   // плохая цель
        comboBreak(); this.combo = 0;
        this.meter -= 12; this.bad++; Snd.hurt();
        impact(px, py, CONFIG.P.red, 4, 20);
        popText(px, py-6, '-12', CONFIG.P.red);
        this.say('МИМО', CONFIG.P.red);
      }
      if(this.bad >= 0 && Math.random() < 0.10){
        const side = Math.random()<0.5?-1:1;
        it.ang = this.a + side*rnd(2.1,3.5);
      }
      if(it.kind !== 'gold'){
        it.kind = Math.random()<0.16 ? 'gold' : (Math.random()<0.14 ? 'void' : 'good');
        it.sp = rnd(0.30,0.62)*(Math.random()<0.5?1:-1);
      }
    }
  }
  // иногда подкидываем щит
  if(this.t > 6 && !this.shield && Math.random() < dt*0.06){
    this.shield = 1; Snd.coin();
    this.say('ЩИТ НА 1 УДАР', CONFIG.P.green);
    ring(this.cx, this.cy, CONFIG.P.green, this.R+10, 0.6);
  }
  if(this.flash>0) this.flash -= dt;
  if(this.glowT>0) this.glowT -= dt;
  if(this.msgT>0) this.msgT -= dt;
  if(this.meter>=100){ this.meter = 100; this.win(); }
  else if(this.meter<=0){ comboBreak(); loseLevel('Рука сорвалась... давай ещё раз.'); }
};
L6.win = function(){ winLevel(LEVELS.indexOf(this)); };
L6.tap = function(){};

L6.draw = function(){
  skyBg(this.t); clouds(this.t, 12, 3, 0.16);
  const P = CONFIG.P, cx = this.cx, cy = this.cy, Rr = this.R;
  // тёплое свечение вокруг Танжара — «он тут, тянется к тебе»
  glowAt(cx, cy, Rr*0.9, P.pink, .10 + .04*Math.sin(this.t*1.6));
  // орбита: пунктирное кольцо + бегущие точки
  for(let i=0;i<72;i++){
    const a = i/72*R;
    ctx.fillStyle = i%3 ? 'rgba(160,140,192,.22)' : 'rgba(200,180,255,.45)';
    ctx.fillRect(Math.round(cx+Math.cos(a)*Rr), Math.round(cy+Math.sin(a)*Rr), 1, 1);
  }
  for(let i=0;i<10;i++){
    const a = i/10*R + this.t*(this.phase>1?.5:.25);
    ctx.globalAlpha = .5;
    ctx.fillStyle = P.pink2;
    ctx.fillRect(Math.round(cx+Math.cos(a)*Rr)-1, Math.round(cy+Math.sin(a)*Rr)-1, 3, 3);
    ctx.globalAlpha = 1;
  }
  // «зона захвата» — где рука ловит
  {
    const zc = P.gold, n = 26;
    for(let i=0;i<=n;i++){
      const a = this.a - 0.20 + (i/n)*0.40;
      const al = .30 + .22*Math.abs(Math.sin(this.t*6));
      ctx.globalAlpha = al;
      ctx.fillStyle = zc;
      ctx.fillRect(Math.round(cx+Math.cos(a)*Rr), Math.round(cy+Math.sin(a)*Rr), 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // свечение-подсказка у дуги
  if(this.glowT>0){
    ctx.globalAlpha = this.glowT; ctx.fillStyle = P.gold;
    for(let i=0;i<24;i++){ const a=this.a-0.5+i/24; ctx.fillRect(Math.round(cx+Math.cos(a)*(Rr+4)), Math.round(cy+Math.sin(a)*(Rr+4)), 2, 2); }
    ctx.globalAlpha = 1;
  }
  // цели
  for(const it of this.items){
    const px = Math.round(cx+Math.cos(it.ang)*Rr), py = Math.round(cy+Math.sin(it.ang)*Rr);
    const s = 16 + (it.pop>0?Math.round(it.pop*24):0);
    if(FXQ > .4){
      const gc = it.kind==='gold' ? P.gold : (it.kind==='void' ? '#b197fc' : P.pink2);
      glowAt(px, py, s*0.9, gc, .16 + .06*Math.sin(this.t*3 + it.ang*4));
    }
    if(it.kind === 'void'){
      const k = 1 + it.pop*1.4;
      ctx.fillStyle = '#1a0f2e';
      ctx.fillRect(px-Math.round(s*k/2)-1, py-Math.round(s*k/2)-1, Math.round(s*k)+2, Math.round(s*k)+2);
      ctx.fillStyle = '#0a0518';
      ctx.fillRect(px-Math.round(s*k/2), py-Math.round(s*k/2), Math.round(s*k), Math.round(s*k));
      ctx.fillStyle = 'rgba(177,151,252,'+(0.5+0.3*Math.sin(this.t*5)).toFixed(2)+')';
      ctx.fillRect(px-2, py-Math.round(s*k/2), 4, 1);
    } else if(it.kind === 'gold'){
      ctx.fillStyle = '#7a5a10'; ctx.fillRect(px-s/2-1, py-s/2-1, s+2, s+2);
      ctx.fillStyle = CONFIG.P.gold; ctx.fillRect(px-s/2, py-s/2, s, s);
      ctx.fillStyle = '#fff6e8';
      if(Math.floor(this.t*5)%2===0){ ctx.fillRect(px-s/2+2, py-s/2+2, 3, 2); ctx.fillRect(px+2, py+2, 2, 3); }
      heart(px-4, py-s/2-8, 1, CONFIG.P.gold);
    } else {
      if(bothP()) ctx.drawImage(IMG.her, px-s/2, py-s/2, s, s);
      else { ctx.fillStyle = P.pink2; ctx.fillRect(px-s/2, py-s/2, s, s); }
      ctx.fillStyle = '#3a2560'; ctx.fillRect(px-s/2-1, py-s/2-1, s+2, 1); ctx.fillRect(px-s/2-1, py+s/2, s+2, 1);
      heart(px-4, py-s/2-8, 1, P.pink);
    }
  }
  // след
  for(let i=0;i<this.trail.length;i++){
    const tr = this.trail[i], k = i/this.trail.length;
    if(tr.t > 0.4) continue;
    ctx.globalAlpha = (1-tr.t/0.4)*k*0.5;
    ctx.fillStyle = CONFIG.P.gold;
    ctx.fillRect(Math.round(tr.x)-1, Math.round(tr.y)-1, 2, 2);
    ctx.globalAlpha = 1;
  }
  // рука
  const tx = cx + Math.cos(this.a)*Rr, ty = cy + Math.sin(this.a)*Rr;
  for(let i=0;i<=14;i++){
    const k = i/14, x = Math.round(cx+(tx-cx)*k), y = Math.round(cy+(ty-cy)*k);
    ctx.fillStyle = (i>11) ? CONFIG.cHim.skin : CONFIG.cHim.cloth;
    ctx.fillRect(x-1, y-1, 3, 3);
  }
  ctx.fillStyle = CONFIG.cHim.skin;
  ctx.fillRect(Math.round(tx)-4, Math.round(ty)-4, 9, 9);
  ctx.fillStyle = '#c9a184';
  ctx.fillRect(Math.round(tx)-4, Math.round(ty)+5, 9, 2);
  for(let f=0;f<3;f++) ctx.fillRect(Math.round(tx)-3+f*3, Math.round(ty)-7, 2, 4);
  if(this.shield>0){
    ctx.globalAlpha = 0.35 + 0.15*Math.sin(this.t*4);
    ctx.fillStyle = CONFIG.P.green;
    for(let i=0;i<20;i++){
      const a = this.a + (i/20-0.5)*1.1;
      ctx.fillRect(Math.round(tx+Math.cos(a)*11)-1, Math.round(ty+Math.sin(a)*11)-1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // Танжар в центре
  if(bothP()){
    const s = 26;
    ctx.fillStyle = '#241445'; ctx.fillRect(cx-s/2-2, cy-s/2-2, s+4, s+4);
    ctx.drawImage(IMG.him, cx-s/2, cy-s/2, s, s);
  } else drawGuy(cx, cy+10, CONFIG.cHim, 1, 0);
  // шкала в общей плашке
  const bw = Math.min(W-40, 180), bx = Math.round(W/2-bw/2), by = 15;
  ctx.fillStyle = 'rgba(9,5,20,.72)'; ctx.fillRect(bx-7, 0, bw+14, 25);
  ctx.fillStyle = 'rgba(107,79,160,.55)'; ctx.fillRect(bx-7, 24, bw+14, 1);
  text('ЛЮБОВЬ', W/2, 2, {sc:1, align:'center', color:this.meter>70?P.gold:P.dim});
  hudBar(bx, by, bw, 8, this.meter/100, this.meter>70?P.gold:P.pink, P.gold);
  if(this.meter<28){
    ctx.globalAlpha = 0.25+0.25*Math.sin(this.t*9);
    ctx.fillStyle = P.red; ctx.fillRect(bx, by-2, bw, 12);
    ctx.globalAlpha = 1;
  }
  if(this.phase > 1){
    const a = .5+.5*Math.abs(Math.sin(this.t*5));
    ctx.globalAlpha = a;
    text('ФАЗА 2 — БЫСТРЕЕ', W/2, 28, {sc:1, align:'center', color:P.gold});
    ctx.globalAlpha = 1;
  }
  drawCombo(6, H-15, 'ЦЕПЬ', 'left');
  if(this.msgT>0){
    ctx.globalAlpha = clamp(this.msgT*1.6,0,1);
    text(this.msg, W/2, H-16, {sc:1, align:'center', color:this.msgCol, shadow:'#120a24'});
    ctx.globalAlpha = 1;
  }
  if(this.bad>0) text('МИМО: '+this.bad, W-6, H-13, {sc:1, align:'right', color:P.red});
  vignette(0.5);
  crtOverlay(this.t); bezel();
};
})();

/* ==========================================================================
   2 · РИТМ СЕРДЦА — типы нот, «идеально», ЛИХОРАДКА
   ========================================================================== */
(function(){
const NOTE_GOOD = 0, NOTE_GOLD = 1, NOTE_SHARD = 2;
L7.enter = function(){
  this.hintY = 30;
  this.t = 0; this.meter = 50; this.bpm = 92; this.next = 1.4; this.sent = 0; this.total = 30;
  this.tx = Math.round(W*0.30); this.ty = Math.round(H*0.56); this.speed = 105;
  this.beats = []; this.pulse = 0; this.msg = ''; this.msgT = 0;
  this.hits = 0; this.miss = 0; this.perfect = 0;
  this.fever = 0; this.feverT = 0; this.rainbow = 0;
  this.travel = (W + 20 - this.tx) / this.speed;
  this.beatPhase = 0;
};
L7.update = function(dt){
  this.t += dt;
  if(this.feverT>0){
    this.feverT -= dt;
    this.fever = clamp(this.feverT/6, 0, 1);
    if(this.feverT<=0){ this.fever = 0; this.say('ЛИХОРАДКА ОКОНЧЕНА', CONFIG.P.dim); }
  }
  this.winGood = clamp(8 - (this.bpm-92)/26, 5, 8);
  this.winMax  = clamp(24 - (this.bpm-92)/7, 14, 24);
  while(this.sent < this.total && this.t > this.next - this.travel - 0.2){
    const r = Math.random();
    const kind = (r<0.14) ? NOTE_SHARD : (r<0.30 ? NOTE_GOLD : NOTE_GOOD);
    this.beats.push({tb:this.next, x:W+20, hit:false, dead:false, sounded:false, kind:kind, k:0});
    this.next += 60/this.bpm;
    this.bpm = Math.min(190, this.bpm + 3.0);
    this.sent++;
  }
  for(const b of this.beats){
    b.x = this.tx + (b.tb - this.t)*this.speed;
    b.k = clamp((W+20 - b.x)/(W+20 - this.tx), 0, 1);
    if(!b.sounded && this.t >= b.tb){
      b.sounded = true; this.pulse = 1; this.beatPhase = 1;
      Snd.note(150, 0.09, 'triangle', 0.16);
      ring(this.tx, this.ty, this.fever>0?CONFIG.P.gold:'rgba(255,93,143,', 26, 0.28);
    }
    if(!b.hit && this.t > b.tb + 0.17){
      b.dead = true; this.miss++; this.meter -= 7; Snd.bad();
      comboBreak();
      shake(3); flashScreen(CONFIG.P.red, 0.14);
      this.say('МИМО', CONFIG.P.red);
      popText(this.tx, this.ty-22 - (this.miss%3)*9, '-7', CONFIG.P.red);
    }
  }
  this.beats = this.beats.filter(b => !b.dead && b.x > -30);
  if(this.pulse>0) this.pulse -= dt*3;
  if(this.beatPhase>0) this.beatPhase -= dt*3.5;
  if(this.msgT>0) this.msgT -= dt;
  if(this.sent>=this.total && !this.beats.length && this.t > this.next + 0.5){
    if(this.meter>=100) winLevel(LEVELS.indexOf(this)); else loseLevel('Сбились с ритма. Ещё раз!');
  }
  if(this.meter>=100){ this.meter = 100; winLevel(LEVELS.indexOf(this)); }
  if(this.meter<=0) loseLevel('Сердце сбилось. Ещё разок!');
};
L7.say = function(t, col){ this.msg = t; this.msgCol = col||CONFIG.P.ink; this.msgT = 0.6; };
L7.hit = function(){
  if(this.feverT>0) slowmo(0.55, 0.12);
  let best = null, bd = 1e9;
  for(const b of this.beats){ const d = Math.abs(b.x - this.tx); if(!b.hit && d < bd){ bd = d; best = b; } }
  if(best && bd < (this.winMax||20)){
    best.hit = true; best.dead = true;
    const near = bd < (this.winGood||7);
    let gain;
    if(best.kind === NOTE_SHARD){
      comboBreak(); this.meter -= 6; Snd.hurt(); shake(5);
      flashScreen('#8a6ab0', 0.26);
      this.say('ОСКОЛОК!', '#b197fc');
      popText(this.tx, this.ty-22, '-6', '#b197fc');
      fx(this.tx, this.ty, 12, '#b197fc', 90, 0.5);
      return;
    }
    this.hits++;
    if(near) this.perfect++;
    comboAdd(1);
    const base = near ? 6 : 3.5;
    const kind = (best.kind===NOTE_GOLD) ? 2 : 1;
    const fever = this.feverT>0 ? 2 : 1;
    gain = base * kind * fever;
    this.meter += gain;
    Snd.coin();
    const col = (best.kind===NOTE_GOLD) ? CONFIG.P.gold : (near ? CONFIG.P.gold : CONFIG.P.pink2);
    popText(this.tx, this.ty-22, '+'+Math.round(gain), col);
    ring(this.tx, this.ty, col, near?24:16, 0.3);
    fx(this.tx, this.ty, near?12:7, [col, CONFIG.P.pink, CONFIG.P.ink], near?100:70, 0.5, {g:40});
    if(near){ hitstop(0.04); this.say('ИДЕАЛЬНО!', CONFIG.P.gold); }
    else if(best.kind===NOTE_GOLD) this.say('ЗОЛОТАЯ!', CONFIG.P.gold);
    else this.say('В ТАКТ', CONFIG.P.pink2);
    if(this.feverT>0) this.meter += 1;
    if(G.combo > 0 && G.combo % 8 === 0 && this.feverT<=0){
      this.feverT = 6; this.fever = 1;
      this.say('★ ЛИХОРАДКА ★', CONFIG.P.gold);
      flashScreen(CONFIG.P.gold, 0.35);
      slowmo(0.35, 0.35);
      for(let i=0;i<20;i++) fx(this.tx+rnd(-20,20), this.ty+rnd(-20,20), 1, CONFIG.P.gold, 120, 0.9, {g:0});
    }
  } else {
    this.meter -= 3; comboBreak();
    this.say('НЕ В ТАКТ', CONFIG.P.red); Snd.bad();
    popText(this.tx, this.ty-22, '-3', CONFIG.P.red);
    shake(2);
  }
};
L7.key = function(k){ if(k===' '||k==='Enter') this.hit(); };
L7.tap = function(){ this.hit(); };
L7.draw = function(){
  const P = CONFIG.P;
  if(this.feverT>0){
    const sk = Math.floor(this.t*3) % 4;
    ctx.drawImage(bgCache('fever'+sk, paint=>{
      ditherGradVTo(paint, 0, 0, W, H, '#4a1038', '#1a0620', 14);
      veilBlobTo(paint, W*0.3, H*0.35, Math.max(W,H)*0.7, 'rgba(255,93,143,.20)');
      veilBlobTo(paint, W*0.75, H*0.6, Math.max(W,H)*0.6, 'rgba(76,201,240,.14)');
    }), 0, 0);
    ctx.globalAlpha = 0.10+0.08*Math.abs(Math.sin(this.t*6));
    ctx.fillStyle = CONFIG.P.gold; ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;
  } else {
    skyBg(this.t);
  }
  // «электрокардиограмма» на фоне
  ctx.fillStyle = 'rgba(255,93,143,.16)';
  const ekg = [0,0,0,4,-6,10,-4,0,0,0];
  for(let x=0;x<W;x++){
    const i = Math.floor(((x + this.t*40) % (W)) / (W/ekg.length));
    ctx.fillRect(x, Math.round(H*0.30) - ekg[Math.min(ekg.length-1,i)], 1, 1);
  }
  // волна такта
  const ph = 60/this.bpm;
  const bp = 1 - clamp((this.t % ph)/ph, 0, 1);
  const rad = this.R2 || Math.max(8, Math.round(this.ty*0.10));
  if(bp > 0.80){
    ctx.globalAlpha = (bp-0.80)*5;
    ringPix(this.tx, this.ty, Math.round(rad*2.2), this.feverT>0?P.gold:P.pink, 1);
    ctx.globalAlpha = 1;
  }
  // звёзды неба
  if(FXQ > .4){
    ctx.fillStyle = '#cfe0ff';
    for(let i=0;i<18;i++){
      const R = mulberry32(i*7+3);
      const x = (R()*W) | 0, y = (R()*H*0.6) | 0;
      const a = .2 + .8*Math.abs(Math.sin(this.t*(.5+R()) + R()*6));
      ctx.globalAlpha = a*.5;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  // мишень
  const pulse = this.pulse;
  ctx.fillStyle = '#2a2050'; ctx.fillRect(this.tx-13, this.ty-13, 26, 26);
  heart(this.tx-9 - Math.round(pulse*1.5), this.ty-9 - Math.round(pulse*1.5), 2 + (pulse>0.4?1:0), P.pink);
  // сердца-ноты
  for(const b of this.beats){
    if(b.x > W+6) continue;
    // хвост у ноты
    ctx.globalAlpha = .25;
    ctx.fillStyle = b.kind===NOTE_GOLD ? P.gold : (b.kind===NOTE_SHARD ? '#b197fc' : P.pink);
    ctx.fillRect(Math.round(b.x)+4, this.ty-3, 7, 1);
    ctx.globalAlpha = 1;
    const y = this.ty-3;
    if(b.kind === NOTE_GOLD){
      heart(Math.round(b.x)-4, y, 1, P.gold);
      ctx.globalAlpha=0.5; heart(Math.round(b.x)-4, y, 1, '#fff6e8'); ctx.globalAlpha=1;
    } else if(b.kind === NOTE_SHARD){
      ctx.fillStyle = '#b197fc';
      const s2 = 4;
      ctx.fillRect(Math.round(b.x)-s2, y-s2+2, s2*2, s2*2);
      ctx.fillStyle = '#5b3fa0';
      ctx.fillRect(Math.round(b.x)-s2+1, y-s2+3, 2, 2);
      ctx.fillRect(Math.round(b.x)+s2-3, y-1, 2, 2);
      ctx.fillRect(Math.round(b.x)-1, y+s2-2, 2, 2);
    } else {
      heart(Math.round(b.x)-4, y, 1, P.pink);
      ctx.globalAlpha = 0.4; heart(Math.round(b.x)-4, y, 1, '#ffd6e4'); ctx.globalAlpha = 1;
    }
  }
  // шкала в общей плашке
  const bw = Math.min(W-40, 180), bx = Math.round(W/2-bw/2), by = 15;
  ctx.fillStyle = 'rgba(9,5,20,.72)'; ctx.fillRect(bx-7, 0, bw+14, 25);
  ctx.fillStyle = 'rgba(107,79,160,.55)'; ctx.fillRect(bx-7, 24, bw+14, 1);
  text(this.feverT>0 ? 'ЛИХОРАДКА!' : 'РИТМ', W/2, 2, {sc:1, align:'center', color:this.feverT>0?P.gold:P.dim});
  hudBar(bx, by, bw, 8, this.meter/100, this.meter>70?P.gold:P.pink, P.gold);
  ctx.fillStyle = '#120a24';
  for(let i=1;i<4;i++) ctx.fillRect(bx+Math.round(bw*i/4), by, 1, 8);
  if(this.feverT>0){
    const w2 = 30, k2 = clamp(this.feverT/6,0,1);
    ctx.fillStyle = '#120a24'; ctx.fillRect(bx, by+11, w2, 3);
    ctx.fillStyle = P.gold; ctx.fillRect(bx, by+11, Math.round(w2*k2), 3);
  }
  // сообщение
  if(this.msgT>0){
    ctx.globalAlpha = clamp(this.msgT*1.7,0,1);
    text(this.msg, this.tx, this.ty-34, {sc:1, align:'center', color:this.msgCol, shadow:'#1b1035'});
    ctx.globalAlpha = 1;
  }
  chip(6, H-13, 'ПОПАЛО: '+this.hits+'/'+this.total, P.ink);
  drawCombo(W-6, H-13, 'РИТМ', 'right');
  if(this.miss>0) text('МИМО: '+this.miss, W-6, H-26, {sc:1, align:'right', color:P.red});
  vignette(0.4);
  crtOverlay(this.t); bezel();
};
})();

/* ==========================================================================
   3 · ДОЖДЬ ИЗ СЕРДЕЦ — золото, магнит, щит, замедление, серии
   ========================================================================== */
(function(){
L1.enter = function(){
  this.hintY = 22;
  this.px = W/2; this.py = H-24; this.items=[]; this.spawn=0.5; this.t=0;
  this.caught=0; this.need=24; this.lives=3; this.miss=0;
  this.combo=0; this.best=0; this.windy=0; this.inv=0; this.pw=0; this.pwT=0; this.pwMax=0;
  this.groundH = H-12;
};
L1.update = function(dt){
  this.t += dt;
  if(this.pwT>0){ this.pwT -= dt; if(this.pwT<=0){ this.pw=0; this.pwT=0; } }
  const slow = (this.pw==='slow');
  const sp = 120*dt;
  if(key.left) this.px -= sp;
  if(key.right) this.px += sp;
  if(ptr.down){ this.px = lerp(this.px, ptr.x, 0.30); }
  this.px = clamp(this.px, 14, W-14);
  // ветер во второй половине
  const half = this.caught >= Math.round(this.need*0.5);
  if(half){
    const w = Math.sin(this.t*0.9)*26 + Math.sin(this.t*0.37)*14;
    this.windy = w;
    this.extra = (this.extra||0) - dt;
    if(this.extra <= 0){
      this.extra = 0.55;
      this.items.push(this.spawnItem(0.28));
    }
  } else this.windy = 0;
  this.spawn -= dt;
  if(this.spawn<=0){
    this.spawn = Math.max(0.20, 0.66 - this.t*0.010);
    this.items.push(this.spawnItem());
  }
  const basketY = this.py-34;
  for(const it of this.items){
    it.y += it.vy*(slow?0.45:1)*dt; it.sw += dt*3;
    if(this.windy) it.x = clamp(it.x + this.windy*dt, 8, W-8);
    if(this.pw==='magnet' && !it.bad && it.kind!=='power'){
      const dx = this.px - it.x;
      if(Math.abs(dx) < 46) it.x += Math.sign(dx)*Math.min(Math.abs(dx), 120*dt);
    }
    const dx = Math.abs(it.x - this.px), dy = Math.abs(it.y - basketY);
    if(dx < 18 && dy < 14){
      it.dead = 1;
      if(it.kind === 'power'){
        this.pw = it.power; this.pwT = (it.power==='shield'?9:5); this.pwMax = this.pwT;
        Snd.fanfare(); popText(it.x, it.y-8, POWERS.find(p=>p.id===it.power).label, '#fff6e8');
        ring(it.x, it.y, '#fff6e8', 26, 0.45);
        fx(it.x, it.y, 14, [CONFIG.P.sky, CONFIG.P.green, '#b197fc'], 90, 0.6);
        if(it.power==='shield') this.shield = 1;
        flashScreen('#fff6e8', 0.18);
      } else if(it.kind === 'gold'){
        this.caught += 3; this.combo += 3; Snd.coin();
        popText(it.x, it.y-8, '+3', CONFIG.P.gold);
        ring(it.x, it.y, CONFIG.P.gold, 24, 0.35);
        fx(it.x, it.y, 12, CONFIG.P.gold, 80, 0.5);
        hitstop(0.03);
      } else if(it.bad){
        comboBreak();
        if(this.pw==='shield'){
          this.pw = 0; this.pwT = 0; Snd.clack();
          popText(it.x, it.y-8, 'ЩИТ СПАС', CONFIG.P.green);
          ring(it.x, it.y, CONFIG.P.green, 22, 0.4);
        } else {
          this.lives--; this.inv = 1.0; Snd.hurt(); shake(5);
          impact(it.x, it.y, '#7a6ea0', 5, 22);
          flashScreen('#6b4fa0', 0.25);
        }
      } else {
        this.caught++; this.combo++;
        const perfect = dx < 9;
        Snd.coin();
        popText(it.x, it.y-8, perfect?'ТОЧНО!':'+1', perfect?CONFIG.P.gold:CONFIG.P.pink2);
        ring(it.x, it.y, perfect?CONFIG.P.gold:CONFIG.P.pink2, perfect?20:13, 0.3);
        fx(it.x, it.y, perfect?9:5, perfect?[CONFIG.P.gold,CONFIG.P.pink2]:CONFIG.P.pink, 70, 0.45, {g:60});
        if(perfect) hitstop(0.025);
        if(this.combo > this.best) this.best = this.combo;
        if(this.combo > 0 && this.combo % 6 === 0){
          popText(this.px, this.py-52, 'СЕРИЯ x'+this.combo, CONFIG.P.gold);
          for(let i=0;i<3;i++) this.items.push(this.spawnItem(0, true));
          flashScreen(CONFIG.P.pink, 0.15);
        }
      }
    }
    if(it.y > H+10){ it.dead=1; if(!it.bad && it.kind!=='power') this.miss++; }
  }
  this.items = this.items.filter(i=>!i.dead);
  if(this.inv>0) this.inv -= dt;
  if(this.caught>=this.need) winLevel(LEVELS.indexOf(this));
  else if(this.lives<=0) loseLevel('Туча попалась... давай ещё раз.');
};
L1.spawnItem = function(badP, forceGood){
  const t = this.t;
  let kind = 'heart', bad = false, power = null, gold = false;
  if(!forceGood){
    const r = Math.random();
    if(t > 4 && r < Math.min(0.26, 0.09+t*0.009)){ kind = 'cloud'; bad = true; }
    else if(r < 0.34){ kind = 'power'; power = pickPower(); }
    else if(r < 0.42){ kind = 'gold'; gold = true; }
  }
  return {x:rnd(10,W-10), y:-8, vy:rnd(46,70)+t*2.0, bad:bad, kind:kind, power:power, sw:rnd(0,6), rot:0};
};
L1.draw = function(){
  const P = CONFIG.P;
  skyBg(this.t); clouds(this.t, 20, 5, 0.22);
  // луна с ореолом
  {
    const mx = W-30, my = 26;
    glowAt(mx, my, 16, '#fff6e8', .16);
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(mx-5, my-5, 10, 10);
    ctx.fillStyle = 'rgba(160,140,192,.35)';
    ctx.fillRect(mx-2, my-3, 3, 3); ctx.fillRect(mx+2, my+1, 2, 2);
  }
  // дальний город
  drawCity(this.t, H-40, true);
  // холмы
  ctx.fillStyle = '#1b1136';
  for(let i=0;i<3;i++){
    const base = H-30+i*4, amp = 12-i*3;
    for(let x=0;x<W;x++){
      const y = Math.round(base - Math.sin((x*0.045)+i*1.7)*amp - Math.sin(x*0.013+i)*amp*0.6);
      ctx.fillRect(x, y, 1, H-y);
    }
  }
  if(this.windy){
    ctx.globalAlpha = 0.25;
    for(let i=0;i<10;i++){
      const y = ((i*37 + this.t*90) % (H-20)) + 10;
      const x = ((i*71 + this.t*160) % (W+40)) - 20;
      ctx.fillStyle = P.sky; ctx.fillRect(Math.round(x), Math.round(y), 6, 1);
    }
    ctx.globalAlpha = 1;
  }
  // земля
  ctx.fillStyle = '#241445'; ctx.fillRect(0,H-12,W,12);
  ctx.fillStyle = '#3a2560'; ctx.fillRect(0,H-12,W,2);
  ctx.fillStyle = '#1a8a5a'; for(let i=0;i<W;i+=7) ctx.fillRect(i,H-13,4,2);
  // предметы
  for(const it of this.items){
    const x = Math.round(it.x + Math.sin(it.sw)*4), y = Math.round(it.y);
    // лёгкий след
    ctx.globalAlpha = .18;
    ctx.fillStyle = it.bad ? '#5e4b82' : (it.kind==='gold' ? P.gold : P.pink);
    for(let k=1;k<=3;k++) ctx.fillRect(x, y - k*4, 1, 3);
    ctx.globalAlpha = 1;
    if(FXQ > .4 && !it.bad) glowAt(x, y, 9, it.kind==='gold'?P.gold:P.pink, .13);
    if(it.kind === 'power'){
      const k = 1 + Math.abs(Math.sin(it.sw*0.8))*0.12;
      ctx.fillStyle = 'rgba(255,246,232,.25)';
      ctx.fillRect(x-8, y-8, 16, 16);
      drawPowerIcon(it.power, x-6, y-6, this.t+it.sw);
    } else if(it.kind === 'gold'){
      heart(x-4, y-3, 1, P.gold);
      ctx.globalAlpha = 0.5; heart(x-4, y-3, 1, '#fff6e8'); ctx.globalAlpha = 1;
    } else if(it.bad){
      ctx.fillStyle='#4a3a6a'; ctx.fillRect(x-7,y-5,14,7);
      ctx.fillStyle='#5e4b82'; ctx.fillRect(x-4,y-8,9,4);
      ctx.fillStyle='#8ce99a'; ctx.fillRect(x-1,y+2,2,3);
      ctx.fillStyle='#a08cc0'; ctx.fillRect(x+3,y+5,1,3);
    } else {
      heart(x-4, y-3, 1, P.pink);
      ctx.globalAlpha=0.4; heart(x-4, y-3, 1, '#ffd6e4'); ctx.globalAlpha=1;
    }
  }
  // игрок + корзинка
  drawGuy(this.px, this.py, CONFIG.cHim, 2, 0);
  const bx = Math.round(this.px), by = Math.round(this.py-46);
  ctx.fillStyle = '#8a5a3a'; ctx.fillRect(bx-13,by,26,3);
  ctx.fillStyle = '#c98b52'; ctx.fillRect(bx-13,by+3,26,9);
  ctx.fillStyle = '#8a5a3a'; ctx.fillRect(bx-13,by+3,3,9); ctx.fillRect(bx+10,by+3,3,9);
  ctx.fillStyle = '#f0d9b5'; ctx.fillRect(bx-10,by+6,20,3);
  heart(bx-4, by+6, 1, P.pink);
  ctx.fillStyle = CONFIG.cHim.skin;
  ctx.fillRect(bx-14,by+2,2,12); ctx.fillRect(bx+12,by+2,2,12);
  if(this.pw==='magnet'){
    ditherGlow(this.px, by+6, 36, P.sky, 0.18+0.08*Math.sin(this.t*6));
  }
  if(this.pw==='shield'){
    ctx.globalAlpha = 0.45+0.15*Math.sin(this.t*5);
    ctx.fillStyle = P.green;
    ctx.fillRect(bx-16, by-3, 32, 1); ctx.fillRect(bx-16, by+15, 32, 1);
    ctx.fillRect(bx-16, by-3, 1, 19); ctx.fillRect(bx+15, by-3, 1, 19);
    ctx.globalAlpha = 1;
  }
  if(this.inv>0 && Math.floor(this.t*20)%2){ ctx.globalAlpha=0.20; ctx.fillStyle=P.red; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
  // HUD
  chip(6, 2, this.caught+' / '+this.need, this.caught>=this.need?P.gold:P.ink);
  heart(6+textW(this.caught+' / '+this.need,1)+8, 3, 1, P.pink);
  drawLives(this.lives, W-40, 5);
  if(this.pw && this.pwT>0) powerTimer(this.pw, this.pwT, this.pwMax||this.pwT, 6, H-32);
  drawCombo(6, H-15, 'ДОЖДЬ', 'left');
  if(this.miss>0) text('ПРОПУЩЕНО: '+this.miss, W-6, H-13, {sc:1, align:'right', color:'#7a6ea0'});
  vignette(0.45);
  crtOverlay(this.t); bezel();
};
})();
