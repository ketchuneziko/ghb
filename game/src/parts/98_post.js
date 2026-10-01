/* ==========================================================================
   ЧАСТЬ 98 · ПОСТ-ЭФФЕКТЫ ПОВЕРХ КАДРА
   Обёртка главного цикла: сердечки, «удар» рамкой, авто-качество
   ========================================================================== */

const _frame0 = frame;
let _lastT = 0;
frame = function(now){
  const dt = _lastT ? Math.min(.05, (now - _lastT)/1000) : .016;
  _lastT = now;
  _frame0(now);
  // сердечки/конфетти поверх всего кадра
  updateHeartFX(dt);
  drawHeartFX();
  // магия команды love — розовые пиксели и звёздочки поверх всего
  updateLoveFX(dt);
  drawLoveFX();
  // «удар» рамкой
  drawPunch(dt);
  // новые слои: след сердец, экранная шторка
  updateHeartTrail(dt);
  drawHeartTrail();
  updateWipe(dt);
  drawWipe();
};

/* --- авто-качество: если стабильно тормозит — упрощаем эффекты --- */
let _slowT = 0, _frames = 0, _acc = 0, _probeT = 0;
const _origUpdate = G.screens.__probe = null;
(function(){
  const probe = ()=>{
    const n0 = G.__fc || 0;
    setTimeout(()=>{
      const fps = (G.__fc - n0)/2;
      if(fps < 26 && FXQ > .4){ FXQ = .4; } else if(fps > 50 && FXQ < 1){ FXQ = 1; }
    }, 2000);
  };
  const oldFrame = frame;
  frame = function(now){ G.__fc = (G.__fc||0)+1; oldFrame(now); };
  probe(); setInterval(probe, 6000);
})();
