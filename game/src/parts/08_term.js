/* ==========================================================================
   ЧАСТЬ 8 · КОМАНДНАЯ СТРОКА CMD.exe — настоящая, работающая, с сюрпризами
   Открывается иконкой на рабочем столе или из меню «Пуск».
   ========================================================================== */

/* --- иконка терминала в списке файлов --- */
const _fileIconOld = drawFileIcon;
drawFileIcon = function(node, cx, cy, o){
  o = o || {};
  if(node === 'term'){
    const w = 16, h = 14, x = Math.round(cx-w/2), y = Math.round(cy-h/2);
    ctx.fillStyle = UI.dark; ctx.fillRect(x-1, y-1, w+2, h+2);
    ctx.fillStyle = '#0d0820'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = o.sel ? '#8ce99a' : '#4a3670';
    ctx.fillRect(x+1, y+1, w-2, 1);
    ctx.fillStyle = '#8ce99a';
    ctx.fillRect(x+2, y+4, 3, 1); ctx.fillRect(x+4, y+6, 3, 1);   // «>»
    ctx.fillStyle = o.sel ? '#e6dcf7' : '#6b4fa0';
    ctx.fillRect(x+8, y+6, 5, 1);                                   // «_»
    if(o.sel){ ctx.globalAlpha=0.25; ctx.fillStyle='#8ce99a'; ctx.fillRect(x-3,y-3,w+6,h+6); ctx.globalAlpha=1; }
    return {x:x, y:y, w:w, h:h};
  }
  return _fileIconOld(node, cx, cy, o);
};

/* --- иконка на рабочем столе --- */
const _buildIcons = G.screens.desktop.buildIcons;
G.screens.desktop.buildIcons = function(){
  _buildIcons.call(this);
  this.icons.splice(this.icons.length-1, 0, {kind:'term', icon:'term', name:'CMD.exe'});
};

/* --- пункт в меню «Пуск» --- */
const _startItems = G.screens.desktop.startItems;
G.screens.desktop.startItems = function(){
  const it = _startItems.call(this);
  it.splice(1, 0, {t:'КОМАНДНАЯ СТРОКА', f:()=>{ openTerm(); }});
  return it;
};

/* --- запуск из иконки --- */
const _launch = G.screens.desktop.launch;
G.screens.desktop.launch = function(it, dbl){
  if(it.kind === 'term'){ openTerm(it); return; }
  return _launch.call(this, it, dbl);
};

/* ==========================================================================
   САМА КОНСОЛЬ
   ========================================================================== */
function termLine(win, t, col){ win.data.lines.push({t:t, c:col||'#8ce99a'}); }
function openTerm(fromIcon){
  const w = Math.min(W-10, 246), h = Math.min(H-34, 176);
  const win = Win.open('term', 'CMD — командная строка', {
    w:w, h:h,
    from: fromIcon ? {x:fromIcon.tx-20, y:fromIcon.ty-14, w:40, h:30} : null
  });
  win.data.lines = [];
  win.data.cmd = '';
  win.data.hist = [];
  win.data.hi = 0;
  win.data.matrix = 0;
  win.data.t = 0;
  win.data.prompt = 'C:\\ПИТЕР>';
  const d = new Date();
  win.data.lines.push({t:'HeartOS  v1.0', c:'#ffd166'});
  win.data.lines.push({t:'(C) '+CONFIG.him+' для '+CONFIG.her, c:'#6b4fa0'});
  win.data.lines.push({t:'Набери HELP и нажми Enter.', c:'#a08cc0'});
  win.data.lines.push({t:'', c:'#8ce99a'});
  Snd.type();
  return win;
}
function termPrint(win, t, col){
  // перенос по ширине окна
  const w = win.w - 14;
  for(const l of wrap(t, w, 1)) win.data.lines.push({t:l, c:col||'#8ce99a'});
  while(win.data.lines.length > 40) win.data.lines.shift();
}
function termKey(win, k){
  const d = win.data;
  if(d.matrix > 0) return;
  if(k === 'Enter'){
    const cmd = d.cmd.trim();
    d.hist.push(cmd); d.hi = d.hist.length;
    d.cmd = '';
    termPrint(win, d.prompt+' '+cmd, '#ffd166');
    termExec(win, cmd);
    return;
  }
  if(k === 'Backspace'){ d.cmd = d.cmd.slice(0,-1); Snd.blip(); return; }
  if(k === 'ArrowUp'){ if(d.hi > 0){ d.hi--; d.cmd = d.hist[d.hi]; Snd.blip(); } return; }
  if(k === 'ArrowDown'){ if(d.hi < d.hist.length-1){ d.hi++; d.cmd = d.hist[d.hi]; } else { d.hi = d.hist.length; d.cmd=''; } Snd.blip(); return; }
  if(k === 'Tab'){ d.cmd = 'open '; return; }
  if(k && k.length === 1 && d.cmd.length < 40){ d.cmd += k; Snd.type(); }
}
function termExec(win, raw){
  const d = win.data, P = CONFIG.P;
  const q = raw.trim().toLowerCase();
  if(!q){ return; }
  const files = G.screens.desktop.icons.map(i=>i.name);
  if(q === 'help' || q === 'помощь' || q === '?'){
    termPrint(win, 'Доступные команды:', '#ffd166');
    termPrint(win, '  help / помощь  — эта справка', '#a08cc0');
    termPrint(win, '  ls / dir / файлы — список файлов', '#a08cc0');
    termPrint(win, '  open <файл>   — запустить файл', '#a08cc0');
    termPrint(win, '  open archive  — открыть архив секретов', '#a08cc0');
    termPrint(win, '  hearts / сердца — статус сердечек', '#a08cc0');
    termPrint(win, '  whoami, date, love, sudo love, matrix', '#a08cc0');
    termPrint(win, '  color <цвет>, crt, clear, exit', '#a08cc0');
    termPrint(win, '  music — включи музыку, secret — пасхалка, shake — тряска', '#a08cc0');
    return;
  }
  if(q === 'ls' || q === 'dir' || q === 'файлы'){
    for(const f of files) termPrint(win, '  '+f, f.endsWith('.exe')?'#8ce99a':'#a08cc0');
    return;
  }
  if(q === 'open' || q === 'запуск' || q === 'старт'){
    const name = (raw.trim().split(/\s+/)[1]||'').toUpperCase();
    const it = G.screens.desktop.icons.find(i=>i.name.toUpperCase() === name);
    if(!it){ termPrint(win, 'Не найдено: '+name, P.red); termPrint(win, 'Список — команда ls', '#a08cc0'); Snd.bad(); return; }
    if(it.kind === 'level'){
      if(G.hearts[it.idx]){ termPrint(win, it.name+': уже пройдено', '#6b4fa0'); return; }
      termPrint(win, 'Запуск '+it.name+'...', P.gold);
      Win.close();
      G.pending = {type:'level', idx:it.idx, t:0};
      Win.open('load','ЗАПУСК '+NODE_META[it.idx].name+'.exe',{w:170,h:56});
    } else {
      termPrint(win, 'Запуск '+it.name+'...', P.gold);
      G.screens.desktop.launch(it, true);
    }
    return;
  }
  if(q === 'hearts' || q === 'сердца'){
    termPrint(win, 'Собрано сердец: '+storyDone()+' / '+CH, storyDone()>=CH?P.gold:P.pink);
    termPrint(win, 'Главная линия: '+G.hearts.slice(0,EP_N).map(h=>h?'+':'-').join(' '), '#8ce99a');
    termPrint(win, 'Бонус: '+arcDone()+' / '+AR_N, '#6b4fa0');
    return;
  }
  if(q === 'whoami'){
    termPrint(win, CONFIG.him, P.pink);
    termPrint(win, 'статус: влюблён, '+(heartsDone()>=NH?'счастлив':'жду письма'), '#a08cc0');
    return;
  }
  if(q === 'date' || q === 'дата'){
    const dd = new Date();
    termPrint(win, dd.toLocaleString('ru-RU'), '#8ce99a');
    return;
  }
  if(q === 'love' || q === 'люблю'){
    termPrint(win, 'Выполнение команды love...', P.pink);
    termPrint(win, 'Предупреждение: уровень нежности зашкаливает! Вокруг экрана рассыпаются розовые пиксельные частицы и мерцающие звёздочки.', '#a08cc0');
    Snd.fanfare(); flashScreen(P.pink, 0.30);
    loveMagic(5.0);
    spawnLove(40);
    return;
  }
  if(q === 'sudo love'){
    termPrint(win, '[sudo] любовь к '+CONFIG.her+': разрешено', P.gold);
    termPrint(win, 'пароль не спрашивали. он и так твой.', '#6b4fa0');
    Snd.coin();
    return;
  }
  if(q === 'matrix'){
    d.matrix = 4.5;
    termPrint(win, 'Wake up, '+CONFIG.her+'...', P.green);
    Snd.slide(220, 900, 1.2, 'sawtooth', 0.08);
    return;
  }
  if(q.indexOf('color') === 0){
    const cols = {pink:P.pink, gold:P.gold, green:'#8ce99a', sky:P.sky, red:P.red, white:P.ink, purple:'#b197fc'};
    const cn = (q.split(/\s+/)[1]||'').replace(/ё/g,'е');
    if(cols[cn]){ win.data.col = cols[cn]; termPrint(win, 'Цвет: '+cn, cols[cn]); }
    else termPrint(win, 'Цвета: pink gold green sky red white purple', P.red);
    return;
  }
  if(q === 'about' || q === 'о программе'){
    termPrint(win, 'HeartOS v1.0', P.gold);
    termPrint(win, '5 эпизодов, 8 сердец, 1 финал,', '#8ce99a');
    termPrint(win, '0 внешних файлов, 0 интернета.', '#8ce99a');
    termPrint(win, 'Сделано с нуля и с любовью.', '#6b4fa0');
    return;
  }
  if(q === 'clear' || q === 'cls' || q === 'очистить'){ d.lines = []; return; }
  if(q === 'exit' || q === 'quit' || q === 'выход'){ Win.close(); return; }
  if(q === 'crt' || q === 'эффекты'){
    G.crt = G.crt ? 0 : 1;
    termPrint(win, 'Эффекты экрана: '+(G.crt?'ВКЛ':'ВЫКЛ'), P.gold);
    return;
  }
  if(q === 'shake' || q === 'тряска'){
    G.shakeOff = !G.shakeOff;
    termPrint(win, 'Тряска экрана: '+(G.shakeOff?'ВЫКЛ':'ВКЛ'), P.gold);
    return;
  }
  if(q === 'music' || q === 'музыка'){
    if(window.musicToggle) window.musicToggle();
    termPrint(win, 'Музыка переключена', P.gold);
    return;
  }
  if(q === 'secret' || q === 'пасхалка'){
    termPrint(win, 'Секрет: я люблю тебя больше всех звёзд на небе.', P.pink);
    termPrint(win, 'И чем все сердца в этой игре. И чем все слова на всех языках.', P.pink);
    spawnLove(20); Snd.coin();
    return;
  }
  if(q === 'archive' || q === 'архив' || q === 'open archive' || q === 'открыть архив'){
    termPrint(win, 'Открываю архив секретов...', P.gold);
    Win.close();
    openArchiveWin();
    return;
  }
  if(q === 'restart' || q === 'перезапуск'){
    termPrint(win, 'Перезапуск...', P.gold);
    location.reload();
    return;
  }
  termPrint(win, q+': команда не найдена', P.red);
  termPrint(win, 'Набери help.', '#6b4fa0');
  Snd.bad();
}

/* --- рисование окна-терминала --- */
function drawTerm(win){
  drawWinFrame(win, true);
  const r = Win.inner(win), d = win.data;
  ctx.fillStyle = '#060a12'; ctx.fillRect(r.x, r.y, r.w, r.h);
  // «стеклянные» блики
  ctx.globalAlpha = 0.05; ctx.fillStyle = '#8ce99a';
  ctx.fillRect(r.x, r.y, r.w, 4); ctx.fillRect(r.x, r.y+r.h-4, r.w, 4);
  ctx.globalAlpha = 1;
  if(d.matrix > 0){
    d.t = (d.t||0) + 1;
    const R = mulberry32(Math.floor(d.t*7));
    ctx.fillStyle = 'rgba(140,233,154,.20)';
    for(let i=0;i<18;i++) ctx.fillRect(r.x, r.y+i*2, r.w, 1);
    const chars = '01{} love()print_IO ЯЛЮБЛЮТЕБЯ';
    const col = d.col || '#8ce99a';
    const cols2 = Math.floor(r.w/6);
    for(let c=0;c<cols2;c++){
      const head = ((d.t*3 + c*7) % (r.h + 14)) - 14;
      for(let k=0;k<7;k++){
        const yy = r.y + head - k*8;
        if(yy < r.y || yy > r.y+r.h-10) continue;
        ctx.globalAlpha = 1 - k/7;
        text(chars[Math.floor(R()*chars.length)], r.x+2+c*6, yy, {sc:1, color: k===0?'#e9ffe9':col});
      }
    }
    ctx.globalAlpha = 1;
    d.matrix -= 1/60;
    return;
  }
  const lh = 10, btnH = 14;
  const inputY = r.y + r.h - btnH - 12;            // строка ввода
  const rowsH = inputY - r.y - 2;
  const maxRows = Math.max(1, Math.floor(rowsH/lh));
  const lines = d.lines.slice(-maxRows);
  let y = r.y + 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(r.x, r.y, r.w, rowsH); ctx.clip();
  for(const l of lines){ text(l.t, r.x+3, y, {sc:1, color:l.c}); y += lh; }
  ctx.restore();
  // строка ввода
  const prompt = d.prompt+' ';
  const ptxt = prompt + d.cmd;
  text(ptxt, r.x+3, inputY, {sc:1, color:'#ffd166'});
  ctx.fillStyle = (Math.floor(d.t*2) % 2 === 0) ? '#8ce99a' : '#060a12';
  ctx.fillRect(r.x+3+textW(ptxt,1), inputY-3, 5, 9);
  // быстрые кнопки (чтобы работало и без клавиатуры)
  const qs = [['help',''],['ls',''],['hearts',''],['clear','']];
  let bx = r.x+2, by = r.y+r.h-13;
  ctx.fillStyle = 'rgba(13,8,32,.9)'; ctx.fillRect(r.x+1, by-1, r.w-2, 14);
  for(const q of qs){
    const w = textW(q[0],1)+8;
    drawBtn(bx, by, w, 12, q[0], {color:'#8ce99a'});
    (d.quickR = d.quickR || {})[q[0]] = {x:bx, y:by, w:w, h:12};
    bx += w+3;
  }
  if(d.quickR){
    for(const k in d.quickR) d.quickR[k].t = k;
  }
}

/* --- маршрутизация ввода --- */
const _drawWindow = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'term'){ win.data.t = (win.data.t||0) + 1; drawTerm(win); return; }
  return _drawWindow.call(this, win);
};
const _dskKey = G.screens.desktop.key;
G.screens.desktop.key = function(k){
  if(G.win && G.win.kind === 'term'){
    if(k === 'Escape'){ Win.close(); return; }
    if(k.length === 1 || ['Enter','Backspace','Tab','ArrowUp','ArrowDown'].includes(k)){ termKey(G.win, k); return; }
    return;
  }
  return _dskKey.call(this, k);
};
const _dskTap = G.screens.desktop.tap;
G.screens.desktop.tap = function(x,y){
  if(G.win && G.win.kind === 'term' && G.win.data.quickR){
    const q = G.win.data.quickR;
    for(const k in q){
      const r = q[k];
      if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){
        G.win.data.cmd = ''; termKey(G.win, k);
        return;
      }
    }
  }
  return _dskTap.call(this, x, y);
};
/* окно терминала кликабельно (фокус) — остальное как обычно */
const _dskUpdate = G.screens.desktop.update;
G.screens.desktop.update = function(dt){
  _dskUpdate.call(this, dt);
  if(G.win && G.win.kind === 'term' && G.win.data.matrix > 0 && G.win.data.matrix > 0.05) G.win.data.matrix -= dt;
};
