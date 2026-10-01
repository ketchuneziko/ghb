/* ==========================================================================
   ЧАСТЬ 4 · УРОВЕНЬ «КОД» (L8)
   Редактор + терминал: почини программу, чтобы принтер напечатал признание.
   ========================================================================== */

/* Фраза для печати берётся из CONFIG.phrase: из неё вырезаем имя Марии
   и знак «!», остаток («Я ЛЮБЛЮ ТЕБЯ,») остаётся в коде, а имя подставляется
   переменной who. Правишь phrase в CONFIG — меняется и принтер, и финал. */
const CODE_HEAD = (function(){
  let s = (CONFIG.phrase || 'Я ЛЮБЛЮ ТЕБЯ, МАРИЯ!').toUpperCase().trim();
  const her = (CONFIG.her || '').toUpperCase().trim();
  if (her && s.indexOf(her) >= 0) s = s.split(her).join('');
  s = s.replace(/[\s!?.…\-]+$/g, '');      // хвост: «!» и пробелы — долой, запятую оставляем
  s = s.replace(/^[\s,.!?;:…\-]+/g, '');   // если имя стояло в начале фразы
  return (s || 'Я ЛЮБЛЮ ТЕБЯ,') + ' ';
})();

const CODE_LINES = function(){
  return [
    [{v:'# print_i_love_u.py'}],
    [{v:'who = "' + CONFIG.her.toUpperCase() + '"'}],
    [{v:'for '}, {b:0}, {v:' in range('}, {b:1}, {v:'):'}],
    [{v:'    love.give(who, "'}, {b:2}, {v:'")'}],
    [{b:3}, {v:'("' + CODE_HEAD + '" + who)'}]
  ];
};
const CODE_ANS = ['день', '1000000', 'ВСЁ', 'print'];
const CODE_TILES = ['день', 'ночь', '7', '1000000', 'ВСЁ', 'ничего', 'print', 'delete'];
const CODE_ERR = [
  'Строка 3: NameError: «{X}»',
  'Строка 3: range({X}) — мало',
  'Строка 4: «{X}» — я хочу больше',
  'Строка 5: SyntaxError: «{X}»'
];

const L8 = {
  name:'КОД',
  hint:'ЗАПОЛНИ ПРОПУСКИ И ЖМИ ПУСК',
  hintY:false,          // подсказку рисуем сами — внутри терминала
  intro:[D('him','Я не мастер красивых слов.'), D('him','Но код писать умею. Почини его — и он всё скажет за меня.')],
  outro:[D('her','Ты правда написал это для меня?'), D('him','Каждую строчку. И ещё напишу.')],
  enter(){
    this.t = 0; this.lives = 3; this.sel = 0;
    this.fill = [null,null,null,null];
    this.mode = 'edit'; this.modeT = 0;
    this.lines = CODE_LINES();
    const R = mulberry32(20260930);
    this.tiles = CODE_TILES.slice();
    for(let i=this.tiles.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); const t=this.tiles[i]; this.tiles[i]=this.tiles[j]; this.tiles[j]=t; }
    this.out = ['$ python print_i_love_u.py', 'жду команды...'];
    this.outShown = 99; this.mistakes = 0; this.hintOn = false;
    this.blanksR = [null,null,null,null];
    this.tileR = [];
    this.printT = 0; this.flash = 0;
    this.pending = null;
  },
  curBlank(){ for(let i=0;i<4;i++){ const k=(this.sel+i)%4; if(!this.fill[k]) return k; } return this.sel; },
  put(tok){
    const b = this.curBlank();
    this.fill[b] = tok; Snd.type();
    let n = -1;
    for(let i=0;i<4;i++){ const k=(b+1+i)%4; if(!this.fill[k]){ n = k; break; } }
    if(n>=0) this.sel = n;
  },
  clearBlank(){ this.fill[this.sel] = null; Snd.blip(); },
  cycle(dir){
    const b = this.sel;
    let i = this.tiles.indexOf(this.fill[b]);
    i = (i + dir + this.tiles.length + (i<0?1:0)) % this.tiles.length;
    this.fill[b] = this.tiles[i]; Snd.type();
  },
  run(){
    if(this.mode !== 'edit') return;
    for(let i=0;i<4;i++){ if(!this.fill[i]){ this.say('Строка '+[3,3,4,5][i]+': пропуск не заполнен'); Snd.bad(); return; } }
    this.mode = 'comp'; this.modeT = 0; Snd.clack();
  },
  say(s){ this.out.push(s); this.outShown = 0; if(this.out.length>7) this.out.shift(); },
  compileDone(){
    let bad = -1;
    for(let i=0;i<4;i++){ if(this.fill[i] !== CODE_ANS[i]){ bad = i; break; } }
    if(bad < 0){
      this.mode = 'print'; this.printT = 0; this.printLine = 0;
      this.out.push('компиляция... ОК'); this.out.push('запуск...');
      Snd.note(880,0.08,'square',0.12);
    } else {
      this.mistakes++; this.lives--; this.mode = 'err'; this.modeT = 0;
      this.out.push('Traceback (most recent call last):');
      this.out.push(CODE_ERR[bad].replace('{X}', this.fill[bad]));
      this.out.push('Программа обиделась. Попробуй ещё.');
      if(this.mistakes >= 2) this.hintOn = true;
      shake(5); Snd.bad();
      if(this.lives <= 0) loseLevel('Программа сломалась окончательно. Но я всё равно люблю.');
    }
  },
  update(dt){
    this.t += dt;
    if(this.flash>0) this.flash -= dt;
    if(this.mode==='comp'){
      this.modeT += dt;
      if(this.modeT > 0.85) this.compileDone();
    } else if(this.mode==='err'){
      this.modeT += dt;
      if(this.modeT > 0.9 && this.lives>0){ this.mode='edit'; this.sel = this.curBlank(); }
    } else if(this.mode==='print'){
      this.printT += dt;
      const seq = [CODE_HEAD + CONFIG.her.toUpperCase() + '!',
                   '♥ напечатано: 1 страница',
                   '[OK] завершено без ошибок'];
      const step = 0.75;
      const idx = Math.floor(this.printT/step);
      while(this.printLine < Math.min(idx+1, seq.length)){
        this.out.push(seq[this.printLine]); this.printLine++;
        Snd.note(660 + this.printLine*160, 0.07, 'square', 0.10);
        fx(W*0.5, H*0.72, 6, CONFIG.P.pink, 60, 0.5);
      }
      if(this.printT > step*seq.length + 0.7) winLevel(LEVELS.indexOf(this));
    }
    // «печатающийся» вывод терминала
    if(this.outShown < 99){ this.outShown = 99; }
  },
  key(k){
    if(this.mode==='print') return;
    if(k==='ArrowLeft'){ this.sel = (this.sel+3)%4; Snd.blip(); return; }
    if(k==='ArrowRight'){ this.sel = (this.sel+1)%4; Snd.blip(); return; }
    if(k==='ArrowUp'){ this.cycle(-1); return; }
    if(k==='ArrowDown'){ this.cycle(1); return; }
    if(k==='Backspace'){ this.clearBlank(); return; }
    if(k>='1' && k<='8'){ const i = parseInt(k,10)-1; if(i<this.tiles.length) this.put(this.tiles[i]); return; }
    if(k==='F5' || k==='Enter' || k===' '){ this.run(); return; }
  },
  tap(x,y){
    if(this.mode==='print') return;
    // пропуски в коде
    for(let i=0;i<4;i++){
      const r = this.blanksR[i];
      if(r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ this.sel = i; Snd.blip(); return; }
    }
    // плитки
    for(let i=0;i<this.tileR.length;i++){
      const r = this.tileR[i];
      if(r && x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ this.put(r.tok); return; }
    }
    // кнопка запуска
    const rb = this.runRect;
    if(rb && x>=rb.x && x<=rb.x+rb.w && y>=rb.y && y<=rb.y+rb.h){ this.run(); return; }
    // кнопка «стереть»
    const rc = this.clrRect;
    if(rc && x>=rc.x && x<=rc.x+rc.w && y>=rc.y && y<=rc.y+rc.h){ this.clearBlank(); return; }
  },
  draw(){
    const P = CONFIG.P;
    drawWallpaper(this.t*0.2);
    ctx.fillStyle = 'rgba(10,6,22,.72)'; ctx.fillRect(0,0,W,H);

    // ---- раскладка: окно (код + терминал + кнопки), ниже — плитки ----
    const headH = 12, codeTop = 5, lineH = 12;
    const codeH = codeTop + this.lines.length*lineH + 4;
    const btnH = 22, tilesH = 32;
    const ctrlH = H >= 210 ? 16 : 4;                 // низкий экран — строку управления жертвуем
    const termH = clamp(H - 8 - codeH - btnH - tilesH - ctrlH, 26, 170);
    const wndH = codeH + termH + btnH;
    const wndX = 4, wndW = W-8;
    const wndY = Math.max(4, Math.round((H - (wndH + 5 + tilesH + ctrlH))/2));

    // ---- окно ----
    ctx.fillStyle = UI.dark; ctx.fillRect(wndX-2, wndY-2, wndW+4, wndH+4);
    ctx.fillStyle = UI.line; ctx.fillRect(wndX-1, wndY-1, wndW+2, wndH+2);
    ctx.fillStyle = UI.face; ctx.fillRect(wndX, wndY, wndW, wndH);
    ctx.fillStyle = UI.face2; ctx.fillRect(wndX, wndY, wndW, headH);
    text('print_i_love_u.py', wndX+3, wndY+1, {sc:1, color:UI.text});
    const dot = this.mode==='err' ? P.red : (this.mode==='edit' ? P.green : P.gold);
    ctx.fillStyle = dot;
    if(this.mode!=='edit' || Math.floor(this.t*2)%2===0) ctx.fillRect(wndX+wndW-9, wndY+5, 3, 3);

    // ---- код ----
    let y = wndY + headH + codeTop;
    const x0 = wndX + 4;
    for(let li=0; li<this.lines.length; li++){
      text(String(li+1), x0, y, {sc:1, color:'#4a3670'});
      let x = x0 + 11;
      for(const s of this.lines[li]){
        if(s.b === undefined){
          const isStr = /".*"/.test(s.v);
          const col = s.v.charAt(0)==='#' ? '#5a4680' : (isStr ? P.green : '#e6dcf7');
          ctx.save(); ctx.beginPath(); ctx.rect(wndX, wndY+headH, wndW, codeH); ctx.clip();
          text(s.v, x, y, {sc:1, color:col});
          ctx.restore();
          x += textW(s.v,1);
        } else {
          const val = this.fill[s.b];
          const label = val || '???';
          const bw2 = Math.min(Math.max(textW(label,1)+6, 20), wndW - (x - wndX) - 6);
          const sel = (this.sel===s.b && this.mode==='edit');
          ctx.fillStyle = sel ? 'rgba(255,209,102,.22)' : 'rgba(107,79,160,.30)';
          ctx.fillRect(x, y-1, bw2, 11);
          ctx.fillStyle = sel ? P.gold : '#6b4fa0';
          ctx.fillRect(x, y-1, bw2, 1); ctx.fillRect(x, y+9, bw2, 1);
          if(sel && Math.floor(this.t*3)%2===0){ ctx.fillRect(x+bw2+1, y, 3, 8); }
          text(label, Math.round(x+bw2/2), y+1, {sc:1, align:'center', color: val?P.pink2:'#8f83ad'});
          this.blanksR[s.b] = {x:x, y:y-2, w:bw2, h:13};
          x += bw2;
        }
      }
      y += lineH;
    }

    // ---- терминал (внутри того же окна) ----
    const ty0 = wndY + headH + codeH;
    const hintOn = this.t < 4;
    ctx.fillStyle = UI.dark; ctx.fillRect(wndX, ty0-1, wndW, termH+2);
    ctx.fillStyle = '#0d0820'; ctx.fillRect(wndX, ty0, wndW, termH);
    ctx.fillStyle = UI.line; ctx.fillRect(wndX, ty0, wndW, 1);
    if(!(hintOn && termH < 60)) text('ТЕРМИНАЛ', wndX+wndW-3, ty0+2, {sc:1, align:'right', color:'#3a2560'});
    ctx.save(); ctx.beginPath(); ctx.rect(wndX, ty0, wndW, termH); ctx.clip();
    const maxLines = Math.max(1, Math.floor((termH-4)/10));
    const show = this.out.slice(-maxLines);
    let ly = ty0 + 3;
    for(const s of show){
      const col = /ОК|напечатано|Я ЛЮБЛЮ/.test(s) ? P.green : (/Traceback|SyntaxError|Строка|обиделась|мало|больше/.test(s) ? P.red : '#8ce99a');
      text('> '+s, wndX+3, ly, {sc:1, color:col});
      ly += 10;
    }
    if(this.mode==='edit' && Math.floor(this.t*2)%2===0){
      ctx.fillStyle = P.green; ctx.fillRect(wndX+3, Math.min(ly, ty0+termH-4), 4, 1);
    }
    if(this.out.length <= 2 && this.mode==='edit' && this.t >= 4){   // терминал пуст — «шапка» ОС
      ctx.globalAlpha = 0.5 + 0.2*Math.abs(Math.sin(this.t*1.6));
      heart(Math.round(wndX+wndW/2)-10, Math.round(ty0+termH/2)-14, 2, P.pink);
      ctx.globalAlpha = 0.75;
      text('PRINT I LOVE U OS', Math.round(wndX+wndW/2), Math.round(ty0+termH/2)+4, {sc:1, align:'center', color:'#5a4680'});
      ctx.globalAlpha = 1;
    }
    // принтер с выползающей бумагой
    const prx = wndX + wndW - 34, pry = ty0 + termH - 26;
    if(!(hintOn && termH < 60)) drawPrinter(prx, pry, 1, this.t, this.mode==='print' || this.mode==='comp');
    if(this.mode==='print'){
      const k = clamp(this.printT/1.6, 0, 1);
      const ph2 = Math.round(6 + 18*k);
      ctx.fillStyle = P.paper; ctx.fillRect(prx+4, pry-ph2+2, 16, ph2);
      ctx.fillStyle = '#c9bde8';
      for(let i=0;i<Math.floor(ph2/4);i++) ctx.fillRect(prx+6, pry-ph2+4+i*4, 12, 1);
      if(k>0.5) heart(prx+8, pry-6, 1, P.pink);
    }
    if(hintOn){                           // подсказка живёт в пустом терминале
      const a = this.t>3 ? (4-this.t) : 1, sc = 1;
      const tw2 = textW(L8.hint,sc)+8, ph2 = LH(sc)+6;
      const px2 = wndX + Math.max(2, Math.round((wndW-tw2)/2));
      const py2 = ty0 + Math.max(2, Math.round((termH-ph2)/2));
      ctx.globalAlpha = a;
      panel(px2, py2, tw2, ph2, 'rgba(10,7,26,1)', '#3a2560');
      text(L8.hint, wndX+Math.round(wndW/2), py2+4, {sc:sc, align:'center', color:P.gold});
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // ---- кнопки ----
    const byy = wndY + headH + codeH + termH;
    ctx.fillStyle = UI.line; ctx.fillRect(wndX, byy, wndW, 1);
    drawLives(this.lives, wndX+4, byy+6);
    const rw = 58, rx = wndX + wndW - rw - 4, ry = byy + 4;
    const running = (this.mode==='comp');
    drawBtn(rx, ry, rw, 14, running ? 'ЖДИТЕ...' : 'ЗАПУСК ▶', {press:running, color: running?UI.dim:P.green});
    this.runRect = {x:rx, y:ry, w:rw, h:14};
    const cw2 = 42, cx2 = rx - cw2 - 4;
    drawBtn(cx2, ry, cw2, 14, 'СТЕРЕТЬ', {color:UI.dim});
    this.clrRect = {x:cx2, y:ry, w:cw2, h:14};
    if(this.mode==='comp') drawBar(wndX+4, wndY+wndH-3, wndW-8, 3, this.modeT/0.85, P.gold);

    // ---- плитки ----
    const tly = wndY + wndH + 5;
    this.geo = {wndX:wndX, wndY:wndY, wndW:wndW, wndH:wndH, headH:headH, codeH:codeH, ty0:ty0, termH:termH, byy:byy, tly:tly};
    const cols = 4, tw2 = Math.floor((W - 10 - (cols-1)*3)/cols);
    this.tileR = [];
    for(let i=0;i<this.tiles.length;i++){
      const c = i%cols, r = Math.floor(i/cols);
      const tx = 5 + c*(tw2+3), ty2 = tly + r*15;
      const tok = this.tiles[i];
      const used = this.fill.indexOf(tok) >= 0;
      const hint = this.hintOn && CODE_ANS.indexOf(tok) >= 0 && !used;
      ctx.fillStyle = UI.dark; ctx.fillRect(tx-1, ty2-1, tw2+2, 14);
      ctx.fillStyle = used ? '#1d1136' : UI.face2; ctx.fillRect(tx, ty2, tw2, 12);
      if(hint && Math.floor(this.t*4)%2===0){ ctx.fillStyle='rgba(255,209,102,.35)'; ctx.fillRect(tx, ty2, tw2, 12); }
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(tx, ty2, tw2, 1);
      text(tok, Math.round(tx+tw2/2), ty2+2, {sc:1, align:'center', color: used ? '#5a4680' : (hint?P.gold:'#e6dcf7')});
      this.tileR.push({x:tx, y:ty2, w:tw2, h:13, tok:tok});
    }
    if(ctrlH >= 16)
      text(IS_TOUCH ? 'ТАП: ПРОПУСК → ВАРИАНТ' : 'СТРЕЛКИ · 1-8 · ENTER: ПУСК',
           Math.round(W/2), tly + 30, {sc:1, align:'center', color:'#6b4fa0'});
    if(this.mode==='err'){ ctx.fillStyle='rgba(255,107,107,.12)'; ctx.fillRect(0,0,W,H); }
    crtOverlay(this.t);
    bezel();
  }
};
