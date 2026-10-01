/* ==========================================================================
   ЧАСТЬ 17В · АТМОСФЕРА УРОВНЕЙ
   Летающие сердечки-лепестки, мокрый город с молниями, лужи с кругами,
   туман. Включается только для «уличных» уровней.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1 · ЛЕПЕСТКИ-СЕРДЕЧКИ, летящие перед камерой (воздух на улице)
   -------------------------------------------------------------------------- */
const PETALS = [];
function initPetals(n){
  PETALS.length = 0;
  for(let i=0;i<(n||14);i++) PETALS.push(newPetal(true));
}
function newPetal(anywhere){
  return {
    x: rnd(-8, W+8), y: anywhere ? rnd(-6, H) : -6,
    vy: rnd(6, 20), vx: rnd(-9, 9),
    sc: Math.random()<.25 ? 2 : 1,
    a: rnd(.15, .5), sw: rnd(0, 6.283), sp: rnd(.6, 1.6),
    col: Math.random()<.3 ? CONFIG.P.gold : CONFIG.P.pink2
  };
}
function updatePetals(dt, t, wind){
  if(Math.random() < dt*1.6) PETALS.push(newPetal(false));
  for(let i=PETALS.length-1;i>=0;i--){
    const p = PETALS[i];
    p.y += p.vy*dt;
    p.x += (p.vx + Math.sin(t*p.sp + p.sw)*8 + (wind||0)*0.25)*dt;
    if(p.y > H+6 || p.x < -12 || p.x > W+12) PETALS.splice(i,1);
  }
}
function drawPetals(t){
  for(const p of PETALS){
    ctx.globalAlpha = p.a * (.65 + .35*Math.abs(Math.sin(t*p.sp + p.sw)));
    heart(Math.round(p.x), Math.round(p.y), p.sc, p.col);
  }
  ctx.globalAlpha = 1;
}
/** уровни, где «снаружи» — включаем воздух и погоду */
const AMBIENT_LV = { 5:true, 6:true, 7:true, 8:true, 10:true, 12:true };

/* --------------------------------------------------------------------------
   2 · МОКРЫЙ ГОРОД: силуэт домов, окна, туман (для уровня с зонтом)
   -------------------------------------------------------------------------- */
const CITY = null;
function buildCity(){
  if(CITY) return CITY;
  const cols = [], R = mulberry32(11);
  let x = -4;
  while(x < W + 8){
    const w = Math.round(rnd(16, 30, R)), h = Math.round(rnd(26, 74, R));
    const wins = [];
    for(let wy=4; wy<h-4; wy+=7){
      for(let wx=3; wx<w-3; wx+=6){
        if(R() < .45) wins.push({x:wx, y:wy, on: R() < .55, ph: R()*6.283});
      }
    }
    cols.push({x:x, w:w, h:h, wins:wins});
    x += w + 1;
  }
  return (buildCity.c = cols);
}
function rnd(a, b, R){ return a + (R ? R() : Math.random())*(b-a); }
function drawCity(t, baseY, dim){
  const cols = buildCity.c || buildCity();
  for(const b of cols){
    const y = baseY - b.h;
    ctx.fillStyle = dim ? '#17102c' : '#1d1338';
    ctx.fillRect(b.x, y, b.w, b.h);
    ctx.fillStyle = dim ? '#241a40' : '#2a1c4e';
    ctx.fillRect(b.x, y, b.w, 2);
    for(const wn of b.wins){
      const on = wn.on && (Math.sin(t*0.7 + wn.ph) > -0.3);
      ctx.fillStyle = on ? 'rgba(255,209,102,.55)' : 'rgba(90,74,128,.35)';
      ctx.fillRect(b.x+wn.x, y+wn.y, 3, 4);
    }
  }
}
/** молния: вспышка + ломаная линия */
function drawLightning(t, strike){
  if(!strike) return;
  const k = strike.t/strike.life;
  const a = k < .12 ? k/.12 : (1 - (k-.12)/.88);
  if(a <= 0) return;
  ctx.globalAlpha = a*0.75;
  ctx.fillStyle = '#cfe0ff';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  const x0 = strike.x, seg = Math.max(2, Math.round(H*0.12));
  ctx.fillStyle = '#e8f2ff';
  for(let y=0, x=x0; y<H*0.55; y+=seg){
    const nx = x + Math.round(Math.sin(y*0.3 + strike.ph)*5);
    ctx.fillRect(nx, y, 2, seg);
    if(Math.random() < .25) ctx.fillRect(nx + (Math.random()<.5?2:-2), y+seg/2, 2, 2);
    x = nx;
  }
  ctx.globalAlpha = 1;
}
function updateLightning(lv, dt){
  lv._boltT = (lv._boltT || rnd(4, 9)) - dt;
  if(lv._boltT <= 0){
    lv._boltT = rnd(5, 12);
    lv._bolt = {x: rnd(W*0.15, W*0.85), t:0, life:0.28, ph: rnd(0,6.283)};
    Snd.blip();
  }
  if(lv._bolt){ lv._bolt.t += dt; if(lv._bolt.t > lv._bolt.life) lv._bolt = null; }
}
/** лужи с кругами от капель */
const PUDDLES = [];
function initPuddles(n, y){
  PUDDLES.length = 0;
  for(let i=0;i<(n||4);i++) PUDDLES.push({x: rnd(8, W-8), w: rnd(14, 34), r: []});
}
function drawPuddles(t, y){
  for(const p of PUDDLES){
    ctx.fillStyle = 'rgba(78,130,200,.30)';
    ctx.fillRect(Math.round(p.x - p.w/2), y, Math.round(p.w), 3);
    ctx.fillStyle = 'rgba(140,190,255,.18)';
    ctx.fillRect(Math.round(p.x - p.w/2 + 2), y, Math.round(p.w) - 4, 1);
    // круги от капель
    if(Math.random() < .25) p.r.push({x: rnd(-p.w/2+2, p.w/2-2), t:0});
    for(let i=p.r.length-1;i>=0;i--){
      const c = p.r[i];
      c.t += 1/30;
      if(c.t > .5){ p.r.splice(i,1); continue; }
      ctx.globalAlpha = 1 - c.t/.5;
      ringPix(p.x + c.x, y+1, Math.round(1 + c.t*5), '#9ec8ff', 1);
      ctx.globalAlpha = 1;
    }
  }
}
/** мокрый асфальт с отражениями */
function wetGround(y, t){
  ctx.fillStyle = '#181030'; ctx.fillRect(0, y, W, H-y);
  ctx.fillStyle = 'rgba(120,160,230,.10)';
  for(let i=0;i<10;i++){
    const yy = y + 2 + (i%4)*3;
    const xx = Math.round(((i*61 + t*8) % (W+40)) - 20);
    ctx.fillRect(xx, yy, 20, 1);
  }
  ctx.fillStyle = 'rgba(200,220,255,.14)';
  ctx.fillRect(0, y, W, 1);
}
