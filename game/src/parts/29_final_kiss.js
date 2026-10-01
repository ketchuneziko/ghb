/* ==========================================================================
   ЧАСТЬ 29 · ФИНАЛЬНАЯ АНИМАЦИЯ
   После сбора восьми сердец — короткая сцена поцелуя, затем финальное письмо.
   ========================================================================== */

function openFinale(){
  Snd.fanfare();
  go('restored');
}
const _mapPickFinal0 = mapPick;
mapPick = function(i){
  if(i === FINALE_NODE && finaleReady()){ openFinale(); return; }
  _mapPickFinal0(i);
};

/* Экран подтверждения: все восемь сердец собраны. */
G.screens.restored = {
  enter(){
    this.t = 0; this.n = 0; this.shown = false;
    Snd.ac && Snd.ac.resume && Snd.ac.resume();
  },
  update(dt){
    this.t += dt;
    this.n = Math.min(CH, Math.floor(this.t/0.26));
    if(this.n >= CH && this.t > 2.4 && !this.shown){
      this.shown = true; flashScreen(CONFIG.P.pink, .35); punch(.10); Snd.fanfare();
    }
  },
  next(){
    if(this.t < 0.7) return;
    Snd.blip(); go('kiss');
  },
  key(k){ if(k === ' ' || k === 'Enter') this.next(); },
  tap(){ this.next(); },
  draw(){
    const P = CONFIG.P, cx = W/2, t = this.t;
    ctx.drawImage(bgCache('hearts_restored', p=>{
      ditherGradVTo(p,0,0,W,H,'#08030f','#170a24',16);
      veilBlobTo(p, W*0.5, H*0.42, Math.max(W,H)*0.5, 'rgba(255,93,143,.10)');
    }), 0, 0);
    nebulaBg(t*0.5, {c1:'#2e1030', c2:'#160e30', c3:'#0d1230', seed:5});
    motes(G.t, 16, '#ff5d8f', .22);
    glowAt(cx, Math.round(H*0.40), Math.max(W,H)*0.34, P.pink, .10 + .04*Math.abs(Math.sin(t*1.6)));
    const hw = CH*14, x0 = cx - hw/2, hy = Math.round(H*0.40);
    for(let i=0;i<CH;i++){
      const on = i < this.n;
      const k = on ? (1 + 0.18*Math.max(0, Math.sin((t - i*0.26)*4))) : 1;
      const s = on ? Math.max(1, Math.round(2*k)) : 1;
      heart(x0+i*14+3, hy, s, on ? P.pink : '#2e1c48');
      if(on && FXQ > .5) glowAt(x0+i*14+3, hy, 12, P.pink, .2);
    }
    const title = 'ALL HEARTS RESTORED';
    text(title, cx, Math.round(H*0.40)+18, {sc:fitSc(title, W-16, 2), align:'center', color:this.n>=CH?P.gold:'#6b4fa0'});
    if(this.n >= CH){
      const a = clamp((t-2.4)/0.8,0,1);
      ctx.globalAlpha = a;
      const sub = 'ВОСЕМЬ ИЗ ВОСЬМИ. ТЕПЕРЬ ВМЕСТЕ.';
      text(sub, cx, Math.round(H*0.40)+40, {sc:fitSc(sub,W-20,1),align:'center',color:P.pink2});
      ctx.globalAlpha = a*(0.5+0.5*Math.abs(Math.sin(t*3)));
      text(IS_TOUCH?'ТАПНИ, ЧТОБЫ УВИДЕТЬ НАС':'ПРОБЕЛ — ДАЛЬШЕ',cx,H-40,{sc:fitSc(IS_TOUCH?'ТАПНИ, ЧТОБЫ УВИДЕТЬ НАС':'ПРОБЕЛ — ДАЛЬШЕ',W-16,1),align:'center',color:P.gold});
      ctx.globalAlpha = 1;
    }
    vignette(.5); crtOverlay(G.t);
  }
};

/* Короткая автоматическая сцена: мы подходим друг к другу и целуемся. */
G.screens.kiss = {
  enter(){
    this.t = 0; this.kissed = false; this.done = false;
    this.cx = W/2;
    this.bodyY = Math.min(H-30, Math.round(H*.70));
    this.startGap = Math.min(72, W*.31);
    this.endGap = Math.max(10, Math.min(14, W*.055));
    Snd.ac && Snd.ac.resume && Snd.ac.resume();
  },
  update(dt){
    this.t += dt;
    if(!this.kissed && this.t >= 2.65){
      this.kissed = true;
      Snd.fanfare(); punch(.12); flashScreen(CONFIG.P.pink,.32);
      ring(this.cx,this.bodyY-20,CONFIG.P.pink,34,.75);
      burstHearts(this.cx,this.bodyY-22,22,CONFIG.P.pink);
    }
    if(this.t >= 6.2) this.finish();
  },
  finish(){
    if(this.done) return;
    this.done = true; Snd.blip(); go('finale');
  },
  key(k){ if((k===' '||k==='Enter') && this.t>=3.6) this.finish(); },
  tap(){ if(this.t>=3.6) this.finish(); },
  draw(){
    const P = CONFIG.P, t = this.t, cx = W/2;
    ctx.drawImage(bgCache('final_kiss_bg',p=>{
      ditherGradVTo(p,0,0,W,H,'#17081c','#080513',15);
      veilBlobTo(p,W*.50,H*.58,Math.max(W,H)*.62,'rgba(255,93,143,.20)');
    }),0,0);
    nebulaBg(t*.25,{c1:'#56223f',c2:'#29183f',c3:'#16264e',seed:29});
    motes(G.t,24,'#ffd166',.30);
    for(let i=0;i<18;i++){
      const R=mulberry32(i*17+29), x=Math.round(R()*W), y=Math.round(R()*H*.78);
      ctx.globalAlpha=.16+.25*Math.abs(Math.sin(t*1.7+i));
      ctx.fillStyle=i%3===0?P.gold:P.pink2; ctx.fillRect(x,y,1,1);
    }
    ctx.globalAlpha=1;
    const head='ВОСЕМЬ СЕРДЕЦ ПРИВЕЛИ К ТЕБЕ';
    text(head,cx,16,{sc:fitSc(head,W-16,1),align:'center',color:P.gold});

    const approach=easeOut(clamp((t-.25)/2.35,0,1));
    const gap=lerp(this.startGap,this.endGap,approach);
    const sway=Math.sin(t*3.2)*(this.kissed?0.7:1.5);
    const scale=H<320?1.15:1.35;
    const himX=Math.round(cx-gap+sway), herX=Math.round(cx+gap-sway);
    const baseY=this.bodyY+Math.round(Math.sin(t*2.6)*1.2);
    // Разделяющаяся дорожка из сердечек меркнет по мере их сближения.
    for(let i=0;i<5;i++){
      const k=(i+1)/6, hx=lerp(cx-this.startGap,cx+this.startGap,k);
      const hy=this.bodyY-9-Math.sin(t*2+i)*3;
      ctx.globalAlpha=(1-approach)*.42; heart(hx-4,hy-3,1,i%2?P.gold:P.pink);
    }
    ctx.globalAlpha=1;
    drawGuy(himX,baseY,CONFIG.cHim,scale,0);
    drawGirl(herX,baseY,CONFIG.cHer,scale,1);

    if(this.kissed){
      const pulse=1+.18*Math.sin(t*7);
      glowAt(cx,this.bodyY-22,32,P.pink,.22+.12*Math.sin(t*4));
      heart(cx-4,this.bodyY-25,Math.max(2,Math.round(2*pulse)),P.pink);
      for(let i=0;i<10;i++){
        const a=i/10*Math.PI*2+t*.55, r=30+Math.sin(t*3+i)*3;
        ctx.globalAlpha=.65; heart(Math.round(cx+Math.cos(a)*r)-4,Math.round(this.bodyY-22+Math.sin(a)*r*.55)-3,1,i%3===0?P.gold:P.pink2);
      }
      ctx.globalAlpha=1;
      const cap='НАШ ПОЦЕЛУЙ';
      text(cap,cx,Math.round(H*.30),{sc:fitSc(cap,W-16,1),align:'center',color:P.pink2});
    } else {
      const cap='МЫ СБЛИЖАЕМСЯ';
      text(cap,cx,Math.round(H*.30),{sc:1,align:'center',color:P.pink2});
    }
    if(t>=3.7){
      const a=.45+.55*Math.abs(Math.sin(t*3));
      ctx.globalAlpha=a;
      const next='НАЖМИ, ЧТОБЫ ПРОЧИТАТЬ ПИСЬМО';
      text(next,cx,H-22,{sc:fitSc(next,W-16,1),align:'center',color:P.gold});
      ctx.globalAlpha=1;
    }
    vignette(.45); crtOverlay(G.t);
  }
};
