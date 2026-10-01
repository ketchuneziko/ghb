/* ==========================================================================
   ЧАСТЬ 13 · ЭПИЗОД 3 — ВОСПОМИНАНИЯ И ЛЮДИ
   Лента времени: три момента, из-за которых мир стал добрее
   ========================================================================== */

const MEM = {
  t: 26,             // на одно воспоминание
  places: [
    {id:'da',   t:'ПЕРВАЯ ВСТРЕЧА',  d:'Мы познакомились в Дайвинчике — кто же знал, что именно там я найду любовь всей своей жизни!', c:'#ffd166'},
    {id:'call', t:'РАЗГОВОРЫ ПО ТЕЛЕФОНУ', d:'разговоры по телефону это самые лучшие моменты дня для меня именно там я нахожу свое счастье(тебя)', c:'#6bc7ff'},
    {id:'night',t:'РАЗГОВОРЫ ДО ЗОРИ', d:'Разговоры до зори: я люблю каждую бессоную ночь с тобой это лучший способ провести время', c:'#ff8787'}
  ]
};

const EP3 = {
  name:'ВОСПОМИНАНИЯ', sub:'три момента', hint:'ИДИ ПО ЛЕНТЕ ВРЕМЕНИ', hintY:false,
  intro:[D('him','Тут три момента, которые я запомнил навсегда.'),
         D('him','Останови каждый на полосе и прочитай, что он мне значит.')],
  outro:[D('him','Вот ради этих трёх минут я и старался.'),
         D('him','Третье и четвёртое сердца — наши.')],
  hearts: 2,
  enter(){
    scenes(this);
    this.stop = 0; this.seen = [false,false,false]; this.ok = false; this.okT = 0;
    this.walk = 0; this.left = MEM.t; this.setScene('main');
  },
  on_main(){ this.stop = 0; this.ok = false; this.seen = [false,false,false]; this.walk = 0; this.left = MEM.t; },
  lane(){ return {x: 24, y: Math.round(H - 58), w: W-48}; },
  u_main(dt){
    this.walk = lerp(this.walk, this.stop, 1-Math.pow(0.001, dt));
    if(this.ok){ this.okT += dt; if(this.okT > 1.3) winLevel(LEVELS.indexOf(this)); return; }
    if(!this.seen[this.stop]){
      this.left -= dt;
      if(this.left <= 0){ this.left = 0; loseLevel('Воспоминание погасло... Скорее вспоминай!'); }
    }
  },
  d_main(){
    const P = CONFIG.P, t = this.t, L = this.lane();
    // фон
    ctx.drawImage(bgCache('ep3bg', paint=>{ ditherGradVTo(paint,0,0,W,H,'#1a0b2e','#3a1338',14); }), 0, 0);
    nebulaBg(t, {c1:'#5a1f4a', c2:'#2b1c5e', c3:'#1b3a6b', seed: 4});
    motes(t, 24, '#ffd166', .3);
    hudTop({icon:'stars', title:'ЛЕНТА ВРЕМЕНИ', col:'#b197fc', h:20, right:this.seen.filter(Boolean).length+' / 3'});
    textBlock('Она идёт по ленте. Каждый шаг — воспоминание.', W/2, 24, W-20, {color:'#9b8ac0'});
    // карточка воспоминания
    const m = MEM.places[this.stop];
    const px0 = 6, pw = W-12, py = 38, ph = L.y - py - 18;
    glassPanel(px0, py, pw, ph, {col: m.c, title: m.t});
    wrap(m.d, pw-14, 1).forEach((l,i)=>text(l, px0+7, py+18+i*12, {sc:1, color:'#fff6e8'}));
    if(this.seen[this.stop]){
      const a = .5+.5*Math.abs(Math.sin(t*3));
      ctx.globalAlpha = a;
      text('ПРОЙДЕНО ♥', W/2, py+ph-14, {sc:1, align:'center', color:m.c});
      ctx.globalAlpha = 1;
    } else {
      const k = clamp(this.left/MEM.t, 0, 1);
      const bw2 = pw-14;
      ctx.fillStyle = 'rgba(18,10,36,.6)'; ctx.fillRect(px0+7, py+ph-10, bw2, 4);
      ctx.fillStyle = k < .3 ? P.red : (k < .6 ? CONFIG.P.gold : '#8ce99a');
      ctx.fillRect(px0+7, py+ph-10, Math.round(bw2*k), 4);
      text('НЕ ЗАБЫВАЙ, ОСТАЛОСЬ '+Math.ceil(this.left)+'с', px0+7, py+ph-21, {sc:1, color: k<.3?P.red:'#8f82b8'});
    }
    // дорожка
    ctx.fillStyle = 'rgba(255,246,232,.12)'; ctx.fillRect(L.x, L.y+3, L.w, 2);
    for(let i=0;i<MEM.places.length;i++){
      const x = L.x + (i+0.5)*(L.w/3);
      const seen = this.seen[i], cur = this.stop === i;
      const col = seen ? MEM.places[i].c : '#4a3670';
      if(cur && FXQ > .5) glowAt(x, L.y+3, 18, col, .3);
      ctx.fillStyle = col; ctx.fillRect(x-5, L.y-2, 10, 10);
      ctx.fillStyle = seen ? '#120a24' : 'rgba(18,10,36,.6)';
      ctx.fillRect(x-3, L.y, 6, 6);
      text(String(i+1), x, L.y+1, {sc:1, align:'center', color: seen ? '#120a24' : '#8f82b8'});
    }
    // она идёт
    const gx = L.x + (this.walk + 0.5)*(L.w/3);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(gx-8, L.y+4, 16, 2);
    drawGirl(gx, L.y+2, CONFIG.cHer, 2, 0);
    // кнопки
    const by = H-16, tw = Math.floor((W-16)/3);
    this.rPrev = {x:6, y:by, w:tw, h:14};
    this.rGo = {x:6+tw+4, y:by, w:tw, h:14};
    this.rNext = {x:6+2*(tw+4), y:by, w:tw, h:14};
    const last = this.stop === MEM.places.length-1;
    dirBtn(6, by, tw, 14, 'l', {press:this.hovB===0, color:UI.text, dis:this.stop===0});
    text('НАЗАД', 6+tw/2+6, by+3, {sc:1, align:'center', color:this.stop===0?'#6b5a8f':'#fff6e8'});
    glassBtn(this.rGo.x, by, tw, 14, 'ЗАПОМНИТЬ', {press:this.hovB===1, color:this.seen[this.stop]?'#5a4680':m.c, dis:this.seen[this.stop]});
    glassBtn(this.rNext.x, by, tw, 14, last?'ЗАВЕРШИТЬ':'ДАЛЬШЕ', {press:this.hovB===2, color: this.seen.every(Boolean)?P.green:'#5a4680', dis:!last && !this.seen[this.stop]});
    vignette(0.5); crtOverlay(t);
  },
  memNext(){
    if(this.seen[this.stop]) return;
    this.seen[this.stop] = true;
    Snd.coin(); punch(.06);
    for(let i=0;i<6;i++) burstHearts(W/2, H*0.5, 1, MEM.places[this.stop].c);
  },
  goTo(i){
    if(i === this.stop) return;
    if(!this.seen[i]){ Snd.bad(); shake(2); popText(W/2, H*0.52, 'СНАЧАЛА ЗАПОМНИ ЭТО', CONFIG.P.red); return; }
    this.stop = i; this.left = MEM.t; Snd.blip();
  },
  k_main(k){
    if(k==='ArrowLeft'){ this.goTo(Math.max(0, this.stop-1)); }
    if(k==='ArrowRight'){ this.goTo(Math.min(MEM.places.length-1, this.stop+1)); }
    if(k===' '||k==='Enter'){
      if(!this.seen[this.stop]) this.memNext();
      else if(this.stop < MEM.places.length-1){ this.stop++; this.left = MEM.t; Snd.blip(); }
      else { this.ok = true; this.okT = 0; Snd.fanfare(); flashScreen(CONFIG.P.gold,.35); }
    }
  },
  t_main(x, y){
    this.hovB = -1;
    const on = r => r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h;
    if(on(this.rPrev)){ this.hovB=0; this.k_main('ArrowLeft'); return; }
    if(on(this.rGo)){ this.hovB=1; this.memNext(); return; }
    if(on(this.rNext)){ this.hovB=2; this.k_main(' '); return; }
    // тап по дорожке
    const L = this.lane();
    if(y > L.y-14 && y < L.y+18 && x > L.x && x < L.x+L.w){
      const i = clamp(Math.floor((x - L.x)/(L.w/3)), 0, MEM.places.length-1);
      if(i !== this.stop) this.goTo(i);
    }
  }
};
