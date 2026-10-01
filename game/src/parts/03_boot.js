/* ==========================================================================
   ЧАСТЬ 3 · ЗАГРУЗКА HeartOS + ВХОД В СИСТЕМУ
   ========================================================================== */

const BOOT_LINES = [
  'Инициализация системы любовного назначения v1.0...',
  'Загрузка самых тёплых воспоминаний...'
];
const BOOT_DONE = 'Готово! Нажмите [Пробел], чтобы войти в моё сердце.';

G.screens.boot = {
  enter(){ this.t = 0; this.li = 0; this.ch = 0; this.done = false; this.gone = false; this.bar = 0; },
  update(dt){
    this.t += dt;
    if(this.li < BOOT_LINES.length){
      const line = BOOT_LINES[this.li];
      this.ch += dt*42;
      if(this.ch >= line.length){
        this.ch = 0; this.li++;
        Snd.note(1200, 0.03, 'square', 0.035);
        if(this.li < BOOT_LINES.length) this.ch -= 0.6;      // пауза между строками
      }
    } else {
      this.bar = Math.min(1, this.bar + dt*0.75);
      if(this.bar >= 1 && !this.done){ this.done = true; Snd.coin(); }
    }
  },
  finish(){
    if(this.gone) return; this.gone = true;
    Snd.unlock(); go('desktop');
  },
  key(k){ if(k===' '||k==='Enter'||k==='Escape'){ if(this.done) this.finish(); else this.bar = 1; } },
  tap(){ if(this.done) this.finish(); else this.bar = 1; },
  draw(){
    ctx.fillStyle = '#08061a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = 'rgba(76,201,240,.05)';
    for(let y=0;y<H;y+=3) ctx.fillRect(0,y,W,1);
    const cx = Math.round(W/2);
    // заголовок системы
    const a0 = 0.55+0.45*Math.abs(Math.sin(this.t*1.6));
    ctx.globalAlpha = a0;
    text('HeartOS', cx, 16, {sc:2, align:'center', color:CONFIG.P.pink});
    ctx.globalAlpha = 1;
    text('v1.0', cx, 34, {sc:1, align:'center', color:UI.dim});
    heart(cx, 46, 1, CONFIG.P.pink);
    // строки
    let y = Math.round(H*0.34);
    for(let i=0;i<Math.min(this.li+1, BOOT_LINES.length);i++){
      const full = BOOT_LINES[i];
      const s = (i===this.li) ? full.slice(0, Math.max(0, Math.floor(this.ch))) : full;
      const rows = wrap(s, W-16, 1);
      rows.forEach((l,k)=>{
        text(l, cx, y, {sc:1, align:'center', color:'#c9bde8'});
        if(i===this.li && k === rows.length-1 && Math.floor(this.t*3)%2===0){
          ctx.fillStyle = '#c9bde8';
          ctx.fillRect(cx + Math.round(textW(l, 1)/2) + 1, y, 5, 1);
        }
        y += 12;
      });
    }
    // прогресс
    if(this.li >= BOOT_LINES.length){
      drawBar(10, y+4, W-20, 7, this.bar, CONFIG.P.pink);
      text(Math.round(this.bar*100)+'%', cx, y+13, {sc:1, align:'center', color:CONFIG.P.gold});
    }
    // приглашение
    if(this.done){
      const rows = wrap(BOOT_DONE, W-24, 1);
      const bh = 10 + rows.length*12 + 12;
      const yy = Math.round(H*0.62);
      ctx.fillStyle = 'rgba(18,10,36,.78)';
      ctx.fillRect(6, yy-4, W-12, bh);
      ctx.fillStyle = CONFIG.P.pink; ctx.fillRect(6, yy-4, 2, bh);
      const a = 0.5+0.5*Math.abs(Math.sin(this.t*3));
      ctx.globalAlpha = a;
      rows.forEach((l,i)=>text(l, cx, yy+2+i*12, {sc:1, align:'center', color:CONFIG.P.green}));
      ctx.globalAlpha = 1;
      text(IS_TOUCH ? 'ТАПНИ, ЧТОБЫ ВОЙТИ' : '[ ПРОБЕЛ ]', cx, yy+bh-6, {sc:1, align:'center', color:CONFIG.P.gold});
    }
    heart(W-24, H-26, 2, 'rgba(255,93,143,'+(0.35+0.35*Math.abs(Math.sin(this.t*3))).toFixed(2)+')');
    bezel();
    crtOverlay(this.t);
  }
};

/* ==========================================================================
   ЭКРАН ВХОДА (запасной, если кто-то зайдёт напрямую)
   ========================================================================== */
G.screens.title = {
  enter(){ this.t = 0; },
  update(dt){ this.t += dt; },
  draw(){
    drawWallpaper(this.t*0.4);
    const P = CONFIG.P, cx = Math.round(W/2);
    const pw = Math.min(W-30, 190), ph = 118;
    const px0 = Math.round(cx - pw/2), py0 = Math.round(H/2 - ph/2);
    ctx.fillStyle = UI.dark; ctx.fillRect(px0-2,py0-2,pw+4,ph+4);
    ctx.fillStyle = UI.line; ctx.fillRect(px0-1,py0-1,pw+2,ph+2);
    ctx.fillStyle = UI.face; ctx.fillRect(px0, py0, pw, ph);
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
    text(hh+(Math.floor(this.t)%2?':':' ')+mm, cx, py0+8, {sc:3, align:'center', color:'#e6dcf7'});
    const ps = 30;
    if(bothP()){
      ctx.drawImage(IMG.him, cx-ps-10, py0+40, ps, ps);
      ctx.drawImage(IMG.her, cx+10, py0+40, ps, ps);
    }
    heart(cx-4, py0+38, 2, P.pink);
    let ty = py0+ps+46;
    text(CONFIG.her.toUpperCase(), cx, ty, {sc:1, align:'center', color:P.pink}); ty += 12;
    text('— ' + CONFIG.him.toUpperCase(), cx, ty, {sc:1, align:'center', color:P.sky}); ty += 14;
    text(CONFIG.title, cx, ty, {sc:1, align:'center', color:UI.dim});
    const a = 0.45+0.55*Math.abs(Math.sin(this.t*3));
    ctx.globalAlpha = a;
    text(IS_TOUCH ? 'ТАПНИ, ЧТОБЫ ВОЙТИ' : 'НАЖМИ ПРОБЕЛ', cx, py0+ph-13, {sc:1, align:'center', color:P.gold});
    ctx.globalAlpha = 1;
    crtOverlay(this.t);
    bezel();
  },
  key(k){ if(k===' '||k==='Enter'){ Snd.unlock(); Snd.coin(); go('desktop'); } },
  tap(){ Snd.unlock(); Snd.coin(); go('desktop'); }
};

/* --- пересборка раскладки при повороте экрана --- */
G.needRelayout = function(){
  if(G.state==='level' && LEVELS[G.level] && LEVELS[G.level].enter) LEVELS[G.level].enter();
  if(G.state==='desktop' && G.screens.desktop){
    G.screens.desktop.layout();
    if(G.win){
      G.win.w = Math.min(W-12, G.win.kind==='map'?220:200);
      G.win.h = Math.min(H-34, G.win.kind==='map'?196:170);
      G.win.x = Math.round((W-G.win.w)/2); G.win.y = Math.round(Math.max(14,(H-16-G.win.h)/2));
      G.win.from = null;
    }
  }
};
