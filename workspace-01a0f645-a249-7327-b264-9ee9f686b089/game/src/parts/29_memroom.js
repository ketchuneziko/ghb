/* ==========================================================================
   ЧАСТЬ 29 · MEMORY ROOM
   После 8/8: ALL HEARTS RESTORED -> MEMORY ROOM -> ФИНАЛ.exe
   Комната с тремя интерактивными фотографиями (клик -> текст -> зум -> подпись).
   Ничего в основной линии не ломаем: 8/8, карта, узлы, счётчики те же.
   ========================================================================== */

const MR_MEM = [
  { id:'MEMORY_01', name:'ПЕРВЫЙ СНЕГ', tag:'СНЕГ', cap:'ОКТЯБРЬ, ГДЕ-ТО ТАМ',
    say:'Первый снег. Ты сказала, что он пахнет ничем. Я тогда не нашёл ответа и просто пошёл рядом.' },
  { id:'MEMORY_02', name:'НОЧЬ БЕЗ ИНТЕРНЕТА', tag:'ОКНО', cap:'ЛУЧШАЯ НОЧЬ',
    say:'Интернет отвалился, и мы даже не заметили. Ты уснула на моём плече, а я боялся встать.' },
  { id:'MEMORY_03', name:'ТРИ ЧАСА СЕМНАДЬЦАТЬ', tag:'03:17', cap:'03:17',
    say:'Ты так и не узнаешь, что я не спал в ту ночь. Я смотрел на часы и не мог перестать.' }
];
const MR_N = MR_MEM.length;

const MR = {
  seen:  new Array(MR_N).fill(0),
  room:  false,                       // комната уже открывалась
  pack(){ return {s:this.seen.slice(), r:this.room?1:0}; },
  unpack(o){
    if(!o) return;
    if(Array.isArray(o.s)) for(let i=0;i<MR_N;i++) this.seen[i] = o.s[i]?1:0;
    this.room = !!o.r;
  },
  load(){
    try{
      const d = JSON.parse(localStorage.getItem(ARCH_KEY)||'null');
      if(d && d.m) this.unpack(d.m);
    }catch(e){}
  },
  count(){ let n=0; for(const v of this.seen) n += v?1:0; return n; },
  all(){ return this.count() >= MR_N; },
  forget(){ this.seen.fill(0); this.room = false; }
};
(function(){
  const prev = save;
  save = function(){
    try{
      const d = JSON.parse(localStorage.getItem(ARCH_KEY)||'null') || {};
      d.m = MR.pack();
      localStorage.setItem(ARCH_KEY, JSON.stringify(d));
    }catch(e){}
    prev();
  };
  MR.load();
})();

/* ФИНАЛ.exe на карте всегда ведёт сначала в комнату памяти */
function openFinale(){
  Snd.fanfare();
  go(MR.room ? 'finale' : 'restored');
}
const _mapPick0 = mapPick;
mapPick = function(i){
  if(i === FINALE_NODE && finaleReady()){ openFinale(); return; }
  _mapPick0(i);
};
/* «пройти заново» — комната памяти тоже начинается заново */
const _finTap0 = G.screens.finale.tap;
G.screens.finale.tap = function(x, y){
  const r = this.rAgain;
  if(this.phase === 'end' && r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h) MR.forget();
  _finTap0.call(this, x, y);
};

/* ==========================================================================
   Экран 1: ALL HEARTS RESTORED
   ========================================================================== */
G.screens.restored = {
  enter(){
    this.t = 0; this.n = 0;
    MR.room = true; save();
    Snd.ac && Snd.ac.resume && Snd.ac.resume();
  },
  update(dt){
    this.t += dt;
    this.n = Math.min(CH, Math.floor(this.t/0.26));
    if(this.n >= CH && this.t > 2.4 && !this.shown){ this.shown = true; flashScreen(CONFIG.P.pink, .35); punch(.10); Snd.fanfare(); }
  },
  next(){
    if(this.t < 0.7) return;
    Snd.blip();
    go('memroom');
  },
  key(k){ if(k === ' ' || k === 'Enter') this.next(); },
  tap(){ this.next(); },
  draw(){
    const P = CONFIG.P, cx = W/2, t = this.t;
    ctx.drawImage(bgCache('mrbg', p=>{
      ditherGradVTo(p,0,0,W,H,'#08030f','#170a24',16);
      veilBlobTo(p, W*0.5, H*0.42, Math.max(W,H)*0.5, 'rgba(255,93,143,.10)');
    }), 0, 0);
    nebulaBg(t*0.5, {c1:'#2e1030', c2:'#160e30', c3:'#0d1230', seed: 5});
    motes(G.t, 16, '#ff5d8f', .22);
    glowAt(cx, Math.round(H*0.40), Math.max(W,H)*0.34, P.pink, .10 + .04*Math.abs(Math.sin(t*1.6)));
    // восемь сердец загораются по одному
    const hw = CH*14, x0 = cx - hw/2, hy = Math.round(H*0.40);
    for(let i=0;i<CH;i++){
      const on = i < this.n;
      const k = on ? (1 + 0.18*Math.max(0, Math.sin((this.t - i*0.26)*4))) : 1;
      const s = on ? Math.max(1, Math.round(2*k)) : 1;
      heart(x0+i*14+3, hy, s, on ? P.pink : '#2e1c48');
      if(on && FXQ > .5) glowAt(x0+i*14+3, hy, 12, P.pink, .2);
    }
    const sc = fitSc('ALL HEARTS RESTORED', W-16, 2);
    text('ALL HEARTS RESTORED', cx, Math.round(H*0.40) + 18, {sc:sc, align:'center', color:this.n>=CH?P.gold:'#6b4fa0'});
    if(this.n >= CH){
      const a = clamp((this.t - 2.4)/0.8, 0, 1);
      ctx.globalAlpha = a;
      const sub = 'ВОСЕМЬ ИЗ ВОСЬМИ. ТЕПЕРЬ ПОМНИТЬ.';
      text(sub, cx, Math.round(H*0.40) + 40, {sc:fitSc(sub, W-20, 1), align:'center', color:P.pink2});
      const a2 = .5 + .5*Math.abs(Math.sin(t*3));
      ctx.globalAlpha = a * a2;
      text(IS_TOUCH ? 'НАЖМИ, ЧТОБЫ ВОЙТИ' : 'ПРОБЕЛ - ВОЙТИ', cx, H-40, {sc:1, align:'center', color:P.gold});
      ctx.globalAlpha = 1;
    }
    vignette(0.5); crtOverlay(G.t);
  }
};

/* ==========================================================================
   Экран 2: MEMORY ROOM
   ========================================================================== */
G.screens.memroom = {
  enter(){ this.t = 0; this.open = -1; this.tOpen = 0; this.chars = 0; },
  update(dt){
    this.t += dt;
    if(this.open >= 0) this.tOpen += dt;
  },
  /* --- геометрия --- */
  geom(){
    const pw = Math.min(72, Math.max(34, Math.round(W/3.7)));
    const ph = Math.round(pw*0.76);
    const gap = Math.max(8, Math.round(pw*0.22));
    const tot = MR_N*pw + (MR_N-1)*gap;
    const x0 = Math.round((W - tot)/2), y0 = 32;
    const photos = [];
    for(let i=0;i<MR_N;i++) photos.push({x:x0 + i*(pw+gap), y:y0, w:pw, h:ph});
    const floorY = Math.round(Math.min(H*0.72, H-96));
    const deskW = Math.min(88, W-40);
    const desk = {x:Math.round((W-deskW)/2), y:floorY-Math.round(deskW*0.42), w:deskW, h:Math.round(deskW*0.42)};
    const mw = Math.round(deskW*0.42), mh = Math.round(mw*0.78);
    const exe = {x:Math.round(desk.x + deskW/2 - mw/2) - 3, y:Math.max(photos[MR_N-1].y + ph + 10, desk.y - 3 - mh - 2), w:mw+6, h:mh+8};
    return {pw:pw, ph:ph, photos:photos, floorY:floorY, desk:desk, exe:exe};
  },
  hitPhoto(g, x, y){
    for(let i=0;i<MR_N;i++){
      const p = g.photos[i], m = 3;
      if(x > p.x-m && x < p.x+p.w+m && y > p.y-m && y < p.y+p.h+m) return i;
    }
    return -1;
  },
  openPhoto(i){ this.open = i; this.tOpen = 0; this.chars = 0; Snd.clack(); MR.seen[i] = 1; save(); },
  closePhoto(){ this.open = -1; this.tOpen = 0; Snd.clack(); },
  key(k){
    const n = {'1':0,'2':1,'3':2,'q':0,'w':1,'e':2}[k];
    if(n !== undefined && this.open < 0){ this.pick = n; this.openPhoto(n); return; }
    if(k === 'Escape'){
      if(this.open >= 0){ this.closePhoto(); return; }
      Snd.blip(); go('map'); return;
    }
    if(k === ' ' || k === 'Enter'){
      if(this.open >= 0) this.nextZoom(); else this.openPhoto(this.pick || 0);
    }
  },
  /* первый тап дописывает текст, второй закрывает */
  nextZoom(){
    const m = MR_MEM[this.open];
    if(this.chars < m.say.length) this.chars = m.say.length;
    else this.closePhoto();
  },
  tap(x, y){
    if(this.open >= 0){ this.nextZoom(); return; }
    const g = this.geom(), mz = g.exe;
    if(x > mz.x && x < mz.x+mz.w && y > mz.y && y < mz.y+mz.h){   // ФИНАЛ.exe
      MR.room = true; save();
      Snd.fanfare(); go('finale'); return;
    }
    const i = this.hitPhoto(g, x, y);
    if(i >= 0){ this.openPhoto(i); return; }
    if(y > H-18){ Snd.blip(); go('map'); return; }
  },
  /* --- фон комнаты --- */
  d_room(t, g){
    const P = CONFIG.P;
    ctx.drawImage(bgCache('mroom', p=>{
      ditherGradVTo(p,0,0,W,H,'#160e2e','#2a1a3e',14);
      veilBlobTo(p, W*0.5, g.floorY, Math.max(W,H)*0.6, 'rgba(255,190,120,.10)');
    }), 0, 0);
    // обои
    for(let yy=16, row=0; yy<g.floorY; yy+=10, row++)
      for(let xx=(row%2)?5:0; xx<W; xx+=10){ ctx.fillStyle='rgba(255,255,255,.03)'; ctx.fillRect(xx,yy,4,4); }
    // плинтус и пол
    ctx.fillStyle = '#3a2a4e'; ctx.fillRect(0, g.floorY, W, 2);
    ctx.fillStyle = '#241a34'; ctx.fillRect(0, g.floorY+2, W, H-g.floorY-2);
    for(let xx=0; xx<W; xx+=8){ ctx.fillStyle='rgba(255,255,255,.03)'; ctx.fillRect(xx, g.floorY+4, 6, 1); }
    // окно: ночь и луна
    const wx = W - 40, wy = Math.round(g.photos[0].y + g.photos[0].h + 26), ww = 28, wh = 26;
    ctx.fillStyle = '#1b2a4a'; ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#c8d8ff'; ctx.fillRect(wx+18, wy+5, 5, 5);
    ctx.fillStyle = '#2a3a5a'; ctx.fillRect(wx+19, wy+6, 3, 1); ctx.fillRect(wx+20, wy+7, 1, 1);
    ctx.fillStyle = '#3a2560';
    ctx.fillRect(wx-1, wy-1, ww+2, 1); ctx.fillRect(wx-1, wy+wh, ww+2, 1);
    ctx.fillRect(wx-1, wy-1, 1, wh+2); ctx.fillRect(wx+ww, wy-1, 1, wh+2);
    ctx.fillRect(wx+(ww>>1)-1, wy, 2, wh);
    ctx.globalAlpha = 0.08 + 0.02*Math.sin(t*0.7);
    ctx.fillStyle = '#c8d8ff';
    for(let i=0;i<26;i++) ctx.fillRect(wx+3+i, wy+wh+i, 20-i*0.6, 1);
    ctx.globalAlpha = 1;
    // настенные часы: 03:17
    this.d_clock(g, Math.max(6, wx-20), wy+4);
    // тёплый торшер
    this.d_lamp(g, t);
    // ковёр
    const rw = Math.min(130, W-40), rx = Math.round((W-rw)/2);
    const ry = Math.min(H-34, g.floorY + Math.max(14, Math.round((H-g.floorY)/2) - 8));
    ctx.fillStyle = '#4a2a44';
    ctx.fillRect(rx, ry, rw, 10);
    ctx.fillStyle = '#5c3450';
    ctx.fillRect(rx+3, ry+2, rw-6, 6);
    ctx.fillStyle = 'rgba(255,214,150,.18)'; ctx.fillRect(rx+8, ry+4, rw-16, 2);
    // стол с компьютером
    this.d_desk(g, t);
  },
  d_clock(g, x, y){
    ctx.fillStyle = '#2a1c40'; ctx.fillRect(x-1, y-1, 15, 15);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x, y, 13, 13);
    ctx.fillStyle = '#3a2560';
    ctx.fillRect(x+6, y+2, 1, 5);      // часовая на 3
    ctx.fillRect(x+6, y+6, 3, 1);      // минутная на 17 мин
    ctx.fillStyle = '#a08c66'; ctx.fillRect(x+1, y+6, 1, 1); ctx.fillRect(x+11, y+6, 1, 1);
  },
  d_lamp(g, t){
    const P = CONFIG.P, x = 16, y = g.floorY - 46;
    ctx.globalAlpha = .12 + .03*Math.sin(t*1.6);
    glowAt(x+6, y+6, 46, P.gold, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a2a4e'; ctx.fillRect(x+5, y+6, 2, 40);     // стойка
    ctx.fillRect(x+2, y+44, 9, 2);                              // основание
    ctx.fillStyle = '#c8a35a'; ctx.fillRect(x+1, y, 12, 7);     // абажур
    ctx.fillStyle = '#ffe6a8'; ctx.fillRect(x+3, y+5, 8, 2);
  },
  d_desk(g, t){
    const P = CONFIG.P, d = g.desk;
    // ножки и столешница
    ctx.fillStyle = '#2c1f42'; ctx.fillRect(d.x+2, d.y, 4, d.h); ctx.fillRect(d.x+d.w-6, d.y, 4, d.h);
    ctx.fillStyle = '#4a3358'; ctx.fillRect(d.x, d.y-3, d.w, 4);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(d.x, d.y-3, d.w, 1);
    // монитор
    const mw = Math.round(d.w*0.42), mh = Math.round(mw*0.78);
    const mx = g.exe.x + 3, my = g.exe.y + 2;
    const all = MR.all();
    const pulse = all ? .10 + .06*Math.abs(Math.sin(t*2.4)) : .04;
    ctx.globalAlpha = all ? pulse : 0;
    glowAt(mx+mw/2, my+mh/2, mw*1.3, P.gold, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#241a38'; ctx.fillRect(mx-2, my-2, mw+4, mh+4);
    ctx.fillStyle = all ? '#241a44' : '#1a1430'; ctx.fillRect(mx, my, mw, mh);
    // «рабочий стол» на экране
    ctx.fillStyle = all ? '#3f7a4a' : '#2a2a44';
    ctx.fillRect(mx+1, my+mh-2, mw-2, 2);
    text('ФИНАЛ.EXE', mx+mw/2, my+mh-10, {sc:fitSc('ФИНАЛ.EXE', mw-4, 1), align:'center', color: all ? '#ffe6a8' : '#4a4670'});
    // ярлык на полу под столом
    const cap2 = all ? 'ВСЁ, МОЖНО' : 'МОЖНО И СЕЙЧАС';
    text(cap2, d.x+d.w/2, d.y+d.h+3, {sc:fitSc(cap2, W-16, 1), align:'center', color: all ? P.gold : '#6b5a8f'});
  },
  /* --- фотография --- */
  d_photo(i, x, y, w, h, t, dim){
    const m = MR_MEM[i];
    ctx.fillStyle = '#2a1c40'; ctx.fillRect(x-2, y-2, w+4, h+4);
    ctx.fillStyle = dim ? '#1a1330' : '#120a20'; ctx.fillRect(x, y, w, h);
    const u = w/44;
    if(i === 0){                                   // первый снег
      ctx.fillStyle = '#2b3a63'; ctx.fillRect(x, y, w, h);
      // домик на горизонте
      ctx.fillStyle = '#1e2440';
      ctx.fillRect(x+Math.round(3*u), y+Math.round(h*0.40), Math.round(10*u), Math.round(h*0.20));
      ctx.fillStyle = '#3a2a4a';
      ctx.fillRect(x+Math.round(2*u), y+Math.round(h*0.36), Math.round(12*u), Math.round(3*u));
      ctx.fillStyle = '#c9d6e8'; ctx.fillRect(x, y+Math.round(h*0.55), w, h);
      ctx.fillStyle = '#eef3fb';
      for(let q=0;q<12;q++) ctx.fillRect(x+Math.round((q*6.7+2)*u)%w, y+Math.round((q*4.3+2)*u)%Math.max(1,Math.round(h*0.5)), Math.max(1,Math.round(u)), Math.max(1,Math.round(u)));
      // двое
      const fy0 = y+Math.round(h*0.78);
      ctx.fillStyle = '#3a2f5c';
      ctx.fillRect(x+Math.round(w*0.30), fy0-Math.round(8*u), Math.round(4*u), Math.round(8*u));
      ctx.fillRect(x+Math.round(w*0.54), fy0-Math.round(7*u), Math.round(4*u), Math.round(7*u));
      ctx.fillStyle = '#f0c8d8';
      ctx.fillRect(x+Math.round(w*0.30), fy0-Math.round(7*u), Math.round(4*u), Math.max(1,Math.round(u)));
      heart(x+w/2, fy0-Math.round(3*u), 1, '#ff8fb4');
    } else if(i === 1){                            // ночь без интернета
      ctx.fillStyle = '#141026'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#2b2148'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffd98a'; ctx.fillRect(x+Math.round(4*u), y+Math.round(3*u), Math.round(w-8*u), Math.round(h-7*u));
      ctx.fillStyle = '#3a2f18';
      ctx.fillRect(x+Math.round(7*u), y+Math.round(6*u), Math.round(4*u), Math.round(h-12*u));
      ctx.fillRect(x+Math.round(w-13*u), y+Math.round(7*u), Math.round(4*u), Math.round(h-14*u));
      ctx.fillStyle = '#2a2140';
      ctx.fillRect(x+Math.round(5*u), y+Math.round(h-2*u), Math.round(w-10*u), Math.round(2*u));
    } else {                                       // 03:17
      ctx.fillStyle = '#171029'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#2b3a63'; ctx.fillRect(x+2, y+Math.round(h*0.10), w-4, Math.round(h*0.45));
      ctx.fillStyle = '#c8d8ff'; ctx.fillRect(x+Math.round(3*u), y+Math.round(4*u), Math.round(3*u), Math.round(3*u));
      ctx.fillStyle = '#101828'; ctx.fillRect(x+Math.round(w-9*u), y+h-Math.round(8*u), Math.round(7*u), Math.round(6*u));
      const fy = y+Math.round(h*0.64);
      const hx = x+Math.round(w*0.27);
      ctx.fillStyle = '#2f2a4a';
      ctx.fillRect(hx-Math.round(2*u), fy-Math.round(5*u), Math.round(4*u), Math.round(7*u));
      ctx.fillRect(hx-Math.round(1*u), fy+Math.round(2*u), Math.max(1,Math.round(u)), Math.round(3*u));
      ctx.fillRect(hx, fy+Math.round(2*u), Math.max(1,Math.round(u)), Math.round(3*u));
      const ex = x+Math.round(w*0.70);
      const fw = Math.round(7*u), fh = Math.round(8*u);
      ctx.drawImage(IMG.her, ex-(fw>>1), fy-Math.round(9*u), fw, fh);
      ctx.globalAlpha = 0.45 + 0.25*Math.sin(t*3);
      ctx.fillStyle = '#ff5d8f';
      ctx.fillRect(ex+Math.round(4*u), fy-Math.round(9*u), Math.max(1,Math.round(u)), Math.max(1,Math.round(u)));
      ctx.globalAlpha = 1;
    }
    if(!dim){
      ctx.globalAlpha = 0.10 + 0.04*Math.sin(t*1.1 + i);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, Math.max(2, Math.round(3*u)));
      ctx.globalAlpha = 1;
    }
  },
  d_photoFrame(i, g, t){
    const P = CONFIG.P, p = g.photos[i], seen = !!MR.seen[i];
    if(this.open === i){
      ctx.globalAlpha = .5 + .3*Math.sin(t*4);
      ctx.fillStyle = P.pink; ctx.fillRect(p.x-3, p.y-3, p.w+6, p.h+6);
      ctx.globalAlpha = 1;
    }
    this.d_photo(i, p.x, p.y, p.w, p.h, t, false);
    if(!seen){
      const a = .4 + .35*Math.abs(Math.sin(t*2.2 + i));
      ctx.globalAlpha = a;
      text('?', p.x+p.w-4, p.y+1, {sc:1, color:P.gold});
      ctx.globalAlpha = 1;
    }
    if(seen)
      text(MR_MEM[i].tag, p.x+p.w/2, p.y+p.h+5, {sc:fitSc(MR_MEM[i].tag, p.w, 1), align:'center', color:'#a89ad0'});
  },
  /* --- крупный просмотр: текст -> зум -> подпись --- */
  d_zoom(g, t){
    const P = CONFIG.P, i = this.open, m = MR_MEM[i], p = g.photos[i];
    const to = this.tOpen;
    ctx.fillStyle = 'rgba(6,3,14,' + (0.55 + 0.3*clamp(to/0.5,0,1)).toFixed(2) + ')';
    ctx.fillRect(0, 0, W, H);
    const tw = Math.min(W-36, 150), th = Math.round(tw*0.78);
    const k = easeOut(clamp((to-0.30)/0.75, 0, 1));
    const x = lerp(p.x, (W-tw)/2, k), y = lerp(p.y, Math.round(H*0.30 - th/2), k);
    const w = lerp(p.w, tw, k), h = lerp(p.h, th, k);
    if(i === 2 && k > .4){
      ctx.globalAlpha = (k-.4)*.5;
      glowAt(x+w/2, y+h/2, w*0.7, P.pink, 1);
      ctx.globalAlpha = 1;
    }
    this.d_photo(i, Math.round(x), Math.round(y), Math.round(w), Math.round(h), G.t, false);
    // текст печатается
    if(to > 0.25){
      const a = clamp((to-0.25)/0.4, 0, 1);
      ctx.globalAlpha = a;
      text(m.name, W/2, Math.round(y) - 12, {sc:fitSc(m.name, W-20, 1), align:'center', color:'#a89ad0'});
      ctx.globalAlpha = 1;
    }
    if(to > 0.9){
      const shown = Math.floor((to-0.9)*38);
      const live = clamp(Math.max(this.chars, shown), 0, m.say.length);
      this.chars = live;
      const txt = safeLine(m.say).slice(0, live);
      const lh = 11, ty = Math.round(y+h) + 10;
      ctx.fillStyle = 'rgba(10,6,20,.6)'; ctx.fillRect(6, ty-4, W-12, Math.min(H-ty-4, 54));
      let yy = ty;
      for(const l of wrap(txt, W-24, 1).slice(0, 3)){ text(l, W/2, yy, {sc:1, align:'center', color:'#e8dff5'}); yy += lh; }
      // подпись — в конце
      if(live >= safeLine(m.say).length && to > 1.7){
        const a = clamp((to-1.7)/0.7, 0, 1);
        ctx.globalAlpha = a;
        text(m.cap, W/2, yy+2, {sc:1, align:'center', color:P.gold});
        ctx.globalAlpha = 1;
        if(m.id === 'MEMORY_03'){
          ctx.globalAlpha = a*.7;
          text('...', W/2, yy+14, {sc:2, align:'center', color:P.pink});
          ctx.globalAlpha = 1;
        }
      }
    }
    if(to > 0.5){
      const a = .45+.35*Math.abs(Math.sin(to*3));
      ctx.globalAlpha = a;
      text(this.chars < m.say.length ? (IS_TOUCH?'ТАПНИ - ДОПИСАТЬ':'ПРОБЕЛ - ДОПИСАТЬ') : (IS_TOUCH?'ТАПНИ - ЗАКРЫТЬ':'ПРОБЕЛ - ЗАКРЫТЬ'),
           W/2, H-14, {sc:1, align:'center', color:'#6b4fa0'});
      ctx.globalAlpha = 1;
    }
  },
  draw(){
    const P = CONFIG.P, t = this.t, g = this.geom();
    this.d_room(t, g);
    for(let i=0;i<MR_N;i++) this.d_photoFrame(i, g, t);
    // заголовок
    ctx.fillStyle = 'rgba(10,6,20,.72)'; ctx.fillRect(0, 0, W, 14);
    text('MEMORY ROOM', W/2, 3, {sc:fitSc('MEMORY ROOM', W-20, 1), align:'center', color:P.gold});
    // прогресс
    const n = MR.count();
    const hw = MR_N*12, hx = Math.round(W/2 - hw/2);
    for(let i=0;i<MR_N;i++) heart(hx+i*12+2, 18, 1, MR.seen[i] ? P.pink : '#3a2560');
    // подпись снизу
    ctx.fillStyle = 'rgba(10,6,20,.6)'; ctx.fillRect(0, H-16, W, 16);
    const hint = this.open >= 0 ? '' : (IS_TOUCH ? 'ТАПНИ ФОТО - НИЗ - ВЫЙТИ' : '1-3 - ФОТО. ESC - ВЫЙТИ');
    if(hint){
      const hs = fitSc(hint, W-12, 1);
      if(textW(hint, hs) <= W-12) text(hint, 6, H-12, {sc:hs, color:'#6b4fa0'});
    }
    if(this.open >= 0) this.d_zoom(g, t);
    motes(G.t, 12, '#ffd166', .18);
    vignette(0.45); crtOverlay(G.t);
  }
};
