/* ==========================================================================
   ЧАСТЬ 17Б · ПОЛИРОВКА ИНТЕРФЕЙСА
   Титульная карточка уровня, дорожка и пульс на карте, оживление
   диалогов, рабочего стола и экрана награды.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1 · ТИТУЛЬНАЯ КАРТОЧКА УРОВНЯ (появляется при старте любой программы)
   -------------------------------------------------------------------------- */
G.cardT = 0;

function cardInfo(){
  const i = G.level;
  const lv = LEVELS[i];
  if(!lv) return null;
  const meta = NODE_META[i] || {};
  return {
    name: meta.short || meta.name || lv.name || '',
    full: meta.name || lv.name || '',
    sub:  meta.sub || lv.sub || '',
    h:    lv.hearts || 1,
    arc:  i >= EP_N
  };
}
function drawLevelCard(t){
  const inf = cardInfo();
  if(!inf) return;
  const DUR = 1.75;
  const k = t/DUR;
  const a = k < .12 ? k/.12 : (k > .78 ? clamp(1 - (k-.78)/.22, 0, 1) : 1);
  if(a <= 0) return;
  const P = CONFIG.P;
  const sc = popIn(k, .45);
  const bw = Math.min(W-24, 180), bh = 66;
  const cx = W/2, cy = H/2;
  ctx.globalAlpha = a;
  // затемнение
  ctx.fillStyle = 'rgba(8,4,18,'+(0.55*a).toFixed(2)+')';
  ctx.fillRect(0, 0, W, H);
  // вспышка при появлении
  if(k < .18) flashScreen(P.pink, .18*(1 - k/.18));
  const bx = Math.round(cx - bw/2), by = Math.round(cy - bh/2);
  ctx.fillStyle = 'rgba(10,5,22,.92)';
  ctx.fillRect(bx, by, Math.round(bw*sc), bh);
  ctx.fillStyle = inf.arc ? '#2d4a6b' : '#3a2560';
  ctx.fillRect(bx, by, Math.round(bw*sc), 2);
  ctx.fillStyle = P.pink;
  ctx.fillRect(bx, by+bh-2, Math.round(bw*sc), 2);
  // бегущий блик по верхней кромке
  if(sc > .55) shineRect(bx, by, Math.round(bw*sc), 2, t, P.pink, 90);
  if(sc > .6){
    const ico = inf.arc ? ((NODE_META[G.level] && NODE_META[G.level].icon) || 'dice')
                     : (EP_ICON_NAMES[G.level] || 'heart');
    ctx.globalAlpha = a;
    drawIconAt(ico, bx + 20, by + bh/2, 2, P.gold);
    const tx = bx + 38;
    const nsc = fitSc(inf.name, bw - 46, 1);
    text(inf.name, tx, by + 16, {sc:Math.max(1, nsc), color:P.ink});
    const sh = inf.arc ? 'БОНУС · ' + inf.h + ' СЕРД.' : ('СЕРДЕЦ: ' + inf.h);
    text(sh, tx, by + 30, {sc:1, color: inf.arc ? P.sky : P.pink2});
    if(inf.sub){
      const ssc = fitSc(inf.sub, bw - 48, 1);
      text(inf.sub, tx, by + 43, {sc:Math.max(1, ssc), color:P.dim});
    }
    // сердечки награды
    const hs = Math.min(inf.h, 4);
    for(let i2=0;i2<hs;i2++){
      const hx = bx + bw - 10 - i2*9;
      const pu = 1 + Math.max(0, .4 - ((t*.9 + i2*.12) % 1)) * .9;
      heart(hx, by + bh - 9, 1, P.pink);
      ctx.globalAlpha = a * (1 - Math.max(0, .25 - ((t*.9 + i2*.12) % 1)) * 1.6);
      heart(hx, by + bh - 9, 1, '#fff6e8');
      ctx.globalAlpha = a;
    }
  }
  ctx.globalAlpha = 1;
  // «загрузка» внизу
  if(k > .3){
    const lk = clamp((k-.3)/.7, 0, 1);
    const lw = Math.round(Math.min(60, lk*70));
    ctx.fillStyle = 'rgba(107,79,160,.4)'; ctx.fillRect(cx-lw/2, by+bh+8, lw, 2);
    ctx.fillStyle = P.gold; ctx.fillRect(cx-lw/2, by+bh+8, Math.round(lw*lk), 2);
  }
}

/* --------------------------------------------------------------------------
   2 · КАРТА: бегущая дорожка между узлами + пульс «следующего» узла
   -------------------------------------------------------------------------- */
const _mapCore0 = mapCore;
mapCore = function(x, y, w, h, tab, t, sel){
  const out = _mapCore0(x, y, w, h, tab, t, sel);
  const ns = out.nodes;
  if(!ns || ns.length < 2) return out;
  const P = CONFIG.P;
  // пунктирная дорожка между соседними узлами (бежит)
  for(let i=0;i<ns.length-1;i++){
    const a = ns[i], b = ns[i+1];
    const steps = Math.max(2, Math.round(Math.hypot(b.x-a.x, b.y-a.y)/5));
    for(let s=0;s<=steps;s++){
      const k = s/steps;
      const px = Math.round(lerp(a.x, b.x, k)), py = Math.round(lerp(a.y, b.y, k));
      if(Math.random() >= .5) continue;
      const ph = (t*2.4 - k*2) % 3;
      const al = ph > 0 && ph < 1 ? .55 : .12;
      ctx.globalAlpha = al;
      ctx.fillStyle = '#6b4fa0';
      ctx.fillRect(px, py, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  // пульс на следующем доступном узле
  const nx = nextPlayable(tab);
  if(nx != null){
    const n = ns.find(v => v.i === nx);
    if(n){
      const a = .5 + .5*Math.abs(Math.sin(t*3.2));
      ctx.globalAlpha = a*.5;
      ringPix(n.x, n.y, n.r + 3 + Math.round(a*3), P.gold, 1);
      ctx.globalAlpha = 1;
      // маленькая стрелка «сюда»
      const by = n.y - n.r - 6 - Math.round(a*2);
      ctx.fillStyle = P.gold;
      ctx.fillRect(n.x-1, by, 3, 1);
      ctx.fillRect(n.x-2, by+1, 5, 1);
      ctx.fillRect(n.x-3, by+2, 7, 1);
    }
  }
  return out;
};
/** какой узел на этой вкладке можно пройти следующим */
function nextPlayable(tab){
  if(tab === 1){
    for(let i=EP_N;i<EP_N+AR_N;i++) if(!G.hearts[i]) return i;
    return null;
  }
  for(let i=0;i<EP_N;i++) if(!G.hearts[i]) return i;
  if(finaleReady()) return FINALE_NODE;
  return null;
}

/* --------------------------------------------------------------------------
   3 · ДИАЛОГИ: из портрета поднимаются сердечки, «нажми пробел» пульсирует
   -------------------------------------------------------------------------- */
const _dlgDraw2 = G.screens.dialog.draw;
G.screens.dialog.draw = function(){
  _dlgDraw2.call(this);
  const d = G.dialog, line = d && d.lines[d.i];
  if(!line) return;
  const P = CONFIG.P, t = this.t;
  const col = line.who === 'her' ? P.pink : (line.who === 'him' ? P.sky : '#8f83ad');
  // сердечки, пока «печатается» реплика
  if(d.chars < line.text.length && Math.random() < .28){
    fx(20 + rnd(-3,3), H - 96 + rnd(-6,6), 1, col, 22, rnd(.6,1.1), {g:-14, s:Math.random()<.4?2:1, shape:'line'});
  }
  // подсказка «дальше»
  if(d.chars >= line.text.length && d.i === d.lines.length-1){
    const a = .45 + .55*Math.abs(Math.sin(t*4));
    ctx.globalAlpha = a;
    text(IS_TOUCH ? 'ТАПНИ' : 'ПРОБЕЛ', W - 12, H - 16, {sc:1, align:'right', color:P.gold});
    ctx.globalAlpha = 1;
  }
};

/* --------------------------------------------------------------------------
   4 · РАБОЧИЙ СТОЛ: пылинки в воздухе, мерцание иконок, подсказка
   -------------------------------------------------------------------------- */
const _deskDraw = G.screens.desktop.draw;
G.screens.desktop.draw = function(){
  updateDust(1/60, this.t);
  _deskDraw.call(this);
  drawDust();
  const P = CONFIG.P, t = this.t;
  // мягкое свечение под иконкой, на которую наведён курсор
  const it = this.icons && this.hover >= 0 ? this.icons[this.hover] : null;
  if(it && it.tx != null){
    pulseGlow(it.tx + (it.tw||40)/2, it.ty + (it.th||32)/2, 26, P.sky, t, 2.4, .22);
  }
  // подсказка «жми на иконку», пока ничего не выбрано
  if(this.lastSel < 0 && this.t > 1.2){
    const a = .3 + .3*Math.abs(Math.sin(t*2.2));
    ctx.globalAlpha = a;
    text(IS_TOUCH ? 'ТАПНИ НА ИКОНКУ' : 'СТРЕЛКИ + ПРОБЕЛ', W/2, H - 22, {sc:1, align:'center', color:'#6b4fa0'});
    ctx.globalAlpha = 1;
  }
};

/* --------------------------------------------------------------------------
   5 · ЭКРАН НАГРАДЫ: конфетти, вспышка, «сердечко получено» с анимацией
   -------------------------------------------------------------------------- */
const _rewDraw = G.screens.reward.draw;
G.screens.reward.draw = function(){
  const t0 = this.t;
  _rewDraw.call(this);
  const P = CONFIG.P;
  if(t0 < 1.1 && Math.random() < .5) confettiRain(3);
  if(t0 < .5) flashScreen(P.pink, .10);
  // «взрыв» из центра в момент появления
  if(this._burst !== t0){
    this._burst = t0;
    if(t0 < .05){
      confettiRain(40);
      ring(W/2, H/2-10, P.gold, 40, .6, 1);
      shake(3);
    }
  }
  // ряд сердец прогресса с «дыханием»
  const n = heartsDone();
  for(let i=0;i<NH;i++){
    const on = G.hearts[i];
    if(!on) continue;
    const pu = 1 + .18*Math.abs(Math.sin(t0*3 - i*.4));
    ctx.globalAlpha = .35;
    heart(W/2 - (NH*14)/2 + i*14, H/2+36, 2*pu, P.pink);
    ctx.globalAlpha = 1;
  }
  text(n + ' / ' + NH + ' СЕРДЕЦ СОБРАНО', W/2, H/2+64, {sc:1, align:'center', color:P.dim});
};

/* --------------------------------------------------------------------------
   6 · ЗАПУСК КАРТОЧКИ
   -------------------------------------------------------------------------- */
const CARD_DUR = 1.75;
G.cardAge = 0;
const _lvlEnter = G.screens.level.enter;
G.screens.level.enter = function(){ _lvlEnter.call(this); G.cardT = CARD_DUR; G.cardAge = 0; };
const _lvlUpd2 = G.screens.level.update;
G.screens.level.update = function(dt){
  if(G.cardT > 0){ G.cardAge += dt; G.cardT = Math.max(0, CARD_DUR - G.cardAge); }
  _lvlUpd2.call(this, dt);
};
const _lvlDraw2 = G.screens.level.draw;
G.screens.level.draw = function(){
  _lvlDraw2.call(this);
  if(G.cardT > 0) drawLevelCard(G.cardAge);
};


/* --------------------------------------------------------------------------
   7 · ВОЗДУХ НА УЛИЦЕ: лепестки-сердечки поверх «уличных» уровней
   -------------------------------------------------------------------------- */
const _lvlDraw3 = G.screens.level.draw;
G.screens.level.draw = function(){
  const lv = LEVELS[G.level];
  const amb = lv && AMBIENT_LV[G.level];
  if(amb) updatePetals(1/60, this.t, lv.wind || 0);
  _lvlDraw3.call(this);
  if(amb) drawPetals(this.t);
};
