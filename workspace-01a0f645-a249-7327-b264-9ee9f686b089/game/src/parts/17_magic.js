/* ==========================================================================
   ЧАСТЬ 17 · МАГИЯ КОМАНДЫ love
   Розовые пиксельные частицы и мерцающие звёздочки поверх всего экрана.
   ========================================================================== */

const LOVEFX = [];
let LOVE_T = 0;

/** запускает магию на dur секунд */
function loveMagic(dur){
  LOVE_T = dur || 4.5;
  LOVEFX.length = 0;
}
function spawnLove(n){
  for(let i=0;i<n;i++){
    // из краёв экрана внутрь
    const side = rndi(0, 4);
    let x, y, ang;
    if(side === 0){ x = rnd(-4, W+4); y = -4; ang = Math.PI/2; }
    else if(side === 1){ x = W+4; y = rnd(0, H); ang = Math.PI; }
    else if(side === 2){ x = rnd(0, W); y = H+4; ang = -Math.PI/2; }
    else { x = -4; y = rnd(0, H); ang = 0; }
    const star = Math.random() < 0.3;
    const sp = rnd(20, 60);
    LOVEFX.push({
      x:x, y:y, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp,
      t:0, life: rnd(2.2, 4.6), star: star,
      col: star ? (Math.random()<.5 ? CONFIG.P.gold : '#fff6e8') : (Math.random()<.5 ? CONFIG.P.pink : CONFIG.P.pink2),
      ph: rnd(0, 6.283), sc: rndi(1, 2)
    });
  }
}
function updateLoveFX(dt){
  if(LOVE_T > 0){
    LOVE_T -= dt;
    if(Math.random() < dt*26) spawnLove(3);
    if(LOVE_T <= 0) LOVEFX.length = 0;
  }
  for(let i=LOVEFX.length-1;i>=0;i--){
    const p = LOVEFX[i];
    p.t += dt; p.ph += dt*6;
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.vx *= 0.995; p.vy = p.vy*0.995 - 6*dt;
    if(p.t > p.life) LOVEFX.splice(i,1);
  }
}
function drawLoveFX(){
  if(!LOVEFX.length) return;
  for(const p of LOVEFX){
    const k = p.t/p.life;
    let a = clamp(1 - k*k, 0, 1);
    if(p.star) a *= 0.35 + 0.65*Math.abs(Math.sin(p.ph));
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    if(p.star){
      const s = p.sc+1, x = Math.round(p.x), y = Math.round(p.y);
      ctx.fillRect(x-2, y, 5, 1); ctx.fillRect(x, y-2, 1, 5);
      ctx.fillRect(x-1, y-1, 3, 3);
    } else {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.sc, p.sc);
    }
  }
  ctx.globalAlpha = 1;
}
