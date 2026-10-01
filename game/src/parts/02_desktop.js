/* ==========================================================================
   ЧАСТЬ 2 · РАБОЧИЙ СТОЛ
   Экран-ноутбук: обои, разбросанные .exe, окна, «пуск», часы, курсор.
   ========================================================================== */

G.win = null;

/* --- обои --- */
function drawWallpaper(t){
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#2b1550'); g.addColorStop(0.55,'#1b1035'); g.addColorStop(1,'#150a2a');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  nebulaBg(t, {c1:'#3a1f66', c2:'#1b3a6b', c3:'#5a1f4a', seed: 3});
  // северное сияние
  if(FXQ > .5){
    ctx.globalAlpha = .07;
    for(let b=0;b<3;b++){
      ctx.fillStyle = ['#6bc7ff','#8ce99a','#c9a0ff'][b];
      for(let x=0;x<W;x+=2){
        const y = H*(0.18 + b*0.06) + Math.sin(x*0.03 + t*.5 + b)*7;
        ctx.fillRect(x, Math.round(y), 2, Math.round(2 + 3*Math.sin(x*0.017 + t)));
      }
    }
    ctx.globalAlpha = 1;
  }
  // дальний город (силуэт)
  ctx.fillStyle = 'rgba(23,12,46,.7)';
  const R2 = mulberry32(51);
  const farBase = H - 30;
  for(let x=-4;x<W;x+=11){
    const bh = 8 + Math.round(R2()*20);
    ctx.fillRect(x, farBase-bh, 10, Math.min(bh+2, H - (farBase-bh)));
  }
  stars(t);
  motes(t, 20, '#c9bde8', .3);
  // падающая звезда
  const ph = (t*0.10)%1;
  if(ph < 0.10){
    const k = ph/0.10;
    const sx = W*0.15 + k*W*0.7, sy = H*0.10 + k*H*0.22;
    ctx.fillStyle = 'rgba(255,246,232,'+(1-k).toFixed(2)+')';
    ctx.fillRect(Math.round(sx), Math.round(sy), 2, 1);
    ctx.fillRect(Math.round(sx)-2, Math.round(sy)-1, 2, 1);
  }
  // сердце-водяной знак
  ctx.globalAlpha = 0.10; heart(Math.round(W/2)-20, Math.round(H*0.30)-15, 5, '#ff5d8f'); ctx.globalAlpha = 1;
  // город внизу — не вылезает за границы экрана
  const baseY = H - 30;
  const R = mulberry32(99);
  let x = -6;
  while(x < W){
    const bw = 14 + Math.floor(R()*20), bh = 18 + Math.floor(Math.min(R()*20, 20));
    ctx.fillStyle = '#170c2e'; ctx.fillRect(x, baseY-bh, bw, bh+4);
    ctx.fillStyle = '#221541'; ctx.fillRect(x, baseY-bh, bw, 1);
    for(let wy = baseY-bh+4; wy < baseY-5; wy += 6){
      for(let wx = x+3; wx < x+bw-3; wx += 5){
        if(R() > 0.45) continue;
        const flick = R() < 0.10 ? (Math.sin(t*3+wx*0.7) > 0.6 ? 1 : 0.2) : 1;
        ctx.globalAlpha = flick;
        ctx.fillStyle = R() < 0.28 ? '#ffd166' : '#7ee0a8';
        ctx.fillRect(wx, wy, 2, 3);
        ctx.globalAlpha = 1;
      }
    }
    x += bw + 3;
  }
  ctx.fillStyle = '#100820'; ctx.fillRect(0, baseY+2, W, H-baseY-2);
}

/* --- содержимое окна «карта прогресса» --- */
function mapWindowContent(win){
  const r = Win.inner(win);
  const P = CONFIG.P;
  const n = NODE_META.length;
  const cols = clamp(Math.floor(r.w/74), 2, 5);
  const rows = Math.ceil(n/cols);
  const headH = 15, footH = 15;
  const gw = r.w, gh = r.h - headH - footH;
  const cw = gw/cols, ch = gh/rows;
  const showLabels = ch >= 44;                    // иначе подписи не влезают — показываем только выбранную
  // шапка: сердечки прогресса
  const done = heartsDone();
  text('ЛЮБОВЬ УСТАНОВЛЕНА: '+done+'/'+NH, r.x+4, r.y+1, {sc:1, color:P.dim});
  drawBar(r.x+4, r.y+11, r.w-8, 5, done/NH, P.pink);
  // сетка узлов
  win.nodesXY = [];
  for(let i=0;i<n;i++){
    const c = i%cols, rr = Math.floor(i/cols);
    const nx = Math.round(r.x + cw*(c+0.5)), ny = Math.round(r.y + headH + ch*(rr+0.5));
    win.nodesXY.push({x:nx, y:ny, i:i});
    const locked = i<NH ? false : done<NH;
    const got = i<NH ? G.hearts[i] : false;
    const sel = (i===G.sel);
    const R2 = Math.min(15, Math.floor(Math.min(cw, ch)/2) - 3);
    const bob = sel ? Math.sin(win.t*5)*2 : 0;
    const x = nx, y = Math.round(ny+bob);
    if(i===NH && done===NH){           // письмо пульсирует
      const a = 0.25+0.35*Math.abs(Math.sin(win.t*2.5));
      ctx.fillStyle = 'rgba(255,209,102,'+a.toFixed(2)+')'; ctx.fillRect(x-R2-4, y-R2-4, (R2+4)*2, (R2+4)*2);
    }
    if(sel){ ctx.fillStyle='rgba(255,209,102,.16)'; ctx.fillRect(x-R2-3,y-R2-3,(R2+3)*2,(R2+3)*2); }
    ctx.fillStyle = locked ? '#1d1136' : (got ? '#4a1f3d' : '#2d1a54');
    ctx.fillRect(x-R2, y-R2, R2*2, R2*2);
    ctx.fillStyle = locked ? '#3a2560' : (sel?P.gold:(got?P.pink:'#6b4fa0'));
    ctx.fillRect(x-R2,y-R2,R2*2,2); ctx.fillRect(x-R2,y+R2-2,R2*2,2);
    ctx.fillRect(x-R2,y-R2,2,R2*2); ctx.fillRect(x+R2-2,y-R2,2,R2*2);
    drawNodeIcon(i, x, y, locked ? '#4a3670' : (got?P.pink2:P.gold));
    if(showLabels){
      const nm = NODE_META[i].name;
      text(nm, x, y+R2+2, {sc:1, align:'center', color: locked ? '#5a4680' : (sel?P.ink:P.dim)});
    }
    if(got) heart(x+R2-3, y-R2-3, 1, P.pink);
  }
  // подвал
  const sub = G.sel===NH ? 'ОТКРЫТЬ ПИСЬМО ♥' : (G.sel<NH?NODE_META[G.sel].sub:'');
  const foot = showLabels ? sub : (G.sel<NODE_META.length ? NODE_META[G.sel].name + ' — ' + sub : sub);
  text(foot, Math.round(r.x+r.w/2), r.y+r.h-13, {sc:1, align:'center', color: showLabels?P.dim:P.ink});
}

/* --- системное окошко с кнопкой ОК --- */
function openSys(title, lines, kind){
  const w = Win.open('sys', title, {w: Math.min(W-30, 190), h: 74 + lines.length*11});
  w.data.lines = lines;
  w.data.kind = kind || 'info';
  return w;
}

/* ==========================================================================
   ЭКРАН: РАБОЧИЙ СТОЛ
   ========================================================================== */
G.screens.desktop = {
  enter(){
    this.t = 0;
    if(!this.icons) this.buildIcons();
    this.layout();
    for(const it of this.icons) it.anim = 0;
    this.sel = -1; this.lastSel = -1; this.lastT = -9;
    this.startOpen = false; this.startSel = 0;
    this.curSeen = false; this.hover = -1; this.pressBtn = null;
    this.lastPY = ptr.y;
    if(G.openMap){ G.openMap = false; if(!G.win) Win.open('map', 'ДОСТИЖЕНИЯ.exe', {w:Math.min(W-8,224), h:Math.min(H-30,320)}); }
  },
  buildIcons(){
    const list = [];
    const files = ['SHIFR.exe','RITM.exe','VOSPOMINANIYA.exe','LABIRINT.exe','CODE.exe','RUKA.exe','RITM_BONUS.exe','SERDCA.exe','MAZE_BONUS.exe','RADUZHNY_ZONT.exe','CODE_BONUS.exe','PRINT.exe'];
    for(let i=0;i<NH;i++){
      list.push({kind:'level', idx:i, icon:i, name: files[i] || ('LEVEL'+i+'.exe'), node:i});
    }
    list.push({kind:'letter', icon:7, name:'LOVE.exe', node:7});
    list.push({kind:'readme', icon:'txt', name:'README.txt'});
    list.push({kind:'bin', icon:'bin', name:'КОРЗИНА'});
    this.icons = list;
    this.jit = []; const R = mulberry32(5);
    for(let i=0;i<24;i++) this.jit.push(R());
  },
  layout(){
    const items = this.icons;
    const cols = W>=H ? 3 : 2;
    const rows = Math.ceil(items.length/cols);
    const padX = 6, top = 8, bottom = H-32;
    const cw = (W-padX*2)/cols, chh = (bottom-top)/rows;
    for(let i=0;i<items.length;i++){
      const c = i%cols, r = Math.floor(i/cols);
      const jx = (this.jit[i%this.jit.length]-0.5)*Math.min(12, cw*0.30);
      const jy = (this.jit[(i+5)%this.jit.length]-0.5)*Math.min(9, chh*0.20);
      const it = items[i];
      it.tx = Math.round(padX + cw*(c+0.5) + jx);
      it.ty = Math.round(top + chh*r + 15 + jy);
      it.delay = 0.05*i;
      if(it.anim===undefined) it.anim = 0;
    }
  },
  iconAt(x,y){
    for(let i=this.icons.length-1;i>=0;i--){
      const it = this.icons[i];
      if(Math.abs(x-it.tx) < 15 && y > it.ty-13 && y < it.ty+22) return i;
    }
    return -1;
  },
  update(dt){
    this.t += dt;
    // иконки «падают» на место
    for(const it of this.icons){ if(it.anim < 1) it.anim = Math.min(1, it.anim + dt*2.6); }
    Win.update(dt);
    drawRipples(dt);
    // перетаскивание окна за шапку
    const dy = ptr.y - this.lastPY; this.lastPY = ptr.y;
    if(ptr.dx || dy) this.curSeen = true;
    if(this.drag && G.win && ptr.down){
      G.win.x = clamp(G.win.x + ptr.dx, -G.win.w+30, W-30);
      G.win.y = clamp(G.win.y + dy, 8, H-26);
      G.win.from = null;
    }
    // отложенный запуск уровня (окно загрузки)
    if(G.pending){
      G.pending.t += dt;
      if(G.pending.t > 1.05){
        const p = G.pending; G.pending = null;
        if(G.win && G.win.kind==='load') G.win = null;
        if(p.type==='level') startLevel(p.idx);
        else if(p.type==='letter') go('letter');
      }
    }
    // курсор поверх
    this.hover = this.iconAt(ptr.x, ptr.y);
  },
  draw(){
    drawWallpaper(this.t);
    // иконки
    for(let i=0;i<this.icons.length;i++){
      const it = this.icons[i];
      const k = clamp((it.anim*1.6 - it.delay), 0, 1);
      const e = k<1 ? 1-Math.pow(1-k,3) : 1;
      const yy = Math.round(it.ty - (1-e)*70);
      const sel = (this.sel===i);
      const hov = (this.hover===i);
      ctx.globalAlpha = clamp(e*1.4,0,1);
      if(sel || hov){
        ctx.fillStyle = sel ? 'rgba(255,209,102,.22)' : 'rgba(107,79,160,.16)';
        ctx.fillRect(it.tx-15, yy-13, 30, 34);
      }
      drawFileIcon(it.icon, it.tx, yy, {sel:sel});
      if(sel){
        ctx.fillStyle = 'rgba(255,209,102,.75)';
        ctx.fillRect(it.tx-15, yy-13, 30, 1); ctx.fillRect(it.tx-15, yy+21, 30, 1);
      }
      // подпись (по ширине колонки, чтобы не наезжать на соседей)
      const icols = W>=H ? 3 : 2, icw = (W - 12)/icols;
      const lsc = fitSc(it.name, icw-2, 1);
      const tw = textW(it.name, lsc);
      if(sel){ ctx.fillStyle = '#3a2560'; ctx.fillRect(Math.round(it.tx-tw/2)-1, yy+22, tw+2, 11); }
      text(it.name, it.tx, yy+23, {sc:lsc, align:'center', color: sel?'#fff6e8':'#e6dcf7', shadow:'rgba(10,6,22,.9)'});
      // замок на закрытом письме
      if(it.kind==='letter' && heartsDone()<NH){
        ctx.fillStyle = '#5a4680';
        ctx.fillRect(it.tx+6, yy-2, 6, 5); ctx.fillRect(it.tx+7, yy-4, 4, 2);
      }
      if(it.kind==='level' && G.hearts[it.idx]) heart(it.tx+8, yy-6, 1, CONFIG.P.pink);
      ctx.globalAlpha = 1;
    }
    // окно
    if(G.win) this.drawWindow(G.win);
    // статус-строка и таскбар
    this.drawStatus();
    this.drawTaskbar();
    // меню «Пуск»
    if(this.startOpen) this.drawStart();
    // курсор
    if(this.curSeen || IS_TOUCH) drawCursor(ptr.x, ptr.y, !!G.pending, this.t);
    crtOverlay(this.t);
    bezel();
    if(G.toastT>0){ /* тосты рисует главный цикл */ }
  },
  drawWindow(win){
    if(win.kind==='map'){ drawWinFrame(win, true); mapWindowContent(win); return; }
    if(win.kind==='load'){
      drawWinFrame(win, true);
      const r = Win.inner(win);
      const p = G.pending ? clamp(G.pending.t/1.0,0,1) : 1;
      drawLoader(r.x, r.y, r.w, r.h, win.title, p, win.t);
      return;
    }
    if(win.kind==='sys'){
      drawWinFrame(win, true);
      const r = Win.inner(win);
      const lines = win.data.lines||[];
      let yy = r.y+4;
      for(const l of lines){ text(l, r.x+4, yy, {sc:1, color:UI.text}); yy += 11; }
      const bw = 40, bx = Math.round(r.x+r.w/2-bw/2), by = r.y+r.h-16;
      drawBtn(bx, by, bw, 13, 'OK', {press: this.btnDown==='ok'});
      win.data.okRect = {x:bx, y:by, w:bw, h:13};
      return;
    }
    if(win.kind==='readme'){
      drawWinFrame(win, true);
      const r = Win.inner(win);
      const lines = wrap('Привет, Мария. Это не вирус и не программа — просто я. Я написал её, потому что словами получается хуже.', r.w-8, 1);
      let yy = r.y+4;
      for(const l of lines){ text(l, r.x+4, yy, {sc:1, color:UI.text}); yy += 11; }
      if(bothP()) ctx.drawImage(IMG.him, r.x+r.w-30, r.y+r.h-30, 26, 26);
      text('— '+CONFIG.him, r.x+4, r.y+r.h-14, {sc:1, color:CONFIG.P.sky});
      return;
    }
    if(win.kind==='about'){
      drawWinFrame(win, true);
      const r = Win.inner(win);
      text('PRINT I LOVE U OS', r.x+4, r.y+4, {sc:1, color:CONFIG.P.gold});
      text('версия 1.0 (сборка «для Марии»)', r.x+4, r.y+16, {sc:1, color:UI.dim});
      text('Собрано вручную, на коленке,', r.x+4, r.y+30, {sc:1, color:UI.text});
      text('но с любовью и без багов.', r.x+4, r.y+41, {sc:1, color:UI.text});
      text('(ну, почти.)', r.x+4, r.y+55, {sc:1, color:UI.dim});
      return;
    }
    drawWinFrame(win, true);
  },
  drawStatus(){
    const y = H-28, P = CONFIG.P;
    ctx.fillStyle = 'rgba(8,4,18,.55)'; ctx.fillRect(0, y, W, 12);
    ctx.fillStyle = 'rgba(255,246,232,.10)'; ctx.fillRect(0, y, W, 1);
    const sTxt = 'Собрано сердец: ' + storyDone() + ' / ' + CH;
    const rTxt = finaleReady() ? 'ФИНАЛ ОТКРЫТ' : ('БОНУС: ' + arcDone() + ' / ' + AR_N);
    const rW = textW(rTxt, 1) + 8;
    heart(5, y+3, 1, P.pink);
    text(sTxt, 15, y+2, {sc:fitSc(sTxt, W - rW - 20, 1), color: storyDone()>=CH ? P.green : UI.text});
    if(finaleReady()){
      const a = 0.45+0.55*Math.abs(Math.sin(this.t*3));
      ctx.globalAlpha = a;
      text(rTxt, W-5, y+2, {sc:1, align:'right', color:P.gold});
      ctx.globalAlpha = 1;
    } else {
      text(rTxt, W-5, y+2, {sc:1, align:'right', color:UI.dim});
    }
  },
  drawTaskbar(){
    const y = H-16;
    // стеклянная панель задач
    ctx.fillStyle = 'rgba(8,4,18,.55)'; ctx.fillRect(0, y-1, W, 17);
    const gg = ctx.createLinearGradient(0, y, 0, y+16);
    gg.addColorStop(0, 'rgba(107,79,160,.34)');
    gg.addColorStop(1, 'rgba(29,17,54,.5)');
    ctx.fillStyle = gg; ctx.fillRect(0, y, W, 16);
    ctx.fillStyle = 'rgba(255,246,232,.22)'; ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = 'rgba(255,246,232,.07)'; ctx.fillRect(0, y+1, W, 1);
    // ПУСК
    const pw = 34;
    drawBtn(2, y+2, pw, 12, 'ПУСК', {press:this.startOpen, color: this.startOpen?CONFIG.P.gold:UI.text});
    this.startRect = {x:2, y:y+2, w:pw, h:12};
    // кнопка открытого окна
    if(G.win){
      const bw2 = 62, bx = pw+6;
      drawBtn(bx, y+2, bw2, 12, (G.win.title||'ОКНО').slice(0,9), {press:false});
      this.winBtnRect = {x:bx, y:y+2, w:bw2, h:12};
    } else this.winBtnRect = null;
    // трей
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
    const sep = Math.floor(this.t)%2 ? ':' : ' ';
    const tt = hh+sep+mm;
    const tw = textW(tt,1);
    text(tt, W-4, y+3, {sc:1, align:'right', color:UI.text});
    // сердца / музыка / звук (справа налево, без наложений)
    let tx = W-4-tw-10;
    // динамик
    ctx.fillStyle = Snd.on ? CONFIG.P.gold : '#5a4680';
    ctx.fillRect(tx-9, y+5, 2, 6); ctx.fillRect(tx-7, y+4, 2, 8); ctx.fillRect(tx-5, y+2, 2, 12);
    this.sndRect = {x:tx-12, y:y+1, w:12, h:14};
    // нота (музыка)
    ctx.fillStyle = Snd.musicOn ? CONFIG.P.green : '#5a4680';
    ctx.fillRect(tx-23, y+8, 2, 6); ctx.fillRect(tx-21, y+7, 5, 2); ctx.fillRect(tx-23, y+4, 2, 4);
    this.musRect = {x:tx-26, y:y+1, w:12, h:14};
  },
  drawStart(){
    const items = this.startItems();
    const w = 96, h = items.length*14 + 8;
    const x = 2, y = H-16-h-2;
    ctx.fillStyle = UI.dark; ctx.fillRect(x-1, y-1, w+2, h+2);
    ctx.fillStyle = UI.face; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = CONFIG.P.pink; ctx.fillRect(x, y, 3, h);
    for(let i=0;i<items.length;i++){
      const it = items[i];
      const iy = y+4+i*14;
      const hov = ptr.x>=x && ptr.x<=x+w && ptr.y>=iy && ptr.y<=iy+13;
      if(hov){ ctx.fillStyle = 'rgba(107,79,160,.45)'; ctx.fillRect(x+3, iy, w-3, 13); this.startSel = i; }
      text(it.t, x+7, iy+2, {sc:1, color: hov? '#fff6e8' : UI.dim});
    }
    this.startRectItems = {x:x, y:y, w:w, h:h, n:items.length};
  },
  startItems(){
    return [
      {t:'ДОСТИЖЕНИЯ.exe', f:()=>{ this.openMapWin(); }},
      {t:'О ПРОГРАММЕ', f:()=>{ Win.open('about','О ПРОГРАММЕ',{w:170,h:82}); }},
      {t:'МУЗЫКА: '+(Snd.musicOn?'ВКЛ':'ВЫКЛ'), f:()=>{ Snd.musicOn = !Snd.musicOn; Snd.blip(); }},
      {t:'ЗВУК: '+(Snd.on?'ВКЛ':'ВЫКЛ'), f:()=>{ Snd.on = !Snd.on; Snd.blip(); }},
      {t:'НАЧАТЬ ЗАНОВО', f:()=>{ G.hearts = new Array(NH).fill(false); save(); G.fails = {}; Snd.bad(); Win.open('map','ДОСТИЖЕНИЯ.exe',{w:Math.min(W-8,224), h:Math.min(H-30,320)}); }}
    ];
  },
  openMapWin(){
    if(G.win && G.win.kind==='map'){ Win.close(); return; }
    Win.open('map','ДОСТИЖЕНИЯ.exe',{w:Math.min(W-8,224), h:Math.min(H-30,320)});
  },
  launch(it, dbl){
    if(it.kind==='level'){
      if(!dbl){                                   // один тап — окно прогресса с выбранным уровнем
        Snd.blip(); ripple(it.tx, it.ty);
        G.sel = it.idx;
        if(G.win && G.win.kind==='map'){ Snd.blip(); }
        else Win.open('map','ДОСТИЖЕНИЯ.exe',{w:Math.min(W-8,224), h:Math.min(H-30,320), from:{x:it.tx-20,y:it.ty-16,w:40,h:32}});
        return;
      }
      Snd.coin(); ripple(it.tx, it.ty);
      G.pending = {type:'level', idx:it.idx, t:0};
      Win.open('load', 'ЗАПУСК ' + NODE_META[it.idx].name + '.exe', {w:170, h:56, from:{x:it.tx-20, y:it.ty-16, w:40, h:32}});
    } else if(it.kind==='letter'){
      if(heartsDone()>=NH){
        Snd.fanfare(); G.pending = {type:'letter', t:0};
        Win.open('load','ПЕЧАТЬ ПИСЬМА...',{w:170,h:56,from:{x:it.tx-20,y:it.ty-16,w:40,h:32}});
      } else {
        Snd.bad(); shake(3);
        openSys('ОТКАЗАНО', ['Письмо запечатано.','Собери все '+NH+' сердец,','тогда распечатаю.']);
      }
    } else if(it.kind==='readme'){
      Snd.blip(); Win.open('readme','README.txt',{w:Math.min(W-20,200), h:104, from:{x:it.tx-20,y:it.ty-16,w:40,h:32}});
    } else if(it.kind==='bin'){
      Snd.bad(); shake(2);
      openSys('КОРЗИНА', ['Сердца удалять нельзя.','Я проверял.']);
    }
  },
  /* --- ввод --- */
  key(k){
    if(k==='Escape'){ if(this.startOpen){ this.startOpen=false; return; } if(G.win){ Win.close(); return; } }
    if(k==='m'||k==='M'||k==='ь'||k==='Ь'){ return; }   // обрабатывается в G.onKey
    if(k==='n'||k==='N'||k==='т'||k==='Т'){ return; }
    if(G.win && G.win.kind==='map'){
      if(G.screens.map.key){ G.screens.map.key(k); return; }   // новая карта сама разбирается
      const cols = W>=H ? 5 : 3;
      if(k==='ArrowLeft'){ G.sel = (G.sel+NODE_META.length-1)%NODE_META.length; Snd.blip(); }
      if(k==='ArrowRight'){ G.sel = (G.sel+1)%NODE_META.length; Snd.blip(); }
      if(k==='ArrowUp'){ G.sel = (G.sel+NODE_META.length-cols)%NODE_META.length; Snd.blip(); }
      if(k==='ArrowDown'){ G.sel = (G.sel+cols)%NODE_META.length; Snd.blip(); }
      if(k===' '||k==='Enter'){ G.screens.map.choose(); }
      return;
    }
    if(G.win && G.win.kind==='sys'){ if(k===' '||k==='Enter'){ Win.close(); } return; }
    // по иконкам
    const cols = W>=H ? 5 : 3;
    if(k==='ArrowLeft'){ this.sel = (this.sel<0?0:(this.sel+this.icons.length-1)%this.icons.length); Snd.blip(); }
    if(k==='ArrowRight'){ this.sel = (this.sel<0?0:(this.sel+1)%this.icons.length); Snd.blip(); }
    if(k==='ArrowUp'){ this.sel = Math.max(0,(this.sel<0?0:this.sel)-cols); Snd.blip(); }
    if(k==='ArrowDown'){ this.sel = Math.min(this.icons.length-1,(this.sel<0?0:this.sel)+cols); Snd.blip(); }
    if(k===' '||k==='Enter'){ if(this.sel>=0) this.launch(this.icons[this.sel], true); else this.openMapWin(); }
  },
  tap(x,y){
    ripple(x,y);
    // меню «Пуск»
    if(this.startOpen){
      const s = this.startRectItems;
      if(s && x>=s.x && x<=s.x+s.w && y>=s.y && y<=s.y+s.h){
        const i = clamp(Math.floor((y-s.y-4)/14), 0, s.n-1);
        this.startOpen = false;
        const items = this.startItems(); items[i] && items[i].f();
        return;
      }
      if(this.startRect && x>=this.startRect.x-2 && x<=this.startRect.x+this.startRect.w+2 && y>=this.startRect.y-4 && y<=this.startRect.y+this.startRect.h+2){ this.startOpen=false; Snd.blip(); return; }
      this.startOpen = false;
      Snd.blip();
      return;
    }
    if(this.startRect && x>=this.startRect.x && x<=this.startRect.x+this.startRect.w && y>=this.startRect.y && y<=this.startRect.y+this.startRect.h){
      this.startOpen = true; Snd.blip(); return;
    }
    if(this.sndRect && x>=this.sndRect.x && x<=this.sndRect.x+this.sndRect.w && y>=this.sndRect.y && y<=this.sndRect.y+this.sndRect.h){
      Snd.on = !Snd.on; Snd.blip(); G.toast = Snd.on?'ЗВУК ВКЛ':'ЗВУК ВЫКЛ'; G.toastT=1.2; return;
    }
    if(this.musRect && x>=this.musRect.x && x<=this.musRect.x+this.musRect.w && y>=this.musRect.y && y<=this.musRect.y+this.musRect.h){
      Snd.musicOn = !Snd.musicOn; Snd.blip(); G.toast = Snd.musicOn?'МУЗЫКА ВКЛ':'МУЗЫКА ВЫКЛ'; G.toastT=1.2; return;
    }
    // окно
    if(G.win){
      if(Win.closeHit(G.win, x, y)){ Win.close(); return; }
      if(Win.titleHit(G.win, x, y)){ this.drag = true; return; }
      if(Win.hit(G.win, x, y)){
        if(G.win.kind==='map'){
          if(G.win.onTap){ G.win.onTap(x,y); return; }        // новая карта (вкладки + узлы)
          const ns = G.win.nodesXY || [];
          for(const nn of ns){ if(Math.abs(x-nn.x)<18 && Math.abs(y-nn.y)<22){ G.sel = nn.i; Snd.blip(); G.screens.map.choose(); return; } }
          return;
        }
        if(G.win.kind==='sys'){
          const r = G.win.data.okRect;
          if(r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ Win.close(); Snd.blip(); }
          return;
        }
        return;
      }
    }
    if(this.winBtnRect && x>=this.winBtnRect.x && x<=this.winBtnRect.x+this.winBtnRect.w && y>=this.winBtnRect.y && y<=this.winBtnRect.y+this.winBtnRect.h){
      Win.close(); return;
    }
    // иконки
    const i = this.iconAt(x,y);
    if(i>=0){
      Snd.blip();
      const now = this.t;
      const dbl = (this.sel===i && now-this.lastT < 0.5);
      this.sel = i;
      if(dbl) this.lastT = -9; else this.lastT = now;
      this.launch(this.icons[i], dbl);
      return;
    }
    this.sel = -1;
  },
  tapUp(){ this.drag = false; }
};

/* отпускание пальца — прекращаем тащить окно */
addEventListener('pointerup', ()=>{ if(G.screens.desktop) G.screens.desktop.drag = false; });
