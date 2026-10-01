/* ==========================================================================
   НОВАЯ ИГРА: АРИТМИЯ / ПОЙМАЙ УДАР СЕРДЦА
   Вместо старой игры с бегущими нотами — пульсирующий ритм,
   нужно нажимать ровно в тот момент когда расширяющийся круг совпадет
   с сердечком в центре. Постепенное ускорение, меняющийся ритм,
   комбо, идеальные попадания и режим сердечной лихорадки.
   ========================================================================== */
(function(){
  L7.enter = function(){
    this.t = 0; this.meter = 50; this.combo = 0; this.bestCombo = 0;
    this.cx = W/2; this.cy = Math.round(H*0.55);
    this.pulseR = 0; this.pulseT = 0; this.holdTime = 0;
    this.totalHits = 0; this.totalBeats = 0; this.needBeats = 12;
    this.bpm = 72; this.nextBeat = 1.2; this.perfectCount = 0;
    this.fever = 0; this.feverT = 0;
    this.heartScale = 1;
    this.hintY = 30;
    this.pulseDir = 1; // импульс расширяется наружу
  };
  L7.update = function(dt){
    this.t += dt;
    // Лихорадка после 5 идеальных попаданий подряд
    if(this.feverT>0){
      this.feverT -= dt;
      this.fever = clamp(this.feverT/5, 0, 1);
      if(this.feverT<=0){ this.fever = 0; this.say('КОНЕЦ ЛИХОРАДКИ', CONFIG.P.dim); }
    }
    // BPM постепенно растет — ритм ускоряется
    this.bpm = Math.min(150, 72 + this.totalHits*4);
    const beatDur = 60/this.bpm;
    // Новый удар
    if(this.t >= this.nextBeat){
      this.nextBeat = this.t + beatDur*(0.85 + Math.random()*0.3); // немного меняющийся ритм
      this.pulseR = 0;
      this.pulseT = beatDur;
      this.pulseDir = 1;
      this.totalBeats++;
      Snd.note(120 + this.totalBeats*5, 0.08, 'sine', 0.18);
      // пульс сердца
      this.heartScale = 1.3;
      if(this.feverT<=0) ring(this.cx, this.cy, CONFIG.P.pink2, 22, 0.3);
      else ring(this.cx, this.cy, CONFIG.P.gold, 30, 0.4);
    }
    // Расширение импульса от центра
    if(this.pulseT>0){
      this.pulseT -= dt;
      const prog = 1 - this.pulseT/beatDur;
      this.pulseR = prog * 86; // максимальный радиус импульса
    }
    // Сердце бьётся
    this.heartScale = lerp(this.heartScale, 1, 0.15);
    // Сообщения
    if(this.msgT>0) this.msgT -= dt;
    // Победа или поражение
    if(this.meter>=100){ this.meter = 100; winLevel(LEVELS.indexOf(this)); }
    if(this.meter<=0){ comboBreak(); loseLevel('Сердце сбилось. Ещё разок!'); }
  };
  L7.say = function(t, col){ this.msg = t; this.msgCol = col||CONFIG.P.ink; this.msgT = 0.7; };
  L7.hit = function(){
    if(this.pulseT <= 0) return;
    const targetR = 48; // радиус идеального попадания вокруг сердца
    const d = Math.abs(this.pulseR - targetR);
    if(d < 4){
      // ИДЕАЛЬНОЕ попадание
      this.meter += (this.feverT>0?12:8);
      this.combo++;
      this.perfectCount++;
      Snd.coin(); Snd.fanfare();
      hitstop(0.05); shake(2);
      popText(this.cx, this.cy-32, 'ИДЕАЛЬНО! +'+(this.feverT>0?12:8), CONFIG.P.gold);
      ring(this.cx, this.cy, CONFIG.P.gold, 28, 0.4);
      fx(this.cx, this.cy, 14, [CONFIG.P.gold, '#fff6e8', CONFIG.P.pink], 90, 0.6, {g:30});
      this.totalHits++;
      if(this.perfectCount >= 5 && this.feverT<=0){
        this.perfectCount = 0;
        this.feverT = 5;
        this.say('★ СЕРДЕЧНАЯ ЛИХОРАДКА ★', CONFIG.P.gold);
        flashScreen(CONFIG.P.gold, 0.3);
        slowmo(0.4, 0.4);
        for(let i=0;i<20;i++) fx(this.cx+rnd(-30,30), this.cy+rnd(-30,30), 1, CONFIG.P.gold, 100, 0.8, {g:0});
      }
    } else if(d < 12){
      // ХОРОШО
      this.meter += (this.feverT>0?6:3.5);
      this.combo++;
      Snd.coin();
      popText(this.cx, this.cy-32, '+'+(this.feverT>0?6:3), CONFIG.P.pink2);
      ring(this.cx, this.cy, CONFIG.P.pink2, 20, 0.3);
      fx(this.cx, this.cy, 8, CONFIG.P.pink, 70, 0.4, {g:30});
      this.totalHits++;
      this.say('ПОПАЛ!', CONFIG.P.pink2);
    } else {
      // МИМО
      this.meter -= (this.feverT>0?3:5);
      this.combo = 0;
      this.perfectCount = 0;
      Snd.bad(); shake(3);
      flashScreen(CONFIG.P.red, 0.12);
      popText(this.cx, this.cy-32, '-'+(this.feverT>0?3:5), CONFIG.P.red);
      this.say('НЕ В ТАКТ', CONFIG.P.red);
    }
    // сброс импульса после нажатия
    this.pulseT = 0;
    this.pulseR = 0;
    if(this.combo > this.bestCombo) this.bestCombo = this.combo;
  };
  L7.key = function(k){ if(k===' '||k==='Enter') this.hit(); };
  L7.tap = function(){ this.hit(); };
  L7.draw = function(){
    const P = CONFIG.P;
    if(this.feverT>0){
      const sk = Math.floor(this.t*3) % 4;
      ctx.drawImage(bgCache('rythm_fever'+sk, paint=>{
        ditherGradVTo(paint, 0, 0, W, H, '#4a1038', '#1a0620', 14);
        veilBlobTo(paint, W*0.3, H*0.35, Math.max(W,H)*0.7, 'rgba(255,93,143,.22)');
        veilBlobTo(paint, W*0.75, H*0.6, Math.max(W,H)*0.6, 'rgba(76,201,240,.16)');
      }), 0, 0);
      ctx.globalAlpha = 0.12 + 0.08*Math.abs(Math.sin(this.t*7));
      ctx.fillStyle = CONFIG.P.gold; ctx.fillRect(0,0,W,H);
      ctx.globalAlpha = 1;
    } else {
      skyBg(this.t);
    }
    // Фоновая ЭКГ как пульс
    ctx.fillStyle = 'rgba(255,93,143,.18)';
    const ekg = [0,0,0,5,-8,12,-6,0,0,0];
    for(let x=0;x<W;x++){
      const i = Math.floor(((x + this.t*50) % (W)) / (W/ekg.length));
      ctx.fillRect(x, Math.round(H*0.28) - ekg[Math.min(ekg.length-1,i)], 1, 1);
    }
    // Мерцающие звезды фона
    if(FXQ > .4){
      ctx.fillStyle = '#cfe0ff';
      for(let i=0;i<18;i++){
        const R = mulberry32(i*7+3);
        const x = (R()*W) | 0, y = (R()*H*0.6) | 0;
        const a = .1 + .8*Math.abs(Math.sin(this.t*(.5+R()) + R()*6));
        ctx.globalAlpha = a*.5;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    // Целевой круг (куда нужно попасть импульсом)
    ctx.strokeStyle = 'rgba(255,93,143,.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, 48, 0, Math.PI*2);
    ctx.stroke();
    // Золотое идеальное кольцо
    const k = 0.3 + 0.3*Math.abs(Math.sin(this.t*4));
    ctx.globalAlpha = k;
    ctx.strokeStyle = P.gold;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, 48, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Пульсирующий импульс от нажатия
    if(this.pulseT>0){
      const col = this.feverT>0 ? P.gold : P.pink2;
      ctx.globalAlpha = Math.max(0, 0.8 - this.pulseR/100);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, Math.round(this.pulseR), 0, Math.PI*2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      glowAt(this.cx, this.cy, this.pulseR, col, 0.12);
    }
    // Сердце в центре
    const hs = 3 + Math.round(this.heartScale);
    if(FXQ > .4) glowAt(this.cx, this.cy-2, hs*4, P.pink, .3 + .1*Math.sin(this.t*3));
    heart(this.cx-hs, this.cy-hs-2, hs, P.pink);
    // Счетчик ударов
    chip(6, 4, 'ПОПАДАНИЙ: '+this.totalHits+'/'+this.needBeats, this.totalHits>=this.needBeats?P.gold:P.ink);
    // Шкала любовного наполнения
    const bw = Math.min(W-40, 180), bx = Math.round(W/2-bw/2), by = 15;
    ctx.fillStyle = 'rgba(9,5,20,.72)'; ctx.fillRect(bx-7, 0, bw+14, 25);
    ctx.fillStyle = 'rgba(107,79,160,.55)'; ctx.fillRect(bx-7, 24, bw+14, 1);
    text('РИТМ СЕРДЦА', W/2, 2, {sc:1, align:'center', color: this.feverT>0?P.gold:P.dim});
    hudBar(bx, by, bw, 8, this.meter/100, this.meter>70?P.gold:P.pink, P.gold);
    if(this.feverT>0){
      const w2 = 30, k2 = clamp(this.feverT/5,0,1);
      ctx.fillStyle = '#120a24'; ctx.fillRect(bx, by+11, w2, 3);
      ctx.fillStyle = P.gold; ctx.fillRect(bx, by+11, Math.round(w2*k2), 3);
    }
    // Сообщение
    if(this.msgT>0){
      ctx.globalAlpha = clamp(this.msgT*1.7,0,1);
      text(this.msg, this.cx, this.cy-50, {sc:1, align:'center', color:this.msgCol, shadow:'#1b1035'});
      ctx.globalAlpha = 1;
    }
    if(this.combo >= 2) drawCombo(W-6, H-24, 'ЦЕПЬ x'+this.combo, 'right');
    text('BPM: '+Math.round(this.bpm), 6, H-13, {sc:1, color:'#6b4fa0'});
    vignette(0.45);
    crtOverlay(this.t); bezel();
  };
})();

/* ==========================================================================
   НОВАЯ ИГРА: РАДУЖНЫЙ ЗОНТ (вместо старого "Не промокни")
   С неба падают капли грусти (синие) и радужные сердечки (разноцветные).
   Ты управляешь зонтиком, нужно ловить сердечки и не давать каплям грусти
   попасть в маленькое сердце внизу. Ветер постепенно усиливается, иногда
   идет ливень. Если набрать 7 цветов радуги — включается защитный купол.
   ========================================================================== */
(function(){
L3.enter = function(){
  this.t = 0; this.lives = 3; this.inv = 0; this.spawn = 0.6; this.items=[];
  this.score = 0; this.winScore = 30;
  this.hintY = 40;
  this.tilt = 0; this.combo = 0;
  this.gust = 0; this.gustT = 5; this.gustDir = 0;
  this.gustTell = 0;
  this.colorsGot = 0; // сколько цветов радуги собрано
  this.shield = 0;
  this.groundY = H < 260 ? 190 : H - 50;
  this.py = this.groundY - 16; // позиция зонта выше
  this.heartPos = {x: W/2, y: this.groundY - 6}; // сердце которое нужно защищать
  this._boltT = rnd(4,8);
  this.px = W/2;
};
L3.update = function(dt){
  this.t += dt;
  updateLightning(this, dt);
  const sp = 140*dt*(this.shield>0?1.1:1);
  const px0 = this.px;
  if(key.left) this.px -= sp;
  if(key.right) this.px += sp;
  if(ptr.down) this.px = lerp(this.px, ptr.x, 0.28);
  this.px = clamp(this.px, 16, W-16);
  this.tilt = lerp(this.tilt, clamp((this.px-px0)/(dt*140),-1,1)*0.3, 0.22);
  // Порывы ветра
  this.gustT -= dt;
  if(this.gustT <= 0){
    this.gustT = rnd(4, 6);
    this.gustDir = Math.random()<0.5?-1:1;
    this.gust = 0.9;
    this.gustTell = 0.8;
  }
  if(this.gustTell > 0) this.gustTell -= dt;
  else if(this.gust>0) this.gust -= dt*0.7;
  const wind = (Math.sin(this.t*0.7)*18 + Math.sin(this.t*0.25)*10) * (0.3 + this.t/120) + (this.gust>0 ? this.gustDir*this.gust*80 : 0);
  this.wind = wind;
  if(this.shield>0) this.shield -= dt;
  // Защитный купол если собрал все 7 цветов
  if(this.colorsGot >=7 && this.shield<=0){
    this.shield = 6;
    this.colorsGot = 0;
    Snd.fanfare(); flashScreen(CONFIG.P.gold, .3);
    popText(this.px, this.py-10, 'РАДУЖНЫЙ КУПОЛ!', CONFIG.P.gold);
  }
  // Спавн капель и сердечек
  this.spawn -= dt;
  if(this.spawn<=0){
    const hard = Math.min(0.55, this.score/this.winScore);
    this.spawn = Math.max(0.18, 0.55 - hard*0.25);
    const r = Math.random();
    let kind;
    if(r < 0.35) kind = 'rain'; // синяя капля грусти
    else if(r < 0.48) kind = 'heart'; // обычное розовое сердечко
    else if(r < 0.58) kind = 'rainbow'; // радужное сердечко
    else kind = 'rain';
    this.items.push({
      x:rnd(10,W-10), y:-10,
      vy:rnd(70,110) + this.t*1.5,
      kind: kind, sw:rnd(0,6),
      color: kind==='rainbow' ? Math.floor(rnd(0,7)) : -1
    });
  }
  // Обновление предметов
  for(const it of this.items){
    it.y += it.vy*dt; it.sw += dt*4;
    it.x = clamp(it.x + wind*dt*0.4, 5, W-5);
    // Проверка попадания в зонт
    const dx = Math.abs(it.x - this.px), dy = Math.abs(it.y - (this.py-12));
    if(dx < 22 && dy < 16 && it.y < this.py-4){
      it.dead = 1;
      if(it.kind === 'heart'){
        this.score++;
        this.combo++;
        Snd.coin();
        popText(it.x, it.y-8, '+1', CONFIG.P.pink2);
        fx(it.x, it.y, 7, CONFIG.P.pink, 60, 0.4);
      } else if(it.kind === 'rainbow'){
        this.score += 2;
        this.combo += 2;
        this.colorsGot++;
        Snd.fanfare();
        const col = ['#ff5d8f','#ffd166','#ffe66d','#8ce99a','#4cc9f0','#b197fc','#ff8fa3'][it.color];
        popText(it.x, it.y-8, '🌈 +2', col);
        ring(it.x, it.y, col, 20, 0.4);
        fx(it.x, it.y, 10, col, 70, 0.5);
      } else if(it.kind === 'rain' && this.inv<=0){
        // капля попала в зонт — отскакивает, не страшно
        it.vy = -30;
        fx(it.x, it.y, 4, '#6ea0ff', 40, 0.3);
      }
    }
    // Проверка попадания в сердце внизу
    const dhx = Math.abs(it.x - this.heartPos.x), dhy = Math.abs(it.y - this.heartPos.y);
    if(dhx < 10 && dhy < 12 && it.y > this.py){
      it.dead = 1;
      if(it.kind === 'rain'){
        if(this.shield>0){
          fx(it.x, it.y, 10, CONFIG.P.gold, 80, 0.6);
          Snd.coin();
          popText(it.x, it.y-8, 'КУПОЛ!', CONFIG.P.gold);
        } else {
          this.lives--;
          this.inv = 1.2;
          this.combo = 0;
          Snd.hurt(); shake(6);
          impact(it.x, it.y, '#6ea0ff', 5, 20);
          flashScreen('#3a5a8a', .22);
          popText(it.x, it.y-8, 'БОЛЬНО!', CONFIG.P.red);
        }
      } else if(it.kind === 'heart' || it.kind === 'rainbow'){
        // сердечко упало мимо зонта — небольшой штраф
        this.score = Math.max(0, this.score-1);
        this.combo = 0;
        Snd.bad();
      }
    }
    if(it.y > H+10) it.dead=1;
  }
  this.items = this.items.filter(i=>!i.dead);
  if(this.inv>0) this.inv -= dt;
  if(this.score >= this.winScore) winLevel(LEVELS.indexOf(this));
  else if(this.lives<=0) loseLevel('Капли грусти добрались до сердца... Но я рядом, давай ещё раз.');
};
L3.key = function(k){};
L3.tap = function(x,y){};
L3.draw = function(){
  const P = CONFIG.P;
  // Фон дождливого неба
  ctx.drawImage(bgCache('zont_new_bg', paint=>{ ditherGradVTo(paint,0,0,W,H,'#2a2050','#141024',12); veilBlobTo(paint,W*0.3,H*0.2,W*0.7,'rgba(90,70,150,.25)'); }), 0, 0);
  clouds(this.t, 8, 5, 0.35);
  // Силуэт города
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, this.groundY);
  ctx.clip();
  drawCity(this.t, this.groundY, false);
  ctx.restore();
  // Дождь — не рисуем ниже земли
  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,W,this.groundY);
  ctx.clip();
  const wind = this.wind || 0;
  const sl = clamp(wind*0.1, -6, 6);
  const rainN = this.shield>0 ? 20 : 50;
  for(let i=0;i<rainN;i++){
    const R = mulberry32(i*3+5);
    const x = (R()*W + this.t*(34 + sl*3) + wind*this.t*7) % W;
    const y = (R()*this.groundY + this.t*(260 + (this.shield>0?-100:0))) % this.groundY;
    ctx.fillStyle = i%4 ? 'rgba(140,180,255,.30)' : 'rgba(190,220,255,.5)';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 5 + (i%4)*2);
  }
  ctx.restore();
  // Молния
  drawLightning(this.t, this._bolt);
  // Порыв ветра
  if(this.gustTell>0){
    const dir = this.gustDir;
    ctx.globalAlpha = 0.3 + 0.4*Math.abs(Math.sin(this.t*10));
    ctx.fillStyle = P.sky;
    for(let i=0;i<3;i++){
      const ax = dir>0 ? (10+i*14) : (W-10-i*14), ay = 40;
      ctx.fillRect(ax, ay, 6, 1); ctx.fillRect(ax-dir*2, ay, 2, 1);
    }
    ctx.globalAlpha = 1;
  }
  // Предметы в воздухе
  const rainbowColors = ['#ff5d8f','#ffd166','#ffe66d','#8ce99a','#4cc9f0','#b197fc','#ff8fa3'];
  for(const it of this.items){
    const x = Math.round(it.x + Math.sin(it.sw)*3), y = Math.round(it.y);
    if(it.kind === 'rain'){
      ctx.fillStyle='#6ea0ff'; ctx.fillRect(x-1,y-4,2,6); ctx.fillRect(x-2,y-2,4,2);
    } else if(it.kind === 'heart'){
      heart(x-4,y-3,1,P.pink);
      ctx.globalAlpha = 0.4; heart(x-4,y-3,1,'#ffd6e4'); ctx.globalAlpha = 1;
      if(FXQ>.4) glowAt(x,y,8,P.pink,.15);
    } else if(it.kind === 'rainbow'){
      const col = rainbowColors[it.color];
      heart(x-4,y-3,1,col);
      ctx.globalAlpha = 0.5; heart(x-4,y-3,1,'#fff'); ctx.globalAlpha = 1;
      if(FXQ>.4) glowAt(x,y,10,col,.22);
    }
  }
  // Мокрая земля
  wetGround(this.groundY, this.t);
  ctx.fillStyle='#2f5a8a';
  const poff = Math.floor(this.t*7)%23;
  for(let i=0;i<W;i+=23) ctx.fillRect((i+poff)%W, this.groundY+2, Math.min(10, W-((i+poff)%W)), 2);
  drawPuddles(this.t, this.groundY-3);
  // Маленькое сердце которое защищаем внизу
  const hx = this.heartPos.x, hy = this.heartPos.y;
  if(this.inv>0 && Math.floor(this.t*12)%2){ ctx.globalAlpha=0.3; }
  if(FXQ>.4) glowAt(hx, hy, 12, P.pink, .35 + (this.shield>0?.2:0));
  heart(hx-4, hy-4, 2, P.pink);
  ctx.globalAlpha = 1;
  // Радужный купол если активен
  if(this.shield>0){
    const a = .3 + .2*Math.sin(this.t*5);
    ctx.globalAlpha = a;
    for(let i=0;i<7;i++){
      const col = rainbowColors[i];
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy+10, 20 + i*2, Math.PI, Math.PI*2);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }
  // Игрок с зонтом
  const bx=Math.round(this.px);
  const guysc = H<260 ? 1.1 : 1.3;
  drawGuy(this.px, this.py, CONFIG.cHim, guysc, 0);
  const uy = this.py - 18*guysc, tl = Math.round(this.tilt*4);
  ctx.fillStyle='#2a2050'; ctx.fillRect(bx-1+tl,uy+3,2,8);
  // Зонт разноцветный
  const 伞w = H<260 ? 22 : 26;
  for(let i=0;i<7;i++){
    ctx.fillStyle = rainbowColors[i];
    ctx.fillRect(bx - 伞w/2 + tl + i*(伞w/7), uy, Math.ceil(伞w/7), 4);
    ctx.fillRect(bx - 伞w/2 + tl + i*(伞w/7), uy-3, Math.ceil(伞w/7)-1, 3);
  }
  ctx.fillStyle='#2a2050'; ctx.fillRect(bx-17+tl,uy,34,1);
  ctx.fillStyle='#fff';
  ctx.fillRect(bx-1, uy-6, 2, 2); // кончик зонта
  // HUD
  chip(6, 4, 'СЕРДЕЧКИ: '+this.score+'/'+this.winScore, this.score>=this.winScore?P.gold:P.ink);
  drawLives(this.lives, 6, 18);
  if(this.combo>=3) chip(6, 32, 'СЕРИЯ x'+this.combo, P.gold);
  // Счетчик цветов радуги (не вылезает за экран)
  for(let i=0;i<7;i++){
    ctx.fillStyle = i < this.colorsGot ? rainbowColors[i] : '#2d204a';
    ctx.fillRect(6, H-24 - i*5, 3, 3);
  }
  text('РАДУГА: '+this.colorsGot+'/7', 20, H-12, {sc:1, color:this.colorsGot>=7?P.gold:'#8fa8c8'});
  if(this.inv>0 && Math.floor(this.t*20)%2){ ctx.globalAlpha=0.2; ctx.fillStyle=P.red; ctx.fillRect(0,0,W,this.groundY+4); ctx.globalAlpha=1; }
  vignette(0.5);
  crtOverlay(this.t); bezel();
};
})();
