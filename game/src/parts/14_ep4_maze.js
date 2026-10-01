/* ==========================================================================
   ЧАСТЬ 14 · ЭПИЗОД 4 — ЛАБИРИНТ И ДОЖДЬ
   Проведи её через холодный город к тёплому огоньку. Зонт не отпускай.
   ========================================================================== */

const MAZ = {
  cols: 11, rows: 9,          // клетки
  hint: 'Возьми зонт и не отпускай меня!'
};

const EP4 = {
  name:'ЛАБИРИНТ И ДОЖДЬ', sub:'дойди до огонька', hint:'СТРЕЛКИ — ИДТИ', hintY:false,
  intro:[D('him','Тут холодно, дождь и куча тупиков.'),
         D('him','Но в конце я оставил костёр. Иди по стрелкам и не стой на месте.')],
  outro:[D('him','Ты дошла. Я видел, как ты шла.'),
         D('him','Пятое и шестое сердца — наши.')],
  hearts: 2,
  enter(){
    scenes(this);
    const R = mulberry32(17062026);
    const C = MAZ.cols, Rr = MAZ.rows;
    this.walls = [];
    for(let r=0;r<Rr;r++){ this.walls[r]=[]; for(let c=0;c<C;c++) this.walls[r][c] = (c===0||r===0||c===C-1||r===Rr-1) ? 1 : 0; }
    // карта: ковровое покрытие — 15% стен внутри
    for(let r=1;r<Rr-1;r++) for(let c=1;c<C-1;c++) if(R() < 0.17) this.walls[r][c] = 1;
    // лужи (медленные клетки)
    this.puddles = [];
    for(let r=1;r<Rr-1;r++) for(let c=1;c<C-1;c++) if(!this.walls[r][c] && R() < 0.10) this.puddles.push({r:r,c:c});
    // гарантированный проход: старт -> вдоль верхнего ряда -> вниз -> к огоньку
    for(let c=1;c<C-1;c++) this.walls[1][c] = 0;
    for(let r=1;r<Rr-1;r++) this.walls[r][C-2] = 0;
    this.cx = 1; this.cy = 1; this.gx = 1; this.gy = 1;
    this.warm = {r:Rr-2, c:C-2};
    for(let c=C-2;c>=this.warm.c;c--) this.walls[Rr-2][c] = 0;
    this.t = 0; this.ok = false; this.okT = 0; this.slow = 0; this.steps = 0;
    this.limit = this.shortest()*2 + 14;      // лимит шагов по карте
    this.setScene('play');
  },
  on_play(){ this.ok = false; },
  /* сколько шагов от старта до огонька по стенам (волновой поиск) */
  shortest(){
    const C = MAZ.cols, R = MAZ.rows, q = [[1,1,0]], seen = {};
    seen['1,1'] = 1;
    while(q.length){
      const [r,c,d] = q.shift();
      if(r === this.warm.r && c === this.warm.c) return d;
      for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){
        const nr = r+dr, nc = c+dc, k = nr+','+nc;
        if(nr<0||nc<0||nr>=R||nc>=C || seen[k] || this.walls[nr][nc]) continue;
        seen[k] = 1; q.push([nr,nc,d+1]);
      }
    }
    return 30;
  },
  cell(){
    const aw = W-10, ah = H-116;
    return Math.max(8, Math.min(26, Math.floor(Math.min(aw/MAZ.cols, ah/MAZ.rows))));
  },
  grid(){
    const s = this.cell(), gh = s*MAZ.rows;
    return {s:s, x:Math.round((W - s*MAZ.cols)/2), y:Math.max(38, Math.round((H - 74 - gh)/2))};
  },
  u_play(dt){
    this.t += dt;
    if(this.slow > 0) this.slow -= dt;
    if(this.ok){ this.okT += dt; if(this.okT > 1.5) winLevel(LEVELS.indexOf(this)); return; }
    if(this.steps > this.limit) loseLevel('Заблудилась в дожде... Он всё ещё ждёт у огонька.');
  },
  d_play(){
    const P = CONFIG.P, t = this.t, G2 = this.grid(), s = G2.s;
    // фон: дождливый город
    ctx.drawImage(bgCache('ep4bg', paint=>{ ditherGradVTo(paint,0,0,W,H,'#0b1024','#1d2440',14); }), 0, 0);
    if(FXQ > .5){
      rainFX(t, 40, '#8ca0c8', 190, .22);
      rainFX(t, 18, '#c9d8ff', 240, .28);
    }
    hudTop({icon:'maze', title:'ЛАБИРИНТ И ДОЖДЬ', col:'#5a4680', h:20, right:this.steps+' / '+this.limit});
    textBlock(MAZ.hint, W/2, 28, W-16, {color:'#9b8ac0'});
    const left = this.limit - this.steps;
    if(left < 14) text('ОСТАЛОСЬ '+Math.max(0,left)+' ШАГОВ', W/2, G2.y-10, {sc:1, align:'center', color:CONFIG.P.red});
    // сетка
    for(let r=0;r<MAZ.rows;r++) for(let c=0;c<MAZ.cols;c++){
      const x = G2.x + c*s, y = G2.y + r*s;
      const wall = this.walls[r][c];
      const pud = !wall && this.puddles.some(p=>p.r===r&&p.c===c);
      if(wall){
        ctx.fillStyle = '#39406b'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#4d5590'; ctx.fillRect(x, y, s, 2);
        ctx.fillStyle = '#232a4d'; ctx.fillRect(x, y+s-2, s, 2);
        ctx.fillStyle = 'rgba(140,160,200,.20)'; ctx.fillRect(x, y, 1, s);
      } else {
        ctx.fillStyle = pud ? '#1b3a5e' : '#0e1526';
        ctx.fillRect(x, y, s, s);
        if(pud){
          const a = .35 + .25*Math.sin(t*2 + c + r);
          ctx.fillStyle = 'rgba(140,200,255,'+a.toFixed(2)+')';
          ctx.fillRect(x+2, y+2, s-4, 1); ctx.fillRect(x+2, y+s-4, s-4, 1);
        }
      }
      ctx.fillStyle = 'rgba(107,79,160,.28)';
      ctx.fillRect(x, y, s, 1); ctx.fillRect(x, y, 1, s);
    }
    // огонёк
    const wx = G2.x + this.warm.c*s + s/2, wy = G2.y + this.warm.r*s + s/2;
    if(FXQ > .5) glowAt(wx, wy, 26, '#ffd166', .3 + .12*Math.sin(t*3));
    ctx.fillStyle = '#ffd166';
    for(let i=0;i<5;i++){ const w2 = 7-i; ctx.fillRect(Math.round(wx-w2/2), Math.round(wy-4-i), w2, 1); }
    // она
    const px = G2.x + this.cx*s + s/2, py = G2.y + this.cy*s + s;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(px-7, py-2, 14, 2);
    drawGirl(px, py, CONFIG.cHer, 1.6, this.slow > 0 ? 0.5 : 0);
    if(this.slow > 0){
      ctx.globalAlpha = .5;
      text('СКОЛЬЗКО', px, py-16, {sc:1, align:'center', color:'#6bc7ff'});
      ctx.globalAlpha = 1;
    }
    vignette(0.6); crtOverlay(t);
    // кнопки направления (после виньетки — чтобы стрелки не гасли)
    this.rArrows = [
      {x:6,          y:H-16, w:34, h:14, d:[-1,0]},
      {x:W-40,       y:H-16, w:34, h:14, d:[ 1,0]},
      {x:W/2-17,     y:H-16, w:34, h:14, d:[0, 1]},
      {x:W/2-17,     y:H-32, w:34, h:14, d:[0,-1]}
    ];
    dirBtn(6, H-16, 34, 14, 'l', {color:P.sky});
    dirBtn(W-40, H-16, 34, 14, 'r', {color:P.sky});
    dirBtn(W/2-17, H-16, 34, 14, 'd', {color:P.sky});
    dirBtn(W/2-17, H-32, 34, 14, 'u', {color:P.sky});
    textBlock('СТРЕЛКИ ИЛИ ПАЛЬЦЕМ ПО КАРТЕ', W/2, G2.y+G2.s*MAZ.rows+10, W-16, {color:'#7a68a0'});
  },
  mv(dx, dy){
    const nx = this.cx+dx, ny = this.cy+dy;
    if(ny<0||nx<0||ny>=MAZ.rows||nx>=MAZ.cols) return;
    if(this.walls[ny][nx]){ Snd.bad(); shake(1.5); return; }
    this.cx = nx; this.cy = ny; this.steps++;
    if(this.puddles.some(p=>p.r===ny&&p.c===nx)){ this.slow = 0.6; Snd.bad(); }
    else Snd.blip();
    if(ny===this.warm.r && nx===this.warm.c && !this.ok){
      this.ok = true; this.okT = 0; Snd.fanfare();
      flashScreen('#ffd166', .45); punch(.1);
      for(let i=0;i<12;i++) burstHearts(wx0(this), wy0(this), 2, CONFIG.P.gold);
    }
  },
  k_play(k){
    if(k==='ArrowLeft') this.mv(-1,0);
    if(k==='ArrowRight') this.mv(1,0);
    if(k==='ArrowUp') this.mv(0,-1);
    if(k==='ArrowDown') this.mv(0,1);
    if(k==='a'||k==='A'||k==='ф'||k==='Ф') this.mv(-1,0);
    if(k==='d'||k==='D'||k==='в'||k==='В') this.mv(1,0);
    if(k==='w'||k==='W'||k==='ц'||k==='Ц') this.mv(0,-1);
    if(k==='s'||k==='S'||k==='ы'||k==='Ы') this.mv(0,1);
  },
  t_play(x, y){
    for(const r of this.rArrows)
      if(x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){ this.mv(r.d[0], r.d[1]); return; }
    // свайп по самой карте
    const G2 = this.grid(), s = G2.s;
    if(x>=G2.x && x<G2.x+G2.s*MAZ.cols && y>=G2.y && y<G2.y+G2.s*MAZ.rows){
      const tc = Math.floor((x-G2.x)/s), tr = Math.floor((y-G2.y)/s);
      const dc = tc - this.cx, dr = tr - this.cy;
      if(Math.abs(dc) >= Math.abs(dr)) this.mv(Math.sign(dc), 0);
      else this.mv(0, Math.sign(dr));
    }
  }
};
function wx0(L){ const G2 = L.grid(); return G2.x + L.warm.c*G2.s + G2.s/2; }
function wy0(L){ const G2 = L.grid(); return G2.y + L.warm.r*G2.s + G2.s/2; }
