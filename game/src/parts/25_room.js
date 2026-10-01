/* ==========================================================================
   ЧАСТЬ 25 · АРХИВ 05 — КОМНАТА, КОТОРАЯ ЗАПОМИНЯЕТ
   Три круга. Вес вещей меняется, часы каждый раз возвращаются к 03:17,
   а метки первого круга остаются на вещах. Финальный порядок игрок
   выводит сам — по меткам, которые комната не стёрла.
   ========================================================================== */

const ARC5_OBJ = [
  {id:'clock', name:'ЧАСЫ',    art:'clock'},
  {id:'lamp',  name:'ЛАМПА',   art:'lamp'},
  {id:'mirr',  name:'ЗЕРКАЛО', art:'mirr'},
  {id:'door',  name:'ДВЕРЬ',   art:'door'},
  {id:'bed',   name:'КРОВАТЬ', art:'bed'},
  {id:'letter',name:'ПИСЬМО',  art:'letter'},
  {id:'key',   name:'КЛЮЧ',    art:'key'}
];
const ARC5_N = ARC5_OBJ.length;
/* вес каждой вещи в каждом круге (1 — самая лёгкая, 7 — самая тяжёлая) */
const ARC5_WEIGHT = [
  [3,7,1,5,2,6,4],      // круг 1
  [5,2,7,1,6,3,4],      // круг 2
  [1,4,6,2,7,3,5]       // круг 3 (веса спрятаны)
];
const ARC5_TASKS = [
  'КОМНАТА СПИТ. ИДИ ОТ САМОЙ ЛЁГКОЙ К САМОЙ ТЯЖЕЛОЙ.',
  'ОНА ПРОСИТ НАЗАД. ОТ САМОЙ ТЯЖЕЛОЙ К САМОЙ ЛЁГКОЙ.',
  'ВЕСА СПРЯТАНЫ. ПОВТОРИ ПЕРВЫЙ ПОРЯДОК ПО МЕТКАМ.'
];
const ARC5_CLOCK0 = 3*60 + 17;             // 03:17 — минута, с которой всё начинается

AR_HINTS.room = [
  'Читай цифры на вещах. Комната не обманывает — она забывает.',
  'В первом круге идём от меньшего к большему, во втором — наоборот.',
  'В третьем веса исчезнут. Ориентируйся на метки, что остались после первого круга.'
];

ARCH_LEVELS.room = {
  enter(){
    scenes(this);
    this.cyc = 0; this.step = 0; this.mark = new Array(ARC5_N).fill(0);
    this.on = new Array(ARC5_N).fill(0);      // подсветка
    this.bad = new Array(ARC5_N).fill(0);
    this.errs = 0; this.fails = 0; this.glitch = 0; this.lampT = 0;
    this.msg = ARC5_TASKS[0]; this.msgT = 4.0; this.msgCol = '#ffe6a8';
    this.btns = []; this.pos = []; this.clockT = 0;
    this.photoView = false; this.photoT = 0; this.photoSeen = 0;
    this.setScene('room');
  },
  tScene(dt){ this.sceneT += dt; },
  w(i, c){ return ARC5_WEIGHT[Math.min(c, ARC5_WEIGHT.length-1)][i]; },
  /** порядок, который комната ждёт сейчас */
  want(){
    const n = ARC5_N, out = [];
    if(this.cyc === 0 || this.cyc === 1){
      const c = this.cyc;
      for(let v=1; v<=n; v++){
        for(let i=0;i<n;i++) if(this.w(i,c) === v) out.push(i);
      }
      if(this.cyc === 1) out.reverse();
    } else {
      for(let k=1;k<=n;k++) out.push(this.mark.indexOf(k));   // по меткам первого круга
    }
    return out;
  },
  minute(){ return ARC5_CLOCK0 + this.step; },
  mText(){ const m = this.minute(); return (Math.floor(m/60)%24 < 10 ? '0' : '') + (Math.floor(m/60)%24) + ':' + (m%60 < 10 ? '0' : '') + (m%60); },

  touch(i){
    if(this.done) return;
    this.layout();                       // позиции могли устареть после смены экрана
    if(this.on[i] > 0.5 && this.stepDone(i)) return;      // уже взято в этом круге
    const want = this.want();
    const need = want[this.step];
    if(need === i){
      this.mark[i] = (this.cyc === 0) ? this.step + 1 : (this.mark[i] || 0);
      this.step++;
      this.on[i] = 1.4; this.clockT = 0.5;
      Snd.note(Snd.hz(45 + this.step*2), 0.5, 'triangle', 0.10);
      Snd.note(Snd.hz(45 + this.step*2)*2, 0.25, 'sine', 0.04);
      this.msg = 'ШАГ ' + this.step + ' ИЗ ' + ARC5_N; this.msgT = 1.4; this.msgCol = '#c8ffd8';
      const p = this.pos[i];
      fx(p.x, p.y, 4, CONFIG.P.gold, 46, .7, {g:-30});
      if(this.step >= ARC5_N) this.nextCycle();
    } else {
      this.errs++; this.fails++;
      this.bad[i] = 0.8; this.glitch = 0.5;
      AR.errors[G_arIdx]++; arSaveNow();
      Snd.bad(); Snd.hurt(); shake(3);
      flashScreen('#3a2050', .18);
      // небольшая потеря: минута назад
      if(this.step > 0) this.step--;
      this.msg = 'НЕ ТОТ. МИНУТА ПОТЕРЯНА'; this.msgT = 2.0; this.msgCol = '#ff9d9d';
      if(this.fails >= 3){
        setTimeout(()=>{ if(!this.done) arLose('Комната тебя не узнала. Начнём круг заново.'); }, 900);
      }
    }
  },
  stepDone(i){ return this.want().indexOf(i) < this.step; },
  nextCycle(){
    Snd.win();
    flashScreen('#ffd97a', .25);
    celebrate(null);
    if(this.cyc >= 2){
      this.done = true; this.okT = 0;
      this.setScene('win');
      Snd.fanfare(); confettiRain(46);
      for(let i=0;i<ARC5_N;i++){ const p = this.pos[i]; fx(p.x, p.y, 5, CONFIG.P.pink, 60, 1, {g:-20}); }
      return;
    }
    this.wait = 1.7;
    this.msg = 'СНОВА 03:17'; this.msgT = 2.6; this.msgCol = '#a8c8ff';
  },
  startCycle(c){
    this.cyc = c; this.step = 0; this.on = new Array(ARC5_N).fill(0);
    this.msg = ARC5_TASKS[c]; this.msgT = 4.0; this.msgCol = '#ffe6a8';
    this.setScene('room');
  },
  u_room(dt){
    this.tScene(dt);
    for(let i=0;i<ARC5_N;i++){
      if(this.on[i] > 0) this.on[i] = Math.max(0, this.on[i] - dt*0.7);
      if(this.bad[i] > 0) this.bad[i] = Math.max(0, this.bad[i] - dt*1.2);
    }
    if(this.clockT > 0) this.clockT -= dt;
    if(this.lampT > 0) this.lampT -= dt;
    if(this.glitch > 0) this.glitch -= dt;
    if(this.msgT > 0) this.msgT -= dt;
    if(this.wait > 0){
      this.wait -= dt;
      if(this.wait <= 0) this.startCycle(this.cyc+1);
    }
  },
  on_win(){ this.okT = 0; },
  u_win(dt){
    this.tScene(dt);
    this.okT += dt;
    this.lampT = 1.2;
    if(Math.random() < .25){
      const p = this.pos[Math.floor(Math.random()*ARC5_N)];
      fx(p.x, p.y, 3, Math.random()<.5?CONFIG.P.pink:CONFIG.P.gold, 40, .8, {g:-24});
    }
    if(this.okT > 4.0) arWin();
  },
  roomH(){ return Math.max(120, H - 76); },
  layout(){
    const r = {x:0, y:32, w:W, h:this.roomH()};
    const cols = W > 300 ? 4 : 4;
    const rows = Math.ceil(ARC5_N/cols);
    const cw = r.w/cols, ch = r.h/rows;
    this.pos = [];
    for(let i=0;i<ARC5_N;i++){
      const cxx = i%cols, cyy = Math.floor(i/cols);
      this.pos.push({x:Math.round(r.x + cw*(cxx+0.5)), y:Math.round(r.y + ch*(cyy+0.5))});
    }
    // восьмая клетка — фотография на стене (в загадку не входит)
    this.photoPos = {x:Math.round(r.x + cw*3.5), y:Math.round(r.y + ch*1.5)};
    return r;
  },
  /* ---------- ввод ---------- */
  hitObj(x, y){
    let best = -1, bd = 16;
    for(let i=0;i<ARC5_N;i++){
      const p = this.pos[i], d = Math.hypot(p.x-x, p.y-y);
      if(d < bd){ bd = d; best = i; }
    }
    return best;
  },
  t_room(x, y){
    if(this.photoView){                       // открытое фото закрывается тапом
      this.photoView = false; Snd.clack(); return;
    }
    for(const b of this.btns) if(hit(b,x,y)){ Snd.blip(); b.f(); return; }
    const pp = this.photoPos;
    if(pp && Math.abs(x-pp.x) < 15 && Math.abs(y-pp.y) < 13){
      this.photoView = true; this.photoT = 0; this.photoSeen++;
      Snd.clack();
      return;
    }
    const i = this.hitObj(x, y);
    if(i >= 0) this.touch(i);
  },
  t_win(x, y){ for(const b of this.btns) if(hit(b,x,y)) b.f(); },
  k_room(k){
    const n = {'1':0,'2':1,'3':2,'4':3,'5':4,'6':5,'7':6,
               'q':0,'w':1,'e':2,'r':3,'t':4,'y':5,'u':6,
               'й':0,'ц':1,'у':2,'к':3,'е':4,'н':5,'г':6}[k];
    if(n !== undefined){ this.touch(n); return; }
    if(k === '8' || k === 'и' || k === 'И'){
      this.layout();
      this.photoView = !this.photoView; this.photoT = 0;
      if(this.photoView) this.photoSeen++;
      Snd.clack();
      return;
    }
    if(this.photoView && (k === 'Escape' || k === ' ' || k === 'Enter')){ this.photoView = false; Snd.clack(); return; }
  },
  k_win(k){},
  d_bg(t, light){
    ctx.drawImage(bgCache('arroom', p=>{ ditherGradVTo(p,0,0,W,H,'#0a1024','#140b22',14); }), 0, 0);
    // окно с луной — на стене, слева
    const wx = 8, wy = 36, ww = 20, wh = 24;
    ctx.fillStyle = '#1b2a4a'; ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#c8d8ff'; ctx.fillRect(wx+12, wy+5, 5, 5);
    ctx.fillStyle = '#2a3a5a'; ctx.fillRect(wx+13, wy+6, 3, 1); ctx.fillRect(wx+14, wy+7, 1, 1);
    ctx.fillStyle = '#3a2560';
    ctx.fillRect(wx-1, wy-1, ww+2, 1); ctx.fillRect(wx-1, wy+wh, ww+2, 1);
    ctx.fillRect(wx-1, wy-1, 1, wh+2); ctx.fillRect(wx+ww, wy-1, 1, wh+2);
    ctx.fillRect(wx+(ww>>1)-1, wy, 2, wh);
    // лунный луч (не рисуем ниже пола комнаты)
    ctx.globalAlpha = 0.10 + 0.02*Math.sin(t*0.8);
    ctx.fillStyle = '#c8d8ff';
    const floorY = this.roomH() + 32 - 8; // пол комнаты
    for(let i=0;i<34;i++){
      const ly = wy+wh+i;
      if(ly >= floorY) break;
      ctx.fillRect(wx+4+i, ly, 18-i*0.45, 1);
    }
    ctx.globalAlpha = 1;
  },
  d_obj(i, t){
    const P = CONFIG.P, p = this.pos[i], o = ARC5_OBJ[i];
    const on = this.on[i] > 0, bad = this.bad[i] > 0;
    const done = this.stepDone(i) && this.step > 0;
    const lit = on || done || (this.scene === 'win');
    const col = bad ? '#ff6b6b' : (lit ? '#ffe6a8' : '#6b7a9c');
    // подставка
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(p.x-13, p.y+9, 26, 3);
    if(lit) glowAt(p.x, p.y, 16, bad ? '#ff6b6b' : '#ffd97a', .22 + .06*Math.sin(t*3 + i));
    ctx.fillStyle = col;
    switch(o.art){
      case 'clock':
        ctx.fillRect(p.x-6, p.y-6, 13, 13);
        ctx.fillStyle = bad ? '#ff6b6b' : (lit ? '#3a3040' : '#22283a');
        ctx.fillRect(p.x-4, p.y-4, 9, 9);
        ctx.fillStyle = col;
        ctx.fillRect(p.x, p.y-3, 1, 4); ctx.fillRect(p.x, p.y, 3, 1);
        break;
      case 'lamp':
        ctx.fillRect(p.x-1, p.y, 3, 11);
        for(let j=0;j<4;j++) ctx.fillRect(p.x-6+j, p.y-4+j, 13-j*2, 2);
        break;
      case 'mirr':
        ctx.fillRect(p.x-6, p.y-9, 13, 19);
        ctx.fillStyle = bad ? '#ff6b6b' : (lit ? '#9fd0ff' : '#2a3550');
        ctx.fillRect(p.x-4, p.y-7, 9, 15);
        break;
      case 'door':
        ctx.fillRect(p.x-7, p.y-11, 14, 22);
        ctx.fillStyle = bad ? '#ff6b6b' : (lit ? '#ffd97a' : '#3a3050');
        ctx.fillRect(p.x+4, p.y, 2, 2);
        break;
      case 'bed':
        ctx.fillRect(p.x-9, p.y-2, 19, 5);
        ctx.fillRect(p.x-9, p.y+3, 3, 7);
        ctx.fillRect(p.x+7, p.y+3, 3, 7);
        ctx.fillStyle = bad ? '#ff6b6b' : (lit ? '#c8ffd8' : '#2f3a50');
        ctx.fillRect(p.x-6, p.y-5, 7, 3);
        break;
      case 'letter':
        ctx.fillRect(p.x-7, p.y-4, 14, 9);
        ctx.fillStyle = bad ? '#ff6b6b' : (lit ? '#c94f6d' : '#4a4a5a');
        ctx.fillRect(p.x-7, p.y-4, 14, 2);
        break;
      case 'key':
        ctx.fillRect(p.x-8, p.y-1, 10, 3);
        ctx.fillRect(p.x-8, p.y-1, 3, 3);
        ctx.fillRect(p.x+2, p.y+1, 2, 4);
        break;
    }
    // вес
    if(this.cyc < 2 || this.scene === 'win'){
      const wv = this.w(i, this.cyc);
      text('' + wv, p.x, p.y+12, {sc:1, align:'center', color: lit ? '#ffd97a' : '#7f8fb0'});
    } else {
      text('?', p.x, p.y+12, {sc:1, align:'center', color:'#7f8fb0'});
    }
    // метка первого круга
    if(this.cyc >= 2 && this.mark[i]){
      const mx = p.x + 10, my = p.y - 10;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(mx-3, my-3, 9, 9);
      ctx.fillStyle = '#8ce99a'; ctx.fillRect(mx-3, my-3, 9, 1); ctx.fillRect(mx-3, my+5, 9, 1);
      ctx.fillRect(mx-3, my-3, 1, 9); ctx.fillRect(mx+5, my-3, 1, 9);
      text('' + this.mark[i], mx+1, my-2, {sc:1, align:'center', color:'#8ce99a'});
    }
    if(bad){
      text('МИНУТА -1', p.x, p.y-14, {sc:1, align:'center', color:'#ff9d9d'});
    }
    const hov = ptr.x > p.x-16 && ptr.x < p.x+16 && ptr.y > p.y-16 && ptr.y < p.y+18;
    if(hov && !this.done) ringPix(p.x, p.y+2, 15, 'rgba(255,158,196,.7)', 1);
  },
  d_clock(t){
    const cx = W-24, cy = 50;
    ctx.fillStyle = '#1a1030'; ctx.fillRect(cx-13, cy-9, 26, 18);
    ctx.fillStyle = '#3a2560'; ctx.fillRect(cx-13, cy-9, 26, 1); ctx.fillRect(cx-13, cy+8, 26, 1);
    const m = this.minute();
    const mm = m%60, hh = Math.floor(m/60)%24;
    text((hh<10?'0':'') + hh + ':' + (mm<10?'0':'') + mm, cx, cy-3, {sc:1, align:'center', color: this.clockT>0 ? '#ffd97a' : '#a8c8ff'});
    if(this.clockT > 0){
      glowAt(cx, cy, 18, '#ffd97a', .35);
      ringPix(cx, cy+1, 15 + (0.5-this.clockT)*10, 'rgba(255,217,122,.8)', 1);
    }

  },
  d_head(){
    const P = CONFIG.P;
    text('КОМНАТА ПОМНИТ', 5, 4, {sc:1, color:CONFIG.P.gold});
    text(this.scene === 'win' ? 'ПРОБУЖДЕНА' : ('КРУГ ' + (this.cyc+1) + ' / 3'), W-5, 4, {sc:1, align:'right', color:'#8f83ad'});
    ctx.fillStyle = 'rgba(255,209,122,.22)'; ctx.fillRect(4, 15, W-8, 1);
    if(this.msgT > 0){
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const sc = fitSc(this.msg, W-24, 1);
      const lines = wrap(this.msg, W-24, 1).slice(0,2);
      const w2 = Math.min(W-8, textW(lines[0]||'', sc)+10);
      const hh2 = 6 + lines.length*11;
      panel(Math.round((W-w2)/2), 17, w2, hh2, 'rgba(10,6,22,.92)', this.msgCol||'#ffe6a8');
      let yy = 20;
      for(const l of lines){ text(l, W/2, yy, {sc:sc, align:'center', color:this.msgCol||'#ffe6a8'}); yy += 11; }
      ctx.globalAlpha = 1;
    }
    // прогресс круга
    const bw = Math.min(120, W-60), bx = Math.round(W/2-bw/2);
    const pby = H > 260 ? H-56 : H-72;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, pby, bw, 3);
    ctx.fillStyle = CONFIG.P.gold; ctx.fillRect(bx, pby, Math.round(bw*this.step/ARC5_N), 3);
  },
  d_btns(list){
    this.btns = [];
    const h = 16;
    const barH = H > 260 ? H : 0; // кнопки снизу, отступ
    const by = H > 260 ? H - 38 : H - 56;
    const ay = H > 260 ? H - 20 : H - 38;
    const y = by;
    const bw = Math.floor((W-8-(list.length-1)*4)/list.length);
    list.forEach((it,i)=>{
      const x = 4 + i*(bw+4);
      const on = ptr.x>x && ptr.x<x+bw && ptr.y>y && ptr.y<y+h;
      drawBtn(x, y, bw, h, it.t, {press:on, color: on?'#ffd97a':'#c9bde8'});
      this.btns.push({x:x, y:y, w:bw, h:h, f:it.f});
    });
    if(H > 260) this.btns = this.btns.concat(arBar(H-20, true));
    else this.btns = this.btns.concat(arBar(H-38, true));
  },
  d_room(){
    const t = this.sceneT;
    this.layout();
    this.d_bg(t);
    for(let i=0;i<ARC5_N;i++) this.d_obj(i, t);
    this.d_photoWall(t);
    this.d_head();
    this.d_clock(t);
    if(this.photoView) this.d_photoView(t);
    if(this.glitch > 0){
      const k = this.glitch/0.5;
      ctx.globalAlpha = .25*k;
      ctx.fillStyle = '#ff6b6b';
      for(let i=0;i<6;i++) ctx.fillRect(0, Math.round(rnd(0,H)), W, Math.round(rnd(1,3)));
      ctx.globalAlpha = 1;
    }
    if(!this.photoSeen && this.msgT < 0.2){
      this.msg = 'НА СТЕНЕ ЕЩЁ ОДНА РАМОЧКА. 8 - ПОСМОТРЕТЬ.';
      this.msgT = 4.0; this.msgCol = '#a8c8ff';
    }
    if(!this.photoView) this.d_btns([
      {t:'СНАЧАЛА', f:()=>{ this.mark = new Array(ARC5_N).fill(0); this.fails = 0; this.step = 0; this.startCycle(0); }},
      {t:'ЗАПОМНИТЬ', f:()=>{ this.msg = this.cyc === 0 ? 'Я ЗАПОМНИЛ ПЕРВЫЙ ПОРЯДОК' : (this.cyc === 1 ? 'И ЕГО ОБРАТНЫЙ ХОД' : 'ПОРЯДОК ПЕРВОГО КРУГА НА ВЕЩАХ'); this.msgT = 2.4; this.msgCol = '#a8c8ff'; }}
    ]);
  },
  /** фотография в рамке на стене */
  d_photoWall(t){
    const p = this.photoPos; if(!p) return;
    const w = 22, h = 18, x = p.x-(w>>1), y = p.y-(h>>1);
    ctx.fillStyle = '#2a1c40'; ctx.fillRect(x-2, y-2, w+4, h+4);
    ctx.fillStyle = '#120a20'; ctx.fillRect(x, y, w, h);
    this.photoImg(x, y, w, h, this.cyc);
    // блик
    ctx.globalAlpha = 0.10 + 0.05*Math.sin(t*1.2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, 4);
    ctx.globalAlpha = 1;
    if(this.photoSeen === 0){
      const a = 0.4+0.35*Math.abs(Math.sin(t*2.2));
      ctx.globalAlpha = a;
      text('?', x+w-3, y+1, {sc:1, color:'#ffd166'});
      ctx.globalAlpha = 1;
    }
  },
  /** сама фотография: меняется от круга к кругу */
  photoImg(x, y, w, h, cyc){
    const u = w/22;                                   // масштаб от рамки на стене
    ctx.fillStyle = '#171029'; ctx.fillRect(x, y, w, h);
    // дальний план — окно и луна
    ctx.fillStyle = '#2b3a63'; ctx.fillRect(x+2, y+Math.round(h*0.1), w-4, Math.round(h*0.45));
    ctx.fillStyle = '#c8d8ff'; ctx.fillRect(x+Math.round(3*u), y+Math.round(4*u), Math.round(3*u), Math.round(3*u));
    ctx.fillStyle = '#101828'; ctx.fillRect(x+Math.round(w-9*u), y+h-Math.round(8*u), Math.round(7*u), Math.round(6*u));
    const fy = y+Math.round(h*0.64);
    // он — всегда на месте
    const hx = x+Math.round(w*0.27);
    ctx.fillStyle = '#2f2a4a';
    ctx.fillRect(hx-Math.round(2*u), fy-Math.round(5*u), Math.round(4*u), Math.round(7*u));
    ctx.fillRect(hx-Math.round(1*u), fy+Math.round(2*u), Math.max(1,Math.round(u)), Math.round(3*u));
    ctx.fillRect(hx, fy+Math.round(2*u), Math.max(1,Math.round(u)), Math.round(3*u));
    // она — появляется сама
    const ex = x+Math.round(w*0.70);
    if(cyc === 2){
      const fw = Math.round(7*u), fh = Math.round(8*u);
      ctx.drawImage(IMG.her, ex-(fw>>1), fy-Math.round(9*u), fw, fh);
      ctx.globalAlpha = 0.45 + 0.25*Math.sin(this.sceneT*3);
      ctx.fillStyle = '#ff5d8f';
      ctx.fillRect(ex+Math.round(4*u), fy-Math.round(9*u), Math.max(1,Math.round(u)), Math.max(1,Math.round(u)));
      ctx.globalAlpha = 1;
    } else if(cyc === 1){
      ctx.globalAlpha = 0.45;                        // силуэт еле виден
      ctx.fillStyle = '#241a3e';
      ctx.fillRect(ex-Math.round(2*u), fy-Math.round(5*u), Math.round(4*u), Math.round(7*u));
      ctx.fillRect(ex-Math.round(3*u), fy-Math.round(8*u), Math.round(6*u), Math.round(3*u));
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#1a1330';
      ctx.fillRect(ex-Math.round(3*u), fy-Math.round(6*u), Math.round(6*u), Math.round(9*u));
      ctx.globalAlpha = 1;
    }
  },
  /** крупный просмотр фотографии */
  d_photoView(t){
    this.photoT += 1/60;
    const P = CONFIG.P, cx = W/2;
    ctx.fillStyle = 'rgba(6,3,14,.86)'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(W-40, 96), h = Math.round(w*0.82);
    const x = Math.round(cx - w/2 - 2), y = Math.round(H*0.28 - h/2 - 2);
    // рамка
    ctx.fillStyle = '#3a2560'; ctx.fillRect(x-3, y-3, w+6, h+6);
    ctx.fillStyle = '#241445'; ctx.fillRect(x-2, y-2, w+4, h+4);
    const a = clamp(this.photoT*2.2, 0, 1);
    ctx.globalAlpha = a;
    this.photoImg(x, y, w, h, this.cyc);
    if(this.cyc === 2){
      glowAt(x+w/2, y+h/2, w*0.5, P.pink, .12 + .04*Math.sin(t*2));
    }
    ctx.globalAlpha = 1;
    // подпись-дата: меняется сама
    const dts = ['03:17', '03:19', '03:21'];
    text(dts[Math.min(this.cyc, 2)], x+w-3, y+h-9, {sc:1, align:'right', color:'#8f83ad'});
    if(this.cyc === 2 && this.photoT > 1.1){
      const a2 = clamp((this.photoT - 1.1)/1.0, 0, 1);
      ctx.globalAlpha = a2;
      text('...', cx, y+h+12, {sc:2, align:'center', color:P.pink});
      ctx.globalAlpha = 1;
    } else if(this.cyc === 1 && this.photoT > 1.1){
      const a2 = clamp((this.photoT - 1.1)/1.0, 0, 1);
      ctx.globalAlpha = a2;
      text('кого-то не хватает', cx, y+h+12, {sc:1, align:'center', color:'#8f83ad'});
      ctx.globalAlpha = 1;
    }
    text(IS_TOUCH ? 'ТАПНИ, ЧТОБЫ ЗАКРЫТЬ' : 'ПРОБЕЛ - ЗАКРЫТЬ', cx, H-20, {sc:1, align:'center', color:'#6b4fa0'});
  },
  d_win(){
    const t = this.sceneT;
    this.layout();
    // комната оживает
    ctx.drawImage(bgCache('arroom2', p=>{
      ditherGradVTo(p,0,0,W,H,'#2a1e3e','#4a2f48',14);
      veilBlobTo(p, W*0.5, H*0.4, Math.max(W,H)*0.6, 'rgba(255,214,150,.20)');
    }), 0, 0);
    for(let i=0;i<ARC5_N;i++) this.d_obj(i, t);
    this.d_head();
    const cx = W/2, cy = Math.round(this.roomH()*0.5);
    glowAt(cx, cy, 40, '#ffd97a', .16 + .05*Math.sin(t*2));
    const lines = wrap('ТРИ ЧАСА СЕМНАДЦАТЬ МИНУТ. МЫ ТОГДА НЕ СПАЛИ.', W-24, 1);
    let y = H > 260 ? H-94 : H-110;
    for(const l of lines){ text(l, cx, y, {sc:1, align:'center', color:'#fff6e8'}); y += 11; }
    this.d_btns([{t:'В АРХИВ', f:()=>arWin()}]);
  },

  outro:[
    D('him','Три круга, и каждый раз возвращалось три семнадцать.'),
    D('him','Я специально сделал так, чтобы ты вспомнила эту минуту.'),
    D('him','Потому что в три семнадцать я впервые сказал, что ты мне нравишься.'),
    D('him','И ты не спала до утра. Как и я.')
  ]
};
