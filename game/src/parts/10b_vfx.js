/* ==========================================================================
   ЧАСТЬ 10b · «ДОРОГОЙ» ГРАФИЧЕСКИЙ СЛОЙ
   Свечения, стеклянные панели, параллакс, HUD, ударная «juice»
   Всё кэшируется — можно звать каждый кадр
   ========================================================================== */

let FXQ = 1;                              // 1 — всё красиво, 0 — экономно

/* ---------- кэш спрайтов ---------- */
const SPR = {};
function spr(key, w, h, build){
  let s = SPR[key];
  if(s) return s;
  s = document.createElement('canvas');
  s.width = Math.max(1, Math.round(w)); s.height = Math.max(1, Math.round(h));
  const c = s.getContext('2d');
  build(c, s.width, s.height);
  SPR[key] = s;
  return s;
}
function hex2rgb(c){
  c = (c||'#ffffff').replace('#','');
  if(c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const n = parseInt(c, 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}
function rgba(c, a){
  const p = hex2rgb(c);
  return 'rgba('+p[0]+','+p[1]+','+p[2]+','+a+')';
}

/* ---------- мягкое свечение-точка ---------- */
function glowSprite(col, r){
  return spr('gl|'+col+'|'+r, r*2+2, r*2+2, (c,w,h)=>{
    const g = c.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    g.addColorStop(0,   rgba(col, .95));
    g.addColorStop(.28, rgba(col, .45));
    g.addColorStop(.62, rgba(col, .13));
    g.addColorStop(1,   rgba(col, 0));
    c.fillStyle = g; c.fillRect(0,0,w,h);
  });
}
/** Большое мягкое свечение (аддитивно не мешает поверх пиксель-арта) */
function glowAt(x, y, r, col, a){
  if(FXQ < .5 && r > 14) r = 10;
  // не выпускаем свечение за экран — экономим заливку и не ловим «вылеты» в тестах
  if(x - r < 0) r = Math.max(1, x);
  if(y - r < 0) r = Math.max(1, y);
  if(x + r > W) r = Math.max(1, W - x);
  if(y + r > H) r = Math.max(1, H - y);
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.drawImage(glowSprite(col, Math.max(3, Math.round(r))), Math.round(x-r-1), Math.round(y-r-1));
  ctx.globalAlpha = 1;
}
/** Крест-лучи вокруг точки (как у ярких звёзд) */
function starburst(x, y, r, col, a, arms){
  const n = arms || 4;
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.fillStyle = col;
  const L = r*2.6;
  for(let i=0;i<n;i++){
    const ang = i*(Math.PI*2/n) + Math.PI/4;
    for(let k=0;k<L;k++){
      const w2 = Math.max(0, 1 - k/r*1.6);
      if(w2 <= 0) break;
      ctx.fillRect(Math.round(x+Math.cos(ang)*k), Math.round(y+Math.sin(ang)*k), Math.max(1,Math.round(w2)), Math.max(1,Math.round(w2)));
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------- подгонка текста под ширину ---------- */
/** Подбирает масштаб, чтобы строка влезла в ширину. */
function fitSc(str, maxW, want){
  want = want || 1;
  if(textW(str, want) <= maxW) return want;
  for(const s2 of [.875, .75, .625, .5]) if(textW(str, s2) <= maxW) return s2;
  return .5;
}

/* ---------- стеклянная панель (новый стиль) ---------- */
/**
 * glassPanel(x,y,w,h,{col,a,title,icon,sheen})
 * Полупрозрачная панель с двойной рамкой, уголками и бегущим бликом.
 */
function glassPanel(x, y, w, h, o){
  o = o || {};
  const col = o.col || '#6b4fa0';
  const a = o.a == null ? .82 : o.a;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  // тень
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x+2, y+3, w, h);
  // тело
  ctx.fillStyle = 'rgba(12,7,26,'+a+')'; ctx.fillRect(x, y, w, h);
  // вертикальный градиент внутри
  const g = ctx.createLinearGradient(0, y, 0, y+h);
  g.addColorStop(0, rgba(col, .22));
  g.addColorStop(.5, rgba(col, .07));
  g.addColorStop(1, rgba(col, .015));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // рамки
  ctx.fillStyle = rgba(col, .85); ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y+h-1, w, 1);
  ctx.fillStyle = rgba(col, .35); ctx.fillRect(x, y, 1, h); ctx.fillRect(x+w-1, y, 1, h);
  // уголки
  const cb = o.cb == null ? 6 : o.cb, cc = o.corner || '#ffd166';
  ctx.fillStyle = cc;
  ctx.fillRect(x, y, cb, 1); ctx.fillRect(x, y, 1, cb);
  ctx.fillRect(x+w-cb, y, cb, 1); ctx.fillRect(x+w-1, y, 1, cb);
  ctx.fillRect(x, y+h-1, cb, 1); ctx.fillRect(x, y+h-cb, 1, cb);
  ctx.fillRect(x+w-cb, y+h-1, cb, 1); ctx.fillRect(x+w-1, y+h-cb, 1, cb);
  // бегущий блик
  if(o.sheen !== false && FXQ > .5){
    const per = 2600 + (o.sheen || 0);
    const k = ((G.t*1000) % per) / per;                 // 0..1
    if(k < .35){
      const sw = 26, sx = x - sw + (w + sw*2) * (k/.35);
      const lg = ctx.createLinearGradient(sx, 0, sx+sw, 0);
      lg.addColorStop(0, rgba(col, 0)); lg.addColorStop(.5, 'rgba(255,255,255,.10)'); lg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = lg; ctx.fillRect(Math.round(sx), y+1, sw, h-2);
    }
  }
  if(o.title){
    const th = 13;
    ctx.fillStyle = rgba(col, .5); ctx.fillRect(x+1, y+1, w-2, th);
    ctx.fillStyle = rgba(col, .95); ctx.fillRect(x+1, y+th, w-2, 1);
    let tx = x+5;
    if(o.icon){ drawIconAt(o.icon, x+8, y+1+Math.round(th/2)-1, 1, '#ffd166'); tx = x+16; }
    text(o.title, tx, y+3, {sc:1, color:'#fff6e8'});
    return {x:x+3, y:y+th+2, w:w-6, h:h-th-4, x0:x, y0:y, w0:w, h0:h};
  }
  return {x:x+3, y:y+3, w:w-6, h:h-6, x0:x, y0:y, w0:w, h0:h};
}

/* ---------- аккуратный длинный текст ---------- */
/** Многострочный текст по центру, максимум n строк. Возвращает высоту. */
function textBlock(t, cx, y, maxW, o){
  o = o || {};
  const sc = o.sc || 1;
  const lines = wrap(t, maxW, sc).slice(0, o.max || 2);
  lines.forEach((l,i)=>text(l, cx, y + i*(o.lh || 12), {sc:sc, align:'center', color:o.color || '#c9bde8'}));
  return lines.length*(o.lh || 12);
}

/* ---------- окружности без stroke() ---------- */
function circleOutline(cx, cy, r, col, wgt){
  wgt = wgt || 1;
  ctx.fillStyle = col;
  const n = Math.max(12, Math.round(r*6));
  for(let i=0;i<n;i++){
    const a = i/n*6.283;
    ctx.fillRect(Math.round(cx+Math.cos(a)*r), Math.round(cy+Math.sin(a)*r), wgt, wgt);
  }
}
function circleFill(cx, cy, r, col, a){
  ctx.globalAlpha = a==null?1:a;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
}

/* ---------- кнопка нового стиля ---------- */
function glassBtn(x, y, w, h, label, o){
  o = o || {};
  const dis = !!o.dis, press = !!o.press;
  const col = dis ? '#4a3670' : (o.color || '#6b4fa0');
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x+1, y+2, w, h);
  const g = ctx.createLinearGradient(0, y, 0, y+h);
  g.addColorStop(0, rgba(col, press ? .55 : .38));
  g.addColorStop(1, rgba(col, press ? .18 : .08));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = dis ? '#3a2560' : rgba(col, .9);
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y+h-1, w, 1);
  ctx.fillStyle = dis ? '#2f1f4d' : rgba(col, .45);
  ctx.fillRect(x, y, 1, h); ctx.fillRect(x+w-1, y, 1, h);
  if(!dis && FXQ > .5){
    ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.fillRect(x+1, y+1, w-2, 1);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x+1, y+1, 1, h-2);
  }
  const tc = dis ? '#6b5a8f' : (o.tc || '#fff6e8');
  const sc = fitSc(label, w - 6, 1);
  if(o.align === 'left') text(label, x+5, y + Math.round((h-8*sc)/2), {sc:sc, color:tc});
  else text(label, x + w/2, y + Math.round((h-8*sc)/2), {sc:sc, align:'center', color:tc});
  return {x:x, y:y, w:w, h:h};
}

/* ---------- HUD ---------- */
function hudTop(o){
  const P = CONFIG.P;
  const h = o.h || 20;
  ctx.fillStyle = 'rgba(8,4,18,.72)'; ctx.fillRect(0, 0, W, h);
  ctx.fillStyle = rgba(o.col || '#6b4fa0', .6); ctx.fillRect(0, h-1, W, 1);
  if(o.icon){ const is = h >= 22 ? 2 : 1;
    ctx.fillStyle = 'rgba(255,209,102,.12)'; ctx.fillRect(2, 2, 8*is+2, h-4);
    drawIconAt(o.icon, 3+4*is, Math.round(h/2), is, P.gold); }
  const tx = o.icon ? (h >= 22 ? 21 : 13) : 5;
  const rw = o.right ? textW(o.right, 1) + 8 : 0;
  const tsc = fitSc(o.title, W - tx - rw - 6, 1);
  text(o.title, tx, Math.round((h-9)/2)+1, {sc:tsc, color:o.tc || '#fff6e8'});
  if(o.right) text(o.right, W-5, Math.round((h-9)/2)+1, {sc:1, align:'right', color:o.rc || '#9b8ac0'});
  return h;
}
/** Полоска прогресса с делениями и блеском */
function meterBar(x, y, w, h, v, col, o){
  o = o || {};
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = 'rgba(6,3,14,.8)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba(col, .35); ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y+h-1, w, 1);
  const fw = Math.round((w-2) * clamp(v,0,1));
  if(fw > 0){
    const g = ctx.createLinearGradient(x, 0, x+w, 0);
    g.addColorStop(0, rgba(col, .55)); g.addColorStop(.8, rgba(col, .95)); g.addColorStop(1, '#fff6e8');
    ctx.fillStyle = g; ctx.fillRect(x+1, y+1, fw, h-2);
    if(FXQ > .5){
      const k = ((G.t*0.7)%1), hx = x + fw*k;
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillRect(Math.round(hx), y+1, 1, h-2);
    }
  }
  if(o.seg){
    ctx.fillStyle = 'rgba(10,5,20,.9)';
    for(let i=1;i<o.seg;i++) ctx.fillRect(x + Math.round(w*i/o.seg) - 1, y+1, 1, h-2);
  }
  return {x:x, y:y, w:w, h:h};
}
/** Маленькая «таблетка» с подписью */
function chip(x, y, label, col, o){
  // o может быть объектом {h,right,tc} либо старым флагом right
  const right = (o === true) || !!(o && o.right);
  o = (o && typeof o === 'object') ? o : {};
  const w = textW(label,1) + 8, h = o.h || 11;
  const X = right ? Math.round(x - w) : x;
  ctx.fillStyle = 'rgba(10,5,20,.7)'; ctx.fillRect(X, y, w, h);
  ctx.fillStyle = rgba(col||'#6b4fa0', .8); ctx.fillRect(X, y, w, 1); ctx.fillRect(X, y+h-1, w, 1);
  text(label, X+4, y+2, {sc:1, color:o.tc || col || '#c9bde8'});
  return {x:X, y:y, w:w, h:h};
}

/* ---------- фоны: параллакс и туманности ---------- */
function nebulaBg(t, o){
  o = o || {};
  const c1 = o.c1 || '#3a1f66', c2 = o.c2 || '#1b3a6b', c3 = o.c3 || '#5a1f4a';
  const R = mulberry32(o.seed || 7);
  const A = spr('neb|'+W+'x'+H+'|'+(o.seed||7), W, H, (cv,w,h)=>{
    for(let i=0;i<9;i++){
      const x = R()*w, y = R()*h, r = 40 + R()*90, col = [c1,c2,c3][i%3];
      const g = cv.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, .5)); g.addColorStop(1, rgba(col, 0));
      cv.fillStyle = g; cv.beginPath(); cv.arc(x, y, r, 0, 7); cv.fill();
    }
  });
  ctx.globalAlpha = .55 + .12*Math.sin(t*.25);
  ctx.drawImage(A, 0, 0, Math.round(Math.sin(t*.05)*2), H);
  ctx.globalAlpha = 1;
}
/** Три слоя звёзд с параллаксом — «дорогое» небо */
const SKYLAY = [];
function starLayers(t, o){
  o = o || {};
  if(!SKYLAY.length){
    const R = mulberry32(o.seed || 11);
    for(let L=0;L<3;L++){
      const n = [46, 26, 12][L], arr = [];
      for(let i=0;i<n;i++) arr.push({x:R()*W, y:R()*H*0.82, r:(1.6-L*.3)*(0.5+R()), p:R()*6.28, k:.25+L*.45});
      SKYLAY.push(arr);
    }
  }
  for(let L=0;L<3;L++){
    const sp = (L+1)*.55, arr = SKYLAY[L];
    const col = L===0 ? 'rgba(200,190,230,.5)' : (L===1 ? 'rgba(255,246,232,.75)' : '#fff6e8');
    for(const s of arr){
      const x = ((s.x - t*sp) % (W+20) + W+20) % (W+20) - 10;
      const tw = .55 + .45*Math.sin(t*1.6 + s.p);
      ctx.fillStyle = col; ctx.globalAlpha = tw * (L===0?.5:.9);
      const r = Math.max(1, Math.round(s.r));
      ctx.fillRect(Math.round(x), Math.round(s.y), r, r);
      if(L > 0 && s.r > 1.3){ glowAt(x, y0(s), r*3, '#c9bde8', .12*tw); }
      ctx.globalAlpha = 1;
    }
  }
  function y0(s){ return s.y; }
}
/** Пылинки/пыль в воздухе (медленный параллакс) */
let MOTES = null;
function motes(t, n, col, a){
  col = col || '#fff6e8';
  if(!MOTES){
    const R = mulberry32(23);
    MOTES = [];
    for(let i=0;i<90;i++) MOTES.push({x:R()*W, y:R()*H, r:.4+R()*1.2, v:4+R()*16, p:R()*6.28, w:R()});
  }
  n = Math.min(n, FXQ > .5 ? MOTES.length : 22);
  for(let i=0;i<n;i++){
    const m = MOTES[i];
    const x = (m.x + Math.sin(t*.35 + m.p)*10 + t*m.w*3) % (W+8) - 4;
    const y = (m.y - t*m.v) % (H+10); const yy = y < -5 ? y + H + 10 : y;
    ctx.globalAlpha = a * (.35 + .35*Math.sin(t*1.3 + m.p));
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(yy), Math.max(1,Math.round(m.r)), Math.max(1,Math.round(m.r)));
  }
  ctx.globalAlpha = 1;
}
/** Дождь/искры со сносом — универсальный «лито» */
function rainFX(t, n, col, spd, slant){
  slant = slant == null ? .25 : slant;
  const R = mulberry32(31);
  for(let i=0;i<n;i++){
    const x0 = R()*W, y0 = R()*H, len = 5 + R()*9, sp = spd*(.6+R()*.9);
    const y = (y0 + t*sp) % (H+12) - 6;
    const x = x0 + y*slant;
    ctx.globalAlpha = .35 + .3*R();
    ctx.fillStyle = col;
    for(let k=0;k<len;k++){
      const px = Math.round(x + k*slant*1.6), py = Math.round(y - k);
      if(px < 0 || px >= W || py < 0 || py >= H) continue;   // не рисуем за краем экрана
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}
/** Световой луч «лазер» между точками */
function beam(x1, y1, x2, y2, col, t, wgt){
  wgt = wgt || 1;
  const n = Math.max(Math.abs(x2-x1), Math.abs(y2-y1));
  for(let k=0;k<=n;k++){
    const x = x1 + (x2-x1)*k/n, y = y1 + (y2-y1)*k/n;
    const f = k/n;
    const w2 = Math.max(1, Math.round(wgt * (1 - Math.abs(f-.5)*1.1)));
    ctx.fillStyle = rgba(col, .9 - Math.abs(f-.5)*.5);
    ctx.fillRect(Math.round(x - w2/2), Math.round(y - w2/2), w2, w2);
  }
}
/** Пунктирная линия «по кадрам» (для таймлайнов, досок) */
function dashLine(x1, y1, x2, y2, col, t, dash, wgt){
  dash = dash || 5; wgt = wgt || 1;
  const n = Math.max(Math.abs(x2-x1), Math.abs(y2-y1));
  const ph = Math.floor(t*14) % (dash*2);
  for(let k=0;k<=n;k++){
    if(((k + ph) % (dash*2)) >= dash) continue;
    const x = x1 + (x2-x1)*k/n, y = y1 + (y2-y1)*k/n;
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), wgt, wgt);
  }
}

/* ---------- «juice» ---------- */
let PUNCH = 0;
function punch(k){ PUNCH = Math.max(PUNCH, k==null?.06:k); }
/** Световая рамка по краям кадра — «удар» без сдвига координат */
function drawPunch(dt, col){
  if(PUNCH > 0){
    PUNCH = Math.max(0, PUNCH - dt);
    const k = PUNCH/0.07;
    const c = col || '#ffd166';
    ctx.globalAlpha = k*.5;
    const bw = Math.max(2, Math.round(3 + k*7));
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, W, bw); ctx.fillRect(0, H-bw, W, bw);
    ctx.fillRect(0, 0, bw, H); ctx.fillRect(W-bw, 0, bw, H);
    ctx.globalAlpha = k*.18;
    glowAt(W/2, H/2, Math.max(W,H)*.55, c, k*.2);
    ctx.globalAlpha = 1;
  }
}
/** Удар: вспышка + кольцо + тряска + пиксели */
function smash(x, y, col, mag, to){
  impact(x, y, col, mag||5, to||26);
  punch(0.07);
  if(FXQ > .5) for(let i=0;i<10;i++) fx(x, y, 2, col, 70, .5);
}
/** Конфетти/сердечки из точки */
function burstHearts(x, y, n, col){
  for(let i=0;i<(n||8);i++){
    const a = Math.random()*6.28, sp = 20 + Math.random()*45;
    HEARTFX.push({x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 26, t:0, life:.9+Math.random()*.5, col:col||CONFIG.P.pink2, sc:Math.random()<.35?2:1});
  }
}
const HEARTFX = [];
function updateHeartFX(dt){
  for(let i=HEARTFX.length-1;i>=0;i--){
    const p = HEARTFX[i];
    p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 150*dt; p.vx *= 0.99;
    if(p.t > p.life) HEARTFX.splice(i,1);
  }
}
function drawHeartFX(){
  for(const p of HEARTFX){
    ctx.globalAlpha = clamp(1 - p.t/p.life, 0, 1);
    heart(p.x, p.y, p.sc, p.col);
  }
  ctx.globalAlpha = 1;
}
/** Счётчик, «наезжающий» на число */
function rollNum(cur, target, dt, speed){
  if(cur.n == null){ cur.n = target; }
  const d = target - cur.n;
  if(Math.abs(d) < 0.01){ cur.n = target; return target; }
  cur.n += d * clamp(dt*(speed||4), 0, 1);
  return Math.round(cur.n);
}
/** Печатная машинка (для подсказок/реплик) */
function typed(s, k){ return s.slice(0, Math.floor(k)); }

/* ---------- «маленький» HUD-чип с прогрессом уровня ---------- */
function epProgress(cur, total, x, y, col){
  for(let i=0;i<total;i++){
    const on = i < cur, cn = i === cur-1 && cur < total;
    ctx.fillStyle = on ? (col||CONFIG.P.gold) : 'rgba(58,37,96,.9)';
    ctx.fillRect(x+i*9, y, 7, 7);
    if(on){
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x+i*9, y, 7, 1);
      if(FXQ > .5 && cn){
        ctx.globalAlpha = .4 + .6*Math.abs(Math.sin(G.t*3));
        glowAt(x+i*9+3, y+3, 7, col||CONFIG.P.gold, .3);
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.fillStyle = 'rgba(107,79,160,.5)'; ctx.fillRect(x+i*9+2, y+2, 3, 3);
    }
  }
}
