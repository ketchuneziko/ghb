/* ==========================================================================
   ЧАСТЬ 11 · ЭПИЗОД 1 — ШИФР
   Сдвинь символы на шаг назад — и прочти послание
   ========================================================================== */

const CIP = {
  clue: 'Сдвинь символы на один шаг назад по алфавиту.',
  enc: 'А МЯВМЯ УЁВА ЕП ВЁТЛОЁШОПТУЙ Й ВЁТЛОЁШОПТТЬ ОЁ РСЁЁМ',
  plain: 'Я ЛЮБЛЮ ТЕБЯ ДО БЕСКОНЕЧНОСТИ И БЕСКОНЕЧНОСТЬ НЕ ПРЕДЕЛ',
  shift: 1
};
/* ВНИМАНИЕ: в enc потерялись две буквы «П» (должно быть ВЁТЛПОЁШОПТУЙ и
   ВЁТЛПОЁШОПТТЬ). Текст enc и plain оставлены ровно как заданы, поэтому
   при правильном сдвиге на экран выводится именно plain. */
const solved = sh => sh === CIP.shift;
/* «живая» расшифровка: сдвиг назад на shift (алфавит с Ё, 0-based) */
function decShift(str, sh){
  const n = ((sh % AL_N) + AL_N) % AL_N;
  return str.split('').map(ch => (ch===' ' || ch==='-') ? ch : ALPH[(aIdx(ch) - n + AL_N) % AL_N]).join('');
}

const EP1 = {
  name:'ШИФР', sub:'сдвинь и прочти', hint:'СТРЕЛКИ — СДВИГ', hintY:false,
  intro:[D('him','Мария, есть вещи, которые я не могу сказать вслух.'),
         D('him','Поэтому я их зашифровал. Сдвинь буквы на шаг назад — и прочтёшь сам.')],
  outro:[D('him','Вот теперь ты знаешь, что я хотел сказать.'),
         D('him','Первое сердце. Одно из восьми.')],
  hearts: 1,
  enter(){
    scenes(this);
    this.sh = 0; this.read = 0; this.ok = false; this.okT = 0; this.t0 = 0;
    this.strip = 0; this.sel = 0; this.glow = 0;
    this.setScene('main');
  },
  on_main(){ this.ok = false; this.read = 0; },
  d_main(){
    const P = CONFIG.P, t = this.t;
    // фон: тёмный «шифровальный цех»
    ctx.drawImage(bgCache('ep1bg', paint=>{ ditherGradVTo(paint,0,0,W,H,'#0a0620','#241445',16); }), 0, 0);
    this.gear(18, 24, 12, t*.35, 6);
    this.gear(W-20, H-26, 15, -t*.28, 7);
    if(FXQ > .5){
      ctx.fillStyle = 'rgba(107,79,160,.12)';
      for(let y=0;y<H;y+=8) ctx.fillRect(0, y, W, 1);
    }
    motes(t, 22, '#ffd166', .3);
    const good = solved(this.sh);
    const dec = good ? CIP.plain : decShift(CIP.enc, this.sh);
    // HUD
    hudTop({icon:'cipher', title:'ШИФР', col:'#6b4fa0', h:20, right: good ? 'ПРОЧИТАНО' : 'ЗАГАДКА'});
    // подсказка
    text(fitSc(CIP.clue, W-16, 1)===1?CIP.clue:CIP.clue, W/2, 24, {sc:fitSc(CIP.clue, W-16, 1), align:'center', color:'#9b8ac0'});
    // зашифрованный блок
    const ey = 36, eh = 30;
    glassPanel(6, ey, W-12, eh, {col:'#3a2560', title:'ЗАШИФРОВАНО'});
    wrap(CIP.enc, W-30, 1).slice(0,2).forEach((l,i)=>text(l, 11, ey+16+i*10, {sc:1, color:'#8a76b8'}));
    // расшифровка
    const py = ey+eh+6, ph = 56;
    glassPanel(6, py, W-12, ph, {col: good?P.green:'#6b4fa0', title: good?'ПРОЧИТАНО':'РАСШИФРОВКА'});
    const dl = wrap(dec, W-30, 1);
    dl.slice(0,3).forEach((l,i)=>text(l, 11, py+16+i*12, {sc:1, color: good?P.green:'#c9bde8'}));
    if(dl.length > 3) text('...', 11, py+16+3*12, {sc:1, color:'#4a3670'});
    // прогресс совпадения
    let m = 0;
    for(let i=0;i<Math.min(dec.length, CIP.plain.length);i++) if(dec[i]===CIP.plain[i]) m++;
    meterBar(6, py+ph+4, W-12, 5, m/CIP.plain.length, good?P.green:'#6b4fa0');
    // лента алфавита
    const wy = py+ph+18;
    drawStrip(ALPH, W/2, wy+7, Math.min(W-16, 236), 14, Math.round(this.strip), good?P.green:P.gold);
    text('СДВИГ', 6, wy+4, {sc:1, color:'#5a4680'});
    text(String(this.sh), W-6, wy+4, {sc:1, align:'right', color: good?P.green:P.gold});
    // кнопки
    const by = wy+20, bw = Math.floor((W-20)/3);
    this.rM = {x:6, y:by, w:bw, h:16};
    this.rP = {x:6+bw+4, y:by, w:bw, h:16};
    this.rR = {x:6+2*(bw+4), y:by, w:bw, h:16};
    dirBtn(6, by, bw, 16, 'l', {press:this.hovB===0, color:P.sky});
    dirBtn(6+bw+4, by, bw, 16, 'r', {press:this.hovB===1, color:P.sky});
    glassBtn(6+2*(bw+4), by, bw, 16, good?'ПРОЧИТАТЬ':'ЗАГАДКА', {press:this.hovB===2, color: good?P.green:'#5a4680', dis:!good});
    // она за пультом
    const gy = Math.min(H-14, by+52);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(W/2-11, gy+1, 22, 3);
    drawGirl(W/2, gy, CONFIG.cHer, 2, 0);
    textBlock('Она сидит за терминалом и ждёт ключ.', W/2, gy+8, W-20, {color:'#5a4680'});
    vignette(0.5); crtOverlay(t);
  },
  gear(cx, cy, r, rot, teeth){
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(107,79,160,.15)';
    ctx.beginPath(); ctx.arc(0,0,r,0,7); ctx.fill();
    for(let i=0;i<teeth;i++){
      const a = i*6.283/teeth;
      ctx.fillRect(Math.round(Math.cos(a)*r)-2, Math.round(Math.sin(a)*r)-2, 4, 4);
    }
    ctx.fillStyle = 'rgba(11,6,24,.5)';
    ctx.beginPath(); ctx.arc(0,0,r*0.35,0,7); ctx.fill();
    ctx.restore();
  },
  u_main(dt){
    this.strip = lerp(this.strip, this.sh, 1-Math.pow(0.001, dt));
    if(this.ok){ this.okT += dt; if(this.okT > 1.2) winLevel(LEVELS.indexOf(this)); }
  },
  k_main(k){
    if(k==='ArrowLeft' || k==='a' || k==='A' || k==='ф' || k==='Ф') this.rot(-1);
    if(k==='ArrowRight'|| k==='d' || k==='D' || k==='в' || k==='В') this.rot(1);
    if(k===' '||k==='Enter') this.readIt();
  },
  rot(d){
    this.sh = ((this.sh + d) % AL_N + AL_N) % AL_N;
    Snd.blip();
    if(solved(this.sh) && !this.ok){
      Snd.coin(); punch(.07);
      popText(W/2, this.roomRect ? 40 : 40, 'ПРОЧИТАНО!', CONFIG.P.green);
    }
  },
  readIt(){
    if(!solved(this.sh) || this.ok){ Snd.bad(); return; }
    this.ok = true; this.okT = 0; Snd.fanfare();
    flashScreen(CONFIG.P.gold, .4);
    for(let i=0;i<14;i++) burstHearts(W/2, H*0.4, 2, CONFIG.P.pink2);
  },
  t_main(x, y){
    this.hovB = -1;
    const on = (r)=> r && x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h;
    if(on(this.rM)){ this.hovB = 0; this.rot(-1); return; }
    if(on(this.rP)){ this.hovB = 1; this.rot(1); return; }
    if(on(this.rR)){ this.hovB = 2; this.readIt(); return; }
  }
};
