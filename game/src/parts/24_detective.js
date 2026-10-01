/* ==========================================================================
   ЧАСТЬ 24 · АРХИВ 04 — ДЕТЕКТИВ
   Ночь письма. Пять улик, окно ДОСЬЕ, лента времени, три показания —
   одно из них ложное. Потом три вопроса: что первым, что ложно и какой
   уликой это доказано. Ошибка не сбрасывает осмотр: улики остаются открыты.
   ========================================================================== */

const ARC4_CLUES = [
  {id:'lamp', no:1, name:'ЛАМПА', tag:'ОПРОВЕРГАЕТ А',
   txt:'Лампа не горела с 23:00 до 00:20. Спичка в пепельнице обгорела на три четверти — её зажигали в 00:20.'},
  {id:'cups', no:2, name:'КРУЖКИ', tag:'ПОДТВЕРЖДАЕТ Б',
   txt:'Кружек две. На одной след помады. Чай остыл, значит налит не позже 22:20.'},
  {id:'door', no:3, name:'СЛЕДЫ', tag:'ПОДТВЕРЖДАЕТ Б',
   txt:'На пороге два следа: в 22:50 — её ботинки, в 00:30 — мои.'},
  {id:'env',  no:4, name:'КОНВЕРТ', tag:'ПОДТВЕРЖДАЕТ В',
   txt:'Воск на клапане мягкий, не застыл. Конверт запечатан после полуночи.'},
  {id:'clk',  no:5, name:'БУДИЛЬНИК', tag:'НЕ ВАЖНО',
   txt:'Будильник заведён на 07:00. Ночью не звонил, значит ночь была спокойной.'}
];
const ARC4_TIME = [
  {t:'19:00', f:'Пришёл домой. Пальто мокрое от снега.'},
  {t:'21:00', f:'Включил музыку. Соседи слышали до 21:40.'},
  {t:'22:15', f:'Се писать. Завёл будильник на 07:00.'},
  {t:'23:40', f:'Темно. Лампа не горит уже сорок минут.'},
  {t:'00:10', f:'Включил свет. Сложил письмо в конверт.'}
];
const ARC4_SAY = [
  {id:'А', t:'Я писал письмо при свете до 23:40.'},
  {id:'Б', t:'В 22:15 в комнате была Мария.'},
  {id:'В', t:'Письмо я запечатал после полуночи.'}
];
const ARC4_FAKE = 'А';      // кириллическая А — как в показаниях                       // ложное показание
const ARC4_QUIZ = [
  {q:'ЧТО БЫЛО ПЕРВЫМ?', a:0, o:['ОНА УШЛА В 22:50','ЛАМПА ПОГАСЛА','КОНВЕРТ ЗАПЕЧАТАЛИ']},
  {q:'КАКОЕ ПОКАЗАНИЕ ЛОЖНОЕ?', a:0, o:['А','Б','В']},
  {q:'КАКАЯ УЛИКА ЭТО ДОКАЗЫВАЕТ?', a:0, o:['ЛАМПА','КРУЖКИ','КОНВЕРТ']}
];

AR_HINTS.case_ = [
  'Сначала осмотри комнату. Без улик ты просто угадываешь.',
  'Одно показание противоречит лампе. Остальные подтверждаются другими уликами.',
  'Смотри на вещи, которые не умеют врать: свет, воск и следы.'
];

ARCH_LEVELS.case_ = {
  enter(){
    scenes(this);
    this.seen = {};            // открытые улики
    this.errs = 0; this.glitch = 0; this.fails = 0;
    this.pick = -1; this.qa = 0; this.badQ = {};
    this.qIdx = -1;            // активная лента времени
    this.qT = 0; this.msg = 'ОСМОТРИ КОМНАТУ'; this.msgT = 3.0; this.msgCol = '#ffe6a8';
    this.win = null; this.dragW = null;
    this.btns = []; this.hot = []; this.tl = [];
    this.setScene('room');
  },
  tScene(dt){ this.sceneT += dt; },
  openCount(){ let n=0; for(const k in this.seen) if(this.seen[k]) n++; return n; },
  allSeen(){ return this.openCount() >= ARC4_CLUES.length; },

  /* ---------- окно ДОСЬЕ ---------- */
  openDossier(i){
    const c = ARC4_CLUES[i];
    this.pick = i;
    this.seen[c.id] = true;
    this.dossierT = 0;
    const w = Math.min(W-16, 200), h = Math.min(H-40, 120);
    this.win = {x:Math.round(W/2-w/2), y:Math.round(H*0.24), w:w, h:h, t:0,
                title:'ДОСЬЕ · ' + c.name, anim:1, closing:false, kind:'dossier'};
    Snd.type();
  },
  closeDossier(){ this.win = null; Snd.blip(); },
  dragWin(x, y){
    if(!this.win) return false;
    const w = this.win;
    if(Win.closeHit(w, x, y)){ this.closeDossier(); return true; }
    if(Win.titleHit(w, x, y)){ this.dragW = {ox:x-w.x, oy:y-w.y}; return true; }
    if(Win.hit(w, x, y)){
      const r = Win.inner(w);
      const b = r.y + r.h - 16;
      if(x >= r.x+4 && x <= r.x+4+46 && y >= b && y <= b+13){ this.closeDossier(); return true; }
      if(y > r.y+10){ this.scrollClue(x, y); return true; }
      return true;
    }
    return false;
  },
  scrollClue(x, y){
    const w = this.win; if(!w) return;
    const r = Win.inner(w);
    const nx = w.x - 40;
    if(x < w.x - 4 || x > w.x + w.w + 4 || y < r.y - 4 || y > r.y + r.h + 4){
      this.closeDossier();
      return;
    }
    if(y < r.y + 4) this.dossierScroll = -1; else this.dossierScroll = 1;
  },

  /* ---------- ход ---------- */
  sayClue(i){
    const c = ARC4_CLUES[i];
    this.msg = c.name + ': ' + c.tag; this.msgT = 2.4; this.msgCol = c.tag === 'НЕ ВАЖНО' ? '#9fb4d8' : '#ffe6a8';
  },
  /** выбрать показание А/Б/В */
  chooseSay(i){
    if(this.sawAns) return;
    const id = ARC4_SAY[i].id;
    if(id === ARC4_FAKE){
      this.sawAns = true; this.errs = 0;
      Snd.coin(); Snd.win(); flashScreen('#8ce99a', .22);
      this.msg = 'СХОДИТСЯ. ЭТО ЛОЖЬ'; this.msgT = 2.4; this.msgCol = '#8ce99a';
      celebrate('ЛОЖНОЕ НАЙДЕНО');
      this.wait = 1.6;
    } else {
      this.wrong();
      this.msg = 'НЕ СХОДИТСЯ С УЛИКАМИ'; this.msgT = 2.2; this.msgCol = '#ff9d9d';
    }
  },
  wrong(){
    this.errs++; this.fails++;
    AR.errors[G_arIdx]++; arSaveNow();
    Snd.bad(); Snd.hurt(); shake(3); this.glitch = 0.5;
    flashScreen('#6b2a5a', .2);
  },
  startQuiz(){
    this.qa = 0; this.badQ = {};
    this.setScene('quiz');
    this.msg = 'ТРИ ВОПРОСА'; this.msgT = 2.0; this.msgCol = '#ffe6a8';
  },
  answer(i){
    const q = ARC4_QUIZ[this.qa];
    if(this.badQ[i]) return;
    if(i === q.a){
      Snd.coin();
      this.qa++;
      this.msg = 'ВЕРНО'; this.msgT = 1.4; this.msgCol = '#8ce99a';
      if(this.qa >= ARC4_QUIZ.length){
        this.setScene('win');
        Snd.fanfare(); flashScreen('#ffd97a', .3); shake(4); confettiRain(40);
        return;
      }
    } else {
      this.badQ[i] = true;
      this.wrong();
      this.msg = 'НЕТ. ПРОВЕРЬ УЛИКУ'; this.msgT = 2.0; this.msgCol = '#ff9d9d';
    }
  },

  /* ---------- сцены ---------- */
  on_room(){}, u_room(dt){ this.tScene(dt); this.common(dt); if(this.sawAns && this.wait>0){ this.wait -= dt; if(this.wait<=0) this.startQuiz(); } },
  on_verdict(){}, u_verdict(dt){ this.tScene(dt); this.common(dt); if(this.sawAns && this.wait>0){ this.wait -= dt; if(this.wait<=0) this.startQuiz(); } },
  on_quiz(){}, u_quiz(dt){ this.tScene(dt); this.common(dt); },
  on_win(){ this.okT = 0; },
  u_win(dt){ this.tScene(dt); this.common(dt); this.okT += dt; if(Math.random()<.3) confettiRain(1); if(this.okT > 3.4) arWin(); },
  common(dt){
    if(this.glitch > 0) this.glitch -= dt;
    if(this.msgT > 0) this.msgT -= dt;
    if(this.win) this.win.t += dt;
    if(this.dragW && ptr.down){
      this.win.x = ptr.x - this.dragW.ox;
      this.win.y = ptr.y - this.dragW.oy;
      this.win.x = clamp(this.win.x, 2, W - this.win.w - 2);
      this.win.y = clamp(this.win.y, 2, H - this.win.h - 30);
    } else this.dragW = null;
  },

  /* ---------- ввод ---------- */
  hitBtn(x, y){
    for(const b of this.btns) if(hit(b,x,y)){ b.f(); return true; }
    return false;
  },
  t_room(x, y){
    if(this.dragWin(x, y)) return;
    if(this.hitBtn(x, y)) return;
    for(let i=0;i<this.hot.length;i++){
      const h = this.hot[i];
      if(Math.hypot(h.x-x, h.y-y) < 10){ this.openDossier(i); return; }
    }
    // лента времени
    for(const t of this.tl){
      if(x >= t.x-11 && x <= t.x+11 && y >= t.y-6 && y <= t.y+8){
        this.qIdx = t.i; this.qT = 3.4; Snd.type();
        this.msg = t.t; this.msgT = 3.0; this.msgCol = '#a8c8ff';
        return;
      }
    }
  },
  t_verdict(x, y){
    if(this.dragWin(x, y)) return;
    if(this.hitBtn(x, y)) return;
    for(const r of this.sayRows) if(hit(r,x,y)){ this.chooseSay(r.i); return; }
  },
  t_quiz(x, y){
    if(this.dragWin(x, y)) return;
    if(this.hitBtn(x, y)) return;
    for(const r of this.qRows) if(hit(r,x,y)){ this.answer(r.i); return; }
  },
  t_win(x, y){ this.hitBtn(x, y); },
  k_room(k){
    if(this.win && (k==='Escape' || k===' ' || k==='Enter')){ this.closeDossier(); return; }
    if(k==='ArrowDown' || k==='ArrowUp'){
      const d = k==='ArrowDown' ? 1 : -1;
      this.qIdx = (this.qIdx < 0) ? (d>0?0:ARC4_TIME.length-1) : (this.qIdx + d + ARC4_TIME.length) % ARC4_TIME.length;
      this.qT = 3.0; Snd.blip();
      this.msg = ARC4_TIME[this.qIdx].t; this.msgT = 3.0; this.msgCol = '#a8c8ff';
    }
    if(k===' '||k==='Enter'){
      if(this.pick >= 0) this.openDossier(this.pick);
      else { const n = this.openCount(); this.openDossier(Math.min(n, ARC4_CLUES.length-1)); }
    }
  },
  k_verdict(k){
    if(this.win && (k==='Escape')){ this.closeDossier(); return; }
    if(k==='1'||k==='a'||k==='A'||k==='ф'||k==='Ф') this.chooseSay(0);
    if(k==='2'||k==='b'||k==='B'||k==='и'||k==='И') this.chooseSay(1);
    if(k==='3'||k==='c'||k==='C'||k==='в'||k==='В') this.chooseSay(2);
  },
  k_quiz(k){
    if(k==='1') this.answer(0);
    if(k==='2') this.answer(1);
    if(k==='3') this.answer(2);
  },
  k_win(){},

  /* ---------- комната ---------- */
  roomRect(){ return {x:0, y:34, w:W, h:Math.max(110, H-92)}; },
  d_bg(t){
    ctx.drawImage(bgCache('arcase', p=>{
      ditherGradVTo(p,0,0,W,H,'#241a2e','#120c1a',14);
      veilBlobTo(p, W*0.5, H*0.34, Math.max(W,H)*0.5, 'rgba(255,214,150,.13)');
    }), 0, 0);
    const r = this.roomRect();
    // стена и пол
    ctx.fillStyle = '#2e2438'; ctx.fillRect(0, r.y+r.h, W, H-r.y-r.h);
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(0, r.y+r.h-3, W, 3);
    // окно со снегом
    const wx = Math.round(r.x+8), wy = r.y+8, ww = Math.round(r.w*0.28), wh = Math.round(r.h*0.42);
    ctx.fillStyle = '#101a2e'; ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#3a2a4a'; ctx.fillRect(wx, wy, ww, 2); ctx.fillRect(wx, wy+wh-2, ww, 2);
    ctx.fillRect(wx, wy, 2, wh); ctx.fillRect(wx+ww-2, wy, 2, wh);
    ctx.fillRect(wx + (ww>>1) - 1, wy, 2, wh);
    for(let i=0;i<10;i++){
      const sx = wx + 3 + ((i*13 + Math.floor(t*8)) % (ww-6));
      const sy = wy + 3 + ((i*7) % (wh-6));
      ctx.fillStyle = 'rgba(220,235,255,.5)'; ctx.fillRect(sx, sy, 1, 1);
    }
    // дверь
    const dx = Math.round(r.x + r.w - r.w*0.26), dy = r.y+6, dw = Math.round(r.w*0.2), dh = Math.round(r.h*0.72);
    ctx.fillStyle = '#4a3226'; ctx.fillRect(dx, dy, dw, dh);
    ctx.fillStyle = '#6b4a34'; ctx.fillRect(dx+2, dy+2, dw-4, dh-4);
    ctx.fillStyle = '#c9a45a'; ctx.fillRect(dx+dw-6, dy+dh/2, 2, 2);
    // следы у порога
    ctx.fillStyle = 'rgba(220,235,255,.45)'; ctx.fillRect(dx+2, dy+dh, 3, 1); ctx.fillRect(dx+7, dy+dh+1, 3, 1);
    // стол
    const tx = Math.round(r.x + r.w*0.26), ty = r.y + Math.round(r.h*0.52);
    const tw = Math.round(r.w*0.48), th = 4;
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = '#4a3020'; ctx.fillRect(tx+4, ty+th, 4, Math.round(r.h*0.3));
    ctx.fillRect(tx+tw-8, ty+th, 4, Math.round(r.h*0.3));
    // лампа
    const lx = tx+6, ly = ty-14;
    ctx.fillStyle = '#8a8a9a'; ctx.fillRect(lx+6, ly, 2, 14);
    ctx.fillStyle = '#d8c060';
    for(let i=0;i<4;i++) ctx.fillRect(lx+2+i, ly+3-i, 10-i*2, 2);
    glowAt(lx+7, ly+4, 22, '#ffd97a', .16);
    // тетрадь, конверт, кружки
    ctx.fillStyle = '#e8e2d0'; ctx.fillRect(tx+18, ty-4, 12, 4);
    ctx.fillStyle = '#f0e0c0'; ctx.fillRect(tx+34, ty-5, 14, 5);
    ctx.fillStyle = '#c8d8e8'; ctx.fillRect(tx+52, ty-7, 5, 7);
    ctx.fillStyle = '#e8b0c0'; ctx.fillRect(tx+52, ty-7, 5, 2);
    // будильник
    ctx.fillStyle = '#c04a4a'; ctx.fillRect(tx+tw-14, ty-8, 8, 8);
    ctx.fillStyle = '#ffd97a'; ctx.fillRect(tx+tw-12, ty-6, 4, 4);
    // фото Марии на стене
    const px = Math.round(r.x + r.w*0.46), py = r.y+8;
    ctx.fillStyle = '#c9bde8'; ctx.fillRect(px, py, 14, 16);
    ctx.fillStyle = '#2a2038'; ctx.fillRect(px+4, py+4, 6, 6);
    ctx.fillStyle = '#ff9ec4'; ctx.fillRect(px+5, py+11, 4, 4);
    // часы на стене
    const cx2 = Math.round(r.x + r.w*0.62), cy2 = r.y+12;
    ctx.fillStyle = '#e8e2d0'; ctx.fillRect(cx2, cy2, 11, 11);
    ctx.fillStyle = '#3a3040';
    ctx.fillRect(cx2+5, cy2+2, 1, 4); ctx.fillRect(cx2+5, cy2+5, 3, 1);
  },
  d_hotspots(t){
    const r = this.roomRect();
    const tx = Math.round(r.x + r.w*0.26), ty = r.y + Math.round(r.h*0.52);
    this.hot = [
      {x:tx+13, y:ty-10, i:0},                                  // лампа
      {x:tx+54, y:ty-6,  i:1},                                  // кружки
      {x:Math.round(r.x + r.w*0.78), y:r.y+Math.round(r.h*0.5), i:2}, // следы у двери
      {x:tx+41, y:ty-4,  i:3},                                  // конверт
      {x:tx+tw(r)-11, y:ty-5, i:4}                              // будильник
    ];
    for(const h of this.hot){
      const c = ARC4_CLUES[h.i], seen = !!this.seen[c.id];
      const k = 0.5 + 0.5*Math.sin(t*3 + h.i);
      if(!seen){
        ctx.globalAlpha = 0.35 + 0.35*k;
        ringPix(h.x, h.y, 7 + k*2, '#ffd97a', 1);
        ctx.globalAlpha = 1;
        text('?', h.x, h.y-3, {sc:1, align:'center', color:'#ffd97a'});
      } else {
        ctx.fillStyle = '#8ce99a';
        ctx.fillRect(h.x-2, h.y-2, 4, 4);
        pxCheck(h.x-3, h.y-3, '#8ce99a');
      }
      const hot = ptr.x > h.x-9 && ptr.x < h.x+9 && ptr.y > h.y-9 && ptr.y < h.y+9;
      if(hot) ringPix(h.x, h.y, 10, '#ff9ec4', 1);
    }
  },
  d_timeline(){
    const y = H - 54;
    this.tl = [];
    const n = ARC4_TIME.length, gap = Math.floor((W-40)/(n-1));
    const x0 = 20;
    ctx.fillStyle = 'rgba(168,200,255,.30)'; ctx.fillRect(12, y, W-24, 1);
    for(let i=0;i<n;i++){
      const x = x0 + i*gap, on = (this.qIdx === i);
      ctx.fillStyle = on ? '#a8c8ff' : '#4a5a80';
      ctx.fillRect(x-1, y-1, 3, 3);
      if(this.qIdx === i) glowAt(x, y, 8, '#a8c8ff', .4);
      text(ARC4_TIME[i].t, x, y+5, {sc:1, align:'center', color: on ? '#e8f0ff' : '#7f8fb0'});
      this.tl.push({x:x, y:y, i:i});
    }
    if(this.qT > 0 && this.qIdx >= 0){
      ctx.globalAlpha = clamp(this.qT, 0, 1);
      const f = ARC4_TIME[this.qIdx].f;
      const lines = wrap(f, W-20, 1).slice(0,2);
      let yy = y - 8 - lines.length*11;
      for(const l of lines){ text(l, W/2, yy, {sc:1, align:'center', color:'#cfe0ff'}); yy += 11; }
      ctx.globalAlpha = 1;
    }
  },
  d_dossier(){
    const w = this.win; if(!w) return;
    drawWinFrame(w, true);
    const r = Win.inner(w), c = ARC4_CLUES[this.pick];

    text(this.openCount() + ' / ' + ARC4_CLUES.length, r.x+r.w-3, r.y+2, {sc:1, align:'right', color:'#8ce99a'});
    ctx.fillStyle = 'rgba(255,209,122,.25)'; ctx.fillRect(r.x, r.y+12, r.w, 1);
    let y = r.y+16;
    text(c.no + '. ' + c.name, r.x+3, y, {sc:1, color:'#fff6e8'}); y += 12;
    for(const l of wrap(c.txt, r.w-8, 1)){ text(l, r.x+3, y, {sc:1, color:'#c9bde8'}); y += 11; }
    y += 4;
    const tagCol = c.tag === 'ОПРОВЕРГАЕТ А' ? '#ff9d9d' : (c.tag === 'НЕ ВАЖНО' ? '#9fb4d8' : '#8ce99a');
    panel(r.x+3, y, r.w-6, 13, 'rgba(0,0,0,.4)', tagCol);
    text(c.tag, r.x+r.w/2, y+3, {sc:1, align:'center', color:tagCol});
    // кнопка закрыть
    const bw = 46, bh = 13, bx = r.x+4, by = r.y+r.h-bh-3;
    const on = ptr.x>bx && ptr.x<bx+bw && ptr.y>by && ptr.y<by+bh;
    drawBtn(bx, by, bw, bh, 'ЗАКРЫТЬ', {press:on, color:on?'#ffd97a':'#c9bde8'});
    this.closeBtn = {x:bx, y:by, w:bw, h:bh};
  },
  d_head(){
    const P = CONFIG.P;
    text('ДЕЛО: НОЧЬ ПИСЬМА', 5, 4, {sc:1, color:P.gold});
    text('УЛИКИ ' + this.openCount() + '/' + ARC4_CLUES.length, W-5, 4, {sc:1, align:'right', color:'#8f83ad'});
    ctx.fillStyle = 'rgba(255,209,122,.22)'; ctx.fillRect(4, 15, W-8, 1);
    if(this.msgT > 0){
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const sc = fitSc(this.msg, W-24, 1);
      const w2 = Math.min(W-8, textW(this.msg, sc)+10);
      panel(Math.round((W-w2)/2), 19, w2, 13, 'rgba(10,6,22,.92)', this.msgCol||'#ffe6a8');
      text(this.msg, W/2, 22, {sc:sc, align:'center', color:this.msgCol||'#ffe6a8'});
      ctx.globalAlpha = 1;
    }
  },
  d_btns(list){
    this.btns = [];
    const y = H-38, h = 16;
    const bw = Math.floor((W-8-(list.length-1)*4)/list.length);
    list.forEach((it,i)=>{
      const x = 4 + i*(bw+4);
      const on = !it.off && ptr.x>x && ptr.x<x+bw && ptr.y>y && ptr.y<y+h;
      drawBtn(x, y, bw, h, it.t, {press:on, color: it.off ? '#4a5670' : (on?'#ffd97a':'#c9bde8')});
      this.btns.push({x:x, y:y, w:bw, h:h, f: ()=>{ if(!it.off){ Snd.blip(); it.f(); } else Snd.bad(); }});
    });
    this.btns = this.btns.concat(arBar(H-20, true));
  },
  d_glitch(){
    if(this.glitch > 0){
      const k = this.glitch/0.5;
      ctx.globalAlpha = .25*k;
      ctx.fillStyle = '#ff6b6b';
      for(let i=0;i<6;i++) ctx.fillRect(0, Math.round(rnd(0,H)), W, Math.round(rnd(1,3)));
      ctx.globalAlpha = 1;
    }
  },

  /* ---------- отрисовка сцен ---------- */
  d_room(){
    const t = this.sceneT;
    this.d_bg(t);
    this.d_hotspots(t);
    this.d_timeline();
    this.d_head();
    this.d_dossier();
    this.d_glitch();
    this.d_btns([
      {t:'ДОСЬЕ', f:()=>{ const n = this.openCount(); this.openDossier(Math.min(n, ARC4_CLUES.length-1)); }},
      {t:'ПОКАЗАНИЯ', f:()=>{ this.setScene('verdict'); this.sawAns = false; this.wait = 0; }, off: !this.allSeen()}
    ]);
  },
  dim(a){ ctx.globalAlpha = a==null?0.86:a; ctx.fillStyle = '#120c1a'; ctx.fillRect(0, 30, W, H-30); ctx.globalAlpha = 1; },
  d_verdict(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_bg(t); this.dim();
    this.d_head();
    text('ТРИ ПОКАЗАНИЯ. ОДНО — ЛОЖНОЕ', W/2, 40, {sc:1, align:'center', color:'#e8f0ff'});
    this.sayRows = [];
    let y = 56;
    for(let i=0;i<ARC4_SAY.length;i++){
      const lines = wrap(ARC4_SAY[i].t, W-30, 1).slice(0,2);
      const h = 8 + lines.length*11;
      const on = this.sawAns && ARC4_SAY[i].id === ARC4_FAKE;
      const hov = ptr.x>6 && ptr.x<W-6 && ptr.y>y && ptr.y<y+h;
      ctx.fillStyle = on ? 'rgba(140,233,154,.18)' : (hov ? 'rgba(255,209,122,.14)' : 'rgba(11,6,24,.55)');
      ctx.fillRect(6, y, W-12, h);
      ctx.fillStyle = on ? '#8ce99a' : (hov ? '#ffd97a' : '#4a3a70');
      ctx.fillRect(6, y, 2, h);
      text(ARC4_SAY[i].id + ':', 12, y+3, {sc:1, color: on ? '#8ce99a' : '#ffd97a'});
      let yy = y+3;
      for(const l of lines){ text(l, 26, yy, {sc:1, color: on ? '#c8ffd8' : '#c9bde8'}); yy += 11; }
      this.sayRows.push({x:6, y:y, w:W-12, h:h, i:i});
      y += h + 6;
    }
    if(this.sawAns){
      text('ПОДТВЕРЖДЕНО УЛИКАМИ', W/2, y+4, {sc:1, align:'center', color:'#8ce99a'});
    } else {
      text('ПРОВЕРЬ ПРОТИВ УЛИК', W/2, y+4, {sc:1, align:'center', color:'#6b5a8f'});
    }
    this.d_dossier();
    this.d_glitch();
    this.d_btns([
      {t:'В КОМНАТУ', f:()=>{ this.setScene('room'); this.sawAns = false; }},
      {t:'ЗАПИСЬ', f:()=>this.startQuiz(), off: !this.sawAns}
    ]);
  },
  d_quiz(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_bg(t); this.dim(0.90);
    this.d_head();
    const q = ARC4_QUIZ[this.qa];
    text('ВОПРОС ' + (this.qa+1) + ' / ' + ARC4_QUIZ.length, W/2, 40, {sc:1, align:'center', color:'#a8c8ff'});
    const ql = wrap(q.q, W-24, 1);
    let y = 54;
    for(const l of ql){ text(l, W/2, y, {sc:1, align:'center', color:'#fff6e8'}); y += 12; }
    y += 8;
    this.qRows = [];
    for(let i=0;i<q.o.length;i++){
      const sc = fitSc(q.o[i], W-40, 1);
      const h = 20;
      const on = this.badQ[i];
      const hov = !on && ptr.x>10 && ptr.x<W-10 && ptr.y>y && ptr.y<y+h;
      ctx.fillStyle = on ? 'rgba(120,40,60,.6)' : (hov ? 'rgba(255,209,122,.18)' : 'rgba(11,6,24,.6)');
      ctx.fillRect(10, y, W-20, h);
      const bc = on ? '#ff6b6b' : (hov ? '#ffd97a' : '#3a2560');
      ctx.fillStyle = bc;
      ctx.fillRect(10, y, W-20, 1); ctx.fillRect(10, y+h-1, W-20, 1);
      ctx.fillRect(10, y, 1, h); ctx.fillRect(10+W-21, y, 1, h);
      text((i+1) + '. ' + q.o[i], W/2, y+6, {sc:sc, align:'center', color: on ? '#ff9d9d' : '#c9bde8'});
      this.qRows.push({x:10, y:y, w:W-20, h:h, i:i});
      y += h + 6;
    }
    // точки прогресса
    for(let i=0;i<ARC4_QUIZ.length;i++){
      const x = W/2 - (ARC4_QUIZ.length-1)*5 + i*10;
      ctx.fillStyle = i < this.qa ? '#8ce99a' : (i === this.qa ? '#ffd97a' : '#3a2560');
      ctx.fillRect(x, y+6, 4, 4);
    }
    this.d_dossier();
    this.d_glitch();
    this.d_btns([{t:'ЛИСТАТЬ УЛИКИ', f:()=>{ this.setScene('room'); this.sawAns = true; this.qa = 0; this.badQ = {}; }}]);
  },
  d_win(){
    const P = CONFIG.P, t = this.sceneT;
    this.d_bg(t); this.dim(0.88);
    this.d_head();
    const cx = W/2, cy = Math.round(H*0.34);
    glowAt(cx, cy, 44, '#8ce99a', .18 + .05*Math.sin(t*2));
    // конверт с печатью
    const ew = Math.min(70, W-60), eh = Math.round(ew*0.62), ex = cx-ew/2, ey = cy-20;
    ctx.fillStyle = '#f0e0c0'; ctx.fillRect(ex, ey, ew, eh);
    ctx.fillStyle = '#c9b090';
    for(let i=0;i<ew/2;i++) ctx.fillRect(ex+i, ey+i, 1, 1);
    for(let i=0;i<ew/2;i++) ctx.fillRect(ex+ew-1-i, ey+i, 1, 1);
    ctx.fillStyle = '#c04a4a'; ctx.fillRect(cx-3, ey+eh-12, 6, 6);
    text('ДЕЛО ЗАКРЫТО', cx, ey+eh+10, {sc:1, align:'center', color:'#8ce99a'});
    const lines = wrap('Я СОЛГАЛ ПРО СВЕТ. ПОТОМУ ЧТО ТЫ ВИДЕЛА, КАК Я БОЯЛСЯ.', W-24, 1);
    let y = ey+eh+24;
    for(const l of lines){ text(l, cx, y, {sc:1, align:'center', color:'#ffe6a8'}); y += 11; }
    this.d_glitch();
    this.d_btns([{t:'В АРХИВ', f:()=>arWin()}]);
  },

  outro:[
    D('him','Доказательство нашлось сразу. Я знал, что солгал.'),
    D('him','Я писал в темноте, потому что боялся, что ты увидишь, как я боюсь.'),
    D('him','Ты и так видишь. Просто я ещё не привык, что это можно говорить.')
  ]
};
/** ширина стола нужна и в горячих точках */
function tw(r){ return Math.round(r.w*0.48); }
