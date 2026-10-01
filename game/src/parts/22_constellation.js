/* ==========================================================================
   ЧАСТЬ 22 · АРХИВ 02 — СОЗДАЙ СОЗВЕЗДИЕ
   Правило одно и честное: созвездие рисуют десять самых ярких звёзд,
   в порядке «от самой яркой к самой тусклой». Фигура заранее не показана.
   Лишние (ложные) звёзды тусклые, часть из них стоит вплотную к нужным.
   Ошибка не сбрасывает линию: красная нить гаснет, прогресс остаётся.
   ========================================================================== */

/* --- десять точек созвездия (нормализованные координаты 0..1) --- */
const ARC2_HEART = [[0.500,0.246],[0.594,0.080],[0.900,0.112],[0.900,0.457],
                    [0.594,0.763],[0.500,0.920],[0.406,0.763],[0.100,0.457],
                    [0.100,0.112],[0.406,0.080]];
/* порядок обхода: начинаем с нижней точки — она самая яркая */
const ARC2_ORDER  = [5,4,3,2,1,0,9,8,7,6];
/* --- двадцать ложных звёзд --- */
const ARC2_FAKE   = [[0.515,0.187],[0.804,0.538],[0.322,0.753],[0.443,0.133],[0.900,0.046],
                     [0.406,0.917],[0.771,0.637],[0.662,0.844],[0.954,0.780],[0.330,0.635],
                     [0.813,0.222],[0.214,0.527],[0.676,0.545],[0.327,0.213],[0.884,0.318],
                     [0.096,0.383],[0.306,0.544],[0.734,0.376],[0.113,0.946],[0.118,0.862]];
const ARC2_N      = 10;                 // сколько звёзд в созвездии
/* маленькая личная деталь: внутри созвездия проявляется «M» */
const ARC2_SECRET = [[0.355,0.655],[0.355,0.505],[0.355,0.355],[0.393,0.413],
                     [0.431,0.471],[0.469,0.413],[0.507,0.355],[0.507,0.505],[0.507,0.655]];
const ARC2_FAKES  = ARC2_FAKE.length;

AR_HINTS.stars = [
  'Начни с той звезды, которая горит ярче всех.',
  'Дальше иди к самой яркой из тех, что ещё не в линии.',
  'Яркость — это размер светящегося ядра. Тусклые — обманка.'
];

/* --- детерминированный генератор фоновых звёзд --- */
function arc2Rnd(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

ARCH_LEVELS.stars = {
  enter(){
    scenes(this);
    this.path = [];            // индексы звёзд в порядке созвездия
    this.stepErr = 0;          // ошибок на текущем шаге
    this.msg = 'СОЗВЕЗДИЕ СПРЯТАНО В ЛИШНИХ ЗВЁЗДАХ'; this.msgT = 3.4; this.msgCol = '#cfe0ff';
    this.errs = 0; this.glitch = 0; this.zoom = 1; this.panX = 0; this.panY = 0;
    this.lines = true; this.sel = -1; this.done = false; this.okT = 0;
    this.pending = null; this.dragged = false; this.keyCur = -1;
    this.btns = []; this.skyStars = [];
    const r = arc2Rnd(4242);
    for(let i=0;i<70;i++) this.skyStars.push({x:r(), y:r(), b:0.10+r()*0.35, ph:r()*6.3});
    this.setScene('sky');
  },
  tScene(dt){ this.sceneT += dt; },
  /* ---------- поле ---------- */
  rect(){ return {x:0, y:18, w:W, h:Math.max(120, H-64-(this.scene==='win'?44:0))}; },
  /** поле созвездия: чуть выше, чем шире — сердце от этого только лучше читается */
  sq(){
    const r = this.rect();
    const sx = Math.round(r.w*0.92);
    const sy = Math.max(sx, Math.min(Math.round(r.h*0.92), Math.round(sx*1.45)));
    return {sx:sx, sy:sy, ox:Math.round(r.x+(r.w-sx)/2), oy:Math.round(r.y+(r.h-sy)/2)};
  },
  /** нормализованная точка → экран (с зумом и панорамой) */
  toXY(nx, ny){
    const q = this.sq(), cx = q.ox+q.sx/2, cy = q.oy+q.sy/2;
    const bx = q.ox + nx*q.sx, by = q.oy + ny*q.sy;
    return [Math.round(bx + (bx-cx)*(this.zoom-1) + this.panX),
            Math.round(by + (by-cy)*(this.zoom-1) + this.panY)];
  },
  /** экран → нормализованные координаты поля */
  toNorm(x, y){
    const q = this.sq(), cx = q.ox+q.sx/2, cy = q.oy+q.sy/2;
    const bx = (x - this.panX - cx)/(this.zoom||1) + cx;
    const by = (y - this.panY - cy)/(this.zoom||1) + cy;
    return [(bx-q.ox)/q.sx, (by-q.oy)/q.sy];
  },
  /** список всех звёзд: сначала настоящие (в порядке созвездия), потом лишние */
  stars(){
    const out = [];
    for(let k=0;k<ARC2_N;k++){
      const i = ARC2_ORDER[k], p = ARC2_HEART[i];
      out.push({n:k, real:true, nx:p[0], ny:p[1], b:1 - k*0.062, big:true});
    }
    for(let k=0;k<ARC2_FAKES;k++){
      const p = ARC2_FAKE[k];
      out.push({n:-1, real:false, nx:p[0], ny:p[1], b:0.09 + (k%7)*0.030, big:false});
    }
    return out;
  },
  /** нужная следующая по яркости звезда (её номер в созвездии) */
  need(){
    if(this.path.length >= ARC2_N) return null;
    return this.path.length;
  },
  starAt(x, y){
    const list = this.stars();
    let best = -1, bd = 13;
    for(let i=0;i<list.length;i++){
      const p = this.toXY(list[i].nx, list[i].ny);
      const d = Math.hypot(p[0]-x, p[1]-y);
      if(d < bd){ bd = d; best = i; }
    }
    return best;
  },
  inPath(i){ return this.path.indexOf(i) >= 0; },

  /* ---------- ход игрока ---------- */
  pick(i){
    if(this.done) return;
    if(i < 0) return;
    const list = this.stars();
    const st = list[i];
    const need = this.need();
    // уже взятая звезда — просто подсветим, ничего не ломаем
    if(this.inPath(i)){
      const k = this.path.indexOf(i);
      const p0 = this.path.length > 1 ? this.path[k-1] : null;
      if(p0 == null) return;
      const a = this.stars()[p0], b = this.stars()[i];
      Snd.flip();
      this.msg = 'ЭТА УЖЕ В ЛИНИИ'; this.msgT = 1.4; this.msgCol = '#8fa8c8';
      return;
    }
    if(need == null) return;
    const ok = (st.real && st.n === need);
    if(ok){
      this.path.push(i);
      this.stepErr = 0;
      Snd.note(Snd.hz(57 + this.path.length*2), 0.10, 'triangle', 0.12);
      fx(...this.toXY(st.nx, st.ny), 3, CONFIG.P.gold, 50, .6, {g:-30});
      if(this.path.length >= ARC2_N){ this.finish(); return; }
      this.msg = 'ЗВЕЗДА ' + this.path.length + ' ИЗ ' + ARC2_N; this.msgT = 1.1; this.msgCol = '#ffe6a8';
    } else {
      this.errs++; this.stepErr++;
      AR.errors[G_arIdx]++; arSaveNow();
      Snd.bad(); Snd.hurt();
      shake(3); this.glitch = 0.45;
      const p = this.toXY(st.nx, st.ny);
      const a = this.path.length ? this.stars()[this.path[this.path.length-1]] : null;
      this.badLines = this.badLines || [];
      this.badLines.push({a: a ? [a.nx, a.ny] : [st.nx, st.ny], b:[st.nx, st.ny], t:0});
      if(this.badLines.length > 4) this.badLines.shift();
      this.badFrom = a ? this.path[this.path.length-1] : i;
      flashScreen('#2a3f6b', .16);
      // на экране правило — по яркости, поэтому и подсказки такие же
      const tip = this.path.length === 0
        ? 'НАЧИНАЙ С САМОЙ ЯРКОЙ'
        : (st.real ? 'ЭТА СЛИШКОМ ТУСКЛАЯ' : 'ЭТА ЗВЕЗДА НИКУДА НЕ ВЕДЁТ');
      this.msg = tip; this.msgT = 2.0; this.msgCol = '#ff9d9d';
    }
  },
  undo(){
    if(this.done || !this.path.length) return;
    this.path.pop(); this.stepErr = 0;
    Snd.slide(500, 300, .12, 'triangle', .10);
    this.msg = 'ШАГ НАЗАД'; this.msgT = 1.1; this.msgCol = '#8fa8c8';
  },
  restart(){
    if(this.done) return;
    this.path = []; this.stepErr = 0; this.badLines = [];
    Snd.blip();
    this.msg = 'НАЧИНАЙ С САМОЙ ЯРКОЙ. ДАЛЬШЕ — ПО УБЫВАНИЮ'; this.msgT = 2.2; this.msgCol = '#cfe0ff';
  },
  finish(){
    this.done = true; this.okT = 0;
    Snd.fanfare(); flashScreen(CONFIG.P.gold, .3); shake(4);
    confettiRain(40); popText(W/2, Math.round(this.rect().h*0.28), 'СОЗВЕЗДИЕ!', CONFIG.P.gold, 2);
    for(let k=0;k<ARC2_N;k++){
      const p = ARC2_HEART[ARC2_ORDER[k]];
      const xy = this.toXY(p[0], p[1]);
      fx(xy[0], xy[1], 5, k%2 ? CONFIG.P.pink : CONFIG.P.gold, 70, 1.1, {g:-20});
    }
    this.setScene('win');
  },

  /* ---------- управление ---------- */
  on_sky(){},
  u_sky(dt){
    this.tScene(dt);
    if(this.glitch > 0) this.glitch -= dt;
    if(this.msgT > 0) this.msgT -= dt;
    if(this.badLines) for(const b of this.badLines) b.t += dt;
    this.badLines = (this.badLines||[]).filter(b => b.t < 0.8);
    if(Math.random() < 0.02) this.shoot = {x:rnd(0,W), y:rnd(0,H*0.5), t:0};
    if(this.shoot){ this.shoot.t += dt; if(this.shoot.t > 0.7) this.shoot = null; }
    // панорама перетаскиванием
    if(this.pending){
      if(!ptr.down){
        if(!this.dragged) this.pick(this.starAt(this.pending.x, this.pending.y));
        this.pending = null; this.dragged = false;
      } else {
        const dx = ptr.x - this.pending.x, dy = ptr.y - this.pending.y;
        if(Math.abs(dx)+Math.abs(dy) > 3){
          this.dragged = true;
          this.panX += ptr.dx; this.panY += ptr.dy;
          this.clampPan();
        }
      }
    }
    // курсор мыши
    this.sel = this.done ? -1 : this.starAt(ptr.x, ptr.y);
  },
  clampPan(){
    const q = this.sq();
    const limX = Math.max(0, (q.sx*this.zoom - this.rect().w)/2 + 2);
    const limY = Math.max(0, (q.sy*this.zoom - this.rect().h)/2 + 2);
    this.panX = clamp(this.panX, -limX, limX);
    this.panY = clamp(this.panY, -limY, limY);
    if(this.zoom === 1){ this.panX = 0; this.panY = 0; }
  },
  t_sky(x, y){
    if(this.done) return;
    for(const b of this.btns){
      if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ Snd.blip(); b.f(); return; }
    }
    if(this.zoom > 1){ this.pending = {x:x, y:y}; this.dragged = false; }
    else this.pick(this.starAt(x, y));
  },
  k_sky(k){
    if(this.done) return;
    if(k==='z'||k==='Z'||k==='я'||k==='Я'){ this.zoom = this.zoom>1?1:1.5; this.clampPan(); Snd.blip(); return; }
    if(k==='l'||k==='L'||k==='д'||k==='Д'){ this.lines = !this.lines; Snd.blip(); return; }
    if(k==='u'||k==='U'||k==='г'||k==='Г'){ this.undo(); return; }
    const list = this.stars();
    if(k==='ArrowLeft'||k==='a'||k==='A'||k==='ф'||k==='Ф')  this.moveKey(-1, 0);
    else if(k==='ArrowRight'||k==='d'||k==='D'||k==='в'||k==='В') this.moveKey(1, 0);
    else if(k==='ArrowUp'||k==='w'||k==='W'||k==='ц'||k==='Ц')    this.moveKey(0, -1);
    else if(k==='ArrowDown'||k==='s'||k==='S'||k==='ы'||k==='Ы')  this.moveKey(0, 1);
    else if(k===' '||k==='Enter'){
      if(this.keyCur < 0){ this.keyCur = this.path.length ? this.path[this.path.length-1] : ARC2_N-1; }
      this.pick(this.keyCur);
    }
  },
  /** стрелки ведут курсор к ближайшей звезде в нужную сторону */
  moveKey(dx, dy){
    const list = this.stars();
    if(this.keyCur < 0) this.keyCur = dx < 0 || dy > 0 ? 0 : list.length-1;
    const a = list[this.keyCur];
    const ap = this.toXY(a.nx, a.ny);
    let best = -1, score = 1e9;
    for(let i=0;i<list.length;i++){
      if(i === this.keyCur) continue;
      const b = list[i], bp = this.toXY(b.nx, b.ny);
      const vx = bp[0]-ap[0], vy = bp[1]-ap[1];
      const fwd = vx*dx + vy*dy;
      if(fwd <= 2) continue;
      const off = Math.abs(vx*dy - vy*dx)/fwd;
      const sc = fwd + off*40;
      if(sc < score){ score = sc; best = i; }
    }
    if(best >= 0){ this.keyCur = best; Snd.flip(); }
  },

  /* ---------- победа ---------- */
  on_win(){ this.okT = 0; },
  u_win(dt){
    this.tScene(dt);
    this.okT += dt;
    if(Math.random() < .35) confettiRain(2);
    if(this.okT > 3.0) arWin();
  },

  /* ---------- отрисовка ---------- */
  d_sky(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_bg();
    const list = this.stars();
    // линии созвездия
    if(this.lines && this.path.length > 1){
      for(let i=1;i<this.path.length;i++){
        const a = list[this.path[i-1]], b = list[this.path[i]];
        const p1 = this.toXY(a.nx, a.ny), p2 = this.toXY(b.nx, b.ny);
        glowAt((p1[0]+p2[0])/2, (p1[1]+p2[1])/2, Math.hypot(p2[0]-p1[0], p2[1]-p1[1])*0.6, P.gold, .10);
        ctx.globalAlpha = 0.70 + 0.18*Math.sin(t*3 - i);
        this.thread(p1, p2, '#ffe6a8');
        ctx.globalAlpha = 1;
      }
    }
    // красные нити от ошибок
    for(const b of (this.badLines||[])){
      const p1 = this.toXY(b.a[0], b.a[1]), p2 = this.toXY(b.b[0], b.b[1]);
      ctx.globalAlpha = Math.max(0, 1 - b.t/0.8) * 0.9;
      this.thread(p1, p2, '#ff6b6b');
      ctx.globalAlpha = 1;
    }
    // звёзды
    const need = this.need();
    for(let i=0;i<list.length;i++){
      const st = list[i], p = this.toXY(st.nx, st.ny);
      const used = this.inPath(i);
      const isNeed = st.real && st.n === need;
      const hovered = (i === this.sel) || (i === this.keyCur);
      let col = st.real ? '#fff6e8' : '#9fb4d8';
      if(used) col = CONFIG.P.gold;
      if(!st.real) col = '#8496b8';
      const tw = 0.85 + 0.15*Math.sin(t*2.2 + i*1.7);
      const core = Math.max(1, Math.round(1 + st.b*4));
      if(used) glowAt(p[0], p[1], 7 + Math.sin(t*4)*1.5, CONFIG.P.gold, .30);
      else if(st.real) glowAt(p[0], p[1], (4 + st.b*11)*tw, col, .20 + st.b*.26);
      else glowAt(p[0], p[1], 2.5*tw, col, .07);
      ctx.fillStyle = col;
      ctx.fillRect(p[0]-(core>>1), p[1]-(core>>1), core, core);
      if(st.real && (st.n < 3 || used)){
        ctx.globalAlpha = .5 + .3*Math.sin(t*3 + i);
        ctx.fillStyle = CONFIG.P.gold;
        ctx.fillRect(p[0]-core-1, p[1], 1, 1); ctx.fillRect(p[0]+core, p[1], 1, 1);
        ctx.fillRect(p[0], p[1]-core-1, 1, 1); ctx.fillRect(p[0], p[1]+core, 1, 1);
        ctx.globalAlpha = 1;
      }
      if(hovered && !this.done){
        ringPix(p[0], p[1], 6, CONFIG.P.pink, 1);
      }
      // подсказка-подсветка после трёх ошибок на шаге
      if(isNeed && this.stepErr >= 3 && !this.done){
        const k = 0.5 + 0.5*Math.sin(t*5);
        ringPix(p[0], p[1], 7 + k*2, CONFIG.P.gold, 1);
        ctx.globalAlpha = 0.4 + 0.3*k;
        text('?', p[0], p[1]-11, {sc:1, align:'center', color:CONFIG.P.gold});
        ctx.globalAlpha = 1;
      }
    }
    this.d_hud();
    this.d_btns();
  },
  /** нить между точками — пунктиром, как настоящая линия созвездия */
  thread(p1, p2, col, w){
    const dx = p2[0]-p1[0], dy = p2[1]-p1[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx/len, ny = dy/len;
    ctx.fillStyle = col;
    for(let d=0; d<len; d+=3){
      if(Math.floor(d/3) % 3 === 2) continue;      // пунктир: 2 точки, gap
      const X = Math.round(p1[0]+nx*d), Y = Math.round(p1[1]+ny*d);
      ctx.fillRect(X, Y, w||1, w||1);
      ctx.fillRect(X+1, Y+1, 1, 1);
    }
  },
  d_bg(){
    const t = this.sceneT;
    ctx.drawImage(bgCache('arstars', p=>{
      ditherGradVTo(p,0,0,W,H,'#050a1e','#0b1230',14);
      // млечный путь
      for(let i=0;i<170;i++){
        const x = (i*37 % W), y = Math.round(H*0.18 + Math.sin(i*0.7)*H*0.14 + (i%19));
        p('rgba(150,180,255,0.10)', 1, x, y, 2, 1);
      }
      // редкие пыльные точки
      const pr = arc2Rnd(777);
      for(let i=0;i<120;i++){
        const x = Math.round(pr()*W), y = Math.round(pr()*H);
        p('rgba(200,220,255,0.16)', 1, x, y, 1, 1);
      }
    }), 0, 0);
    // фоновые звёзды
    for(const s of this.skyStars){
      const x = Math.round(s.x*W), y = Math.round(s.y*this.rect().h + this.rect().y);
      const a = s.b * (0.5 + 0.5*Math.sin(t*1.6 + s.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#cfe0ff';
      ctx.fillRect(x, y, 1, 1);
      ctx.globalAlpha = 1;
    }
    // падающая звезда
    if(this.shoot){
      const k = this.shoot.t/0.7;
      const x = this.shoot.x + k*70, y = this.shoot.y + k*26;
      ctx.globalAlpha = Math.sin(k*Math.PI);
      ctx.fillStyle = '#fff6e8';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      for(let i=1;i<7;i++) ctx.fillRect(Math.round(x-i*1.4), Math.round(y-i*0.5), 1, 1);
      ctx.globalAlpha = 1;
    }
    if(this.glitch > 0){
      const k = this.glitch/0.45;
      ctx.globalAlpha = .22*k;
      for(let i=0;i<6;i++) ctx.fillRect(0, Math.round(rnd(0,H)), W, Math.round(rnd(1,3)));
      ctx.globalAlpha = 1;
    }
  },
  d_hud(){
    const P = CONFIG.P;
    text('СОЗВЕЗДИЕ', 5, 4, {sc:1, color:P.sky});
    const n = this.path.length;
    text(n + ' / ' + ARC2_N + (this.zoom>1 ? '  X1.5' : ''), W-5, 4, {sc:1, align:'right', color: n?P.gold:'#8fa8c8'});
    ctx.fillStyle = 'rgba(140,180,255,.22)'; ctx.fillRect(4, 15, W-8, 1);
    // прогресс-полоска
    const bw = Math.min(120, W-40), bx = Math.round(W/2-bw/2);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, 18, bw, 3);
    ctx.fillStyle = P.gold; ctx.fillRect(bx, 18, Math.round(bw*n/ARC2_N), 3);
    if(this.msgT > 0){
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const msc = fitSc(this.msg, W-22, 1);
      const w2 = Math.min(W-8, textW(this.msg,msc)+10);
      panel(Math.round((W-w2)/2), H-58, w2, 13, 'rgba(6,12,30,.92)', this.msgCol||'#cfe0ff');
      text(this.msg, W/2, H-55, {sc:msc, align:'center', color:this.msgCol||'#cfe0ff'});
      ctx.globalAlpha = 1;
    }
  },
  d_btns(){
    const P = CONFIG.P;
    this.btns = [];
    const y2 = H-38, y1 = H-20, h = 16;
    const items = [
      {t:'НАЗАД', f:()=>this.undo(), off:!this.path.length},
      {t:'ЛИНИИ', f:()=>{ this.lines = !this.lines; }},
      {t: this.zoom>1?'X1':'X1.5', f:()=>{ this.zoom = this.zoom>1?1:1.5; this.clampPan(); }},
      {t:'ЗАНОВО', f:()=>this.restart()}
    ];
    const bw = Math.floor((W-8-(items.length-1)*3)/items.length);
    items.forEach((it,i)=>{
      const x = 4 + i*(bw+3);
      const on = it.off ? false : (ptr.x>x && ptr.x<x+bw && ptr.y>y2 && ptr.y<y2+h);
      drawBtn(x, y2, bw, h, it.t, {press:on, color: it.off ? '#4a5670' : (on?P.gold:'#cfe0ff')});
      this.btns.push({x:x, y:y2, w:bw, h:h, f: ()=>{ if(!it.off) it.f(); else Snd.bad(); }});
    });
    this.btns = this.btns.concat(arBar(y1, true));
  },
  d_win(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_bg();
    const list = this.stars();
    // линии светятся
    ctx.globalAlpha = 0.35 + 0.2*Math.sin(t*3);
    for(let i=1;i<this.path.length;i++){
      const a = list[this.path[i-1]], b = list[this.path[i]];
      this.thread(this.toXY(a.nx, a.ny), this.toXY(b.nx, b.ny), P.gold);
    }
    ctx.globalAlpha = 1;
    // все звёзды зажигаются
    for(let i=0;i<list.length;i++){
      const st = list[i], p = this.toXY(st.nx, st.ny);
      const used = this.inPath(i);
      const k = used ? 1 : 0.25 + 0.2*Math.sin(t*2 + i);
      glowAt(p[0], p[1], (used?9:4)*k, used?P.gold:'#9fb4d8', (used?.4:.18)*k);
      ctx.fillStyle = used ? '#fff6e8' : '#8496b8';
      ctx.fillRect(p[0]-(used?1:0), p[1]-(used?1:0), used?3:2, used?3:2);
    }
    // маленькая деталь: внутри проступает «M» — не загадка, просто подарок
    if(this.okT > 1.3){
      const a = clamp((this.okT - 1.3)/1.6, 0, 1);
      for(let i=0;i<ARC2_SECRET.length;i++){
        const q = this.toXY(ARC2_SECRET[i][0], ARC2_SECRET[i][1]);
        const tw = 0.7 + 0.3*Math.sin(t*2.2 + i*0.5);
        ctx.globalAlpha = a*tw;
        glowAt(q[0], q[1], 7, '#ff9ec4', .45);
        ctx.fillStyle = '#ffe6f0';
        ctx.fillRect(q[0]-1, q[1]-1, 3, 3);
        ctx.globalAlpha = 1;
      }
    }
    const cx = W/2;
    const y0 = this.rect().y + this.rect().h + 10;
    text('СОЗВЕЗДИЕ СОБРАНО', cx, y0, {sc:1, align:'center', color:P.gold});
    text('ЭТО СЕРДЦЕ, МАР', cx, y0+13, {sc:1, align:'center', color:'#ffd7e6'});
    if(this.okT > 1.2) text('Я НАРИСОВАЛ ЕГО ДЛЯ ТЕБЯ', cx, y0+26, {sc:1, align:'center', color:'#cfe0ff'});
    if(this.okT > 3.4){
      const a2 = clamp((this.okT - 3.4)/0.8, 0, 1);
      ctx.globalAlpha = a2;
      const mw = textW('M', 1), tw2 = textW('T', 1);
      text('M', cx - 14, y0+39, {sc:1, align:'center', color:'#ffd7e6'});
      heart(cx, y0+37, 1, P.pink);
      text('T', cx + 14, y0+39, {sc:1, align:'center', color:'#cfe0ff'});
      ctx.globalAlpha = 1;
    }
    this.btns = arBar(H-20, true);
  },
  t_win(){ this.btns = this.btns || arBar(H-20, true); },
  k_win(){},

  outro:[
    D('him','Смотри, что получилось. Я не рисовал это специально.'),
    D('him','Просто так вышло, что каждая линия ведёт к тебе.'),
    D('him','Это моё созвездие. Оно твоё.')
  ]
};
