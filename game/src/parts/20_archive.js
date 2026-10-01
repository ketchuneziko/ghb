/* ==========================================================================
   ЧАСТЬ 20 · HEART ARCHIVE — дополнительные мини-игры
   Реестр, окно архива, прогресс, сохранения (saveVersion 2), запуск,
   единая система подсказок, экран награды архива.
   Ничего из основной линии (8 сердец, карта, финал) не трогаем.
   ========================================================================== */

const ARCH_N = 5;                       // сколько игр в архиве
const ARCH_KEY = 'printILY3';           // тот же ключ localStorage

/* --- метаданные игр. Содержание каждой игры лежит в своём файле 21…25 --- */
const ARCH_META = [
  {id:'cipher', no:'01', name:'ШИФР, КОТОРЫЙ МЕНЯЕТСЯ', short:'ШИФР',
   sub:'три слоя шифра', icon:'cipher',
   intro:[D('him','Некоторые сообщения не хотят быть найденными.'),
          D('him','Но ты всегда находишь. Правда?')]},
  {id:'stars', no:'02', name:'СОЗДАЙ СОЗВЕЗДИЕ', short:'СОЗВЕЗДИЕ',
   sub:'соедини нужные звёзды', icon:'stars',
   intro:[D('him','Я разбросал кусочки одного вечера по небу.'),
          D('him','Собери их обратно. Порядок подскажет само небо.')]},
  {id:'music', no:'03', name:'МУЗЫКА ВОСПОМИНАНИЙ', short:'МУЗЫКА',
   sub:'повтори мелодию', icon:'music',
   intro:[D('him','Некоторые вещи запоминаются не словами.'),
          D('him','Вот один такой кусочек. Послушай и повтори.')]},
  {id:'case_', no:'04', name:'ДЕТЕКТИВ', short:'ДЕТЕКТИВ',
   sub:'улики, ложь, время', icon:'case_',
   intro:[D('him','В тот вечер кто-то соврал. Кто-то — это я.'),
          D('him','Найди улики и собери настоящую ночь.')]},
  {id:'room', no:'05', name:'КОМНАТА, КОТОРАЯ ЗАПОМИНАЕТ', short:'КОМНАТА',
   sub:'комната помнит тебя', icon:'room',
   intro:[D('him','Эта комната ничего не забывает.'),
          D('him','Даже то, что ты забыл.')]}
];

/* --- состояние прогресса архива (отдельно от основных 13 узлов) --- */
const AR = {
  done:   new Array(ARCH_N).fill(false),
  tries:  new Array(ARCH_N).fill(0),
  best:   new Array(ARCH_N).fill(0),     // лучшее время, мс
  hints:  new Array(ARCH_N).fill(0),     // сколько подсказок использовано
  errors: new Array(ARCH_N).fill(0),
  /* ---- сохранения: версия 2, старые сохранения читаются как есть ---- */
  pack(){ return {d:this.done, t:this.tries, b:this.best, h:this.hints, e:this.errors}; },
  unpack(o){
    if(!o) return;
    const put=(arr,src)=>{ if(!Array.isArray(src)) return; for(let i=0;i<ARCH_N;i++) arr[i] = +src[i]||0; };
    put(this.done,o.d); put(this.tries,o.t); put(this.best,o.b); put(this.hints,o.h); put(this.errors,o.e);
    for(let i=0;i<ARCH_N;i++) this.done[i] = !!this.done[i];
  },
  load(){
    try{
      const d = JSON.parse(localStorage.getItem(ARCH_KEY)||'null');
      if(d && d.a) this.unpack(d.a);
    }catch(e){}
  },
  save(){ arSaveNow(); },
  doneCount(){ let n=0; for(const v of this.done) if(v) n++; return n; },
  hintsTotal(){ let n=0; for(const v of this.hints) n+=v; return n; },
  errorsTotal(){ let n=0; for(const v of this.errors) n+=v; return n; }
};

/* --- перехватываем сохранение: добавляем блок «a», версию 2 --- */
function arSaveNow(){
  try{
    const d = JSON.parse(localStorage.getItem(ARCH_KEY)||'null') || {};
    d.v = 2; d.h = G.hearts; d.a = AR.pack();
    localStorage.setItem(ARCH_KEY, JSON.stringify(d));
  }catch(e){}
}
const _saveA0 = save;
save = function(){ arSaveNow(); _saveA0(); };
AR.load();

/* ==========================================================================
   ЗАПУСК ИГР АРХИВА
   Свой экран уровня, чтобы не трогать LEVELS / G.hearts / счётчик 8/8.
   ========================================================================== */
const ARCH_LEVELS = {};                 // id -> объект уровня (21…25)
let G_arIdx = 0;                        // индекс открытой игры
const G_ar = { card:0, cardMax:1.75, reward:null, winT:0 };

function archMeta(i){ return ARCH_META[i]; }
function arLevel(){ return ARCH_LEVELS[archMeta(G_arIdx).id]; }

/** старт игры архива: карточка-интро → уровень */
function startArch(i){
  if(G.win) G.win = null;          // окно архива могло остаться «закрывающимся»
  G_arIdx = i;
  AR.tries[i]++;
  arSaveNow();
  goNow('arcard');
}
/** из карточки — в уровень */
function arCardStart(){
  const lv = arLevel();
  if(lv && lv.enter) lv.enter();
  goNow('arlevel');
  G_ar.card = G_ar.cardMax; G.cardT = G_ar.cardMax; G.cardAge = 0;
}
/** победа в игре архива */
function arWin(msg){
  const i = G_arIdx;
  const el = Math.round(arT()*1000);
  if(!AR.done[i] || (AR.best[i] && el < AR.best[i])) AR.best[i] = el;
  AR.done[i] = true;
  arSaveNow();
  Snd.fanfare();
  G_ar.reward = {i:i, t:0};
  if(AR.doneCount() >= ARCH_N && !AR.celebrated){
    AR.celebrated = true;
    arSaveNow();
    goNow('arcomplete');
    return;
  }
  goNow('arreward');
}
let _arT0 = 0;
function arT(){ return Math.max(0, Math.round((performance.now() - _arT0)/10)*10); }
/** поражение: не обнуляем игру, а предлагаем продолжить */
function arLose(msg){
  const i = G_arIdx;
  AR.errors[i]++;
  arSaveNow();
  Snd.bad();
  G_ar.lose = msg || 'Ничего страшного. Я рядом.';
  G.dialog = null;
  goNow('arlose');
}
/** перезапуск игры после неудачи (ошибки не обнуляем — прогресс остаётся) */
function arRetry(){
  const lv = arLevel();
  if(lv && lv.enter) lv.enter();
  goNow('arlevel');
}
/** «пропустить»: после трёх неудач */
function arSkip(){
  const i = G_arIdx, lv = arLevel();
  if(!AR.done[i]){ AR.done[i] = true; arSaveNow(); }
  Snd.coin();
  G.dialog = null;
  startDialog(lv.outro || [D('him','Ладно, в следующий раз.')], ()=>{ go('desktop'); G.openArch = true; });
  if(G.dialog) G.dialog.lastLabel = '[ ВЕРНУТЬСЯ ]';
  G.openArch = true;
}

/* --- экран карточки-интро --- */
G.screens.arcard = {
  enter(){ this.t = 0; G_ar.card = 0; G_ar.cardMax = 1.4; },
  update(dt){ this.t += dt; G_ar.card = Math.min(G_ar.cardMax, G_ar.card + dt); },
  key(k){
    if(k==='Escape'){ go('desktop'); G.openArch = true; return; }
    if(k===' '||k==='Enter'){ if(this.t>0.35) arCardStart(); }
  },
  tap(x,y){
    const r = this.btn;
    if(r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h && this.t>0.35){ arCardStart(); return; }
    if(this.t>0.35) arCardStart();
  },
  draw(){
    const P = CONFIG.P, t = this.t, m = archMeta(G_arIdx);
    const k = clamp(t/0.5, 0, 1), e = eBack(k);
    ctx.drawImage(bgCache('arbg', p=>{ ditherGradVTo(p,0,0,W,H,'#140a28','#241040',14); veilBlobTo(p,W*0.5,H*0.3,Math.max(W,H)*0.7,'rgba(107,79,160,.22)'); }), 0, 0);
    // рамка-кабинет
    const replay = AR.done[G_arIdx];
    const bw = Math.min(W-20, 200);
    const intro = [];
    const maxIntro = replay ? 3 : 4;
    for(const d of m.intro){
      for(const l of wrap(d.text, bw-16, 1).slice(0,2)){
        intro.push(l);
        if(intro.length >= maxIntro) break;
      }
      if(intro.length >= maxIntro) break;
    }
    const need = 16 + 14 + 22 + (replay ? 38 : 0) + intro.length*12 + 10 + 20 + 14;
    const bhMax = Math.min(H-30, Math.max(150, need));
    const bh = Math.round(bhMax*e);
    const bx = Math.round(W/2 - bw/2), by = Math.round(H/2 - bhMax/2);
    ctx.globalAlpha = e;
    ctx.fillStyle = '#0a0518'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#3a2560'; ctx.fillRect(bx, by, bw, 2); ctx.fillRect(bx, by+bh-2, bw, 2);
    ctx.fillRect(bx, by, 2, bh); ctx.fillRect(bx+bw-2, by, 2, bh);
    if(FXQ > .4) shineRect(bx, by, bw, 2, t, P.pink, 70);
    // шапка
    text('ARCHIVE_'+m.no, bx+6, by+5, {sc:1, color:P.sky});
    const st = archStatus(G_arIdx);
    text(st, bx+bw-6, by+5, {sc:1, align:'right', color:archStatusCol(G_arIdx, P)});
    // иконка
    const iy = by + 16 + 14;
    drawIconAt(m.icon, bx+bw/2, iy+6, 2, P.gold);
    glowAt(bx+bw/2, iy+6, 18, P.gold, .16 + .05*Math.sin(t*3));
    // название
    text(m.name, bx+bw/2, iy+22, {sc:fitSc(m.name, bw-14, 1), align:'center', color:P.ink});
    // повторное прохождение
    let y = iy + 36;
    if(replay){
      const r2 = archResult(G_arIdx);
      text('ТЫ УЖЕ ЗНАЕШЬ, ЧЕМ ЭТО', bx+bw/2, y, {sc:1, align:'center', color:P.gold});
      text('ЗАКАНЧИВАЕТСЯ', bx+bw/2, y+11, {sc:1, align:'center', color:P.gold});
      const prt = 'ПРЕДЫДУЩИЙ РЕЗУЛЬТАТ: ' + r2;
      text(prt, bx+bw/2, y+23, {sc:fitSc(prt, bw-16, 1), align:'center', color:r2==='PERFECT'?P.green:'#8f83ad'});
      y += 36;
    }
    // реплики
    for(const l of intro){ text(l, bx+bw/2, y, {sc:1, align:'center', color:'#c9bde8'}); y += 12; }
    // кнопка
    const bwB = Math.min(120, bw-40), bhB = 20;
    const bxx = Math.round(W/2 - bwB/2), byy = by + bhMax - bhB - 10;
    this.btn = {x:bxx, y:byy, w:bwB, h:bhB};
    const pr = ptr.down && ptr.x>bxx && ptr.x<bxx+bwB && ptr.y>byy && ptr.y<byy+bhB;
    glassBtn(bxx, byy, bwB, bhB, replay ? 'ИГРАТЬ СНОВА' : 'НАЧАТЬ', {press:pr, color:P.gold});
    ctx.globalAlpha = 1;
    vignette(0.55); crtOverlay(t); bezel();
  }
};
function cardInfoAr(i){
  return {done:AR.done[i], tries:AR.tries[i], best:AR.best[i]};
}

/* --- экран уровня архива --- */
G.screens.arlevel = {
  enter(){ this.t = 0; this.msgT = 0; _arT0 = performance.now(); },
  update(dt){
    this.t += dt;
    const lv = arLevel();
    if(this.hintT > 0) this.hintT -= dt;
    if(lv && lv.update) lv.update(dt);
    updateFx(dt);
  },
  draw(){
    const lv = arLevel();
    if(G_ar.card > 0) G_ar.card = Math.max(0, G_ar.card - 1/60);
    if(lv && lv.draw) lv.draw();
    drawFx();
    drawHeartTrail();
    // подсказка
    if(this.hintT > 0){
      const s = this.hintText || '';
      const a = clamp(this.hintT, 0, 1);
      const lines = wrap(s, W-20, 1).slice(0, 3);
      const head = this.hintNo ? 'ПОДСКАЗКА 0' + this.hintNo : '';
      const h = lines.length*11 + (head ? 12 : 0) + 8;
      const yy = H - h - 6;
      ctx.globalAlpha = a;
      panel(6, yy, W-12, h, 'rgba(20,10,36,.92)', '#6b4fa0');
      let y2 = yy+5;
      if(head){
        text(head, W/2, y2, {sc:1, align:'center', color:CONFIG.P.sky});
        y2 += 12;
      }
      for(const l of lines){ text(l, W/2, y2, {sc:1, align:'center', color:CONFIG.P.gold}); y2 += 11; }
      ctx.globalAlpha = 1;
    }
  },
  key(k){
    const lv = arLevel();
    if(k==='Escape'){ go('desktop'); G.openArch = true; return; }
    if(k===' '||k==='Enter' && this.hintT>0){ this.hintT = 0; return; }
    if(lv && lv.key) lv.key(k);
    if(k==='r'||k==='R'||k==='к'||k==='К'){ if(lv && lv.enter) lv.enter(); }
  },
  tap(x,y){
    const lv = arLevel();
    // кнопки подсказки/выхода, если игра их нарисовала
    if(this.zones && this.zones.length){
      for(const z of this.zones){
        if(x>=z.x && x<=z.x+z.w && y>=z.y && y<=z.y+z.h){ z.f(); return; }
      }
    }
    if(lv && lv.tap) lv.tap(x,y);
  }
};

/* --- экран награды архива --- */
G.screens.arreward = {
  enter(){ this.t = 0; this.done = false; Snd.fanfare(); confettiRain(40); },
  update(dt){ this.t += dt; },
  key(k){ if((k===' '||k==='Enter') && this.t>0.6) this.finish(); },
  tap(){ if(this.t>0.6) this.finish(); },
  finish(){
    if(this.done) return; this.done = true;
    const i = G_arIdx, lv = arLevel();
    startDialog(lv && lv.outro ? lv.outro : [D('him','Готово.')], ()=>{ go('desktop'); G.openArch = true; });
    if(G.dialog) G.dialog.lastLabel = '[ ВЕРНУТЬСЯ ]';
  },
  draw(){
    const P = CONFIG.P, t = this.t, m = archMeta(G_arIdx);
    ctx.drawImage(bgCache('arbg', p=>{ ditherGradVTo(p,0,0,W,H,'#1c0a2e','#2a1040',14); veilBlobTo(p,W*0.5,H*0.35,Math.max(W,H)*0.7,'rgba(255,93,143,.16)'); }), 0, 0);
    if(Math.random() < .25) confettiRain(2);
    const cx = W/2, cy = Math.round(H*0.34);
    const sc = Math.min(5, 2 + Math.floor(t*3));
    glowAt(cx, cy, 30*sc, P.pink, .22);
    heart(cx - 4*sc, cy - 3*sc, sc, P.pink);
    // орбита
    for(let i=0;i<14;i++){
      const a = t*1.6 + i*0.45, rr = 26 + i*2.4;
      heart(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr*0.6, 1, 'rgba(255,93,143,'+Math.max(0,0.5-i*0.03).toFixed(2)+')');
    }
    const y2 = cy + 32;
    const rsc = fitSc('ЗАДАЧА ВЫПОЛНЕНА.', W-30, 2);
    text('ЗАДАЧА ВЫПОЛНЕНА.', cx, y2, {sc:rsc, align:'center', color:P.gold, shadow:'#3a1030'});
    let y2b = y2 + F.cell*rsc + 6;
    text('ЕЩЁ ОДНА ВЕЩЬ НАЙДЕНА.', cx, y2b, {sc:1, align:'center', color:P.pink});
    text(m.name, cx, y2b+12, {sc:fitSc(m.name, W-20, 1), align:'center', color:P.ink});
    // статистика
    const i = G_arIdx;
    const sec = AR.best[i] ? (AR.best[i]/1000).toFixed(1)+'с' : '—';
    const perfect = (AR.hints[i] === 0 && AR.errors[i] === 0);
    const res = perfect ? 'PERFECT SOLVE' : 'SOLVED';
    let y3 = y2b + 30;
    text(res, cx, y3, {sc:1, align:'center', color: perfect ? P.gold : '#c9bde8'});
    y3 += 11;
    if(perfect){
      text('Без подсказок. Я впечатлён.', cx, y3, {sc:1, align:'center', color:P.green});
      y3 += 12;
    }
    const rows = [
      ['ВРЕМЯ', sec],
      ['ОШИБКИ', ''+AR.errors[i]],
      ['ПОДСКАЗКИ', ''+AR.hints[i]]
    ];
    for(const r of rows){
      text(r[0], W/2-6, y3, {sc:1, align:'right', color:'#8f83ad'});
      text(r[1], W/2+6, y3, {sc:1, color:'#c9bde8'});
      y3 += 11;
    }
    y3 += 3;
    const sv = 'ЗАПИСЬ СОХРАНЕНА';
    text(sv, W/2+2, y3, {sc:1, align:'center', color:P.green});
    pxCheck(W/2 - 2 - textW(sv,1), y3-1, P.green);
    y3 += 12;
    text('АРХИВ ОБНОВЛЁН.', W/2, y3, {sc:1, align:'center', color:P.sky});
    // кнопка
    const bw = Math.min(130, W-40), bh = 20;
    const bx = Math.round(W/2-bw/2), by = Math.min(H - bh - 10, y3 + 20);
    this.btn = {x:bx, y:by, w:bw, h:bh};
    const pr = ptr.down && ptr.x>bx && ptr.x<bx+bw && ptr.y>by && ptr.y<by+bh;
    glassBtn(bx, by, bw, bh, 'ВЕРНУТЬСЯ', {press:pr, color:P.gold});
    vignette(0.5); crtOverlay(t); bezel();
  }
};

/* ==========================================================================
   ОКНО АРХИВА
   ========================================================================== */
function openArchiveWin(from, straightToList){
  const w = Win.open('arch','HEART ARCHIVE',{w:Math.min(W-8,224), h:Math.min(H-30,212), from:from});
  w.data.tab = 0;
  w.data.page = straightToList ? 1 : 0;     // 0 — вступление, 1 — список файлов
  if(w.data.sel == null) w.data.sel = 0;
  return w;
}
/** обрезать строку по длине (многоточия в шрифте нет) */
function cutTxt(s, n){ s = String(s); return s.length > n ? s.slice(0, n-1) + '.' : s; }
/** статус файла: НЕ ПРОЙДЕНО / ПРОЙДЕНО / ИДЕАЛЬНО */
function archStatus(i){
  if(!AR.done[i]) return 'НЕ ПРОЙДЕНО';
  return (AR.hints[i] === 0 && AR.errors[i] === 0) ? 'ИДЕАЛЬНО' : 'ПРОЙДЕНО';
}
function archStatusCol(i, P){
  if(!AR.done[i]) return '#5c4a7d';
  return (AR.hints[i] === 0 && AR.errors[i] === 0) ? P.gold : P.green;
}
/** прошлый результат: PERFECT / SOLVED */
function archResult(i){
  if(!AR.done[i]) return '';
  return (AR.hints[i] === 0 && AR.errors[i] === 0) ? 'PERFECT' : 'SOLVED';
}
/** содержимое окна архива */
function archIntroPage(win){
  const P = CONFIG.P, r = Win.inner(win), t = win.t, d = win.data;
  ctx.fillStyle = 'rgba(11,6,24,.35)'; ctx.fillRect(r.x, r.y, r.w, r.h);
  const all = AR.doneCount() >= ARCH_N;
  const lines = all ? [
    'Ты уже всё нашла.',
    'Но можешь остаться ещё немного.',
    'Здесь ничего не нужно делать.'
  ] : [
    'Пять файлов. Пять вещей, которые',
    'я не смог сказать словами.',
    'Они не нужны для финала.',
    'Но если хочешь — они твои.'
  ];
  const blockH = 22 + 16 + lines.length*11 + 8 + 18 + 22;
  let y = Math.max(r.y + 6, Math.round(r.y + (r.h - blockH)/2));
  text('HEART ARCHIVE', r.x+r.w/2, y, {sc:1, align:'center', color:P.sky}); y += 11;
  text('ДОПОЛНИТЕЛЬНЫЕ ФРАГМЕНТЫ', r.x+r.w/2, y, {sc:1, align:'center', color:'#6b5a8f'}); y += 16;
  for(const l of lines){ text(l, r.x+r.w/2, y, {sc:1, align:'center', color: all ? P.pink : '#c9bde8'}); y += 11; }
  y += 8;
  // кнопка
  const bw = Math.min(120, r.w-24), bh = 18;
  const bx = Math.round(r.x + r.w/2 - bw/2), by = y;
  const on = ptr.x>=bx && ptr.x<=bx+bw && ptr.y>=by && ptr.y<=by+bh;
  if(FXQ > .4) shineRect(bx, by, bw, bh, t, '#ffffff', 30);
  glassBtn(bx, by, bw, bh, all ? 'ОСТАТЬСЯ' : 'ОТКРЫТЬ АРХИВ', {press:on, color:P.gold});
  d.introBtn = {x:bx, y:by, w:bw, h:bh};
  y = by + bh + 8;
  text('АРХИВ ОСТАЁТСЯ В АРХИВЕ.', r.x+r.w/2, y, {sc:1, align:'center', color:'#4a3670'});
  text('НАЙДЕНО: ' + AR.doneCount() + ' / ' + ARCH_N, r.x+r.w/2, y+12, {sc:1, align:'center', color: all ? P.gold : P.dim});
}
function archWindowContent(win){
  const P = CONFIG.P, r = Win.inner(win), t = win.t;
  if(win.data.page === 0){ archIntroPage(win); return; }
  const bw = Math.floor((r.w-10)/2);
  drawBtn(r.x+4, r.y+2, bw, 13, 'ИГРЫ', {press:win.data.tab===0, color: win.data.tab===0?P.gold:UI.text});
  drawBtn(r.x+4+bw, r.y+2, bw, 13, 'СТАТИСТИКА', {press:win.data.tab===1, color: win.data.tab===1?P.gold:UI.text});
  win.data.tabs = [{x:r.x+4, y:r.y+2, w:bw, h:13}, {x:r.x+4+bw, y:r.y+2, w:bw, h:13}];
  win.data.rows = [];
  if(win.data.tab === 0){
    // заголовок
    text('HEART ARCHIVE', r.x+r.w/2, r.y+18, {sc:1, align:'center', color:P.sky});
    let y = r.y + 30;
    const rowH = 26;
    for(let i=0;i<ARCH_N;i++){
      const m = ARCH_META[i];
      const sel = win.data.sel === i;
      const hot = ptr.x>r.x+2 && ptr.x<r.x+r.w-2 && ptr.y>y && ptr.y<y+rowH-3;
      // карточка
      ctx.fillStyle = sel ? 'rgba(255,209,102,.16)' : 'rgba(11,6,24,.55)';
      ctx.fillRect(r.x+3, y, r.w-6, rowH-4);
      ctx.fillStyle = AR.done[i] ? P.green : (sel ? P.gold : '#3a2560');
      ctx.fillRect(r.x+3, y, 2, rowH-4);
      if(FXQ > .4 && sel) shineRect(r.x+3, y, r.w-6, rowH-4, t, '#ffffff', 30);
      // номер + иконка
      text(m.no, r.x+8, y+2, {sc:1, color: sel?P.gold:'#6b5a8f'});
      drawIconAt(m.icon, r.x+24, y+11, 1, AR.done[i] ? P.pink : (sel ? P.gold : '#8a68c9'));
      const nx = r.x+32;
      text(m.short, nx, y+2, {sc:fitSc(m.short, r.w-nx+r.x-72, 1), color: AR.done[i]?'#fff6e8':(sel?P.ink:UI.text)});
      const st = archStatus(i);
      text(st, r.x+r.w-8, y+2, {sc:1, align:'right', color:archStatusCol(i, P)});
      text(cutTxt(m.sub, 20), nx, y+13, {sc:1, color: AR.done[i] ? '#8f83ad' : '#6b5a8f'});
      const bt = AR.done[i] ? (AR.best[i]/1000).toFixed(1)+'с' : (AR.tries[i] ? AR.tries[i]+'x' : '');
      text(bt, r.x+r.w-8, y+13, {sc:1, align:'right', color: AR.done[i] ? P.gold : '#4a3670'});
      win.data.rows.push({x:r.x+3, y:y, w:r.w-6, h:rowH-4, i:i});
      y += rowH;
    }
    const foot = 'ПРОЙДЕНО: ' + AR.doneCount() + ' / ' + ARCH_N;
    text(foot, r.x+r.w/2, r.y+r.h-13, {sc:1, align:'center', color: AR.doneCount()===ARCH_N?P.green:P.dim});
  } else {
    // статистика
    let y = r.y + 20;
    text('ПРОЙДЕНО: '+AR.doneCount()+' / '+ARCH_N, r.x+r.w/2, y, {sc:1, align:'center', color:P.ink}); y += 14;
    text('ПОДСКАЗОК: '+AR.hintsTotal(), r.x+r.w/2, y, {sc:1, align:'center', color:'#c9bde8'}); y += 12;
    text('ОШИБОК: '+AR.errorsTotal(), r.x+r.w/2, y, {sc:1, align:'center', color:'#c9bde8'}); y += 14;
    ctx.fillStyle = '#3a2560'; ctx.fillRect(r.x+10, y, r.w-20, 1); y += 8;
    for(let i=0;i<ARCH_N;i++){
      const m = ARCH_META[i];
      const done = AR.done[i];
      const best = AR.best[i] ? (AR.best[i]/1000).toFixed(1)+'с' : '—';
      text(m.short, r.x+8, y, {sc:fitSc(m.short, r.w-70, 1), color: done?P.ink:'#6b5a8f'});
      text(done ? best : '—', r.x+r.w-8, y, {sc:1, align:'right', color: done?P.gold:'#4a3670'});
      y += 12;
    }
    y += 4;
    text('ОСНОВНАЯ ЛИНИЯ: ' + storyDone() + ' / ' + CH + ' СЕРДЕЦ', r.x+r.w/2, y, {sc:1, align:'center', color:P.pink2}); y += 12;
    text('АРХИВ ОСТАЁТСЯ В АРХИВЕ.', r.x+r.w/2, y, {sc:1, align:'center', color:'#4a3670'});
  }
}
/** тап по окну архива */
function archWinTap(x,y){
  const win = G.win; if(!win) return false;
  const d = win.data;
  if(d.page === 0){
    const b = d.introBtn;
    if(b && x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ d.page = 1; Snd.coin(); return true; }
    return true;
  }
  for(const tb of (d.tabs||[])){
    if(x>=tb.x && x<=tb.x+tb.w && y>=tb.y && y<=tb.y+tb.h){ d.tab = d.tab===0?1:0; Snd.blip(); return true; }
  }
  for(const rw of (d.rows||[])){
    if(x>=rw.x && x<=rw.x+rw.w && y>=rw.y && y<=rw.y+rw.h){
      d.sel = rw.i; Snd.blip();
      if(d.selT) clearTimeout(d.selT);
      d.selT = setTimeout(()=>{ if(G.win === win){ Win.close(); startArch(d.sel); } }, 160);
      return true;
    }
  }
  return false;
}

/* --- подключаем окно к рабочему столу --- */
const _dwA0 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'arch'){ drawWinFrame(win, true); archWindowContent(win); return; }
  return _dwA0.call(this, win);
};
const _dtA0 = G.screens.desktop.tap;
G.screens.desktop.tap = function(x,y){
  if(G.win && G.win.kind === 'arch' && !G.win.closing){
    if(Win.closeHit(G.win,x,y)){ Win.close(); return; }
    if(Win.titleHit(G.win,x,y)){ this.drag = true; return; }
    if(Win.hit(G.win,x,y)){ if(archWinTap(x,y)) return; }
  }
  return _dtA0.call(this, x, y);
};
const _dkA0 = G.screens.desktop.key;
G.screens.desktop.key = function(k){
  const win = G.win;
  if(win && win.kind === 'arch' && !win.closing){
    if(k==='Escape'){ Win.close(); return; }
    const d = win.data;
    if(d.page === 0){
      if(k===' '||k==='Enter'){ d.page = 1; Snd.coin(); return; }
      return;
    }
    if(k==='ArrowDown'){ d.sel = d.sel==null ? 0 : (d.sel+1)%ARCH_N; Snd.blip(); return; }
    if(k==='ArrowUp'){ d.sel = d.sel==null ? ARCH_N-1 : (d.sel+ARCH_N-1)%ARCH_N; Snd.blip(); return; }
    if(k===' '||k==='Enter'){ const s = d.sel==null?0:d.sel; Win.close(); startArch(s); return; }
    if(k==='Tab'){ d.tab = d.tab===0?1:0; Snd.blip(); return; }
    return;
  }
  return _dkA0.call(this, k);
};
/* автооткрытие архива после outro/победы */
const _deA0 = G.screens.desktop.enter;
G.screens.desktop.enter = function(){
  _deA0.call(this);
  if(this._openArch){ this._openArch = false; this._archT = 0.35; }
  if(G.openArch){ G.openArch = false; this._archT = 0.35; }
};
const _duA0 = G.screens.desktop.update;
G.screens.desktop.update = function(dt){
  _duA0.call(this, dt);
  if(this._archT > 0){
    this._archT -= dt;
    if(this._archT <= 0 && !G.win) openArchiveWin(null, true);
  }
};

/* --- иконка АРХИВ.exe на рабочем столе --- */
const _biA0 = G.screens.desktop.buildIcons;
G.screens.desktop.buildIcons = function(){
  _biA0.call(this);
  if(!this.icons.some(i=>i.kind==='arch')){
    this.icons.splice(2, 0, {kind:'arch', icon:'stars', name:'АРХИВ.exe', node:-1});
    this.layout();
  }
};
const _laA0 = G.screens.desktop.launch;
G.screens.desktop.launch = function(it, dbl){
  if(it.kind === 'arch'){
    Snd.coin(); ripple(it.tx, it.ty);
    if(G.win && G.win.kind === 'map') Win.close();
    if(G.win && G.win.kind === 'arch'){ Win.close(); return; }
    openArchiveWin({x:it.tx-20, y:it.ty-16, w:40, h:32});
    return;
  }
  return _laA0.call(this, it, dbl);
};

/* ==========================================================================
   ЕДИНАЯ СИСТЕМА ПОДСКАЗОК
   ========================================================================== */
const AR_HINTS = {};                   // id -> [3 подсказки]
function arHints(id){ return AR_HINTS[id] || []; }
/** показать подсказку уровня n (0,1,2) */
function arHint(n){
  const i = G_arIdx;
  const list = arHints(archMeta(i).id);
  const k = (G.screens.arlevel.hintStep || 0);
  if(k >= list.length){
    G.screens.arlevel.hintNo = 0;
    G.screens.arlevel.hintT = 2.2;
    G.screens.arlevel.hintText = 'Больше подсказок нет. Ты справишься.';
    return;
  }
  G.screens.arlevel.hintStep = k+1;
  G.screens.arlevel.hintNo = k+1;
  AR.hints[i]++; arSaveNow();
  G.screens.arlevel.hintText = list[k];
  G.screens.arlevel.hintT = 6.5;
  Snd.coin();
}
function arResetHints(){ G.screens.arlevel.hintStep = 0; G.screens.arlevel.hintT = 0; G.screens.arlevel.hintNo = 0; }

/* --- кнопки, общие для всех игр архива: ПОДСКАЗКА / ВЫХОД --- */
function arBar(y, withExit){
  const P = CONFIG.P, h = 16;
  const items = [];
  items.push({x:4, w:Math.floor((W-8-4)/2), t:'ПОДСКАЗКА', f:()=>arHint(0), n:3});
  if(withExit) items.push({x:4+items[0].w+4, w:W-8-items[0].w-4, t:'ВЫЙТИ', f:()=>{ go('desktop'); G.openArch = true; }});
  const out = [];
  for(const it of items){
    const on = ptr.x>it.x && ptr.x<it.x+it.w && ptr.y>y && ptr.y<y+h;
    drawBtn(it.x, y, it.w, h, it.t, {press:on, color: on?P.gold:UI.text});
    out.push({x:it.x, y:y, w:it.w, h:h, f:it.f});
  }
  return out;
}


/* ==========================================================================
   ПОДСКАЗКА «ПРОПУСТИТЬ» В ДИАЛОГЕ ДЛЯ ИГР АРХИВА
   Основные уровни работают как раньше (skipLevel), архив — arSkip.
   ========================================================================== */
const _dlgK0 = G.screens.dialog.key;
G.screens.dialog.key = function(k){
  if((k==='p'||k==='P'||k==='з'||k==='З') && G.dialog && G.dialog.canSkip && G.state === 'arlevel'){ arSkip(); return; }
  return _dlgK0.call(this, k);
};
const _dlgT0 = G.screens.dialog.tap;
G.screens.dialog.tap = function(x,y){
  const r = this.skipRect;
  if(r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h && G.state === 'arlevel'){ arSkip(); return; }
  return _dlgT0.call(this, x, y);
};

/* ==========================================================================
   ЭКРАН «НЕ ПОЛУЧИЛОСЯ»
   Ошибки не обнуляют игру: можно повторить, взять подсказку или выйти.
   После трёх неудач появляется скрытая кнопка «ПРОПУСТИТЬ».
   ========================================================================== */
G.screens.arlose = {
  enter(){ this.t = 0; this.btns = null; },
  update(dt){ this.t += dt; },
  key(k){
    if(this.t < 0.4) return;
    if(k === '1' || k === 'Enter' || k === ' '){ arRetry(); return; }
    if(k === '2'){ arRetry(); arHint(0); return; }
    if(k === '3' || k === 'Escape'){ go('desktop'); G.openArch = true; return; }
    if((k === 'p' || k === 'P' || k === 'з' || k === 'З') && this.canSkip()){ arSkip(); return; }
  },
  tap(x,y){
    if(this.t < 0.4 || !this.btns) return;
    for(const b of this.btns){
      if(x>=b.x && x<=x+b.w && y>=b.y && y<=b.y+b.h){ b.f(); return; }
    }
  },
  canSkip(){ return AR.tries[G_arIdx] >= 3; },
  draw(){
    const P = CONFIG.P, t = this.t, m = archMeta(G_arIdx);
    ctx.drawImage(bgCache('arlosebg', p=>{ ditherGradVTo(p,0,0,W,H,'#1a0a1e','#2a0c22',14); veilBlobTo(p,W*0.5,H*0.4,Math.max(W,H)*0.7,'rgba(255,93,143,.12)'); }), 0, 0);
    const cx = W/2;
    const y0 = Math.round(Math.min(H*0.22, 48));
    const hsc = fitSc('НЕ ПОЛУЧИЛОСЯ.', W-30, 2);
    text('НЕ ПОЛУЧИЛОСЯ.', cx, y0, {sc:hsc, align:'center', color:P.red, shadow:'#2a0c22'});
    const h2 = F.cell*hsc;
    text(m.name, cx, y0+h2+4, {sc:fitSc(m.name, W-24, 1), align:'center', color:'#8f83ad'});
    let y = y0 + h2 + 18;
    for(const l of wrap(G_ar.lose || 'Попробуй ещё раз.', W-24, 1).slice(0,4)){
      text(l, cx, y, {sc:1, align:'center', color:'#c9bde8'}); y += 11;
    }
    y += 8;
    const bw = Math.min(150, W-32), bh = 20, gap = 4;
    const bs = [
      {t:'ПОПРОБОВАТЬ ЕЩЁ', f:()=>arRetry(), color:P.gold},
      {t:'ПОДСКАЗКА', f:()=>{ arRetry(); arHint(0); }, color:P.sky},
      {t:'ВЫЙТИ', f:()=>{ go('desktop'); G.openArch = true; }, color:UI.text}
    ];
    if(this.canSkip()) bs.push({t:'ПРОПУСТИТЬ', f:()=>arSkip(), color:P.dim});
    const out = [];
    let by = Math.min(y, H - (bs.length*(bh+gap)) - 10);
    for(const b of bs){
      const on = ptr.x>cx-bw/2 && ptr.x<cx+bw/2 && ptr.y>=by && ptr.y<by+bh;
      if(FXQ > .4 && on) shineRect(Math.round(cx-bw/2), by, bw, bh, t, '#ffffff', 26);
      glassBtn(Math.round(cx-bw/2), by, bw, bh, b.t, {press:on, color:b.color});
      out.push({x:cx-bw/2, y:by, w:bw, h:bh, f:b.f});
      by += bh + gap;
    }
    this.btns = out;
    if(this.canSkip()) text('ТРИ ПОПЫТКИ. МОЖНО ПРОПУСТИТЬ.', cx, H-15, {sc:1, align:'center', color:'#4a3670'});
    vignette(0.55); crtOverlay(t); bezel();
  }
};

/* ==========================================================================
   ЭКРАН «ARCHIVE COMPLETE» — все пять фрагментов найдены
   ========================================================================== */
G.screens.arcomplete = {
  enter(){ this.t = 0; Snd.fanfare(); confettiRain(60); spawnLove(30); },
  update(dt){ this.t += dt; if(this.t > 1.2 && Math.random() < .06) confettiRain(4); },
  key(k){ if((k === ' ' || k === 'Enter') && this.t > 0.8) this.finish(); },
  tap(){ if(this.t > 0.8) this.finish(); },
  finish(){ if(this.done) return; this.done = true; go('desktop'); },
  draw(){
    const P = CONFIG.P, t = this.t, cx = W/2;
    ctx.drawImage(bgCache('arccomp', p=>{ ditherGradVTo(p,0,0,W,H,'#2a0c30','#3d1048',14); veilBlobTo(p,W*0.5,H*0.35,Math.max(W,H)*0.8,'rgba(255,209,102,.16)'); }), 0, 0);
    // большое сердце
    const hy = Math.round(H*0.11);
    const hs = 2 + Math.floor(clamp(t*2, 0, 2));
    glowAt(cx, hy, 14*hs, P.pink, .20 + .05*Math.sin(t*3));
    heart(cx - 3*hs, hy - 2*hs, hs, P.pink);
    for(let i=0;i<8;i++){
      const a = t*1.2 + i*0.79, rr = 18*hs + i*3;
      heart(cx+Math.cos(a)*rr, hy+Math.sin(a)*rr*0.45, 1, 'rgba(255,93,143,'+Math.max(0,0.45-i*0.05).toFixed(2)+')');
    }
    let y = Math.max(hy + 16*hs, Math.round(H*0.19));
    text('HEART ARCHIVE', cx, y, {sc:1, align:'center', color:P.sky}); y += 14;
    const s1 = clamp((t-0.2)/0.5, 0, 1);
    ctx.globalAlpha = s1;
    glowAt(cx, y+8, 26, P.gold, .20 + .05*Math.sin(t*3));
    text('ARCHIVE COMPLETE', cx, y, {sc:fitSc('ARCHIVE COMPLETE', W-20, 2), align:'center', color:P.gold, shadow:'#3a1030'});
    y += F.cell*fitSc('ARCHIVE COMPLETE', W-20, 2) + 2; ctx.globalAlpha = 1;
    const lines = [
      'Пять файлов из пяти.',
      'Ты нашла всё, что я успел сохранить.',
      'Это всё, что у меня было.',
      'АРХИВ ЗАКРЫТ.',
      'Спасибо, ' + CONFIG.her + '.',
      '♥'
    ];
    const cols = [P.pink, '#c9bde8', '#8f83ad', P.sky, P.gold, P.pink];
    for(let i=0;i<lines.length;i++){
      const a = clamp((t - 0.5 - i*0.22)/0.35, 0, 1);
      if(a <= 0) continue;
      ctx.globalAlpha = a;
      text(lines[i], cx, y, {sc:1, align:'center', color:cols[i]});
      ctx.globalAlpha = 1;
      y += 13;
    }
    const bw = Math.min(150, W-32), bh = 20;
    const bx = Math.round(cx-bw/2), byy = H - bh - 12;
    const a2 = clamp((t-1.6)/0.4, 0, 1);
    if(a2 > 0){
      ctx.globalAlpha = a2;
      const on = ptr.x>bx && ptr.x<bx+bw && ptr.y>=byy && ptr.y<byy+bh;
      glassBtn(bx, byy, bw, bh, 'НА РАБОЧИЙ СТОЛ', {press:on, color:P.gold});
      this.btn = {x:bx, y:byy, w:bw, h:bh};
      ctx.globalAlpha = 1;
    }
    vignette(0.5); crtOverlay(t); bezel();
  }
};

