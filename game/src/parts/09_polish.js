/* ==========================================================================
   ЧАСТЬ 9 · ПОЛИРОВКА ЭКРАНОВ: награда, диалог, вход, настройки
   ========================================================================== */

/* --------------------------------------------------------------------------
   ЭКРАН ВХОДА: «ноутбук» — батарея, wi-fi, аватар, мягкое появление
   -------------------------------------------------------------------------- */
const _titleDraw = G.screens.title.draw;
G.screens.title.draw = function(){
  const t = this.t;
  drawWallpaper(t*0.4);
  const P = CONFIG.P, cx = Math.round(W/2);
  const pw = Math.min(W-24, 196), ph = Math.min(H-14, 162);
  // появление: панель выезжает и проявляется
  const k = clamp(t*2.2, 0, 1);
  const ease = 1-Math.pow(1-k, 3);
  const py0 = Math.round(H/2 - ph/2 - (1-ease)*10);
  const px0 = Math.round(cx - pw/2);
  ctx.globalAlpha = ease;
  ctx.fillStyle = 'rgba(8,4,18,.45)'; ctx.fillRect(px0+3, py0+4, pw, ph);
  ctx.fillStyle = UI.dark; ctx.fillRect(px0-2, py0-2, pw+4, ph+4);
  ctx.fillStyle = UI.line; ctx.fillRect(px0-1, py0-1, pw+2, ph+2);
  ctx.fillStyle = UI.face; ctx.fillRect(px0, py0, pw, ph);
  bevel(px0, py0, pw, 3, 'rgba(255,255,255,.10)', 'rgba(0,0,0,.3)');
  let y = py0 + 5;
  // часы
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
  const sep = Math.floor(t)%2 ? ':' : ' ';
  text(hh+sep+mm, cx, y + Math.round(Math.sin(t*1.6)), {sc:3, align:'center', color:'#e6dcf7', shadow:'rgba(76,201,240,.25)'});
  y += 38;
  // дата
  const dd = d.toLocaleDateString('ru-RU', {weekday:'long', day:'numeric', month:'long'});
  text(dd.toUpperCase(), cx, y, {sc:1, align:'center', color:'#6b4fa0'});
  y += 13;
  // портреты с лёгким «дыханием»
  const ps = 34, pb = Math.round(Math.sin(t*1.2));
  if(bothP()){
    for(const sgn of [-1, 1]){
      const ix = cx + (sgn<0 ? -ps-13 : 11), iy = y+pb;
      ctx.fillStyle = '#170d2c'; ctx.fillRect(ix, iy, ps+4, ps+4);
      ctx.drawImage(sgn<0?IMG.him:IMG.her, ix+2, iy+2, ps, ps);
      ctx.fillStyle = sgn<0 ? P.sky : P.pink;
      ctx.fillRect(ix, iy, ps+4, 1); ctx.fillRect(ix, iy+ps+3, ps+4, 1);
    }
  }
  heart(cx-4, y+pb, 2, P.pink);
  y += ps + 8;
  text(CONFIG.her.toUpperCase(), cx, y, {sc:1, align:'center', color:P.pink}); y += 12;
  text('♥ ' + CONFIG.him.toUpperCase() + ' ♥', cx, y, {sc:1, align:'center', color:P.sky}); y += 13;
  text(CONFIG.title, cx, y, {sc:1, align:'center', color:P.dim}); y += 12;
  // батарея и wi-fi
  ctx.fillStyle = '#170d2c'; ctx.fillRect(px0+8, y, 16, 7);
  ctx.fillStyle = P.green; ctx.fillRect(px0+10, y+2, 12, 3);
  ctx.fillStyle = '#170d2c'; ctx.fillRect(px0+24, y+2, 2, 3);
  for(let i=0;i<3;i++){
    ctx.fillStyle = i<2 ? P.green : '#3a2560';
    ctx.fillRect(px0+pw-8-4-i*5, y+5-i*2, 3, 2);
  }
  // подсказка
  const a = 0.45+0.55*Math.abs(Math.sin(t*3));
  ctx.globalAlpha = a*ease;
  text(IS_TOUCH ? 'ТАПНИ, ЧТОБЫ ВОЙТИ' : 'НАЖМИ ПРОБЕЛ', cx, py0+ph-13, {sc:1, align:'center', color:P.gold});
  ctx.globalAlpha = 1;
  vignette(0.5);
  crtOverlay(t);
  bezel();
};

/* --------------------------------------------------------------------------
   ДИАЛОГ: окно программы с «печатью» реплики
   -------------------------------------------------------------------------- */
const _dlgDraw = G.screens.dialog.draw;
G.screens.dialog.draw = function(){
  const P = CONFIG.P, d = G.dialog, t = this.t;
  drawWallpaper(t*0.3);
  ctx.fillStyle = 'rgba(10,6,22,.55)'; ctx.fillRect(0,0,W,H);
  if(!d || !d.lines[d.i]){ crtOverlay(t); bezel(); return; }
  const line = d.lines[d.i];
  // окно выезжает снизу
  const k = clamp(t*4, 0, 1), ease = 1-Math.pow(1-k,3);
  const bw = W-14, bh = 78, bx = 7, by = Math.round(H-bh-8 - (1-ease)*16);
  ctx.globalAlpha = ease;
  ditherGlow(bx+bw/2, by+bh/2, Math.min(W,H)*.55, '#6b4fa0', .10);
  dropShadow(bx, by, bw, bh, 0.45);
  ctx.fillStyle = UI.dark; ctx.fillRect(bx-2,by-2,bw+4,bh+4);
  ctx.fillStyle = UI.line; ctx.fillRect(bx-1,by-1,bw+2,bh+2);
  ctx.fillStyle = UI.face; ctx.fillRect(bx,by,bw,bh);
  bevel(bx, by, bw, 3, 'rgba(255,255,255,.10)', 'rgba(0,0,0,.3)');
  const who = line.who;
  const title = who ? ((who==='her'?CONFIG.her:CONFIG.him)+' — пишет') : 'СИСТЕМА';
  ctx.fillStyle = who==='her' ? '#4a1f3d' : (who==='him' ? '#223a5e' : UI.face2);
  ctx.fillRect(bx,by,bw,12);
  ctx.fillStyle = UI.dark; ctx.fillRect(bx,by+12,bw,1);
  text(title, bx+3, by+1, {sc:1, color:UI.text});
  // «светящаяся» точка активного окна
  if(Math.floor(t*2)%2===0){ ctx.fillStyle = P.gold; ctx.fillRect(bx+bw-6, by+5, 2, 2); }
  const ps = 40;
  if(who && bothP()){
    const bob = Math.round(Math.sin(t*2.2)*1);
    ctx.fillStyle = '#170d2c'; ctx.fillRect(bx+4,by+17+ps/2-ps/2+bob,ps,ps);
    ctx.drawImage(who==='her'?IMG.her:IMG.him, bx+4, by+17+bob, ps, ps);
    ctx.fillStyle = who==='her'?P.pink:P.sky;
    ctx.fillRect(bx+4,by+17+bob,ps,1); ctx.fillRect(bx+4,by+16+ps+bob,ps,1);
    if(FXQ > .5) glowAt(bx+4+ps/2, by+17+ps/2+bob, 18, who==='her'?P.pink:P.sky, .18);
  }
  const tx = bx + (who ? ps+10 : 6);
  const lines = wrap(line.text.slice(0, Math.floor(d.chars)), bw-(tx-bx)-6, 1);
  let yy = by+18;
  for(const l of lines){ text(l, tx, yy, {sc:1, color:P.ink}); yy += 11; }
  // курсор набора
  if(d.chars < line.text.length && Math.floor(t*4)%2===0){
    ctx.fillStyle = P.gold;
    ctx.fillRect(tx + textW(lines[lines.length-1]||'',1) + 1, yy-11, 4, 8);
  }
  if(d.chars >= line.text.length){
    const a = 0.4+0.6*Math.abs(Math.sin(t*5));
    ctx.globalAlpha = a; heart(bx+bw-13, by+bh-12, 1, P.gold); ctx.globalAlpha = 1;
    if(d.lines.length > 1){
      // точки-прогресс реплик
      for(let i=0;i<d.lines.length;i++){
        ctx.fillStyle = i<=d.i ? P.pink : '#3a2560';
        ctx.fillRect(bx+bw-8-i*4, by+3, 2, 2);
      }
    }
  }
  if(d.canSkip){
    const w2 = 84, x2 = bx+4, y2 = by+bh-16;
    drawBtn(x2, y2, w2, 13, 'ПРОПУСТИТЬ', {press:false});
    this.skipRect = {x:x2, y:y2, w:w2, h:13};
    text('сорян, бывает', x2+w2+6, y2+3, {sc:1, color:UI.dim});
  } else this.skipRect = null;
  ctx.globalAlpha = 1;
  vignette(0.35);
  crtOverlay(t);
  bezel();
};

/* --------------------------------------------------------------------------
   НАГРАДА: сердце вырастает, искры, баннер уровня
   -------------------------------------------------------------------------- */
G.screens.reward.update = function(dt){
  this.t += dt;
  // искры при получении
  if(!this.burst && this.t > 0.05){
    this.burst = true;
    const P = CONFIG.P, cx = W/2, cy = H/2-10;
    for(let i=0;i<26;i++) fx(cx, cy, 1, [P.pink, P.gold, '#fff6e8'][i%3], 110, 0.9, {g:40, s:i%3===0?2:1});
    ring(cx, cy, P.pink2, 60, 0.6);
    ring(cx, cy, P.gold, 40, 0.75);
    for(let i=0;i<10;i++) burstHearts(cx, cy, 2, i%2?P.pink:P.gold);
    shake(3); hitstop(0.05); punch(.1);
  }
  if(this.t > 2.6) this.finish();
};
G.screens.reward.draw = function(){
  const P = CONFIG.P, cx = W/2, cy = Math.round(H/2-10), t = this.t;
  skyBg(t); clouds(t,20,4,0.2);
  nebulaBg(t, {c1:'#5a1f4a', c2:'#2b1c5e', c3:'#1b3a6b', seed: 9});
  motes(t, 24, '#ffd166', .35);
  // расходящиеся круги
  for(let i=0;i<3;i++){
    const k = (t*0.5 + i/3) % 1;
    ctx.globalAlpha = (1-k)*0.35;
    ctx.fillStyle = P.pink;
    ctx.beginPath(); ctx.arc(cx, cy, 20+k*70, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // орбита сердец
  for(let i=0;i<16;i++){
    const a = t*1.5 + i*0.7;
    const rr = 22+i*3.2;
    heart(cx+Math.cos(a)*rr*0.7, cy+Math.sin(a)*rr*0.45, 1, 'rgba(255,93,143,'+Math.max(0,0.55-i*0.03).toFixed(2)+')');
  }
  // сердце с «ударом» при получении
  const pop = t<0.25 ? lerp(0.4, 1.15, easeOut(t/0.25)) : (t<0.45 ? lerp(1.15, 1, (t-0.25)/0.2) : 1);
  const sc = Math.max(1, Math.round(3*pop));
  const beat = 1 + Math.max(0, Math.sin((t-0.4)*4))*0.08;
  const s2 = Math.max(1, Math.round(sc*beat));
  ditherGlow(cx, cy, 60, P.pink, 0.22+0.10*Math.abs(Math.sin(t*3)));
  heart(cx-4*s2, cy-3*s2, s2, P.pink);
  // баннер
  const by2 = cy + 26;
  ctx.fillStyle = 'rgba(11,6,24,.75)';
  ctx.fillRect(cx-Math.round(W/2)+6, by2, W-12, 14);
  ctx.fillStyle = P.pink; ctx.fillRect(cx-Math.round(W/2)+6, by2, 2, 14);
  text('СЕРДЕЧКО ПОЛУЧЕНО!', cx, by2+1, {sc:1, align:'center', color:P.gold});
  // сколько собрано
  const hw = NH*14;
  for(let i=0;i<NH;i++){
    const hx = cx-hw/2+i*14, pop2 = (G.hearts[i] && this.reward && this.reward.i===i) ? 2 : 2;
    heart(hx, by2+18, pop2, G.hearts[i] ? P.pink : '#3a2560');
  }
  text(heartsDone()+' / '+NH, cx, by2+36, {sc:1, align:'center', color:P.dim});
  if(heartsDone() >= NH){
    const a = 0.5+0.5*Math.abs(Math.sin(t*4));
    ctx.globalAlpha = a;
    text('ПИСЬМО ЖДЁТ В LOVE.exe', cx, by2+50, {sc:1, align:'center', color:P.green});
    ctx.globalAlpha = 1;
  }
  vignette(0.5);
  crtOverlay(t);
  bezel();
};

/* --------------------------------------------------------------------------
   ОКНО НАСТРОЕК
   -------------------------------------------------------------------------- */
function openSettings(){
  const w = Math.min(W-14, 214), h = 112;
  Win.open('set', 'ПАРАМЕТРЫ  v1.0', {w:w, h:h});
}
const _si = G.screens.desktop.startItems;
G.screens.desktop.startItems = function(){
  const it = _si.call(this);
  const k = it.findIndex(x=>x.t === 'КОМАНДНАЯ СТРОКА');
  it.splice(k>=0?k+1:1, 0, {t:'ПАРАМЕТРЫ', f:()=>{ openSettings(); }});
  return it;
};
const _dw2 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'set'){ drawWinFrame(win, true); drawSettings(win); return; }
  return _dw2.call(this, win);
};
const SET_ROWS = [
  {id:'crt',  label:'ЭФФЕКТЫ ЭКРАНА', get:()=>G.crt,  set:v=>{ G.crt = v; }, hint:'C — переключить'},
  {id:'snd',  label:'ЗВУКИ',          get:()=>Snd.on,  set:v=>{ Snd.on = v; }, hint:'N — переключить'},
  {id:'mus',  label:'МУЗЫКА',         get:()=>Snd.musicOn, set:v=>{ Snd.musicOn = v; }, hint:'M — переключить'}
];
function drawSettings(win){
  const r = Win.inner(win);
  let y = r.y + 4;
  for(const row of SET_ROWS){
    const on = row.get();
    const hov = ptr.x>=r.x && ptr.x<=r.x+r.w-2 && ptr.y>=y-1 && ptr.y<=y+13;
    ctx.fillStyle = hov ? '#3a2560' : UI.face2;
    ctx.fillRect(r.x+2, y, r.w-4, 12);
    ctx.fillStyle = on ? CONFIG.P.green : '#5a4680';
    ctx.fillRect(r.x+4, y+2, 8, 8);
    if(on){
      ctx.fillStyle = '#0d0820';
      ctx.fillRect(r.x+5, y+5, 2, 2); ctx.fillRect(r.x+7, y+6, 2, 2); ctx.fillRect(r.x+9, y+3, 1, 2);
    }
    text(row.label, r.x+16, y+2, {sc:1, color: on?UI.text:UI.dim});
    text(on ? 'ВКЛ' : 'ВЫКЛ', r.x+r.w-6, y+2, {sc:1, align:'right', color: on?CONFIG.P.green:'#6b4fa0'});
    y += 14;
  }
  // подсказки по клавишам — в две строки, чтобы влезало на узкий экран
  text('C — эффекты   N — звук', r.x+5, y+2, {sc:1, color:'#6b4fa0'});
  text('M — музыка   ESC — закрыть', r.x+5, y+13, {sc:1, color:'#6b4fa0'});
  y += 26;
  const bw = Math.min(120, r.w-16), bx = r.x + Math.round((r.w-bw)/2), by = y;
  drawBtn(bx, by, bw, 15, 'НАЧАТЬ ЗАНОВО', {press:false, color:CONFIG.P.red});
  win.resetRect = {x:bx, y:by, w:bw, h:15};
}
const _dt3 = G.screens.desktop.tap;
G.screens.desktop.tap = function(x,y){
  if(G.win && G.win.kind === 'set'){
    const r = Win.inner(G.win);
    let yy = r.y + 4;
    for(let i=0;i<SET_ROWS.length;i++, yy+=14){
      if(x>=r.x+2 && x<=r.x+r.w-2 && y>=yy && y<=yy+12){
        const row = SET_ROWS[i];
        row.set(!row.get()); Snd.blip();
        ripple(x,y, 'rgba(140,233,154,.9)');
        return;
      }
    }
    const rr = G.win.resetRect;
    if(rr && x>=rr.x && x<=rr.x+rr.w && y>=rr.y && y<=rr.y+rr.h){
      G.hearts = new Array(NH).fill(false); save(); G.fails = {};
      Snd.bad(); flashScreen(CONFIG.P.red, 0.25);
      Win.close();
      G.screens.desktop.openMapWin();
      G.toast = 'ПРОГРЕСС СБРОШЕН'; G.toastT = 1.6;
      return;
    }
  }
  return _dt3.call(this, x, y);
};
/* клик по строке настроек мышью — тот же код, что и тап */
