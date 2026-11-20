'use strict';
/*
 * Чух-Чух! — детская игра про паровозик.
 * Вся графика рисуется на canvas, все звуки синтезируются через WebAudio,
 * поэтому игра работает без интернета и без внешних файлов.
 *
 * Логические координаты: высота экрана всегда 720, ширина зависит от экрана.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const cv = $('game');
  const ctx = cv.getContext('2d');
  const LH = 720;
  let W = 0, H = 0, S = 1, LW = 1280, DPR = 1;

  // ---------------------------------------------------------------- storage
  const store = {
    get(k, d) { try { const v = localStorage.getItem('cc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cc_' + k, JSON.stringify(v)); } catch (e) { /* no storage */ } },
  };

  // ---------------------------------------------------------------- data
  const WORLDS = [
    { id: 'meadow', name: 'Луг', icon: '🌼', free: true, card: 'linear-gradient(#8fd3ff,#9be07a)',
      sky: ['#5fbcff', '#d9f2ff'], far: '#a8dba0', mid: '#86c97a', ground: '#7cc95a', ground2: '#70bd4f',
      bed: '#b59d7c', plat: '#e6cfa8', platSide: '#bc9f75' },
    { id: 'winter', name: 'Зима', icon: '❄️', card: 'linear-gradient(#a9cdf0,#f4f8ff)',
      sky: ['#8fb8e3', '#eef6ff'], far: '#e2ebf6', mid: '#cfdcee', ground: '#f6f9ff', ground2: '#e6eef8',
      bed: '#a3a8b8', plat: '#d8dee9', platSide: '#a9b3c6' },
    { id: 'desert', name: 'Пустыня', icon: '🌵', card: 'linear-gradient(#ffc069,#f4d38f)',
      sky: ['#ffae4a', '#fff3d6'], far: '#f5c47e', mid: '#eeb465', ground: '#f4d38f', ground2: '#ebc77c',
      bed: '#c5a06a', plat: '#ecd3a5', platSide: '#c4a26d' },
    { id: 'night', name: 'Ночь', icon: '🌙', card: 'linear-gradient(#0d1b3d,#2c4a8a)',
      sky: ['#0b1736', '#2c4a8a'], far: '#22386a', mid: '#1b2d55', ground: '#2d5a3b', ground2: '#275033',
      bed: '#5a5466', plat: '#6f6c84', platSide: '#4f4c62' },
  ];
  const LOCOS = [
    { id: 'red', name: 'Красный паровоз', type: 'steam', free: true, body: '#e53935', cab: '#c62828', trim: '#ffca28' },
    { id: 'blue', name: 'Синий тепловоз', type: 'diesel', body: '#1e88e5', cab: '#1565c0', trim: '#ffffff' },
    { id: 'yellow', name: 'Электричка', type: 'electric', body: '#fdd835', cab: '#f9a825', trim: '#e53935' },
    { id: 'rainbow', name: 'Радужный паровоз', type: 'steam', body: '#8e24aa', cab: '#6a1b9a', trim: '#00e5ff', rainbow: true },
  ];
  const WAGON_COLORS = ['#43a047', '#fb8c00', '#00acc1'];
  const RAINBOW = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
  const ANIM = {
    bunny: { c: '#f4f4f4', e: '#f8bbd0' }, bear: { c: '#a1714f', e: '#d9ae8a' },
    cat: { c: '#ffb74d', e: '#ffe0b2' }, frog: { c: '#7cc35a', e: '#b4e598' },
    pig: { c: '#f8bbd0', e: '#ef8fb0' }, duck: { c: '#ffe14d', e: '#ff9800' },
    fox: { c: '#ff8a3d', e: '#fff3e0' }, panda: { c: '#fafafa', e: '#263238' },
  };
  const ANIMAL_TYPES = Object.keys(ANIM);

  // ---------------------------------------------------------------- геометрия поезда
  const RAIL = 560, PLAT_TOP = 602, LOCO_LEN = 230, WAG_LEN = 170, GAP = 16;
  const STATION_FIRST = 2200, STATION_GAP = 3200, TRIP = 5;
  const CRUISE = 230, BOOST = 380, ACC = 130, BRAKE = 150;

  const settings = {
    world: store.get('world', 'meadow'),
    loco: store.get('loco', 'red'),
    sound: store.get('sound', true),
    music: store.get('music', true),
  };
  let premium = false;
  let stars = store.get('stars', 0);

  const G = {
    mode: 'menu', dist: 0, v: 0, phase: 'run', k: 0, stationsDone: 0,
    boostT: 0, stT: 0, depT: 0, chugT: 0, time: 0, lastTap: 0,
    animals: [], seats: [], balloons: [], parts: [], smoke: [], flakes: [],
    nextBalloon: 700, celebrateT: 0, honkT: 0, nW: 3, frontX: 900, wiggleW: {},
  };

  // ---------------------------------------------------------------- utils
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); ctx.fillStyle = c; ctx.fill(); }
  function circle(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function ellipse(x, y, rx, ry, c, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function tri(x1, y1, x2, y2, x3, y3, c) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); }
  function world() { return WORLDS.find((w) => w.id === settings.world) || WORLDS[0]; }
  function loco() { return LOCOS.find((l) => l.id === settings.loco) || LOCOS[0]; }
  function isUnlocked(item) { return item.free || premium; }

  // ---------------------------------------------------------------- звук
  const Sfx = {
    ac: null, master: null, noiseBuf: null,
    ensure() {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ac = new AC();
        this.master = this.ac.createGain();
        this.master.gain.value = 0.7;
        this.master.connect(this.ac.destination);
        const len = this.ac.sampleRate;
        this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      return this.ac;
    },
    ready() { return settings.sound && this.ensure(); },
    osc(type, f0, f1, dur, vol, delay) {
      const ac = this.ready(); if (!ac) return;
      const t = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol, freq, delay) {
      const ac = this.ready(); if (!ac) return;
      const t = ac.currentTime + (delay || 0);
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = this.noiseBuf;
      f.type = 'lowpass'; f.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
    },
    honk() {
      const ac = this.ready(); if (!ac) return;
      const t0 = ac.currentTime;
      const chord = loco().type === 'steam' ? [523, 659, 784] : [440, 554];
      const wave = loco().type === 'steam' ? 'triangle' : 'square';
      const vol = wave === 'square' ? 0.05 : 0.12;
      [[0, 0.32], [0.42, 0.62]].forEach(([s, d]) => {
        chord.forEach((f) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = wave;
          o.frequency.setValueAtTime(f * 0.96, t0 + s);
          o.frequency.linearRampToValueAtTime(f, t0 + s + 0.06);
          g.gain.setValueAtTime(0.0001, t0 + s);
          g.gain.exponentialRampToValueAtTime(vol, t0 + s + 0.04);
          g.gain.setValueAtTime(vol, t0 + s + d - 0.08);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d);
          o.connect(g); g.connect(this.master);
          o.start(t0 + s); o.stop(t0 + s + d + 0.05);
        });
      });
      if (loco().type === 'steam') this.noise(0.9, 0.05, 3000);
    },
    chug() { this.noise(0.09, loco().type === 'electric' ? 0.06 : 0.22, loco().type === 'steam' ? 700 : 400); },
    pop() { this.osc('sine', 500, 1100, 0.12, 0.3); },
    boing() { this.osc('sine', 260, 640, 0.28, 0.3); },
    note(i) { const sc = [523, 587, 659, 784, 880, 1047, 1175, 1319]; this.osc('triangle', sc[i % sc.length], 0, 0.4, 0.25); },
    bell() { this.osc('sine', 1320, 0, 0.7, 0.18); this.osc('sine', 1320, 0, 0.7, 0.18, 0.28); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => this.osc('square', f, 0, 0.22, 0.07, i * 0.13)); this.osc('triangle', 1047, 0, 0.8, 0.22, 0.55); },
    bonk() { this.osc('sine', 240, 150, 0.22, 0.3); },
    giggle() { [700, 900, 760, 1040].forEach((f, i) => this.osc('sine', f, f * 1.25, 0.07, 0.14, i * 0.08)); },
    sparkle() { this.osc('sine', 1400 + Math.random() * 600, 0, 0.15, 0.08); },
    // «голоса» зверят: [волна, частота от, частота до, длительность, задержка, громкость]
    voice(type) {
      const V = {
        bunny: [['sine', 900, 1400, 0.09, 0, 0.22], ['sine', 950, 1500, 0.09, 0.12, 0.22]],
        bear: [['triangle', 170, 120, 0.45, 0, 0.35]],
        cat: [['triangle', 560, 820, 0.18, 0, 0.25], ['triangle', 820, 480, 0.3, 0.18, 0.25]],
        frog: [['square', 170, 150, 0.08, 0, 0.08], ['square', 210, 160, 0.12, 0.11, 0.08]],
        pig: [['square', 320, 200, 0.14, 0, 0.07], ['square', 300, 190, 0.14, 0.2, 0.07]],
        duck: [['sawtooth', 520, 380, 0.13, 0, 0.07], ['sawtooth', 520, 380, 0.13, 0.17, 0.07]],
        fox: [['sine', 800, 1250, 0.1, 0, 0.22], ['sine', 850, 1300, 0.1, 0.14, 0.22]],
        panda: [['sine', 380, 620, 0.22, 0, 0.28]],
      }[type] || [];
      V.forEach(([w, f0, f1, d, dl, v]) => this.osc(w, f0, f1, d, v, dl));
    },
  };

  // ---------------------------------------------------------------- музыка
  // Простая весёлая мелодия, синтезируется на лету и тихо играет во время поездки.
  const Music = {
    gain: null, timer: null, next: 0, step: 0,
    BEAT: 60 / 116,
    // [нота MIDI или 0 для паузы, длительность в долях]
    MELODY: [
      [72, 1], [76, 1], [79, 1], [76, 1], [77, 1], [81, 1], [79, 2],
      [76, 1], [79, 1], [84, 1], [79, 1], [74, 1], [77, 1], [76, 2],
      [72, 1], [76, 1], [79, 1], [76, 1], [77, 1], [81, 1], [79, 1], [77, 1],
      [76, 1], [74, 1], [71, 1], [74, 1], [72, 3], [0, 1],
    ],
    BASS: [48, 53, 48, 55, 48, 53, 55, 48],
    start() {
      if (!settings.music || this.timer) return;
      const ac = Sfx.ensure(); if (!ac) return;
      if (!this.gain) { this.gain = ac.createGain(); this.gain.connect(Sfx.master); }
      this.gain.gain.cancelScheduledValues(ac.currentTime);
      this.gain.gain.setValueAtTime(settings.sound ? 0.5 : 0, ac.currentTime);
      this.next = ac.currentTime + 0.1; this.step = 0; this.bassT = this.next; this.bar = 0;
      this.timer = setInterval(() => this.tick(), 100);
    },
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.gain && Sfx.ac) this.gain.gain.setTargetAtTime(0, Sfx.ac.currentTime, 0.1);
    },
    tone(f, t, d, type, vol) {
      const ac = Sfx.ac, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.gain);
      o.start(t); o.stop(t + d + 0.05);
    },
    tick() {
      const ac = Sfx.ac; if (!ac || !settings.sound) return;
      const ahead = ac.currentTime + 0.4;
      while (this.next < ahead) {
        const [n, len] = this.MELODY[this.step % this.MELODY.length];
        if (n) this.tone(440 * Math.pow(2, (n - 69) / 12), this.next, len * this.BEAT * 0.9, 'triangle', 0.06);
        this.next += len * this.BEAT;
        this.step++;
      }
      while (this.bassT < ahead) {
        const n = this.BASS[this.bar % this.BASS.length];
        this.tone(440 * Math.pow(2, (n - 69) / 12), this.bassT, this.BEAT * 0.8, 'sine', 0.09);
        this.tone(440 * Math.pow(2, (n + 7 - 69) / 12), this.bassT + this.BEAT * 2, this.BEAT * 0.8, 'sine', 0.06);
        this.bassT += this.BEAT * 4; this.bar++;
      }
    },
  };

  // ---------------------------------------------------------------- layout
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    S = H / LH; LW = W / S;
    const nW = LW >= 1150 ? 3 : LW >= 880 ? 2 : 1;
    if (nW !== G.nW) setWagons(nW);
    G.frontX = Math.min(LW * 0.74, LW - 70);
    if (G.phase === 'station') G.dist = stopDist(G.k);
    skyCache = null;
    initFlakes();
  }
  function setWagons(n) {
    const old = G.seats;
    G.nW = n;
    G.seats = [];
    for (let w = 0; w < n; w++) G.seats.push(old[w] ? old[w] : [null, null]);
    // Пассажиры из исчезнувших вагонов просто выходят
    G.animals = G.animals.filter((a) => !a.seat || a.seat.w < n);
  }
  const wagonLeft = (i) => G.frontX - LOCO_LEN - GAP - WAG_LEN - i * (WAG_LEN + GAP);
  const locoLeft = () => G.frontX - LOCO_LEN;
  const wagonsCenter = () => (wagonLeft(G.nW - 1) + G.frontX - LOCO_LEN - GAP) / 2;
  const stationX = (k) => STATION_FIRST + k * STATION_GAP;
  const stopDist = (k) => stationX(k) - wagonsCenter();
  const seatPos = (w, i) => ({ x: wagonLeft(w) + 52 + i * 68, y: RAIL - 116 });
  const platWidth = () => G.frontX - wagonLeft(G.nW - 1) + 40;

  // ---------------------------------------------------------------- рисование: животные
  function drawAnimal(type, x, y, s, o) {
    o = o || {};
    const A = ANIM[type];
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(s, s);
    if (o.alpha != null) ctx.globalAlpha = clamp(o.alpha, 0, 1);
    const dark = '#2b2b3a';
    if (o.body) {
      const wave = o.wave ? Math.sin(G.time * 12) * 0.5 : 0;
      ellipse(-22, 44, 8, 16, A.c, 0.5 + wave);
      ellipse(22, 44, 8, 16, A.c, -0.5 - (o.wave ? wave : 0) - (o.wave ? 1.2 : 0));
      ellipse(0, 52, 25, 29, A.c);
      ellipse(0, 56, 15, 18, type === 'panda' ? '#fafafa' : shade(A.c.length === 7 ? A.c : '#ffffff', 0.35));
      ellipse(-12, 80, 11, 7, type === 'panda' ? dark : shade(A.c, -0.15));
      ellipse(12, 80, 11, 7, type === 'panda' ? dark : shade(A.c, -0.15));
    }
    // уши
    switch (type) {
      case 'bunny':
        ellipse(-12, -42, 9, 26, A.c, -0.18); ellipse(12, -42, 9, 26, A.c, 0.18);
        ellipse(-12, -40, 4.5, 18, A.e, -0.18); ellipse(12, -40, 4.5, 18, A.e, 0.18);
        break;
      case 'bear':
        circle(-22, -22, 11, A.c); circle(22, -22, 11, A.c); circle(-22, -22, 6, A.e); circle(22, -22, 6, A.e);
        break;
      case 'panda':
        circle(-22, -22, 11, dark); circle(22, -22, 11, dark);
        break;
      case 'cat':
        tri(-28, -6, -22, -40, -4, -26, A.c); tri(28, -6, 22, -40, 4, -26, A.c);
        tri(-23, -12, -20, -32, -10, -24, '#ffccbc'); tri(23, -12, 20, -32, 10, -24, '#ffccbc');
        break;
      case 'fox':
        tri(-30, -4, -24, -46, -4, -26, A.c); tri(30, -4, 24, -46, 4, -26, A.c);
        tri(-27, -32, -24, -46, -18, -36, dark); tri(27, -32, 24, -46, 18, -36, dark);
        break;
      case 'pig':
        tri(-26, -12, -26, -36, -8, -26, A.c); tri(26, -12, 26, -36, 8, -26, A.c);
        break;
      case 'frog':
        circle(-14, -24, 13, A.c); circle(14, -24, 13, A.c);
        break;
      case 'duck':
        ctx.strokeStyle = A.c; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -28); ctx.quadraticCurveTo(-4, -42, 6, -42); ctx.stroke();
        break;
    }
    // голова
    circle(0, 0, 30, A.c);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.12)';
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
    if (type === 'panda') { ellipse(-12, -2, 8, 10, dark, 0.5); ellipse(12, -2, 8, 10, dark, -0.5); }
    if (type === 'fox') { ellipse(-14, 12, 14, 10, A.e); ellipse(14, 12, 14, 10, A.e); }
    if (type === 'bear') ellipse(0, 11, 12, 9, A.e);
    // глаза
    const ey = type === 'frog' ? -26 : -4, ex = type === 'frog' ? 14 : 11;
    const blink = ((G.time * 0.7 + (o.seed || 0)) % 4) < 0.12;
    if (type === 'frog') { circle(-ex, ey, 8, '#fff'); circle(ex, ey, 8, '#fff'); }
    if (o.happy) {
      ctx.strokeStyle = type === 'panda' ? '#fff' : dark; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(-ex, ey + 2, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey + 2, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (blink) {
      ctx.strokeStyle = type === 'panda' ? '#fff' : dark; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-ex - 5, ey); ctx.lineTo(-ex + 5, ey); ctx.moveTo(ex - 5, ey); ctx.lineTo(ex + 5, ey); ctx.stroke();
    } else {
      const ec = type === 'panda' ? '#fff' : dark;
      circle(-ex, ey, 5, ec); circle(ex, ey, 5, ec);
      const gc = type === 'panda' ? dark : '#fff';
      circle(-ex + 1.8, ey - 1.8, 1.8, gc); circle(ex + 1.8, ey - 1.8, 1.8, gc);
    }
    // щёки
    ctx.globalAlpha *= 0.5;
    circle(-19, 9, 6, '#ff8a80'); circle(19, 9, 6, '#ff8a80');
    ctx.globalAlpha = o.alpha != null ? clamp(o.alpha, 0, 1) : 1;
    // нос и рот
    ctx.strokeStyle = dark; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    if (type === 'duck') {
      ellipse(0, 10, 13, 6, A.e);
      ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(10, 10); ctx.strokeStyle = shade('#ff9800', -0.3); ctx.stroke();
    } else if (type === 'pig') {
      ellipse(0, 9, 11, 8, A.e); circle(-4, 9, 2.2, '#b5547a'); circle(4, 9, 2.2, '#b5547a');
      ctx.beginPath(); ctx.arc(0, 18, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
      const nc = type === 'cat' || type === 'bunny' ? '#ff8fa3' : dark;
      ellipse(0, 6, 4, 3, nc);
      ctx.beginPath(); ctx.arc(-4, 10, 4, 0.1, Math.PI - 0.3); ctx.arc(4, 10, 4, 0.3, Math.PI - 0.1); ctx.stroke();
      if (type === 'cat') {
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-26, 4); ctx.moveTo(-10, 11); ctx.lineTo(-26, 13);
        ctx.moveTo(10, 8); ctx.lineTo(26, 4); ctx.moveTo(10, 11); ctx.lineTo(26, 13); ctx.stroke();
      }
    }
    if (o.cap) { // кепка машиниста
      ctx.fillStyle = o.cap; ctx.beginPath(); ctx.arc(0, -16, 24, Math.PI, 0); ctx.fill();
      fillRR(-4, -20, 34, 7, 3, shade(o.cap, -0.25));
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- рисование: поезд
  function wheel(x, y, r, color, ang) {
    circle(x, y, r, '#37474f');
    circle(x, y, r * 0.72, color);
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = ang + (i * Math.PI) / 3;
      ctx.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
      ctx.lineTo(x - Math.cos(a) * r * 0.7, y - Math.sin(a) * r * 0.7);
    }
    ctx.stroke();
    circle(x, y, r * 0.22, '#eceff1');
  }

  function drawLoco(L, x, bob) {
    const y = bob;
    const ang = G.dist / 26;
    const wy = RAIL;
    ctx.save();
    ctx.translate(0, y);
    // рама
    fillRR(x + 4, wy - 52, LOCO_LEN - 4, 20, 6, '#37474f');
    if (L.type === 'steam') {
      // кабина
      fillRR(x + 6, wy - 190, 92, 150, 12, L.cab);
      fillRR(x - 4, wy - 202, 112, 20, 8, L.trim);
      fillRR(x + 22, wy - 172, 56, 50, 10, '#b3e5fc');
      drawAnimal('bear', x + 50, wy - 140, 0.62, { cap: '#1e3a8a', seed: 3 });
      fillRR(x + 26, wy - 168, 12, 26, 5, 'rgba(255,255,255,.4)');
      // котёл
      fillRR(x + 86, wy - 142, 132, 92, 42, L.body);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; fillRR(x + 96, wy - 134, 110, 18, 9, 'rgba(255,255,255,.2)');
      const bands = L.rainbow ? RAINBOW : [L.trim, L.trim];
      for (let i = 0; i < (L.rainbow ? 6 : 2); i++) {
        const bx = L.rainbow ? x + 100 + i * 18 : x + 122 + i * 46;
        fillRR(bx, wy - 142, 9, 92, 3, bands[i]);
      }
      // купол и труба
      ctx.fillStyle = L.trim;
      ctx.beginPath(); ctx.arc(x + 140, wy - 140, 17, Math.PI, 0); ctx.fill();
      fillRR(x + 170, wy - 196, 28, 60, 4, '#37474f');
      fillRR(x + 162, wy - 208, 44, 16, 5, '#263238');
      // фара и решётка
      circle(x + 222, wy - 104, 11, '#fff59d'); circle(x + 222, wy - 104, 6, '#fffde7');
      tri(x + 206, wy - 50, x + 246, wy - 22, x + 206, wy - 22, '#78909c');
      // колёса
      wheel(x + 42, wy - 30, 30, L.cab, ang);
      wheel(x + 110, wy - 30, 30, L.cab, ang);
      wheel(x + 178, wy - 22, 22, L.cab, ang * 1.36);
      // шатун
      const cx = Math.cos(ang) * 14, cy = Math.sin(ang) * 14;
      ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 42 + cx, wy - 30 + cy); ctx.lineTo(x + 110 + cx, wy - 30 + cy); ctx.stroke();
    } else {
      const electric = L.type === 'electric';
      // корпус
      rr(x + 4, wy - 176, LOCO_LEN - (electric ? 0 : 6), 128, electric ? 46 : 16);
      ctx.fillStyle = L.body; ctx.fill();
      fillRR(x + 4, wy - 92, LOCO_LEN - 6, 16, 4, L.trim);
      fillRR(x + 12, wy - 168, LOCO_LEN - 40, 14, 7, 'rgba(255,255,255,.22)');
      // окна
      for (let i = 0; i < 3; i++) fillRR(x + 20 + i * 44, wy - 150, 32, 34, 8, '#b3e5fc');
      fillRR(x + 160, wy - 156, 52, 48, 12, '#b3e5fc');
      drawAnimal('bear', x + 186, wy - 124, 0.6, { cap: '#1e3a8a', seed: 3 });
      fillRR(x + 164, wy - 152, 10, 22, 5, 'rgba(255,255,255,.4)');
      // фара
      circle(x + LOCO_LEN - 6, wy - 70, 9, '#fff59d');
      if (electric) {
        // пантограф
        ctx.strokeStyle = '#455a64'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x + 70, wy - 178); ctx.lineTo(x + 100, wy - 222); ctx.lineTo(x + 76, wy - 250);
        ctx.moveTo(x + 56, wy - 252); ctx.lineTo(x + 104, wy - 252); ctx.stroke();
      } else {
        fillRR(x + 60, wy - 190, 22, 16, 4, '#455a64');
        fillRR(x + 30, wy - 184, 110, 10, 5, shade(L.body, -0.2));
      }
      wheel(x + 40, wy - 22, 22, L.cab, ang * 1.36);
      wheel(x + 88, wy - 22, 22, L.cab, ang * 1.36);
      wheel(x + 150, wy - 22, 22, L.cab, ang * 1.36);
      wheel(x + 198, wy - 22, 22, L.cab, ang * 1.36);
    }
    ctx.restore();
  }

  function drawWagon(w, x, color, bob) {
    const wig = G.wiggleW[w] ? Math.sin(G.time * 40) * 3 * G.wiggleW[w] : 0;
    ctx.save();
    ctx.translate(0, bob + wig);
    fillRR(x + 6, RAIL - 46, WAG_LEN - 12, 16, 5, '#37474f');
    // задняя стенка
    fillRR(x + 6, RAIL - 112, WAG_LEN - 12, 70, 10, shade(color, -0.35));
    // пассажиры
    for (const a of G.animals) {
      if (!a.seat || a.seat.w !== w) continue;
      if (a.state === 'seated') {
        const p = seatPos(w, a.seat.i);
        const hop = a.hop > 0 ? Math.sin(a.hop * Math.PI) * 18 : 0;
        drawAnimal(a.type, p.x, p.y - hop + Math.sin(G.time * 3 + a.seed) * 2, 0.95, { seed: a.seed, happy: a.hop > 0 || G.celebrateT > 0 });
      } else if (a.state === 'jump' && a.t / a.dur > 0.72) {
        drawJumper(a);
      }
    }
    // передняя стенка
    fillRR(x, RAIL - 100, WAG_LEN, 62, 12, color);
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    fillRR(x + 8, RAIL - 94, WAG_LEN - 16, 10, 5, 'rgba(255,255,255,.3)');
    ctx.strokeStyle = shade(color, -0.2); ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) { ctx.moveTo(x + (WAG_LEN / 4) * i, RAIL - 80); ctx.lineTo(x + (WAG_LEN / 4) * i, RAIL - 46); }
    ctx.stroke();
    wheel(x + 36, RAIL - 18, 18, '#90a4ae', G.dist / 18);
    wheel(x + WAG_LEN - 36, RAIL - 18, 18, '#90a4ae', G.dist / 18);
    ctx.restore();
    // сцепка
    fillRR(x + WAG_LEN - 2, RAIL - 44, GAP + 6, 8, 3, '#263238');
  }

  function drawTrain() {
    const L = loco();
    const bobBase = G.v > 1 ? Math.sin(G.dist * 0.08) * 1.4 : 0;
    for (let w = G.nW - 1; w >= 0; w--) {
      const c = L.rainbow ? RAINBOW[(w * 2 + 1) % RAINBOW.length] : WAGON_COLORS[w % WAGON_COLORS.length];
      drawWagon(w, wagonLeft(w), c, G.v > 1 ? Math.sin(G.dist * 0.08 + w + 1) * 1.4 : 0);
    }
    const honkBounce = G.honkT > 0 ? -Math.sin(G.honkT * 18) * 3 : 0;
    drawLoco(L, locoLeft(), bobBase + honkBounce);
  }

  // ---------------------------------------------------------------- рисование: мир
  let skyCache = null;
  function drawSky(T) {
    if (!skyCache || skyCache.id !== T.id) {
      const g = ctx.createLinearGradient(0, 0, 0, 520);
      g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]);
      skyCache = { id: T.id, g };
    }
    ctx.fillStyle = skyCache.g;
    ctx.fillRect(0, 0, LW, LH);
    if (T.id === 'night') {
      for (let i = 0; i < 70; i++) {
        const x = rnd(i) * LW, y = rnd(i + 99) * 360;
        const tw = 0.5 + 0.5 * Math.sin(G.time * 2 + i);
        ctx.globalAlpha = 0.4 + tw * 0.6;
        circle(x, y, 1.2 + rnd(i + 7) * 1.8, '#fffde7');
      }
      ctx.globalAlpha = 1;
      circle(LW - 170, 110, 52, '#fff8e1');
      circle(LW - 148, 96, 46, T.sky[0]);
    } else {
      const sx = LW - 160, sy = T.id === 'desert' ? 120 : 100, r = T.id === 'desert' ? 64 : 50;
      ctx.globalAlpha = 0.25; circle(sx, sy, r * 1.6, '#fff59d'); ctx.globalAlpha = 1;
      circle(sx, sy, r, T.id === 'winter' ? '#fffde7' : '#ffeb3b');
      // облака
      const off = G.dist * 0.08 + G.time * 6;
      const cell = 420;
      for (let i = Math.floor(off / cell) - 1; i < (off + LW) / cell + 1; i++) {
        if (rnd(i * 3.1) < 0.35) continue;
        const x = i * cell - off + rnd(i) * 160, y = 70 + rnd(i * 1.7) * 150, s = 0.7 + rnd(i * 2.3) * 0.6;
        cloud(x, y, s);
      }
    }
  }
  function cloud(x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.beginPath();
    ctx.arc(x, y, 30 * s, 0, 7); ctx.arc(x + 34 * s, y - 14 * s, 36 * s, 0, 7);
    ctx.arc(x + 70 * s, y, 28 * s, 0, 7); ctx.rect(x, y, 70 * s, 26 * s);
    ctx.fill();
  }
  function hills(par, base, amp, freq, color, seed) {
    const off = G.dist * par;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, LH);
    for (let x = 0; x <= LW + 20; x += 20) {
      const u = x + off;
      ctx.lineTo(x, base - Math.sin(u * freq + seed) * amp - Math.sin(u * freq * 2.7 + seed * 2) * amp * 0.35);
    }
    ctx.lineTo(LW, LH);
    ctx.fill();
  }

  function decor(T, kind, x, base, s) {
    ctx.save();
    ctx.translate(x, base);
    ctx.scale(s, s);
    if (T.id === 'meadow') {
      if (kind === 0) { fillRR(-8, -60, 16, 60, 4, '#8d6e63'); circle(0, -86, 40, '#43a047'); circle(-26, -66, 28, '#4caf50'); circle(26, -66, 28, '#4caf50'); circle(10, -96, 4, '#e53935'); circle(-14, -74, 4, '#e53935'); }
      else if (kind === 1) { circle(-18, -16, 20, '#66bb6a'); circle(10, -22, 24, '#5cb860'); circle(30, -12, 16, '#66bb6a'); }
      else if (kind === 2) { house('#fff3e0', '#e53935'); }
      else { flowers(); }
    } else if (T.id === 'winter') {
      if (kind === 0 || kind === 3) {
        fillRR(-6, -20, 12, 20, 3, '#6d4c41');
        for (let i = 0; i < 3; i++) { const yy = -20 - i * 30, ww = 46 - i * 12; tri(-ww, yy, ww, yy, 0, yy - 46, '#2e7d32'); tri(-ww * 0.6, yy - 16, ww * 0.6, yy - 16, 0, yy - 46, '#fff'); }
      } else if (kind === 1) {
        circle(0, -24, 26, '#fff'); circle(0, -66, 19, '#fff'); circle(-6, -70, 2.5, '#263238'); circle(6, -70, 2.5, '#263238');
        tri(0, -64, 16, -61, 0, -58, '#ff7043'); fillRR(-14, -94, 28, 12, 3, '#263238'); fillRR(-18, -84, 36, 5, 2, '#263238');
        fillRR(-20, -50, 40, 8, 4, '#e53935');
      } else { house('#ffe0b2', '#5d4037', true); }
    } else if (T.id === 'desert') {
      if (kind === 0 || kind === 3) {
        const c = '#4caf50';
        fillRR(-12, -110, 24, 110, 12, c); fillRR(-40, -78, 14, 40, 7, c); fillRR(-40, -48, 34, 12, 6, c);
        fillRR(26, -92, 14, 36, 7, c); fillRR(8, -62, 32, 12, 6, c);
        if (kind === 3) circle(0, -114, 7, '#ff4081');
      } else if (kind === 1) { ellipse(0, -14, 34, 20, '#a1887f'); ellipse(-8, -20, 14, 8, '#bcaaa4'); }
      else {
        ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -60, 8, -120); ctx.stroke();
        for (let i = 0; i < 5; i++) ellipse(8 + Math.cos(i * 1.3) * 26, -122 + Math.sin(i * 1.3) * 8, 32, 9, '#43a047', i * 1.3);
      }
    } else {
      if (kind === 0 || kind === 3) { fillRR(-7, -50, 14, 50, 4, '#3e2f2a'); circle(0, -76, 34, '#173a2a'); circle(-20, -58, 22, '#1b4332'); circle(20, -58, 22, '#1b4332'); }
      else if (kind === 1) { house('#3a3f5c', '#22253a', false, true); }
      else {
        fillRR(-4, -110, 8, 110, 3, '#37474f'); fillRR(-12, -122, 24, 16, 5, '#455a64');
        ctx.globalAlpha = 0.25 + 0.05 * Math.sin(G.time * 3); circle(0, -110, 46, '#ffee58'); ctx.globalAlpha = 1;
        circle(0, -112, 9, '#fff59d');
      }
    }
    ctx.restore();
  }
  function house(wall, roof, snow, lit) {
    fillRR(-46, -70, 92, 70, 4, wall);
    tri(-58, -68, 58, -68, 0, -122, roof);
    if (snow) tri(-38, -86, 38, -86, 0, -122, '#fff');
    const win = lit ? '#ffd54f' : '#90caf9';
    if (lit) { ctx.globalAlpha = 0.3; circle(-20, -42, 26, '#ffd54f'); ctx.globalAlpha = 1; }
    fillRR(-32, -52, 22, 22, 4, win); fillRR(10, -40, 22, 40, 4, lit ? '#5d4037' : '#8d6e63');
  }
  function flowers() {
    const cs = ['#ff4081', '#ffeb3b', '#ffffff', '#7c4dff'];
    for (let i = 0; i < 5; i++) {
      const fx = -40 + i * 20, fy = -10 - (i % 2) * 8;
      ctx.strokeStyle = '#388e3c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, fy); ctx.stroke();
      circle(fx, fy, 7, cs[i % cs.length]); circle(fx, fy, 3, '#ffb300');
    }
  }

  function layer(T, par, cell, base, scale, seed, density) {
    const off = G.dist * par;
    for (let i = Math.floor(off / cell) - 1; i < (off + LW) / cell + 2; i++) {
      if (rnd(i * 1.37 + seed) > density) continue;
      const x = i * cell - off + rnd(i * 2.11 + seed) * cell * 0.5;
      const kind = Math.floor(rnd(i * 3.7 + seed) * 4);
      decor(T, kind, x, base, scale * (0.85 + rnd(i * 5.3 + seed) * 0.3));
    }
  }

  function drawStation(T, k) {
    const cx = stationX(k) - G.dist; // экранная координата центра станции
    if (cx < -900 || cx > LW + 900) return;
    // здание вокзала (позади путей)
    const bw = 300;
    const wall = T.id === 'night' ? '#8d6e63' : '#ffe0b2';
    fillRR(cx - bw / 2, RAIL - 196, bw, 190, 6, wall);
    tri(cx - bw / 2 - 26, RAIL - 192, cx + bw / 2 + 26, RAIL - 192, cx, RAIL - 290, T.id === 'winter' ? '#90a4ae' : '#d84315');
    if (T.id === 'winter') tri(cx - 90, RAIL - 222, cx + 90, RAIL - 222, cx, RAIL - 290, '#fff');
    // табличка станции с картинкой вместо названия
    const sign = ['🍎', '🥕', '🎈', '🍓', '🌻', '🧸', '🍪', '🐟'][k % 8];
    fillRR(cx - 34, RAIL - 262, 68, 52, 10, '#fff');
    ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 4; rr(cx - 34, RAIL - 262, 68, 52, 10); ctx.stroke();
    ctx.font = '34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000'; ctx.fillText(sign, cx, RAIL - 235);
    for (let i = -1; i <= 1; i++) fillRR(cx + i * 90 - 22, RAIL - 172, 44, 50, 8, T.id === 'night' ? '#ffd54f' : '#90caf9');
  }
  function drawPlatform(T, k) {
    const cx = stationX(k) - G.dist;
    const pw = platWidth();
    if (cx + pw / 2 < -50 || cx - pw / 2 > LW + 50) return;
    fillRR(cx - pw / 2, PLAT_TOP - 8, pw, 22, 6, T.plat);
    ctx.fillStyle = T.platSide; ctx.fillRect(cx - pw / 2 + 4, PLAT_TOP + 12, pw - 8, 46);
    ctx.fillStyle = '#ffd54f';
    for (let x = cx - pw / 2 + 14; x < cx + pw / 2 - 30; x += 46) ctx.fillRect(x, PLAT_TOP - 6, 26, 5);
  }

  function drawTrack(T) {
    ctx.fillStyle = T.bed;
    ctx.beginPath(); ctx.moveTo(0, RAIL + 2); ctx.lineTo(LW, RAIL + 2); ctx.lineTo(LW, RAIL + 30); ctx.lineTo(0, RAIL + 30); ctx.fill();
    const off = G.dist % 44;
    ctx.fillStyle = '#795548';
    for (let x = -off; x < LW + 44; x += 44) ctx.fillRect(x, RAIL + 4, 24, 12);
    fillRR(-10, RAIL - 2, LW + 20, 8, 3, '#78909c');
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(0, RAIL - 1, LW, 2);
  }

  function drawNear(T) {
    const off = G.dist * 1.25;
    const cell = 140;
    for (let i = Math.floor(off / cell) - 1; i < (off + LW) / cell + 1; i++) {
      if (rnd(i * 4.1) < 0.45) continue;
      const x = i * cell - off + rnd(i * 6.1) * 60, y = 690 + rnd(i * 8.3) * 20;
      if (T.id === 'meadow') { ctx.save(); ctx.translate(x, y); ctx.scale(0.8, 0.8); flowers(); ctx.restore(); }
      else if (T.id === 'winter') { ellipse(x, y, 40, 14, '#ffffff'); }
      else if (T.id === 'desert') { ellipse(x, y, 12, 7, '#bf9b67'); ellipse(x + 20, y + 4, 8, 5, '#a98a5a'); }
      else { const g = 0.5 + 0.5 * Math.sin(G.time * 3 + i); ctx.globalAlpha = 0.5 + g * 0.5; circle(x, y - 40 - g * 10, 4, '#e6ee9c'); ctx.globalAlpha = 1; }
    }
  }

  function initFlakes() {
    G.flakes = [];
    for (let i = 0; i < 90; i++) G.flakes.push({ x: Math.random() * LW, y: Math.random() * LH, r: rand(2, 5), s: rand(30, 70) });
  }
  function drawWeather(T, dt) {
    if (T.id !== 'winter') return;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (const f of G.flakes) {
      f.y += f.s * dt; f.x -= (G.v * 0.6 + 10) * dt + Math.sin(G.time + f.r) * 0.3;
      if (f.y > LH) { f.y = -10; f.x = Math.random() * LW; }
      if (f.x < -10) f.x += LW + 20;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
    }
  }

  // ---------------------------------------------------------------- частицы
  function spawnSmoke() {
    const L = loco();
    if (L.type === 'electric') {
      if (Math.random() < 0.08 && G.v > 50) for (let i = 0; i < 4; i++) G.parts.push({ k: 'spark', x: locoLeft() + 80, y: RAIL - 252, vx: rand(-80, 80), vy: rand(-120, -20), life: 0.4, t: 0, c: '#fff59d' });
      return;
    }
    const x = L.type === 'steam' ? locoLeft() + 184 : locoLeft() + 71;
    const y = L.type === 'steam' ? RAIL - 210 : RAIL - 192;
    G.smoke.push({ x, y, r: L.type === 'steam' ? 14 : 8, t: 0, life: L.type === 'steam' ? 2.2 : 1.2, dark: L.type !== 'steam' });
  }
  function updateSmoke(dt) {
    for (const p of G.smoke) {
      p.t += dt;
      p.x -= (G.v * 0.85 + 22) * dt;
      p.y -= (40 + p.t * 10) * dt;
      p.r += 18 * dt;
    }
    G.smoke = G.smoke.filter((p) => p.t < p.life);
  }
  function drawSmoke() {
    for (const p of G.smoke) {
      ctx.globalAlpha = (1 - p.t / p.life) * 0.85;
      circle(p.x, p.y, p.r, p.dark ? '#9e9e9e' : '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
  function burst(x, y, n, colors, kind) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(120, 360);
      G.parts.push({ k: kind || 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: rand(0.6, 1.1), t: 0, c: pick(colors), r: rand(8, 15), rot: rand(0, 6) });
    }
  }
  function confetti() {
    for (let i = 0; i < 140; i++) {
      G.parts.push({ k: 'conf', x: rand(0, LW), y: rand(-200, -10), vx: rand(-40, 40), vy: rand(120, 260), life: 4, t: 0, c: pick(RAINBOW.concat(['#ffd54f'])), r: rand(6, 11), rot: rand(0, 6) });
    }
  }
  function flyStar(x, y) {
    G.parts.push({ k: 'fly', x, y, sx: x, sy: y, tx: 120 / S, ty: 44 / S, life: 0.7, t: 0 });
  }
  function starShape(x, y, r, rot, c) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const rr2 = i % 2 ? r * 0.45 : r; const a = (i * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
    ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.restore();
  }
  function updateParts(dt) {
    for (const p of G.parts) {
      p.t += dt;
      if (p.k === 'fly') {
        const q = Math.min(1, p.t / p.life), e = q * q;
        p.x = p.sx + (p.tx - p.sx) * e; p.y = p.sy + (p.ty - p.sy) * e - Math.sin(q * Math.PI) * 80;
        if (q >= 1 && !p.done) { p.done = true; addStars(1); }
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.k !== 'conf') p.vy += 500 * dt; else p.x += Math.sin(p.t * 4 + p.rot) * 40 * dt;
        p.rot = (p.rot || 0) + dt * 4;
      }
    }
    G.parts = G.parts.filter((p) => p.t < p.life);
  }
  function drawParts() {
    for (const p of G.parts) {
      const a = p.k === 'conf' ? 1 : 1 - p.t / p.life;
      ctx.globalAlpha = clamp(a, 0, 1);
      if (p.k === 'star') starShape(p.x, p.y, p.r, p.rot, p.c);
      else if (p.k === 'conf') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); }
      else if (p.k === 'spark') circle(p.x, p.y, 3, p.c);
      else if (p.k === 'fly') { ctx.globalAlpha = 1; starShape(p.x, p.y, 20, G.time * 6, '#ffc107'); }
      else if (p.k === 'ring') { ctx.strokeStyle = p.c; ctx.lineWidth = 6 * a; ctx.beginPath(); ctx.arc(p.x, p.y, 20 + p.t * 120, 0, 7); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- шарики
  function updateBalloons(dt) {
    if (G.mode !== 'play') return;
    while (G.nextBalloon < G.dist + LW + 300) {
      const wx = G.nextBalloon;
      G.balloons.push({ wx, y: rand(120, 340), c: pick(['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#fb8c00']), ph: rand(0, 6), popped: false });
      G.nextBalloon += rand(380, 820);
    }
    for (const b of G.balloons) b.y -= 6 * dt;
    G.balloons = G.balloons.filter((b) => !b.popped && b.wx - G.dist > -120 && b.y > -80);
  }
  function balloonPos(b) { return { x: b.wx - G.dist + Math.sin(G.time * 1.2 + b.ph) * 8, y: b.y + Math.sin(G.time * 2 + b.ph) * 6 }; }
  function drawBalloons() {
    for (const b of G.balloons) {
      const p = balloonPos(b);
      ctx.strokeStyle = 'rgba(60,60,60,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y + 44); ctx.quadraticCurveTo(p.x - 10, p.y + 80, p.x + 4, p.y + 110); ctx.stroke();
      ellipse(p.x, p.y, 34, 42, b.c);
      tri(p.x - 7, p.y + 46, p.x + 7, p.y + 46, p.x, p.y + 38, b.c);
      ellipse(p.x - 12, p.y - 14, 8, 13, 'rgba(255,255,255,.45)', -0.4);
      starShape(p.x, p.y + 4, 12, 0, 'rgba(255,255,255,.7)');
    }
  }

  // ---------------------------------------------------------------- станции и пассажиры
  function freeSeats() {
    const out = [];
    for (let w = 0; w < G.nW; w++) for (let i = 0; i < 2; i++) if (!G.seats[w][i]) out.push({ w, i });
    return out;
  }
  function arrive() {
    G.phase = 'station'; G.v = 0; G.stT = 0; G.depT = 0; G.boarded = 0;
    G.lastTap = G.time;
    Sfx.bell();
    // приехавшие пассажиры выходят
    let delay = 0;
    for (let w = 0; w < G.nW; w++) for (let i = 0; i < 2; i++) {
      const a = G.seats[w][i];
      if (!a) continue;
      G.seats[w][i] = null;
      const p = seatPos(w, i);
      a.state = 'leave'; a.t = -delay; a.dur = 0.55;
      a.fx = p.x + G.dist; a.fy = p.y;
      a.tx = p.x + G.dist + 30; a.ty = PLAT_TOP - 86;
      a.seat = null;
      delay += 0.15;
    }
    // новые пассажиры ждут на платформе
    const n = Math.min(G.nW * 2, 2 + (Math.random() < 0.5 ? 1 : 0) + (G.k > 1 && G.nW > 1 ? 1 : 0));
    const types = ANIMAL_TYPES.slice().sort(() => Math.random() - 0.5);
    const cx = stationX(G.k);
    const spread = Math.min(130, (platWidth() - 160) / Math.max(1, n));
    for (let j = 0; j < n; j++) {
      G.animals.push({
        type: types[j % types.length], state: 'enter', t: -0.6 - delay - j * 0.25, seed: Math.random() * 10,
        wx: cx - ((n - 1) / 2) * spread + j * spread, seat: null, hop: 0,
      });
    }
  }
  function depart() {
    G.phase = 'run'; G.k += 1; G.stationsDone += 1;
    honk(true);
    for (let i = 0; i < 4; i++) spawnSmoke();
    renderProgress();
    if (G.stationsDone % TRIP === 0) celebrate();
  }
  function celebrate() {
    G.celebrateT = 3.2;
    confetti();
    Sfx.fanfare();
    addStars(5);
  }
  function boardAnimal(a) {
    const seats = freeSeats();
    if (!seats.length) return;
    const ax = a.wx - G.dist;
    seats.sort((s1, s2) => Math.abs(seatPos(s1.w, s1.i).x - ax) - Math.abs(seatPos(s2.w, s2.i).x - ax));
    const s = seats[0];
    G.seats[s.w][s.i] = a;
    a.seat = s; a.state = 'jump'; a.t = 0; a.dur = 0.6;
    a.fx = a.wx; a.fy = PLAT_TOP - 86;
    const p = seatPos(s.w, s.i);
    a.tx = p.x + G.dist; a.ty = p.y;
    Sfx.voice(a.type);
    Sfx.boing();
    G.boarded = (G.boarded || 0) + 1;
  }
  function jumperPos(a) {
    const q = clamp(a.t / a.dur, 0, 1);
    return {
      x: a.fx + (a.tx - a.fx) * q - G.dist,
      y: a.fy + (a.ty - a.fy) * q - Math.sin(q * Math.PI) * 140,
      q,
    };
  }
  function drawJumper(a) {
    const p = jumperPos(a);
    drawAnimal(a.type, p.x, p.y, a.state === 'jump' ? 0.95 + 0.1 * Math.sin(p.q * Math.PI) : 1, { happy: true, seed: a.seed, rot: (p.q - 0.5) * 0.4 });
  }
  function updateAnimals(dt) {
    for (const a of G.animals) {
      a.t += dt;
      if (a.hop > 0) a.hop = Math.max(0, a.hop - dt * 2.5);
      if (a.state === 'enter' && a.t >= 0) { if (a.t > 0.35) { a.state = 'wait'; a.t = 0; } }
      else if (a.state === 'jump' && a.t >= a.dur) {
        a.state = 'seated'; a.hop = 1;
        const p = seatPos(a.seat.w, a.seat.i);
        burst(p.x, p.y - 20, 6, ['#ffd54f', '#fff59d', '#ff8a80']);
        Sfx.note(G.boarded + 1);
        if (!G.animals.some((b) => b.state === 'wait' || b.state === 'enter' || b.state === 'jump')) allAboard();
      } else if (a.state === 'leave' && a.t > a.dur + 1.6) a.state = 'gone';
    }
    G.animals = G.animals.filter((a) => a.state !== 'gone');
  }
  function allAboard() {
    Sfx.fanfare();
    for (let w = 0; w < G.nW; w++) burst(wagonLeft(w) + WAG_LEN / 2, RAIL - 140, 8, ['#ffd54f', '#ffeb3b', '#ff80ab', '#80d8ff']);
    for (const a of G.animals) if (a.state === 'seated') a.hop = 1;
  }
  function drawPlatformAnimals() {
    let hintShown = false;
    for (const a of G.animals) {
      if (a.state === 'enter') {
        if (a.t < 0) continue;
        const q = clamp(a.t / 0.35, 0, 1);
        const sc = q < 0.7 ? q / 0.7 * 1.15 : 1.15 - (q - 0.7) / 0.3 * 0.15;
        drawAnimal(a.type, a.wx - G.dist, PLAT_TOP - 86, sc, { body: true, seed: a.seed });
      } else if (a.state === 'wait') {
        const idle = G.time - G.lastTap > 3.5;
        const bounce = idle ? Math.abs(Math.sin(G.time * 5 + a.seed)) * 10 : Math.abs(Math.sin(G.time * 2 + a.seed)) * 3;
        const x = a.wx - G.dist, y = PLAT_TOP - 86 - bounce;
        drawAnimal(a.type, x, y, 1, { body: true, seed: a.seed, wave: idle });
        if (idle && !hintShown) {
          hintShown = true;
          ctx.font = '64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('👆', x + 30, y + 130 + Math.sin(G.time * 6) * 10);
        }
      } else if (a.state === 'jump' && a.t / a.dur <= 0.72) {
        drawJumper(a);
      } else if (a.state === 'leave') {
        if (a.t < 0) continue;
        if (a.t < a.dur) drawJumper(a);
        else {
          const w = a.t - a.dur;
          drawAnimal(a.type, a.tx - G.dist - w * 90, a.ty - Math.abs(Math.sin(w * 9)) * 8, 1, { body: true, seed: a.seed, alpha: 1 - w / 1.6, happy: true, wave: true });
        }
      }
    }
  }

  // ---------------------------------------------------------------- update
  function honk(auto) {
    Sfx.honk();
    G.honkT = 0.6;
    for (let i = 0; i < 3; i++) spawnSmoke();
    if (!auto) G.lastTap = G.time;
  }
  function update(dt) {
    G.time += dt;
    G.honkT = Math.max(0, G.honkT - dt);
    G.celebrateT = Math.max(0, G.celebrateT - dt);
    for (const k in G.wiggleW) G.wiggleW[k] = Math.max(0, G.wiggleW[k] - dt * 2);

    if (G.mode === 'menu') {
      G.v += (120 - G.v) * Math.min(1, dt * 2);
      G.dist += G.v * dt;
    } else if (G.phase === 'run') {
      G.boostT = Math.max(0, G.boostT - dt);
      const target = G.boostT > 0 ? BOOST : CRUISE;
      const d = stopDist(G.k) - G.dist;
      if (G.v < target) G.v = Math.min(target, G.v + ACC * dt); else G.v = Math.max(target, G.v - BRAKE * dt);
      const vStop = Math.sqrt(2 * BRAKE * Math.max(d, 0));
      if (G.v > vStop) G.v = Math.max(vStop, Math.min(G.v, 14));
      G.dist = Math.min(G.dist + G.v * dt, stopDist(G.k));
      if (stopDist(G.k) - G.dist < 0.5) { G.dist = stopDist(G.k); arrive(); }
    } else if (G.phase === 'station') {
      G.stT += dt;
      const busy = G.animals.some((a) => a.state === 'enter' || a.state === 'wait' || a.state === 'jump');
      if (!busy && G.stT > 1.2) { G.depT += dt; if (G.depT > 1.3) depart(); }
    }

    // ритм «чух-чух»
    if (G.v > 5) {
      G.chugT -= dt;
      if (G.chugT <= 0) {
        G.chugT = clamp(0.95 - G.v / 400, 0.2, 0.95);
        if (G.mode === 'play') Sfx.chug();
        if (loco().type !== 'electric' || Math.random() < 0.3) spawnSmoke();
      }
    } else if (Math.random() < dt * 1.5) spawnSmoke();

    updateSmoke(dt);
    updateParts(dt);
    updateBalloons(dt);
    updateAnimals(dt);
  }

  // ---------------------------------------------------------------- render
  function render(dt) {
    ctx.setTransform(DPR * S, 0, 0, DPR * S, 0, 0);
    const T = world();
    drawSky(T);
    hills(0.12, 400, 40, 0.004, T.far, 1);
    hills(0.28, 465, 26, 0.007, T.mid, 4);
    ctx.fillStyle = T.ground; ctx.fillRect(0, 500, LW, LH - 500);
    ctx.fillStyle = T.ground2; ctx.fillRect(0, 640, LW, LH - 640);
    layer(T, 0.5, 230, 508, 0.8, 11, 0.75);
    if (G.mode === 'play') { drawStation(T, G.k); if (G.k > 0) drawStation(T, G.k - 1); }
    drawTrack(T);
    drawTrain();
    drawSmoke();
    if (G.mode === 'play') {
      drawPlatform(T, G.k); if (G.k > 0) drawPlatform(T, G.k - 1);
      drawPlatformAnimals();
    }
    drawNear(T);
    drawBalloons();
    drawWeather(T, dt);
    drawParts();
    if (G.celebrateT > 0) {
      const q = 1 - G.celebrateT / 3.2;
      const s = q < 0.15 ? q / 0.15 : 1;
      ctx.save();
      ctx.translate(LW / 2, 230); ctx.scale(s, s); ctx.rotate(Math.sin(G.time * 5) * 0.05);
      ctx.font = '900 120px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 14; ctx.strokeStyle = '#e53935'; ctx.strokeText('Ура!', 0, 0);
      ctx.fillStyle = '#fff'; ctx.fillText('Ура!', 0, 0);
      ctx.restore();
    }
  }

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt);
    render(dt);
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- input
  function hitTest(lx, ly) {
    if (G.mode !== 'play') return;
    G.lastTap = G.time;
    // шарики
    for (const b of G.balloons) {
      const p = balloonPos(b);
      if ((lx - p.x) ** 2 / 46 ** 2 + (ly - p.y) ** 2 / 56 ** 2 < 1) {
        b.popped = true;
        Sfx.pop();
        burst(p.x, p.y, 10, [b.c, '#fff', '#ffd54f']);
        G.parts.push({ k: 'ring', x: p.x, y: p.y, life: 0.35, t: 0, c: b.c });
        flyStar(p.x, p.y);
        return;
      }
    }
    // зверята на платформе
    if (G.phase === 'station') {
      for (const a of G.animals) {
        if (a.state !== 'wait' && !(a.state === 'enter' && a.t >= 0)) continue;
        const x = a.wx - G.dist, y = PLAT_TOP - 86;
        if (Math.abs(lx - x) < 60 && ly > y - 70 && ly < y + 110) { boardAnimal(a); return; }
      }
    }
    // паровоз
    if (lx > locoLeft() - 10 && lx < G.frontX + 20 && ly > RAIL - 260 && ly < RAIL + 10) { honk(); return; }
    // вагоны
    for (let w = 0; w < G.nW; w++) {
      const x = wagonLeft(w);
      if (lx > x && lx < x + WAG_LEN && ly > RAIL - 170 && ly < RAIL + 10) {
        G.wiggleW[w] = 1;
        const riders = G.animals.filter((a) => a.state === 'seated' && a.seat.w === w);
        riders.forEach((a) => { a.hop = 1; });
        riders.length ? Sfx.giggle() : Sfx.bonk();
        return;
      }
    }
    // просто тап — искорки и ускорение
    burst(lx, ly, 5, ['#ffd54f', '#ffffff', '#80d8ff']);
    Sfx.sparkle();
    if (G.phase === 'run') G.boostT = 1.6;
  }
  cv.addEventListener('pointerdown', (e) => {
    Sfx.ensure();
    hitTest(e.clientX / S, e.clientY / S);
  });

  // ---------------------------------------------------------------- UI
  const ui = { menu: $('menu'), hud: $('hud'), gate: $('gate'), parents: $('parents'), paywall: $('paywall') };
  let gateCb = null, gateSeq = [], gateInput = [];
  let selPlan = 'yearly';

  function show(el, on) { el.classList.toggle('hidden', !on); }
  function addStars(n) {
    stars += n;
    store.set('stars', stars);
    $('starCount').textContent = stars;
    const el = $('stars'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
  function renderProgress() {
    const done = G.stationsDone % TRIP;
    $('progress').innerHTML = Array.from({ length: TRIP }, (_, i) => '<i class="' + (i < done ? 'on' : '') + '"></i>').join('');
  }
  function locoSvg(L) {
    const c = L.body, cab = L.cab;
    const nose = L.type === 'steam'
      ? '<rect x="34" y="30" width="44" height="26" rx="13" fill="' + c + '"/><rect x="62" y="16" width="9" height="16" fill="#37474f"/>'
      : '<rect x="34" y="22" width="48" height="34" rx="' + (L.type === 'electric' ? 14 : 5) + '" fill="' + c + '"/>' +
        (L.type === 'electric' ? '<path d="M52 22 L60 10 L52 4" stroke="#455a64" stroke-width="3" fill="none"/>' : '');
    return '<svg viewBox="0 0 90 70" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="8" y="16" width="32" height="42" rx="5" fill="' + cab + '"/><rect x="14" y="22" width="18" height="14" rx="3" fill="#b3e5fc"/>' +
      nose + '<rect x="6" y="54" width="76" height="6" rx="3" fill="#37474f"/>' +
      '<circle cx="22" cy="62" r="7" fill="#37474f"/><circle cx="44" cy="62" r="7" fill="#37474f"/><circle cx="66" cy="62" r="7" fill="#37474f"/>' +
      (L.rainbow ? '<rect x="40" y="30" width="5" height="26" fill="#fdd835"/><rect x="48" y="30" width="5" height="26" fill="#43a047"/><rect x="56" y="30" width="5" height="26" fill="#1e88e5"/>' : '') +
      '</svg>';
  }
  function buildMenu() {
    const mk = (item, kind) => {
      const b = document.createElement('button');
      const sel = kind === 'world' ? settings.world === item.id : settings.loco === item.id;
      b.className = 'pick' + (sel ? ' sel' : '') + (isUnlocked(item) ? '' : ' locked');
      b.setAttribute('aria-label', item.name);
      if (kind === 'world') { b.style.background = item.card; b.innerHTML = '<span>' + item.icon + '</span>'; }
      else { b.style.background = '#fff'; b.innerHTML = locoSvg(item); }
      if (!isUnlocked(item)) b.innerHTML += '<span class="lock">🔒</span>';
      b.addEventListener('click', () => {
        Sfx.ensure();
        if (!isUnlocked(item)) {
          b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
          Sfx.bonk();
          openGate(() => openPaywall());
          return;
        }
        if (kind === 'world') { settings.world = item.id; store.set('world', item.id); }
        else { settings.loco = item.id; store.set('loco', item.id); honk(true); }
        Sfx.pop();
        buildMenu();
      });
      return b;
    };
    const wr = $('worlds'), lr = $('locos');
    wr.innerHTML = ''; lr.innerHTML = '';
    WORLDS.forEach((w) => wr.appendChild(mk(w, 'world')));
    LOCOS.forEach((l) => lr.appendChild(mk(l, 'loco')));
  }

  function startGame() {
    Sfx.ensure();
    // если выбранное стало недоступно (подписка закончилась) — возвращаемся к бесплатному
    if (!isUnlocked(world())) settings.world = 'meadow';
    if (!isUnlocked(loco())) settings.loco = 'red';
    Object.assign(G, { mode: 'play', dist: 0, v: 0, phase: 'run', k: 0, stationsDone: 0, animals: [], balloons: [], parts: [], nextBalloon: 700, boostT: 0, celebrateT: 0, lastTap: G.time });
    setWagons(G.nW); G.seats = G.seats.map(() => [null, null]);
    show(ui.menu, false); show(ui.hud, true);
    renderProgress();
    honk(true);
    Music.start();
  }
  function toMenu() {
    Music.stop();
    G.mode = 'menu'; G.animals = []; G.balloons = []; G.seats = G.seats.map(() => [null, null]);
    show(ui.hud, false); show(ui.menu, true);
    buildMenu();
  }

  // --- родительский контроль: три цифры, записанные словами
  const WORDS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  function openGate(cb) {
    gateCb = cb;
    gateSeq = [];
    while (gateSeq.length < 3) { const d = 1 + ((Math.random() * 9) | 0); if (!gateSeq.includes(d)) gateSeq.push(d); }
    gateInput = [];
    $('gateTask').textContent = gateSeq.map((d) => WORDS[d]).join(', ');
    const pad = $('gatePad');
    pad.innerHTML = '';
    for (let d = 1; d <= 9; d++) {
      const b = document.createElement('button');
      b.textContent = d;
      b.addEventListener('click', () => gatePress(d));
      pad.appendChild(b);
    }
    const zero = document.createElement('button'); zero.textContent = '0'; zero.addEventListener('click', () => gatePress(0)); pad.appendChild(zero);
    renderGateDots();
    show(ui.gate, true);
  }
  function renderGateDots() { $('gateDots').innerHTML = [0, 1, 2].map((i) => '<i class="' + (i < gateInput.length ? 'on' : '') + '"></i>').join(''); }
  function gatePress(d) {
    gateInput.push(d);
    renderGateDots();
    if (gateInput.length < 3) return;
    if (gateInput.every((v, i) => v === gateSeq[i])) {
      show(ui.gate, false);
      const cb = gateCb; gateCb = null;
      if (cb) cb();
    } else {
      const card = ui.gate.querySelector('.card');
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      setTimeout(() => openGate(gateCb), 450);
    }
  }

  // --- раздел для взрослых
  function openParents() { renderParents(); show(ui.parents, true); }
  function renderParents() {
    $('btnSound').classList.toggle('on', settings.sound);
    $('btnMusic').classList.toggle('on', settings.music);
    $('subStatus').textContent = premium ? 'Подписка активна — все миры и поезда открыты' : 'Открывает 3 мира и 3 поезда';
    $('btnSub').textContent = premium ? 'Управлять' : 'Подробнее';
    show($('demoNote'), !Billing.state.native);
  }

  // --- подписка
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function parsePeriod(p) {
    const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(p || '');
    if (!m) return null;
    return { y: +m[1] || 0, m: +m[2] || 0, w: +m[3] || 0, d: +m[4] || 0 };
  }
  function periodText(p, forPrice) {
    const q = parsePeriod(p);
    if (!q) return '';
    if (q.y) return q.y === 1 ? (forPrice ? 'год' : '1 год') : q.y + ' ' + plural(q.y, 'год', 'года', 'лет');
    if (q.m) return q.m === 1 ? (forPrice ? 'месяц' : '1 месяц') : q.m + ' ' + plural(q.m, 'месяц', 'месяца', 'месяцев');
    const days = q.w * 7 + q.d;
    if (forPrice && days === 7) return 'неделю';
    return days + ' ' + plural(days, 'день', 'дня', 'дней');
  }
  function planName(p) { return parsePeriod(p.period) && parsePeriod(p.period).y ? 'На год' : 'На месяц'; }
  function openPaywall() { renderPaywall(); show(ui.paywall, true); }
  function renderPaywall() {
    const st = Billing.state;
    const plans = $('plans'), buy = $('btnBuy'), terms = $('payTerms');
    const msg = $('payMsg');
    msg.textContent = st.message ? st.message.text : '';
    msg.classList.toggle('err', !!(st.message && st.message.error));
    if (premium) {
      plans.innerHTML = '<div class="plan sel" style="grid-column:1/-1"><b>Подписка активна ✓</b><span class="muted">Все миры и поезда открыты. Спасибо!</span></div>';
      buy.textContent = 'Управлять подпиской в Google Play';
      buy.disabled = false;
      buy.onclick = () => Billing.manage();
      terms.textContent = 'Отменить или изменить подписку можно в любой момент в Google Play → Платежи и подписки.';
      return;
    }
    const list = st.products.slice().sort((a, b) => (parsePeriod(b.period) || {}).y - (parsePeriod(a.period) || {}).y);
    if (!list.length) {
      plans.innerHTML = '<div class="muted" style="grid-column:1/-1">Загружаем цены из Google Play…</div>';
      buy.textContent = 'Оформить подписку'; buy.disabled = true; terms.textContent = '';
      return;
    }
    if (!list.some((p) => p.planId === selPlan)) selPlan = list[0].planId;
    plans.innerHTML = '';
    list.forEach((p) => {
      const b = document.createElement('button');
      b.className = 'plan' + (p.planId === selPlan ? ' sel' : '');
      b.innerHTML = (p.trial ? '<span class="badge">' + periodText(p.trial) + ' бесплатно</span>' : '') +
        '<b>' + planName(p) + '</b><div class="price">' + p.price + '</div><span class="muted">за ' + periodText(p.period, true) + '</span>';
      b.addEventListener('click', () => { selPlan = p.planId; renderPaywall(); });
      plans.appendChild(b);
    });
    const p = list.find((x) => x.planId === selPlan);
    buy.disabled = false;
    buy.textContent = p.trial ? 'Попробовать ' + periodText(p.trial) + ' бесплатно' : 'Оформить за ' + p.price;
    buy.onclick = () => Billing.purchase(p.planId);
    terms.textContent = (p.trial ? 'Первые ' + periodText(p.trial) + ' бесплатно, затем ' : '') + p.price + ' за ' + periodText(p.period, true) +
      '. Подписка продлевается автоматически, пока вы её не отмените. Отменить можно в любой момент в Google Play → Платежи и подписки' +
      (p.trial ? ' — если отменить до конца пробного периода, оплаты не будет.' : '.');
  }

  // --- обработчики
  $('btnPlay').addEventListener('click', startGame);
  $('btnHome').addEventListener('click', () => { Sfx.pop(); toMenu(); });
  $('btnHonk').addEventListener('click', () => honk());
  $('btnParents').addEventListener('click', () => openGate(openParents));
  $('btnSound').addEventListener('click', () => {
    settings.sound = !settings.sound; store.set('sound', settings.sound); renderParents();
    if (settings.sound) Sfx.pop(); else Music.stop();
  });
  $('btnMusic').addEventListener('click', () => {
    settings.music = !settings.music; store.set('music', settings.music); renderParents();
    if (!settings.music) Music.stop();
    // в меню музыка не играет — включится при следующей поездке
  });
  $('btnSub').addEventListener('click', () => { if (premium) Billing.manage(); else { show(ui.parents, false); openPaywall(); } });
  $('btnRestore').addEventListener('click', () => { Billing.restore(); });
  $('payRestore').addEventListener('click', (e) => { e.preventDefault(); Billing.restore(); });
  $('demoReset').addEventListener('click', (e) => { e.preventDefault(); Billing.resetDemo(); });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => {
    show($(b.dataset.close), false);
    if (b.dataset.close === 'gate') gateCb = null;
  }));
  // Внешние ссылки (политика, условия) открываются из раздела для взрослых — за «родительским замком».

  Billing.onChange((st, evt) => {
    const was = premium;
    premium = st.premium;
    if (was !== premium && G.mode === 'menu') buildMenu();
    if (!ui.paywall.classList.contains('hidden')) renderPaywall();
    if (!ui.parents.classList.contains('hidden')) renderParents();
    if (evt === 'purchased') {
      show(ui.paywall, false);
      confetti(); Sfx.fanfare();
      G.celebrateT = 3.2;
      buildMenu();
    }
  });

  // Кнопка «Назад» на Android: true — обработали сами, false — можно закрыть приложение
  window.handleBack = function () {
    if (!ui.gate.classList.contains('hidden')) { show(ui.gate, false); gateCb = null; return true; }
    if (!ui.paywall.classList.contains('hidden')) { show(ui.paywall, false); return true; }
    if (!ui.parents.classList.contains('hidden')) { show(ui.parents, false); return true; }
    if (G.mode === 'play') { toMenu(); return true; }
    return false;
  };

  document.addEventListener('visibilitychange', () => {
    if (!Sfx.ac) return;
    if (document.hidden) Sfx.ac.suspend(); else if (settings.sound) Sfx.ac.resume();
  });
  window.addEventListener('resize', resize);
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------------------------------------------------------------- start
  resize();
  setWagons(G.nW);
  $('starCount').textContent = stars;
  Billing.init();
  premium = Billing.state.premium;
  buildMenu();
  requestAnimationFrame(frame);

  // для тестов
  window.__game = { G, startGame, toMenu, openGate, openPaywall, openParents, get gateSeq() { return gateSeq; } };
})();
