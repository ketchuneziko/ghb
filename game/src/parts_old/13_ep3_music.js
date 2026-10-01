/* ==========================================================================
   ЧАСТЬ 13 · ЭПИЗОД 3 — МУЗЫКА ВОСПОМИНАНИЙ
   Знакомство → повтор по памяти → падающие ноты → аккорды → «наша песня»
   Мелодия — массив ступеней в MUS.melody, звук синтезируется на лету
   ========================================================================== */

const MUS = {
  root: 220,                                     // ля малой октавы
  melody: [0, 2, 4, 7, 4, 2, 0, -3, 0, 2, 4, 9, 7, 4, 2, 0],   // «наша песня»
  stages: [4, 5, 6, 8, 10],                      // сколько нот повторять
  bpm:   [74, 80, 86, 94, 102],                  // темп по этапам
  fallAt: 2,                                     // с какого этапа — падающие ноты
  chordAt: 3                                     // с какого этапа — аккорды
};

const semi = n => MUS.root * Math.pow(2, n/12);
const mhz  = n => Math.round(semi(n));

/* --- проигрывание одной ноты «пианино» --- */
function pianoNote(n, dur, gain, type){
  if(!Snd.ac || !Snd.on) return;
  const f = semi(n), t0 = Snd.ac.currentTime, a = Snd.ac;
  const o = a.createOscillator(), o2 = a.createOscillator();
  const g = a.createGain(), g2 = a.createGain();
  o.type = type || 'triangle'; o.frequency.value = f;
  o2.type = 'sine'; o2.frequency.value = f*2.002;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain==null?0.26:gain, t0+0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  g2.gain.value = 0.15;
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(Snd.master);
  o.start(t0); o2.start(t0); o.stop(t0+dur+0.05); o2.stop(t0+dur+0.05);
}
function playSeq(seq, bpm, gain, cb){
  if(!Snd.ac) return;
  const spb = 60/bpm;
  for(let i=0;i<seq.length;i++)
    setTimeout(()=>pianoNote(seq[i], spb*1.5, gain==null?0.26:gain), i*spb*1000);
  if(cb) setTimeout(cb, seq.length*spb*1000);
}

const EP3 = {
  name:'МУЗЫКА', sub:'сыграй нашу песню', hint:'СЛУШАЙ И ПОВТОРЯЙ', hintY:false,
  intro:[D('her','Я нашла запись. Короткую. Секунд на двадцать.'),
         D('her','Там клавиши. Семь штук. И что-то очень знакомое.'),
         D('her','А потом они как будто упали с неба — и я не смогла их поймать.'),
         D('him','Сыграй — и увидишь, что это.')],
  outro:[D('her','Эту мелодию я помню с лета.'),
         D('her','Ты её специально перевёл на семь клавиш, да?'),
         D('him','Ага. Чтобы ты вспомнила не ноты, а вечер.')],
  enter(){
    scenes(this);
    this.keys = 7;
    this.kx = Math.round((W - Math.min(46, Math.floor((W-16)/7))*7)/2);
    this.ky = this.kbTop();
    this.press = []; this.trail = [];
    this.seq = []; this.input = []; this.stage = 0; this.phase = 'free';
    this.msg = 0; this.errT = 0; this.okT = 0; this.dim = false; this.win = false; this.winPhase = 0;
    this.melShown = 1; this.tries = 0; this.oct = 0; this.streak = 0; this.best = 0;
    this.last = []; this.fall = []; this.hitY = 0; this.runT = 0;
    this.mel = MUS.melody.slice();
    this.setScene('free');
  },
  nRect(i){ const w = this.kW(); return {x:this.kx + i*w, y:this.ky, w:w-1, h:this.kH()}; },
  kW(){ return Math.min(46, Math.floor((W-16)/7)); },
  kbTop(){ return H - 14 - this.kH(); },
  kH(){ return clamp(Math.floor(H*0.17), 54, 80); },
  u_common(dt){
    this.ky = this.kbTop();
    this.kx = Math.round((W - this.kW()*7)/2);
    for(let i=this.press.length-1;i>=0;i--){ this.press[i].t -= dt; if(this.press[i].t<=0) this.press.splice(i,1); }
    for(let i=this.trail.length-1;i>=0;i--){ this.trail[i].t -= dt; if(this.trail[i].t<=0) this.trail.splice(i,1); }
    if(this.msg > 0) this.msg -= dt;
    if(this.errT > 0) this.errT -= dt;
    // падающие ноты
    if(this.fall.length){
      this.runT += dt;
      const spb = 60/(MUS.bpm[clamp(this.stage,0,4)]*1.15);
      for(const n of this.fall){
        n.d -= dt;
        if(!n.hit && n.d <= 0){ this.missNote(n); }
        else if(!n.hit && n.d < -0.34){ this.missNote(n); }
      }
      this.fall = this.fall.filter(n => n.d > -0.5 && !n.done);
      if(!this.fall.length && this.phase === 'fall'){ this.stageFallOk = true; }
    }
    if(this.okT > 0){
      this.okT += dt;
      if(this.okT > 1.4 && !this.win){ this.win = true; }
      if(this.okT > 3.4) winLevel(LEVELS.indexOf(this));
    }
  },
  /* ---------- ноты ---------- */
  scaleAt(i){ return -3 + i; },
  playNote(i, good){
    this.press.push({i:i, t:0.28});
    this.trail.push({i:i, t:1.6});
    if(this.trail.length > 14) this.trail.shift();
    pianoNote(this.scaleAt(i) + this.oct*12, 0.45, 0.3);
    if(good) fx(this.kx + i*this.kW() + this.kW()/2, this.ky + 40, 3, CONFIG.P.gold, 40, .35);
  },
  pressKey(i){
    if(this.win) return;
    if(this.phase === 'fall'){ this.hitFall(i); return; }
    this.playNote(i, true);
    if(this.phase === 'free') return;
    this.input.push(i);
    const want = this.last, got = this.input;
    if(got.length > want.length) return;
    if(got[got.length-1] !== want[got.length-1]){
      this.input = []; this.errT = 0.45; Snd.bad(); shake(2);
      this.tries = (this.tries||0) + 1; this.streak = 0;
      return;
    }
    this.streak++; this.best = Math.max(this.best, this.streak);
    if(got.length === want.length) this.checkAnswer();
  },
  /* ---------- падающие ноты ---------- */
  startFall(){
    const bpm = MUS.bpm[clamp(this.stage,0,4)];
    const spb = 60/bpm;
    const useChord = this.stage >= MUS.chordAt;
    this.fall = [];
    this.runT = 0;
    for(let i=0;i<this.last.length;i++){
      this.fall.push({i:this.last[i], d:(i+1.4)*spb, hit:false, done:false, oct:0,
                      chord: useChord && i%4 === 3 ? [this.last[(i+1)%this.last.length], this.last[i]] : null});
    }
    this.phase = 'fall'; this.dim = false; this.input = [];
  },
  hitFall(i){
    // ближайшая к линии нота
    let best = null, bd = 9;
    for(const n of this.fall){
      if(n.hit || n.d > 0.34 || n.d < -0.3) continue;
      if(Math.abs(n.d) < bd){ bd = Math.abs(n.d); best = n; }
    }
    const w = this.kW();
    if(best && !best.chord && best.i === i){
      best.hit = true; best.done = true;
      this.playNote(i, true);
      this.streak++; this.best = Math.max(this.best, this.streak);
      popText(this.kx + i*w + w/2, this.ky - 26, this.streak > 1 ? 'x'+this.streak : '', CONFIG.P.gold);
      if(this.streak % 5 === 0){ this.streak = 0; popText(W/2, 60, '+БОНУС', CONFIG.P.green); }
      if(!this.fall.some(n=>!n.done)) this.checkAnswer();
      return;
    }
    if(best && best.chord && best.chord.indexOf(i) >= 0){
      best.part = (best.part||0) + 1;
      this.playNote(i, true);
      if(best.part >= best.chord.length){
        best.hit = true; best.done = true;
        popText(this.kx + i*w + w/2, this.ky - 26, 'АККОРД', CONFIG.P.gold);
        punch(.05);
        for(let q=0;q<8;q++) fx(this.kx + i*w + w/2, this.ky - 20, 2, CONFIG.P.gold, 60, .5);
        if(!this.fall.some(n=>!n.done)) this.checkAnswer();
      }
      return;
    }
    // мимо
    this.playNote(i, false);
    this.streak = 0; this.errT = .4; Snd.bad(); shake(2);
    this.tries = (this.tries||0) + 1;
  },
  missNote(n){
    if(n.hit) return;
    n.done = true; n.miss = true;
    this.streak = 0; this.errT = .5; Snd.bad(); shake(3);
    this.tries = (this.tries||0) + 1;
    popText(this.kx + n.i*this.kW() + this.kW()/2, this.ky - 26, 'ПРОПУЩЕНО', CONFIG.P.red);
  },
  /* ---------- переходы ---------- */
  checkAnswer(){
    if(this.phase === 'song'){
      this.okT = 0.001; Snd.fanfare(); flashScreen(CONFIG.P.gold,.3); punch(.1);
      return;
    }
    this.stage++;
    if(this.stage >= MUS.stages.length){
      this.phase = 'blind'; this.dim = true;
      this.last = this.randSeq(6);
      this.input = []; this.msg = 3.2; Snd.coin();
      return;
    }
    this.last = this.randSeq(MUS.stages[this.stage]);
    this.input = [];
    if(this.stage >= MUS.fallAt) this.startFall();
    else { this.phase = 'play'; this.msg = 1.4; Snd.coin(); }
  },
  randSeq(n){
    const s = []; let last = -1;
    for(let i=0;i<n;i++){
      let v = Math.floor(Math.random()*7);
      if(v === last) v = (v+1+Math.floor(Math.random()*6))%7;
      last = v; s.push(v);
    }
    return s;
  },
  /* ---------- фон: сцена со светом ---------- */
  d_stage(t){
    ctx.drawImage(bgCache('ep3bg', paint=>{
      ditherGradVTo(paint, 0, 0, W, Math.round(H*0.6), '#1a0b2e', '#4a1338', 16);
      ditherGradVTo(paint, 0, Math.round(H*0.6), W, H-Math.round(H*0.6), '#4a1338', '#12081f', 12);
    }), 0, 0);
    // лучи софитов
    if(FXQ > .5){
      ctx.globalAlpha = .07;
      for(let i=0;i<3;i++){
        const bx = W*(0.22 + i*0.28) + Math.sin(t*0.4 + i)*6;
        ctx.fillStyle = ['#ffd166','#ff5d8f','#6bc7ff'][i];
        for(let y=0;y<H*0.7;y+=2){
          const w2 = 3 + y*0.12;
          ctx.fillRect(Math.round(bx - w2/2 + y*0.18), y, Math.round(w2), 2);
        }
      }
      ctx.globalAlpha = 1;
    }
    // «боке»
    const R = mulberry32(88);
    for(let i=0;i<12;i++){
      const x = R()*W, y = R()*H*0.8, r = 3 + R()*7;
      ctx.globalAlpha = .05 + .04*Math.sin(t + i);
      ctx.fillStyle = ['#ffd166','#ff5d8f','#b197fc'][i%3];
      ctx.beginPath(); ctx.arc(x + Math.sin(t*0.3+i)*6, y, r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    motes(t, 22, '#ffd166', .3);
  },
  d_common(top){
    const P = CONFIG.P, t = this.t;
    this.d_stage(t);
    const stages = MUS.stages;
    hudTop({icon:'music', title: this.phase==='free' ? 'СВОБОДНАЯ ИГРА' :
                              this.phase==='song' ? 'НАША ПЕСНЯ' :
                              (this.phase==='fall' ? 'ПАДАЮЩИЕ НОТЫ' : 'ЭТАП '+Math.min(this.stage+1,stages.length)+'/'+stages.length),
            col:'#b197fc', h:22, right:'x'+(this.best||0)});
    epProgress(this.phase==='song'?5:clamp(this.stage,0,5), 5, W/2-22, 24, '#b197fc');
    // «рояль»: ноты взлетают от клавиш
    const ky = this.ky, kh = this.kH();
    for(const n of this.trail){
      const k = 1 - n.t/1.6;
      const x = this.kx + n.i*this.kW() + this.kW()/2;
      const y = ky - 8 - k*(ky - top - 60);
      ctx.globalAlpha = (1-k)*0.85;
      ctx.fillStyle = (n.i===3) ? CONFIG.P.gold : '#b197fc';
      ctx.fillRect(Math.round(x-2), Math.round(y), 4, 4);
      ctx.fillRect(Math.round(x-1), Math.round(y+4), 2, 6);
      ctx.globalAlpha = 1;
    }
    // падающие ноты
    if(this.phase === 'fall' && this.fall.length){
      const lineY = ky - 20, spb = 60/(MUS.bpm[clamp(this.stage,0,4)]*1.15);
      const fallH = lineY - top - 12;
      ctx.fillStyle = 'rgba(255,246,232,.10)'; ctx.fillRect(0, lineY, W, 1);
      glowAt(W/2, lineY, 20, '#b197fc', .2);
      for(const n of this.fall){
        const w = this.kW();
        const x = this.kx + n.i*w + w/2;
        const y = lineY - n.d/spb*fallH;
        if(y < top-10 || y > ky) continue;
        const col = n.hit ? P.green : (n.miss ? P.red : (n.chord ? P.gold : '#b197fc'));
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x-4), Math.round(y)-3, 8, 6);
        ctx.fillRect(Math.round(x-2), Math.round(y)-5, 4, 10);
        if(n.chord) text('♪', x+8, Math.round(y)-4, {sc:1, color:P.gold});
        if(FXQ > .5) glowAt(x, y, 10, col, .3);
      }
    }
    // центральная подсказка
    const mid = (top + ky)/2 + 14;
    if(this.phase === 'free'){
      textBlock('семь клавиш — семь нот. Нажимай сколько угодно.', W/2, mid - 8, W-24, {color:'#9b8ac0'});
    } else if(this.phase === 'song'){
      textBlock('это та самая мелодия. Первые четыре ноты.', W/2, mid - 8, W-24, {color:'#9b8ac0'});
    } else if(this.phase === 'fall'){
      textBlock('лови ноты, когда они дойдут до линии', W/2, mid - 20, W-24, {color:'#9b8ac0'});
    } else if(this.phase === 'blind'){
      textBlock('клавиши не светятся — только слушай', W/2, mid - 8, W-24, {color:'#9b8ac0'});
    } else {
      textBlock('повтори услышанное', W/2, mid - 8, W-24, {color:'#9b8ac0'});
    }
    // точки прогресса ввода
    if(this.phase !== 'free' && this.phase !== 'fall'){
      const dots = this.last.length, dw = Math.min(dots*8, W-20);
      for(let i=0;i<dots;i++){
        const got = i < this.input.length;
        const ok = got && this.input[i] === this.last[i];
        ctx.fillStyle = ok ? P.green : (got ? P.red : '#4a3670');
        ctx.fillRect(Math.round((W-dw)/2 + i*8), top+12, 5, 5);
      }
    }
    this.d_piano(top);
    this.d_buttons(top);
    if(this.errT > 0){
      ctx.globalAlpha = clamp(this.errT*2,0,1);
      text('СБИЛАСЬ', W/2, top+34, {sc:1, align:'center', color:P.red});
      ctx.globalAlpha = 1;
    }
    if(this.win){
      ctx.globalAlpha = 0.5+0.5*Math.abs(Math.sin(t*4));
      text('ЭТО ТА САМАЯ ПЕСНЯ', W/2, top+34, {sc:1, align:'center', color:P.gold});
      ctx.globalAlpha = 1;
      if(Math.floor(this.okT*2) % 2 === 0 && this.winPhase === 0){ this.winPhase = 1; this.playWinSong(); }
    }
    vignette(0.5); crtOverlay(t);
  },
  d_piano(top){
    const P = CONFIG.P, ky = this.ky, kh = this.kH(), w = this.kW();
    // корпус рояля
    ctx.fillStyle = '#170d2c'; ctx.fillRect(0, ky-2, W, 4);
    ctx.fillStyle = 'rgba(255,246,232,.08)'; ctx.fillRect(0, ky-2, W, 1);
    for(let i=0;i<7;i++){
      const r = this.nRect(i);
      const down = this.press.some(p=>p.i===i);
      const isC = (i===3);
      const near = this.phase === 'fall' && this.fall.some(n => !n.hit && Math.abs(n.d) < .3 && n.i === i);
      ctx.fillStyle = '#120a24'; ctx.fillRect(r.x, ky, r.w, kh);
      ctx.fillStyle = down ? P.gold : (near ? '#ffe9a8' : (isC ? '#1d1136' : '#fff6e8'));
      ctx.fillRect(r.x+1, ky+1, r.w-1, kh-1);
      if(down){ ctx.fillStyle = '#241445'; ctx.fillRect(r.x+1, ky+1, r.w-1, 4); }
      else { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(r.x+1, ky+1, r.w-1, 3); }
      if(isC){
        ctx.fillStyle = '#120a24';
        const h2 = Math.round(kh*0.58);
        ctx.fillRect(r.x+1, ky+1, r.w-1, h2);
        if(this.dim){ ctx.globalAlpha = 0.55; ctx.fillStyle='#6b4fa0'; ctx.fillRect(r.x+1, ky+1, r.w-1, h2); ctx.globalAlpha=1; }
      }
      if(!this.dim){
        ctx.fillStyle = (this.oct && isC) ? P.gold : 'rgba(107,79,160,.4)';
        ctx.fillRect(r.x+3, ky+kh-4, r.w-6, 1);
      }
    }
  },
  d_buttons(top){
    const P = CONFIG.P;
    const byy = this.ky - 19;
    if(this.phase==='free'){
      const b1 = 120, b1x = Math.round(W/2-b1/2);
      glassBtn(b1x, byy, b1, 15, 'Я ГОТОВА', {press:ptr.x>b1x&&ptr.x<b1x+b1&&ptr.y>byy&&ptr.y<byy+15, color:P.gold});
      this.bGo = {x:b1x, y:byy, w:b1, h:15};
    } else {
      this.bRects = bottomButtons(byy, 14, [
        {t:'СЛУШАТЬ', color:P.sky},
        {t:'ПЕДВАЛЬ', color:this.oct?P.gold:P.sky},
        {t:'ПОДСКАЗКА', color:(this.tries||0)>=2?P.gold:'#5a4680', dis:(this.tries||0)<2}
      ], ptr);
      this.bPlay = this.bRects[0]; this.bOct = this.bRects[1]; this.bHint = this.bRects[2];
    }
  },
  playWinSong(){
    const m = MUS.melody;
    playSeq(m, 82, 0.3);
    for(let i=0;i<m.length;i+=2){
      const b = [-12, -12, -5, -7][Math.floor(i/4)%4];
      setTimeout(()=>pianoNote(b, 0.9, 0.16, 'sine'), i*(60/82*500));
    }
    if(bothP() && IMG.her.complete && IMG.him.complete){
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#170d2c'; ctx.fillRect(W/2-42, this.ky-100, 84, 50);
      ctx.drawImage(IMG.him, W/2-40, this.ky-98, 38, 38);
      ctx.drawImage(IMG.her, W/2+2, this.ky-98, 38, 38);
      ctx.fillStyle = CONFIG.P.gold; ctx.fillRect(W/2-42, this.ky-52, 84, 1);
      ctx.globalAlpha = 1;
      glowAt(W/2, this.ky-76, 40, CONFIG.P.gold, .18);
    }
  }
};

/* ---------------- сцены ---------------- */
Object.assign(EP3, {
  on_free(){ this.msg = 0; },
  u_free(dt){ this.u_common(dt); },
  d_free(){ this.d_common(26); },
  t_free(x, y){
    if(this.bGo && x>this.bGo.x && x<this.bGo.x+this.bGo.w && y>this.bGo.y && y<this.bGo.y+this.bGo.h){
      this.phase = 'play'; this.stage = -1; this.setScene('play');
      this.last = this.randSeq(MUS.stages[0]); this.input = []; this.msg = 2.0; Snd.coin();
      return;
    }
    const i = this.keyAtPoint(x,y);
    if(i>=0) this.pressKey(i);
  }
});
EP3.u_play = EP3.u_common;
EP3.d_play = function(){ this.d_common(26); };
EP3.t_play = function(x,y){
  for(const b of ['bPlay','bOct','bHint']){
    const r = this[b];
    if(r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
      if(b==='bPlay'){
        if(this.phase==='song'){ playSeq(this.mel, 82, 0.3); Snd.coin(); this.melShown = 1; }
        else { playSeq(this.last.map(i=>this.scaleAt(i)+this.oct*12), 74, 0.24); this.input = []; }
        return;
      }
      if(b==='bOct'){ this.oct = 1-this.oct; Snd.blip(); this.playNote(0, false); return; }
      if(b==='bHint'){ this.input = []; Snd.coin(); popText(W/2, this.ky-34, 'ПОСЛУШАЙ ЕЩЁ РАЗ', CONFIG.P.gold);
        playSeq(this.last.map(i=>this.scaleAt(i)), 60, 0.24); return; }
    }
  }
  const i = this.keyAtPoint(x,y);
  if(i>=0) this.pressKey(i);
};
EP3.key = function(k){
  const n = {'1':0,'2':1,'3':2,'4':3,'5':4,'6':5,'7':6};
  if(n[k] != null) this.pressKey(n[k]);
  if(k==='ArrowUp'){ this.oct = 1; }
  if(k==='ArrowDown'){ this.oct = 0; }
};
EP3.keyAtPoint = function(x, y){
  const w = this.kW();
  for(let i=0;i<7;i++){
    const r = this.nRect(i);
    if(x>=r.x && x<=r.x+r.w && y>=this.ky && y<=this.ky+this.kH()){
      const isC = (i===3);
      if(isC && y < this.ky + this.kH()*0.58 - 6) return -1;
      return i;
    }
  }
  return -1;
};
EP3.checkAnswer = function(){
  if(this.phase === 'song'){
    this.okT = 0.001; Snd.fanfare(); flashScreen(CONFIG.P.gold,.3); punch(.1);
    return;
  }
  if(this.stage + 1 >= MUS.stages.length){
    this.phase = 'song'; this.setScene('song');
    this.last = this.mel.slice(0, 4).map(n => n - this.scaleAt(0));
    this.input = []; this.melShown = 0; this.dim = false; this.fall = [];
    this.msg = 3.4; Snd.coin();
    return;
  }
  this.stage++;
  this.last = this.randSeq(MUS.stages[this.stage]);
  this.input = []; this.fall = [];
  if(this.stage >= MUS.fallAt) this.startFall();
  else { this.phase = 'play'; this.msg = 1.4; Snd.coin(); }
};
EP3.d_song = function(){ this.d_common(26); };
EP3.u_song = function(dt){ this.u_common(dt); };
EP3.t_song = function(x,y){ this.t_play(x,y); };
