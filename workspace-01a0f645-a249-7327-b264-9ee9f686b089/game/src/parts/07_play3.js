/* ==========================================================================
   ЧАСТЬ 7.3 · НОВЫЕ МЕХАНИКИ (3/3): ПРИНТЕР (заедание, серия) и КОД (2 этапа)
   ========================================================================== */

/* ==========================================================================
   7 · PRINT I LOVE YOU — кассета, заедание бумаги, серия, финальный вывод
   ========================================================================== */
(function(){
const _d5 = L5.draw;
L5.enter = function(){
  this.t=0; this.phrase = (CONFIG.phrase||'Я ЛЮБЛЮ ТЕБЯ').toUpperCase();
  this.i=0; this.err=0; this.done=false; this.doneT=0; this.shake=0; this.ink=0;
  this.streak = 0; this.best = 0;
  this.paper = 0;            // 0..1 — кассета/бумага
  this.jam = 0;              // время заедания
  this.jamTotal = 0;
  this.feed = 0;             // анимация протяжки бумаги
  this.broke = false;
  this.keys = this.layout();
  this.kbTop = this.keys.length ? Math.min.apply(null, this.keys.map(k=>k.y)) : H-30;
};
L5.type = function(ch){
  if(this.done) return;
  if(ch === this.phrase[this.i]){
    this.i++; this.ink = 0.14; this.feed = 1; Snd.clack();
    this.streak++; if(this.streak > this.best) this.best = this.streak;
    this.paper += 0.09;
    const k = this.keys.find(k=>k.ch===ch);
    if(k) fx(k.x+k.w/2, k.y+k.h/2, 3, CONFIG.P.gold, 40, 0.3);
    if(this.streak>0 && this.streak%5===0){
      popText(W/2, this.paperY(54)+8, 'СЕРИЯ x'+this.streak, CONFIG.P.gold);
      Snd.coin();
    }
    if(this.paper >= 1 && this.jam<=0){
      this.paper = 0; this.jam = 1.25; this.jamTotal += 1.25;
      this.msg = 'ЗАЕДАЕТ БУМАГА';
      Snd.hurt(); shake(5); flashScreen('#c9bde8', 0.18);
      this.paperYoke = this.paperY(54);
    }
    if(this.i >= this.phrase.length){ this.done = true; this.doneT = 0; Snd.win(); fx(W/2, H/2, 30, CONFIG.P.pink, 110, 0.9); }
  } else {
    this.err++; this.shake = 3; this.streak = 0; Snd.bad();
    this.paper = Math.min(1, this.paper + 0.12);
    comboBreak();
  }
};
L5.update = function(dt){
  this.t += dt;
  if(this.shake>0) this.shake -= dt*10;
  if(this.ink>0) this.ink -= dt;
  if(this.feed>0) this.feed -= dt*3;
  if(this.jam>0){
    this.jam -= dt;
    if(this.jam <= 0){ this.jam = 0; this.msg = ''; }
  }
  if(this.done){ this.doneT += dt; if(this.doneT>1.6) winLevel(LEVELS.indexOf(this)); }
  if(this.err>=3 && !this.broke){ this.broke = true; loseLevel('Опечатался. Но смысл тот же.'); }
};
L5.key = function(k){
  if(k===' ' && this.jam>0) this.jam = Math.min(this.jam, 0.25);   // помогаем принтеру, но печатаем
  if(k.length===1) this.type(k.toUpperCase());
  if(k==='Backspace' && this.i>0){ this.i--; Snd.blip(); }
};
L5.tap = function(x,y){
  for(const kb of this.keys){ if(x>=kb.x && x<=kb.x+kb.w && y>=kb.y && y<=kb.y+kb.h){ this.type(kb.ch); return; } }
  // тап по принтеру во время заедания — чиним
  if(this.jam>0 && y > this.paperY(54)-4 && y < this.paperY(54)+40){
    this.jam = Math.min(this.jam, 0.25); Snd.clack();
  }
};
L5.draw = function(){
  _d5.call(this);
  const P = CONFIG.P, cx = W/2;
  const py0 = this.paperY(54);
  // заедание: дёрганая бумага + красная лампа
  if(this.jam>0){
    const j = Math.round(Math.sin(this.t*40)*(1-this.jam)*1.5);
    ctx.globalAlpha = 0.5 + 0.3*Math.sin(this.t*12);
    ctx.fillStyle = P.red; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    text('ЗАЕДАЕТ БУМАГА! ПРОБЕЛ', cx, py0-10, {sc:1, align:'center', color:P.red, shadow:'#120a24'});
    // «мятая» бумага
    ctx.fillStyle = 'rgba(180,160,200,.25)';
    for(let i=0;i<4;i++) ctx.fillRect(cx-40+j, py0+6+i*10, 80, 1);
  }
  // запас бумаги — вертикальной полоской справа от принтера
  if(!this.done){
    const gx = Math.round(cx)+33, gy = py0+54+8, gh2 = 26;
    ctx.fillStyle = '#120a24'; ctx.fillRect(gx-1, gy-1, 9, gh2+2);
    ctx.fillStyle = '#241445'; ctx.fillRect(gx, gy, 7, gh2);
    const kk = clamp(this.paper,0,1);
    ctx.fillStyle = this.paper>0.7 ? P.red : (this.paper>0.4 ? P.gold : P.green);
    ctx.fillRect(gx+1, gy+gh2-1-Math.round((gh2-2)*kk), 5, Math.round((gh2-2)*kk));
    for(let i=1;i<4;i++){ ctx.fillStyle = 'rgba(18,10,36,.8)'; ctx.fillRect(gx+1, gy+Math.round(gh2*i/4), 5, 1); }
  }
  if(this.streak>=3) drawCombo(cx, H-26, 'РИТМ ПЕЧАТИ');
  if(this.best>this.streak && this.streak===0 && this.i>0) chip(6, H-14, 'ЛУЧШАЯ СЕРИЯ: '+this.best, P.gold);
  // финальный вывод бумаги
  if(this.done){
    const k = clamp((this.doneT-0.4)/1.0, 0, 1);
    if(k>0){
      ctx.globalAlpha = k*0.5; ctx.fillStyle = P.paper;
      ctx.fillRect(W/2-40, H-4, 80, 4+18*k);
      ctx.globalAlpha = 1;
      for(let i=0;i<10;i++){
        const a = this.doneT*2 + i*0.63;
        const x = cx + Math.cos(a)*rnd(10,46), y = H-10 + Math.sin(a)*rnd(4,18) - this.doneT*8;
        heart(Math.round(x), Math.round(y), 1, i%3===0?P.gold:P.pink);
      }
    }
  }
};
function pw2(L){ return Math.min(W-40, 200); }
})();

/* ==========================================================================
   8 · КОД — после успешной компиляции программа падает: чиним вторую ошибку
   ========================================================================== */
(function(){
const FIX_OPTS = [
  {t:'who = "МАРИЯ"', ok:true },
  {t:'love = who',     ok:false},
  {t:'print(who)',     ok:false}
];
const _cd = L8.compileDone;
L8.compileDone = function(){
  // ставим флаг: успех теперь ведёт ко второму этапу, а не сразу к печати
  const _mode = this.mode, _err = this.mistakes;
  const before = this.lives;
  _cd.call(this);
  if(this.mode === 'print' && before === this.lives){
    this.mode = 'fix'; this.modeT = 0; this.stage = 2;
    this.out.push('компиляция... ОК');
    this.out.push('запуск...');
    this.out.push('Traceback (most recent call last):');
    this.out.push('NameError: имя who не задано');
    this.say('ВЫБЕРИ СТРОКУ, КОТОРАЯ ЧИНИТ ПРОГРАММУ');
    Snd.bad(); shake(4);
    this.fixSel = 0; this.fixR = [];
    this.fixOpts = FIX_OPTS.map(o=>o.t);
  }
};
L8.fixPick = function(i){
  if(this.mode !== 'fix') return;
  if(FIX_OPTS[i].ok){
    Snd.coin(); this.out.push('>>> ' + FIX_OPTS[i].t);
    this.out.push('исправлено. запуск...');
    this.mode = 'comp2'; this.modeT = 0;
    fx(W/2, H*0.5, 12, CONFIG.P.green, 70, 0.5);
  } else {
    this.lives--; this.mistakes++;
    this.out.push('>>> ' + FIX_OPTS[i].t);
    this.out.push('NameError: всё ещё не задано');
    Snd.hurt(); shake(5); flashScreen(CONFIG.P.red, 0.25);
    this.fixSel = 0;
    if(this.mistakes >= 2) this.hintOn = true;
    if(this.lives <= 0) loseLevel('Программа сломалась окончательно. Но я всё равно люблю.');
    else this.mode = 'comp'; this.modeT = 0;   // пробуем снова: компиляция без изменений → снова «fix»
  }
};
const _u8 = L8.update;
L8.update = function(dt){
  this.t += dt;
  if(this.mode === 'comp2'){
    this.modeT += dt;
    if(this.modeT > 0.9){
      this.mode = 'print'; this.printT = 0; this.printLine = 0;
      this.out.push('компиляция... ОК');
      this.out.push('запуск...');
      Snd.note(880,0.08,'square',0.12);
    }
    return;
  }
  _u8.call(this, dt);
  if(this.mode === 'print' && this.stage !== 2) this.stage = 2;
};
const _k8 = L8.key;
L8.key = function(k){
  if(this.mode === 'fix'){
    if(k==='ArrowUp'){ this.fixSel = (this.fixSel+FIX_OPTS.length-1)%FIX_OPTS.length; Snd.blip(); return; }
    if(k==='ArrowDown'||k==='Tab'){ this.fixSel = (this.fixSel+1)%FIX_OPTS.length; Snd.blip(); return; }
    if(k==='1'||k==='2'||k==='3'){ this.fixPick(parseInt(k,10)-1); return; }
    if(k===' '||k==='Enter'){ this.fixPick(this.fixSel); return; }
    return;
  }
  _k8.call(this, k);
};
const _t8 = L8.tap;
L8.tap = function(x,y){
  if(this.mode === 'fix'){
    for(let i=0;i<(this.fixR||[]).length;i++){
      const r = this.fixR[i];
      if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ this.fixSel = i; this.fixPick(i); return; }
    }
    return;
  }
  _t8.call(this, x, y);
};
const _d8 = L8.draw;
L8.draw = function(){
  _d8.call(this);
  if(this.mode !== 'fix') return;
  const g = this.geo || {wndX:4, wndY:8, wndW:W-8, wndH:120};
  // затемняем всё окно — выбирать надо строку починки
  ctx.fillStyle = 'rgba(9,5,20,.82)'; ctx.fillRect(g.wndX, g.ty0-1, g.wndW, g.termH+2);
  const hAll = g.byy - g.wndY + 14;
  ctx.fillStyle = 'rgba(20,10,36,.96)';
  ctx.fillRect(g.wndX+2, g.wndY+16, g.wndW-4, Math.max(30, hAll-18));
  ctx.fillStyle = UI.dark; ctx.fillRect(g.wndX+2, g.wndY+16, g.wndW-4, 1);
  text('ПРОГРАММА УПАЛА. ЧТО ПОЧИНИТЬ?', g.wndX+6, g.wndY+20, {sc:1, color:CONFIG.P.gold});
  this.fixR = [];
  const wOpt = g.wndW - 16, xOpt = g.wndX + 8;
  const hOpt = 14, step2 = hOpt + 3;
  const totalH = FIX_OPTS.length*step2 - 3;
  let yy = Math.max(g.wndY + 36, g.wndY + Math.round((hAll - 18 - totalH)/2) + 18);
  for(let i=0;i<FIX_OPTS.length;i++){
    const sel = (i === this.fixSel);
    ctx.fillStyle = sel ? '#3a2560' : '#1d1136';
    ctx.fillRect(xOpt, yy, wOpt, hOpt);
    ctx.fillStyle = sel ? CONFIG.P.gold : '#5a4680';
    ctx.fillRect(xOpt, yy, 1, hOpt);
    bevel(xOpt+1, yy+1, wOpt-2, hOpt-2, sel?'rgba(255,255,255,.14)':'rgba(0,0,0,.3)');
    text((i+1)+'  '+FIX_OPTS[i].t, xOpt+5, yy+3, {sc:1, color: sel?CONFIG.P.ink:'#a08cc0'});
    this.fixR.push({x:xOpt, y:yy, w:wOpt, h:hOpt});
    yy += step2;
  }
  if(yy+12 < g.byy) text('СТРЕЛКИ + ENTER   ИЛИ   ТАП', g.wndX+g.wndW/2, yy+2, {sc:1, align:'center', color:'#6b4fa0'});
  if(this.fixSel < this.fixR.length && Math.floor(this.t*3)%2===0){
    const r = this.fixR[this.fixSel];
    ctx.fillStyle = CONFIG.P.gold; ctx.fillRect(r.x-2, r.y-1, 2, 2); ctx.fillRect(r.x-2, r.y+r.h-1, 2, 2);
  }
};
})();
