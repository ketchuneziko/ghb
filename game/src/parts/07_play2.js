/* ==========================================================================
   ЧАСТЬ 7.2 · НОВЫЕ МЕХАНИКИ (2/2): ЛАБИРИНТ, ЗОНТ, МЕМОРИ, ПРИНТЕР, КОД
   ========================================================================== */

/* ==========================================================================
   4 · ЛАБИРИНТ — свет фонаря, сердца-ключи (+время), два сомнения
   ========================================================================== */
(function(){
const _e = L2.enter;
L2.enter = function(){
  _e.call(this);
  this.limit = 85;
  this.fog = 1;
  this.pickups = [];
  this.got = 0;
  this.visited = 0;
  // разложить «сердечки-ключи» по лабиринту
  const cells = [];
  for(let y=1;y<this.gh-1;y++) for(let x=1;x<this.gw-1;x++)
    if(this.grid[y][x]===0 && !(x===1&&y===1) && !(x===this.goal.x&&y===this.goal.y)) cells.push([x,y]);
  const R = mulberry32(77123);
  const n = Math.min(5, cells.length);
  for(let i=0;i<n;i++){
    const c = cells.splice(Math.floor(R()*cells.length), 1)[0];
    if(!c) break;
    this.pickups.push({gx:c[0], gy:c[1], x:this.ox+(c[0]+0.5)*this.tile, y:this.oy+(c[1]+0.5)*this.tile, got:0, k:0});
  }
  // третий «сомневающийся» — быстрее
  if(this.blobs.length < 3 && cells.length){
    const c = cells[Math.floor(cells.length*0.6)];
    this.blobs.push({gx:c[0], gy:c[1], x:this.ox+(c[0]+0.5)*this.tile, y:this.oy+(c[1]+0.5)*this.tile,
                     tx:this.ox+(c[0]+0.5)*this.tile, ty:this.oy+(c[1]+0.5)*this.tile, m:0, dir:[1,0], sp:1.35});
  }
  for(const b of this.blobs) b.sp = b.sp || 1;
};
L2.update = function(dt){
  this.t += dt;
  const sp = 70*dt, r = this.rad;
  let dx=0, dy=0;
  if(key.left) dx--; if(key.right) dx++; if(key.up) dy--; if(key.down) dy++;
  if(dx) this.face = dx>0?0:1;
  if(!dx && !dy && ptr.down){
    const tx = ptr.x - this.p.x, ty = ptr.y - this.p.y;
    if(Math.abs(tx)>3) dx = tx>0?1:-1;
    if(Math.abs(ty)>3) dy = ty>0?1:-1;
  }
  const len = Math.hypot(dx,dy)||1;
  this.moveTo(this.p.x + dx/len*sp, this.p.y + dy/len*sp, r);
  // сомнения
  for(const b of this.blobs){
    b.m += dt;
    const spx = 38*b.sp*dt;
    const ddx = b.tx-b.x, ddy = b.ty-b.y;
    if(Math.hypot(ddx,ddy)>1){ b.x += Math.sign(ddx)*Math.min(Math.abs(ddx),spx); b.y += Math.sign(ddy)*Math.min(Math.abs(ddy),spx); }
    else {
      const opts = [[1,0],[-1,0],[0,1],[0,-1]].filter(o=>!this.solid(this.ox+(b.gx+o[0]+0.5)*this.tile, this.oy+(b.gy+o[1]+0.5)*this.tile));
      if(opts.length){ const o = pick(opts); b.gx+=o[0]; b.gy+=o[1];
        b.tx = this.ox+(b.gx+0.5)*this.tile; b.ty = this.oy+(b.gy+0.5)*this.tile; }
    }
    if(this.inv<=0 && Math.hypot(b.x-this.p.x, b.y-this.p.y) < this.tile*0.6){
      this.inv = 1.8; this.lives--; Snd.hurt(); shake(5);
      impact(this.p.x, this.p.y, '#b197fc', 5, 22);
      comboBreak();
    }
  }
  if(this.inv>0) this.inv -= dt;
  // сердечки-ключи
  for(const k of this.pickups){
    if(k.got) continue;
    k.k += dt;
    if(Math.hypot(k.x-this.p.x, k.y-this.p.y) < this.tile*0.75){
      k.got = 1; this.got++;
      this.limit = Math.min(120, this.limit + 6);
      Snd.coin(); comboAdd(1);
      popText(k.x, k.y-8, '+6с', CONFIG.P.gold);
      ring(k.x, k.y, CONFIG.P.gold, 20, 0.35);
      fx(k.x, k.y, 10, CONFIG.P.gold, 70, 0.5);
    }
  }
  // цель
  const gxp = this.ox + (this.goal.x+0.5)*this.tile, gyp = this.oy + (this.goal.y+0.5)*this.tile;
  if(Math.hypot(gxp-this.p.x, gyp-this.p.y) < this.tile*0.9) winLevel(LEVELS.indexOf(this));
  if(this.lives<=0) loseLevel('Сомнения догнали. Ещё раз!');
  if(this.limit > 0){
    this.limit -= dt;
    if(this.limit <= 0) loseLevel('Время вышло. Лабиринт подождёт.');
  }
};
L2.draw = function(){
  const T = this.tile, P = CONFIG.P;
  if(!this.fogPal){
    this.fogPal = {
      wall:[], floor:[], floor2:[],
      top:[], bot:[]
    };
    for(let i=0;i<=8;i++){
      const k = 0.09 + (i/8)*0.91;
      this.fogPal.wall.push(mixCol('#120a24','#4d3480', k*0.9+0.1));
      this.fogPal.top.push(mixCol('#1b1035','#6b4fa0', k));
      this.fogPal.bot.push(mixCol('#0a0518','#241445', k));
      this.fogPal.floor.push(mixCol('#0d0820','#1b1035', k));
      this.fogPal.floor2.push(mixCol('#0d0820','#22143f', k));
    }
  }
  const FP = this.fogPal;
  ctx.fillStyle = '#0a0518'; ctx.fillRect(0,0,W,H);
  const torch = this.tile*3.0 + Math.sin(this.t*9)*this.tile*0.14;
  for(let y=0;y<this.gh;y++) for(let x=0;x<this.gw;x++){
    const px0 = this.ox+x*T, py0 = this.oy+y*T;
    const cx0 = px0+T/2, cy0 = py0+T/2;
    const d = Math.hypot(cx0-this.p.x, cy0-this.p.y);
    const ki = Math.round(clamp(Math.max(0.09, 1 - d/(torch+T)), 0, 1)*8);   // туман войны
    if(this.grid[y][x]===1){
      ctx.fillStyle = FP.wall[ki];  ctx.fillRect(px0,py0,T,T);
      ctx.fillStyle = FP.top[ki];   ctx.fillRect(px0,py0,T,2);
      ctx.fillStyle = FP.bot[ki];   ctx.fillRect(px0,py0+T-2,T,2);
    } else {
      ctx.fillStyle = ((x+y)%2===0) ? FP.floor[ki] : FP.floor2[ki];
      ctx.fillRect(px0,py0,T,T);
    }
  }
  // цель (маяк)
  const gxp = this.ox + (this.goal.x+0.5)*T, gyp = this.oy + (this.goal.y+0.5)*T;
  const bd = Math.hypot(gxp-this.p.x, gyp-this.p.y);
  if(bd < 999){
    // луч-маяк: видно издалека
    const ba = .10 + .07*Math.sin(this.t*3);
    ctx.globalAlpha = ba;
    for(let i=0;i<5;i++) ctx.fillRect(Math.round(gxp)-1, Math.round(gyp) - 16 - i*6, 2, 6);
    ctx.globalAlpha = 1;
    glowAt(gxp, gyp, 16 + Math.sin(this.t*3)*2, P.pink2, .22);
  }
  drawGirl(gxp, gyp+7, CONFIG.cHer, this.psc, 0);
  heart(gxp-4, gyp-20+Math.sin(this.t*3)*2, 1, P.pink);
  // сердечки-ключи
  for(const k of this.pickups){
    if(k.got) continue;
    const b = 1 + Math.abs(Math.sin(k.k*2.2))*0.18;
    const d = Math.hypot(k.x-this.p.x, k.y-this.p.y);
    ctx.globalAlpha = clamp(0.30 + 0.70*(1-d/(this.tile*7)), 0.3, 1);   // маяк вдалеке
    heart(Math.round(k.x)-4, Math.round(k.y)-3-b*2, 1, P.gold);
    ctx.globalAlpha = 1;
  }
  // сомнения
  for(const b of this.blobs){
    const s = Math.max(3, Math.round(T*0.3));
    const cx = Math.round(b.x), cy = Math.round(b.y);
    ctx.globalAlpha = clamp(0.35 + 0.65*(1 - Math.hypot(b.x-this.p.x, b.y-this.p.y)/(this.tile*5)), 0.35, 1);
    ctx.fillStyle = '#0a0518'; ctx.fillRect(cx-s-1, cy-s-1, s*2+2, s*2+2);
    ctx.fillStyle = '#3a2560'; ctx.fillRect(cx-s, cy-s, s*2, s*2);
    ctx.fillStyle = '#8a5ab0'; ctx.fillRect(cx-s+1, cy-s+1, s*2-2, s*2-2);
    const ex = Math.round(Math.cos(b.m*2)*1), ey = Math.round(Math.sin(b.m*3)*1);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(cx-3+ex, cy-2+ey, 2, 2); ctx.fillRect(cx+2+ex, cy-2+ey, 2, 2);
    if(Math.floor(b.m*3)%2===0){ ctx.fillStyle='rgba(177,151,252,.35)'; ctx.fillRect(cx-s-2, cy-s-2, s*2+4, 1); }
    ctx.globalAlpha = 1;
  }
  // игрок
  if(!(this.inv>0 && Math.floor(this.t*20)%2)) drawGuy(this.p.x, this.p.y+7, CONFIG.cHim, this.psc, this.face);
  // фонарь: тёплое пятно + «конус» в сторону взгляда
  glowAt(this.p.x, this.p.y, torch, P.gold, .11);
  glowAt(this.p.x, this.p.y, torch*0.55, P.gold, .10);
  {
    const fa = this.face*Math.PI/2 + (this.face===0?0:0);
    for(let i=0;i<14;i++){
      const d = this.tile*0.6 + i*this.tile*0.22;
      ctx.globalAlpha = .05 * (1 - i/14);
      ctx.fillStyle = P.gold;
      ctx.fillRect(Math.round(this.p.x + Math.cos(fa)*d - 2), Math.round(this.p.y + Math.sin(fa)*d - 1), 4, 3);
    }
    ctx.globalAlpha = 1;
  }
  // пыль из-под ног
  if(Math.random() < .25) fx(this.p.x + rnd(-2,2), this.p.y + 6, 1, '#5a4680', 16, .35, {g:20, s:1});
  drawLives(this.lives, 6, 6);
  const s2 = Math.ceil(Math.max(0, this.limit||0));
  chip(W-6, 4, s2+'с', (this.limit<18 ? CONFIG.P.red : CONFIG.P.ink), true);
  text('ВЕДИ: ' + (IS_TOUCH?'ПАЛЕЦ':'СТРЕЛКИ'), W-6, 18, {sc:1, align:'right', color:'#6b4fa0'});
  if(this.got>0) chip(6, 18, 'КЛЮЧИ: '+this.got, CONFIG.P.gold);
  vignette(0.85);
  crtOverlay(this.t); bezel();
};
})();

/* ==========================================================================
   5 · НЕ ПРОМОКНИ — порывы, лужи, бонусы, зонт наклоняется
   ========================================================================== */
(function(){
L3.enter = function(){
  this.px=W/2; this.t=0; this.lives=3; this.inv=0; this.spawn=0.6; this.items=[]; this.win=40;
  this.hintY = 40;                       // подсказка — ниже HUD
  this.gust = 0; this.gustT = 6; this.tilt = 0; this.combo=0; this.dodge=0;
  this.pw = 0; this.pwT = 0; this.pwMax = 0; this.puddleY = H-10;
  this.rain = 1;
  this._boltT = rnd(3, 7);
  this.groundY = H - 16;
};
L3.update = function(dt){
  this.t += dt; this.win -= dt;
  updateLightning(this, dt);
  const sp = 130*dt*(this.pw==='slow'?0.55:1);
  const px0 = this.px;
  if(key.left) this.px -= sp;
  if(key.right) this.px += sp;
  if(ptr.down) this.px = lerp(this.px, ptr.x, 0.25);
  this.px = clamp(this.px, 12, W-12);
  this.tilt = lerp(this.tilt, clamp((this.px-px0)/(dt*130),-1,1)*0.35, 0.25);
  if(this.pwT>0){ this.pwT -= dt; if(this.pwT<=0) this.pw=0; }
  // порывы ветра — телеграф + рывок
  this.gustT -= dt;
  if(this.gustT <= 0){
    this.gustT = rnd(4.5, 7);
    this.gustDir = Math.random()<0.5?-1:1;
    this.gust = 0.9;             // сила
    this.gustTell = 0.9;         // предупреждение
  }
  if(this.gustTell > 0){
    this.gustTell -= dt;
    if(this.gustTell <= 0) this.gust = 1.1;
  } else if(this.gust > 0) this.gust -= dt*0.8;
  const wind = (this.t>14 ? Math.sin(this.t*0.8)*20 : 0) + (this.gust>0 ? this.gustDir*this.gust*70 : 0);
  this.wind = wind;
  this.spawn -= dt;
  if(this.spawn<=0){
    this.spawn = Math.max(0.13, 0.5 - this.t*0.008);
    const r = Math.random();
    const kind = r<0.18 ? 'heart' : (r<0.40 ? 'cloud' : (r<0.48 ? 'power' : 'drop'));
    this.items.push({x:rnd(8,W-8), y:-10, vy:rnd(90,150)+this.t*1.6, kind:kind, sw:rnd(0,6), power: kind==='power'?pickPower():null});
  }
  for(const it of this.items){
    it.y += it.vy*dt; it.sw += dt*4;
    it.x = clamp(it.x + wind*dt*0.5, 5, W-5);
    if(Math.abs(it.x-this.px) < 11 && Math.abs(it.y-(H-30)) < 15){
      it.dead = 1;
      if(it.kind==='heart'){
        Snd.coin(); comboAdd(1); this.combo++;
        popText(it.x, it.y-6, '+', CONFIG.P.pink2);
        fx(it.x, it.y, 6, CONFIG.P.pink, 60, 0.4);
        if(G.combo>0 && G.combo%5===0) popText(this.px, H-60, 'ДОЖДЬ x'+G.combo, CONFIG.P.gold);
      } else if(it.kind==='power'){
        this.pw = it.power; this.pwT = 5; this.pwMax = 5;
        Snd.fanfare(); popText(it.x, it.y-6, POWERS.find(p=>p.id===it.power).label, CONFIG.P.ink);
        ring(it.x, it.y, '#fff6e8', 22, 0.4);
      } else if(this.inv<=0){
        if(it.kind==='cloud'){
          if(this.pw==='shield'){ this.pw=0; this.pwT=0; Snd.clack(); popText(it.x,it.y-6,'ЩИТ',CONFIG.P.green); }
          else { this.lives--; this.inv=1.0; Snd.hurt(); shake(5); impact(it.x,it.y,'#6ea0ff',5,20); flashScreen('#3a5a8a',0.22); comboBreak(); }
        } else {
          this.inv = 0.7; Snd.blip(); this.lives -= 0;
          fx(it.x,it.y,6,'#6ea0ff',50,0.35);
        }
      }
    }
    if(it.y>H+8) it.dead=1;
  }
  this.items = this.items.filter(i=>!i.dead);
  if(this.inv>0) this.inv -= dt;
  if(this.win<=0){ winLevel(LEVELS.indexOf(this)); }
  if(this.lives<=0) loseLevel('Промок... но я быстро!');
};
L3.draw = function(){
  const P = CONFIG.P;
  // фон: дождь + мокрое небо (дизеринг — один раз, дальше из кэша)
  ctx.drawImage(bgCache('rain', paint=>{ ditherGradVTo(paint,0,0,W,H,'#2a2050','#141024',12); veilBlobTo(paint,W*0.3,H*0.2,W*0.7,'rgba(90,70,150,.25)'); }), 0, 0);
  clouds(this.t, 8, 5, 0.35);
  // силуэт города + окна
  drawCity(this.t, this.groundY, false);
  // туман у земли
  for(let i=0;i<3;i++){
    const yy = this.groundY - 4 - i*5;
    ctx.globalAlpha = .10 - i*.02;
    ctx.fillStyle = '#8fa8d8';
    const off = Math.round(Math.sin(this.t*.4 + i)*8);
    ctx.fillRect(off-10, yy, W+20, 5);
    ctx.globalAlpha = 1;
  }
  // капли: толще, под углом ветра, с брызгами о землю
  const wind = this.wind || 0;
  const rainN = 54;
  const sl = clamp(wind*0.12, -6, 6);
  for(let i=0;i<rainN;i++){
    const R = mulberry32(i*3+5);
    const x = (R()*W + this.t*(34 + sl*3) + wind*this.t*8) % W;
    const y = (R()*H + this.t*300) % H;
    ctx.fillStyle = i%4 ? 'rgba(140,180,255,.30)' : 'rgba(190,220,255,.5)';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 5 + (i%4)*2);
    ctx.fillRect(Math.round(x+sl*0.5), Math.round(y+5), 1, 1);
  }
  // вспышка молнии
  drawLightning(this.t, this._bolt);
  // порыв — стрелки
  if(this.gustTell>0){
    const dir = this.gustDir;
    ctx.globalAlpha = 0.25 + 0.35*Math.abs(Math.sin(this.t*10));
    ctx.fillStyle = P.sky;
    for(let i=0;i<3;i++){
      const ax = dir>0 ? (10+i*14) : (W-10-i*14), ay = 40;
      ctx.fillRect(ax, ay, 6, 1); ctx.fillRect(ax-dir*2, ay, 2, 1);
    }
    ctx.globalAlpha = 1;
  }
  if(this.wind && Math.abs(this.wind) > 20){
    ctx.globalAlpha = 0.3;
    for(let i=0;i<8;i++){
      const y = ((i*41 + this.t*70) % (H-30)) + 10;
      const x = ((i*97 + this.t*220) % (W+30)) - 15;
      ctx.fillStyle = P.sky; ctx.fillRect(Math.round(x), Math.round(y), 8, 1);
    }
    ctx.globalAlpha = 1;
  }
  // предметы
  for(const it of this.items){
    const x = Math.round(it.x + Math.sin(it.sw)*3), y = Math.round(it.y);
    if(it.kind==='drop'){
      ctx.fillStyle='#6ea0ff'; ctx.fillRect(x-1,y-4,2,6); ctx.fillRect(x-2,y-2,4,2);
    } else if(it.kind==='power'){
      ctx.fillStyle='rgba(255,246,232,.22)'; ctx.fillRect(x-8,y-8,16,16);
      drawPowerIcon(it.power, x-6, y-6, this.t+it.sw);
    } else if(it.kind==='cloud'){
      ctx.fillStyle='#3c3358'; ctx.fillRect(x-9,y-5,18,7);
      ctx.fillStyle='#4e4372'; ctx.fillRect(x-5,y-9,11,5); ctx.fillRect(x-1,y-12,7,4);
      ctx.fillStyle='#8ce99a'; ctx.fillRect(x-1,y+2,2,4);
    } else heart(x-4,y-3,1,P.pink);
  }
  // мокрая земля + отражения + лужи с кругами от капель
  wetGround(H-12, this.t);
  ctx.fillStyle='#2f5a8a';
  const poff = Math.floor(this.t*7)%23;
  for(let i=0;i<W;i+=23) ctx.fillRect((i+poff)%W, H-8, Math.min(10, W-((i+poff)%W)), 2);
  drawPuddles(this.t, H-11);
  // отражение зонта в луже
  ctx.globalAlpha = .12;
  ctx.fillStyle = P.pink;
  ctx.fillRect(Math.round(this.px)-9, H-11, 18, 2);
  ctx.globalAlpha = 1;
  // игрок с зонтом (наклон)
  const bx=Math.round(this.px), by=H-16;
  drawGuy(this.px, H-14, CONFIG.cHim, 2, 0);
  const uy = H-14-32, tl = Math.round(this.tilt*6);
  ctx.fillStyle='#2a2050'; ctx.fillRect(bx-1+tl,uy+4,2,14);
  ctx.fillStyle=P.pink;
  ctx.fillRect(bx-17+tl,uy,34,4); ctx.fillRect(bx-14+tl,uy-3,28,3); ctx.fillRect(bx-9+tl,uy-6,18,3); ctx.fillRect(bx-3+tl,uy-9,6,3);
  ctx.fillStyle=P.pink2; ctx.fillRect(bx-17+tl,uy,34,1);
  // капли скатываются по зонту
  if(Math.floor(this.t*8)%2===0){
    ctx.fillStyle='rgba(180,220,255,.7)';
    const dx2 = bx + Math.round(Math.sin(this.t*3)*12);
    ctx.fillRect(dx2, uy+2, 1, 2);
  }
  if(this.pw==='shield'){
    ctx.globalAlpha = 0.4+0.15*Math.sin(this.t*5);
    for(let i=0;i<20;i++){
      const a = Math.PI + i/19*Math.PI;
      ctx.fillStyle = P.green;
      ctx.fillRect(Math.round(bx+Math.cos(a)*20), Math.round(uy+2+Math.sin(a)*20), 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // HUD
  const bw = W-64;
  hudBar(6,6,bw,7, this.win/40, CONFIG.P.gold);
  chip(W-6, 4, Math.ceil(Math.max(0,this.win))+'с', this.win<8?CONFIG.P.red:CONFIG.P.ink, true);
  drawLives(this.lives, 6, 18);
  if(this.pw && this.pwT>0) powerTimer(this.pw, this.pwT, this.pwMax||this.pwT, W-42, 6);
  drawCombo(6, H-15, 'ДОЖДЬ','left');
  if(this.inv>0 && Math.floor(this.t*20)%2){ ctx.globalAlpha=0.18; ctx.fillStyle=P.red; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
  vignette(0.55);
  crtOverlay(this.t); bezel();
};
})();

/* ==========================================================================
   6 · МЕМОРИ — 8 пар 4×4, одна золотая пара, подсказка, перемешивание
   ========================================================================== */
(function(){
const MEM_PAIR = 8;
L4.enter = function(){
  this.t = 0; this.moves=0; this.found=0; this.flip=[]; this.wait=0; this.winT=0;
  this.limit = 115;
  this.pairN = MEM_PAIR;
  this.hint = 'ОТКРОЙ ВСЕ '+MEM_PAIR+' ПАР';
  this.hints = 2; this.hintT = 0; this.hintBtn = null;
  this.streak = 0; this.streakT = 0; this.shuffleFlash = 0;
  this.goldPair = 3;                      // какая пара золотая (даёт время)
  const cols = 4, rows = 4;
  const cw = Math.floor((W-20)/cols), chh = Math.floor((H-84)/rows);
  const s = Math.max(16, Math.min(cw-6, chh-6));
  this.cols=cols; this.rows=rows; this.cs=s;
  this.ox = Math.round((W - (cols*(s+6)-6))/2);
  this.oy = Math.round((H - (rows*(s+6)-6))/2) + 8;
  const pool = ICONS.slice(0, MEM_PAIR);
  const deck = [];
  for(let i=0;i<pool.length;i++){ deck.push(pool[i]); deck.push(pool[i]); }
  for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=deck[i]; deck[i]=deck[j]; deck[j]=t; }
  this.goldName = pool[this.goldPair];
  this.hintY = 22;                       // подсказка под HUD
  this.cards = deck.map((n,i)=>({
    n:n, open:false, done:false, gold:(n===this.goldName), flipT:0, hintFlash:0,
    x: this.ox + (i%cols)*(s+6), y: this.oy + Math.floor(i/cols)*(s+6)
  }));
  this.sel = 0;
};
L4.cardAt = function(x,y){
  for(const c of this.cards){ if(x>=c.x && x<=c.x+this.cs && y>=c.y && y<=c.y+this.cs) return c; }
  return null;
};
L4.update = function(dt){
  this.t += dt;
  for(const c of this.cards){
    if(c.flipT>0) c.flipT -= dt;
    if(c.hintFlash>0) c.hintFlash -= dt;
  }
  if(this.wait>0){
    this.wait -= dt;
    if(this.wait<=0){ for(const c of this.flip) c.open=false; this.flip=[]; }
  }
  if(this.winT>0){ this.winT -= dt; if(this.winT<=0){ this.winT=0; winLevel(LEVELS.indexOf(this)); } }
  if(this.hintT>0) this.hintT -= dt;
  if(this.streakT>0){ this.streakT -= dt; if(this.streakT<=0) this.streak=0; }
  if(this.shuffleFlash>0) this.shuffleFlash -= dt;
  if(this.limit > 0){
    this.limit -= dt;
    if(this.limit <= 0 && this.found < this.pairN) loseLevel('Карты устали ждать. Ещё раз?');
  }
};
L4.doOpen = function(c){
  if(!c || c.open || c.done || this.wait>0 || this.flip.length>=2) return;
  c.open = true; c.flipT = 0.22; this.flip.push(c); Snd.flip();
  if(this.flip.length===2){
    this.moves++;
    const [a,b] = this.flip;
    if(a.n===b.n){
      a.done=b.done=true; this.found++;
      const cx = a.x+this.cs/2, cy = a.y+this.cs/2;
      if(a.gold){
        this.limit = Math.min(140, this.limit + 12);
        popText(cx, a.y-2, '+12с', CONFIG.P.gold);
        ring(cx, cy, CONFIG.P.gold, 30, 0.55);
        fx(cx, cy, 14, CONFIG.P.gold, 80, 0.6);
        Snd.fanfare(); flashScreen(CONFIG.P.gold, 0.18);
      } else {
        ring(cx, cy, CONFIG.P.pink, 20, 0.4);
        fx(cx, cy, 8, CONFIG.P.pink, 60, 0.5);
        Snd.coin();
      }
      if(this.streakT>0){
        this.streak++;
        this.limit = Math.min(140, this.limit + 4);
        popText(cx, a.y-this.cs/2+4, 'СЕРИЯ +4с', CONFIG.P.green);
      } else this.streak = 1;
      this.streakT = 6;
      this.flip = [];
      if(this.found>=this.pairN){ this.winT = 0.8; }
      else if(this.found % 3 === 0 && Math.random() < 0.55) this.doShuffle();
    } else { this.wait = 0.7; Snd.bad(); comboBreak(); }
  }
};
L4.doShuffle = function(){
  const closed = this.cards.filter(c=>!c.done);
  const slots = closed.map(c=>({x:c.x, y:c.y}));
  const buckets = {};
  for(const c of closed) (buckets[c.n] = buckets[c.n] || []).push(c);
  let si = 0;
  for(const n in buckets){
    const arr = buckets[n];
    for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
    for(const c of arr){ const sl = slots[si++]; if(sl){ c.x=sl.x; c.y=sl.y; } c.open=false; }
  }
  this.flip=[]; this.wait=0; this.shuffleFlash=0.6;
  Snd.bad(); popText(W/2, 8, 'ПЕРЕМЕШАЛИ!', CONFIG.P.red);
};
L4.useHint = function(){
  if(this.hints<=0 || this.winT>0 || this.wait>0) return;
  const closed = this.cards.filter(c=>!c.done);
  if(closed.length < 2) return;
  const a = closed[0], b = closed.find(c=>c!==a && c.n===a.n);
  if(!b) return;
  a.hintFlash = 1.3; b.hintFlash = 1.3; this.hintT = 1.3;
  this.hints--; Snd.coin();
  popText(a.x+this.cs/2, a.y-4, 'Вот эта пара!', CONFIG.P.gold);
};
L4.key = function(k){
  if(k==='ArrowLeft'){ this.sel=(this.sel+this.cards.length-1)%this.cards.length; Snd.blip(); }
  if(k==='ArrowRight'){ this.sel=(this.sel+1)%this.cards.length; Snd.blip(); }
  if(k==='ArrowUp'){ this.sel=(this.sel+this.cards.length-this.cols)%this.cards.length; Snd.blip(); }
  if(k==='ArrowDown'){ this.sel=(this.sel+this.cols)%this.cards.length; Snd.blip(); }
  if(k===' '||k==='Enter') this.doOpen(this.cards[this.sel]);
  if(k==='h'||k==='H'||k==='р'||k==='Р') this.useHint();
};
L4.tap = function(x,y){
  const hb = this.hintBtn;
  if(hb && x>=hb.x && x<=hb.x+hb.w && y>=hb.y && y<=hb.y+hb.h){ this.useHint(); return; }
  const c=this.cardAt(x,y); if(c){ this.sel=this.cards.indexOf(c); this.doOpen(c); }
};
L4.draw = function(){
  const P = CONFIG.P;
  skyBg(this.t);
  if(this.shuffleFlash>0){ ctx.globalAlpha=this.shuffleFlash*0.4; ctx.fillStyle='#b197fc'; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
  // HUD
  chip(6, 4, 'ПАР '+this.found+'/'+this.pairN+'  ХОДЫ '+this.moves, this.found>=this.pairN?P.gold:P.ink);
  const s2 = Math.ceil(Math.max(0,this.limit||0));
  chip(W-6, 4, s2+'с', (this.limit<20?P.red:P.ink), true);
  if(this.streak>1) chip(W-6, 19, 'СЕРИЯ x'+this.streak, P.green, true);
  for(let i=0;i<this.cards.length;i++){
    const c = this.cards[i], s=this.cs;
    const isSel = (i===this.sel);
    const isc = Math.max(1, Math.floor(s/12));
    const flipK = c.flipT>0 ? Math.max(0.2, Math.abs(Math.cos((1-c.flipT/0.22)*Math.PI/2))) : 1;
    const fw = Math.max(2, Math.round(s*flipK));
    const fx0 = c.x + Math.round((s-fw)/2);
    if(c.done || c.open){
      ctx.fillStyle='#3a2560'; ctx.fillRect(fx0-2, c.y-2, fw+4, s+4);
      ctx.fillStyle = c.gold ? '#3a2a10' : '#1d1136';
      ctx.fillRect(fx0, c.y, fw, s);
      if(c.gold && c.done && Math.floor(this.t*4)%2===0){
        ctx.fillStyle = 'rgba(255,209,102,.20)'; ctx.fillRect(fx0, c.y, fw, s);
      }
      drawIconAt(c.n, fx0+fw/2, c.y+s/2, isc, c.gold?P.gold:(c.done?P.pink2:P.ink));
    } else {
      ctx.fillStyle='#241445'; ctx.fillRect(fx0-2,c.y-2,fw+4,s+4);
      ctx.fillStyle = isSel ? '#5a3f96' : '#3a2560';
      ctx.fillRect(fx0,c.y,fw,s);
      ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(fx0,c.y,fw,1);
      ctx.fillStyle='rgba(0,0,0,.18)';
      for(let yy=3;yy<s-3;yy+=3) for(let xx=3;xx<fw-3;xx+=3) ctx.fillRect(fx0+xx, c.y+yy, 1, 1);
      if(fw>=16){
        ctx.globalAlpha = 0.55;
        heart(fx0+fw/2, c.y+s/2, Math.max(1, Math.floor(s/24)), isSel?P.pink2:'#6b4fa0');
        ctx.globalAlpha = 1;
      }
      if(isSel){ ctx.fillStyle=P.gold; ctx.fillRect(fx0-1,c.y-1,2,2); ctx.fillRect(fx0+fw-1,c.y-1,2,2); }
    }
    if(c.hintFlash>0){
      ctx.fillStyle = 'rgba(255,209,102,'+(clamp(c.hintFlash,0,1)*0.45).toFixed(2)+')';
      ctx.fillRect(c.x-3,c.y-3,s+6,s+6);
    }
  }
  // кнопка подсказки
  const bw = 96, bx = W-bw-6, by = H-22;
  drawBtn(bx, by, bw, 14, this.hints>0 ? 'ПОДСКАЗКА x'+this.hints : 'ПОДСКАЗКИ НЕТ', {dis: this.hints<=0, color: this.hints>0?P.gold:UI.dim});
  this.hintBtn = {x:bx, y:by, w:bw, h:14};
  vignette(0.5);
  crtOverlay(this.t); bezel();
};
})();
