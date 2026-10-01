/* ==========================================================================
   ЧАСТЬ 32 · ЧЕТВЁРТАЯ ВОЛНА — графика для пяти игр архива.
   Только добавляем: пыль, лампы, дождь, свечение, не трогая механику.
   01 ШИФР     — пыль в луче и лампа за активным диском
   02 СОЗВЕЗДИЕ— падающие звёзды и дымка
   03 МУЗЫКА   — ноты-следы и пульс в такт
   04 ДЕТЕКТИВ — дождь за окном и мигающая лампа
   05 КОМНАТА  — пылинки в лунном луче
   ========================================================================== */

/* мелкая пыль, кэшируется по размеру экрана */
const APD = [];
function apDust(n){
  const key = Math.round(W)+'x'+Math.round(H);
  if(APD.key === key) return APD.a;
  const R = mulberry32(909);
  const a = [];
  const cnt = n || Math.round(clamp(W*H/3000, 18, 46));
  for(let i=0;i<cnt;i++) a.push({x:R()*W, y:R()*H, b:R(), s:Math.random()<.15?2:1});
  APD.a = a; APD.key = key;
  return a;
}
function drawDust(t, alpha, top, col){
  const a = apDust();
  ctx.fillStyle = col || '#ffe6a8';
  for(const d of a){
    const yy = ((d.y + t*3.2*d.b) % (H+8)) - 4;
    if(yy < (top||0)) continue;
    ctx.globalAlpha = alpha*(0.35 + 0.65*Math.abs(Math.sin(t*0.9 + d.b*11)));
    ctx.fillRect(Math.round(d.x), Math.round(yy), d.s, d.s);
  }
  ctx.globalAlpha = 1;
}
/* дождь для детектива */
function drawRain(t, n, col, alpha){
  ctx.fillStyle = col || '#8fb0e8';
  for(let i=0;i<(n||24);i++){
    const y = ((i*83 + t*230) % (H+20)) - 10;
    const x = ((i*47 + t*26) % (W+20)) - 10;
    ctx.globalAlpha = alpha*(0.5 + 0.5*((i%3)/2));
    ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
  }
  ctx.globalAlpha = 1;
}

/* ==========================================================================
   01 · ШИФР, КОТОРЫЙ МЕНЯЕТСЯ
   ========================================================================== */
(function(){
const L = ARCH_LEVELS.cipher; if(!L) return;
bpFields(L, {bpDust:0});
bpWrap(L, 'draw', function(){
  drawDust(this.t, 0.13, 0, '#ffd9a8');
  const d = this.dial;
  if(d && this.scene === 'dial'){
    const a = 0.10 + 0.06*Math.abs(Math.sin(this.t*2.4));
    ctx.globalAlpha = a;
    glowAt(d.x != null ? d.x : W/2, d.y != null ? d.y : H*0.5, 34, CONFIG.P.gold, 1);
    ctx.globalAlpha = 1;
  }
});
})();

/* ==========================================================================
   02 · СОЗВЕЗДИЕ
   ========================================================================== */
(function(){
const L = ARCH_LEVELS.stars; if(!L) return;
bpWrap(L, 'draw', function(){
  starfall(this.t);
  // лёгкая дымка неба
  ctx.globalAlpha = 0.05 + 0.02*Math.sin(this.t*0.6);
  for(let i=0;i<3;i++){
    ctx.fillStyle = ['#4a2a7a','#1e3a6b','#5a2050'][i];
    const y = H*(0.25 + i*0.22) + Math.sin(this.t*0.4 + i)*5;
    ctx.fillRect(0, Math.round(y), W, 8);
  }
  ctx.globalAlpha = 1;
});
})();

/* ==========================================================================
   03 · МУЗЫКА ВОСПОМИНАНИЙ
   ========================================================================== */
(function(){
const L = ARCH_LEVELS.music; if(!L) return;
bpFields(L, {bpNote:null});
bpWrap(L, 'draw', function(){
  const P = CONFIG.P;
  // пульс в такт
  if(this.pulse > 0){
    const k = clamp(this.pulse, 0, 1);
    ctx.globalAlpha = k*0.10;
    glowAt(W/2, H*0.5, Math.max(W,H)*0.45, P.pink, 1);
    ctx.globalAlpha = 1;
  }
  // ноты-следы
  if(this.bassT > 0){
    ctx.globalAlpha = clamp(this.bassT, 0, 1)*0.5;
    ctx.fillStyle = P.sky;
    for(let i=0;i<3;i++) heart(W/2-4, Math.round(H*0.62) - i*7, 1, P.sky);
    ctx.globalAlpha = 1;
  }
  drawDust(this.t, 0.10, 0, '#cfe0ff');
});
})();

/* ==========================================================================
   04 · ДЕТЕКТИВ
   ========================================================================== */
(function(){
const L = ARCH_LEVELS.case_; if(!L) return;
bpFields(L, {bpFlick:0});
bpWrap(L, 'update', function(){
  // лампа иногда мигает — как будто патрон на исходе
  if(Math.random() < 0.004) this.bpFlick = 0.10;
  if(this.bpFlick > 0) this.bpFlick -= 1/60;
});
bpWrap(L, 'draw', function(){
  drawRain(this.t, 22, '#8fb0e8', 0.16);
  const f = this.bpFlick > 0 ? (0.5 + 0.5*Math.abs(Math.sin(this.t*40))) : 1;
  ctx.globalAlpha = 0.07*f;
  ctx.fillStyle = '#ffd9a8';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  // виньетка сильнее — мрачнее
  ctx.globalAlpha = 0.30 + 0.05*Math.sin(this.t*0.8);
  for(let i=0;i<10;i++){
    ctx.fillStyle = 'rgba(4,2,10,.5)';
    const inset = i*2;
    ctx.fillRect(inset, inset, W-inset*2, 2);
    ctx.fillRect(inset, H-inset*2, W-inset*2, 2);
    ctx.fillRect(inset, inset, 2, H-inset*2);
    ctx.fillRect(W-inset*2, inset, 2, H-inset*2);
  }
  ctx.globalAlpha = 1;
});
})();

/* ==========================================================================
   05 · КОМНАТА, КОТОРАЯ ЗАПОМИНАЕТ
   ========================================================================== */
(function(){
const L = ARCH_LEVELS.room; if(!L) return;
bpWrap(L, 'draw', function(){
  if(this.photoView) return;                     // поверх фото пыль не нужна
  const g = this.geom ? this.geom() : {floorY: H-40};
  const wx = 8, wy = 36, ww = 20, wh = 24;
  ctx.globalAlpha = 0.5;
  for(const d of apDust(26)){
    const yy = ((d.y + this.t*2.2*d.b) % (H)) ;
    if(yy < wy + wh - 4) continue;
    ctx.globalAlpha = 0.5*(0.3 + 0.7*Math.abs(Math.sin(this.t*0.8 + d.b*9)));
    ctx.fillStyle = '#c8d8ff';
    ctx.fillRect(wx+4 + Math.round((yy - (wy+wh))*0.8), Math.round(yy), 1, 1);
  }
  ctx.globalAlpha = 1;
});
})();
