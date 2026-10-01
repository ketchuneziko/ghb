/* ==========================================================================
   ЧАСТЬ 23 · АРХИВ 03 — МУЗЫКА ВОСПОМИНАНИЙ
   Семь клавиш, пять раундов на повтор (4/5/6/8/10), затем раунд вслепую
   и личный мотив. Ошибка не обнуляет игру: сбивается только фраза.
   ========================================================================== */

const ARC3_KEYS  = 7;
/* его тема в конце: 24 ноты, две октавы, с паузами (-1) */
const ARC3_FINALE = [0, 4, 2, 0, 5, -1, 4, 0, 6, 4, 2, 0, -1, 0, 4, 7, 5, 4, 2, 0, 4, 5, 6, 4, 0, 0];
const ARC3_MIDI  = [60,62,64,65,67,69,71];       // до ре ми фа соль ля си
const ARC3_NAME  = ['ДО','РЕ','МИ','ФА','СОЛЬ','ЛЯ','СИ'];
const ARC3_STEP  = 0.38;                          // длительность доли
/* --- мелодия: степени (0..6) --- */
const ARC3_PHRASES = [
  [0,2,4,2],
  [4,3,2,3,4],
  [0,4,2,5,4,2],
  [6,4,2,4,6,4,2,0],
  [0,2,4,6,4,2,3,2,0,0],
  [4,2,0,2,4,6,4]        // вслепую
];
const ARC3_MOTIF   = [0,4,5,4,2,0];

AR_HINTS.music = [
  'Повторяй то, что услышал. Порядок важен.',
  'Клавиши идут слева направо, от низкой ноты к высокой.',
  'Пятый раунд играется вслепую. Там нужны уши, а не глаза.'
];

ARCH_LEVELS.music = {
  enter(){
    scenes(this);
    this.rnd = 0;               // номер раунда 0..5
    this.pi = 0; this.si = 0; this.cd = 0;
    this.seq = ARC3_PHRASES[0].slice();
    this.press = new Array(ARC3_KEYS).fill(0);
    this.hit = new Array(ARC3_KEYS).fill(0);
    this.doneN = 0;
    this.fails = 0; this.errs = 0; this.glitch = 0; this.lost = false;
    this.pulse = 0; this.pulseK = -1;
    this.btns = [];
    this.msg = 'РАУНД 1. СЛУШАЙ, ПОТОМ ПОВТОРЯЙ'; this.msgT = 3.0; this.msgCol = '#ffe6a8';
    this.bass = 0; this.bassT = 0;
    this.motes = [];
    for(let i=0;i<26;i++) this.motes.push({x:Math.random(), y:Math.random(), v:0.02+Math.random()*0.05, s:Math.random()});
    this.setScene('listen');
  },
  tScene(dt){ this.sceneT += dt; },
  hz(k){ return 440*Math.pow(2, (ARC3_MIDI[k]-69)/12); },
  /** его тема в конце: длинная мелодия, а не один мотив */
  playFinale(dt){
    if(this.fi === undefined){ this.fi = 0; this.ft = 0.5; }
    this.ft -= dt;
    if(this.ft > 0 || this.fi >= ARC3_FINALE.length) return;
    const e = ARC3_FINALE[this.fi];
    if(e === -1){                                   // пауза между фразами
      this.fi++; this.ft = 0.42; return;
    }
    const k = e % ARC3_KEYS, oct = e >= ARC3_KEYS ? 2 : 1;
    Snd.note(this.hz(k)*oct, 0.75, 'triangle', 0.12);
    Snd.note(this.hz(k)*oct*1.5, 0.45, 'sine', 0.05);
    Snd.note(this.hz(k)/2, 0.9, 'sine', 0.05);
    this.press[k] = 1; this.pulseK = k; this.pulse = 1;
    if(this.fi % 2 === 0) confettiRain(2, ['#ffd97a','#ff9ec4']);
    this.fi++; this.ft = 0.30;
  },

  /* ---------- звук ---------- */
  playKey(k, vol){
    Snd.note(this.hz(k), 0.30, 'triangle', vol==null?0.13:vol);
    Snd.note(this.hz(k)*2, 0.12, 'sine', (vol==null?0.13:vol)*0.28);
    this.press[k] = 1;
  },
  /** мягкий бас под фразу — чтобы не было пустоты */
  playBass(k, v){ Snd.note(this.hz(k)/2, 0.9, 'sine', v==null?0.07:v); },

  /* ---------- раунд ---------- */
  startRound(i){
    this.rnd = i;
    this.pi = 0; this.si = 0;
    this.dark = (i === 5);
    this.seq = (i < ARC3_PHRASES.length ? ARC3_PHRASES[i] : ARC3_MOTIF).slice();
    this.doneN = 0;
    this.msg = (i < 5 ? 'РАУНД ' + (i+1) + ' · ' + this.seq.length + ' НОТ'
                     : (i === 5 ? 'ВСЛЕПУЮ. ГЛАЗА НЕ НУЖНЫ' : 'МОЙ МОТИВ'));
    this.msgT = 2.4;
    this.msgCol = this.dark ? '#a8c8ff' : '#ffe6a8';
    this.setScene('listen');
    this.cd = 0.85;
  },
  finishRound(){
    this.fails = 0; this.lock = 0.4;      // короткая блокировка, пока раунд закрывается
    Snd.coin();
    if(this.rnd < ARC3_PHRASES.length-1){ this.startRound(this.rnd+1); return; }
    if(this.rnd === ARC3_PHRASES.length-1){ this.startRound(ARC3_PHRASES.length); return; }
    this.setScene('win');
    Snd.fanfare(); flashScreen('#ffd97a', .35); shake(4);
    for(let k=0;k<ARC3_KEYS;k++) setTimeout(()=>{ Snd.note(this.hz(k), 0.8, 'triangle', 0.10); }, k*110);
    this.winPlay = ARC3_MOTIF.slice(); this.wi = 0; this.wt = 0;
    this.fi = 0; this.ft = 0.9;                     // его тема целиком
  },
  fail(){
    this.fails++; this.errs++;
    AR.errors[G_arIdx]++; arSaveNow();
    Snd.bad(); Snd.hurt(); shake(3); this.glitch = 0.5;
    flashScreen('#6b2a5a', .2);
    this.msg = 'СБИЛОСЬ. СНАЧАЛА, ПОТОМ И ДАЛЬШЕ'; this.msgT = 2.0; this.msgCol = '#ff9d9d';
    this.pi = 0; this.doneN = 0;
    this.done = new Array(this.seq.length).fill(false);
    this.setScene('listen'); this.cd = 0.6;
    if(this.fails >= 3){
      setTimeout(()=>{ if(!this.doneAll) arLose('Я сбился с мелодии. Давай попробуем ещё раз.'); }, 900);
    }
  },
  keyPress(k){
    if(k<0 || k>=ARC3_KEYS) return;
    if(this.lock > 0) return;
    if(this.scene === 'listen' || this.scene === 'win') return;   // не мешаем прослушиванию
    if(this.scene !== 'repeat') return;
    this.playKey(k);
    if(this.seq[this.pi] === k){
      this.doneN++;
      this.done[this.pi] = true;
      this.hit[k] = 1;
      fx(W/2, this.kbY-14, 3, CONFIG.P.gold, 46, .5, {g:-40});
      Snd.note(this.hz(k)*3, 0.08, 'sine', 0.05);
      this.pi++;
      if(this.pi >= this.seq.length) this.finishRound();
    } else {
      this.hit[k] = -1;
      Snd.bad();
      this.fail();
    }
  },

  /* ---------- сцены ---------- */
  on_listen(){ this.si = 0; this.cd = 0.9; this.pi = 0; this.done = new Array(this.seq.length).fill(false); },
  u_listen(dt){
    this.tScene(dt);
    this.decay(dt);
    this.bassT -= dt;
    if(this.bassT <= 0 && !this.dark){ this.bassT = ARC3_STEP*4; this.playBass(this.seq[0] > 2 ? 0 : 2); }
    this.cd -= dt;
    if(this.cd <= 0){
      if(this.si < this.seq.length){
        this.playKey(this.seq[this.si], this.dark?0.10:0.13);
        this.pulse = 1; this.pulseK = this.seq[this.si];
        if(!this.dark) this.hit[this.seq[this.si]] = 2;
        this.si++; this.cd = ARC3_STEP;
      } else {
        this.setScene('repeat');
        this.msg = 'ТЕПЕРЬ ТЫ'; this.msgT = 1.5; this.msgCol = '#c8ffd8';
      }
    }
  },
  on_repeat(){ this.pi = 0; },
  u_repeat(dt){ this.tScene(dt); this.decay(dt); this.bassT -= dt; if(this.bassT <= 0){ this.bassT = ARC3_STEP*4; this.playBass(this.seq[0] > 2 ? 0 : 2); } },
  on_win(){ this.okT = 0; this.wi = 0; this.wt = 0.4; this.fi = 0; this.ft = 1.0; },
  u_win(dt){
    this.tScene(dt); this.decay(dt); this.okT = (this.okT||0) + dt;
    this.wt -= dt;
    if(this.wt <= 0 && this.wi < this.winPlay.length){
      const k = this.winPlay[this.wi];
      Snd.note(this.hz(k), 0.7, 'triangle', 0.11);
      Snd.note(this.hz(k)*1.5, 0.5, 'sine', 0.05);
      this.press[k] = 1; this.pulseK = k; this.pulse = 1;
      this.wi++; this.wt = 0.55;
    }
    this.playFinale(dt);
    if(Math.random() < .35) confettiRain(1, ['#ffd97a','#ff9ec4','#9fd0ff','#fff6e8']);
    // ждём, пока дозвонит вся мелодия
    const fin = ARC3_FINALE.length * 0.30 + 2.2;
    if(this.okT > Math.max(4.2, fin)) arWin();
  },
  decay(dt){
    if(this.lock > 0) this.lock -= dt;
    for(let k=0;k<ARC3_KEYS;k++){
      if(this.press[k] > 0) this.press[k] = Math.max(0, this.press[k] - dt*3.2);
      if(this.hit[k] > 0) this.hit[k] = Math.max(0, this.hit[k] - dt*2.4);
      if(this.hit[k] < 0) this.hit[k] = Math.min(0, this.hit[k] + dt*2.0);
    }
    if(this.pulse > 0) this.pulse -= dt*2.2;
    if(this.glitch > 0) this.glitch -= dt;
    if(this.msgT > 0) this.msgT -= dt;
  },

  /* ---------- ввод ---------- */
  kbTop(){ return H - Math.min(72, Math.max(46, Math.round(H*0.22))); },
  keyRect(k){
    const w = Math.floor((W-8)/ARC3_KEYS), x = 4 + k*w;
    return {x:x, y:this.kbTop(), w:w-2, h:Math.min(40, Math.round(H*0.16))};
  },
  keyAt(x, y){
    const r0 = this.kbTop();
    if(y < r0) return -1;
    const w = Math.floor((W-8)/ARC3_KEYS);
    const k = Math.floor((x-4)/w);
    return (k>=0 && k<ARC3_KEYS) ? k : -1;
  },
  t_repeat(x, y){ const k = this.keyAt(x,y); if(k>=0) this.keyPress(k); for(const b of this.btns) if(hit(b,x,y)){ b.f(); return; } },
  t_listen(x, y){ for(const b of this.btns) if(hit(b,x,y)) b.f(); },
  t_win(x, y){ for(const b of this.btns) if(hit(b,x,y)) b.f(); },
  k_repeat(k){
    if(k>='1' && k<='7'){ this.keyPress(+k-1); return; }
    const m = {'q':0,'w':1,'e':2,'r':3,'t':4,'y':5,'u':6,'a':0,'s':1,'d':2,'f':3,'g':4,'h':5,'j':6,
               'й':0,'ц':1,'у':2,'к':3,'е':4,'н':5,'г':6,'ф':0,'ы':1,'в':2,'а':3,'п':4,'р':5,'о':6};
    if(m[k]!==undefined) this.keyPress(m[k]);
  },
  k_listen(k){},
  k_win(k){},
  u_listen2(){},

  /* ---------- отрисовка ---------- */
  d_all(){
    const P = CONFIG.P, t = this.sceneT;
    // комната
    ctx.drawImage(bgCache('armusic', p=>{
      ditherGradVTo(p,0,0,W,H,'#1a1030','#0a0616',14);
      // тёплая лампа над клавишами
      veilBlobTo(p, W*0.5, H*0.30, Math.max(W, H)*0.55, 'rgba(255,200,120,.20)');
      veilBlobTo(p, W*0.5, H*0.26, Math.max(W, H)*0.30, 'rgba(255,214,150,.16)');
      // стена
      for(let y=Math.round(H*0.42); y<H; y+=3) p('rgba(0,0,0,.12)', 1, 0, y, W, 1);
    }), 0, 0);
    // пылинки
    for(const m of this.motes){
      m.y -= m.v*0.016;
      if(m.y < -0.02){ m.y = 1.02; m.x = Math.random(); }
      const x = Math.round(m.x*W), y = Math.round(m.y*H);
      ctx.globalAlpha = 0.10 + 0.12*Math.sin(t*2 + m.s*9);
      ctx.fillStyle = '#ffd9a8';
      ctx.fillRect(x, y, 1, 1);
      ctx.globalAlpha = 1;
    }
    // волна от ноты
    if(this.pulse > 0 && this.pulseK >= 0){
      const k = 1 - this.pulse;
      const R = Math.min(W, H)*0.10 + k*Math.min(W,H)*0.55;
      ringPix(W/2, this.kbTop()-10, R, 'rgba(255,209,122,'+(0.35*(1-k)).toFixed(3)+')', 1);
    }
    if(this.glitch > 0){
      const k = this.glitch/0.5;
      ctx.globalAlpha = .26*k;
      ctx.fillStyle = '#ff6b6b';
      for(let i=0;i<6;i++) ctx.fillRect(0, Math.round(rnd(0,H)), W, Math.round(rnd(1,4)));
      ctx.globalAlpha = 1;
    }
  },
  d_kb(){
    const P = CONFIG.P;
    const top = this.kbTop(), h = Math.min(40, Math.round(H*0.16));
    // подпись над клавишами
    const showHint = (this.scene === 'repeat' && !this.dark);
    if(showHint && this.pi < this.seq.length){
      const k = this.seq[this.pi];
      const r = this.keyRect(k);
      ctx.globalAlpha = 0.35 + 0.2*Math.sin(this.sceneT*5);
      text('СЛЕДУЮЩАЯ: ' + (k+1), W/2, top-24, {sc:1, align:'center', color:'#ffe6a8'});
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,209,122,.20)';
      ctx.fillRect(r.x, top-12, r.w, 2);
    }
    for(let k=0;k<ARC3_KEYS;k++){
      const r = this.keyRect(k);
      const pr = this.press[k], bad = this.hit[k] < 0, good = this.hit[k] > 0;
      const lit = this.scene === 'listen' && this.si-1 === k && this.si>0;
      let col = '#e8e2d6';
      if(this.dark && this.scene === 'listen') col = '#4a4660';
      if(good) col = '#bfffcf';
      if(bad) col = '#ff8a8a';
      ctx.fillStyle = bad ? '#5a2030' : (this.dark ? '#2a2740' : '#3a3050');
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = col;
      ctx.fillRect(r.x, r.y, r.w, 2);
      ctx.fillRect(r.x, r.y+r.h-2, r.w, 2);
      // белая «клавиша» с подсветкой
      const kk = clamp(pr + (good?0.5:0), 0, 1);
      ctx.fillStyle = bad ? '#ff6b6b' : (this.dark ? '#6a6688' : '#f2ece0');
      ctx.globalAlpha = bad ? (0.5+0.3*Math.sin(this.sceneT*14)) : (this.dark ? 0.22 : 0.58) + 0.38*kk;
      ctx.fillRect(r.x+1, r.y+3, r.w-2, r.h-7);
      ctx.globalAlpha = 1;
      if(kk > 0.05){
        glowAt(r.x+r.w/2, r.y+r.h/2, 12*kk, CONFIG.P.gold, .3*kk);
        ctx.fillStyle = '#ffd97a';
        ctx.fillRect(r.x+r.w/2-1, r.y+r.h/2-1, 2, 2);
      }
      text('' + (k+1), r.x+r.w/2, r.y+r.h-11, {sc:1, align:'center', color: this.dark?'#8a86a8':'#4a4260'});
      text(ARC3_NAME[k], r.x+r.w/2, r.y+5, {sc:1, align:'center', color: this.dark?'#6a6688':'#7a7290'});
    }
  },
  d_head(){
    const P = CONFIG.P;
    const r = this.rnd, isMotif = (r >= ARC3_PHRASES.length);
    text(isMotif ? 'ЛИЧНЫЙ МОТИВ' : 'РАУНД ' + (r+1) + ' / ' + ARC3_PHRASES.length, 5, 4, {sc:1, color: this.dark ? '#a8c8ff' : P.gold});
    text(this.seq.length + ' НОТ', W-5, 4, {sc:1, align:'right', color:'#8f83ad'});
    ctx.fillStyle = 'rgba(255,209,122,.22)'; ctx.fillRect(4, 15, W-8, 1);
    if(this.msgT > 0){
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const sc = fitSc(this.msg, W-24, 1);
      const w2 = Math.min(W-8, textW(this.msg, sc)+10);
      panel(Math.round((W-w2)/2), 20, w2, 13, 'rgba(10,6,22,.92)', this.msgCol||'#ffe6a8');
      text(this.msg, W/2, 23, {sc:sc, align:'center', color:this.msgCol||'#ffe6a8'});
      ctx.globalAlpha = 1;
    }
  },
  d_prog(){
    // точки прогресса по нотам
    const n = this.seq.length, y = 40, gap = Math.min(9, Math.floor((W-20)/n));
    const x0 = Math.round(W/2 - gap*(n-1)/2);
    for(let i=0;i<n;i++){
      const on = (this.scene === 'repeat' && i < this.pi) || (this.scene === 'win');
      const x = x0 + i*gap;
      ctx.fillStyle = on ? CONFIG.P.gold : '#3a3260';
      ctx.fillRect(x, y, 3, 3);
      if(on){ glowAt(x+1, y+1, 4, CONFIG.P.gold, .3); }
    }
  },
  d_btns(){
    this.btns = [];
    // свои кнопки — над клавишами, чтобы не спорить с нижней панелью
    const y = 46, h = 14;
    const items = [
      {t:'СНАЧАЛА ФРАЗА', f:()=>{ this.startRound(this.rnd); }},
      {t:'С РАУНДА 1', f:()=>{ this.rnd = 0; this.fails = 0; this.startRound(0); }}
    ];
    const bw = Math.floor((W-8-3)/2);
    items.forEach((it,i)=>{
      const x = 4 + i*(bw+3);
      const on = ptr.x>x && ptr.x<x+bw && ptr.y>y && ptr.y<y+h;
      drawBtn(x, y, bw, h, it.t, {press:on, color: on?CONFIG.P.gold:'#a89ac8'});
      this.btns.push({x:x, y:y, w:bw, h:h, f:it.f});
    });
    this.btns = this.btns.concat(arBar(H-20, true));
  },
  d_listen(){
    this.d_all();
    this.d_head();
    this.d_prog();
    if(this.dark){
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#0a0616';
      ctx.fillRect(0, 30, W, this.kbTop()-30);
      ctx.globalAlpha = 1;
      text('ВСЛЕПУЮ', W/2, this.kbTop()-30, {sc:1, align:'center', color:'#8fa8c8'});
    }
    this.d_kb();
    this.d_btns();
  },
  d_repeat(){ this.d_listen(); },
  d_win(){
    const P = CONFIG.P, t = this.sceneT;
    // экран светлеет, музыка мягче
    const br = clamp((this.okT||0)/2.2, 0, 1);
    ctx.globalAlpha = br*(0.52 + 0.06*Math.sin(t*1.6));
    ctx.fillStyle = '#ffe9c4';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    this.d_all();
    this.d_head();
    this.d_kb();
    this.d_prog();
    const cx = W/2, cy = Math.round(this.kbTop()*0.52);
    glowAt(cx, cy, 40, '#ffd97a', .20 + .06*Math.sin(t*3));
    heart(cx-4, cy-4, 3, '#ff9ec4');
    text('МОЙ МОТИВ', cx, cy-20, {sc:1, align:'center', color:'#ffe6a8'});
    // ноты, которые сейчас звучат
    if(this.pulseK !== undefined && this.pulse > 0.05){
      ctx.globalAlpha = clamp(this.pulse, 0, 1)*0.9;
      text('♪', cx, cy-32, {sc:2, align:'center', color:'#ffd97a'});
      ctx.globalAlpha = 1;
    }
    const lines = wrap('НЕКОТОРЫЕ МЕЛОДИИ НУЖНО СНАЧАЛА УСЛЫШАТЬ, ЧТОБЫ ПОТОМ УЖЕ НЕ ЗАБЫТЬ.', W-24, 1);
    let y = cy + 14;
    for(const l of lines){ text(l, cx, y, {sc:1, align:'center', color:'#fff6e8'}); y += 11; }
    // тёплые частицы — как свет от лампы
    this.parts = this.parts || [];
    if(Math.random() < .5){
      this.parts.push({x:Math.random()*W, y:H*0.8+Math.random()*20, v:8+Math.random()*16, s:Math.random()});
    }
    for(let i=this.parts.length-1;i>=0;i--){
      const p2 = this.parts[i];
      p2.y -= p2.v*0.016; p2.x += Math.sin((t+p2.s*6)*1.4)*0.4;
      if(p2.y < -6){ this.parts.splice(i,1); continue; }
      ctx.globalAlpha = 0.30 + 0.35*Math.sin(t*3 + p2.s*9);
      if(i % 3 === 0) heart(p2.x, p2.y, 1, '#ff9ec4');
      else { ctx.fillStyle = '#ffd97a'; ctx.fillRect(p2.x, p2.y, 1, 1); }
      ctx.globalAlpha = 1;
    }
    this.d_btns();
  },

  outro:[
    D('him','Я долго искал мелодию, которая была бы тобой.'),
    D('him','Вот она. Семь нот, и все — про одно и то же.'),
    D('him','Запомни её. Я сыграю снова, когда захочу сказать что-то важное.')
  ]
};
