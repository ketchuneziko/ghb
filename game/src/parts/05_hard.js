/* ==========================================================================
   ЧАСТЬ 5 · СЛОЖНЕЕ + НОВЫЙ УРОВЕНЬ В СЕТКЕ + «ПРОПУСТИТЬ»
   ========================================================================== */

/* --- добавляем уровень «КОД» перед финальным PRINT --- */
LEVELS.splice(6, 0, L8);
NODE_META.splice(6, 0, {name:'КОД', sub:'почини программу'});

G.fails = G.fails || {};
G.openMap = false;

/* --- две новые карточки для «МЕМОРИ» (стало 8 пар) --- */
const _drawIconOld = drawIcon;
drawIcon = function(name, x, y, s, col){
  if(name==='key' || name==='cup'){
    ctx.fillStyle = col;
    const p = (a,b,w,h)=>ctx.fillRect(x+a*s, y+b*s, w*s, h*s);
    if(name==='key'){
      p(0,3,4,4);
      ctx.fillStyle = '#241445'; p(1,4,2,2); ctx.fillStyle = col;
      p(4,4,6,2); p(8,6,2,2); p(6,6,2,1);
    } else {
      p(1,1,7,7); p(8,2,2,4); p(1,8,7,1);
      ctx.fillStyle = '#241445'; p(2,2,5,3); ctx.fillStyle = col;
      p(0,10,9,1);
    }
    return;
  }
  _drawIconOld(name, x, y, s, col);
};
ICON_H.key = 9; ICON_H.cup = 11;
ICONS.push('key', 'cup');

/* ==========================================================================
   ПРОПУСК ПОСЛЕ ТРЁХ ПОПЫТОК
   ========================================================================== */
function skipLevel(){
  const i = G.level;
  if(i<0 || !LEVELS[i]) return;
  G.hearts[i] = true; save(); Snd.coin();
  G.dialog = null;
  startDialog(LEVELS[i].outro, ()=>{ go('desktop'); G.openMap = true; });
}
const _loseLevelOld = loseLevel;
loseLevel = function(msg){
  const i = G.level;
  G.fails[i] = (G.fails[i]||0) + 1;
  _loseLevelOld(msg);
  if(G.fails[i] >= 3 && G.dialog) G.dialog.canSkip = true;
};

/* --- диалог теперь — окно программы --- */
G.screens.dialog.draw = function(){
  const P = CONFIG.P, d = G.dialog;
  drawWallpaper(this.t*0.3);
  ctx.fillStyle = 'rgba(10,6,22,.55)'; ctx.fillRect(0,0,W,H);
  if(d && d.lines[d.i]){
    const line = d.lines[d.i];
    const bw = W-14, bh = 78, bx = 7, by = H-bh-8;
    ctx.fillStyle = UI.dark; ctx.fillRect(bx-2,by-2,bw+4,bh+4);
    ctx.fillStyle = UI.line; ctx.fillRect(bx-1,by-1,bw+2,bh+2);
    ctx.fillStyle = UI.face; ctx.fillRect(bx,by,bw,bh);
    const who = line.who;
    const title = who ? ((who==='her'?CONFIG.her:CONFIG.him)+' · пишет') : 'СИСТЕМА';
    ctx.fillStyle = who==='her' ? '#4a1f3d' : (who==='him' ? '#223a5e' : UI.face2);
    ctx.fillRect(bx,by,bw,12);
    ctx.fillStyle = UI.dark; ctx.fillRect(bx,by+12,bw,1);
    text(title, bx+3, by+1, {sc:1, color:UI.text});
    const ps = 40;
    if(who && bothP()){
      ctx.fillStyle = '#170d2c'; ctx.fillRect(bx+4,by+17,ps,ps);
      ctx.drawImage(who==='her'?IMG.her:IMG.him, bx+4, by+17, ps, ps);
      ctx.fillStyle = who==='her'?P.pink:P.sky;
      ctx.fillRect(bx+4,by+17,ps,1); ctx.fillRect(bx+4,by+16+ps,ps,1);
    }
    const tx = bx + (who ? ps+10 : 6);
    const lines = wrap(line.text.slice(0, Math.floor(d.chars)), bw-(tx-bx)-6, 1);
    let yy = by+18;
    for(const l of lines){ text(l, tx, yy, {sc:1, color:P.ink}); yy += 11; }
    if(d.chars >= line.text.length){
      const a = 0.35+0.65*Math.abs(Math.sin(this.t*5));
      ctx.globalAlpha = a; heart(bx+bw-13, by+bh-12, 1, P.gold); ctx.globalAlpha = 1;
    }
    if(d.canSkip){
      const w2 = 84, x2 = bx+4, y2 = by+bh-16;
      drawBtn(x2, y2, w2, 13, 'ПРОПУСТИТЬ', {press:false});
      this.skipRect = {x:x2, y:y2, w:w2, h:13};
      text('сорян, бывает', x2+w2+6, y2+3, {sc:1, color:UI.dim});
    } else this.skipRect = null;
  }
  crtOverlay(this.t);
  bezel();
};
G.screens.dialog.key = function(k){
  if(!G.dialog) return;
  if((k==='p'||k==='P'||k==='з'||k==='З') && G.dialog.canSkip){ skipLevel(); return; }
  if(k===' '||k==='Enter') this.advance();
};
G.screens.dialog.tap = function(x,y){
  if(!G.dialog) return;
  const r = this.skipRect;
  if(r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ skipLevel(); return; }
  this.advance();
};

/* ==========================================================================
   УСЛОЖНЕНИЕ СТАРЫХ УРОВНЕЙ
   ========================================================================== */

/* --- 1 · ДОЖДЬ ИЗ СЕРДЕЦ: 24 сердца + ветер во второй половине + серии --- */
(function(){
  const e = L1.enter, u = L1.update, d = L1.draw;
  L1.enter = function(){ e.call(this); this.need = 24; this.combo = 0; this.best = 0; this.extra = 0.6; };
  L1.update = function(dt){
    const c0 = this.caught, l0 = this.lives;
    u.call(this, dt);
    if(this.caught > c0){ this.combo++; if(this.combo > this.best) this.best = this.combo; }
    if(this.lives < l0) this.combo = 0;
    if(this.caught >= Math.round(this.need*0.5)){
      const w = Math.sin(this.t*0.9)*26 + Math.sin(this.t*0.37)*14;
      for(const it of this.items) it.x = clamp(it.x + w*dt, 6, W-6);
      this.windy = w;
      this.extra -= dt;
      if(this.extra <= 0){
        this.extra = 0.55;
        this.items.push({x:rnd(10,W-10), y:-8, vy:rnd(60,86)+this.t*2.2, bad:Math.random()<0.24, sw:rnd(0,6), rot:0});
      }
    }
  };
  L1.draw = function(){
    d.call(this);
    if(this.combo >= 3){
      const k = 1 + Math.min(0.25, this.combo*0.02);
      text('СЕРИЯ x'+this.combo, 6, 16, {sc:1, color:CONFIG.P.gold});
      heart(6 + textW('СЕРИЯ x'+this.combo,1)+4, 16 + Math.round(Math.sin(this.t*8)), 1, CONFIG.P.pink);
    }
    if(this.windy !== undefined && this.caught >= Math.round(this.need*0.5)){
      const a = 0.4+0.3*Math.abs(Math.sin(this.t*2));
      ctx.globalAlpha = a;
      text('ВЕТЕР ' + (this.windy>0 ? '→' : '←'), Math.round(W/2), 4, {sc:1, align:'center', color:CONFIG.P.sky});
      ctx.globalAlpha = 1;
    }
  };
})();

/* --- 2 · ЛАБИРИНТ: таймер + ещё один «сомневающийся» --- */
(function(){
  const e = L2.enter, u = L2.update, d = L2.draw;
  L2.enter = function(){
    e.call(this);
    this.limit = 85;
    const open = [];
    for(let y=1;y<this.gh-1;y++) for(let x=1;x<this.gw-1;x++)
      if(this.grid[y][x]===0 && (x>3 || y>3)) open.push([x,y]);
    if(open.length && this.blobs.length < 4){
      const c = pick(open);
      this.blobs.push({gx:c[0], gy:c[1], x:this.ox+(c[0]+0.5)*this.tile, y:this.oy+(c[1]+0.5)*this.tile,
                       tx:this.ox+(c[0]+0.5)*this.tile, ty:this.oy+(c[1]+0.5)*this.tile, m:0, dir:[1,0]});
    }
  };
  L2.update = function(dt){
    u.call(this, dt);
    if(this.limit > 0){
      this.limit -= dt;
      if(this.limit <= 0) loseLevel('Время вышло. Лабиринт подождёт.');
    }
  };
  L2.draw = function(){
    d.call(this);
    const s = Math.ceil(Math.max(0, this.limit||0));
    text('⏱ '+s+'с', W-6, 16, {sc:1, align:'right', color: (this.limit<18 ? CONFIG.P.red : CONFIG.P.dim)});
  };
})();

/* --- 3 · ЗОНТ: ветер после полпути --- */
(function(){
  const u = L3.update, d = L3.draw;
  L3.update = function(dt){
    u.call(this, dt);
    if(this.t > 14){
      const w = Math.sin(this.t*0.8)*34;
      for(const it of this.items) it.x = clamp(it.x + w*dt, 5, W-5);
      this.wind = w;
    }
  };
  L3.draw = function(){
    d.call(this);
    if(this.t > 14){
      const a = 0.35+0.35*Math.abs(Math.sin(this.t*2.2));
      ctx.globalAlpha = a;
      text('ВЕТЕР ' + ((this.wind||0)>0 ? '→' : '←'), Math.round(W/2), 30, {sc:1, align:'center', color:CONFIG.P.sky});
      ctx.globalAlpha = 1;
    }
  };
})();

/* --- 4 · МЕМОРИ: таймер на 8 пар --- */
(function(){
  const e = L4.enter, u = L4.update, d = L4.draw;
  L4.enter = function(){ e.call(this); this.limit = 115; };
  L4.update = function(dt){
    u.call(this, dt);
    if(this.limit > 0){
      this.limit -= dt;
      if(this.limit <= 0 && this.found < 8) loseLevel('Карты устали ждать. Ещё раз?');
    }
  };
  L4.draw = function(){
    d.call(this);
    const s = Math.ceil(Math.max(0, this.limit||0));
    text('⏱ '+s+'с', W-6, 16, {sc:1, align:'right', color: (this.limit<20 ? CONFIG.P.red : CONFIG.P.dim)});
  };
})();

/* --- 5 · ПРИНТЕР: три ошибки — и заново --- */
(function(){
  const u = L5.update;
  L5.update = function(dt){
    u.call(this, dt);
    if(this.err >= 3 && !this.broke){ this.broke = true; loseLevel('Опечатался. Но смысл тот же.'); }
  };
  const e = L5.enter;
  L5.enter = function(){ e.call(this); this.broke = false; };
})();

/* --- 6 · РУКА: вторая фаза — быстрее, злее, быстрее утекает --- */
(function(){
  const u = L6.update, d = L6.draw;
  L6.update = function(dt){
    const hard = this.meter > 60;
    this.rotK = hard ? 3.9 : 3.1;
    this.decayK = hard ? 3.0 : 2.0;
    this.badP = hard ? 0.42 : 0.34;
    u.call(this, dt);
  };
  L6.draw = function(){
    d.call(this);
    if(this.meter > 60 && Math.floor(this.t*2.5)%2===0)
      text('ДЕРЖИСЬ!', Math.round(W/2), H-26, {sc:1, align:'center', color:CONFIG.P.gold});
  };
})();

/* --- 7 · РИТМ: окно попадания сужается вместе с пульсом --- */
(function(){
  const e = L7.enter, u = L7.update;
  L7.enter = function(){ e.call(this); this.winGood = 8; this.winMax = 22; };
  L7.update = function(dt){
    this.winGood = clamp(8 - (this.bpm-92)/26, 5, 8);
    this.winMax  = clamp(22 - (this.bpm-92)/7, 14, 22);
    u.call(this, dt);
  };
})();
