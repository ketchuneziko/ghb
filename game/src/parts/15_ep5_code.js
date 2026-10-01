/* ==========================================================================
   ЧАСТЬ 15 · ЭПИЗОД 5 — ИСПРАВЛЕНИЕ КОДА
   В программе сбой: избыток милоты. Собери правильные строки.
   ========================================================================== */

const COD = {
  src: [
    'while (together) {',
    '  love += Infinity;',
    '  happiness = true;',
    '}'
  ],
  tasks: [
    {line:0, gap:'while (', opts:['together','forever','love'], ok:0,
     say:'Пока мы вместе — это while (together).'},
    {line:1, gap:'love += ', opts:['Infinity','0','true'], ok:0,
     say:'Любовь растёт на бесконечность. love += Infinity;'},
    {line:2, gap:'happiness = ', opts:['true','false','null'], ok:0,
     say:'Счастье — это true. happiness = true;'}
  ],
  maxBad: 4,
  warn: 'Ошибка: избыток милоты — счастье переполняет счётчик.',
  fix:  'Ошибка исправлена: любовь теперь бесконечна!'
};

const EP5 = {
  name:'ИСПРАВЛЕНИЕ КОДА', sub:'почини программу', hint:'ВЫБЕРИ ПРАВИЛЬНЫЙ ФРАГМЕНТ', hintY:false,
  intro:[D('him','Случилось страшное: в программе избыток милоты.'),
         D('him','Код сломался. Починим вместе — три строчки, всё.')],
  outro:[D('him','Ошибок ноль. Стрелка переводится на «люблю».'),
         D('him','Седьмое и восьмое сердца. Осталось только письмо.')],
  hearts: 2,
  enter(){
    scenes(this);
    this.step = 0; this.done = [false,false,false];
    this.pick = -1; this.msg = 0; this.err = 0; this.ok = false; this.okT = 0;
    this.over = 0; this.bad = 0;
    this.setScene('play');
  },
  on_play(){ this.step = 0; this.done = [false,false,false]; this.ok = false; this.err = 0; this.bad = 0; },
  d_play(){
    const P = CONFIG.P, t = this.t;
    const q = COD.tasks[this.step];
    // фон: терминал
    ctx.drawImage(bgCache('ep5bg', paint=>{ ditherGradVTo(paint,0,0,W,H,'#04140f','#0d2418',12); }), 0, 0);
    if(FXQ > .5){
      ctx.fillStyle = 'rgba(140,233,154,.06)';
      for(let y=0;y<H;y+=6) ctx.fillRect(0, y, W, 1);
    }
    // «избыток милоты»
    const over = clamp(this.over, 0, 1);
    ctx.fillStyle = 'rgba(255,93,143,'+(over*.18).toFixed(3)+')';
    ctx.fillRect(0, 0, W, H);
    if(over > 0 && FXQ > .5){
      for(let i=0;i<10;i++){
        const x = ((i*37 + t*40) % W), y = H - 22 - ((i*53 + t*90) % (H-28));
        ctx.globalAlpha = over*.5;
        heart(x, y, 1, P.pink);
        ctx.globalAlpha = 1;
      }
    }
    hudTop({icon:'code', title:'ИСПРАВЛЕНИЕ КОДА', col:'#8ce99a', h:20, right:this.done.filter(Boolean).length+' / '+COD.tasks.length});
    epProgress(this.done.filter(Boolean).length, COD.tasks.length, W/2-13, 22, '#8ce99a');
    // окно кода (компактнее на низких экранах)
    const small = H < 320;
    const cy = small ? 28 : 36, ch = small ? 40 : 62;
    glassPanel(6, cy, W-12, ch, {col:'#2a5a3a', title:'love_os.js'});
    this.codeLines().forEach((l,i)=>{
      const y = cy+(small?12:18)+i*(small?8:11);
      text(String(i+1), 10, y, {sc:1, color:'#2f5a42'});
      const isCur = (i === this.step);
      const col = this.done[i] ? '#8ce99a' : (isCur ? '#ffd166' : '#4a7a5f');
      text(l, 20, y, {sc:1, color: col});
    });
    let yy = cy + ch + 4;
    // ошибка
    if(this.msg > 0){
      ctx.globalAlpha = clamp(this.msg*1.6, 0, 1);
      wrap(COD.warn, W-16, 1).slice(0,2).forEach((l,i)=>text(l, W/2, yy+i*10, {sc:1, align:'center', color:P.red}));
      ctx.globalAlpha = 1;
      yy += 22;
    }
    // подсказка
    if(q){
      wrap('Строка '+(this.step+1)+': вставь фрагмент в «'+q.gap+'»', W-16, 1).slice(0,2)
        .forEach((l,i)=>text(l, W/2, yy+i*10, {sc:1, align:'center', color:'#9b8ac0'}));
      yy += 22;
    }
    // варианты (убедимся что не вылезают за нижний край)
    this.optRects = [];
    const bh = small ? 10 : 16;
    // Зарезервируем место внизу: вторая строка кнопок + запас на текст 16px + место для девушки
    const reserve = bh + 24 + (small ? 18 : 34);
    let y = Math.min(Math.max(yy, Math.round(H*(small?0.46:0.62))), H - reserve - bh);
    if(q){
      const bw = Math.floor((W-20)/3);
      for(let i=0;i<3;i++){
        const x = 6+i*(bw+4);
        const sel = this.pick === i, good = q.ok === i, bad = this.pick === i && q.ok !== i;
        this.optRects.push({x:x, y:y, w:bw, h:bh, i:i});
        glassBtn(x, y, bw, bh, q.opts[i], {press:sel, color: bad?'#ff6b6b':(good&&this.done[this.step]?'#8ce99a':'#3a2560')});
      }
      const by2 = y+bh+(small?2:4);
      this.rOk = {x:6, y:by2, w:Math.floor((W-16)/2), h:bh};
      glassBtn(6, by2, Math.floor((W-16)/2), bh, 'ВСТАВИТЬ', {press:this.hovB===0, color: this.pick>=0?'#8ce99a':'#3a2560', dis:this.pick<0});
      this.rSkip = {x:6+Math.floor((W-16)/2)+4, y:by2, w:Math.floor((W-16)/2), h:bh};
      glassBtn(this.rSkip.x, by2, this.rSkip.w, bh, 'ДАЛЬШЕ', {press:this.hovB===1, color:UI.text, dis:!this.done[this.step]});
    }
    if(!q) this.rOk = this.rSkip = null;
    // ошибки компиляции
    for(let i=0;i<COD.maxBad;i++) heart(W-6-(COD.maxBad-i)*9, 32, 1, i < COD.maxBad-this.bad ? P.red : '#1d3a2a');
    text('ОШИБКИ', W-6, 42, {sc:1, align:'right', color:'#2f5a42'});
    // она за терминалом (на маленьких экранах совсем крошечная, чтобы не вылезать)
    const gsc = small ? 0.8 : 2;
    const gy = small ? H-14 : H-14;
    if(!small) drawGirl(16, gy, CONFIG.cHer, gsc, 0);
    else drawGirl(16, H-14, CONFIG.cHer, gsc, 0);
    if(!small) text('Она чинит код.', 36, gy-4, {sc:1, color:'#4a7a5f'});
    vignette(0.5); crtOverlay(t);
  },
  codeLines(){
    const out = [];
    for(let i=0;i<COD.src.length;i++){
      const tsk = COD.tasks[i];
      if(!tsk) { out.push(COD.src[i]); continue; }
      if(this.done[i]) out.push(COD.src[i]);
      else out.push(tsk.gap + '________ ;');
    }
    return out;
  },
  u_play(dt){
    if(this.msg > 0) this.msg -= dt;
    this.over = lerp(this.over, this.err>0 ? 0.6 : clamp(this.done.filter(Boolean).length/3, 0, 1), 1-Math.pow(0.02, dt));
    if(this.ok){ this.okT += dt; if(this.okT > 1.3) winLevel(LEVELS.indexOf(this)); }
  },
  apply(){
    if(this.pick < 0) return;
    const tsk = COD.tasks[this.step];
    if(!tsk) return;
    if(this.pick === tsk.ok){
      this.done[this.step] = true; this.pick = -1; Snd.coin();
      if(this.step < COD.tasks.length-1) this.step++;
      popText(W/2, H*0.56, 'ПРАВИЛЬНО', '#8ce99a');
      fx(W/2, H*0.55, 6, '#8ce99a', 50, .4);
      if(this.done.every(Boolean)){
        this.ok = true; this.okT = 0; Snd.fanfare();
        flashScreen(CONFIG.P.gold, .4); punch(.1);
        for(let i=0;i<12;i++) burstHearts(W/2, H*0.5, 2, CONFIG.P.pink2);
      }
    } else {
      this.err++; this.bad++; this.msg = 2.2; this.pick = -1;
      Snd.bad(); shake(3);
      popText(W/2, H*0.56, 'ОШИБКА КОМПИЛЯЦИИ', CONFIG.P.red);
      if(this.bad >= COD.maxBad) loseLevel('Программа не собралась. Он подождёт.');
    }
  },
  k_play(k){
    if(k==='ArrowLeft'){ this.pick = clamp((this.pick<0?-1:this.pick)-1, -1, 2); Snd.blip(); }
    if(k==='ArrowRight'){ this.pick = clamp((this.pick<0?0:this.pick)+1, -1, 2); Snd.blip(); }
    if(k===' '||k==='Enter') this.apply();
    if(k==='Tab'){ this.step = Math.min(2, this.step+1); Snd.blip(); }
  },
  t_play(x, y){
    this.hovB = -1;
    for(const r of (this.optRects||[])) if(x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h){ this.pick = r.i; Snd.blip(); return; }
    if(this.rOk && x>this.rOk.x&&x<this.rOk.x+this.rOk.w&&y>this.rOk.y&&y<this.rOk.y+this.rOk.h){ this.hovB=0; this.apply(); return; }
    if(this.rSkip && x>this.rSkip.x&&x<this.rSkip.x+this.rSkip.w&&y>this.rSkip.y&&y<this.rSkip.y+this.rSkip.h){
      this.hovB=1;
      if(this.done[this.step] && this.step < COD.tasks.length-1){ this.step++; Snd.blip(); }
      return;
    }
  }
};
