/* ==========================================================================
   ЧАСТЬ 15 · ЭПИЗОД 5 — КОМНАТА, КОТОРАЯ ПОМНИТ
   Циклы, которые запоминают действия, и один порядок, который открывает дверь
   ========================================================================== */

const ROOM = {
  props: [
    {id:'lamp',  n:'ЛАМПА',    x:.18, y:.30},
    {id:'pic',   n:'КАРТИНА',  x:.50, y:.22},
    {id:'clock', n:'ЧАСЫ',     x:.80, y:.30},
    {id:'box',   n:'КОРОБКА',  x:.24, y:.68},
    {id:'note',  n:'ЗАПИСКА',  x:.72, y:.66},
    {id:'fuse',  n:'ЩИТОК',   x:.48, y:.50}
  ],
  chain: ['lamp','pic','clock','box'],
  answer: 17,                 // что показывают часы
  firstMsg: ['Ты уже была здесь.', '', 'Дверь закрыта. Ни ключа, ни ручки.'],
  lastMsg: ['Иногда, чтобы выбраться,', 'нужно не искать новый путь,', 'а посмотреть на старый по-другому.']
};

const EP5 = {
  name:'КОМНАТА', sub:'она помнит', hint:'ОБРАТИ ВНИМАНИЕ НА МЕЛОЧИ', hintY:false,
  intro:[D('her','Дверь не открывается. Ни изнутри, ни снаружи.'),
         D('her','На ней написано: «Ты уже была здесь».'),
         D('him','Значит, ты забыла. Пройди комнату ещё раз и смотри внимательнее.')],
  outro:[D('her','Третий раз. И дверь открылась.'),
         D('her','Там была фотография. Наша. Та, что я искала полгода.'),
         D('him','Я спрятал её в коробке в тот день, когда не хватило смелости сказать.'),
         D('her','...тебе надо было просто сказать.'),
         D('him','Теперь говорю.')],
  enter(){
    scenes(this);
    this.cycle = 1;
    this.state = {};
    this.history = [];            // все действия по порядку
    this.lamp = 0; this.box = 0; this.picTurn = 0; this.clock = 0;
    this.msg = ROOM.firstMsg.slice(); this.msgT = 4.2;
    this.tray = [];               // журнал памяти
    this.found = false; this.okT = 0; this.win = false;
    this.photo = false;
    this.setScene('room');
  },
  roomRect(){
    return {x:6, y:30, w:W-12, h:H-92};
  },
  propRect(p){
    const r = this.roomRect(), s = 34;
    return {
      x: Math.round(r.x + r.w*p.x - s/2),
      y: Math.round(r.y + r.h*p.y - s/2),
      w: s, h: s
    };
  },
  act(id){
    if(this.win) return;
    this.history.push(id);
    const P = CONFIG.P;
    if(id === 'lamp'){
      this.lamp = this.lamp ? 0 : 1;
      if(this.lamp){ Snd.coin(); this.say(['Свет. Наконец-то.'], P.gold); }
      else this.say(['Темно. Но теперь ты знаешь, где выключатель.'], '#9b8ac0');
    } else if(id === 'pic'){
      this.state.pic = (this.state.pic||0) + 1;
      this.picTurn = Math.min(3, Math.floor(this.state.pic/2));
      if(this.picTurn > 0){
        Snd.clack();
        this.say(['За картиной — цифра '+ROOM.answer+'. Карандашом.'], P.gold);
        for(let i=0;i<6;i++) fx(this.propRect({x:.5,y:.22}).x+17, this.propRect({x:.5,y:.22}).y+8, 2, P.gold, 30, .6);
      } else this.say(['Обычная картина.'], '#9b8ac0');
    } else if(id === 'clock'){
      this.say(['Часы показывают '+this.clockStr()+'. Ты можешь их выставить.'], P.sky);
    } else if(id === 'box'){
      this.state.box = (this.state.box||0) + 1;
      if(this.state.box >= 2){
        this.box = 1;
        this.say(['Коробка открылась. Внутри — обрывок фотографии.'], P.gold);
        Snd.coin();
      } else this.say(['Пусто. Только пыль.'], '#9b8ac0');
    } else if(id === 'fuse'){
      if(this.powerOn()){ this.say(['Все три рубильника включены. Свет есть.'], CONFIG.P.green); return; }
      this.say(['Щиток с тремя рубильниками. Они щёлкают по одному.']); Snd.clack();
    } else if(id === 'photo'){
      this.say(['Ты ещё не нашла то, что ищешь.'], '#9b8ac0');
    }
    this.checkChain();
    // комната «вспоминает»: отмечаем действия
    this.tray.push(id);
    if(this.tray.length > 5) this.tray.shift();
  },
  say(l, col){ this.msg = l; this.msgT = 3.4; this.msgCol = col; },
  clockStr(){
    const m = 3*60 + this.clock;
    return String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
  },
  powerOn(){ return (this.state.fuse||0) >= 3; },
  checkChain(){
    const h = this.history, need = ROOM.chain;
    if(h.length < need.length) return;
    for(let i=0;i<need.length;i++) if(h[h.length-need.length+i] !== need[i]) return;
    // цепочка собрана
    if(this.photo){
      if(!this.powerOn()){ this.say(['Дверь не поддалась. В коридоре темно — где-то щёлкнуло рубильником.']); return; }
      this.openDoor(); return;
    }
    this.photo = true;
    Snd.fanfare(); flashScreen(CONFIG.P.gold,.3);
    this.say(['Лампа, картина, часы, коробка... и что-то за стеной.', 'В стене — ниша. В ней — фотография.'], CONFIG.P.gold);
  },
  openDoor(){
    if(this.win) return;
    this.win = true; this.okT = 0.001;
    Snd.fanfare(); flashScreen('#fff6e8', .5);
  },
  u_room(dt){
    this.ky = 0;
    if(this.msgT > 0) this.msgT -= dt;
    if(this.okT > 0){
      this.okT += dt;
      if(this.okT > 1.6) winLevel(LEVELS.indexOf(this));
    }
  },
  d_room(){
    const P = CONFIG.P, t = this.t, r = this.roomRect();
    // тёмная комната, свет от лампы
    const lit = this.lamp;
    epBg(t, {top: lit ? '#3a2a1e' : '#160f22', bot: lit ? '#1a1226' : '#0c0818'});
    if(lit) ditherGlow(r.x+r.w*0.18, r.y+r.h*0.30, 130, '#ffd9a0', 0.30);
    // комната
    ctx.fillStyle = lit ? '#4a3a2e' : '#241c33';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = lit ? '#3a2c24' : '#1c1529';
    ctx.fillRect(r.x, r.y+r.h*0.72, r.w, r.h*0.28);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(r.x, r.y, r.w, 2);
    ctx.fillStyle = '#0d0820'; ctx.fillRect(r.x, r.y+r.h*0.72, r.w, 1);
    // обои
    for(let y=r.y+3;y<r.y+r.h*0.72;y+=6)
      for(let x=r.x+3;x<r.x+r.w;x+=6){
        ctx.fillStyle = lit ? 'rgba(255,255,255,.03)' : 'rgba(107,79,160,.07)';
        ctx.fillRect(x, y, 1, 1);
      }
    // дверь
    const dw = 36, dh = 52, dx = Math.round(r.x + r.w - dw - 18), dy = Math.round(r.y + r.h*0.72 - dh);
    ctx.fillStyle = this.win ? '#2d4a3d' : '#3a2a20';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.fillStyle = this.win ? P.green : '#5a3f2a';
    ctx.fillRect(dx, dy, dw, 2);
    if(this.win){
      ctx.fillStyle = P.gold;
      ctx.fillRect(dx+4, dy+8, 8, 40);
      ctx.fillStyle = P.green;
      ctx.fillRect(dx+dw/2-2, dy+dh/2, 4, 3);
    } else {
      ctx.fillStyle = '#1d1136';
      ctx.fillRect(dx+dw-8, dy+dh/2, 3, 3);
      text('ЗАКРЫТА', dx+dw/2, dy+dh+4, {sc:1, align:'center', color:'#9b8ac0'});
    }
    // предметы
    this.propRects = {};
    for(const p of ROOM.props){
      const b = this.propRect(p);
      const hov = (this.hot === p.id);
      const on = (p.id==='lamp' && this.lamp) || (p.id==='box' && this.box) || (p.id==='clock' && this.clock);
      ctx.fillStyle = hov ? '#4a3f5e' : '#2a2236';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = hov ? P.gold : '#4a3f5e';
      ctx.fillRect(b.x, b.y, b.w, 1); ctx.fillRect(b.x, b.y+b.h-1, b.w, 1);
      drawProp(p.id, b.x+b.w/2, b.y+b.h/2, on, hov, p.id==='fuse' ? (this.state.fuse||0) : 0);
      this.propRects[p.id] = b;
      if(p.id==='clock') text(this.clockStr(), b.x+b.w/2, b.y+b.h+1, {sc:1, align:'center', color: on?P.sky:'#6b4fa0'});
      if(p.id==='pic' && this.picTurn>0){
        text(String(ROOM.answer), b.x+b.w+4, b.y+b.h/2, {sc:1, color:P.gold});
      }
    }
    // «ниша» с фотографией
    this.niche = {x: Math.round(r.x + r.w*0.62), y: Math.round(r.y + r.h*0.24), w:34, h:26};
    // тьма и фонарь
    if(!this.lamp || !this.powerOn()){
      const lit = this.lamp;
      ctx.fillStyle = 'rgba(4,2,10,.58)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // луч фонаря за курсором
      const tx = ptr.moved ? ptr.x : Math.round(r.x + r.w*0.5), ty = ptr.moved ? ptr.y : Math.round(r.y + r.h*0.55);
      ctx.save();
      ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(tx, ty, 4, tx, ty, 40);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.65,'rgba(0,0,0,.75)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(tx, ty, 40, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = .07; ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(tx, ty, 34, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

    } else {
      // тёплый свет от лампы
      const lp = this.propRects.lamp;
      if(lp && FXQ > .5) glowAt(lp.x+lp.w/2, lp.y+lp.h/2, 46, '#ffd166', .16);
      glowAt(W/2, r.y+r.h*0.5, Math.max(W,H)*.5, '#ffd166', .07);
    }
    if(this.photo){
      const nx = this.niche.x, ny = this.niche.y;
      ctx.fillStyle = '#0d0820'; ctx.fillRect(nx-16, ny-12, 32, 24);
      ctx.fillStyle = '#4a3670'; ctx.fillRect(nx-16, ny-12, 32, 1);
      if(bothP()){
        ctx.drawImage(IMG.him, nx-14, ny-10, 12, 12);
        ctx.drawImage(IMG.her, nx+2, ny-10, 12, 12);
      } else {
        ctx.fillStyle = P.pink; ctx.fillRect(nx-4, ny-4, 8, 6);
      }
      if(Math.floor(t*2)%2===0){ ctx.fillStyle = P.gold; ctx.fillRect(nx+13, ny-11, 2, 2); }
    }
    // память комнаты: отметки действий
    const memY = r.y + r.h - 10;
    text('ПАМЯТЬ КОМНАТЫ', r.x+4, memY, {sc:1, color:'#6b4fa0'});
    const acts = ['lamp','pic','clock','box','photo'];
    for(let i=0;i<acts.length;i++){
      const n = this.history.filter(a=>a===acts[i]).length;
      const x = r.x+4+i*22;
      for(let q=0;q<Math.min(3,n);q++) ctx.fillRect(x+q*4, memY+11, 3, 3);
    }
    // подскатка
    const lines = (this.msgT > 0 ? this.msg : ['Осмотрись. Комната помнит каждое твоё действие.'])
                    .reduce((a,l)=>a.concat(wrap(l, W-24, 1)), []).slice(0,4);
    const pgH = Math.max(26, 9 + lines.length*11);
    const pg = epPanel(6, H-22-pgH, W-12, pgH, null, null);
    lines.forEach((l,i)=>text(l, pg.x+4, pg.y+4+i*11, {sc:1, color: this.msgT>0 ? (this.msgCol||'#c9bde8') : '#9b8ac0'}));
    // кнопки
    const byy = H-18;
    this.bRects = bottomButtons(byy, 14, [
      {t:'ЧАСЫ -1', color:P.sky},
      {t:'ЧАСЫ +1', color:P.sky},
      {t:'ОТМЕНА', color:P.gold}
    ], ptr);
    this.bHourM = this.bRects[0]; this.bHour = this.bRects[1]; this.bUndo = this.bRects[2];
    vignette(0.6); crtOverlay(t);
  },
  t_room(x, y){
    if(this.win) return;
    for(const b of ['bHour','bHourM','bUndo']){
      const r = this[b];
      if(r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        if(b==='bHour'){ this.clock = (this.clock+1)%60; Snd.type();
          if(this.clock === ROOM.answer) this.act('clock'), this.say(['Часы показали '+this.clockStr()+'. Что-то щёлкнуло в стене.'], CONFIG.P.green);
          return; }
        if(b==='bHourM'){ this.clock = (this.clock+59)%60; Snd.type(); return; }
        if(b==='bUndo'){
          const a = this.history.pop();
          if(a==='lamp') this.lamp = this.lamp?0:1;
          if(a==='pic' && this.state.pic) { this.state.pic--; this.picTurn = Math.min(3, Math.floor(this.state.pic/2)); }
          if(a==='box' && this.state.box) this.state.box--;
          if(a==='fuse' && this.state.fuse){ this.state.fuse--; if(!this.state.fuse) this.lamp = 0; }
          this.photo = false;
          Snd.blip(); return;
        }
      }
    }
    for(const p of ROOM.props){
      const b = this.propRects[p.id];
      if(b && x>b.x && x<b.x+b.w && y>b.y && y<b.y+b.h){
        this.hot = p.id;
        if(p.id === 'fuse'){
          // щёлкаем по рубильникам по очереди
          const n = this.state.fuse || 0;
          if(n < 3){
            this.state.fuse = n + 1;
            Snd.clack();
            fx(b.x+b.w/2, b.y+b.h/2, 4, CONFIG.P.gold, 40, .4);
            if(n+1 === 3){
              this.lamp = 1;
              Snd.fanfare(); flashScreen(CONFIG.P.gold,.3); punch(.08);
              this.say(['Щёлк. Свет в коридоре загорелся.','Теперь дверь можно открыть.'], CONFIG.P.green);
            } else this.say(['Рубильник щёлкнул. Осталось '+(3-(n+1))+'.']);
          } else this.say(['Все три включены.'], CONFIG.P.green);
          this.tray.push('fuse'); if(this.tray.length > 5) this.tray.shift();
          return;
        }
        this.act(p.id);
        const cx = b.x+b.w/2, cy = b.y+b.h/2;
        ripple(cx, cy, 'rgba(255,209,102,.8)');
        return;
      }
    }
    // ниша
    if(this.photo && this.niche){
      const nx = this.niche.x, ny = this.niche.y;
      if(Math.abs(x-nx)<18 && Math.abs(y-ny)<14){
        this.act('photo');
        Snd.fanfare(); flashScreen(CONFIG.P.gold,.4);
        this.say(ROOM.lastMsg, CONFIG.P.gold);
        shake(3);
        this.openDoor();
        return;
      }
    }
  }
};

/* --- пиктограммы комнаты --- */
function drawProp(id, cx, cy, on, hov, lv){
  const P = CONFIG.P, col = hov ? '#fff6e8' : (on ? P.gold : '#8f82b8');
  ctx.fillStyle = col;
  const p = (a,b,w,h)=>ctx.fillRect(Math.round(cx+a), Math.round(cy+b), w, h);
  if(id==='lamp'){
    p(-6,-8,12,3);
    p(-4,-5,8,2);
    if(on){ ctx.fillStyle = 'rgba(255,217,160,.8)'; p(-3,-3,6,4); }
    else { ctx.fillStyle='#5a4680'; p(-3,-3,6,4); }
    p(-1,1,2,6);
  } else if(id==='fuse'){
    const lv2 = lv || 0;
    p(-8,-9,16,18);
    ctx.fillStyle='#1d1136'; p(-7,-8,14,16);
    for(let i=0;i<3;i++){
      const on = (lv2>>i)&1;
      ctx.fillStyle = on ? '#ffd166' : '#3a2560';
      p(-6+i*5, -6, 3, 5);
      ctx.fillStyle = on ? '#fff6e8' : '#6b4fa0';
      p(-6+i*5, on?-2:-7, 3, 2);
    }
  } else if(id==='pic'){
    p(-8,-7,16,13);
    ctx.fillStyle = on ? '#3a2b56' : '#1d1136';
    p(-7,-6,14,11);
    if(on){
      ctx.fillStyle = P.gold;
      const t = (lv.picTurn||0);
      ctx.fillRect(Math.round(cx-5), Math.round(cy-5+t), 10, 9);
    } else {
      ctx.fillStyle = '#6b4fa0'; p(-3,0,4,4); p(2,-3,2,2);
    }
  } else if(id==='clock'){
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7);
    ctx.fillStyle = on ? '#241445' : '#1d1136'; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = on ? P.sky : '#6b4fa0';
    const m = 3*60 + lv.clock;
    const a = (m%60)/60*6.28;
    ctx.fillRect(Math.round(cx-1), Math.round(cy-Math.max(2,Math.sin(a)*4)), 2, Math.max(2,Math.sin(a)*4));
    ctx.fillRect(Math.round(cx-1), Math.round(cy-1), Math.max(2,Math.cos(a)*4), 2);
  } else if(id==='box'){
    p(-8,-3,16,10);
    ctx.fillStyle = on ? '#4a3670' : '#1d1136';
    p(-8,-3,16,2);
    if(on){ ctx.fillStyle = P.gold; p(-1,-1,2,8); }
    else { ctx.fillStyle='#5a4680'; p(-1,-1,2,8); }
  } else if(id==='note'){
    p(-5,-6,10,12);
    ctx.fillStyle = on ? '#241445' : '#2a2236';
    p(-4,-5,8,10);
    ctx.fillStyle = col;
    p(-3,-4,6,1); p(-3,-2,5,1); p(-3,0,6,1);
  }
}
