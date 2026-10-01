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
  hint: 'ИСПОЛЬЗУЙ КНОПКИ ВНИЗУ',
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
  on_l1(){
    const next = ARC1_HIDE.find(i => !this.ans[i]);
    this.sel1 = next == null ? -1 : next;
    this.cursor = this.sel1 < 0 ? 0 : this.sel1;
  },
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
  choose1(i, ch){
    this.ans = this.ans || {};
    if(this.ans[i]) return;
    const cells = this.l1cells();
    if(!cells[i] || !cells[i].hide){
      this.say('ВЫБЕРИ ПОЗИЦИЮ ПОД ЗНАКОМ ?', '#8ce99a');
      return;
    }
    if(ch === cells[i].ch){
      this.ans[i] = ch;
      Snd.coin();
      hitSpark(W/2, 56, CONFIG.P.gold, 'ВЕРНО');
      fx(W/2, 56, 10, [CONFIG.P.gold, '#fff6e8'], 70, .5, {g:40});
      const next = ARC1_HIDE.find(pos => !this.ans[pos]);
      if(next != null){ this.sel1 = next; this.cursor = next; }
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
  bottomBtn(L, id, label, x, y, w, h, action, opt){
    opt = opt || {};
    L.bottom = L.bottom || [];
    const box = {x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h)};
    const hover = hit(box, ptr.x, ptr.y);
    glassBtn(box.x, box.y, box.w, box.h, label, {
      press:hover || !!opt.selected,
      color:opt.color || (opt.selected ? CONFIG.P.gold : '#8ce99a'),
      dis:!!opt.dis
    });
    L.bottom.push({ ...box, id, action, dis:!!opt.dis });
  },

  /* ---------------- ввод ---------------- */
  tapBottom(x,y){
    const L = this.layout || {};
    for(const b of (L.bottom || [])){
      if(hit(b,x,y)){
        if(!b.dis && b.action) b.action();
        return true;
      }
    }
    return false;
  },
  t_l1(x,y){
    const L = this.layout || {};
    if(this.tapBottom(x,y)) return;
    for(const b of (L.cells||[])) if(hit(b,x,y)){
      const c = this.l1cells()[b.i];
      if(!c || !c.hide){ this.say('ВЫБЕРИ ПОЗИЦИЮ ПОД ЗНАКОМ ?', '#8ce99a'); return; }
      this.cursor = b.i; Snd.blip(); this.sel1 = b.i; Snd.flip(); return;
    }
  },
  t_l2(x,y){
    const L = this.layout || {};
    if(this.tapBottom(x,y)) return;
    for(const b of (L.arrow||[])) if(hit(b,x,y)){ this.tapRow(b.k); return; }
  },
  t_l3(x,y){ this.tapBottom(x,y); },
  k_l1(k){
    if(k==='ArrowLeft' || k==='ArrowRight'){
      const targets = ARC1_HIDE.filter(i=>!this.ans[i]);
      if(targets.length){
        const at = Math.max(0,targets.indexOf(this.sel1));
        this.sel1 = targets[(at + (k==='ArrowRight'?1:targets.length-1))%targets.length];
        this.cursor = this.sel1; Snd.blip();
      }
      return;
    }
    if(k==='1'||k==='2'||k==='3'||k==='4'){
      if(this.sel1>=0){ const opts=this.l1opts(this.sel1); this.choose1(this.sel1,opts[+k-1]); }
    }
  },
  k_l2(k){
    if(k==='ArrowUp') this.tapRow(0);
    else if(k==='ArrowDown') this.tapRow(1);
    else if((k===' '||k==='Enter') && this.flips[1]===1) this.setScene('l3');
  },
  k_l3(k){
    if(k==='ArrowLeft'||k==='ArrowDown'){ this.dial=(this.dial+31)%32; Snd.blip(); }
    else if(k==='ArrowRight'||k==='ArrowUp'){ this.dial=(this.dial+1)%32; Snd.blip(); }
    else if(k==='0'){ this.dial=0; Snd.blip(); }
    else if(k===' '||k==='Enter') this.check3();
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
    L.bottom = [];
    this.ans = this.ans || {};
    const cells = this.l1cells();
    text('СИМВОЛ И ЕГО МЕСТО', W/2, 20, {sc:1, align:'center', color:P.gold});
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
      const ch = done ? c.ch : (c.hide ? '?' : c.ch);
      text(ch, X + (cw-2)/2, y0+4, {sc:1, align:'center', color: done?'#c8ffd8':(sel?'#fff6e8':'#8ce99a')});
      text('П' + c.pos, X + (cw-2)/2, y0+24, {sc:1, align:'center', color:'#3f7a58'});
      L.cells = L.cells || []; L.cells.push({x:X, y:y0, w:cw-2, h:20, i:i});
    }
    text(this.sel1 >= 0 ? 'ВЫБИРАЙ БУКВУ КНОПКАМИ ВНИЗУ' : 'ВЫБЕРИ ПОЗИЦИЮ П2 ИЛИ П5 ВНИЗУ',
         W/2, y0+44, {sc:fitSc(this.sel1 >= 0 ? 'ВЫБИРАЙ БУКВУ КНОПКАМИ ВНИЗУ' : 'ВЫБЕРИ ПОЗИЦИЮ П2 ИЛИ П5 ВНИЗУ',W-12,1), align:'center', color:'#4f9a70'});
    const bx = 6, by = H-104;
    text('ЗАРЯД', bx, by, {sc:1, color:'#4f9a70'});
    for(let i=0;i<5;i++){
      ctx.fillStyle = i < this.charge ? '#8ce99a' : '#1d3a2a';
      ctx.fillRect(bx+38+i*7, by+2, 5, 6);
    }
    const targetY = H-64, rowY = H-42, bh = 16, margin = 8, targetGap = 8;
    const targetW = Math.floor((W-margin*2-targetGap)/2);
    for(let k=0;k<ARC1_HIDE.length;k++){
      const i = ARC1_HIDE[k], solved = !!this.ans[i], label = 'П' + (i+1) + (solved?' OK':'');
      this.bottomBtn(L,'pos'+(i+1),label,margin+k*(targetW+targetGap),targetY,targetW,bh,
        ()=>{ this.sel1=i; this.cursor=i; Snd.flip(); },
        {selected:this.sel1===i && !solved, dis:solved, color:solved?P.green:undefined});
    }
    if(Object.keys(this.ans).length >= ARC1_HIDE.length){
      const nw = Math.min(96,W-24), nx = Math.round((W-nw)/2);
      this.bottomBtn(L,'next','ДАЛЕЕ',nx,rowY,nw,bh,()=>{ this.setScene('l2'); Snd.coin(); },{color:P.gold});
    } else if(this.sel1 >= 0){
      const at = this.sel1, opts = this.l1opts(at), gap = 3, cm = 6;
      const cw2 = Math.floor((W-cm*2-gap*3)/4), sx = Math.round((W-(cw2*4+gap*3))/2);
      for(let k=0;k<opts.length;k++){
        const ch = opts[k], x = sx+k*(cw2+gap);
        this.bottomBtn(L,'choice'+k,ch,x,rowY,cw2,bh,()=>this.choose1(at,ch));
        L.bottom[L.bottom.length-1].ch = ch;
      }
    }
    this.d_tail();
  },
  d_l2(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_all();
    const L = this.layout;
    L.bottom = [];
    text('ПОРЯДОК ЧТЕНИЯ', W/2, 20, {sc:1, align:'center', color:P.gold});
    L.arrow = [];
    const rowH = 20, x0 = 6, ww = W-12;
    const top = 46;
    for(let k=0;k<3;k++){
      const y = top + k*(rowH+4);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0, y, ww, rowH);
      ctx.fillStyle = this.flips[k] ? '#2f6b4a' : '#1d3a2a';
      ctx.fillRect(x0, y, 14, rowH);
      const ax = x0+4, ay = y+rowH/2-5;
      ctx.fillStyle = '#8ce99a';
      if(this.flips[k]){ for(let i=0;i<5;i++) ctx.fillRect(ax+8-i, ay+i, 1, 9-2*i); }
      else { for(let i=0;i<5;i++) ctx.fillRect(ax+i, ay+i, 1, 9-2*i); }
      const words = ARC2_ROWS[k].words;
      const vis = this.flips[k] ? words.slice().reverse() : words;
      let tx = x0+18;
      for(const w of vis){
        const wpx = textW(w,1);
        text(w, tx, y+3, {sc:1, color:'#c8ffd8'});
        tx += wpx + 5;
      }
      L.arrow.push({x:x0, y:y, w:ww, h:rowH, k:k});
    }
    const py = top + 3*(rowH+4) + 10;
    text('СОБРАНО:', W/2, py, {sc:1, align:'center', color:'#4f9a70'});
    const as = this.assembled();
    const lines = wrap(as, W-16, 1).slice(0,3);
    let yy = py+14;
    for(const l of lines){ text(l, W/2, yy, {sc:1, align:'center', color:'#fff6e8'}); yy += 11; }
    const need = ARC2_ROWS.map(r => r.dir < 0);
    const ok = need.every((v,i)=> this.flips[i] === (v?1:0));
    text(ok ? 'ПОРЯДОК ВЕРНЫЙ — НАЖМИ ДАЛЕЕ' : 'НАСТРОЙ НАПРАВЛЕНИЯ КНОПКАМИ ВНИЗУ',
         W/2, H-56, {sc:fitSc(ok ? 'ПОРЯДОК ВЕРНЫЙ — НАЖМИ ДАЛЕЕ' : 'НАСТРОЙ НАПРАВЛЕНИЯ КНОПКАМИ ВНИЗУ',W-12,1), align:'center', color:ok?P.gold:'#3f7a58'});
    const rowY = H-42, bh = 16, gap = 3, margin = 6, count = ok ? 4 : 3;
    const bw = Math.floor((W-margin*2-gap*(count-1))/count), sx = Math.round((W-(bw*count+gap*(count-1)))/2);
    for(let k=0;k<3;k++){
      const label = (k+1) + (this.flips[k] ? '<' : '>');
      this.bottomBtn(L,'row'+(k+1),label,sx+k*(bw+gap),rowY,bw,bh,()=>this.tapRow(k),
        {selected:this.flips[k] === (need[k]?1:0), color:this.flips[k] === (need[k]?1:0)?P.green:undefined});
    }
    if(ok) this.bottomBtn(L,'next','ДАЛЕЕ',sx+3*(bw+gap),rowY,bw,bh,()=>{ this.setScene('l3'); Snd.coin(); },{color:P.gold});
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
    L.bottom = [];
    const land = H < 320;
    text('ОБЩИЙ СДВИГ', W/2, 20, {sc:1, align:'center', color:P.gold});
    const cx = Math.round(W/2);
    let previewY;
    if(land){
      this.dialFace(14, 42, W-28, 0, this.dial, false);
      text('СДВИГ: ' + this.dial, cx, 60, {sc:1, align:'center', color:'#fff6e8'});
      previewY = 102;
    } else {
      this.dialFace(6, 96, W-12, 54, this.dial, true);
      text('СДВИГ: ' + this.dial, cx, 84, {sc:1, align:'center', color:'#fff6e8'});
      previewY = 140;
    }
    text('РАСШИФРОВКА:', W/2, previewY, {sc:1, align:'center', color:'#4f9a70'});
    const pv = this.preview3();
    const lines = wrap(pv, W-16, 1).slice(0, land ? 3 : 4);
    let yy = previewY+13;
    for(const l of lines){ text(l, W/2, yy, {sc:1, align:'center', color:'#fff6e8'}); yy += 11; }
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
    text('СИМВОЛ ПЕРЕХОДИТ В ДРУГОЙ ПО АЛФАВИТУ', W/2, H-52,
         {sc:fitSc('СИМВОЛ ПЕРЕХОДИТ В ДРУГОЙ ПО АЛФАВИТУ',W-12,1), align:'center', color:'#3f7a58'});
    const rowY = H-42, bh = 16, gap = 3, margin = 6, count = 4;
    const bw = Math.floor((W-margin*2-gap*(count-1))/count), sx = Math.round((W-(bw*count+gap*(count-1)))/2);
    const minus = {x:sx, y:rowY, w:bw, h:bh};
    const plus = {x:sx+(bw+gap), y:rowY, w:bw, h:bh};
    const zero = {x:sx+2*(bw+gap), y:rowY, w:bw, h:bh};
    const ok = {x:sx+3*(bw+gap), y:rowY, w:bw, h:bh};
    this.bottomBtn(L,'minus','-',minus.x,minus.y,minus.w,minus.h,()=>{ this.dial=(this.dial+31)%32; Snd.blip(); });
    this.bottomBtn(L,'plus','+',plus.x,plus.y,plus.w,plus.h,()=>{ this.dial=(this.dial+1)%32; Snd.blip(); });
    this.bottomBtn(L,'zero','0',zero.x,zero.y,zero.w,zero.h,()=>{ this.dial=0; Snd.blip(); });
    this.bottomBtn(L,'check','ПРОВ.',ok.x,ok.y,ok.w,ok.h,()=>this.check3(),{color:P.gold});
    L.minus=minus; L.plus=plus; L.zero=zero; L.ok=ok;
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
      const yy = H - 88;
      const w2 = textW(this.msg,1)+10;
      panel(4, yy-3, Math.min(W-8, w2), 15, 'rgba(0,0,0,.8)', this.msgCol||'#8ce99a');
      text(this.msg, Math.min(W-4, w2/2+4), yy, {sc:1, color:this.msgCol||'#8ce99a'});
      ctx.globalAlpha = 1;
    }
    // мерцание курсора
    if(Math.floor(t*3)%2===0){ ctx.fillStyle = '#8ce99a'; ctx.fillRect(W-10, H-18, 6, 8); }
    if(G.screens.arlevel.showArBar === false) this.zones = [];
    else this.zones = arBar(H-20, true);
  }
};
function hit(r,x,y){ return r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }

ARCH_LEVELS.cipher = AR_CIPHER;
