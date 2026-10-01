/* ==========================================================================
   ЧАСТЬ 1 · ИНТЕРФЕЙС «КАК НА КОМПЬЮТЕРЕ»
   Окна, курсор, CRT-экран, иконки файлов, кнопки,_progress-бары.
   Всё рисуется пиксель-в-пиксель, внешних ресурсов нет.
   ========================================================================== */

const UI = {
  face:'#2a1a45',        // фон окна
  face2:'#3a2560',       // шапка активного окна
  face3:'#241445',       // тень / неактивная шапка
  line:'#6b4fa0',        // светлая рамка
  dark:'#120a24',        // тёмная рамка
  text:'#fff6e8',
  dim:'#a08cc0',
  paper:'#e9e2f5',
  blue:'#4cc9f0'
};

/* --- рябь от клика (анимация) --- */
const RIPPLES = [];
function ripple(x,y,col){ RIPPLES.push({x:x, y:y, t:0, col:col||'rgba(255,209,102,.9)'}); }
function drawRipples(dt){
  for(let i=RIPPLES.length-1;i>=0;i--){
    const r = RIPPLES[i]; r.t += dt;
    if(r.t>0.45){ RIPPLES.splice(i,1); continue; }
    const k = r.t/0.45;
    ctx.strokeStyle = r.col; ctx.globalAlpha = 1-k;
    ctx.beginPath(); ctx.arc(r.x, r.y, 2+k*12, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/* --- курсор: стрелка и «песочные часы» --- */
const CUR_ARROW = [
  "X.......",
  "XX......",
  "XoX.....",
  "XooX....",
  "XoooX...",
  "XooooX..",
  "XoooooX.",
  "XooooooX",
  "Xooooooo",
  "XoooXXX.",
  "XXoXX...",
  "Xo.X....",
  "..XX....",
  "..X....."
];
const CUR_BUSY = [
  "oooooooo",
  "oXXXXXXo",
  ".oXXXXo.",
  "..oXXo..",
  "...oo...",
  "...ss...",
  "..osso..",
  ".osssso.",
  "osssssso",
  "oooooooo"
];
function drawCursor(x, y, busy, t){
  x = Math.round(x); y = Math.round(y);
  if(busy){
    px(CUR_BUSY, x, y, 1, {o:'#120a24', X:'#c9bde8', s:'#ffd166'});
    // песок «сыплется»
    const k = Math.floor((t*3)%4);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x+3, y+5+k, 2, 1);
    ctx.fillStyle = '#6b4fa0';
    ctx.fillRect(x+3, y+1, 2, Math.min(3, k));
  } else {
    px(CUR_ARROW, x, y, 1, {o:'#120a24', X:'#fff6e8'});
  }
}

/* --- CRT: развёртка, блик, лёгкое мерцание --- */
function crtOverlay(t){
  ctx.globalAlpha = 0.055; ctx.fillStyle = '#000000';
  for(let y=0;y<H;y+=2) ctx.fillRect(0,y,W,1);
  ctx.globalAlpha = 1;
  // блик в левом верхнем углу
  const g = ctx.createLinearGradient(0,0,W*0.6,H*0.6);
  g.addColorStop(0,'rgba(255,255,255,.045)'); g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // редкая «вспышка» развёртки
  const fl = Math.sin(t*0.7);
  if(fl > 0.985){
    ctx.globalAlpha = 0.06; ctx.fillStyle='#fff6e8'; ctx.fillRect(0, Math.floor((t*260)%H), W, 2); ctx.globalAlpha = 1;
  }
}

/* --- рамка ноутбука вокруг всего экрана (тонкая, сверху) --- */
function bezel(){
  ctx.fillStyle = '#0d0818'; ctx.fillRect(0,0,W,3); ctx.fillRect(0,H-3,W,3);
  ctx.fillStyle = '#1a1030'; ctx.fillRect(0,3,W,1); ctx.fillRect(0,H-4,W,1);
}

/* ==========================================================================
   ОКНА
   ========================================================================== */
const Win = {
  open(kind, title, o){
    o = o || {};
    const w = Math.min(W-12, o.w || 216);
    const h = Math.min(H-30, o.h || 170);
    const win = {
      kind:kind, title:title, w:w, h:h,
      x: Math.round((W-w)/2), y: Math.round(Math.max(14,(H-16-h)/2) + (o.dy||0)),
      anim:0, closing:false, from:o.from||null, t:0, data:o.data||{}
    };
    G.win = win; Snd.blip();
    return win;
  },
  close(){ if(G.win && !G.win.closing){ G.win.closing = true; Snd.clack(); } },
  update(dt){
    const w = G.win; if(!w) return;
    w.t += dt;
    if(w.closing){ w.anim -= dt*5.5; if(w.anim<=0){ G.win = null; return; } }
    else if(w.anim < 1){ w.anim = Math.min(1, w.anim + dt*5); }
  },
  rect(w){
    const k = clamp(w.anim,0,1);
    const e = k<1 ? (1-Math.pow(1-k,3)) : 1;      // плавный «выезд»
    if(!w.from) return {x:w.x, y:w.y, w:w.w, h:w.h, a:e};
    return {
      x: Math.round(lerp(w.from.x, w.x, e)),
      y: Math.round(lerp(w.from.y, w.y, e)),
      w: Math.max(8, Math.round(lerp(w.from.w, w.w, e))),
      h: Math.max(8, Math.round(lerp(w.from.h, w.h, e))),
      a: e
    };
  },
  hit(w,x,y){ const r = this.rect(w); return x>=r.x-2 && x<=r.x+r.w+2 && y>=r.y-2 && y<=r.y+r.h+2; },
  titleHit(w,x,y){ const r = this.rect(w); return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+13; },
  closeHit(w,x,y){ const r = this.rect(w); return x>=r.x+r.w-12 && x<=r.x+r.w-2 && y>=r.y+2 && y<=r.y+11; },
  inner(w){ const r = this.rect(w); return {x:r.x+1, y:r.y+14, w:r.w-2, h:r.h-15, a:r.a}; }
};

function drawWinFrame(win, active){
  const r = Win.rect(win);
  ctx.globalAlpha = clamp(r.a,0,1);
  // тень
  ctx.fillStyle = 'rgba(8,4,18,.5)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
  // внешняя рамка
  ctx.fillStyle = UI.dark; ctx.fillRect(r.x-2, r.y-2, r.w+4, r.h+4);
  ctx.fillStyle = UI.line; ctx.fillRect(r.x-1, r.y-1, r.w+2, r.h+2);
  // тело
  ctx.fillStyle = UI.face; ctx.fillRect(r.x, r.y, r.w, r.h);
  // шапка
  ctx.fillStyle = active ? UI.face2 : '#2a1a45';
  ctx.fillRect(r.x, r.y, r.w, 13);
  ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(r.x, r.y, r.w, 1);
  ctx.fillStyle = UI.dark; ctx.fillRect(r.x, r.y+13, r.w, 1);
  // «полосочки» на шапке — как у старых окон
  ctx.fillStyle = 'rgba(255,246,232,.18)';
  for(let i=0;i<3;i++) ctx.fillRect(r.x+2, r.y+3+i*3, r.w-20, 1);
  // заголовок
  ctx.save();
  ctx.beginPath(); ctx.rect(r.x, r.y, r.w-15, 13); ctx.clip();
  text(win.title, r.x+3, r.y+1, {sc:1, color: active?UI.text:UI.dim});
  ctx.restore();
  // кнопка закрыть
  const bx = r.x+r.w-12, by = r.y+2;
  ctx.fillStyle = UI.face; ctx.fillRect(bx,by,10,9);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(bx,by,10,1); ctx.fillRect(bx,by,1,9);
  ctx.fillStyle = UI.dark; ctx.fillRect(bx+9,by,1,9); ctx.fillRect(bx,by+8,10,1);
  ctx.fillStyle = '#c94f6d';
  for(let i=0;i<5;i++){ ctx.fillRect(bx+3+i, by+3+i, 1,1); ctx.fillRect(bx+7-i, by+3+i, 1,1); }
  ctx.globalAlpha = 1;
  return r;
}

/* --- кнопка в стиле «старых окон» --- */
function drawBtn(x,y,w,h,label,o){
  o = o||{};
  ctx.fillStyle = UI.dark; ctx.fillRect(x-1,y-1,w+2,h+2);
  ctx.fillStyle = o.press ? '#1d1136' : UI.face2; ctx.fillRect(x,y,w,h);
  ctx.fillStyle = o.press ? UI.dark : 'rgba(255,255,255,.22)';
  ctx.fillRect(x,y,w,1); ctx.fillRect(x,y,1,h);
  ctx.fillStyle = o.press ? 'rgba(255,255,255,.18)' : UI.dark;
  ctx.fillRect(x,y+h-1,w,1); ctx.fillRect(x+w-1,y,1,h);
  const col = o.dis ? '#5a4680' : (o.color || UI.text);
  text(label, Math.round(x+w/2), Math.round(y+(h-8)/2), {sc:1, align:'center', color:col});
}

/* --- полоса загрузки --- */
function drawBar(x,y,w,h,val,col,seg){
  ctx.fillStyle = UI.dark; ctx.fillRect(x-1,y-1,w+2,h+2);
  ctx.fillStyle = '#1d1136'; ctx.fillRect(x,y,w,h);
  const fw = Math.max(0, Math.round((w-2)*clamp(val,0,1)));
  ctx.fillStyle = col || CONFIG.P.gold;
  if(seg){ // «виндовые» сегменты
    for(let i=0;i<fw;i+=seg+2) ctx.fillRect(x+1+i, y+1, Math.min(seg,fw-i), h-2);
  } else ctx.fillRect(x+1, y+1, fw, h-2);
}

/* --- иконка файла: страница + символ --- */
function drawFileIcon(node, cx, cy, o){
  o = o||{};
  const w = 16, h = 18, x = Math.round(cx - w/2), y = Math.round(cy - h/2);
  // бумага
  ctx.fillStyle = UI.dark; ctx.fillRect(x-1, y-1, w+2, h+2);
  ctx.fillStyle = o.sel ? '#fff6e8' : UI.paper; ctx.fillRect(x, y, w, h);
  // уголок
  ctx.fillStyle = '#b3a8cc'; ctx.fillRect(x+w-5, y, 5, 5);
  ctx.fillStyle = o.sel ? '#c9bde8' : '#8f83ad'; ctx.fillRect(x+w-5, y, 1, 5); ctx.fillRect(x+w-5, y+4, 5, 1);
  ctx.fillStyle = UI.dark;
  if(node === 'txt'){
    for(let i=0;i<5;i++) ctx.fillRect(x+3, y+4+i*2, i===2?6:10, 1);
    ctx.fillStyle = CONFIG.P.sky; ctx.fillRect(x+3, y+15, 10, 1);
  } else if(node === 'bin'){
    ctx.fillStyle = '#6b4fa0';
    ctx.fillRect(x+4,y+4,8,3); ctx.fillRect(x+3,y+7,10,8); ctx.fillRect(x+2,y+15,12,2);
    ctx.fillStyle = '#3a2560';
    for(let i=0;i<3;i++) ctx.fillRect(x+5+i*3, y+8, 1, 7);
  } else {
    drawNodeIcon(node, Math.round(cx), Math.round(cy-1), o.sel ? '#3a2560' : '#4a3670');
    if(o.sel){ ctx.fillStyle='rgba(107,79,160,.35)'; ctx.fillRect(x,y,w,h); }
  }
  return {x:x, y:y, w:w, h:h};
}

/* --- маленький принтер (для анимаций) --- */
function drawPrinter(x, y, s, t, on){
  const P = CONFIG.P;
  ctx.fillStyle = '#2a2050'; ctx.fillRect(x, y+6*s, 22*s, 8*s);          // корпус
  ctx.fillStyle = '#3f3470'; ctx.fillRect(x+2*s, y+2*s, 18*s, 5*s);      // верх
  ctx.fillStyle = on ? P.green : '#6b4fa0'; ctx.fillRect(x+16*s, y+9*s, 2*s, 2*s); // лампочка
  ctx.fillStyle = '#1d1136'; ctx.fillRect(x+3*s, y+12*s, 16*s, 1*s);     // щель
}

/* --- «песочные часы» загрузки уровня (окно) --- */
function drawLoader(x, y, w, h, title, val, t){
  ctx.fillStyle = UI.face; ctx.fillRect(x,y,w,h);
  text(title, x+6, y+6, {sc:1, color:UI.text});
  drawBar(x+6, y+22, w-12, 8, val, CONFIG.P.pink);
  text('⋯ ЗАГРУЗКА ⋯'.slice(0, 6 + Math.floor((t*6)%4)), x+6, y+36, {sc:1, color:UI.dim});
}
