/* ==========================================================================
   ЧАСТЬ 12 · ЭПИЗОД 2 — РИТМ СЕРДЦА
   Она ловит настоящий такт: «Тук... тук... тук-тук!»
   Жми в момент, когда кольцо сойдётся на сердце.
   ========================================================================== */

const RTH = {
  spb: 0.62,        // длительность доли
  beats: 21,        // три такта по семь долей
  win: 10,          // сколько сильных долей нужно поймать
  misses: 6,        // сколько промахов простить
  good: 0.24,       // окно «в такт» (с запасом на реакцию)
  perfect: 0.10,    // окно «идеально»
  pattern: 'x..x.xx'
};
/* сколько сильных долей во всей игре — их и нужно поймать */
RTH.accentTotal = (function(){
  let n = 0;
  for(let i=1;i<=RTH.beats;i++) if(RTH.pattern[(i-1) % RTH.pattern.length] === 'x') n++;
  return n;
})();

const EP2 = {
  name:'РИТМ СЕРДЦА', sub:'поймай такт', hint:'ПРОБЕЛ В ТАКТ', hintY:false,
  intro:[D('him','Когда ты рядом, у меня в груди всё стучит не по инструкции.'),
         D('him','Поймай этот стук. Жми на сильные доли и не спеши — я подскажу.')],
  outro:[D('him','Попала. Я слышу, как оно стучит — ровно, как сейчас.'),
         D('him','Второе сердце.')],
  hearts: 1,
  enter(){
    scenes(this);
    this.hit = 0; this.beat = 0; this.beatT = 0;
    this.hitT = 0; this.missT = 0; this.ok = false; this.okT = 0;
    this.pulse = 0; this.combo = 0; this.trail = []; this.miss = 0; this.lock = 0;
    this.msg = ''; this.msgT = 0; this.phase = 0; this.pressed = -1;
    this.setScene('play');
  },
  on_play(){ this.hit = 0; this.beat = 0; this.beatT = 0; this.ok = false; this.combo = 0; this.miss = 0; this.lock = 0; this.phase = 0; this.pressed = -1; },
  /* насколько близко к доле: 0 — ровно в такт */
  offBeat(){ const b = this.beatT/RTH.spb; return Math.min(b, 1-b)*RTH.spb; },
  u_play(dt){
    this.t += dt;
    this.pulse = Math.max(0, this.pulse - dt*3);
    if(this.hitT > 0) this.hitT -= dt;
    if(this.missT > 0) this.missT -= dt;
    if(this.msgT > 0) this.msgT -= dt;
    if(this.lock > 0) this.lock -= dt;
    for(let i=this.trail.length-1;i>=0;i--){ this.trail[i].t -= dt; if(this.trail[i].t<=0) this.trail.splice(i,1); }
    if(this.ok){ this.okT += dt; if(this.okT > 1.5) winLevel(LEVELS.indexOf(this)); return; }
    if(this.phase === 2) return;
    this.beatT += dt;
    this.pulse = Math.max(this.pulse, Math.max(0, 1 - this.offBeat()/0.14));
    if(this.beatT >= RTH.spb){
      this.beatT -= RTH.spb;
      this.beat++;
      if(this.beat > RTH.beats){
        if(this.hit >= RTH.win){ this.ok = true; this.okT = 0; Snd.fanfare(); flashScreen(CONFIG.P.gold,.35); punch(.1); }
        else this.fail();
        return;
      }
      this.pulse = 1;
      Snd.note(beatFreq(this.beat), 0.05, 'square', 0.05);
    }
  },
  fail(){ this.phase = 2; this.missT = 2.2; loseLevel('Сбилась с такта. Ещё раз!'); },
  d_play(){
    const P = CONFIG.P, t = this.t;
    ctx.drawImage(bgCache('ep2bg', paint=>{ ditherGradVTo(paint,0,0,W,H,'#2a0f2e','#12061e',14); }), 0, 0);
    if(FXQ > .5){
      ctx.globalAlpha = .07;
      for(let i=0;i<3;i++){
        ctx.fillStyle = ['#ff5d8f','#ffd166','#6bc7ff'][i];
        const bx = W*(0.2+i*0.3) + Math.sin(t*0.5+i)*8;
        for(let y=0;y<H*0.7;y+=3) ctx.fillRect(Math.round(bx-(3+y*0.1)/2 + y*0.1), y, Math.round(3+y*0.1), 3);
      }
      ctx.globalAlpha = 1;
    }
    motes(t, 20, '#ff5d8f', .35);
    // она дирижирует
    drawGirl(W/2, H-34, CONFIG.cHer, 2, this.pulse);
    hudTop({icon:'music', title:'РИТМ СЕРДЦА', col:'#ff5d8f', h:20, right:this.hit+' / '+RTH.win});
    epProgress(this.hit, RTH.win, W/2 - 44, 22, P.pink2);
    // сердце
    const cx = W/2, cy = Math.round(H*0.46);
    const accent = (this.beat>=1 && this.beat<=RTH.beats) ? RTH.pattern[(this.beat-1) % RTH.pattern.length]==='x' : true;
    const sc = Math.max(2, Math.round(6*(1 + this.pulse*0.10)));
    const col = this.hitT>0 ? P.green : (this.missT>0 ? '#5a4680' : (accent ? P.pink : '#6b4fa0'));
    glowAt(cx, cy, 40, col, .18 + this.pulse*.26);
    heart(cx - 4*sc, cy - 3*sc, sc, col);
    // кольцо сходится к сердцу в такт
    if(this.beat >= 1 && this.beat <= RTH.beats){
      const k = clamp(this.beatT/RTH.spb, 0, 1);
      const rr = Math.round(lerp(40, 13, k));
      const near = 1 - clamp(Math.abs(k-1)/0.3, 0, 1);
      circleOutline(cx, cy, rr, near > 0.5 ? P.gold : '#4a3670');
      if(near > 0.5 && FXQ > .5) glowAt(cx, cy, 24, P.gold, .2*near);
    }
    // строка состояния
    let msg = 'ТУК... ТУК... ТУК-ТУК!', mc = '#8a6fbf';
    if(this.ok){ msg = 'ИДЕАЛЬНЫЙ ТАКТ!'; mc = P.green; }
    else if(this.hitT > 0){ msg = this.msg; mc = P.green; }
    else if(this.missT > 0){ msg = this.msg; mc = P.red; }
    else if(this.lock > 0){ msg = 'ДЫШИ... СЛЕДУЮЩИЙ ТАКТ'; mc = '#5a4680'; }
    text(msg, cx, 42, {sc:fitSc(msg, W-20, 1), align:'center', color:mc});
    // метроном: ближайшие доли
    const n = 7, bw2 = 10, gap = 4, x0 = cx - (n*(bw2+gap)-gap)/2, by = Math.round(H*0.58);
    for(let i=0;i<n;i++){
      const idx = (this.beat + i) % RTH.pattern.length;
      const acc = RTH.pattern[idx] === 'x';
      const on = acc, x = x0 + i*(bw2+gap);
      const cur = (i === (RTH.beats - this.beat) % n);
      const hh = on ? 9 : 4;
      ctx.fillStyle = cur ? (on ? P.gold : '#4a3670') : (on ? '#8a2b4a' : '#2a1a44');
      ctx.fillRect(x, by+(9-hh), bw2, hh);
      if(cur && FXQ > .5){
        ctx.globalAlpha = .4;
        ctx.fillRect(x-1, by-1, bw2+2, 11);
        ctx.globalAlpha = 1;
      }
    }
    text('Жми, когда кольцо сойдётся', cx, by+12, {sc:fitSc('Жми, когда кольцо сойдётся', W-20, 1), align:'center', color:'#5a4680'});
    text('Тёмные доли лучше пропустить', cx, by+23, {sc:fitSc('Тёмные доли лучше пропустить', W-20, 1), align:'center', color:'#4a3670'});
    // промахи
    for(let i=0;i<RTH.misses;i++) heart(6+i*10, 26, 1, (RTH.misses-1-i) < this.miss ? '#3a2560' : P.red);
    text('ПРОМАХИ', 6+4*10+4, 26, {sc:1, color:'#5a4680'});
    // следы
    for(const p of this.trail){
      const a = clamp(p.t/0.8, 0, 1);
      ctx.globalAlpha = a;
      popTextAt(p.x, p.y, p.good, p.col);
      ctx.globalAlpha = 1;
    }
    this.rTap = {x:cx-46, y:H-16, w:92, h:14};
    glassBtn(cx-46, H-16, 92, 14, 'ЖМИ В ТАКТ', {press:ptr.x>cx-46&&ptr.x<cx+46&&ptr.y>H-16&&ptr.y<H-2, color:P.pink2});
    vignette(0.5); crtOverlay(t);
  },
  tapNow(){
    if(this.ok || this.phase === 2) return;
    if(this.lock > 0) return;
    if(this.beat < 1 || this.beat > RTH.beats) return;
    if(this.pressed === this.beat) return;    // эта доля уже оценена
    this.pressed = this.beat;
    this.lock = 0.18;                          // короткий откат, чтобы не спамить
    const off = this.offBeat();
    const accent = RTH.pattern[(this.beat-1) % RTH.pattern.length] === 'x';
    const mark = (good, s, col)=>{
      if(good){ this.hit++; this.combo++; this.hitT = .45; this.pulse = 1.4; Snd.coin(); }
      else { this.combo = 0; this.miss++; this.missT = .45; Snd.bad(); if(this.missT) shake(2.5);
             if(this.miss >= RTH.misses){ this.trail.push({x:W/2, y:H*0.42, t:0, good:false, col:col}); this.fail(); return; } }
      this.msg = s; this.msgT = .45;
      this.trail.push({x:W/2, y:H*0.42, t:0, good:good, col:col});
      if(this.trail.length > 4) this.trail.shift();
      if(good && this.combo > 1 && this.combo % 4 === 0) popText(W/2, H*0.34, 'СЕРИЯ x'+this.combo, CONFIG.P.gold);
    };
    if(!accent){ mark(false, 'ЭТО БЫЛА ПАУЗА', CONFIG.P.red); return; }
    if(off <= RTH.perfect){ mark(true, 'ИДЕАЛЬНО!', CONFIG.P.gold); if(FXQ>.5) fx(W/2, H*0.42, 10, CONFIG.P.gold, 70, .5, {shape:'plus'}); }
    else if(off <= RTH.good){ mark(true, 'В ТАКТ!', CONFIG.P.green); }
    else { mark(false, off > RTH.spb*0.45 ? 'РАНО' : 'ПОЗДНО', CONFIG.P.red); }
  },
  k_play(k){ if(k===' '||k==='Enter') this.tapNow(); },
  t_play(x, y){
    if(this.rTap && x>this.rTap.x&&x<this.rTap.x+this.rTap.w&&y>this.rTap.y&&y<this.rTap.y+this.rTap.h){ this.tapNow(); return; }
    if(y > H*0.28) this.tapNow();
  }
};
function beatFreq(i){ return (RTH.pattern[(i-1) % RTH.pattern.length]==='x') ? 880 : 440; }
function popTextAt(x, y, s, col){ text(s, x, y, {sc:1, align:'center', color:col}); }
