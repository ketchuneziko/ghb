/* ==========================================================================
   ЧАСТЬ 34 · ВСЕ ТЕКСТЫ В НОВОМ СТИЛЕ + ДОСТИЖЕНИЯ
   Ретро-цифровой, нежный, атмосферный тон. Тексты Танжара.
   Ничего не ломаем: переопределяем только тексты и добавляем окно достижений.
   ========================================================================== */

/* Длинный абзац режем на короткие реплики — так диалог читается спокойнее
   и всегда влезает в три строки даже на самом узком экране. */
function speak(lines, max){
  max = max || 48;
  const out = [];
  for(const para of lines){
    if(para.length <= max){ out.push(para); continue; }
    let cur = '';
    for(const w of para.split(' ')){
      if(!cur.length) cur = w;
      else if((cur+' '+w).length <= max) cur += ' ' + w;
      else { out.push(cur); cur = w; }
    }
    if(cur) out.push(cur);
  }
  return out.map(t => D('him', t));
}

/* --------------------------------------------------------------------------
   Плавающая плашка с длинным текстом (внизу экрана, сама гаснет)
   -------------------------------------------------------------------------- */
const NOTE2 = {t:'', col:null, left:0, dur:4.4, y:0, screen:''};
function note2(t, col, dur, yTop){
  NOTE2.t = t; NOTE2.col = col || CONFIG.P.gold; NOTE2.left = dur || 4.4; NOTE2.dur = NOTE2.left; NOTE2.y = yTop || 0; NOTE2.screen = G.state;
}
function drawNote2(){
  if(NOTE2.left <= 0 || !NOTE2.t) return;
  if(NOTE2.screen !== G.state) { NOTE2.left = 0; return; }   // плашка живёт только на своём экране
  ctx.save();
  const a = clamp(NOTE2.left*1.6, 0, 1);
  const lines = wrap(NOTE2.t, W-24, 1).slice(0, 4);
  const h = lines.length*11 + 8;
  const y = NOTE2.y || (H - h - 19);
  ctx.globalAlpha = a*0.92;
  ctx.fillStyle = 'rgba(14,8,28,.94)'; ctx.fillRect(6, y, W-12, h);
  ctx.fillStyle = NOTE2.col; ctx.fillRect(6, y, 2, h);
  ctx.fillStyle = 'rgba(107,79,160,.5)'; ctx.fillRect(6, y+h-1, W-12, 1);
  let yy = y+4;
  for(const l of lines){ text(l, W/2, yy, {sc:1, align:'center', color:NOTE2.col}); yy += 11; }
  ctx.globalAlpha = 1;
  ctx.restore();
}
/* подключаем плашку ко всем экранам (таймер тикает прямо в отрисовке) */
for(const _k in G.screens){
  const _s = G.screens[_k];
  if(_k === 'dialog' || _k === 'boot') continue;
  if(_s && _s.draw && !_s.bpNote){
    const _d = _s.draw;
    _s.draw = function(){
      if(NOTE2.left > 0) NOTE2.left -= 1/60;
      _d.call(this);
      drawNote2();
    };
    _s.bpNote = true;
  }
}

/* ==========================================================================
   1 · АУТРО СЮЖЕТНЫХ ЭПИЗОДОВ (тексты после прохождения)
   ========================================================================== */
const EP_OUTRO = [
  [ // 1 · ШИФР
    'Зашифрованные строки наконец сложились в слова. Иногда самые важные вещи прячутся за сложным слоем кода, но ты сумела подобрать верный ключ. Первое сердце снова бьётся в такт.',
    'Код успешно расшифрован. Фрагмент памяти восстановлен и сохранён в сердце системы.'
  ],
  [ // 2 · РИТМ СЕРДЦА
    'Каждый такт попадёт точно в цель, если слушать внимательно. Ритм выровнялся, шумы утихли. Ты чувствуешь этот пульс? Он принадлежит нам.'
  ],
  [ // 3 · ВОСПОМИНАНИЯ
    'Старые кадры и забытые моменты больше не растворяются в цифровом шуме. Воспоминания собраны воедино и бережно сохранены. Наша память — это то, что никто не сможет удалить.'
  ],
  [ // 4 · ЛАБИРИНТ И ДОЖДЬ
    'Даже в самом запутанном лабиринте и под самым проливным дождём есть путь к теплу. Ты прошла сквозь туман, и дорога стала ясной.'
  ],
  [ // 5 · ИСПРАВЛЕНИЕ КОДА
    'Все ошибки системы исправлены, критические сбои устранены. Код чист, а все фрагменты сердца собраны воедино. Система готова к финальному шагу.'
  ]
];
for(let i=0;i<5;i++) if(LEVELS[i]) LEVELS[i].outro = speak(EP_OUTRO[i]);

/* Вступление к ШИФР.exe — текст модуля расшифровки */
if(LEVELS[0]) LEVELS[0].intro = speak([
  'Запуск модуля расшифровки... Внимание: найден зашифрованный сигнал. Этот код содержит самые важные слова и воспоминания, но его структуры повреждены временем.',
  'Чтобы расшифровать послание, нужно восстановить верную последовательность и собрать все фрагменты воедино. Каждая разгаданная строчка приближает тебя к главному секрету.'
]);

/* ==========================================================================
   2 · АУТРО БОНУСНЫХ ИГР (тот же тон)
   ========================================================================== */
const BONUS_OUTRO = [
  [ // 5 · РУКА
    'Рука не промахнулась ни разу — и дело не в ловкости. Просто ей хотелось держать тебя за руку ещё чуть дольше, чем обычно.',
    'Этот фрагмент остаётся в реестре. Как и всё, что мы делали вместе.'
  ],
  [ // 6 · РИТМ
    'Такт выровнялся, и в нём снова слышно нас двоих. КогдаMusic играет тихо, я представляю, что ты рядом и мы считаем вместе.',
    'Ритм восстановлен. Фрагмент сохранён.'
  ],
  [ // 7 · ДОЖДЬ ИЗ СЕРДЕЦ
    'Ты ловила сердца, а я ловил твой взгляд. Ни одно не выпало — такого ещё не было, и я запомню эту погоду надолго.'
  ],
  [ // 8 · ЛАБИРИНТ ЧУВСТВ
    'В лабиринте всегда есть выход, если идти не быстро, а внимательно. Мы шли медленно — и поэтому ни разу не разошлись.'
  ],
  [ // 9 · НЕ ПРОМОКНИ
    'Мы не промокли. Я проверял. Проверял очень тщательно, потому что ты всё-таки замёрзла бы, а я бы нет.'
  ],
  [ // 10 · КОД
    'Программа снова работает. В ней по-прежнему одна переменная, и она по-прежнему равна тебе. Ничего не сломалось, ничего не изменилось.'
  ],
  [ // 11 · ПЕЧАТЬ
    'Всё напечатано, бумага не заела, а в строке осталось ровно то, что я хотел тебе сказать. Читай медленно, это никуда не денется.'
  ]
];
for(let i=0;i<7;i++) if(LEVELS[5+i]) LEVELS[5+i].outro = speak(BONUS_OUTRO[i]);

/* ==========================================================================
   3 · АУТРО ИГР АРХИВА (готовые тексты)
   ========================================================================== */
const AR_OUTRO = {
  cipher:[
    'Загадка разгадана. Символы на экране больше не скрывают смысл — они говорят о нас. Фрагмент архива успешно восстановлен.'
  ],
  stars:[
    'Все точки соединены правильными линиями. На невидимой карте неба проявился знакомый силуэт. Спасибо, что помогаешь находить свет в темноте.'
  ],
  music:[
    'Нота за нотой — гармония полностью восстановлена. Эта мелодия звучит так, будто никогда и не затихала.'
  ],
  case_:[
    'Все факты сошлись, ответы найдены. В этом деле больше нет тайн и сомнений — только искренняя правда.'
  ],
  room:[
    'Комната наполнилась уютом и знакомыми деталями. Каждая вещь здесь на своём месте.',
    'Архив полностью собран.'
  ]
};
for(const id in AR_OUTRO) if(ARCH_LEVELS[id]) ARCH_LEVELS[id].outro = speak(AR_OUTRO[id]);

/* ==========================================================================
   4 · DEV LOG — новые записи
   ========================================================================== */
DEVLOGS['DEV_LOG_01.txt'] = {day:'Запись 01 · Идея', lines:[
  'Мне хотелось сделать для неё что-то действительно особенное. Что-то, во что я вложу всю душу, время и мысли о ней. Так родилась идея HeartOS — маленькой операционной системы, хранящей наши моменты.'
]};
DEVLOGS['DEV_LOG_02.txt'] = {day:'Запись 02 · Проектирование', lines:[
  'Продумываю логику уровней. Каждый эпизод должен отражать какую-то грань наших отношений: внимание к деталям, общие воспоминания, умение слышать друг друга, поддержку и заботу.',
  'Главная сложность — сделать так, чтобы каждая механика ощущалась искренней и тёплой.'
]};
DEVLOGS['DEV_LOG_03.txt'] = {day:'Запись 03 · Ошибки и отладка', lines:[
  'Иногда код не запускается с первого раза, но стоит подумать о её улыбке — и решение находится само собой.',
  'Писать эту игру для неё — самое приятное занятие. Добавляю пасхалки в терминал и уютные визуальные эффекты.'
]};
DEVLOGS['DEV_LOG_04.txt'] = {day:'Запись 04 · Наполнение смыслом', lines:[
  'Каждый цвет, каждая строчка текста, каждая анимация сердечек создаются с душой.',
  'Главное — чтобы, запустив игру, она почувствовала, как сильно я её люблю и насколько она важна для меня.'
]};
DEVLOGS['DEV_LOG_FINAL.txt'] = {day:'Запись FINAL · Проект завершён', lines:[
  'Все модули собраны. Все баги исправлены, а зашифрованные файлы нашли свои места.',
  'Если ты видишь эту запись, значит, все 8 сердец восстановлены, а путь пройден. Но на самом деле эта игра — лишь крошечная попытка показать, как много ты для меня проходишь каждый день в реальной жизни.',
  'Главным движком, компилятором и вдохновением этого проекта от первой до последней строчки кода была твоя любовь.',
  'Спасибо, что ты рядом. Программа завершена, но наша история только начинается.'
], tail:['END OF FILE', '', 'there is no end.', '', '♥']};

/* README.txt — длинное письмо, открывается как обычный текстовый файл */
DEVLOGS['README.txt'] = {day:'ПРОЧТИ ПЕРЕД ЗАПУСКОМ', lines:[
  'Привет, любимая.',
  '',
  'Если ты читаешь этот файл, значит, ты запустила систему, которую я создавал только для тебя.',
  '',
  'Я написал эту игру, потому что обычные слова иногда кажутся слишком маленькими, чтобы вместить всё то, что я к тебе чувствую. Мне хотелось подарить тебе не просто подарок, а маленький уютный мир, в котором каждый пиксель, каждая строчка кода и каждая нота наполнены теплотой и воспоминаниями о нас.',
  '',
  'Ты — самое дорогое и прекрасное, что есть в моей жизни. Твоя улыбка освещает даже самые пасмурные дни, твоя поддержка даёт мне силы двигаться вперёд, а твоя нежность делает этот мир бесконечно теплее. Я ценю каждую минуту, проведённую с тобой, каждый наш разговор, каждый взгляд и каждую смешинку.',
  '',
  'В этой игре зашифрованы кусочки нашего общего пути, наши моменты, мои мысли о тебе и бесконечная благодарность за то, что ты есть рядом. Пройди её не спеша.',
  '',
  'Спасибо тебе за то, что ты — это ты. Я очень сильно тебя люблю.',
  '',
  'Твой разработчик и главный поклонник навсегда.'
], tail:['— ' + CONFIG.him]};
if(typeof openTxtFile === 'function'){
  const _wo = Win.open;
  Win.open = function(kind, title, o){
    if(kind === 'readme'){
      Snd.blip();
      const w = Math.min(W-14, 200), h = Math.min(H-30, 150);
      const win = _wo.call(Win, 'txtfile', 'README.txt', {w:w, h:h, from:(o && o.from) || null});
      win.data.name = 'README.txt';
      win.data.doc = DEVLOGS['README.txt'];
      win.data.scroll = 0; win.data.maxScroll = 0; win.data.fade = 0; win.data.back = null;
      if(!ACH.got.has('dark')) ACH.give('dark');
      return win;
    }
    return _wo.call(Win, kind, title, o);
  };
}

/* ==========================================================================
   5 · ДОСТИЖЕНИЯ.exe — карта восстановления
   ========================================================================== */
const PROGRESS_DESC =
  'Монитор восстановления системы HeartOS. На этой карте отображается путь восстановления наших воспоминаний. Каждая пройденная точка зажигает одно из сердец в реестре. Когда все 8 сердец будут восстановлены, откроется главный файл системы.';
const PROGRESS_STATUS = [
  {when:'0 / 8',  t:'Система ожидает первого шага. Начни с первой иконки.'},
  {when:'в процессе', t:'Фрагменты восстанавливаются. Поток нежности стабилен.'},
  {when:'8 / 8',  t:'Все фрагменты найдены! Доступ к финальному файлу разблокирован.'}
];
const _mapC0 = mapWindowContent;
mapWindowContent = function(win){
  _mapC0.call(this, win);
  const P = CONFIG.P, r = Win.inner(win);
  const n = storyDone();
  const s = n >= CH ? PROGRESS_STATUS[2] : (n === 0 ? PROGRESS_STATUS[0] : PROGRESS_STATUS[1]);
  const lines = wrap(s.t, r.w-12, 1).slice(0, 3);
  const h = lines.length*10 + 6;
  const y = r.y + r.h - h - 4;
  ctx.fillStyle = 'rgba(8,4,18,.86)'; ctx.fillRect(r.x+2, y, r.w-4, h);
  ctx.fillStyle = n >= CH ? P.green : P.dim; ctx.fillRect(r.x+2, y, 2, h);
  let yy = y+3;
  for(const l of lines){ text(l, r.x+7, yy, {sc:1, color: n>=CH ? P.green : '#c9bde8'}); yy += 10; }
  // описание модуля — один раз, внизу карты
  if(!win.data || !win.data.seenDesc){
    win.data = win.data || {};
    win.data.seenDesc = true;
    setTimeout(() => {}, 0);
    note2(PROGRESS_DESC, P.gold, 6.5);
  }
  // подпись выбора
  const pick = (G.sel != null && NODE_META[G.sel]) ? NODE_META[G.sel] : null;
  const line = pick ? 'Каждая точка на этой карте — лишь лишний повод напомнить, как сильно я тебя люблю.'
                     : 'Куда бы ты ни решила отправиться дальше, я буду идти рядом с тобой на каждом шагу.';
  ctx.globalAlpha = .55;
  const capSc = Math.min(1, (r.w-10) / Math.max(1, textW(line, 1)));
  text(line, r.x + r.w/2, y - 12, {sc:capSc, align:'center', color:P.dim});
  ctx.globalAlpha = 1;
};

/* ==========================================================================
   6 · ГЛАВНОЕ МЕНЮ, ПАУЗА, ПОВТОР, НАСТРОЙКИ, ФИНАЛ
   ========================================================================== */
/* вход в игру */
(function(){
const T = G.screens.title; if(!T || !T.draw) return;
const _d = T.draw;
T.draw = function(){
  const P = CONFIG.P;
  _d.call(this);
  ctx.globalAlpha = .55;
  const l1 = 'Каждый раз, когда ты открываешь эту игру, помни: ты входишь в мир, созданный с одной главной целью — подарить тебе улыбку.';
  const lines = wrap(l1, W-28, 1);
  let y = Math.round(H*0.80);
  for(const l of lines.slice(0,2)){ text(l, W/2, y, {sc:1, align:'center', color:P.pink2}); y += 11; }
  ctx.globalAlpha = 1;
};
})();

/* выход из меню «Пуск» */
(function(){
const D = G.screens.desktop; if(!D || !D.draw) return;
const _d = D.draw;
D.draw = function(){
  _d.call(this);
};
const _u = D.update;
D.update = function(dt){
  _u.call(this, dt);
  if(!this.bpByeT) this.bpByeT = 0;
  if(this.startOpen && !this.bpWasOpen) note2('Добро пожаловать в HeartOS, моя любимая. Здесь можно выбрать, что запустить следующим.', CONFIG.P.gold, 3.8, 6);
  if(!this.startOpen && this.bpWasOpen) note2('Спасибо за то, что провела это время со мной. Я всегда жду тебя здесь… и ещё сильнее жду в реальной жизни.', '#c9bde8', 4.2, H-58);
  this.bpWasOpen = this.startOpen;
};
})();

/* пауза */
(function(){
const L = G.screens.level; if(!L || !L.key) return;
const _k = L.key;
L.key = function(k){
  if(k === 'p' || k === 'P' || k === 'з' || k === 'З'){
    this.bpPause = !this.bpPause;
    Snd.blip();
    if(!this.bpPause) note2('Пауза окончена, а моё тепло остаётся с тобой. Готова продолжить наше приключение?', CONFIG.P.gold, 4.0);
    return;
  }
  if(this.bpPause) return;                     // во время паузы уровень не реагирует
  _k.call(this, k);
};
const _u2 = L.update;
L.update = function(dt){
  if(this.bpPause) return;
  _u2.call(this, dt);
};
const _d2 = L.draw;
L.draw = function(){
  _d2.call(this);
  if(!this.bpPause) return;
  const P = CONFIG.P;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(6,3,14,.80)'; ctx.fillRect(0, 0, W, H);
  const cx = W/2, cy = Math.round(H*0.32);
  heart(cx-9, cy-18, 3, P.pink);
  text('ПЕРЕРЫВ', cx, cy+4, {sc:2, align:'center', color:P.gold});
  const lines = wrap('Время замерло. Сделай глубокий вдох, улыбнись и помни: ты самое прекрасное, что есть в этом мире.', W-28, 1).slice(0,4);
  const ph = lines.length*11 + 10;
  const py = cy + 20;
  ctx.fillStyle = 'rgba(14,8,28,.92)'; ctx.fillRect(8, py, W-16, ph);
  ctx.fillStyle = P.pink; ctx.fillRect(8, py, 2, ph);
  let yy = py+5;
  for(const l of lines){ text(l, cx, yy, {sc:1, align:'center', color:'#e6dcf7'}); yy += 11; }
  text(IS_TOUCH ? 'ТАПНИ, ЧТОБЫ ПРОДОЛЖИТЬ' : 'P - ПРОДОЛЖИТЬ', cx, Math.min(H-16, py+ph+16), {sc:1, align:'center', color:P.sky});
  ctx.restore();
};
const _t2 = L.tap;
L.tap = function(x, y){
  if(this.bpPause){ this.bpPause = false; Snd.blip(); note2('Пауза окончена, а моё тепло остаётся с тобой. Готова продолжить наше приключение?', CONFIG.P.gold, 4.0); return; }
  _t2.call(this, x, y);
};
})();

/* повтор после ошибки */
(function(){
const _ll = loseLevel;
loseLevel = function(msg){
  const old = G.dialog;
  _ll(msg);
  if(G.dialog && G.dialog.lines && !G.dialog.lines._bp){
    G.dialog.lines.push(D('him','Ошибаться — это абсолютно нормально. В моих глазах ты побеждаешь всегда, что бы ни произошло на экране.'));
    G.dialog.lines._bp = true;
  }
};
})();

/* успех */
(function(){
const _wl = winLevel;
winLevel = function(i){
  _wl(i);
  ACH.check(i);
};
})();

/* финал: до и после */
(function(){
const F = G.screens.finale; if(!F) return;
const _fe = F.enter;
F.enter = function(){
  _fe.call(this);
  note2('Ты прошла весь этот путь! Оглянись назад и почувствуй, сколько любви и тепла было вложено в каждый шаг.', CONFIG.P.gold, 6.0);
};
const _fd = F.draw;
F.draw = function(){
  const P = CONFIG.P;
  _fd.call(this);
  if(this.phase === 'end' && !this.bpEnd){
    this.bpEnd = true;
    note2('Игра подошла к концу, но наша с тобой настоящая история только начинает набирать обороты. Я люблю тебя!', P.pink, 8.0);
    ACH.give('letter');
  }
};
})();

/* настройки: вход и после сохранения */
(function(){
const _os0 = openSettings;
openSettings = function(){
  _os0.apply(this, arguments);
  const w = G.win;
  if(w && w.kind === 'set'){ w.bpBase = Snd.on + '|' + Snd.musicOn; note2('Здесь можно настроить всё так, как удобно тебе. Главное — чтобы тебе было уютно и приятно.', CONFIG.P.gold, 4.2); }
};
const _dws = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  const r = _dws.call(this, win);
  if(win.kind === 'set'){
    const cur = Snd.on + '|' + Snd.musicOn;
    if(win.bpBase && win.bpBase !== cur){
      win.bpBase = cur;
      note2('Готово! Настройки сохранены, и теперь HeartOS будет звучать и выглядеть именно так, как нравится тебе.', CONFIG.P.green || CONFIG.P.sky, 4.0);
    }
  }
  return r;
};
})();

/* награда за прохождение */
(function(){
const R = G.screens.reward;
if(!R || !R.draw) return;
const _d = R.draw;
R.draw = function(){
  _d.call(this);
  const P = CONFIG.P, a = clamp((this.t-0.7)*2, 0, 1) * clamp((2.4-this.t)*2, 0, 1);
  if(a <= 0) return;
  ctx.globalAlpha = a*0.95;
  const l = 'Смотри, у тебя всё получилось!';
  const tw = textW(l,1)+10, ly = Math.round(NOTE2.left > 0 ? H*0.36 : Math.min(H-42, H/2 + 78));
  ctx.fillStyle = 'rgba(14,8,28,.82)';
  ctx.fillRect(Math.round(W/2-tw/2), ly-4, tw, 16);
  text(l, W/2, ly, {sc:1, align:'center', color:P.gold});
  ctx.globalAlpha = 1;
};
})();

/* секретная локация: до и после активации */
(function(){
const D = G.screens.desktop;
if(!D || !D.draw) return;
const _d = D.draw;
D.draw = function(){
  _d.call(this);
  if(ACH.got.has('dark') || !this.icons) return;
  for(const it of this.icons){
    if(it.kind !== 'readme') continue;
    if(!(ptr.x>=it.tx-20 && ptr.x<=it.tx+20 && ptr.y>=it.ty-20 && ptr.y<=it.ty+20)) continue;
    const l = 'здесь что-то скрыто...';
    ctx.globalAlpha = 0.6;
    text(l, it.tx, it.ty+26, {sc:0.85, align:'center', color:'#8f7cc0'});
    ctx.globalAlpha = 1;
    return;
  }
};
})();

/* ==========================================================================
   7 · СЕКРЕТНАЯ ПАСХАЛКА — README.txt (до и после)
   ========================================================================== */
(function(){
const _lp = openTxtFile;
if(typeof _lp !== 'function') return;
})();

/* ==========================================================================
   8 · ДОСТИЖЕНИЯ
   ========================================================================== */
const ACH_DEF = [
  {id:'first',  t:'ПЕРВОЕ СЕРДЦЕ',   d:'Первый модуль пройден. Система ожила.'},
  {id:'half',   t:'ПОЛОВИНА ПУТИ',   d:'Четыре сердца из восьми. Поток нежности стабилен.'},
  {id:'eight',  t:'ВОСЕМЬ СЕРДЕЦ',   d:'Все фрагменты найдены. Финальный файл разблокирован.'},
  {id:'arch1',  t:'ПЕРВЫЙ АРХИВ',    d:'Первый фрагмент памяти восстановлен.'},
  {id:'arch5',  t:'ПОЛНЫЙ АРХИВ',    d:'Пять фрагментов собраны. Комната помнит.'},
  {id:'hot',    t:'ГОРЯЧАЯ РУКА',    d:'Искры пойманы. Рука ещё тёплая.'},
  {id:'peek',   t:'ПОДГЛЯДЫВАЛА',    d:'Иногда нужно просто посмотреть.'},
  {id:'dark',   t:'ТЁМНЫЙ УГОЛОК',   d:'Ты нашла то, что скрыто от чужих глаз.'},
  {id:'egg',    t:'ПАСХАЛКА',        d:'Секретная команда найдена и выполнена.'},
  {id:'kiss',   t:'ПЕРВЫЙ ПОЦЕЛУЙ',  d:'Все восемь сердец привели нас друг к другу.'},
  {id:'clean',  t:'ЧИСТЫЙ КОД',      d:'Программа снова работает.'},
  {id:'print',  t:'НАПЕЧАТАНО',      d:'Вся фраза на бумаге. Ни одной заминки.'},
  {id:'all',    t:'ПОЛНЫЙ РЕЕСТР',   d:'Основная линия и архив пройдены полностью.'}
];
const ACH = {
  got: new Set(),
  pack(){ return Array.from(this.got).join(','); },
  load(){
    try{
      const d = JSON.parse(localStorage.getItem(ARCH_KEY)||'null');
      if(d && d.g) for(const s of String(d.g).split(',')) if(s) this.got.add(s);
    }catch(e){}
  },
  give(id){
    if(this.got.has(id)) return;
    const def = ACH_DEF.find(x => x.id === id);
    if(!def) return;
    this.got.add(id);
    save();
    Snd.fanfare();
    note2('Ты открыла ещё одну ачивку! Твой главный суперприз — моё бесконечное и преданное сердце.', CONFIG.P.pink, 4.6);
    G.toast = 'ДОСТИЖЕНИЕ: ' + def.t; G.toastT = 2.2;
  },
  check(levelIdx){
    const s = storyDone();
    if(s >= 1) this.give('first');
    if(s >= 4) this.give('half');
    if(s >= CH) this.give('eight');
    const a = AR.doneCount();
    if(a >= 1) this.give('arch1');
    if(a >= ARCH_N) this.give('arch5');
    if(a >= ARCH_N && s >= CH) this.give('all');
    if(levelIdx === 10) this.give('clean');
    if(levelIdx === 11) this.give('print');
  }
};
ACH.load();
(function(){
  const prev = save;
  save = function(){
    try{
      const d = JSON.parse(localStorage.getItem(ARCH_KEY)||'null') || {};
      d.g = ACH.pack();
      localStorage.setItem(ARCH_KEY, JSON.stringify(d));
    }catch(e){}
    prev();
  };
  save();
})();

/* окно достижений */
function openAchievements(from){
  if(G.win && G.win.kind === 'achv'){ Win.close(); return; }
  Snd.blip();
  const w = Math.min(W-10, 220), h = Math.min(H-24, 196);
  const win = Win.open('achv', 'ДОСТИЖЕНИЯ', {w:w, h:h, from:from || null});
  win.data.scroll = 0;
  return win;
}
const ACH_ENTER = 'Здесь собраны твои игровые победы, но моё самое главное и лучшее достижение в жизни — это ты.';
function drawAchievements(win){
  const P = CONFIG.P, r = Win.inner(win), d = win.data;
  if(d.introT === undefined) d.introT = 0;
  d.introT = Math.min(1, d.introT + 0.03);
  ctx.fillStyle = '#12091f'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(107,79,160,.20)'; ctx.fillRect(r.x, r.y, r.w, 1);
  // шапка
  const head = ACH_ENTER;
  const hl = wrap(head, r.w-56, 1).slice(0, 2);
  let hy = r.y+4;
  ctx.globalAlpha = d.introT;
  for(const l of hl){ text(l, r.x+6, hy, {sc:1, color:'#c9bde8'}); hy += 10; }
  ctx.globalAlpha = 1;
  const n = ACH.got.size;
  text(n + '/' + ACH_DEF.length, r.x+r.w-6, r.y+4, {sc:1, align:'right', color: n===ACH_DEF.length?P.gold:P.dim});
  const listY = hy + 9;
  ctx.fillStyle = 'rgba(107,79,160,.45)'; ctx.fillRect(r.x+5, listY-3, r.w-10, 1);
  // список: у каждой строки своя высота
  const maxW = r.w - 28;
  const rows = [];
  for(const a of ACH_DEF){
    const has = ACH.got.has(a.id);
    rows.push({t:a.t, has:has, h:13});
    for(const l of wrap(a.d, maxW, 1).slice(0,3)) rows.push({t:l, has:has, sub:true, h:10});
    rows.push({t:'', has:has, gap:true, h:4});
  }
  const viewH = r.y + r.h - 24 - listY;
  d.maxScroll = Math.max(0, rows.length - 1);
  if(d.scroll > d.maxScroll) d.scroll = d.maxScroll;
  if(d.scroll < 0) d.scroll = 0;
  let y = listY;
  for(let i=0;i<rows.length;i++){
    const row = rows[i];
    if(y + row.h > listY + viewH) break;
    if(row.gap){ y += row.h; continue; }
    if(!row.sub){
      heart(r.x+6, y+2, 1, row.has ? P.pink : '#3a2560');
      text(row.t, r.x+14, y, {sc:1, color: row.has ? '#fff6e8' : '#5a4680'});
    } else {
      ctx.globalAlpha = row.has ? 0.6 : 0.32;
      text(row.t, r.x+14, y, {sc:0.85, color: row.has ? '#c9bde8' : '#4a3a70'});
      ctx.globalAlpha = 1;
    }
    y += row.h;
  }
  // полоса прокрутки
  const total = rows.length*10;
  if(rows.length > 1){
    const th = Math.max(10, Math.round(viewH*10*rows.length/total));
    const ty = listY + Math.round(Math.max(0, viewH-th)*(d.scroll/Math.max(1,d.maxScroll)));
    ctx.fillStyle = 'rgba(255,209,102,.45)'; ctx.fillRect(r.x+r.w-4, ty, 2, th);
  }
  const hint = IS_TOUCH ? 'ТАП - ЛИСТАТЬ. ESC - ЗАКРЫТЬ' : 'СТРЕЛКИ - ЛИСТАТЬ. ESC - ЗАКРЫТЬ';
  text(hint, r.x+r.w/2, r.y+r.h-11, {sc:fitSc(hint, r.w-8, 1), align:'center', color:'#6b4fa0'});
}
const _dw0 = G.screens.desktop.drawWindow;
G.screens.desktop.drawWindow = function(win){
  if(win.kind === 'achv'){ drawWinFrame(win, true); drawAchievements(win); return; }
  return _dw0.call(this, win);
};
const _dk0 = G.screens.desktop.key;
G.screens.desktop.key = function(k){
  const win = G.win;
  if(win && win.kind === 'achv' && !win.closing){
    const d = win.data;
    if(k === 'Escape'){ Snd.blip(); Win.close(); return; }
    if(k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter'){ d.scroll = Math.min(d.maxScroll, d.scroll+3); Snd.blip(); return; }
    if(k === 'ArrowUp' || k === 'PageUp'){ d.scroll = Math.max(0, d.scroll-3); Snd.blip(); return; }
    return;
  }
  return _dk0.call(this, k);
};
const _dt0 = G.screens.desktop.tap;
G.screens.desktop.tap = function(x, y){
  const win = G.win;
  if(win && win.kind === 'achv' && !win.closing){
    const d = win.data, r = Win.inner(win);
    if(x > r.x+r.w/2 || y < r.y+r.h*0.6){
      d.scroll = Math.min(d.maxScroll, d.scroll+3); Snd.blip(); return;
    }
    Snd.blip(); Win.close(); return;
  }
  return _dt0.call(this, x, y);
};
/* пункт в меню «Пуск» */
(function(){
const D = G.screens.desktop;
const _si = D.startItems;
D.startItems = function(){
  const items = _si.call(this);
  items.splice(1, 0, {t:'ДОСТИЖЕНИЯ', f:()=>{ openAchievements(); }});
  return items;
};
})();

/* ==========================================================================
   9 · Крючки на остальные достижения
   ========================================================================== */
(function(){
/* пасхалка в терминале */
if(typeof termExec === 'function'){
  const _t = termExec;
  const secrets = ['forever','her','me','home','wait','login','maria','memory','eternity','smile','heart','night','hi','photo','навсегда','она','я','дом','жду','жди','вход','ночь','привет','фото'];
  termExec = function(win, raw){
    const q = String(raw||'').trim().toLowerCase();
    if(secrets.indexOf(q) >= 0) ACH.give('egg');
    return _t.call(this, win, raw);
  };
}
/* горячая рука */
const R = LEVELS[5];
if(R && R.say){
  const _s = R.say;
  R.say = function(t, col){
    _s.call(this, t, col);
    if(t === 'РУКА ГОРЯЧАЯ!') ACH.give('hot');
  };
}
/* финальная анимация поцелуя */
const KISS = G.screens.kiss;
if(KISS && KISS.update){
  const _ku = KISS.update;
  KISS.update = function(dt){
    _ku.call(this, dt);
    if(this.kissed && !this.achvGiven){ this.achvGiven = true; ACH.give('kiss'); }
  };
}
/* архив */
if(typeof arWin === 'function'){
  const _aw = arWin;
  arWin = function(){
    _aw.apply(this, arguments);
    const a = AR.doneCount();
    if(a >= 1) ACH.give('arch1');
    if(a >= ARCH_N) ACH.give('arch5');
  };
}
})();
