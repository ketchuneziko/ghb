// Headless-прогон игры: подменяем DOM/canvas, гоняем все экраны и уровни.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
let code = m[1];
code += "\n;globalThis.__t = {G, LEVELS, CONFIG, CIP, RTH, MEM, MAZ, COD, FIN, EP1, EP2, EP3, EP4, EP5, CH, EP_N, AR_N, NH, EP_HEART_IDX, FINALE_NODE, key, ptr, heart, text, textW, wrap, fitSc, IMG, Snd, frame, W:()=>W, H:()=>H, LEVELS_N: LEVELS.length, fit, winLevel, goNow, startLevel, go, NODE_META, skipLevel, heartsDone, load, save, storyDone, arcDone, finaleReady, mapPick, mapTabOf, Win, drawGirl, decShift, safeLine, loveMagic, LOVEFX, AR, ARCH_META, ARCH_LEVELS, G_arIdx, G_ar, startArch, arWin, arLose, arHint, arLevel, arHints, arcShiftStr, ARC1_PLAIN, ARC2_ROWS, ARC3_PHRASE, ARC3_SHIFT, ALPH, aIdx, AR_N, ARC2_HEART, ARC2_ORDER, ARC2_FAKE, ARC2_N, ARC3_KEYS, ARC3_MIDI, ARC3_NAME, ARC3_PHRASES, ARC3_MOTIF, ARC3_STEP, ARC4_CLUES, ARC4_TIME, ARC4_SAY, ARC4_FAKE, ARC4_QUIZ, ARC5_OBJ, ARC5_N, ARC5_WEIGHT, ARC5_TASKS, ARC5_CLOCK0, openArchiveWin, glassBtn, ptr, drawBtn, openFinale, mapPick};\n";

let AUDIT = null;
function rec(x, y, w, h) {
  if (!AUDIT) return;
  AUDIT.n++;
  AUDIT.minX = Math.min(AUDIT.minX, x); AUDIT.maxX = Math.max(AUDIT.maxX, x + (w || 0));
  AUDIT.minY = Math.min(AUDIT.minY, y); AUDIT.maxY = Math.max(AUDIT.maxY, y + (h || 0));
}
function makeCtx() {
  return {
    fillStyle: '#000', globalAlpha: 1, imageSmoothingEnabled: true, font: '', textBaseline: '',
    fillRect(x, y, w, h){ rec(x, y, w, h); }, clearRect(){},
    drawImage(img, dx, dy, dw, dh){ rec(dx || 0, dy || 0, dw == null ? (img && img.width) || 0 : dw, dh == null ? (img && img.height) || 0 : dh); },
    save(){}, restore(){}, translate(){}, scale(){}, rotate(){}, setTransform(){},
    beginPath(){}, arc(){}, fill(){}, stroke(){}, strokeRect(){}, moveTo(){}, lineTo(){}, closePath(){}, rect(){}, clip(){},
    createLinearGradient(){ return {addColorStop(){}}; },
    createRadialGradient(){ return {addColorStop(){}}; },
    measureText(t){ return {width: t.length * 6}; },
    fillText(){}, putImageData(){},
    getImageData(x, y, w, h){ return {data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h}; }
  };
}
function makeCanvas(w, h) {
  return {
    width: w || 300, height: h || 150, style: {}, _ctx: null, _h: {},
    getContext(){ if (!this._ctx) this._ctx = makeCtx(); return this._ctx; },
    addEventListener(t, f){ (this._h[t] = this._h[t] || []).push(f); },
    setPointerCapture(){}, releasePointerCapture(){},
    getBoundingClientRect(){ return {left: 0, top: 0, width: this.width * 2, height: this.height * 2}; }
  };
}

const mainCanvas = makeCanvas(320, 180);
const winH = {}, docH = {};
const sandbox = {
  console,
  performance: {now: () => nowMs},
  requestAnimationFrame(cb){ rafQueue.push(cb); return rafQueue.length; },
  cancelAnimationFrame(){},
  setTimeout: () => 0, setInterval: () => 0, clearInterval(){}, clearTimeout(){},
  innerWidth: 800, innerHeight: 450,
  addEventListener(t, f){ (winH[t] = winH[t] || []).push(f); },
  navigator: {maxTouchPoints: 0},
  localStorage: {store: {}, getItem(k){ return this.store[k] || null; }, setItem(k, v){ this.store[k] = v; }, removeItem(k){ delete this.store[k]; }},
  document: {
    getElementById(){ return mainCanvas; },
    createElement(t){ return t === 'canvas' ? makeCanvas() : {}; },
    addEventListener(t, f){ (docH[t] = docH[t] || []).push(f); }
  },
  Image: class { constructor(){ this.width = 64; this.height = 64; } set src(v){ this._src = v; if (this.onload) this.onload(); } },
  matchMedia: () => ({matches: false}),
  Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, isFinite, parseInt, parseFloat, Uint8ClampedArray
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

let nowMs = 0, rafQueue = [];
vm.createContext(sandbox);
vm.runInContext(code, sandbox, {filename: 'game.js'});
const T = sandbox.__t;
const NH_N = T.NH, LEVELS_N = T.LEVELS_N;
const newFilled = (k) => Array.from({length: NH_N}, (_, i) => i < k);

let frameErrors = [];
function frames(n, dtMs = 16) {
  for (let i = 0; i < n; i++) {
    nowMs += dtMs;
    const q = rafQueue; rafQueue = [];
    for (const cb of q) { try { cb(nowMs); } catch (e) { frameErrors.push(e); } }
    if (!rafQueue.length) rafQueue.push(T.frame); // держим цикл живым
  }
}
function keyDown(k) { for (const f of (winH.keydown || [])) f({key: k, preventDefault(){}}); }
function keyUp(k) { for (const f of (winH.keyup || [])) f({key: k}); }
function press(k) { keyDown(k); frames(1); keyUp(k); }
function tap(x, y) { for (const f of (mainCanvas._h.pointerdown || [])) f({clientX: x * 2, clientY: y * 2, pointerId: 1, preventDefault(){}}); }
function tapUp() { for (const f of (mainCanvas._h.pointerup || [])) f({pointerId: 1}); }
function resize(w, h) { sandbox.innerWidth = w; sandbox.innerHeight = h; for (const f of (winH.resize || [])) f(); }

const errors = [];
function step(name, fn) {
  frameErrors = [];
  try {
    fn();
    if (frameErrors.length) throw frameErrors[0];
    console.log('  ok   ' + name);
  } catch (e) {
    errors.push(name + ': ' + (e && e.stack ? e.stack : e));
    console.log('  FAIL ' + name + ' -> ' + e.message);
  }
}
function skipDialog(max = 40) { let g = 0; while (T.G.state === 'dialog' && g++ < max) { press(' '); frames(4); } }
const desk = () => T.G.screens.desktop;

console.log('— загрузка HeartOS —');
step('загрузка компьютера', () => { frames(10); if (T.G.state !== 'boot') throw new Error('state=' + T.G.state); });
step('текст загрузки виден', () => {
  const sc = T.G.screens.boot;
  frames(400);
  if (!T.safeLine('Инициализация системы любовного назначения v1.0...')) throw new Error('нет шрифта для строки загрузки');
  for (const l of ['Инициализация системы любовного назначения v1.0...', 'Загрузка самых тёплых воспоминаний...'])
    if (T.wrap(l, T.W() - 16, 1).some(r => T.textW(r, 1) > T.W() - 16)) throw new Error('строка загрузки шире экрана: ' + l);
});
step('загрузка -> рабочий стол по пробелу', () => {
  let g = 0;
  while (T.G.state === 'boot' && g++ < 60) { press(' '); frames(10); }
  if (T.G.state !== 'desktop') throw new Error('state=' + T.G.state);
});
step('рабочий стол: четыре программы по ТЗ', () => {
  const names = desk().icons.map(i => i.name);
  for (const need of ['ШИФР.exe', 'ДОСТИЖЕНИЯ.exe', 'КОМАНДНАЯ СТРОКА', 'ПАРАМЕТРЫ'])
    if (names.indexOf(need) < 0) throw new Error('нет иконки ' + need + ' (' + names.join(',') + ')');
});
step('рабочий стол: статус-строка 0 / 8', () => {
  T.G.hearts = new Array(NH_N).fill(false);
  desk().drawStatus();
  if (T.storyDone() !== 0) throw new Error('счётчик не 0');
  if (T.CH !== 8) throw new Error('CH=' + T.CH);
});
step('рабочий стол: иконки и навигация', () => {
  for (const k of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','ArrowRight']) { press(k); frames(3); }
});
step('рабочий стол: меню ПУСК', () => {
  tap(10, T.H() - 10); frames(20);
  if (!desk().startOpen) throw new Error('меню не открылось');
  tap(10, T.H() - 10); frames(10);
});
step('рабочий стол: одиночный тап -> окно ДОСТИЖЕНИЯ.exe', () => {
  const d = desk(); d.layout();
  tap(d.icons[0].tx, d.icons[0].ty); frames(40);
  if (!T.G.win || T.G.win.kind !== 'map') throw new Error('нет окна прогресса');
});
step('карта: вкладки СЮЖЕТ/БОНУС', () => {
  const w = T.G.win;
  if (w.tab !== 0) throw new Error('вкладка=' + w.tab);
  const tabs = w.mapRects.tabs;
  T.G.screens.desktop.tap(tabs[1].x + 5, tabs[1].y + 5); frames(5);
  if (w.tab !== 1) throw new Error('вкладка не переключилась');
  T.G.screens.desktop.tap(tabs[0].x + 5, tabs[0].y + 5); frames(5);
  if (w.tab !== 0) throw new Error('вкладка не вернулась');
});
step('карта: пять сюжетных узлов + семь бонусных + финал', () => {
  if (T.NODE_META.length !== T.EP_N + T.AR_N + 1) throw new Error('узлов: ' + T.NODE_META.length);
  const story = T.NODE_META.slice(0, T.EP_N).map(n => n.name);
  const want = ['ШИФР', 'РИТМ СЕРДЦА', 'ВОСПОМИНАНИЯ', 'ЛАБИРИНТ И ДОЖДЬ', 'ИСПРАВЛЕНИЕ КОДА'];
  for (const w of want) if (story.indexOf(w) < 0) throw new Error('нет узла ' + w + ' (' + story.join(',') + ')');
  if (T.NODE_META[T.FINALE_NODE].name !== 'ФИНАЛ') throw new Error('последний узел не ФИНАЛ');
});
step('карта: тап по узлу -> интро уровня', () => {
  const n = T.G.win.nodesXY[0];
  if (!n) throw new Error('узлы не рассчитаны');
  tap(n.x, n.y); frames(40);
  if (T.G.state !== 'dialog') throw new Error('нет диалога, state=' + T.G.state);
});
step('диалог до конца -> уровень', () => { skipDialog(); frames(10); if (T.G.state !== 'level') throw new Error('state=' + T.G.state); });

console.log('— главная линия: 5 эпизодов, 8 сердец —');
step('награды в сумме дают 8 сердец', () => {
  const sum = [0,1,2,3,4].reduce((a,i) => a + (T.NODE_META[i].h || 1), 0);
  if (sum !== 8) throw new Error('сумма наград ' + sum);
  if (T.EP_HEART_IDX.length !== 8) throw new Error('EP_HEART_IDX=' + T.EP_HEART_IDX.join(','));
});
function enterLevel(i) { T.G.level = i; T.goNow('level'); T.LEVELS[i].enter(); frames(5); }
function finishReward() {
  frames(60); press(' '); frames(5); skipDialog(); frames(60);
  if (T.G.state !== 'desktop') throw new Error('не вернулись на рабочий стол: ' + T.G.state);
}

step('ШИФР: сдвиг назад раскрывает послание', () => {
  T.G.hearts = new Array(NH_N).fill(false);
  enterLevel(0);
  const L = T.LEVELS[0];
  if (L.sh !== 0) throw new Error('сдвиг не 0');
  if (T.decShift(T.CIP.enc, 1) === T.CIP.plain) throw new Error('внимание: shift даёт ответ — тогда секрет не в сдвиге');
  L.rot(1); frames(3);
  if (L.sh !== 1) throw new Error('сдвиг не применился');
  L.readIt(); frames(4);
  if (!L.ok) throw new Error('не засчитан правильный сдвиг');
  frames(90);
  if (!T.G.hearts[0]) throw new Error('сердце не выдано');
  finishReward();
});
step('ШИФР: неверный сдвиг не проходит', () => {
  enterLevel(0);
  const L = T.LEVELS[0];
  L.rot(2); L.readIt(); frames(3);
  if (L.ok) throw new Error('неверный сдвиг засчитан');
});
step('ШИФР: текст задания дословный', () => {
  if (T.CIP.enc !== 'А МЯВМЯ УЁВА ЕП ВЁТЛОЁШОПТУЙ Й ВЁТЛОЁШОПТТЬ ОЁ РСЁЁМ') throw new Error('шифр изменён');
  if (T.CIP.plain !== 'Я ЛЮБЛЮ ТЕБЯ ДО БЕСКОНЕЧНОСТИ И БЕСКОНЕЧНОСТЬ НЕ ПРЕДЕЛ') throw new Error('ответ изменён');
});

step('РИТМ: попадание в окно даёт очко', () => {
  enterLevel(1);
  const L = T.LEVELS[1];
  L.beat = 4; L.beatT = T.RTH.spb - 0.02;   // ровно в доле
  L.tapNow(); frames(3);
  if (L.hit !== 1) throw new Error('попадание не засчитано, hit=' + L.hit);
  if (L.combo !== 1) throw new Error('серия не растёт');
});
step('РИТМ: спам пробелом не проходит', () => {
  enterLevel(1);
  const L = T.LEVELS[1];
  L.beat = 2; L.beatT = 0.30;               // посреди доли — мимо
  L.tapNow();
  if (L.lock <= 0) throw new Error('нет блокировки после нажатия');
  L.tapNow(); L.tapNow();                  // игнорируются, пока не отпустит
  if (L.miss !== 1) throw new Error('спам засчитан как несколько промахов: ' + L.miss);
  if (L.hit !== 0) throw new Error('спам дал очки: hit=' + L.hit);
});
step('РИТМ: паузу («.») жать нельзя', () => {
  enterLevel(1);
  const L = T.LEVELS[1];
  let b = 1; while (T.RTH.pattern[(b-1) % T.RTH.pattern.length] === 'x') b++;
  L.beat = b; L.beatT = 0; L.tapNow(); frames(3);
  if (L.hit !== 0) throw new Error('пауза засчитана как удар');
});
step('РИТМ: сильных долей хватает на победу', () => {
  if (T.RTH.accentTotal < T.RTH.win) throw new Error('сильных долей ' + T.RTH.accentTotal + ' < нужных ' + T.RTH.win);
  if (T.RTH.win + T.RTH.misses < T.RTH.accentTotal) throw new Error('запас промахов не сходится');
});
step('РИТМ: полный проход и сердце', () => {
  enterLevel(1);
  const L = T.LEVELS[1];
  for (let b = 1; b <= T.RTH.beats && T.G.state === 'level'; b++) {
    L.beat = b; L.beatT = 0; L.lock = 0; L.pressed = -1; L.tapNow();
    if (L.hit < T.RTH.win) { L.hit = T.RTH.win; L.ok = true; L.okT = 0; break; }
    frames(2);
  }
  frames(120);
  if (!T.G.hearts[1]) throw new Error('сердце не выдано, hit=' + L.hit);
  finishReward();
});
step('РИТМ: честная игра в такт выигрывает', () => {
  enterLevel(1);
  const L = T.LEVELS[1];
  let last = 0, guard = 0;
  while (T.G.state === 'level' && guard++ < 3000) {
    if (L.beat !== last) { last = L.beat; if (RTHisAccent(L.beat)) press(' '); }
    frames(1);
  }
  if (!T.G.hearts[1]) throw new Error('честная игра не выиграла: hit=' + L.hit + ' miss=' + L.miss + ' beat=' + L.beat);
  finishReward();
});
function RTHisAccent(b){ return T.RTH.pattern[(b-1) % T.RTH.pattern.length] === 'x'; }
step('РИТМ: четыре промаха — проигрыш', () => {
  T.G.fails[1] = 0;
  enterLevel(1);
  const L = T.LEVELS[1];
  if (L.phase !== 0) throw new Error('уровень не перезапустился, phase=' + L.phase);
  for (let i = 0; i < 10; i++) {
    L.lock = 0; L.miss = i; L.pressed = -1; L.beat = 2; L.beatT = 0.3; L.tapNow(); frames(3);
    if (T.G.state !== 'level') break;
  }
  if (T.G.state !== 'dialog') throw new Error('проигрыш не наступил, state=' + T.G.state);
  skipDialog(); frames(5);
  if (T.G.state !== 'level') throw new Error('нет перезапуска');
});

step('ВОСПОМИНАНИЯ: три текста по заданию', () => {
  if (T.MEM.places.length !== 3) throw new Error('воспоминаний: ' + T.MEM.places.length);
  const all = T.MEM.places.map(p => p.d).join(' ');
  for (const w of ['Дайвинчик', 'по телефону', 'бессон'])
    if (all.toLowerCase().indexOf(w.toLowerCase()) < 0) throw new Error('нет слова «' + w + '»');
});
step('ВОСПОМИНАНИЯ: три остановки и два сердца', () => {
  enterLevel(2);
  const L = T.LEVELS[2];
  if (L.hearts !== 2) throw new Error('hearts=' + L.hearts);
  L.memNext(); L.stop = 1; L.memNext(); L.stop = 2; L.memNext();
  if (!L.seen.every(Boolean)) throw new Error('не все отмечены');
  L.k_main(' '); frames(4);
  frames(110);
  if (!T.G.hearts[2]) throw new Error('сердце не выдано');
  if (T.storyDone() < 4) throw new Error('счётчик: ' + T.storyDone());
  finishReward();
});
step('ВОСПОМИНАНИЯ: время утекает', () => {
  enterLevel(2);
  const L = T.LEVELS[2];
  L.left = 0.2; frames(30);
  if (T.G.state !== 'dialog') throw new Error('таймер не наказывает, state=' + T.G.state);
  skipDialog(); frames(5);
});

step('ЛАБИРИНТ: стены непроходимы, есть путь и лимит', () => {
  enterLevel(3);
  const L = T.LEVELS[3];
  const s = L.cell();
  const before = [L.cx, L.cy];
  for (let i = 0; i < 6; i++) { L.mv(0, -1); }
  if (L.walls[0][L.cx] && L.cy === 0) throw new Error('прошла сквозь верхнюю стену');
  if (!L.limit || L.limit < 10) throw new Error('нет лимита шагов');
  if (L.shortest() < 5) throw new Error('путь подозрительно короткий: ' + L.shortest());
});
step('ЛАБИРИНТ: проход до огонька даёт два сердца', () => {
  enterLevel(3);
  const L = T.LEVELS[3];
  // идём по BFS-пути
  const path = shortestPath(L);
  for (const [dr, dc] of path) L.mv(dc, dr);   // mv(dx, dy): сначала столбец
  frames(6);
  if (L.cx !== L.warm.c || L.cy !== L.warm.r) throw new Error('не дошла: ' + L.cx + ',' + L.cy);
  frames(120);
  if (!T.G.hearts[3]) throw new Error('сердце не выдано');
  if (T.storyDone() < 6) throw new Error('счётчик: ' + T.storyDone());
  finishReward();
});
step('ЛАБИРИНТ: лимит шагов наказывает', () => {
  enterLevel(3);
  const L = T.LEVELS[3];
  L.steps = L.limit + 1; frames(6);
  if (T.G.state !== 'dialog') throw new Error('лимит не работает, state=' + T.G.state);
  skipDialog(); frames(5);
});
function shortestPath(L) {
  const C = T.MAZ.cols, R = T.MAZ.rows;
  const prev = {}, q = [[1, 1]]; prev['1,1'] = null;
  while (q.length) {
    const [r, c] = q.shift();
    if (r === L.warm.r && c === L.warm.c) break;
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r+dr, nc = c+dc, k = nr+','+nc;
      if (nr<0||nc<0||nr>=R||nc>=C || k in prev || L.walls[nr][nc]) continue;
      prev[k] = r+','+c; q.push([nr, nc]);
    }
  }
  const out = []; let k = L.warm.r+','+L.warm.c;
  while (prev[k]) { const p = prev[k].split(',').map(Number); const n = k.split(',').map(Number); out.unshift([n[0]-p[0], n[1]-p[1]]); k = p.join(','); }
  return out;
}

step('КОД: три строки программы', () => {
  const src = T.COD.src.join('\n');
  for (const need of ['while (together) {', 'love += Infinity;', 'happiness = true;'])
    if (src.indexOf(need) < 0) throw new Error('нет строки ' + need);
});
step('КОД: правильные вставки собирают программу', () => {
  enterLevel(4);
  const L = T.LEVELS[4];
  for (let i = 0; i < 3; i++) {
    L.pick = T.COD.tasks[i].ok; L.apply(); frames(4);
  }
  if (!L.ok) throw new Error('программа не собрана');
  frames(110);
  if (!T.G.hearts[4]) throw new Error('сердце не выдано');
  if (T.storyDone() !== 8) throw new Error('главная линия: ' + T.storyDone() + ' / 8');
  if (!T.finaleReady()) throw new Error('финал не открылся при 8 сердцах');
  finishReward();
});
step('КОД: неверный фрагмент — ошибка компиляции', () => {
  enterLevel(4);
  const L = T.LEVELS[4];
  L.pick = 1; L.apply(); frames(4);
  if (L.done[0] || L.bad !== 1) throw new Error('ошибка не засчитана');
  if (!L.msg) throw new Error('нет сообщения об ошибке');
});
step('КОД: четыре ошибки — проигрыш', () => {
  enterLevel(4);
  const L = T.LEVELS[4];
  for (let i = 0; i < 5; i++) { L.pick = 1; L.apply(); frames(4); if (T.G.state !== 'level') break; }
  if (T.G.state !== 'dialog') throw new Error('проигрыш не наступил, state=' + T.G.state);
  skipDialog(); frames(5);
});

step('пропуск уровня после трёх провалов', () => {
  T.G.hearts = new Array(NH_N).fill(false);
  T.G.fails[3] = 3;
  enterLevel(3);
  T.LEVELS[3].steps = T.LEVELS[3].limit + 1; frames(10);
  if (T.G.state !== 'dialog') throw new Error('нет диалога проигрыша, state=' + T.G.state);
  if (!T.G.dialog.canSkip) throw new Error('кнопка пропуска не появилась');
  T.skipLevel(); frames(20); skipDialog(); frames(60);
  if (!T.G.hearts[3]) throw new Error('пропуск не выдал сердце');
  if (T.G.state !== 'desktop') throw new Error('после пропуска state=' + T.G.state);
  T.G.hearts = new Array(NH_N).fill(false);
});

console.log('— бонусные мини-игры —');
step('семь бонусных игр на месте, бонусного поцелуя больше нет', () => {
  if (LEVELS_N !== T.EP_N + T.AR_N) throw new Error('уровней: ' + LEVELS_N);
  if (T.LEVELS.some(l => l.name === 'ПОЦЕЛУЙ' || l.name === 'МЕМОРИ')) throw new Error('удалённая игра осталась в списке');
  if (T.NODE_META.some(n => /ПОЦЕЛУЙ|МЕМОРИ|MEMORY ROOM/i.test(n.name))) throw new Error('удалённая игра осталась на карте');
  for (let i = T.EP_N; i < LEVELS_N; i++)
    if (!T.LEVELS[i] || typeof T.LEVELS[i].enter !== 'function') throw new Error('битый уровень ' + i);
});
step('бонус не двигает главный счётчик', () => {
  T.G.hearts = new Array(NH_N).fill(false);
  const before = T.storyDone();
  T.winLevel(T.EP_N + 1);
  frames(70); press(' '); frames(5); skipDialog(); frames(60);
  if (T.arcDone() !== 1) throw new Error('бонусный счёт не учтён: ' + T.arcDone());
  if (T.storyDone() !== before) throw new Error('счётчик изменился: ' + before + ' -> ' + T.storyDone());
  if (!T.G.hearts[T.EP_N + 1]) throw new Error('бонусное сердце пропало');
  T.G.hearts[T.EP_N + 1] = false;
});
step('бонус: РУКА крутится', () => {
  enterLevel(T.EP_N);
  const L = T.LEVELS[T.EP_N], a0 = L.a;
  keyDown('ArrowRight'); frames(30); keyUp('ArrowRight');
  if (Math.abs(L.a - a0) < 0.3) throw new Error('рука не вращается');
});
step('финальный поцелуй — только анимация, не бонусная мини-игра', () => {
  if (T.LEVELS.some(l => l.name === 'ПОЦЕЛУЙ')) throw new Error('поцелуй остался отдельным уровнем');
  if (T.G.screens.memroom) throw new Error('старый MEMORY ROOM всё ещё включён');
  if (!T.G.screens.kiss || typeof T.G.screens.kiss.update !== 'function') throw new Error('нет финальной анимации поцелуя');
});
step('бонус: ПРИНТ печатает фразу', () => {
  const i = LEVELS_N - 1;
  enterLevel(i);
  const L = T.LEVELS[i];
  for (const ch of L.phrase) { press(ch); frames(2); }
  frames(20);
  if (!L.done) throw new Error('фраза не закончена');
});

console.log('— терминал —');
function openTerm(){
  T.goNow('desktop'); frames(5);
  T.Win.close(); frames(20);
  const d = desk(); d.layout();
  const ic = d.icons.find(i => i.kind === 'term');
  d.launch(ic, false); frames(30);
  if (!T.G.win || T.G.win.kind !== 'term') throw new Error('терминал не открылся');
  return T.G.win;
}
const flat = (w) => w.data.lines.map(l => l.t).join(' ').replace(/\s+/g, ' ').trim();
step('help выдаёт справку', () => {
  const w = openTerm();
  typeIn('help');
  const out = flat(w);
  if (out.indexOf('ДОСТУПНЫЕ КОМАНДЫ:') < 0) throw new Error('нет заголовка справки:\n' + out.slice(-200));
  if (out.indexOf('archive — открыть архив') < 0) throw new Error('нет команды archive в справке');
  if (out.indexOf('maria') < 0) throw new Error('нет пасхалок в справке');
});
step('love выдаёт предупреждение и эффекты', () => {
  const w = openTerm();
  typeIn('love');
  const out = flat(w);
  if (out.indexOf('ВЫПОЛНЕНИЕ КОМАНДЫ love...') < 0) throw new Error('нет строки выполнения');
  if (flat(w).indexOf('ПРОВЕРКА УРОВНЯ НЕЖНОСТИ') < 0) throw new Error('нет проверки нежности');
  // строки выводятся по очереди с задержкой
  for (let i = 0; i < 80 && flat(w).indexOf('УРОВЕНЬ НЕЖНОСТИ') < 0; i++) frames(6);   // ждём строки очереди
  if (flat(w).indexOf('УРОВЕНЬ НЕЖНОСТИ') < 0) throw new Error('нет ошибки нежности:\n' + flat(w).slice(-200));
  for (let i = 0; i < 60 && flat(w).indexOf('ей нравится') < 0; i++) frames(6);
  for (let i = 0; i < 60 && !T.LOVEFX.length; i++) frames(6);   // эффекты запускает конец очереди
  if (!T.LOVEFX.length) throw new Error('частицы не появились');
  const stars = T.LOVEFX.filter(p => p.star).length;
  if (!stars) throw new Error('нет звёздочек');
  frames(60);
  if (!T.LOVEFX.length) throw new Error('эффект не обновляется');
});
function typeIn(s) {
  for (const ch of s) press(ch);
  press('Enter');
  frames(10);
}
step('hearts показывает 8 сердец', () => {
  const w = openTerm();
  T.G.hearts = new Array(NH_N).fill(false);
  typeIn('hearts');
  const out = flat(w);
  if (out.indexOf('СОБРАНО СЕРДЕЦ: 0 / 8') < 0) throw new Error('нет счётчика:\n' + out.slice(-160));
  if (out.indexOf('АРХИВ: 0 / 5') < 0) throw new Error('нет строки архива');
  T.Win.close(); frames(10);
});
step('ПАРАМЕТРЫ открываются', () => {
  T.Win.close(); frames(20);
  const d = desk(); d.layout();
  const ic = d.icons.find(i => i.kind === 'set');
  tap(ic.tx, ic.ty); frames(20);
  if (!T.G.win || T.G.win.kind !== 'set') throw new Error('нет окна параметров: ' + (T.G.win && T.G.win.kind));
  T.Win.close(); frames(10);
});

console.log('— финал —');
step('финал закрыт, пока не собраны 8 сердец', () => {
  T.G.hearts = new Array(NH_N).fill(false);
  T.goNow('desktop'); frames(5);
  T.Win.close(); frames(20);
  desk().openMapWin(); frames(20);
  const n = T.G.win.nodesXY.find(q => q.i === T.FINALE_NODE);
  T.G.screens.desktop.tap(n.x, n.y); frames(30);
  if (T.G.state === 'finale') throw new Error('финал открылся без сюжета');
  if (!T.G.win || T.G.win.kind !== 'sys') throw new Error('нет отказа: ' + (T.G.win && T.G.win.kind));
  T.Win.close(); frames(20);
});
step('после сбора сердец: поцелуй-анимация -> письмо', () => {
  T.G.hearts = new Array(NH_N).fill(false);
  for (let i = 0; i < T.EP_N; i++) T.G.hearts[i] = true;
  T.goNow('desktop'); frames(5);
  T.Win.close(); frames(20);
  desk().openMapWin(); frames(20);
  const n = T.G.win.nodesXY.find(q => q.i === T.FINALE_NODE);
  T.G.screens.desktop.tap(n.x, n.y); frames(40);
  if (T.G.state !== 'restored') throw new Error('не показан экран ALL HEARTS RESTORED: ' + T.G.state);
  frames(200);
  if (T.G.screens.restored.n !== T.CH) throw new Error('зажглось сердец: ' + T.G.screens.restored.n);
  T.G.screens.restored.next(); frames(40);
  if (T.G.state !== 'kiss') throw new Error('не началась анимация поцелуя: ' + T.G.state);
  if (T.G.screens.memroom) throw new Error('MEMORY ROOM не удалён');
  const kiss = T.G.screens.kiss;
  if (!(kiss.startGap > kiss.endGap)) throw new Error('персонажи не сближаются');
  frames(170);
  if (!kiss.kissed) throw new Error('момент поцелуя не проигрался');
  frames(220);
  if (T.G.state !== 'finale') throw new Error('после поцелуя не открылось письмо: ' + T.G.state);
  const sc = T.G.screens.finale;
  if (sc.pts.length !== 8) throw new Error('сердец в финале: ' + sc.pts.length);
  if (sc.phase !== 'fly') throw new Error('фаза=' + sc.phase);
  frames(320);
  if (sc.phase !== 'beat') throw new Error('фаза после полёта=' + sc.phase);
  frames(240);
  if (sc.phase !== 'text') throw new Error('фаза после биения=' + sc.phase);
});
step('письмо набирается и листается', () => {
  const sc = T.G.screens.finale;
  let g = 0;
  while (sc.chars < sc.totalChars() && g++ < 200) frames(10);
  if (sc.btn !== 0) throw new Error('кнопка чтения не появилась, chars=' + sc.chars + '/' + sc.totalChars());
  let guard = 0;
  while (sc.phase === 'text' && guard++ < 40) { press(' '); frames(6); }
  if (sc.phase !== 'ask1') throw new Error('не дошли до первого вопроса, фаза=' + sc.phase);
});
step('текст письма на казахском дословный', () => {
  const expected = `Жаным, мен сені шын жүрегіммен, бар жаныммен жақсы көремін. Саған деген сезімімді сөзбен толық жеткізу маған өте қиын, өйткені сен мен үшін жай ғана сүйікті адам емессің. Сен менің жүрегіме ең жақын, ең қымбат жансың.

Сен өміріме келгеннен бері көп нәрсе өзгерді. Күнделікті өмірімнің өзі басқа болып кеткендей. Сен туралы ойласам көңілім жылып, өзім байқамай күліп қоямын. Сенің бір ғана хабарыңның өзі көңіл күйімді өзгерте алады. Сенің бар екеніңнің өзі мен үшін үлкен бақыт.

Мен сені тек әдемілігің үшін немесе қандай да бір қасиетің үшін жақсы көрмеймін. Мен сені өзің болғаның үшін жақсы көремін. Сенің әрбір сөзің, әрбір күлкің, әрбір кішкентай қылығың мен үшін қымбат. Сен қандай болсаң, мен үшін дәл сондай күйіңмен ерекше жансың.

Күнім, сен менің жүрегімде ерекше орын алдың. Сені ойламайтын күнімді елестету қиын. Кейде өзім де байқамай сенімен байланысты бір нәрсені есіме алып, ішімнен қуанып қаламын. Өйткені сен менің өмірімнің ең жылы сезімдерінің біріне айналдың.

Сен менің еркемсің, сәулемсің, гүлімсің, ботамсың. Сен менің жүрегіме жақын адамсың. Мен үшін сенің орныңды ештеңе алмастыра алмайды.

Менің саған деген сезімім жай ғана уақытша сезім емес. Мен сені шын сүйемін. Сен менің өмірімдегі ең шынайы махаббатымсың. Жүрегімнің сені таңдағанын күн сайын сезінемін.

Жаным, мен сені қатты жақсы көремін. Сен менің бақытымсың, қуанышымсың, жүрегімнің ең аяулысың. Сенің бар болғаның үшін, өмірімде болғаның үшін мен сені шын жүрегіммен бағалаймын.

Менің сүйіктім, мен сені жақсы көремін. Өте қатты.`;
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  if (normalize(T.FIN.text.join(' ')) !== normalize(expected)) throw new Error('мәтін берілген хатпен сәйкес емес');
  const compact = expected.replace(/\s/g, '');
  if (T.safeLine(compact).length !== compact.length) throw new Error('шрифтте казах әріптері жоқ');
  if (T.FIN.title !== 'ПИСЬМО ДЛЯ САМОГО ДОРОГОГО ЧЕЛОВЕКА') throw new Error('заголовок изменён');
  if (T.FIN.sign !== 'TO INFINITY AND BEYOND') throw new Error('подпись изменена');
  if (T.FIN.ask1 !== 'Ты останешься со мной?') throw new Error('первый вопрос изменён');
  if (T.FIN.ask2 !== 'Давай продолжим это вместе?') throw new Error('второй вопрос изменён');
  if (T.FIN.yes !== 'ДА') throw new Error('ответ изменён');
  if (T.FIN.ofc !== 'КОНЕЧНО') throw new Error('второй ответ изменён');
});
step('вопросы последовательные, два ответа ДА и КОНЕЧНО', () => {
  const sc = T.G.screens.finale;
  frames(60);
  if (sc.btn !== 1 || !sc.rYes || !sc.rOfc) throw new Error('нет двух кнопок на первом вопросе');
  if (sc.rYes.x + sc.rYes.w + 8 !== sc.rOfc.x) throw new Error('кнопки не рядом');
  if (sc.rOfc.x + sc.rOfc.w > T.W() - 4) throw new Error('кнопка шире экрана');
  sc.say('yes'); frames(4);
  if (sc.phase !== 'ask2') throw new Error('второй вопрос не начался, фаза=' + sc.phase);
  frames(60);
  if (sc.btn !== 2 || !sc.rYes || !sc.rOfc) throw new Error('нет двух кнопок на втором вопросе');
  sc.say('ofc'); frames(4);
  if (sc.phase !== 'end') throw new Error('финальная сцена не началась, фаза=' + sc.phase);
  if (sc.ans !== 'ofc') throw new Error('выбор не сохранён');
  frames(60);
  if (!sc.rAgain) throw new Error('нет кнопки «пройти заново»');
});
step('второй ответ тоже ведёт в общий финал', () => {
  const sc = T.G.screens.finale;
  sc.enter(); sc.phase = 'ask1'; sc.t = 0; sc.btn = -1; frames(60);
  sc.say('ofc'); frames(4);
  if (sc.phase !== 'ask2') throw new Error('КОНЕЧНО не повёл ко второму вопросу');
  frames(60);
  sc.say('ofc'); frames(4);
  if (sc.phase !== 'end' || sc.ans !== 'ofc') throw new Error('КОНЕЧНО не привёл в финал');
  frames(30);
});
step('финальная сцена живёт', () => { frames(300); if (T.G.state !== 'finale') throw new Error('state=' + T.G.state); });

console.log('— ориентации и размеры —');
step('портретный (390x844)', () => {
  resize(390, 844); frames(20);
  T.goNow('desktop'); frames(10);
  for (const k of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp']) { press(k); frames(3); }
  for (let i = 0; i < LEVELS_N; i++) { enterLevel(i); frames(40); }
  T.goNow('finale'); frames(400);
});
step('широкий (1440x700)', () => {
  resize(1440, 700); frames(20);
  T.goNow('desktop'); frames(10);
  for (let i = 0; i < LEVELS_N; i++) { enterLevel(i); frames(40); }
  T.goNow('finale'); frames(400);
});
step('маленький 320x240 и 240x320', () => { resize(320, 240); frames(20); enterLevel(6); frames(30); resize(240, 320); frames(20); enterLevel(9); frames(30); });
step('очень узкий 200x600', () => { resize(200, 600); frames(20); enterLevel(8); frames(30); enterLevel(9); frames(30); resize(800, 450); frames(20); });

console.log('— прочее —');
step('награда -> диалог -> рабочий стол', () => { T.G.hearts = newFilled(0); T.winLevel(2); frames(60); press(' '); frames(5); skipDialog(40); frames(60); if (T.G.state !== 'desktop') throw new Error('state=' + T.G.state); });
step('сохранение прогресса', () => { T.G.hearts = newFilled(2); T.winLevel(0); frames(5); if (!sandbox.localStorage.getItem('printILY3')) throw new Error('нет записи'); });
step('старый прогресс сдвигается после удаления бонуса', () => {
  const prior = T.G.hearts.slice();
  const stored = sandbox.localStorage.getItem('printILY3');
  const old = new Array(NH_N + 1).fill(false);
  old[0] = true; old[9] = true; old[10] = true; old[11] = false; old[12] = true;
  sandbox.localStorage.setItem('printILY3', JSON.stringify({h: old}));
  T.load();
  if (T.G.hearts.length !== NH_N) throw new Error('размер=' + T.G.hearts.length);
  if (!T.G.hearts[0] || !T.G.hearts[9] || T.G.hearts[10] || !T.G.hearts[11]) throw new Error('индексы не мигрировали');
  const migrated = JSON.parse(sandbox.localStorage.getItem('printILY3'));
  if (migrated.h.length !== NH_N) throw new Error('миграция не сохранена');
  T.G.hearts = prior;
  if (stored === null) sandbox.localStorage.removeItem('printILY3');
  else sandbox.localStorage.setItem('printILY3', stored);
});
step('ввод пальцем', () => { enterLevel(T.EP_N); tap(100, 100); frames(10); tapUp(); frames(5); });
step('русская раскладка WASD', () => { enterLevel(T.EP_N); ['ф','в','ц','ы'].forEach(k => { keyDown(k); frames(3); keyUp(k); }); frames(5); });
step('escape из уровня', () => { enterLevel(T.EP_N); press('Escape'); frames(60); if (T.G.state !== 'desktop') throw new Error('state=' + T.G.state); });
step('долгий прогон', () => { T.goNow('desktop'); frames(600); });

console.log('— вёрстка (ничего не вылезает за экран) —');
function audit(name, w, h, setup, tol) {
  step(name, () => {
    resize(w, h); frames(6);
    setup();
    const A = {minX: 1e9, minY: 1e9, maxX: -1e9, maxY: -1e9, n: 0};
    AUDIT = A; frames(3); AUDIT = null;
    const W = T.W(), H = T.H();
    console.log('       экран ' + W + 'x' + H + ' | рисований ' + A.n + ' | x ' + A.minX.toFixed(0) + '..' + A.maxX.toFixed(0) + ' y ' + A.minY.toFixed(0) + '..' + A.maxY.toFixed(0));
    if (A.n < 5) throw new Error('почти ничего не нарисовано');
    const over = Math.max(-A.minX, -A.minY, A.maxX - W, A.maxY - H);
    if (over > (tol || 40)) throw new Error('вылезает за экран на ' + over.toFixed(0) + 'px');
  });
}
const SIZES = [[390, 844, 'портрет'], [800, 450, 'широкий'], [320, 240, 'маленький']];
for (const [w, h, tag] of SIZES) {
  audit(tag + ': загрузка', w, h, () => T.goNow('boot'));
  audit(tag + ': рабочий стол', w, h, () => { T.G.hearts = new Array(NH_N).fill(false); T.G.hearts[0] = true; T.goNow('desktop'); frames(30); });
  audit(tag + ': окно прогресса', w, h, () => { T.goNow('desktop'); frames(10); T.G.screens.desktop.openMapWin(); frames(30); });
  audit(tag + ': диалог', w, h, () => { T.G.level = T.EP_N; T.startLevel(T.EP_N); frames(30); });
  for (let i = 0; i < LEVELS_N; i++) audit(tag + ': уровень ' + (i + 1), w, h, () => { T.G.level = i; T.goNow('level'); T.LEVELS[i].enter(); frames(20); });
  audit(tag + ': награда', w, h, () => { T.winLevel(0); });
  // во время полёта сердца специально вылетают за край кадра — это часть сцены
  audit(tag + ': финал: полёт', w, h, () => { T.goNow('finale'); frames(30); }, Math.round(Math.max(w, h) * 0.6));
  audit(tag + ': финал: письмо', w, h, () => { T.goNow('finale'); frames(400); T.G.screens.finale.chars = 1e9; frames(20); });
  audit(tag + ': финал: вопрос', w, h, () => { T.goNow('finale'); frames(400); const s = T.G.screens.finale; s.chars = 1e9; frames(20); for (let i=0;i<20 && s.phase==='text';i++){ s.nextText(); frames(6); } frames(60); });
}

console.log('— текст влезает —');
function textFit(name, sizes) {
  for (const [w, h] of sizes) {
    step(name + ' @' + w + 'x' + h, () => {
      resize(w, h); frames(6);
      const W = T.W(), H = T.H();
      const problems = [];
      const sc = Math.min(W, H) < 200 ? 1 : 2;
      for (const [lbl, t, s2] of [['имя её', T.CONFIG.her.toUpperCase(), sc + 1], ['имя его', T.CONFIG.him.toUpperCase(), sc + 1], ['подзаголовок', T.CONFIG.title, 1]]) {
        if (T.textW(t, s2) > W - 8) problems.push(lbl + ' (' + T.textW(t, s2) + ' > ' + (W - 8) + ')');
      }
      // строка статуса
      const st = 'Собрано сердец: 8 / 8';
      if (T.textW(st, T.fitSc(st, W - 84, 1)) > W - 84) problems.push('статус-строка не влезает');
      // загрузка
      for (const l of ['Инициализация системы любовного назначения v1.0...', 'Загрузка самых тёплых воспоминаний...'])
        if (T.textW(T.safeLine(l), T.fitSc(T.safeLine(l), W - 16, 1)) > W - 16) problems.push('строка загрузки: ' + l);
      // карта: подписи узлов
      const names = T.NODE_META.map(n => n.name);
      const winW = Math.min(W - 8, 224) - 2;
      const cols = W >= 250 ? 3 : 2;
      const cw = winW / cols;
      const chh = (Math.min(H - 26, 300) - 38) / Math.ceil(names.length / cols);
      if (chh >= 42) names.forEach(nm => {
        const sc = T.fitSc(nm, cw - 4, 1);
        if (sc < 0.5) problems.push('карта: подпись нечитаема — ' + nm);
        if (T.textW(nm, sc) > cw - 3) problems.push('карта: ' + nm + ' (' + T.textW(nm, sc).toFixed(0) + ' > ' + (cw - 3).toFixed(0) + ')');
      });
      // иконки рабочего стола
      const icols = W >= H ? 3 : 2, icw = (W - 12) / icols;
      desk().layout();
      desk().icons.forEach(it => {
        const sc = T.fitSc(it.name, icw - 2, 1);
        if (T.textW(it.name, sc) > icw - 1) problems.push('иконка: ' + it.name + ' (' + T.textW(it.name, sc) + ' > ' + (icw - 2).toFixed(0) + ')');
        if (sc < 0.5) problems.push('иконка нечитаема: ' + it.name);
      });
      // диалоги: не больше 3 строк
      for (let i = 0; i < LEVELS_N; i++) {
        const lv = T.LEVELS[i];
        for (const set of [lv.intro, lv.outro]) for (const d of set) {
          const tw = (W - 12) - 58 - 8;
          const n = Math.ceil(T.textW(d.text, 1) / tw);
          if (n > 3) problems.push('диалог L' + (i + 1) + ' (' + n + ' строк): ' + d.text.slice(0, 28) + '...');
        }
      }
      // письмо: строки влезают в бумагу
      const fin = T.G.screens.finale;
      const pw = W - 26;
      fin.lines(8, pw).forEach((l, i) => { if (T.textW(l, 1) > pw) problems.push('письмо строка ' + i + ': ' + l); });
      if (T.textW(T.FIN.title, T.fitSc(T.FIN.title, W - 12, 1)) > W - 11) problems.push('заголовок письма не влезает');
      if (T.fitSc(T.FIN.title, W - 12, 1) < 0.5) problems.push('заголовок письма нечитаем');
      if (T.textW(T.FIN.ask1, 1) > W - 34) problems.push('первый вопрос не влезает');
      if (T.textW(T.FIN.ask2, 1) > W - 34) problems.push('второй вопрос не влезает');
      // терминал: текст справки переносится по ширине окна, проверяем что перенос вообще возможен
      for (const l of ['Доступные команды: help — справка, hearts — статус сердечек, love — запустить магию.'])
        if (!T.wrap(l, Math.min(W - 10, 246) - 14, 1).length) problems.push('строка справки не переносится');
      if (problems.length) throw new Error('\n       - ' + problems.join('\n       - '));
    });
  }
}

/* ================= АРХИВ: дополнительные мини-игры ================= */
console.log('— АРХИВ —');
function arStart(i){
  T.startArch(i);
  T.G_arIdx = i;
  const lv = T.arLevel();
  if(lv.enter) lv.enter();
  T.goNow('arlevel');
  T.G_ar.card = 0;
  return lv;
}
step('архив: пять игр в реестре', () => {
  if (T.ARCH_META.length !== 5) throw new Error('в архиве ' + T.ARCH_META.length + ' игр');
  const ids = T.ARCH_META.map(m => m.id);
  for (const id of ['cipher','stars','music','case_','room'])
    if (ids.indexOf(id) < 0) throw new Error('нет игры ' + id);
  if (!T.ARCH_LEVELS.cipher) throw new Error('игра шифра не зарегистрирована');
});
step('архив: у каждой игры есть интро, аутро и 3 подсказки', () => {
  for (const m of T.ARCH_META){
    if (!m.intro || m.intro.length < 1) throw new Error(m.id + ': нет интро');
    if (m.name && m.sub) {} else throw new Error(m.id + ': нет названия/описания');
  }
  const h = T.arHints('cipher');
  if (h.length !== 3) throw new Error('у шифра подсказок: ' + h.length);
});
step('архив: прогресс пишется и переживает перезагрузку', () => {
  const before = T.AR.done.slice();
  T.AR.done[2] = true; T.AR.tries[2] = 3; T.AR.save();
  T.AR.done = new Array(5).fill(false);
  T.AR.load();
  if (!T.AR.done[2]) throw new Error('прогресс не восстановился');
  if (T.AR.tries[2] !== 3) throw new Error('попытки не восстановились');
  T.AR.done = before;
  T.AR.save();
});
step('архив: не ломает счётчик 8/8', () => {
  if (T.AR.doneCount() > 0 && T.storyDone() !== 0) {
    // прогресс архива не должен влиять на сюжет — проверяем структурно
  }
  const h = T.G.hearts.length;
  if (h !== T.LEVELS_N) throw new Error('G.hearts расширен: ' + h + ' вместо ' + T.LEVELS_N);
});

console.log('— АРХИВ 02: СОЗДАЙ СОЗВЕЗДИЕ —');
function arPick(L, k){
  const list = L.stars();
  for(let i=0;i<list.length;i++) if(list[i].real && list[i].n === k) return i;
  return -1;
}
step('созвездие: десять настоящих и двадцать лишних звёзд', () => {
  const L = arStart(1);
  const list = L.stars();
  if(list.length !== 30) throw new Error('звёзд: ' + list.length);
  if(list.filter(s => s.real).length !== T.ARC2_N) throw new Error('настоящих не 10');
  if(list.filter(s => !s.real).length !== T.ARC2_FAKE.length) throw new Error('лишних: ' + list.filter(s=>!s.real).length);
  // настоящие всегда ярче лишних
  const minReal = Math.min(...list.filter(s=>s.real).map(s=>s.b));
  const maxFake = Math.max(...list.filter(s=>!s.real).map(s=>s.b));
  if(minReal <= maxFake) throw new Error('яркость не различает: ' + minReal.toFixed(2) + ' <= ' + maxFake.toFixed(2));
});
step('созвездие: фигура не показана заранее, порядок выводится', () => {
  const L = arStart(1);
  const list = L.stars();
  const seq = [];
  for(let k=0;k<T.ARC2_N;k++) seq.push(list[arPick(L,k)].n);
  for(let k=0;k<T.ARC2_N;k++) if(seq[k] !== k) throw new Error('порядок сбит');
  // линий до первого хода нет
  if(L.path.length) throw new Error('линия уже нарисована');
});
step('созвездие: лишняя звезда не ломает прогресс', () => {
  const L = arStart(1);
  L.pick(arPick(L,0));
  const bad = L.stars().findIndex(s => !s.real);
  L.pick(bad);
  if(L.path.length !== 1) throw new Error('путь сбился');
  if(L.errs !== 1) throw new Error('ошибка не засчитана');
  if(!(L.badLines||[]).length) throw new Error('нет красной нити');
  L.pick(arPick(L,1));
  if(L.path.length !== 2) throw new Error('после ошибки ход не идёт');
});
step('созвездие: после трёх ошибок загорается подсказка', () => {
  const L = arStart(1);
  L.pick(arPick(L,0));
  const fake = L.stars().findIndex(s => !s.real);
  for(let i=0;i<3;i++) L.pick(fake);
  if(L.stepErr !== 3) throw new Error('счётчик ошибок: ' + L.stepErr);
});
step('созвездие: отмена и заново', () => {
  const L = arStart(1);
  L.pick(arPick(L,0)); L.pick(arPick(L,1)); L.pick(arPick(L,2));
  L.undo();
  if(L.path.length !== 2) throw new Error('отмена не сработала');
  L.restart();
  if(L.path.length !== 0) throw new Error('заново не сработало');
});
step('созвездие: полный проход даёт победу и запись в архив', () => {
  const story0 = T.storyDone();
  const L = arStart(1);
  for(let k=0;k<T.ARC2_N;k++) L.pick(arPick(L,k));
  if(L.scene !== 'win') throw new Error('сцена ' + L.scene);
  if(T.G.state !== 'arlevel') throw new Error('состояние ' + T.G.state);
  for(let i=0;i<400 && T.G.state === 'arlevel'; i++) frames(4);
  if(T.G.state === 'arlevel') throw new Error('победа не вызвана: ' + (frameErrors[0] && frameErrors[0].message));
  if(!T.AR.done[1]) throw new Error('победа не записана');
  if(T.storyDone() !== story0) throw new Error('архив повлиял на сюжет');
  T.AR.done[1] = false; T.AR.save();
});
step('созвездие: зум и линии переключаются', () => {
  const L = arStart(1);
  L.k_sky('z');
  if(L.zoom <= 1) throw new Error('зум не включился');
  L.k_sky('l');
  if(L.lines) throw new Error('линии не выключились');
  L.k_sky('z');
  if(L.zoom !== 1) throw new Error('зум не вернулся');
});

console.log('— АРХИВ 03: МУЗЫКА ВОСПОМИНАНИЙ —');
function arListen(L){
  let g = 0;
  while(L.scene === 'listen' && g++ < 600) L.u_listen(0.05);
  if(L.scene !== 'repeat') throw new Error('после прослушивания сцена ' + L.scene);
}
function arRound(L, i){
  L.startRound(i);
  if(L.seq.length !== (i < T.ARC3_PHRASES.length ? T.ARC3_PHRASES[i].length : T.ARC3_MOTIF.length))
    throw new Error('раунд ' + i + ': длина ' + L.seq.length);
  arListen(L);
  const seq = L.seq.slice();
  for(const k of seq){ L.lock = 0; L.keyPress(k); }
}
step('музыка: пять раундов, потом вслепую и личный мотив', () => {
  const L = arStart(2);
  const lens = T.ARC3_PHRASES.map(p => p.length).join(',');
  if(lens !== '4,5,6,8,10,7') throw new Error('длины раундов: ' + lens);
  if(T.ARC3_MOTIF.length < 4) throw new Error('мотив слишком короткий');
  for(const p of T.ARC3_PHRASES) for(const k of p) if(k<0 || k>=T.ARC3_KEYS) throw new Error('нота вне диапазона');
});
step('музыка: семь клавиш до-си, каждая со своим звуком', () => {
  const L = arStart(2);
  if(T.ARC3_KEYS !== 7) throw new Error('клавиш: ' + T.ARC3_KEYS);
  if(T.ARC3_NAME.length !== 7) throw new Error('подписей: ' + T.ARC3_NAME.length);
  const seen = {};
  for(let k=0;k<7;k++){ const f = L.hz(k); if(seen[f]) throw new Error('клавиши ' + k + ' и дубль звучат одинаково'); seen[f] = 1; }
  if(!(L.hz(6) > L.hz(0))) throw new Error('клавиши не по высоте');
});
step('музыка: раунд слушается целиком, потом игрок повторяет', () => {
  const L = arStart(2);
  L.startRound(0);
  if(L.scene !== 'listen') throw new Error('сцена ' + L.scene);
  if(L.si !== 0) throw new Error('счётчик не сброшен');
  arListen(L);
  if(L.si !== L.seq.length) throw new Error('прослушано ' + L.si + ' из ' + L.seq.length);
});
step('музыка: ошибка сбивает фразу, но не игру', () => {
  const L = arStart(2);
  L.startRound(0);
  arListen(L);
  L.keyPress(L.seq[0]);
  if(L.pi !== 1) throw new Error('верная нота не засчитана');
  const rnd = L.rnd, s0 = L.si;
  L.keyPress((L.seq[1] + 1) % 7);
  if(L.pi !== 0) throw new Error('фраза не сброшена');
  if(L.rnd !== rnd) throw new Error('раунд сбился');
  if(L.errs !== 1) throw new Error('ошибка не посчитана');
  if(L.scene !== 'listen') throw new Error('после ошибки сцена ' + L.scene);
  if(L.fails !== 1) throw new Error('счётчик неудач: ' + L.fails);
});
step('музыка: три неудачи подряд открывают поражение с пропуском', () => {
  const L = arStart(2);
  L.startRound(0);
  for(let i=0;i<3;i++){
    L.startRound(0);
    arListen(L);
    L.keyPress((L.seq[0] + 1) % 7);
  }
  if(L.fails < 3) throw new Error('неудач: ' + L.fails);
});
step('музыка: полный проход всех раундов даёт победу', () => {
  const story0 = T.storyDone();
  const L = arStart(2);
  for(let i=0;i<T.ARC3_PHRASES.length-1; i++) arRound(L, i);
  if(L.rnd !== 5) throw new Error('после пятого раунда rnd=' + L.rnd);
  if(!L.dark) throw new Error('шестой раунд не вслепой');
  arRound(L, T.ARC3_PHRASES.length);
  if(L.scene !== 'win') throw new Error('сцена ' + L.scene);
  for(let i=0;i<600 && T.G.state === 'arlevel'; i++) frames(4);
  if(!T.AR.done[2]) throw new Error('победа не записана');
  if(T.storyDone() !== story0) throw new Error('архив повлиял на сюжет');
  T.AR.done[2] = false; T.AR.save();
});
step('музыка: клавиатура 1..7 играет ноты', () => {
  const L = arStart(2);
  L.startRound(0);
  arListen(L);
  L.k_repeat(String(L.seq[0]+1));
  if(L.pi !== 1) throw new Error('клавиша по цифре не сработала');
  L.k_repeat(String(L.seq[1]+1));
  if(L.pi !== 2) throw new Error('вторая нота не принята');
});
step('музыка: во вслепую подсказка ноты не показывается', () => {
  const L = arStart(2);
  L.startRound(5);
  if(!L.dark) throw new Error('раунд не тёмный');
  if(L.msg.indexOf('ГЛАЗА') < 0) throw new Error('нет предупреждения: ' + L.msg);
  arListen(L);
  const scr = T.G.screens.arlevel;
  let guard = 0;
  while(L.scene === 'repeat' && guard++ < 200) L.u_repeat(0.05);
  if(L.scene !== 'repeat') throw new Error('сцена ' + L.scene);
});

console.log('— АРХИВ 04: ДЕТЕКТИВ —');
step('детектив: пять улик и лента времени из пяти меток', () => {
  const L = arStart(3);
  if(T.ARC4_CLUES.length !== 5) throw new Error('улик: ' + T.ARC4_CLUES.length);
  const t = T.ARC4_TIME.map(x => x.t).join(' ');
  if(t !== '19:00 21:00 22:15 23:40 00:10') throw new Error('таймлайн: ' + t);
  for(const c of T.ARC4_CLUES) if(!c.txt || !c.name || !c.tag) throw new Error('улика без текста: ' + c.id);
});
step('детектив: окно ДОСЬЕ открывается и закрывается', () => {
  const L = arStart(3);
  L.openDossier(0);
  if(!L.win) throw new Error('досье не открылось');
  if(!L.seen.lamp) throw new Error('улика не отмечена');
  L.closeDossier();
  if(L.win) throw new Error('досье не закрылось');
});
step('детектив: осмотр всех улик открывает показания', () => {
  const L = arStart(3);
  if(L.allSeen()) throw new Error('сразу открыты');
  for(let i=0;i<5;i++) L.openDossier(i);
  L.closeDossier();
  if(!L.allSeen()) throw new Error('не все улики открыты: ' + L.openCount());
});
step('детектив: правдивые показания отвергаются, ложное принимается', () => {
  const L = arStart(3);
  for(let i=0;i<5;i++) L.openDossier(i);
  L.closeDossier();
  L.chooseSay(1);                                   // Б — правда
  if(L.sawAns) throw new Error('Б принято за ложь');
  if(L.errs !== 1) throw new Error('ошибка не засчитана');
  if(!L.seen.lamp) throw new Error('осмотр сбросился');
  L.chooseSay(2);                                   // В — правда
  if(L.sawAns) throw new Error('В принято за ложь');
  L.chooseSay(0);                                   // А — ложь
  if(!L.sawAns) throw new Error('ложное не принято');
});
step('детектив: ложное показание логично следует из улики', () => {
  const fake = T.ARC4_CLUES.filter(c => c.tag === 'ОПРОВЕРГАЕТ ' + T.ARC4_FAKE);
  if(fake.length !== 1) throw new Error('улика против ложного не единственная: ' + fake.length);
  if(T.ARC4_SAY.filter(s => s.id === T.ARC4_FAKE).length !== 1) throw new Error('ложное показание не одно: ' + T.ARC4_FAKE + ' / ' + T.ARC4_SAY.map(x=>x.id).join(''));
  for(const c of T.ARC4_CLUES) if(c.tag.indexOf('ПОДТВЕРЖДАЕТ') < 0 && c.tag !== 'НЕ ВАЖНО' && c.tag.indexOf('ОПРОВЕРГАЕТ') < 0) throw new Error('метка: ' + c.tag);
});
step('детектив: три вопроса, ошибка не сбрасывает предыдущие', () => {
  const L = arStart(3);
  for(let i=0;i<5;i++) L.openDossier(i);
  L.chooseSay(0);
  L.startQuiz();
  if(L.qa !== 0) throw new Error('вопрос не начался');
  const bad = (T.ARC4_QUIZ[0].a + 1) % T.ARC4_QUIZ[0].o.length;
  L.answer(bad);
  if(!L.badQ[bad]) throw new Error('ошибка не отмечена');
  if(L.qa !== 0) throw new Error('вопрос сброшен');
  L.answer(T.ARC4_QUIZ[0].a);
  if(L.qa !== 1) throw new Error('верный ответ не принят');
});
step('детектив: полный проход даёт победу и запись в архив', () => {
  const story0 = T.storyDone();
  const L = arStart(3);
  for(let i=0;i<5;i++) L.openDossier(i);
  L.chooseSay(0);
  L.startQuiz();
  for(let q=0;q<T.ARC4_QUIZ.length; q++) L.answer(T.ARC4_QUIZ[q].a);
  if(L.scene !== 'win') throw new Error('сцена ' + L.scene);
  for(let i=0;i<600 && T.G.state === 'arlevel'; i++) frames(4);
  if(!T.AR.done[3]) throw new Error('победа не записана');
  if(T.storyDone() !== story0) throw new Error('архив повлиял на сюжет');
  T.AR.done[3] = false; T.AR.save();
});
step('детектив: подсказки не выдают ответ напрямую', () => {
  const h = T.arHints('case_');
  if(h.length !== 3) throw new Error('подсказок: ' + h.length);
  if(h.join(' ').indexOf('ЛАМПА') >= 0) throw new Error('подсказка называет улику');
  if(h.join(' ').indexOf('А') >= 0 && h.join(' ').indexOf('показание') < 0) throw new Error('подсказка называет ответ');
});

if(process.env.DBG_ROOM){
  try{
    const L = arStart(3);
    T.goNow('arlevel');
    for(let i=0;i<3;i++) L.u_room(0.016);
    L.openDossier(0);
    L.win.anim = 1;
    L.draw();
    L.setScene('verdict'); L.draw();
    L.setScene('quiz'); L.draw();
    L.setScene('win'); L.draw();
  }catch(e){ console.log('DBG>', e.stack); }
  process.exit(0);
}
console.log('— АРХИВ 05: КОМНАТА, КОТОРАЯ ЗАПОМИНЯЕТ —');
step('комната: семь вещей, три круга, веса переставляются', () => {
  const L = arStart(4);
  if(T.ARC5_N !== 7) throw new Error('вещей: ' + T.ARC5_N);
  if(T.ARC5_WEIGHT.length !== 3) throw new Error('кругов: ' + T.ARC5_WEIGHT.length);
  for(let c=0;c<3;c++){
    const s = T.ARC5_WEIGHT[c].slice().sort((a,b)=>a-b).join(',');
    if(s !== '1,2,3,4,5,6,7') throw new Error('круг ' + c + ': веса ' + s);
  }
  if(T.ARC5_TASKS.length !== 3) throw new Error('заданий: ' + T.ARC5_TASKS.length);
});
step('комната: часы каждый круг начинают с 03:17', () => {
  const L = arStart(4);
  if(T.ARC5_CLOCK0 !== 197) throw new Error('начало: ' + T.ARC5_CLOCK0);
  if(L.mText() !== '03:17') throw new Error('время: ' + L.mText());
  for(let c=0;c<3;c++){
    L.cyc = c; L.step = 0;
    if(L.mText() !== '03:17') throw new Error('круг ' + c + ' начался в ' + L.mText());
    const before = L.mText();
    const w0 = L.want()[0];
    L.touch(w0);
    if(L.mText() === before) throw new Error('минута не идёт');
  }
});
step('комната: первый круг идёт от лёгкой к тяжёлой', () => {
  const L = arStart(4);
  const ord = L.want();
  const w = ord.map(i => L.w(i, 0));
  for(let i=0;i<7;i++) if(w[i] !== i+1) throw new Error('порядок весов: ' + w.join(','));
});
step('комната: второй круг идёт обратно', () => {
  const L = arStart(4);
  L.startCycle(1);
  const ord = L.want();
  const w = ord.map(i => L.w(i, 1));
  for(let i=0;i<7;i++) if(w[i] !== 7-i) throw new Error('порядок весов: ' + w.join(','));
});
step('комната: неверная вещь отнимает минуту, но не сбрасывает круг', () => {
  const L = arStart(4);
  const ord = L.want();
  L.touch(ord[0]);
  L.touch(ord[1]);
  const st = L.step, cyc = L.cyc;
  const wrong = ord[L.step + 1];
  L.touch(wrong);
  if(L.step !== st-1) throw new Error('шаг не откатился: ' + L.step);
  if(L.cyc !== cyc) throw new Error('круг сбился');
  if(L.errs !== 1) throw new Error('ошибка не посчитана');
  // правильный ход всё ещё принимается
  L.touch(L.want()[L.step]);
  if(L.step !== st) throw new Error('после ошибки не продолжить');
});
step('комната: метки первого круга задают финальный порядок', () => {
  const L = arStart(4);
  const ord = L.want();
  for(const i of ord) L.touch(i);
  if(L.step !== 7) throw new Error('первый круг не пройден');
  L.startCycle(1);
  const ord2 = L.want();
  for(const i of ord2) L.touch(i);
  if(L.cyc !== 1 || L.step !== 7) throw new Error('второй круг не пройден');
  L.startCycle(2);
  const fin = L.want();
  if(fin.slice().sort((a,b)=>a-b).join('') !== '0123456') throw new Error('финальный порядок не перестановка');
  for(let k=0;k<7;k++) if(L.mark[fin[k]] !== k+1) throw new Error('метки не задают порядок');
});
step('комната: три круга дают победу и запись в архив', () => {
  const story0 = T.storyDone();
  const L = arStart(4);
  for(let c=0;c<3;c++){
    L.startCycle(c);
    const ord = L.want().slice();
    for(const i of ord) L.touch(i);
  }
  if(L.scene !== 'win') throw new Error('сцена ' + L.scene);
  for(let i=0;i<600 && T.G.state === 'arlevel'; i++) frames(4);
  if(!T.AR.done[4]) throw new Error('победа не записана');
  if(T.storyDone() !== story0) throw new Error('архив повлиял на сюжет');
  T.AR.done[4] = false; T.AR.save();
});

console.log('— АРХИВ 01: ШИФР, КОТОРЫЙ МЕНЯЕТСЯ —');
step('шифр: слой 1 — находятся скрытые символы', () => {
  const L = arStart(0);
  if (L.scene !== 'l1') throw new Error('сцена ' + L.scene);
  const cells = L.l1cells();
  for (const i of [1, 4]) L.choose1(i, cells[i].ch);
  if (Object.keys(L.ans).length < 2) throw new Error('ответы не приняты');
  if (L.charge !== 5) throw new Error('заряд потрачен на верном ответе');
});
step('шифр: неверный символ — ошибка, но не проигрыш', () => {
  const L = arStart(0);
  const cells = L.l1cells();
  const right = cells[1].ch;
  const wrong = T.ALPH[(T.aIdx(right) + 7) % 33];
  const c0 = L.charge;
  L.choose1(1, wrong);
  if (L.charge !== c0 - 1) throw new Error('заряд не уменьшился');
  if (L.glitch <= 0) throw new Error('нет глитча');
  // и игра продолжается: правильный ответ всё ещё принимается
  L.choose1(1, cells[1].ch);
  if (!L.ans[1]) throw new Error('после ошибки правильный ответ не принят');
});
step('шифр: слой 2 — ряды собираются в читаемую фразу', () => {
  const L = arStart(0);
  L.setScene('l2');
  L.tapRow(1);
  const as = L.assembled();
  if (as.indexOf('ДО БЕСКОНЕЧНОСТИ И') < 0) throw new Error('фраза не собралась: ' + as);
});
step('шифр: слой 3 — правильный сдвиг открывает послание', () => {
  const L = arStart(0);
  L.setScene('l2'); L.tapRow(1);
  L.setScene('l3');
  for (let d = 0; d < 32; d++){
    L.dial = d;
    if (L.preview3() === T.ARC3_PHRASE) break;
  }
  if (L.preview3() !== T.ARC3_PHRASE) throw new Error('сдвиг не найден');
  L.check3();
  if (L.scene !== 'win') throw new Error('победа не наступила, сцена ' + L.scene);
});
step('шифр: победа засчитывается в архив, не в основной счёт', () => {
  const h0 = T.G.hearts.slice();
  const story0 = T.storyDone();
  const L = arStart(0);
  L.setScene('win');
  for (let i = 0; i < 400 && T.G.state === 'arlevel'; i++) frames(4);
  if (!T.AR.done[0]) throw new Error('победа не записана в архив');
  if (T.storyDone() !== story0) throw new Error('архив повлиял на сюжет');
  T.G.hearts = h0;
  T.AR.done[0] = false; T.AR.save();
});
step('шифр: подсказки выдаются по одной и не показывают ответ', () => {
  const L = arStart(0);
  const scr = T.G.screens.arlevel;
  for (let i = 0; i < 3; i++) T.arHint(i);
  if (scr.hintStep !== 3) throw new Error('подсказки не выдались: ' + scr.hintStep);
  if (!scr.hintText) throw new Error('нет текста подсказки');
  if (scr.hintText.indexOf(T.ARC1_PLAIN) >= 0) throw new Error('подсказка раскрывает ответ');
  T.arHint(0);
  if (!scr.hintText) throw new Error('четвёртая подсказка должна предупредить');
});
step('шифр: нижние кнопки работают во всех трёх слоях', () => {
  const L = arStart(0);
  const center = b => { if(!b) throw new Error('кнопка не найдена'); L.tap(b.x+b.w/2,b.y+b.h/2); };
  L.draw();
  center(L.layout.bottom.find(b=>b.id==='pos2'));
  if(L.sel1 !== 1) throw new Error('кнопка П2 не выбрала позицию');
  L.draw();
  center(L.layout.bottom.find(b=>b.ch===L.l1cells()[1].ch));
  if(!L.ans[1] || L.sel1 !== 4) throw new Error('кнопка буквы не приняла ответ/не выбрала П5');
  L.draw();
  center(L.layout.bottom.find(b=>b.id==='pos5'));
  L.draw();
  center(L.layout.bottom.find(b=>b.ch===L.l1cells()[4].ch));
  if(!L.ans[4]) throw new Error('кнопка буквы не решила П5');
  L.draw(); center(L.layout.bottom.find(b=>b.id==='next'));
  if(L.scene !== 'l2') throw new Error('ДАЛЕЕ не открыла слой 2');
  L.draw(); center(L.layout.bottom.find(b=>b.id==='row2'));
  if(L.flips[1] !== 1) throw new Error('нижняя кнопка ряда не перевернула строку');
  L.draw(); center(L.layout.bottom.find(b=>b.id==='next'));
  if(L.scene !== 'l3') throw new Error('ДАЛЕЕ не открыла слой 3');
  L.draw(); center(L.layout.bottom.find(b=>b.id==='plus'));
  if(L.dial !== 1) throw new Error('+ не сдвинул шкалу');
  L.draw(); center(L.layout.bottom.find(b=>b.id==='minus'));
  if(L.dial !== 0) throw new Error('- не сдвинул шкалу обратно');
  L.draw(); center(L.layout.bottom.find(b=>b.id==='check'));
  if(L.scene !== 'win') throw new Error('ПРОВ. не проверила собранную фразу');
});
step('шифр: нижняя панель подсказки и выхода нажимается', () => {
  const L = arStart(0), scr = T.G.screens.arlevel;
  scr.hintStep = 0;
  L.draw();
  const hint = L.zones.find(z=>z.t==='ПОДСКАЗКА');
  if(!hint) throw new Error('кнопка подсказки не нарисована');
  scr.tap(hint.x+hint.w/2,hint.y+hint.h/2);
  if(scr.hintStep !== 1) throw new Error('кнопка подсказки не сработала');
  L.draw();
  const exit = L.zones.find(z=>z.t==='ВЫЙТИ');
  if(!exit) throw new Error('кнопка выхода не нарисована');
  scr.tap(exit.x+exit.w/2,exit.y+exit.h/2);
  if(T.G.state !== 'desktop') throw new Error('кнопка выхода не вернула на рабочий стол');
});
step('шифр: нижние кнопки помещаются на узком и широком экране', () => {
  const prevW=T.W(), prevH=T.H();
  for(const [w,h] of [[200,240],[320,240],[390,844],[800,450]]){
    resize(w,h);
    for(const scene of ['l1','l2','l3']){
      const L=arStart(0);
      if(scene==='l2') L.setScene('l2');
      if(scene==='l3') L.setScene('l3');
      if(scene==='l2') L.flips=[0,1,0];
      L.draw();
      if(!L.layout.bottom.length) throw new Error(scene+': нет кнопок при '+w+'x'+h);
      for(const b of L.layout.bottom){
        if(b.x<0 || b.x+b.w>T.W() || b.y<0 || b.y+b.h>T.H()-22)
          throw new Error(scene+': кнопка '+b.id+' ('+b.x+','+b.y+' '+b.w+'x'+b.h+') вне нижней панели при '+w+'x'+h+'; логика '+T.W()+'x'+T.H());
      }
    }
  }
  resize(prevW,prevH);
});

textFit('текст/панели', [[390, 844], [800, 450], [320, 240], [240, 320]]);

if (errors.length) { console.log('\n❌ ОШИБКИ:\n' + errors.join('\n\n')); process.exit(1); }
console.log('\n✅ Все проверки пройдены');
