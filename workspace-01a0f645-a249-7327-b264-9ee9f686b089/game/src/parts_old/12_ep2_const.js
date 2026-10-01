/* ==========================================================================
   ЧАСТЬ 12 - ЭПИЗОД 2 — СОЗВЕЗДИЕ
   Небо из 32 звёзд в трёх слоях, соединить 6 нужных по подсказкам,
   пока по небу летят метеоры и гаснут ошибочные линии
   ========================================================================== */

const CON = {
  n: 32,
  clues: [
    'Первая — самая верхняя. Там, где начинается путь.',
    'Вторая — ближайшая к первой.',
    'Третья — самая одинокая: дальше всех от остальных.',
    'Четвёртая — та, что смотрит на третью.',
    'Пятая — та, у которой больше всего соседей рядом.',
    'Шестая — самая тусклая на этом небе.'
  ],
  hint5: 'Посмотри на звезду, которая дальше всех от остальных.',
  hint6: 'Ищи ту, которая горит тише всех.'
};

const EP2 = {
  name:'СОЗВЕЗДИЕ', sub:'соедини 6 звёзд', hint:'ЧИТАЙ НЕБО', hintY:false,
  intro:[D('her','Я не спала всю ночь и вышла на крышу.'),
         D('her','Там было 32 звезды. И мне показалось: какие-то из них что-то значат.'),
         D('her','А потом по небу пошли метеоры, и я испугалась, что не успею.'),
         D('him','Ну тогда ищи быстрее. Небо подождёт.')],
  outro:[D('her','Получилось. Я смотрела на это минут пять и не верила.'),
         D('her','Ты специально их так расставил, да?'),
         D('him','Нет. Они сами так легли. Просто я первый раз смотрел на тебя.')],
  enter(){
    scenes(this);
    this.extraUpdate = function(dt){
      this.drift = (this.drift||0) + dt;
      if(this.pan){
        if(ptr.down){
          this.ox = clamp(this.pan.ox + (ptr.x - this.pan.x), -W+40, 24);
          this.oy = clamp(this.pan.oy + (ptr.y - this.pan.y), -this.skyH*0.5, 24);
        } else this.pan = null;
      }
      for(let k=this.lines.length-1;k>=0;k--){
        const L = this.lines[k];
        if(!L.ok && L.dead > 0){
          L.dead -= dt;
          if(L.dead <= 0){ this.lines.splice(k,1); }
        }
        if(L.ok && L.dead > 0) L.dead -= dt;      // срезанные метеором правильные линии
      }
      this.u_sky(dt);
    };
    const R = mulberry32(20260930);
    this.ox = 0; this.oy = 0; this.z = 1; this.zT = 1; this.drag = null;
    this.stars = []; this.pan = null;
    const SW = W, SH = Math.round(H*0.62) + 40;
    let guard = 0;
    while(this.stars.length < CON.n && guard++ < 6000){
      const s = {
        x: 14 + R()*(SW-28),
        y: 26 + R()*(SH-40),
        b: 0.55 + R()*1.15,                 // яркость
        tw: R()*6.28,                        // фаза мерцания
        big: R() < 0.3,
        L: R()                              // слой глубины
      };
      let ok = true;
      for(const o of this.stars) if(Math.hypot(o.x-s.x, o.y-s.y) < 21) { ok = false; break; }
      if(ok) this.stars.push(s);
    }
    this.skyH = SH;
    this.lines = [];
    this.selA = -1; this.err = 0; this.hintN = 0; this.errT = 0; this.ok = false; this.okT = 0;
    this.clean = true; this.combo = 0; this.bestCombo = 0;
    this.goal = this.pickGoal();
    this.meteors = []; this.mT = 4; this.beamOn = 0; this.beamCd = 0; this.comboT = 0;
    this.fuse = 170; this.fuseMax = 170;
  },
  /* ---------- метеоры ---------- */
  u_sky(dt){
    if(this.beamCd > 0) this.beamCd -= dt;
    if(this.beamOn > 0) this.beamOn -= dt;
    this.mT -= dt;
    if(this.mT <= 0 && this.meteors.length < 3 && !this.ok){
      this.mT = rnd(2.6, 6.5);
      const fromLeft = Math.random() < .5;
      this.meteors.push({
        x: fromLeft ? -20 : W+20, y: rnd(30, this.skyH*0.8),
        vx: (fromLeft ? 1 : -1) * rnd(105, 165), vy: rnd(22, 46),
        life: 6, trail: []
      });
      Snd.blip();
    }
    for(let i=this.meteors.length-1;i>=0;i--){
      const m = this.meteors[i];
      m.trail.push({x:m.x, y:m.y});
      if(m.trail.length > 9) m.trail.shift();
      const px = m.x, py = m.y;
      m.x += m.vx*dt; m.y += m.vy*dt; m.life -= dt;
      // пересечение с линией — режет её
      for(const L of this.lines){
        if(L.dead > 0) continue;
        if(segHit(px, py, m.x, m.y, this.sx(L.a), this.sy(L.a), this.sx(L.b), this.sy(L.b))){
          L.dead = 1.6; L.cut = true;
          if(L.ok){ this.clean = false; this.combo = 0; this.burn(6); popText(W/2, 40, 'ЛИНИЯ СРЕЗАНА', CONFIG.P.red); }
          smash(m.x, m.y, '#ffd166', 5, 22);
        }
      }
      if(m.life <= 0 || m.x < -40 || m.x > W+40) this.meteors.splice(i,1);
    }
  },
  burn(k){
    this.fuse = Math.max(0, this.fuse - k);
    this.errT = .4; Snd.bad(); shake(2);
  },
  /* цель вычисляется из самого поля — значит, подсказки всегда правдивы */
  pickGoal(){
    const S = this.stars, g = [];
    let i1 = 0;
    for(let i=1;i<S.length;i++) if(S[i].y < S[i1].y - 0.5 || (Math.abs(S[i].y-S[i1].y)<=0.5 && S[i].x < S[i1].x)) i1 = i;
    g.push(i1);
    const near = (a, skip) => { let b=-1, bd=1e9;
      for(let i=0;i<S.length;i++){ if(skip.includes(i)) continue;
        const d = Math.hypot(S[i].x-S[a].x, S[i].y-S[a].y); if(d<bd){ bd=d; b=i; } } return b; };
    g.push(near(i1, g));
    let i3 = -1, far = -1;
    for(let i=0;i<S.length;i++){
      if(g.includes(i)) continue;
      let bd = 1e9;
      for(let j=0;j<S.length;j++){ if(j===i) continue; const d = Math.hypot(S[i].x-S[j].x, S[i].y-S[j].y); if(d<bd) bd=d; }
      if(bd > far){ far = bd; i3 = i; }
    }
    g.push(i3);
    g.push(near(i3, g));
    // 5 — больше всего соседей рядом
    let i5 = -1, bc = -1;
    for(let i=0;i<S.length;i++){
      if(g.includes(i)) continue;
      let c = 0;
      for(let j=0;j<S.length;j++){ if(j===i) continue; if(Math.hypot(S[i].x-S[j].x, S[i].y-S[j].y) < 46) c++; }
      if(c > bc){ bc = c; i5 = i; }
    }
    g.push(i5);
    // 6 — самая тусклая
    let i6 = -1, bb = 9;
    for(let i=0;i<S.length;i++){
      if(g.includes(i)) continue; if(S[i].b < bb){ bb = S[i].b; i6 = i; }
    }
    g.push(i6);
    return g;
  },
  sx(i){ return Math.round(this.ox + this.stars[i].x*this.z); },
  sy(i){ return Math.round(this.oy + this.stars[i].y*this.z); },
  hitStar(x, y){
    let best = -1, bd = 13;
    for(let i=0;i<this.stars.length;i++){
      const d = Math.hypot(this.sx(i)-x, this.sy(i)-y);
      if(d < bd){ bd = d; best = i; }
    }
    return best;
  },
  u_start(dt){
    this.fuse -= dt;
    if(this.fuse <= 0){ this.fuse = 0; loseLevel('Рассвет. Созвездие растворилось.'); }
    if(this.errT > 0) this.errT -= dt;
    if(this.comboT > 0){ this.comboT -= dt; if(this.comboT <= 0) this.combo = 0; }
    if(this.ok){
      this.okT += dt;
      if(this.okT > 3.0) winLevel(LEVELS.indexOf(this));
    }
  },
  /* ---------- фон: луна, туманность, город ---------- */
  d_sky(t){
    ctx.drawImage(bgCache('conbg', paint=>{
      ditherGradVTo(paint, 0, 0, W, Math.round(H*0.68), '#04030d', '#141033', 14);
      ditherGradVTo(paint, 0, Math.round(H*0.68), W, H-Math.round(H*0.68), '#141033', '#2a1a2e', 10);
    }), 0, 0);
    nebulaBg(t, {c1:'#2b1c5e', c2:'#16304f', c3:'#4a1440', seed: 5});
    // луна
    const mx = W-30, my = 30, mr = 13;
    glowAt(mx, my, mr*3.4, '#fff6e8', .16);
    ctx.fillStyle = '#f3e9d2';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(180,165,140,.55)';
    ctx.fillRect(mx-5, my-6, 4, 3); ctx.fillRect(mx+2, my-2, 3, 3); ctx.fillRect(mx-3, my+4, 3, 2); ctx.fillRect(mx+5, my+6, 2, 2);
    // полярное сияние
    if(FXQ > .5){
      for(let b=0;b<3;b++){
        ctx.globalAlpha = .10 + .05*Math.sin(t*.6 + b);
        ctx.fillStyle = ['#6bc7ff','#8ce99a','#c9a0ff'][b];
        for(let x=0;x<W;x+=2){
          const y = H*0.16 + b*7 + Math.sin(x*0.035 + t*.7 + b)*5;
          ctx.fillRect(x, Math.round(y), 2, Math.round(3 + 3*Math.sin(x*0.02 + t)));
        }
      }
      ctx.globalAlpha = 1;
    }
    // силуэт города
    ctx.fillStyle = '#0a0616';
    const R = mulberry32(3);
    for(let x=0;x<W;x+=14){
      const h = 10 + Math.round(R()*24);
      ctx.fillRect(x, H-26-h, 13, h);
      for(let wy=H-26-h+3; wy<H-28; wy+=5)
        for(let wx=x+3; wx<x+11; wx+=4)
          if(((wx*7+wy*3)%5) < 2){
            ctx.fillStyle = (Math.floor(t*1.5) + wx + wy) % 7 === 0 ? 'rgba(255,209,102,.85)' : 'rgba(255,209,102,.32)';
            ctx.fillRect(wx, wy, 1, 1); ctx.fillStyle = '#0a0616';
          }
    }
  },
  d_start(){
    const P = CONFIG.P, t = this.t;
    this.d_sky(t);
    // дальние пылевые звёзды
    starLayers(t, {seed: 11});
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H-22); ctx.clip();
    for(const s of this.stars){
      const r = s.b * 1.25 * (0.85 + 0.15*Math.sin(t*2.2 + s.tw));
      const x = this.ox + s.x*this.z, y = this.oy + s.y*this.z;
      if(s.b > 1.3 && FXQ > .5) glowAt(x, y, r*4, s.big?'#fff6e8':'#c9bde8', .12);
      starAt(x, y, r, s.big ? '#fff6e8' : '#c9bde8', .75 + .25*Math.sin(t*3+s.tw));
    }
    // подсказка лучом
    const clueIdx = this.ok ? -1 : Math.min(5, this.lines.filter(l=>l.ok).length);
    if(clueIdx >= 0 && this.beamOn > 0 && !this.ok){
      const gi = this.goal[clueIdx];
      const bx = this.sx(gi), by = this.sy(gi);
      const a = .35 + .3*Math.sin(t*3);
      for(let i=0;i<26;i++) ctx.fillRect(bx - i, Math.round(by - i*1.2), 2, 1);
      glowAt(bx, by, 16, P.gold, a);
    }
    // линии
    for(const L of this.lines){
      if(L.dead > 0 && L.cut) continue;
      const ax = this.sx(L.a), ay = this.sy(L.a), bx2 = this.sx(L.b), by2 = this.sy(L.b);
      const n = Math.max(Math.abs(bx2-ax), Math.abs(by2-ay));
      const dying = L.dead > 0;
      const col = dying ? '#ff6b6b' : (L.ok ? (this.ok ? '#ffd166' : '#ff5d8f') : '#4a3670');
      for(let k=0;k<=n;k++){
        const x = ax + (bx2-ax)*k/n, py = ay + (by2-ay)*k/n;
        const on = L.ok && !dying && Math.floor(k/2 + t*10) % 4 < 2;
        ctx.fillStyle = on ? '#fff6e8' : col;
        ctx.fillRect(Math.round(x), Math.round(py), 1, 1);
      }
      if(L.ok && !dying){
        if(FXQ > .5) glowAt((ax+bx2)/2, (ay+by2)/2, 6, this.ok?'#ffd166':'#ff5d8f', .25);
        ctx.fillStyle = this.ok ? '#ffd166' : 'rgba(255,93,143,.35)';
        ctx.fillRect(Math.round(ax+ (bx2-ax)/2)-1, Math.round(ay + (by2-ay)/2)-1, 2, 2);
      }
    }
    // метеоры
    for(const m of this.meteors){
      for(let i=0;i<m.trail.length;i++){
        const p = m.trail[i], f = i/m.trail.length;
        ctx.globalAlpha = f*.7;
        ctx.fillStyle = f > .7 ? '#fff6e8' : '#ffd166';
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      ctx.globalAlpha = 1;
      glowAt(m.x, m.y, 10, '#ffd166', .5);
      ctx.fillStyle = '#fff6e8'; ctx.fillRect(Math.round(m.x)-1, Math.round(m.y)-1, 3, 3);
    }
    // целевые звёзды
    this.goal.forEach((gi, k)=>{
      if(this.ok){
        const r = 2.4 + Math.abs(Math.sin(t*3 + k))*1.2;
        starAt(this.sx(gi), this.sy(gi), r, '#ffd166', .95);
      }
    });
    ctx.restore();
    motes(t, 18, '#c9bde8', .3);
    this.d_ui(t);
    vignette(0.6);
    crtOverlay(t);
  },
  d_ui(t){
    const P = CONFIG.P;
    const found = this.lines.filter(l=>l.ok && l.dead <= 0).length;
    // шапка
    hudTop({icon:'stars', title:'СОЗВЕЗДИЕ '+found+'/6', col:'#6b4fa0', h:22, right:Math.ceil(this.fuse)+'с'});
    epProgress(found, 6, W/2-27, 24, P.gold);
    meterBar(W-42, 26, 38, 4, this.fuse/this.fuseMax, this.fuse/this.fuseMax>.35?P.sky:P.red);
    // панель подсказки
    const px0 = 5, pw = W-10, py = H-118;
    glassPanel(px0, py, pw, 54, {col:'#2a1a54', title:'СОЗВЕЗДИЕ ИЗ ШЕСТИ ЗВЁЗД'});
    const clueIdx = this.ok ? -1 : Math.min(5, found);
    const cl = clueIdx>=0 ? CON.clues[clueIdx] : (this.ok ? 'ТЫ СОБРАЛА ЕГО ИЗ ТОЧЕК.' : 'Начни с первой подсказки.');
    wrap(cl, pw-12, 1).slice(0,2).forEach((l,i)=>text(l, px0+5, py+16+i*11, {sc:1, color: this.ok?P.gold:P.pink2}));
    for(let i=0;i<6;i++){
      ctx.fillStyle = i<found ? P.gold : '#3a2560';
      ctx.fillRect(px0+5+i*7, py+42, 4, 4);
    }
    if(this.combo > 1){
      text('x'+this.combo, W-8, py+38, {sc:1, align:'right', color:P.gold});
    }
    if(!this.clean) text('НЕБО ЗАПАЧКАНО', px0+pw-6, py+38, {sc:1, align:'right', color:'#6b4fa0'});
    text('ОШИБОК: '+this.err+'/5', px0+pw-6, py+46, {sc:1, align:'right', color: this.err>=3?P.red:'#6b4fa0'});
    // кнопки
    const by2 = H-20;
    this.bRects = bottomButtons(by2, 14, [
      {t:'ПОДСКАЗКА', color: this.hintN<5?P.gold:'#5a4680', dis:this.hintN>=5},
      {t:'ЛУЧ', color: this.beamCd>0?'#5a4680':P.sky, dis:this.beamCd>0},
      {t:'СБРОС', color:UI.text}
    ], ptr);
    this.bHint = this.bRects[0]; this.bBeam = this.bRects[1]; this.bClr = this.bRects[2];
    if(this.ok){
      ctx.globalAlpha = 0.5+0.5*Math.abs(Math.sin(t*3));
      text('СОЗВЕЗДИЕ СОБРАНО', 5, 26, {sc:1, color:P.gold});
      ctx.globalAlpha = 1;
      if(this.clean) text('БЕЗ ОШИБОК +30с', 5, 38, {sc:1, color:P.green});
    }
  },
  k_start(k){
    if(k==='ArrowLeft'){ this.ox = clamp(this.ox - 24, -W, 0); }
    if(k==='ArrowRight'){ this.ox = clamp(this.ox + 24, -W, 0); }
    if(k==='ArrowUp'){ this.oy = clamp(this.oy - 20, -this.skyH*0.4, 0); }
    if(k==='ArrowDown'){ this.oy = clamp(this.oy + 20, -this.skyH*0.4, 0); }
    if(k==='+'||k==='=') this.z = clamp(this.z+0.2, 0.6, 2.4);
    if(k==='-'||k==='_') this.z = clamp(this.z-0.2, 0.6, 2.4);
  },
  t_start(x, y){
    for(const b of ['bHint','bBeam','bClr']){
      const r = this[b];
      if(r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        if(b==='bHint'){
          if(this.hintN < 5){ this.hintN++; Snd.blip(); popText(r.x+r.w/2, r.y-6, 'ПОДСКАЗКА', CONFIG.P.gold); }
          else Snd.bad();
        }
        if(b==='bBeam'){ this.beamOn = 2.2; this.beamCd = 9; Snd.coin(); }
        if(b==='bClr'){ this.lines = []; this.selA = -1; this.clean = true; this.combo = 0; Snd.blip(); }
        return;
      }
    }
    const i = this.hitStar(x, y);
    if(i < 0){ this.pan = {x:x, y:y, ox:this.ox, oy:this.oy}; return; }
    if(this.selA < 0){
      this.selA = i; Snd.type();
      starAt(this.sx(i), this.sy(i), 3.6, '#fff6e8', 1);
      glowAt(this.sx(i), this.sy(i), 14, '#fff6e8', .4);
      return;
    }
    if(this.selA === i){ this.selA = -1; return; }
    const a = this.selA, b = i; this.selA = -1;
    const good = (this.goal.indexOf(a) >= 0) && (this.goal.indexOf(b) >= 0) && Math.abs(this.goal.indexOf(a)-this.goal.indexOf(b)) === 1;
    this.lines.push({a:a, b:b, ok:good, dead:0});
    if(good){
      Snd.coin();
      this.combo++; this.comboT = 3; this.bestCombo = Math.max(this.bestCombo, this.combo);
      if(this.combo % 3 === 0){ this.fuse = Math.min(this.fuseMax, this.fuse + 8); popText(W/2, 46, '+8с ЗА СЕРИЮ', CONFIG.P.sky); }
      const found = this.lines.filter(l=>l.ok && l.dead <= 0).length;
      popText((this.sx(a)+this.sx(b))/2, (this.sy(a)+this.sy(b))/2-6, 'ВЕРНО', CONFIG.P.gold);
      for(let q=0;q<8;q++) fx(lerp(this.sx(a),this.sx(b),q/8), lerp(this.sy(a),this.sy(b),q/8), 2, CONFIG.P.gold, 50, .5);
      punch(.05);
      if(found >= 5){
        this.ok = true; this.okT = 0; Snd.fanfare(); flashScreen(CONFIG.P.gold,.3);
        if(this.clean) this.fuse = 9999;
        for(let q=0;q<20;q++) fx(W/2, H*0.35, 2, CONFIG.P.gold, 90, .9);
      }
    } else {
      this.err++; this.errT = 0.4; this.clean = false; this.combo = 0;
      Snd.bad(); shake(2);
      const L = this.lines[this.lines.length-1];
      L.dead = 0.5;
    }
    if(this.err >= 5 && this.hintN < 5){
      this.hintN++;
      popText(W/2, 60, 'ПОДСКАЗКА: '+CON.hint5, CONFIG.P.gold);
      Snd.coin();
    }
  }
};
/* отрезок пересекает? */
function segHit(ax, ay, bx, by, cx, cy, dx, dy){
  const d1 = (bx-ax)*(cy-ay) - (by-ay)*(cx-ax);
  const d2 = (bx-ax)*(dy-ay) - (by-ay)*(dx-ax);
  const d3 = (dx-cx)*(ay-cy) - (dy-cy)*(ax-cx);
  const d4 = (dx-cx)*(by-cy) - (dy-cy)*(bx-cx);
  return ((d1>0) !== (d2>0)) && ((d3>0) !== (d4>0));
}
