/* ==========================================================================
   ЧАСТЬ 33 · ЦЕРЕМОНИЯ — «грандиозность» в ключевых моментах
   Экран награды: лучи, печать, искры, имя уровня.
   Карточки архива: дыхание, свечение при наведении.
   Ничего не меняем в логике — только добавляем слои поверх.
   ========================================================================== */

(function(){
const R = G.screens.reward; if(!R || !R.draw) return;
const _d = R.draw;
let sparks = [];
R.enter = function(){
  this.t = 0; this.done = false; Snd.fanfare();
  sparks = [];
  for(let i=0;i<26;i++) sparks.push({a:Math.random()*6.28, r:6+Math.random()*30, s:0.6+Math.random()*1.4, p:Math.random()*6.28});
};
R.draw = function(){
  const P = CONFIG.P, t = this.t, cx = W/2, cy = H/2-10;
  // лучи из сердца
  const rays = 12;
  ctx.globalAlpha = 0.10 + 0.05*Math.abs(Math.sin(t*1.6));
  for(let i=0;i<rays;i++){
    const a = i/rays*6.283 + t*0.18;
    const r0 = 22 + 3*Math.sin(t*3 + i), r1 = 46 + 10*Math.sin(t*2 + i*1.3);
    for(let r=r0;r<r1;r+=3){
      const al = 1 - (r-r0)/(r1-r0);
      ctx.globalAlpha = 0.10*al;
      ctx.fillStyle = i%2 ? P.gold : P.pink;
      ctx.fillRect(Math.round(cx+Math.cos(a)*r), Math.round(cy+Math.sin(a)*r*0.8), 2, 2);
    }
  }
  ctx.globalAlpha = 1;
  _d.call(this);
  // искры вокруг сердца
  for(const s of sparks){
    s.p += 1/60*s.s;
    const a = s.a + t*0.7, r = s.r + 6*Math.sin(t*1.4 + s.p);
    const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r*0.8;
    ctx.globalAlpha = 0.5 + 0.4*Math.sin(t*3 + s.p);
    ctx.fillStyle = s.s > 1.4 ? P.gold : P.pink2;
    ctx.fillRect(Math.round(x)-1, Math.round(y)-1, 2, 2);
    ctx.globalAlpha = 1;
  }
  // печать «ПОЛУЧЕНО»
  if(t > 0.9){
    const k = clamp((t-0.9)/0.35, 0, 1);
    const s2 = lerp(2.2, 1, easeOut(k));
    const ang = -0.18;
    const tw = textW('ПОЛУЧЕНО', s2);
    ctx.save();
    ctx.translate(cx, cy-34); ctx.rotate(ang); ctx.scale(k, k);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = 'rgba(90,20,50,.5)';
    ctx.fillRect(-tw/2-4, -9, tw+8, 18);
    ctx.globalAlpha = 0.95;
    text('ПОЛУЧЕНО', 0, -3, {sc:s2, align:'center', color:'#ffd6e2'});
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // имя уровня — мелким шрифтом внизу
  const nm = (G.reward && G.reward.i != null && LEVELS[G.reward.i]) ? LEVELS[G.reward.i].name : '';
  if(nm && t > 1.3){
    ctx.globalAlpha = 0.55;
    text(nm, cx, cy+78, {sc:fitSc(nm, W-20, 1), align:'center', color:P.dim});
    ctx.globalAlpha = 1;
  }
};
})();

/* --- карточки архива: дыхание и подсветка --- */
(function(){
const A = G.screens.arcard; if(!A || !A.draw) return;
const _d = A.draw;
A.draw = function(){
  const P = CONFIG.P, t = this.t;
  _d.call(this);
  // мягкое свечение под выбранной карточкой
  if(this.sel != null && this.cards && this.cards[this.sel]){
    const c = this.cards[this.sel];
    const a = 0.08 + 0.05*Math.abs(Math.sin(t*2.2));
    ctx.globalAlpha = a;
    glowAt(c.x + c.w/2, c.y + c.h/2, Math.max(c.w, c.h)*0.6, P.gold, 1);
    ctx.globalAlpha = 1;
  }
  // пыль в фоне
  if(typeof drawDust === 'function') drawDust(t, 0.07, 0, '#c9bde8');
};
})();
