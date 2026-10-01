/* ==========================================================================
   ЧАСТЬ 26 · НОВЫЕ ТЕКСТЫ: командная строка и пасхалки
   Перехватываем termExec: сначала новый набор команд, потом старые.
   Старый терминал и его команды не сломаны — просто у них появились
   новые ответы и новые слова.
   ========================================================================== */

const TXT_C = {
  gold:'#ffd166', green:'#8ce99a', pink:'#ff5d8f', sky:'#4cc9f0',
  purple:'#6b4fa0', grey:'#a08cc0', ink:'#e6dcf7'
};

/* --- построчный вывод с паузами (очередь живёт в игровом цикле) --- */
function termQueue(win, lines, done){
  win.data.q = lines.map(l => Array.isArray(l) ? {t:l[0], c:l[1]}
                        : (l && typeof l === 'object' ? {t:l.t, c:l.c || TXT_C.green} : {t:l, c:TXT_C.green}));
  win.data.qT = 0.06;
  win.data.qDone = done || null;
}
function termFlush(win){
  if(!win) return;
  if(win.data.q && win.data.q.length){
    for(const l of win.data.q) _termPrint0.call(null, win, l.t, l.c);
    win.data.q = [];
  }
  if(win.data.qDone){ const f = win.data.qDone; win.data.qDone = null; f(win); }
}
function termTick(dt){
  const w = G.win;
  if(!w || w.kind !== 'term') return;
  if(w.data.q && w.data.q.some(l => !l || typeof l.t !== 'string')) w.data.q = [];   // страховка
  if(w.data.q && w.data.q.length){
    w.data.qT -= dt;
    if(w.data.qT <= 0){
      w.data.qT = 0.30;
      const l = w.data.q.shift();
      _termPrint0.call(null, w, l.t, l.c);
      Snd.type();
      if(!w.data.q.length && w.data.qDone){
        const f = w.data.qDone; w.data.qDone = null; f(w);
      }
    }
  }
}
/** напечатать несколько строк сразу */
function termSay(win, lines){
  for(const l of lines){
    if(Array.isArray(l)) _termPrint0.call(null, win, l[0], l[1]);
    else _termPrint0.call(null, win, l, TXT_C.green);
  }
}

const TERM_HELP = [
  ['help      — список команд', TXT_C.gold],
  ['ls        — показать файлы', TXT_C.green],
  ['open      — открыть программу', TXT_C.green],
  ['hearts    — статус сердец', TXT_C.green],
  ['archive   — открыть архив', TXT_C.green],
  ['whoami    — кто я', TXT_C.green],
  ['date      — текущая дата', TXT_C.green],
  ['love      — неизвестная функция', TXT_C.pink],
  ['sudo love — очень важная функция', TXT_C.pink],
  ['matrix    — не спрашивай', TXT_C.green],
  ['about     — информация о системе', TXT_C.green],
  ['crt       — эффекты экрана', TXT_C.green],
  ['clear     — очистить терминал', TXT_C.green],
  ['exit      — закрыть терминал', TXT_C.green],
  ['', TXT_C.green],
  ['Секретные: maria, heart, eternity, smile, memory,', TXT_C.purple],
  ['forever, her, me, home, wait, login,', TXT_C.purple],
  ['night, hi, photo', TXT_C.purple]
];

const _termExec0 = termExec;
const _termPrint0 = termPrint;
termExec = function(win, raw){
  const P = CONFIG.P, q = raw.trim().toLowerCase();
  const C = TXT_C;

  if(q === 'help' || q === 'помощь' || q === '?'){
    termPrint(win, 'ДОСТУПНЫЕ КОМАНДЫ:', C.gold);
    for(const l of TERM_HELP) termPrint(win, l[0], l[1]);
    Snd.blip();
    return;
  }
  if(q === 'ls' || q === 'dir' || q === 'файлы'){
    const list = G.screens.desktop.icons.map(i => i.name);
    for(const f of list) termPrint(win, '  ' + f, /\.exe$/i.test(f) ? C.green : C.grey);
    if(list.indexOf('АРХИВ.exe') < 0) termPrint(win, '  АРХИВ.exe', C.green);
    if(AR.doneCount() >= ARCH_N && list.indexOf('MARIYA.txt') < 0) termPrint(win, '  MARIYA.txt', C.pink);
    return;
  }
  if(q === 'archive' || q === 'архив'){
    termPrint(win, 'Запуск ARCHIVE.exe...', C.gold);
    termQueue(win, [
      {t:'Проверка доступа...', c:C.grey},
      {t:'ДОСТУП РАЗРЕШЁН.', c:C.green},
      {t:'Добро пожаловать обратно.', c:C.pink}
    ], () => {
      if(AR.doneCount() >= ARCH_N){
        termSay(win, [
          ['ARCHIVE COMPLETE.', C.gold],
          ['Все пять фрагментов на месте.', C.pink]
        ]);
      } else {
        termPrint(win, 'НАЙДЕНО: ' + AR.doneCount() + ' / ' + ARCH_N, C.green);
      }
      Win.close();
      openArchiveWin();
    });
    return;
  }
  if(q === 'hearts' || q === 'сердца'){
    const s = storyDone(), b = arcDone(), a = AR.doneCount();
    termPrint(win, 'СОБРАНО СЕРДЕЦ: ' + s + ' / ' + CH, s >= CH ? C.gold : C.pink);
    termPrint(win, 'ОСНОВНАЯ ЛИНИЯ:', C.grey);
    termPrint(win, '  ' + G.hearts.slice(0, EP_N).map(h => h ? '+' : '-').join(' '), C.green);
    termPrint(win, 'БОНУС: ' + b + ' / ' + AR_N, C.purple);
    termPrint(win, 'АРХИВ: ' + a + ' / ' + ARCH_N, a ? C.gold : C.grey);
    if(a >= ARCH_N) termPrint(win, 'ВСЕ ФРАГМЕНТЫ НАЙДЕНЫ.', C.pink);
    return;
  }
  if(q === 'whoami' || q === 'кто я'){
    termPrint(win, CONFIG.him.toUpperCase(), C.pink);
    termPrint(win, 'статус: ' + (heartsDone() >= NH ? 'письмо доставлено' : 'влюблён'), C.grey);
    termPrint(win, 'система: безнадёжно', C.purple);
    return;
  }
  if(q === 'love' || q === 'люблю'){
    termPrint(win, 'ВЫПОЛНЕНИЕ КОМАНДЫ love...', C.pink);
    termQueue(win, [
      {t:'ПРОВЕРКА УРОВНЯ НЕЖНОСТИ...', c:C.grey},
      {t:'ОШИБКА.', c:C.pink},
      {t:'УРОВЕНЬ НЕЖНОСТИ СЛИШКОМ ВЫСОК.', c:C.pink},
      {t:'СИСТЕМА НЕ ЗНАЕТ, ЧТО С ЭТИМ ДЕЛАТЬ.', c:C.purple},
      {t:'Но, кажется, ей нравится.', c:C.pink}
    ], () => { Snd.fanfare(); flashScreen(P.pink, 0.30); loveMagic(5.0); spawnLove(40); });
    return;
  }
  if(q === 'sudo love'){
    termPrint(win, '[sudo] любовь к ' + CONFIG.her + ': разрешено', C.gold);
    termQueue(win, [
      {t:'пароль не спрашивали.', c:C.grey},
      {t:'он и так очевиден.', c:C.purple},
      {t:'♥', c:C.pink}
    ], () => { Snd.coin(); spawnLove(14); });
    return;
  }
  if(q === 'matrix'){
    win.data.matrix = 4.5;
    termPrint(win, 'Wake up, ' + CONFIG.her + '...', C.green);
    termQueue(win, [
      {t:'СИСТЕМА ПЕРЕШЛА В НЕСТАБИЛЬНЫЙ РЕЖИМ.', c:C.green},
      {t:'шутка.', c:C.grey},
      {t:'Не пугайся.', c:C.pink}
    ]);
    Snd.slide(220, 900, 1.2, 'sawtooth', 0.08);
    return;
  }
  if(q === 'maria' || q === 'мария'){
    termPrint(win, 'ПОИСК...', C.grey);
    termQueue(win, [
      {t:'МАРИЯ НАЙДЕНА.', c:C.pink},
      {t:'СИСТЕМА УЖЕ ЗНАЛА.', c:C.grey},
      {t:'♥', c:C.pink}
    ], () => { Snd.coin(); heartTrail(W/2, H/2, P.pink, 1); });
    return;
  }
  if(q === 'heart' || q === 'сердце'){
    termSay(win, [
      ['HEARTOS HEART STATUS', C.gold],
      ['beats: ∞', C.pink],
      ['owner: ' + CONFIG.her, C.grey],
      ['status: alive', C.green]
    ]);
    spawnLove(18);
    Snd.coin();
    return;
  }
  if(q === 'eternity' || q === 'вечность'){
    termPrint(win, 'CALCULATING...', C.grey);
    termQueue(win, [
      {t:'1', c:C.green},{t:'2', c:C.green},{t:'3', c:C.green},{t:'...', c:C.green},
      {t:'ОШИБКА.', c:C.pink},
      {t:'СЧЁТЧИК ЗАКОНЧИЛСЯ.', c:C.grey},
      {t:'БЕСКОНЕЧНОСТЬ НЕ ПРЕДЕЛ.', c:C.gold}
    ], () => { Snd.fanfare(); confettiRain(20); });
    return;
  }
  if(q === 'smile' || q === 'улыбка'){
    termPrint(win, 'ПОИСК УЛЫБКИ...', C.grey);
    termQueue(win, [
      {t:'НАЙДЕНА.', c:C.pink},
      {t:'СИСТЕМА РАБОТАЕТ ЛУЧШЕ.', c:C.green}
    ], () => Snd.coin());
    return;
  }
  if(q === 'memory' || q === 'память'){
    termSay(win, [
      ['MEMORY DATABASE', C.gold],
      ['слишком много хороших воспоминаний.', C.grey],
      ['места недостаточно.', C.purple],
      ['удаление отменено.', C.pink]
    ]);
    Snd.bad();
    return;
  }
  if(q === 'forever' || q === 'навсегда'){
    termPrint(win, 'checking...', C.grey);
    termQueue(win, [
      {t:'', c:C.grey},
      {t:'ERROR', c:P.red},
      {t:'', c:C.grey},
      {t:'this value cannot be calculated.', c:P.pink},
      {t:'', c:C.grey},
      {t:'(я тоже не смог посчитать)', c:C.purple}
    ], () => { flashScreen(P.pink, .12); Snd.bad(); });
    return;
  }
  if(q === 'her' || q === 'она'){
    termPrint(win, 'SEARCHING...', C.grey);
    termQueue(win, [
      {t:'FOUND: ' + CONFIG.her.toUpperCase(), c:P.pink},
      {t:'STATUS: OCCUPIED', c:C.gold},
      {t:'', c:C.grey},
      {t:'не ищи её в списке. она и так тут.', c:C.purple}
    ]);
    return;
  }
  if(q === 'me' || q === 'я'){
    termPrint(win, 'WHO AM I...', C.grey);
    termQueue(win, [
      {t:'AUTHOR: ' + CONFIG.him.toUpperCase(), c:C.green},
      {t:'ROLE: boyfriend', c:C.grey},
      {t:'STATUS: hopelessly in love', c:P.pink}
    ]);
    return;
  }
  if(q === 'home' || q === 'дом'){
    termPrint(win, 'C:\\ПИТЕР>', C.grey);
    termQueue(win, [
      {t:'ГЛАВНАЯ ПАПКА: ' + CONFIG.her.toUpperCase(), c:C.gold},
      {t:'ФАЙЛОВ: МНОГО', c:C.grey},
      {t:'ВАЖНЫХ: ОДИН', c:P.pink}
    ], () => heartTrail(W*0.8, H*0.6, P.pink, 1));
    return;
  }
  if(q === 'wait' || q === 'жду' || q === 'жди'){
    termSay(win, [
      ['ЖДИ.', C.gold],
      ['Я ЖДАЛ.', C.grey],
      [CONFIG.her + ' ждала тоже.', P.pink]
    ]);
    return;
  }
  if(q === 'login' || q === 'вход'){
    termSay(win, [
      ['LAST USER: MARIYA', C.green],
      ['', C.grey],
      ['сессия всё ещё открыта.', C.purple]
    ]);
    return;
  }
  if(q === 'night' || q === 'ночь'){
    termPrint(win, 'LOADING...', C.grey);
    termQueue(win, [
      {t:'03:17', c:C.gold},
      {t:'ТЫ СПИШЬ.', c:C.grey},
      {t:'Я НЕТ.', c:P.pink},
      {t:'', c:C.grey},
      {t:'(не считай это за жертву)', c:C.purple}
    ]);
    return;
  }
  if(q === 'hi' || q === 'привет' || q === 'прям'){
    termPrint(win, '> ' + q, C.grey);
    termQueue(win, [
      {t:'ПРИВЕТ.', c:C.green},
      {t:'Я ЗНАЛ, ЧТО ТЫ ПРИДЁШЬ.', c:P.pink},
      {t:'ПОЖАЛУЙСТА, НЕ ЗАКРЫВАЙ.', c:C.purple}
    ]);
    return;
  }
  if(q === 'photo' || q === 'фото'){
    termPrint(win, 'SCANNING...', C.grey);
    termQueue(win, [
      {t:'ФОТО: 2', c:C.gold},
      {t:'ОДНА НЕ ПОЛУЧИЛАСЬ.', c:C.grey},
      {t:'', c:C.grey},
      {t:'(она всё равно лучше)', c:P.pink}
    ]);
    return;
  }
  if(q === 'about' || q === 'о программе'){
    termSay(win, [
      ['HeartOS v1.0', C.gold],
      ['5 сюжетных эпизодов.', C.green],
      ['8 сердец.', C.green],
      ['5 архивных игр.', C.gold],
      ['1 письмо.', C.green],
      ['', C.green],
      ['Создано с нуля.', C.grey],
      ['Без интернета.', C.grey],
      ['Без рекламы.', C.grey],
      ['Без случайных игроков.', C.grey],
      ['Только для одного человека.', C.purple],
      ['Для ' + CONFIG.her + '.', C.pink]
    ]);
    return;
  }
  if(q.indexOf('color') === 0 || q.indexOf('цвет') === 0){
    const cols = {pink:P.pink, gold:P.gold, green:'#8ce99a', sky:P.sky, red:P.red, white:P.ink, purple:'#b197fc'};
    const cn = (q.split(/\s+/)[1] || '').replace(/ё/g, 'е');
    if(cols[cn]){
      win.data.col = cols[cn];
      termPrint(win, 'ЦВЕТ ИЗМЕНЁН: ' + cn, cols[cn]);
      G.toast = 'ЦВЕТ ИЗМЕНЁН'; G.toastT = 1.4;
      Snd.coin();
    } else {
      termPrint(win, 'НЕИЗВЕСТНЫЙ ЦВЕТ.', P.red);
      termPrint(win, 'ДОСТУПНО:', C.grey);
      termPrint(win, 'pink gold green sky red white purple', C.green);
      Snd.bad();
    }
    return;
  }
  if(q === 'crt' || q === 'эффекты'){
    G.crt = G.crt ? 0 : 1;
    termPrint(win, 'CRT EFFECT: ' + (G.crt ? 'ON' : 'OFF'), C.gold);
    termPrint(win, G.crt ? 'Система выглядит старше.' : 'Теперь всё слишком чисто.', C.grey);
    Snd.blip();
    return;
  }
  if(q === 'clear' || q === 'cls' || q === 'очистить'){ win.data.lines = []; return; }
  if(q === 'exit' || q === 'quit' || q === 'выход'){ Win.close(); return; }
  if(q === 'open' || q === 'запуск' || q === 'старт'){
    const name = (raw.trim().split(/\s+/)[1] || '').toUpperCase();
    if(name === 'ARCHIVE' || name === 'АРХИВ' || name === 'АРХИВ.EXE'){ _termExec0.call(this, win, 'archive'); return; }
    if(name === 'MARIYA' || name === 'MARIYA.TXT'){ if(typeof launchMariya === 'function') launchMariya(); return; }
  }
  // неизвестная команда — новый текст
  if(q){
    termPrint(win, 'КОМАНДА НЕ НАЙДЕНА.', P.red);
    termPrint(win, 'Но попробовать было красиво.', C.grey);
    termPrint(win, 'Набери help.', C.purple);
    Snd.bad();
    return;
  }
  return _termExec0.call(this, win, raw);
};
/* --- вставка в обновление рабочего стола --- */
const _dskUpdT = G.screens.desktop.update;
G.screens.desktop.update = function(dt){
  _dskUpdT.call(this, dt);
  termTick(dt);
};

/* ==========================================================================
   ФИНАЛЬНАЯ ФРАЗА НОВЫХ ЧАСТЕЙ
   Дописывается к outro каждой игры архива и к пропуску.
   ========================================================================== */
const ARCH_FINALE = [
  D('him','А теперь возвращайся.'),
  D('him','Я оставил тебе ещё кое-что на рабочем столе.')
];
for(const m of ARCH_META){
  const lv = ARCH_LEVELS[m.id];
  if(!lv) continue;
  const base = (lv.outro || []).filter(d => d.text !== ARCH_FINALE[0].text && d.text !== ARCH_FINALE[1].text);
  const trimmed = base.slice(0, 3);
  lv.outro = trimmed.concat(ARCH_FINALE);
}
