/* ==========================================================================
   ЧАСТЬ 16 · ФИНАЛ
   Восемь сердец подлетают, закручиваются и сливаются в одно большое.
   Оно бьётся. Потом — его слова, вопрос и ещё вопрос.
   ========================================================================== */

const FIN = {
  title: 'ПИСЬМО ДЛЯ САМОГО ДОРОГОГО ЧЕЛОВЕКА',
  text: [
    'Мария, ты дошла до самого конца. Восемь сердец, восемь шифров — и ни одной скучной минуты.',
    '',
    'Я писал это и стирал раз пять. Просто хотел сказать кое-что очень простое, а выходило либо слишком умно, либо вообще никак.',
    '',
    'Спасибо, что ты есть. Ты делаешь обычный вторник похожим на праздник. С тобой смешно, спокойно и очень тепло. Когда тебя рядом нет, я почему-то всё равно улыбаюсь.',
    '',
    'Если когда-нибудь забудешь, как сильно я тебя люблю, — открой эту игру и пройди ещё раз. Восемь сердец никуда не денутся.',
    '',
    'Люблю тебя. Просто так, без повода.'
  ],
  sign: 'TO INFINITY AND BEYOND',
  ask1: 'Ты останешься со мной?',
  ask2: 'Давай продолжим это вместе?',
  yes: 'ДА',
  ofc: 'КОНЕЧНО',
  reactYes: 'Я почему-то всё равно волновался, пока ты смотрела.',
  reactOfc: 'Хорошо. Тогда можешь не уходить.',
  lastWords: 'Навсегда. Только моя. Я обещаю — и это не подпись в конце, а начало.'
};

/* безопасный текст: убираем символы, которых нет в шрифте */
function safeLine(s){
  let o = '';
  for(const ch of s){
    if(ch === ' ') o += ' ';
    else if(ch === '—' || ch === '–') o += '-';
    else if(F.g[ch] || F.g[ch.toUpperCase()]) o += ch.toUpperCase();
    else o += '';
  }
  return o;
}

G.screens.finale = {
  enter(){
    this.t = 0;
    this.phase = 'fly';
    this.pts = [];
    for(let i=0;i<8;i++){
      const a = i/8*6.283;
      this.pts.push({
        a0: a,
        r0: Math.max(W,H)*0.55,
        x0: W/2 + Math.cos(a)*Math.max(W,H)*0.55,
        y0: H/2 + Math.sin(a)*Math.max(W,H)*0.5,
        delay: i*0.16, spin: 2 + i*0.3
      });
    }
    this.chars = 0; this.scroll = 0; this.btn = -1;
    this.pulse = 0; this.conf = 0; this.answered = 0;
    this.ring = 0;
    this.ans = null;
    if(G.sndOn === undefined){}
    Snd.ac && Snd.ac.resume && Snd.ac.resume();
  },
  update(dt){
    this.t += dt;
    if(this.pulse > 0) this.pulse -= dt;
    if(this.phase === 'fly' && this.t > 4.2){ this.phase = 'beat'; this.t = 0; Snd.fanfare(); punch(.14); flashScreen(CONFIG.P.pink, .4); }
    else if(this.phase === 'beat' && this.t > 3.4){ this.phase = 'text'; this.t = 0; }
    else if(this.phase === 'text'){
      this.chars += dt*55;
      if(this.chars > this.totalChars() && this.t > 1.2) this.btn = 0;
    }
    else if(this.phase === 'ask1' && this.t > 0.6 && this.btn < 0) this.btn = 1;
    else if(this.phase === 'ask2' && this.t > 0.6 && this.btn < 0) this.btn = 2;
    else if(this.phase === 'end'){
      this.conf += dt;
      if(Math.random() < dt*12) burstHearts(rnd(8, W-8), -6, 1, Math.random()<.5?CONFIG.P.pink:CONFIG.P.gold);
    }
  },
  totalChars(){
    return this.totalCharsCached || (this.totalCharsCached = FIN.text.join('').length + 2 + FIN.sign.length);
  },
  lines(px, pw){
    const out = [];
    for(const p of FIN.text){
      if(!p){ out.push(''); continue; }
      wrap(safeLine(p), pw, 1).forEach(l=>out.push(l));
    }
    out.push('');                       // пустая строка перед подписью
    this.signRow = out.length;
    out.push('@@SIGN@@');               // подпись рисуется отдельно
    return out;
  },
  draw(){
    const P = CONFIG.P, t = this.t, cx = W/2, cy = Math.round(H*0.34);
    // фон
    ctx.drawImage(bgCache('finbg', paint=>{ ditherGradVTo(paint,0,0,W,H,'#0a0418','#2a0f33',16); }), 0, 0);
    nebulaBg(this.phase==='fly'?this.t:0, {c1:'#5a1f4a', c2:'#2b1c5e', c3:'#1b3a6b', seed: 21});
    motes(G.t, 26, '#ff5d8f', .4);
    if(this.phase === 'fly') this.d_fly(cx, cy, t);
    else if(this.phase === 'beat') this.d_beat(cx, cy, t);
    else if(this.phase === 'text') this.d_text();
    else if(this.phase === 'ask1') this.d_ask(cx, cy, t, 1);
    else if(this.phase === 'ask2') this.d_ask(cx, cy, t, 2);
    else this.d_end(cx, cy, t);
    drawHeartFX();
    vignette(0.55); crtOverlay(G.t);
  },
  /* --- 1. восемь сердец летят и закручиваются --- */
  d_fly(cx, cy, t){
    const P = CONFIG.P;
    for(let i=0;i<this.pts.length;i++){
      const p = this.pts[i];
      const k = clamp((t - p.delay)/3.2, 0, 1);
      if(k <= 0) continue;
      const e = easeOut(k);
      const rr = lerp(p.r0, 0, e);
      const aa = p.a0 + t*p.spin*0.8*(1-e);
      const x = cx + Math.cos(aa)*rr*0.9;
      const y = cy + Math.sin(aa)*rr*0.5;
      const sc = Math.max(1, Math.round(lerp(2, 1, e)));
      const al = k < 1 ? 1 : 0;
      if(k >= 1){
        // растворяется в большое сердце
        ctx.globalAlpha = 1;
        heart(cx - 4*7, cy - 3*7, 7, P.pink);
        ctx.globalAlpha = 1;
        break;
      }
      heart(x, y, sc, i%2 ? P.pink : P.pink2);
      if(FXQ > .5) glowAt(x, y, 12, P.pink, .25);
      // хвост
      ctx.globalAlpha = .5;
      for(let q=1;q<=5;q++){
        const kk = clamp(k - q*0.02, 0, 1);
        const r2 = lerp(p.r0, 0, easeOut(kk));
        const a2 = p.a0 + t*p.spin*0.8*(1-easeOut(kk));
        heart(cx+Math.cos(a2)*r2*0.9, cy+Math.sin(a2)*r2*0.5, 1, P.pink2);
      }
      ctx.globalAlpha = 1;
    }
    textBlock('ВОСЕМЬ СЕРДЕЦ ЛЕТЯТ К ТЕБЕ...', W/2, H-26, W-24, {color:'#c9bde8'});
  },
  /* --- 2. одно большое сердце бьётся --- */
  d_beat(cx, cy, t){
    const P = CONFIG.P;
    const beat = Math.pow(Math.max(0, Math.sin(t*2.2)), 3);
    const sc = Math.max(2, Math.round(6 + beat*4));
    glowAt(cx, cy, 50 + beat*22, P.pink, .3 + beat*.3);
    heart(cx - 4*sc, cy - 3*sc, sc, P.pink);
    heart(cx - 4*sc + 2, cy - 3*sc + 2, Math.max(1,sc-2), 'rgba(255,255,255,.35)');
    if(FXQ > .5) for(let i=0;i<3;i++){
      const k = (t*0.5 + i/3) % 1;
      ctx.globalAlpha = (1-k)*.3;
      circleOutline(cx, cy, 20 + k*70, P.pink);
      ctx.globalAlpha = 1;
    }
    const lines = [
      'Это всё.',
      'Восемь маленьких сердец стали одним большим.',
      'Оно — про всё, что я чувствую к тебе.'
    ];
    let ly = Math.round(H*0.60);
    lines.forEach((l,i)=>{
      const n = wrap(l, W-24, 1).length;
      textBlock(l, cx, ly, W-24, {color: i===2?P.gold:'#c9bde8', max:2});
      ly += n*11 + 3;
    });
  },
  /* --- 3. его слова --- */
  d_text(){
    const P = CONFIG.P, cx = W/2;
    const py = 4;
    text(FIN.title, cx, py+2, {sc:fitSc(FIN.title, W-12, 1), align:'center', color:P.gold});
    const pw = W-16, px0 = 8;
    const all = this.lines(px0, pw-10);
    const lh = 11, viewH = H - py - 34;
    const maxRows = Math.max(1, Math.floor(viewH/lh));
    const total = all.length;
    this.maxScroll = Math.max(0, total - maxRows);
    this.scroll = clamp(this.scroll, 0, this.maxScroll);
    // бумага
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(px0, py+14, pw, viewH);
    ctx.fillStyle = 'rgba(180,160,130,.5)'; ctx.fillRect(px0, py+14, pw, 1);
    let n = this.chars;
    for(let i=0;i<maxRows;i++){
      const k = i + Math.floor(this.scroll);
      if(k >= total) break;
      const line = all[k];
      if(line === '@@SIGN@@'){
        const shown = FIN.sign.slice(0, Math.max(0, n));
        if(shown) text(shown, px0+5, py+20+i*lh, {sc:1, color:'#8a2b4a'});
        if(n >= FIN.sign.length) heart(px0+7 + textW(FIN.sign,1) + 3, py+18+i*lh, 1, '#c2405a');
        n -= FIN.sign.length;
      } else {
        text(line.slice(0, n), px0+5, py+20+i*lh, {sc:1, color:'#2a1b3a'});
        n -= line.length;
      }
      if(n <= 0) break;
    }
    if(this.btn === 0){
      this.rNext = {x:cx-46, y:H-18, w:92, h:14};
      glassBtn(cx-46, H-18, 92, 14, 'ЧИТАТЬ ДАЛЬШЕ', {press:ptr.x>cx-46&&ptr.x<cx+46&&ptr.y>H-18&&ptr.y<H-4, color:P.gold});
    } else this.rNext = null;
    if(this.maxScroll > 0){
      const bx = px0+pw-5;
      for(let i=0;i<maxRows;i++){ ctx.fillStyle='rgba(42,27,58,.2)'; ctx.fillRect(bx, py+16+i*lh, 2, lh-2); }
    }
  },
  /** светлая кнопка-таблетка с тёмным текстом */
  plate(x, y, w, h, face, ink, press){
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x+1, y+2, w, h);
    ctx.fillStyle = press ? ink : face; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y+h-1, w, 1);
  },
  /* --- 4-5. вопросы --- */
  d_ask(cx, cy, t, which){
    const P = CONFIG.P;
    // большое сердце сверху
    const beat = Math.pow(Math.max(0, Math.sin(t*2.4)), 3);
    const sc = Math.max(2, Math.round(3 + beat*1.5));
    glowAt(cx, cy-30, 30+beat*10, P.pink, .25+beat*.2);
    heart(cx - 4*sc, cy-30 - 3*sc, sc, P.pink);
    const q = which === 1 ? FIN.ask1 : FIN.ask2;
    const py = cy + 4;
    glassPanel(10, py, W-20, 60, {col:'#5a1f4a'});
    wrap(q, W-34, 1).slice(0,2).forEach((l,i)=>text(l, cx, py+18+i*12, {sc:1, align:'center', color:'#fff6e8'}));
    this.rYes = null; this.rOfc = null;
    if(this.btn === which){
      const gap = 8, bw = Math.max(46, Math.floor((W-28-gap)/2)), by = py+36;
      const puls = .5+.5*Math.abs(Math.sin(t*3));
      const b1 = Math.round((W - (bw*2+gap))/2), b2 = b1 + bw + gap;
      glowAt(cx, by+10, 34, P.gold, .12+.10*puls);
      this.rYes = {x:b1, y:by, w:bw, h:22};
      this.rOfc = {x:b2, y:by, w:bw, h:22};
      const p1 = ptr.x>b1&&ptr.x<b1+bw&&ptr.y>by&&ptr.y<by+22;
      const p2 = ptr.x>b2&&ptr.x<b2+bw&&ptr.y>by&&ptr.y<by+22;
      const s1 = fitSc(FIN.yes, bw-6, 2), s2 = fitSc(FIN.ofc, bw-6, 1);
      this.plate(b1, by, bw, 22, '#f2c46a', '#8a5a12', p1);
      this.plate(b2, by, bw, 22, '#ff8fb4', '#7a1038', p2);
      text(FIN.yes, b1+bw/2, by + Math.round((22-8*s1)/2), {sc:s1, align:'center', color:'#6a3a08'});
      text(FIN.ofc, b2+bw/2, by + Math.round((22-8*s2)/2), {sc:s2, align:'center', color:'#6a0c2e'});
    }
    textBlock(which === 1 ? 'Оба варианта - хорошие.' : 'Я подожду, сколько нужно.', cx, H-16, W-24, {color:'#6b4fa0'});
  },
  /* --- 6. финал --- */
  d_end(cx, cy, t){
    const P = CONFIG.P;
    const beat = Math.pow(Math.max(0, Math.sin(t*2.0)), 3);
    const sc = Math.max(2, Math.round(4 + beat*2));
    const hy = cy - 34;
    glowAt(cx, hy, 40+beat*16, P.pink, .3+beat*.25);
    heart(cx - 4*sc, hy - 3*sc, sc, P.pink);
    // подпись
    text(FIN.sign, cx, hy + 16, {sc:fitSc(FIN.sign, W-20, 1), align:'center', color:'#8a2b4a'});
    // его слова
    let y = hy + 32;
    wrap(FIN.lastWords, W-24, 1).forEach(l=>{
      text(l, cx, y, {sc:1, align:'center', color:P.gold}); y += 12;
    });
    y += 4;
    const ansLines = this.ans === 'ofc'
      ? ['Ты сказала «конечно».', 'И теперь это навсегда.']
      : ['Ты сказала «да».', 'И теперь это навсегда.'];
    ansLines.forEach(l=>{
      text(l, cx, y, {sc:1, align:'center', color:'#c9bde8'}); y += 12;
    });
    const rl = this.ans === 'ofc' ? FIN.reactOfc : FIN.reactYes;
    if(rl){
      ctx.globalAlpha = .85;
      textBlock(rl, cx, y+2, W-24, {sc:1, align:'center', color:'#8f83ad', max:3});
      ctx.globalAlpha = 1;
    }
    // она и он
    const by2 = H - 30;
    if(FXQ > .5) glowAt(cx, by2-10, 26, P.pink, .2);
    drawGirl(cx-30, by2, CONFIG.cHer, 2, 1);
    drawGuy(cx+30, by2, CONFIG.cHim, 2, 0);
    heart(cx, by2-12 + Math.round(Math.sin(t*3)), 1, P.pink);
    // кнопка «ещё раз»
    this.rAgain = {x:cx-46, y:H-18, w:92, h:14};
    glassBtn(cx-46, H-18, 92, 14, 'ПРОЙТИ ЗАНОВО', {press:ptr.x>cx-46&&ptr.x<cx+46&&ptr.y>H-18&&ptr.y<H-4, color:UI.text});
  },
  key(k){
    if(k===' '||k==='Enter'){
      if(this.btn === 0) this.nextText();
      else if(this.btn === 1 || this.btn === 2) this.say('yes');
    }
  },
  nextText(){
    Snd.blip();
    if(this.maxScroll > this.scroll){ this.scroll++; this.chars = 1e9; this.btn = 0; return; }
    this.phase = 'ask1'; this.t = 0; this.btn = -1; Snd.coin();
  },
  say(which){
    Snd.fanfare(); flashScreen(CONFIG.P.pink, .5); punch(.15);
    for(let i=0;i<20;i++) burstHearts(W/2, H*0.4, 2, CONFIG.P.pink);
    this.ans = which;
    if(this.phase === 'ask1'){ this.answered = 1; this.phase = 'ask2'; }
    else { this.answered = 2; this.phase = 'end'; this.t = 0; }
    this.t = 0; this.btn = -1;
  },
  tap(x, y){
    if(this.btn === 0 && this.rNext && x>this.rNext.x&&x<this.rNext.x+this.rNext.w&&y>this.rNext.y&&y<this.rNext.y+this.rNext.h){ this.nextText(); return; }
    if(this.btn === 1 || this.btn === 2){
      const inB = r => r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h;
      if(inB(this.rOfc)){ this.say('ofc'); return; }
      if(inB(this.rYes)){ this.say('yes'); return; }
    }
    if(this.phase === 'end' && this.rAgain && x>this.rAgain.x&&x<this.rAgain.x+this.rAgain.w&&y>this.rAgain.y&&y<this.rAgain.y+this.rAgain.h){
      G.hearts = G.hearts.map(()=>false); save(); go('desktop');
    }
  }
};
