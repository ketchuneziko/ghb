/* ==========================================================================
   ЧАСТЬ 21 · АРХИВ 01 — ШИФР, КОТОРЫЙ МЕНЯЕТСЯ
   Три слоя: СИМВОЛ (сдвиг по позиции) → ПОРЯДОК (направление чтения) →
   СДВИГ (общий сдвиг по алфавиту). Подсказки не выдают ответ.
   ========================================================================== */

/* --- слой 1: символ и его место. Открытое слово — СЕРДЦЕ --- */
const ARC1_PLAIN = 'СЕРДЦЕ';
const ARC1_HIDE  = [1, 4];            // какие позиции скрыты (0-based)

/* --- слой 2: девять слов, три ряда, у каждого ряда своё направление --- */
const ARC2_ROWS = [
  {dir: 1, words: ['Я', 'ЛЮБЛЮ', 'ТЕБЯ']},
  {dir:-1, words: ['И', 'БЕСКОНЕЧНОСТИ', 'ДО']},
  {dir: 1, words: ['БЕСКОНЕЧНОСТЬ', 'НЕ', 'ПРЕДЕЛ']}
];
const ARC2_HIDE = [1, 4];            // какие ряды показаны «неправильно» (индексы)

/* --- слой 3: общий сдвиг по алфавиту --- */
const ARC3_PHRASE = 'Я ЛЮБЛЮ ТЕБЯ ДО БЕСКОНЕЧНОСТИ И БЕСКОНЕЧНОСТЬ НЕ ПРЕДЕЛ';
const ARC3_SHIFT  = 9;

/* --- смещение по русскому алфавиту (33 буквы, с Ё) --- */
function arcShiftCh(ch, n){
  if(ch === ' ') return ' ';
  const i = aIdx(ch);
  if(i < 0) return ch;
  return ALPH[((i - n) % AL_N + AL_N) % AL_N];
}
function arcShiftStr(s, n){ return s.split('').map(c => arcShiftCh(c, n)).join(''); }

AR_HINTS.cipher = [
  'Иногда важен не сам символ, а его место.',
  'Посмотри, что происходит с соседними символами.',
  'Попробуй читать символы не в том порядке, в котором они показаны.'
];

const AR_CIPHER = {
  hint: 'НАЖМИ СИМВОЛ ИЛИ КНОПКУ «ПРОВЕРИТЬ»',
  hearts: 1,
  outro: [D('him','Ты разгадала. Значит, шифры для тебя — не шифры.'),
          D('him','Запомни это. Я пригожусь.')],
  enter(){
    scenes(this);
    this.layer = 1; this.charge = 5; this.errs = 0; this.glitch = 0;
    this.msg = ''; this.msgT = 0; this.okT = 0; this.done = false;
    this.ans = {}; this.sel1 = -1; this.cursor = 0; this.wait = 0;
    this.zones = []; this.flips = [0,0,0]; this.parts = {}; this.dial = 0;
    this.setScene('l1');
  },
  on_l1(){ this.sel1 = -1; },
  on_l2(){ this.flips = [0, 0, 0]; this.sel2 = -1; },
  on_l3(){ this.dial = 0; },
  on_win(){},

  /* ---------------- слой 1 ---------------- */
  l1cells(){
    const out = [];
    for(let i=0;i<ARC1_PLAIN.length;i++){
      out.push({
        ch: arcShiftCh(ARC1_PLAIN[i], i+1),   // сдвиг = позиция
        hide: ARC1_HIDE.indexOf(i) >= 0,
        pos: i+1
      });
    }
    return out;
  },
  l1opts(i){
    // четыре варианта: правильный + три «соседа» по алфавиту
    const right = arcShiftCh(ARC1_PLAIN[i], i+1);
    const base = aIdx(right);
    const near = [1, -1, 2].map(d => ALPH[((base + d) % AL_N + AL_N) % AL_N]);
    let list = [right].concat(near);
    // перемешиваем детерминированно
    const r = mulberry32(1000 + i*7);
    for(let k=list.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); const t=list[k]; list[k]=list[j]; list[j]=t; }
    return list;
  },
  /** клавиатура: если варианты не выбраны — взять первый */
  tryPick(){
    if(this.sel1 < 0){ this.sel1 = this.cursor; Snd.flip(); return; }
    const o = this.l1opts(this.sel1);
    this.choose1(this.sel1, o[0]);
  },
  choose1(i, ch){
    this.ans = this.ans || {};
    if(this.ans[i]) return;
    const cells = this.l1cells();
    if(ch === cells[i].ch){
      this.ans[i] = ch;
      Snd.coin();
      hitSpark(W/2, 56, CONFIG.P.gold, 'ВЕРНО');
      fx(W/2, 56, 10, [CONFIG.P.gold, '#fff6e8'], 70, .5, {g:40});
      if(Object.keys(this.ans).length >= ARC1_HIDE.length){
        this.say('СИМВОЛЫ ПРИЗНАНЫ: ' + ARC1_PLAIN, CONFIG.P.green);
        this.wait = 1.4;
      }
    } else {
      this.errs++; this.glitch = 0.5; Snd.bad();
      AR.errors[G_arIdx]++; arSaveNow();
      this.charge--;
      this.say('НЕВЕРНАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ', CONFIG.P.red);
      shake(3); flashScreen('#6b2a5a', .18);
      if(this.charge <= 0){ this.charge = 3; this.ans = {}; this.say('СЛОЙ СБРОШЕН. НАЧНИ СНОВА', CONFIG.P.red); poof(W/2, 56, '#b197fc'); }
    }
  },
  /* ---------------- слой 2 ---------------- */
  rowText(k){
    const r = ARC2_ROWS[k];
    return this.flips[k] ? r.words.slice().reverse().join(' ') : r.words.join(' ');
  },
  assembled(){ return [0,1,2].map(k=>this.rowText(k)).join(' '); },
  tapRow(k){ this.flips[k] = this.flips[k] ? 0 : 1; Snd.flip(); this.check2(); },
  check2(){
    const need = ARC2_ROWS.map(r => r.dir < 0 ? 1 : 0);
    const ok = need.every((v,i) => this.flips[i] === v);
    if(ok){
      Snd.fanfare(); flashScreen(CONFIG.P.gold, .25);
      confettiRain(24); shake(2);
      popText(W/2, Math.round(H*0.30), 'ПОРЯДОК', CONFIG.P.gold, 2);
      this.say('ЧИТАЕТСЯ. ОСТАЛСЯ СДВИГ', CONFIG.P.gold);
      this.wait = 1.4;
    } else {
      // мягкая обратная связь, прогресс не сбрасываем
      const bad = this.flips.some((v,i) => v !== need[i]);
      if(bad){ Snd.blip(); this.say('ПОКА НЕ ЧИТАЕТСЯ...', '#8f83ad'); }
    }
  },
  /* ---------------- слой 3 ---------------- */
  preview3(){ return arcShiftStr(this.assembled(), this.dial); },
  check3(){
    if(this.preview3() === ARC3_PHRASE){
      Snd.fanfare(); flashScreen(CONFIG.P.pink, .3);
      this.setScene('win');
    } else {
      this.errs++; Snd.blip();
      AR.errors[G_arIdx]++; arSaveNow();
      this.say('НЕ ЧИТАЕТСЯ. КРУТИ РЫЧАГ', '#8f83ad');
    }
  },
  say(t, col){ this.msg = t; this.msgCol = col||CONFIG.P.ink; this.msgT = 1.6; },

  /* ---------------- ввод ---------------- */
  key(k){
    if(k==='ArrowLeft'){ this.cursor = (this.cursor+99)%8; Snd.blip(); }
    if(k==='ArrowRight'){ this.cursor = (this.cursor+1)%8; Snd.blip(); }
    if(k===' '||k==='Enter'){
      if(this.scene === 'l1' && this.sel1 >= 0){ this.tryPick(); return; }
      if(this.scene === 'l2'){ this.check2(); return; }
      if(this.scene === 'l3'){ this.check3(); return; }
    }
    if(k==='1'||k==='2'||k==='3'||k==='4'){
      const n = +k;
      if(this.scene === 'l1' && this.sel1 >= 0){ const o = this.l1opts(this.sel1); this.choose1(this.sel1, o[n-1]); }
      return;
    }
    if(k==='ArrowUp' || k==='ArrowDown'){
      if(this.scene === 'l1'){ this.cursor = (this.cursor + (k==='ArrowRight'||k==='ArrowDown'?1:7))%8; Snd.blip(); }
      if(this.scene === 'l3'){ this.dial = (this.dial + (k==='ArrowRight'?1:31))%32; Snd.blip(); this.check3(); }
      if(this.scene === 'l2'){ this.tapRow(k==='ArrowDown'?1:2); }
    }
  },
  tap(x,y){
    const L = this.layout || {};
    if(this.scene === 'l1'){
      for(const b of (L.cells||[])) if(hit(b,x,y)){ this.cursor = b.i; Snd.blip(); this.sel1 = b.i; Snd.flip(); return; }
      for(const b of (L.opts||[])) if(hit(b,x,y)){ this.choose1(this.cursor, b.ch); return; }
      if(hit(L.next,x,y)){ this.setScene('l2'); Snd.coin(); }
      return;
    }
    if(this.scene === 'l2'){
      for(const b of (L.arrow||[])) if(hit(b,x,y)){ this.tapRow(b.k); return; }
      if(hit(L.next,x,y)){ this.setScene('l3'); Snd.coin(); }
      return;
    }
    if(this.scene === 'l3'){
      if(hit(L.minus,x,y)){ this.dial = (this.dial+31)%32; Snd.blip(); this.check3(); return; }
      if(hit(L.plus,x,y)){ this.dial = (this.dial+1)%32; Snd.blip(); this.check3(); return; }
      if(hit(L.next,x,y)){ this.check3(); return; }
    }
  },

  /* ---------------- логика сцен ---------------- */
  u_l1(dt){ this.tScene(dt); },
  u_l2(dt){ this.tScene(dt); },
  u_l3(dt){ this.tScene(dt); },
  u_win(dt){
    this.tScene(dt);
    this.okT += dt;
    if(Math.random() < .3) confettiRain(2);
    if(this.okT > 2.6) arWin();
  },
  tScene(dt){
    this.sceneT += dt;
    if(this.glitch > 0) this.glitch -= dt;
    if(this.msgT > 0) this.msgT -= dt;
    if(this.wait > 0){ this.wait -= dt; if(this.wait <= 0){
      if(this.scene === 'l1') this.setScene('l2');
      else if(this.scene === 'l2') this.setScene('l3');
    } }
    this.zones = arBar(H-20, true);
  },

  /* ---------------- отрисовка ---------------- */
  d_all(headL, headR){
    const P = CONFIG.P, t = this.sceneT, L = {};
    // фон терминала
    ctx.drawImage(bgCache('arcterm', p=>{
      ditherGradVTo(p,0,0,W,H,'#071a12','#04100b',10);
    }), 0, 0);
    // бегущие помехи
    const rows = 26;
    for(let i=0;i<rows;i++){
      if((i*7 + Math.floor(t*3)) % 11) continue;
      const y = (i*13) % H;
      ctx.globalAlpha = 0.05 + 0.05*Math.random();
      ctx.fillStyle = '#8ce99a';
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;
    // шапка
    const HL = headL || 'UNKNOWN MESSAGE';
    const HR = headR || ('СЛОЙ ' + (this.scene==='l1'?1:this.scene==='l2'?2:this.scene==='l3'?3:3) + '/3');
    text(HL, 6, 4, {sc:1, color: this.scene==='win' ? P.gold : '#8ce99a'});
    text(HR, W-6, 4, {sc:1, align:'right', color:'#4f7a5e'});
    ctx.fillStyle = 'rgba(140,233,154,.25)'; ctx.fillRect(4, 15, W-8, 1);
    // рамка курсора
    ctx.globalAlpha = 0.6 + 0.4*Math.abs(Math.sin(t*4));
    ctx.fillStyle = '#8ce99a';
    ctx.fillRect(4, H-22, W-8, 1);
    ctx.globalAlpha = 1;
    this.layout = L;
  },
  d_l1(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_all();
    const L = this.layout;
    this.ans = this.ans || {};
    const cells = this.l1cells();
    text('СИМВОЛ И ЕГО МЕСТО', W/2, 20, {sc:1, align:'center', color:P.gold});
    // полоса символов
    const cw = Math.min(26, Math.floor((W-16)/ARC1_PLAIN.length));
    const x0 = Math.round(W/2 - (ARC1_PLAIN.length*cw)/2), y0 = 34;
    for(let i=0;i<cells.length;i++){
      const c = cells[i], X = x0 + i*cw;
      const sel = this.sel1 === i;
      const done = !!this.ans[i];
      ctx.fillStyle = sel ? 'rgba(255,209,102,.20)' : 'rgba(0,0,0,.35)';
      ctx.fillRect(X, y0, cw-2, 20);
      ctx.fillStyle = done ? '#8ce99a' : (sel ? P.gold : '#4f9a70');
      ctx.fillRect(X, y0, cw-2, 2); ctx.fillRect(X, y0+18, cw-2, 2);
      const ch = done ? c.ch : (sel ? '?' : c.ch);
      text(ch, X + (cw-2)/2, y0+4, {sc:1, align:'center', color: done?'#c8ffd8':(sel?'#fff6e8':'#8ce99a')});
      text('П' + c.pos, X + (cw-2)/2, y0+24, {sc:1, align:'center', color:'#3f7a58'});
      L.cells = L.cells || []; L.cells.push({x:X, y:y0, w:cw-2, h:20, i:i});
    }
    // варианты для выбранной ячейки
    if(this.sel1 >= 0){
      const opts = this.l1opts(this.sel1);
      const ow = Math.min(34, Math.floor((W-16)/opts.length));
      const oy = y0 + 42, ox = Math.round(W/2 - (opts.length*ow)/2);
      for(let i=0;i<opts.length;i++){
        const X = ox + i*ow;
        const on = ptr.x>X && ptr.x<X+ow-2 && ptr.y>oy && ptr.y<oy+18;
        glassBtn(X, oy, ow-2, 18, opts[i], {press:on, color: on?P.gold:'#8ce99a'});
        (L.opts = L.opts || []).push({x:X, y:oy, w:ow-2, h:18, ch:opts[i]});
      }
    } else {
      text('ВЫБЕРИ СИМВОЛ С «?»', W/2, y0+44, {sc:1, align:'center', color:'#4f9a70'});
    }
    // заряд терпения
    const bx = 6, by = H-56;
    text('ЗАРЯД', bx, by, {sc:1, color:'#4f9a70'});
    for(let i=0;i<5;i++){
      ctx.fillStyle = i < this.charge ? '#8ce99a' : '#1d3a2a';
      ctx.fillRect(bx+38+i*7, by+2, 5, 6);
    }
    if(Object.keys(this.ans).length >= ARC1_HIDE.length){
      const nw = {x:W/2-32, y:H-40, w:64, h:18};
      const on = hit(nw, ptr.x, ptr.y);
      glassBtn(nw.x, nw.y, nw.w, nw.h, 'ДАЛЬШЕ', {press:on, color:on?P.gold:'#8ce99a'});
      L.next = nw;
    }
    this.d_tail();
  },
  d_l2(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_all();
    const L = this.layout;
    text('ПОРЯДОК ЧТЕНИЯ', W/2, 20, {sc:1, align:'center', color:P.gold});
    L.arrow = [];
    const rowH = 20, x0 = 6, ww = W-12;
    const top = 46;
    for(let k=0;k<3;k++){
      const y = top + k*(rowH+4);
      // рамка ряда + стрелка направления
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0, y, ww, rowH);
      ctx.fillStyle = this.flips[k] ? '#2f6b4a' : '#1d3a2a';
      ctx.fillRect(x0, y, 14, rowH);
      const ax = x0+4, ay = y+rowH/2-5;
      ctx.fillStyle = '#8ce99a';
      if(this.flips[k]){ for(let i=0;i<5;i++) ctx.fillRect(ax+8-i, ay+i, 1, 9-2*i); }
      else { for(let i=0;i<5;i++) ctx.fillRect(ax+i, ay+i, 1, 9-2*i); }
      // слова
      const words = ARC2_ROWS[k].words;
      const vis = this.flips[k] ? words.slice().reverse() : words;
      let tx = x0+18, avail = ww-20;
      for(const w of vis){
        const wpx = textW(w,1);
        text(w, tx, y+3, {sc:1, color:'#c8ffd8'});
        tx += wpx + 5;
      }
      L.arrow.push({x:x0, y:y, w:ww, h:rowH, k:k});
    }
    // предпросмотр
    const py = top + 3*(rowH+4) + 10;
    text('СОБРАНО:', W/2, py, {sc:1, align:'center', color:'#4f9a70'});
    const as = this.assembled();
    const lines = wrap(as, W-16, 1).slice(0,3);
    let yy = py+14;
    for(const l of lines){ text(l, W/2, yy, {sc:1, align:'center', color:'#fff6e8'}); yy += 11; }
    // ответ — все ряды в нужном направлении
    const need = ARC2_ROWS.map(r => r.dir < 0);
    const ok = need.every((v,i)=> this.flips[i] === (v?1:0));
    if(ok){
      const nw = {x:W/2-32, y:H-40, w:64, h:18};
      const on = hit(nw, ptr.x, ptr.y);
      glassBtn(nw.x, nw.y, nw.w, nw.h, 'ДАЛЬШЕ', {press:on, color:on?P.gold:'#8ce99a'});
      L.next = nw;
    } else {
      text('ТЫКНИ НА СТРЕЛКУ РЯДА', W/2, H-56, {sc:1, align:'center', color:'#3f7a58'});
    }
    this.d_tail();
  },
  /* --- циферблат. Портрет: дуга. Ландшафт: горизонтальная лента. --- */
  dialFace(x0, y0, w, h, cur, curve){
    if(curve){
      const cx = Math.round(x0+w/2), cy = y0, r = Math.min(Math.round(w*0.40), h);
      const ang = i => Math.PI + (i/31)*Math.PI;
      ctx.fillStyle = 'rgba(0,0,0,.30)'; ctx.fillRect(cx-r-4, cy-3, (r+4)*2, 6);
      for(let i=0;i<32;i++){
        const a = ang(i), isC = (i === cur);
        const px = Math.round(cx+Math.cos(a)*r), py = Math.round(cy+Math.sin(a)*r);
        if(isC){
          ctx.fillStyle = '#ffd97a'; ctx.fillRect(px-2, py-2, 5, 5);
          ctx.fillStyle = '#fff6e8'; ctx.fillRect(px-1, py-1, 3, 3);
        } else {
          ctx.fillStyle = (i%8===0) ? '#4f9a70' : '#2f6b4a';
          ctx.fillRect(px, py, 1, i%8===0 ? 4 : 2);
        }
      }
      for(let k=0;k<6;k++){
        const a = ang(cur), rr = r+3+k;
        ctx.fillStyle = k>3 ? '#ffd97a' : '#ffb84d';
        ctx.fillRect(Math.round(cx+Math.cos(a)*rr), Math.round(cy+Math.sin(a)*rr), 1, 1);
      }
      for(const n of [0,8,16,24]){
        const a = ang(n);
        text(String(n), Math.round(cx+Math.cos(a)*(r-11)), Math.round(cy+Math.sin(a)*(r-11))-3,
             {sc:1, align:'center', color:'#3f7a58'});
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,.30)'; ctx.fillRect(x0, y0-3, w, 6);
      for(let i=0;i<32;i++){
        const px = Math.round(x0 + i/31*(w-1)), isC = (i === cur);
        if(isC){
          ctx.fillStyle = '#ffd97a'; ctx.fillRect(px-2, y0-4, 5, 5);
          ctx.fillStyle = '#fff6e8'; ctx.fillRect(px-1, y0-3, 3, 3);
        } else {
          ctx.fillStyle = (i%8===0) ? '#4f9a70' : '#2f6b4a';
          ctx.fillRect(px, y0-2, 1, i%8===0 ? 5 : 3);
        }
      }
      const px = Math.round(x0 + cur/31*(w-1));
      for(let k=0;k<5;k++) ctx.fillRect(px-1, y0+3+k, 3, 1);
    }
  },
  d_l3(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_all();
    const L = this.layout;
    const land = H < 320;
    text('ОБЩИЙ СДВИГ', W/2, 20, {sc:1, align:'center', color:P.gold});
    const cx = Math.round(W/2);
    let by;
    if(land){
      this.dialFace(14, 42, W-28, 0, this.dial, false);
      text('СДВИГ: ' + this.dial, cx, 60, {sc:1, align:'center', color:'#fff6e8'});
      by = 72;
    } else {
      this.dialFace(6, 96, W-12, 54, this.dial, true);
      text('СДВИГ: ' + this.dial, cx, 84, {sc:1, align:'center', color:'#fff6e8'});
      by = 108;
    }
    // --- кнопки сдвига
    const mw = {x:6, y:by, w:22, h:18};
    const pw2 = {x:W-28, y:by, w:22, h:18};
    const on1 = hit(mw, ptr.x, ptr.y), on2 = hit(pw2, ptr.x, ptr.y);
    glassBtn(mw.x, mw.y, mw.w, mw.h, '-', {press:on1, color:on1?P.gold:'#8ce99a'});
    glassBtn(pw2.x, pw2.y, pw2.w, pw2.h, '+', {press:on2, color:on2?P.gold:'#8ce99a'});
    text('СДВИНУТЬ ВСЁ ЦЕЛИКОМ', cx, by+6, {sc:1, align:'center', color:'#3f7a58'});
    L.minus = mw; L.plus = pw2;
    // --- расшифровка
    const pv = this.preview3();
    const py = by + (land ? 30 : 32);
    text('РАСШИФРОВКА:', W/2, py, {sc:1, align:'center', color:'#4f9a70'});
    const lines = wrap(pv, W-16, 1).slice(0, land ? 3 : 4);
    let yy = py+13;
    for(const l of lines){ text(l, W/2, yy, {sc:1, align:'center', color:'#fff6e8'}); yy += 11; }
    // --- лента алфавита
    if(!land){
      const ay = yy + 6;
      text('ЛЕНТА', W/2, ay, {sc:1, align:'center', color:'#3f7a58'});
      const cw = 11, n = 9, x0 = Math.round(W/2 - cw*n/2);
      for(let i=0;i<n;i++){
        const ai = ((this.dial - 4 + i) % 32 + 32) % 32;
        const cur = (ai === this.dial);
        const x = x0 + i*cw;
        if(cur){
          ctx.fillStyle = 'rgba(255,200,90,.20)'; ctx.fillRect(x, ay+10, cw-1, 12);
          ctx.strokeStyle = '#ffd97a'; ctx.strokeRect(x+.5, ay+10.5, cw-2, 11);
        }
        text(ALPH[ai], x + (cw-1)/2, ay+12, {sc:1, align:'center', color: cur ? '#ffd97a' : '#4f9a70'});
      }
    }
    // --- правило
    text('СИМВОЛ ПЕРЕХОДИТ В ДРУГОЙ ПО АЛФАВИТУ', W/2, H-52,
         {sc:1, align:'center', color:'#3f7a58'});
    // --- проверить
    const nw = {x:Math.round(W/2-40), y:H-40, w:80, h:18};
    const on3 = hit(nw, ptr.x, ptr.y);
    glassBtn(nw.x, nw.y, nw.w, nw.h, 'ПРОВЕРИТЬ', {press:on3, color:on3?P.gold:'#8ce99a'});
    L.ok = nw;
    this.d_tail();
  },
  d_win(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_all('СООБЩЕНИЕ ПРОЧИТАНО', 'ГОТОВО');
    const cx = W/2, cy = Math.round(H*0.30);
    glowAt(cx, cy, 42, P.pink, .22);
    heart(cx-8, cy-8, 4, P.pink);
    const y0 = cy+26;
    // послание собирается по словам
    const words = ARC3_PHRASE.split(' ');
    const k = clamp(t*5, 0, words.length);
    let cx2 = 0, ly = y0;
    const STEP = 13;
    const lines = [];
    let cur = '';
    for(let i=0;i<words.length;i++){
      const piece = (i ? ' ' : '') + words[i];
      if(cur.length && textW(cur + piece, 1) > W-20){ lines.push(cur); cur = words[i]; }
      else cur += piece;
    }
    if(cur) lines.push(cur);
    let wI = 0;
    for(const ln of lines){
      const ws = ln.split(' '), wid = ws.map(w => textW(w,1));
      const total = wid.reduce((a,b) => a+b+5, -5);
      let xx = Math.round(cx - total/2);
      for(let i=0;i<ws.length;i++){
        const on = k > wI;
        ctx.globalAlpha = on ? 1 : 0.14;
        text(ws[i], xx, ly, {sc:1, color: on ? P.gold : '#2f6b4a'});
        if(on && ((this.sceneT*6 + wI) % 9) < .12) fx(xx + wid[i]/2, ly+3, 3, P.pink, 40, .6, {g:-20});
        ctx.globalAlpha = 1;
        xx += wid[i] + 5; wI++;
      }
      ly += STEP;
    }
    const done = k >= words.length;
    if(done){
      text('СОБРАНО И ПРОЧИТАНО', cx, ly + 12, {sc:1, align:'center', color:P.green});
      text('ТЫ СПРАВИЛАСЬ', cx, ly + 26, {sc:1, align:'center', color:'#8ce99a'});
    }
    this.d_tail();
  },
  /* общий низ: подсказка, заряд, глитч */
  d_tail(){
    const P = CONFIG.P, t = this.sceneT;
    if(this.glitch > 0){
      const k = this.glitch/0.5;
      ctx.globalAlpha = 0.25*k;
      ctx.fillStyle = '#ff6b6b';
      for(let i=0;i<5;i++) ctx.fillRect(0, Math.floor(rnd(0,H)), W, Math.floor(rnd(1,4)));
      ctx.globalAlpha = 1;
    }
    if(this.msgT > 0){
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const yy = H - 56;
      const w2 = textW(this.msg,1)+10;
      panel(4, yy-3, Math.min(W-8, w2), 15, 'rgba(0,0,0,.8)', this.msgCol||'#8ce99a');
      text(this.msg, Math.min(W-4, w2/2+4), yy, {sc:1, color:this.msgCol||'#8ce99a'});
      ctx.globalAlpha = 1;
    }
    // мерцание курсора
    if(Math.floor(t*3)%2===0){ ctx.fillStyle = '#8ce99a'; ctx.fillRect(W-10, H-18, 6, 8); }
  }
};
function hit(r,x,y){ return r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }

ARCH_LEVELS.cipher = AR_CIPHER;
