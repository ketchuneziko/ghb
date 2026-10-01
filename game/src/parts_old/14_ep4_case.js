/* ==========================================================================
   ЧАСТЬ 14 · ЭПИЗОД 4 — ДЕЛО №01
   Осмотр комнаты → показания → временная линия → ловля лжи → финальные ответы
   ========================================================================== */

const CAS = {
  items: {
    phone : {name:'ТЕЛЕФОН', clue:'Сообщение в 22:30: «всё нормально, я сплю».'},
    clock : {name:'ЧАСЫ',    clue:'Остановились на 23:10. Почему — вопрос.'},
    cam   : {name:'КАМЕРА',  clue:'Запись: 22:42 кто-то выходит из комнаты.'},
    box   : {name:'КОРОБКА', clue:'Пустая. Но на дне — след от круглой рамки.'},
    note  : {name:'ЗАПИСКА', clue:'Почерк Маши: «я не трогала ничего, кроме часов».'},
    door  : {name:'ДВЕРЬ',   clue:'Закрыта изнутри. Ключ есть, а замок — нет.'},
    pic   : {name:'КАРТИНА', clue:'На стене — пустое место. Под ним — светлый прямоугольник.'}
  },
  order: ['phone','clock','cam','box','note','door','pic'],
  people: [
    {n:'АЛЕКС', c:'#7aa2f7', says:'«Я был здесь до 22:30. Потом ушёл спать.»'},
    {n:'МАША',  c:'#ff8787', says:'«Я пришла в 22:45, дверь была открыта.»'},
    {n:'НИК',   c:'#8ce99a', says:'«Когда я вошёл, Алекс уже уходил. Или наоборот.»'},
    {n:'НЕИЗВЕСТНЫЙ', c:'#b197fc', says:'«Я тут не был. И вообще я никого не знаю.»'}
  ],
  events: [
    {id:0, t:'22:15', x:'Алекс вошёл в комнату'},
    {id:1, t:'22:30', x:'Телефон получил сообщение'},
    {id:2, t:'22:42', x:'Кто-то вышел из комнаты'},
    {id:3, t:'22:45', x:'Маша вошла в комнату'},
    {id:4, t:'22:52', x:'Ник вошёл в комнату'},
    {id:5, t:'23:10', x:'Часы остановились'}
  ],
  prints: {                      // узоры отпечатков: 0 — Алекс, 1 — Маша, 2 — Ник, 3 — Неизвестный
    door: 3,
    pats: [
      {p:0, name:'АЛЕКС'},
      {p:1, name:'МАША'},
      {p:2, name:'НИК'},
      {p:3, name:'НЕИЗВЕСТНЫЙ'}
    ]
  },
  final: [
    {q:'КТО ЛГАЛ?',  a:['Алекс','Маша','Ник','Никто']},
    {q:'ЧТО ПРОПАЛО?', a:['Часы','Фотография','Ключ от двери','Коробка']},
    {q:'ЗАЧЕМ?',     a:['Сделать подарок','Спрятать улику','Отомстить','Случайно']},
    {q:'КОГДА?',     a:['22:30','22:42','23:10','Ночью']},
    {q:'ГДЕ БЫЛ НЕИЗВЕСТНЫЙ?', a:['На крыше','В комнате','В коридоре','Дома']}
  ],
  answers: [0, 1, 0, 1, 0]      // Алекс; фотография; подарок; 22:42; на крыше
};

const EP4 = {
  name:'ДЕЛО', sub:'раскрой тайну', hint:'СОБИРАЙ УЛИКИ', hintY:false,
  intro:[D('her','Танжар, у меня в комнате пропала фотография.'),
         D('her','Вчера ночью. Все клянутся, что ничего не брали.'),
         D('him','Тогда разберёмся. Ты помнишь, во сколько?')],
  outro:[D('her','Я нашла его. Ник. Он врёт про 22:52.'),
         D('her','И эта фотография... та же, что у меня на стене тогда висела.'),
         D('him','Она не пропала. Её я и забрал. Чтобы нарисовать потом пиксели.'),
         D('her','...ты серьёзно?'),
         D('him','Абсолютно.')],
  enter(){
    scenes(this);
    this.extraUpdate = function(dt){ if(this.scene==='timeline') this.u_timeline2(dt); };
    this.found = {}; this.foundN = 0;
    this.tl = [];                 // выбранный порядок событий
    this.lie = -1; this.lieOk = 0;
    this.ans = [-1,-1,-1];
    this.shake2 = 0; this.msg = 0; this.okT = 0; this.win = false;
    this.setScene('room');
  },
  foundCount(){ let n=0; for(const k in this.found) n++; return n; }
};

/* ================= КОМНАТА ================= */
Object.assign(EP4, {
  on_room(){ this.hot = null; },
  u_room(dt){
    if(this.shake2 > 0) this.shake2 -= dt;
    if(this.msg > 0) this.msg -= dt;
  },
  d_room(){
    const P = CONFIG.P, t = this.t;
    epBg(t, {top:'#1a1420', bot:'#2a2030'});
    // комната: стены, пол
    const rx = 6, ry = 34, rw = W-12, rh = H-96;
    ctx.fillStyle = '#2a2038'; ctx.fillRect(rx, ry, rw, rh);
    ctx.fillStyle = '#1d1630'; ctx.fillRect(rx, ry+rh-26, rw, 26);   // пол
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(rx, ry, rw, 2);
    for(let i=0;i<6;i++){ ctx.fillStyle='rgba(0,0,0,.16)'; ctx.fillRect(rx+6+i*(rw-12)/5, ry+rh-24, 1, 24); }
    ctx.fillStyle = '#3a2f4a'; ctx.fillRect(rx, ry+rh-27, rw, 1);
    // объекты — раскладка по долям, чтобы влезала на любой экран
    this.objRects = {};
    const S = Math.max(20, Math.min(34, Math.floor(Math.min(rw, rh)/6)));
    const put = (key, fx2, fy2, fw, fh)=>{
      const found = !!this.found[key];
      const hov = (this.hot === key);
      const w2 = Math.round(rw*fw), h2 = Math.round(rh*fh);
      const x = Math.round(rx + rw*fx2 - w2/2), y = Math.round(ry + rh*fy2 - h2/2);
      ctx.fillStyle = found ? '#4a3670' : (hov ? '#3a2f52' : '#241d33');
      ctx.fillRect(x, y, w2, h2);
      ctx.fillStyle = hov ? P.gold : (found ? '#6b4fa0' : '#4a3f5e');
      ctx.fillRect(x, y, w2, 1); ctx.fillRect(x, y+h2-1, w2, 1);
      drawObjGlyph(key, x+w2/2, y+h2/2, found ? P.gold : (hov ? '#fff6e8' : '#8f82b8'));
      if(found) heart(x+w2-5, y+1, 1, P.pink);
      this.objRects[key] = {x:x, y:y, w:w2, h:h2};
    };
    const fw = Math.min(0.30, S/rw), fh = Math.min(0.30, S/rh);
    put('cam',   0.14, 0.20, fw, fh);
    put('clock', 0.86, 0.20, fw, fh);
    put('pic',   0.50, 0.16, fw, fh*1.2);
    put('box',   0.16, 0.82, fw, fh);
    put('note',  0.84, 0.82, fw, fh);
    put('phone', 0.08, 0.52, fw*0.6, fh*1.2);
    put('door',  0.50, 0.56, fw*0.7, fh*1.9);
    text('ДВЕРЬ', rx+rw/2, ry+rh*0.56+fh*0.95+2, {sc:1, align:'center', color:'#6b4fa0'});
    // панель улик
    const py2 = H-76;
    const pg = epPanel(6, py2, W-12, 48, 'ДОСЬЕ - УЛИКИ '+this.foundCount()+'/'+CAS.order.length, '#3a2560');
    const all = this.foundCount() === CAS.order.length;
    const hintTxt = this.msg>0 ? this.msgTxt :
      (all ? 'Всё осмотрено. К показаниям.' : (this.foundCount() ? 'Осмотрено '+this.foundCount()+' из '+CAS.order.length+'. Ищи остальное.' : 'Нажимай на предметы в комнате.'));
    wrap(hintTxt, pg.w-8, 1).slice(0,2).forEach((l,i)=>text(l, pg.x+4, pg.y+3+i*11, {sc:1, color: this.msg>0?P.gold:'#9b8ac0'}));
    // кнопки перехода
    const byy = H-20;
    this.bRects = bottomButtons(byy, 14, [
      {t:'ПОКАЗАНИЯ', color: this.foundCount()>=4?P.gold:'#5a4680', dis:this.foundCount()<4},
      {t:'ЛИНИЯ ВРЕМЕНИ', color: this.foundCount()>=6?P.gold:'#5a4680', dis:this.foundCount()<6},
      {t:'ФИНАЛ', color: all?P.gold:'#5a4680', dis:!all}
    ], ptr);
    this.bPeo = this.bRects[0]; this.bTim = this.bRects[1]; this.bFin = this.bRects[2];
    vignette(0.5); crtOverlay(t);
  },
  t_room(x, y){
    for(const b of ['bPeo','bTim','bFin']){
      const r = this[b];
      if(r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        if(b==='bPeo' && this.foundCount()>=4) this.setScene('prints');
        else if(b==='bTim' && this.foundCount()>=6) this.setScene('timeline');
        else if(b==='bFin' && this.foundCount()===CAS.order.length) this.setScene('final');
        else { Snd.bad(); this.flash('СНАЧАЛА ОСМОТРИ КОМНАТУ'); }
        return;
      }
    }
    for(const k in this.objRects){
      const r = this.objRects[k];
      if(x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        this.hot = k;
        if(!this.found[k]){
          this.found[k] = true; Snd.clack();
          this.msgTxt = CAS.items[k].name+': '+CAS.items[k].clue; this.msg = 3.2;
          ripple(x, y, 'rgba(255,209,102,.9)');
          fx(x, y, 6, CONFIG.P.gold, 50, .5);
          if(this.foundCount() === CAS.order.length){ Snd.coin(); popText(W/2, 40, 'ВСЁ ОСМОТРЕНО', CONFIG.P.gold); }
        } else Snd.blip();
        return;
      }
    }
  },
  flash(t){ this.msgTxt = t; this.msg = 1.6; Snd.bad(); shake(2); },
  /* --- «подозрение» растёт, пока думаешь --- */
  suspTick(dt, rate){
    if(this.susp == null) this.susp = 0;
    this.susp += dt * 2.6 * (rate || 1);
    if(this.susp >= 100){
      this.susp = 100;
      if(!this.suspFired){ this.suspFired = true; loseLevel('Тебя раскрыли. Слишком много вопросов без ответа.'); }
    }
  },
  d_susp(y){
    const P = CONFIG.P, k = clamp((this.susp||0)/100, 0, 1);
    meterBar(6, y, W-12, 6, k, k>.6?P.red:(k>.3?P.gold:P.sky));
    text('ПОДОЗРЕНИЕ', 6, y+9, {sc:1, color:'#6b4fa0'});
    text(Math.round(k*100)+'%', W-6, y+9, {sc:1, align:'right', color: k>.6?P.red:'#6b4fa0'});
  }
});

/* ================= ОТПЕЧАТКИ ================= */
Object.assign(EP4, {
  on_prints(){ this.pickP = -1; this.printOk = -1; this.printTries = 0; this.susp = 0; },
  /* фон «дела»: дождь за окном + конус лампы */
  d_noir(t){
    ctx.drawImage(bgCache('ep4bg', paint=>{
      ditherGradVTo(paint, 0, 0, W, H, '#140f1e', '#2a2036', 14);
    }), 0, 0);
    if(FXQ > .5){
      // дождь
      rainFX(t, 26, '#8ca0c8', 150, .18);
      // конус лампы
      ctx.globalAlpha = .05;
      ctx.fillStyle = '#ffd166';
      for(let y=0;y<H*0.85;y+=3){
        const w2 = 4 + y*0.34;
        ctx.fillRect(Math.round(W*0.62 - w2/2 - y*0.30), y, Math.round(w2), 3);
      }
      ctx.globalAlpha = 1;
    }
    // пыль в луче
    motes(t, 18, '#ffd166', .3);
    vignette(0.62);
  },
  u_prints(dt){
    this.suspTick(dt, .8);
    if(this.printWin > 0){ this.printWin -= dt; if(this.printWin <= 0) this.setScene('people'); }
  },
  d_prints(){
    const P = CONFIG.P, t = this.t;
    this.d_noir(t);
    hudTop({icon:'case_', title:'ОТПЕЧАТКИ', col:'#4a1f3d', h:22, right:'ПОПЫТОК: '+this.printTries});
    const cols0 = 4, bw0 = Math.floor((W-16)/cols0);
    const blockH = 44 + 8 + 62 + 70 + 24;
    const top0 = Math.max(30, Math.round((H - blockH)/2));
    const fr = 7, frY = top0, frH = 44;
    // отпечаток с двери
    glassPanel(6, frY, W-12, frH, {col:'#7aa2f7'});
    text('НА ДВЕРИ', 10, frY+5, {sc:1, color:'#9b8ac0'});
    this.drawPrint(CAS.prints.door, W/2, frY+28, 14, '#c9bde8');
    // кандидаты
    const cols = 4, bw = bw0, by = frY+frH+8;
    text('КОМУ ПРИНАДЛЕЖИТ?', W/2, by-2, {sc:1, align:'center', color:P.pink2});
    this.printRects = [];
    for(let i=0;i<4;i++){
      const x = 8 + i*bw;
      const sel = this.pickP === i, ok = this.printOk === i, bad = this.printOk >= 0 && !ok && sel;
      ctx.fillStyle = ok ? 'rgba(140,233,154,.22)' : (bad ? 'rgba(255,107,107,.2)' : (sel ? 'rgba(107,79,160,.45)' : 'rgba(29,17,54,.75)'));
      ctx.fillRect(x, by+10, bw-2, 52);
      ctx.fillStyle = ok ? P.green : (bad ? P.red : (sel ? P.gold : '#3a2560'));
      ctx.fillRect(x, by+10, bw-2, 1); ctx.fillRect(x, by+61, bw-2, 1);
      this.drawPrint(i, x+(bw-2)/2, by+30, 12, ok ? P.green : (sel ? P.gold : '#c9bde8'));
      text(CAS.prints.pats[i].name, x+(bw-2)/2, by+48, {sc:fitSc(CAS.prints.pats[i].name, bw-6, 1), align:'center', color: sel?P.gold:'#6b4fa0'});
      this.printRects.push({x:x, y:by+10, w:bw-2, h:52, i:i});
    }
    // кнопка
    const py = by+70;
    const okSel = this.pickP >= 0;
    this.bRects3 = bottomButtons(py, 15, [
      {t:'НАЗАД', color:UI.text},
      {t:'СВЕРИТЬ', color: okSel?P.gold:'#5a4680', dis:!okSel}
    ], ptr);
    this.bBack = this.bRects3[0]; this.bChk2 = this.bRects3[1];
    this.suspY = py+20;
    this.d_susp(Math.min(py+20, H-26));
    vignette(0.6); crtOverlay(t);
  },
  /** Узор отпечатка: id — «лица», вид узора зависит от него */
  drawPrint(id, cx, cy, r, col){
    ctx.fillStyle = col;
    const n = 3 + (id % 4);
    ctx.fillStyle = col;
    for(let i=0;i<n;i++){
      const rr = r - i*Math.max(1, Math.floor(r/(n+1)));
      if(rr <= 1) break;
      circleOutline(cx, cy, rr, col);
    }
    // «жуткий» центр
    ctx.fillRect(Math.round(cx-1), Math.round(cy-2), 2, 4);
  },
  t_prints(x, y){
    if(this.bBack && x>this.bBack.x&&x<this.bBack.x+this.bBack.w&&y>this.bBack.y&&y<this.bBack.y+this.bBack.h){ this.pickP=-1; Snd.blip(); return; }
    if(this.bChk2 && x>this.bChk2.x&&x<this.bChk2.x+this.bChk2.w&&y>this.bChk2.y&&y<this.bChk2.y+this.bChk2.h){
      if(this.pickP < 0) return;
      this.printTries++;
      if(this.pickP === CAS.prints.door){
        this.printOk = this.pickP; Snd.fanfare(); flashScreen(P_GREEN(), .3); punch(.08);
        popText(W/2, this.bChk2.y-14, 'СОВПАЛО', CONFIG.P.green);
        this.printWin = 1.3;
        this.susp = Math.max(0, (this.susp||0) - 20);
      } else {
        this.susp = Math.min(100, (this.susp||0) + 14); Snd.bad(); shake(3);
        popText(W/2, this.bChk2.y-14, 'НЕ СОВПАЛО', CONFIG.P.red);
        this.pickP = -1;
      }
      return;
    }
    for(const r of (this.printRects||[]))
      if(x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h && this.printOk < 0){ this.pickP = r.i; Snd.blip(); return; }
  }
});
function P_GREEN(){ return CONFIG.P.green; }

/* ================= ПОКАЗАНИЯ И ЛОВЛЯ ЛЖИ ================= */
Object.assign(EP4, {
  on_people(){ this.pick = 0; this.confirm = -1; this.lie = 0; this.susp = 0; },
  u_people(dt){ if(this.shake2>0) this.shake2 -= dt; this.suspTick(dt); },
  d_people(){
    const P = CONFIG.P, t = this.t;
    this.d_noir(t);
    epBg(t, {top:'#141a2e', bot:'#241a30'});
    text('ПОКАЗАНИЯ', W/2, 6, {sc:1, align:'center', color:P.gold});
    // карточки людей
    const cw = Math.min(W-16, 220), cx0 = Math.round((W-cw)/2);
    const tiny = H < 260;
    const hh = tiny ? 28 : 44;
    let y = tiny ? 18 : 26;
    this.peopleRects = [];
    for(let i=0;i<CAS.people.length;i++){
      const p = CAS.people[i], sel = (this.pick===i);
      const h = hh;
      ctx.fillStyle = sel ? '#3a2b56' : '#1d1836';
      ctx.fillRect(cx0, y, cw, h);
      ctx.fillStyle = sel ? P.gold : '#3a2560';
      ctx.fillRect(cx0, y, 2, h);
      text(p.n, cx0+6, y+3, {sc:1, color:p.c});
      if(tiny) text('«'+p.says.slice(0,26)+'»', cx0+6, y+15, {sc:1, color:'#c9bde8'});
      else wrap(p.says, cw-12, 1).slice(0,2).forEach((l,k)=>text(l, cx0+6, y+15+k*11, {sc:1, color:'#c9bde8'}));
      if(this.lieOk && i === this.lie) pxCheck(cx0+cw-24, y+2, CONFIG.P.green);
      this.peopleRects.push({x:cx0, y:y, w:cw, h:h, i:i});
      y += h+4;
    }
    // панель противоречия
    const by2 = H-58;
    const pg = epPanel(6, by2, W-12, H<260?40:58, 'ПРОТИВОРЕЧИЕ', '#4a1f3d');
    if(this.confirm >= 0){
      text('Опровергнуть: '+CAS.people[this.confirm].n+'?', pg.x+4, pg.y+3, {sc:1, color:P.pink2});
      const bw = 60, bx = pg.x+4, by = pg.y+16;
      drawBtn(bx, by, bw, 14, 'ДА', {press:false, color:P.red});
      drawBtn(bx+bw+4, by, 60, 14, 'НЕТ', {press:false});
      this.bYes = {x:bx, y:by, w:bw, h:14};
      this.bNo  = {x:bx+bw+4, y:by, w:60, h:14};
    } else {
      const n = this.foundCount();
      text(n>=6 ? 'Камера говорит: 22:42 — кто-то вышел.' : 'Нужно минимум 6 улик.', pg.x+4, pg.y+3, {sc:1, color: n>=6?P.gold:'#6b4fa0'});
      if(n >= 6) text('Нажми на карточку, чтобы опровергнуть.', pg.x+4, pg.y+15, {sc:1, color:'#9b8ac0'});
      this.bYes = this.bNo = null;
    }
    vignette(0.5); crtOverlay(t);
  },
  t_people(x, y){
    if(this.bYes && x>this.bYes.x && x<this.bYes.x+this.bYes.w && y>this.bYes.y && y<this.bYes.y+this.bYes.h){
      if(this.confirm === this.lie){
        this.lieOk = 1; Snd.fanfare(); flashScreen(CONFIG.P.green,.3);
        this.confirm = -1; popText(W/2, 60, 'ЛОЖЬ ДОКАЗАНА', CONFIG.P.green);
        this.setScene('timeline');
      } else { this.flash('Это не тот. Посмотри на камеру.'); this.confirm = -1; }
      return;
    }
    if(this.bNo && x>this.bNo.x && x<this.bNo.x+this.bNo.w && y>this.bNo.y && y<this.bNo.y+this.bNo.h){ this.confirm = -1; Snd.blip(); return; }
    for(const r of (this.peopleRects||[])){
      if(x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        this.pick = r.i; Snd.blip();
        if(this.foundCount() >= 6){ this.confirm = r.i; }
        return;
      }
    }
  }
});

/* ================= ЛИНИЯ ВРЕМЕНИ ================= */
Object.assign(EP4, {
  on_timeline(){ this.pickEv = -1; this.tlChk = 0; },
  u_timeline(dt){ if(this.shake2>0) this.shake2 -= dt; this.suspTick(dt, .6); },
  d_timeline(){
    const P = CONFIG.P, t = this.t;
    const tiny = H < 260;                              // низкий экран — компактная вёрстка
    const rowH = tiny ? 12 : 18, capH = tiny ? 18 : 30;
    epBg(t, {top:'#1a1424', bot:'#2c1c2e'});
    text('ЛИНИЯ ВРЕМЕНИ', W/2, 6, {sc:1, align:'center', color:P.gold});
    if(!tiny) text('расставь события по порядку', W/2, 18, {sc:1, align:'center', color:'#6b4fa0'});
    // выбранные
    const boxY = tiny ? 18 : 38, bh = capH;
    this.tlRects = [];
    const cw = Math.min(W-16, 210), cx0 = Math.round((W-cw)/2);
    ctx.fillStyle = '#1d1836'; ctx.fillRect(cx0, boxY, cw, CAS.events.length*rowH+6);
    ctx.fillStyle = '#3a2560'; ctx.fillRect(cx0, boxY, cw, 1);
    for(let k=0;k<CAS.events.length;k++){
      const y = boxY+3+k*rowH;
      if(k < this.tl.length){
        const e = CAS.events[this.tl[k]];
        text((k+1)+'. '+e.t, cx0+4, y, {sc:1, color:P.pink2});
        if(!tiny) text(e.x, cx0+50, y, {sc:1, color:'#c9bde8'});
      } else {
        text((k+1)+'. ---------', cx0+4, y, {sc:1, color:'#4a3670'});
      }
      this.tlRects.push({x:cx0, y:y, w:cw, h:rowH, k:k});
    }
    // линия времени
    const ly = boxY + CAS.events.length*rowH + 12;
    ctx.fillStyle = '#4a3670'; ctx.fillRect(cx0+6, ly, cw-12, 1);
    for(let k=0;k<CAS.events.length;k++){
      const x = cx0 + 6 + (cw-13)*(k/Math.max(1,CAS.events.length-1));
      ctx.fillStyle = '#6b4fa0'; ctx.fillRect(Math.round(x), ly-3, 1, 7);
    }
    // оставшиеся события
    const rest = CAS.events.filter(e => this.tl.indexOf(e.id) < 0);
    const ry2 = ly + 10;
    text('ОСТАЛОСЬ: '+rest.length, cx0, ry2, {sc:1, color:'#6b4fa0'});
    const cols = tiny ? 3 : 3;
    const rw = Math.floor((cw-8-(cols-1)*2)/cols);
    const boxH2 = tiny ? 20 : 28;
    this.restRects = [];
    for(let i=0;i<rest.length;i++){
      const x = cx0+4 + (i%cols)*(rw+2), y = ry2+11 + Math.floor(i/cols)*(boxH2+2);
      const ev = rest[i];
      ctx.fillStyle = (this.pickEv===ev.id) ? '#3a2b56' : '#241d33';
      ctx.fillRect(x, y, rw, boxH2);
      ctx.fillStyle = (this.pickEv===ev.id) ? P.gold : '#3a2560';
      ctx.fillRect(x, y, rw, 1); ctx.fillRect(x, y+boxH2-1, rw, 1);
      text(ev.t, x+rw/2, y+2, {sc:1, align:'center', color:P.pink2});
      if(!tiny) wrap(ev.x, rw-4, 1).slice(0,2).forEach((l,k)=>text(l, x+rw/2, y+12+k*9, {sc:1, align:'center', color:'#9b8ac0'}));
      this.restRects.push({x:x, y:y, w:rw, h:boxH2, id:ev.id});
    }
    // кнопки
    const byy = H-18;
    this.bRects2 = bottomButtons(byy, 14, [
      {t:'ПРОВЕРИТЬ', color: this.tl.length===CAS.events.length?P.gold:UI.dim, dis:this.tl.length!==CAS.events.length},
      {t:'СБРОС', color:UI.text}
    ], ptr);
    this.bChk = this.bRects2[0]; this.bClr = this.bRects2[1];
    if(this.tlChk > 0 && this.tlChk < 1.4){
      ctx.globalAlpha = clamp(1-this.tlChk, 0, 1);
      text(this.lieOk? 'ЛИНИЯ СОШЛАСЬ — ИДИ К ФИНАЛУ' : 'НЕ ТА ХРОНОЛОГИЯ', W/2, 30, {sc:1, align:'center', color: this.lieOk?P.green:P.red});
      ctx.globalAlpha = 1;
    }
    vignette(0.5); crtOverlay(t);
  },
  t_timeline(x, y){
    if(this.bChk && x>this.bChk.x && x<this.bChk.x+this.bChk.w && y>this.bChk.y && y<this.bChk.y+this.bChk.h){
      if(this.tl.length !== CAS.events.length){ this.flash('Не все события расставлены'); return; }
      const good = this.tl.every((id, k) => id === k);
      if(good && this.lieOk){ Snd.fanfare(); this.tlChk = 0.001; setTimeout(()=>{},0); this.tlOk = true; }
      else { Snd.bad(); shake(2); this.tlChk = 0.001; }
      return;
    }
    if(this.bClr && x>this.bClr.x && x<this.bClr.x+this.bClr.w && y>this.bClr.y && y<this.bClr.y+this.bClr.h){
      this.tl = []; this.pickEv = -1; Snd.blip(); return;
    }
    for(const r of (this.tlRects||[])){
      if(x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        if(r.k < this.tl.length){                      // убрать из конца до этого места
          this.tl.length = r.k; Snd.blip();
        }
        return;
      }
    }
    for(const r of (this.restRects||[])){
      if(x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        this.pickEv = r.id; Snd.type();
        if(this.tl.length < CAS.events.length){
          this.tl.push(r.id);
          if(this.tl.length === CAS.events.length && this.tl.every((id,k)=>id===k)) Snd.coin();
        }
        return;
      }
    }
  },
  u_timeline2(dt){
    if(this.tlChk > 0){
      this.tlChk += dt;
      if(this.tlChk > 0.7 && this.tlOk){ this.tlOk = false; this.setScene('final'); }
    }
  }
});

/* ================= ФИНАЛЬНЫЕ ВОПРОСЫ ================= */
Object.assign(EP4, {
  on_final(){ this.q = 0; this.okT = 0; this.win = false; this.susp = 0; },
  u_final(dt){
    this.suspTick(dt, 1.4);
    if(this.shake2 > 0) this.shake2 -= dt;
    if(this.okT > 0){
      this.okT += dt;
      if(this.okT > 2.2 && !this.win){ this.win = true; Snd.fanfare(); flashScreen(CONFIG.P.gold,.35); }
      if(this.okT > 4.0) winLevel(LEVELS.indexOf(this));
    }
  },
  d_final(){
    const P = CONFIG.P, t = this.t;
    epBg(t, {top:'#0f1a18', bot:'#1c2a26'});
    // «досье»
    const pg = epPanel(6, 6, W-12, H<260?40:56, 'ДЕЛО №01 - ЗАКЛЮЧЕНИЕ', '#2d4a3d');
    const okN = this.ans.filter((a,i)=>a===CAS.answers[i]).length;
    text('Верных ответов: '+okN+' / 3', pg.x+4, pg.y+3, {sc:1, color: okN===3?P.green:P.gold});
    text(this.win ? 'ДЕЛО ЗАКРЫТО' : 'Ответь на все три вопроса', pg.x+4, pg.y+15, {sc:1, color:'#9b8ac0'});
    for(let i=0;i<3;i++){
      ctx.fillStyle = (this.ans[i]===CAS.answers[i]) ? P.green : (this.ans[i]>=0 ? P.red : '#3a2560');
      ctx.fillRect(pg.x+pg.w-8-i*7, pg.y+4, 4, 4);
    }
    const q = CAS.final[this.q];
    const qy = pg.y + pg.h + 6;
    text(q.q, W/2, qy, {sc:1, align:'center', color:P.gold});
    // варианты
    const bw = Math.min(W-24, 200), bx0 = Math.round((W-bw)/2);
    const step = H<260 ? 19 : 26, ah2 = H<260 ? 15 : 22;
    const y0 = qy + 12 + Math.max(0, Math.floor((H - 40 - (qy+12) - 4*step)/2));
    this.ansRects = [];
    for(let i=0;i<q.a.length;i++){
      const y = y0 + i*step;
      const sel = (this.ans[this.q]===i);
      const ok = sel && CAS.answers[this.q]===i;
      ctx.fillStyle = ok ? '#1d4a34' : (sel ? '#3a2b56' : '#1d1836');
      ctx.fillRect(bx0, y, bw, ah2);
      ctx.fillStyle = ok ? P.green : (sel ? P.gold : '#3a2560');
      ctx.fillRect(bx0, y, bw, 1); ctx.fillRect(bx0, y+ah2-1, bw, 1);
      text(q.a[i], bx0+bw/2, y+Math.round((ah2-8)/2), {sc:1, align:'center', color: ok?P.green:(sel?P.ink:'#c9bde8')});
      this.ansRects.push({x:bx0, y:y, w:bw, h:ah2, i:i});
    }
    this.d_susp(H-30);
    // прогресс по вопросам
    const py = H-16;
    text('ВОПРОС '+Math.min(this.q+1,CAS.answers.length)+' / '+CAS.answers.length, 6, py, {sc:1, color:'#6b4fa0'});
    if(this.q < CAS.answers.length-1){
      const nb = 92, nbx = W-nb-6;
      drawBtn(nbx, py-11, nb, 13, 'ДАЛЕЕ »', {press:false, color:P.gold});
      this.bNext = {x:nbx, y:py-11, w:nb, h:13};
    } else this.bNext = null;
    if(this.win){
      const a = 0.4+0.6*Math.abs(Math.sin(t*4));
      ctx.globalAlpha = a;
      text('ДЕЛО ЗАКРЫТО.', W/2, 26, {sc:2, align:'center', color:P.green});
      ctx.globalAlpha = 1;
      for(let i=0;i<10;i++) fx(rnd(10,W-10), 20, 1, i%2?P.gold:P.green, 40, 1.4);
    }
    vignette(0.5); crtOverlay(t);
  },
  t_final(x, y){
    if(this.bNext && x>this.bNext.x && x<this.bNext.x+this.bNext.w && y>this.bNext.y && y<this.bNext.y+this.bNext.h){
      if(this.ans.every(a=>a>=0)){ this.q = 0; Snd.blip(); }   // можно вернуться и передумать
      return;
    }
    for(const r of (this.ansRects||[])){
      if(x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        this.ans[this.q] = r.i; Snd.type();
        if(CAS.answers[this.q] === r.i){
          Snd.coin(); fx(x, y, 5, CONFIG.P.green, 40, .4);
          this.susp = Math.max(0, (this.susp||0) - 12);
          if(this.q < CAS.answers.length-1) this.q++;
          else { this.okT = 0.001; }
        } else { Snd.bad(); shake(2); this.susp = Math.min(99, (this.susp||0)+8); }
        return;
      }
    }
  }
});

/* --- простые пиктограммы предметов --- */
function drawObjGlyph(key, cx, cy, col){
  const p = (a,b,w,h)=>ctx.fillRect(Math.round(cx-8+a), Math.round(cy-6+b), w, h);
  ctx.fillStyle = col;
  if(key==='phone'){ p(-3,-5,6,10); ctx.fillStyle='#241445'; p(-2,-4,4,7); }
  else if(key==='clock'){ ctx.beginPath(); ctx.arc(cx,cy,5,0,7); ctx.strokeStyle=col; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle=col; p(-1,-3,1,3); p(0,0,2,1); }
  else if(key==='cam'){ p(-6,-2,12,6); ctx.fillStyle='#241445'; p(-2,-1,5,4); p(-7,-4,3,2); }
  else if(key==='box'){ p(-6,-3,12,8); ctx.fillStyle='#241445'; p(-6,-3,12,1); p(-1,-3,2,8); }
  else if(key==='note'){ p(-4,-5,8,10); ctx.fillStyle='#241445'; p(-3,-4,6,1); p(-3,-2,5,1); p(-3,0,6,1); p(-3,2,4,1); }
  else if(key==='door'){ p(-5,-6,10,12); ctx.fillStyle='#241445'; p(-2,-3,4,4); p(2,1,1,1); }
  else if(key==='pic'){ p(-6,-5,12,10); ctx.fillStyle='#241445'; p(-5,-4,10,8); p(-1,2,3,3); p(-4,-3,2,2); }
}
