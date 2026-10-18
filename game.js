/**
 * Swipe Slicer — YouTube Playables complete build
 * Required SDK: firstFrameReady, gameReady, pause/resume, audio, save/load, sendScore
 * Fully responsive (all aspect ratios). No ads / monetization.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('combo');
  const missesEl = document.getElementById('misses');
  const bestEl = document.getElementById('best');
  const themeEl = document.getElementById('theme');
  const startScreen = document.getElementById('start-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const pausedScreen = document.getElementById('paused-screen');
  const finalStats = document.getElementById('final-stats');
  const playBtn = document.getElementById('play-btn');
  const retryBtn = document.getElementById('retry-btn');

  const inPlayables = typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV;

  function safe(fn) {
    try { return fn(); } catch (e) {
      console.warn('[Playables]', e);
      try { if (inPlayables) ytgame.health.logError(); } catch (_) {}
    }
  }
  async function safeAsync(fn, fallback) {
    try { return await fn(); } catch (e) {
      console.warn('[Playables async]', e);
      try { if (inPlayables) ytgame.health.logError(); } catch (_) {}
      return fallback;
    }
  }

  // Responsive canvas — required for all Playables aspect ratios
  let W = 800, H = 600, dpr = 1;

  function resize() {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    if (w < 2 || h < 2) return; // hidden WebView during pre-roll
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w;
    H = h;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  let score = 0;
  let maxCombo = 0;
  let misses = 0;
  let highScore = 0;
  let gameRunning = false;
  let isPaused = false;
  let shapes = [];
  let particles = [];
  let floaters = [];
  let swipePath = [];
  let isSwiping = false;
  let shake = 0;
  let spawnTimer = 0;
  let difficulty = 1;
  let firstFrameSent = false;
  let gameReadySent = false;
  let audioEnabled = true;
  let bgStars = [];

  const COLORS = ['#ff3b5c', '#00d4ff', '#39ff14', '#ffd700', '#c300ff', '#ff8c00'];
  const THEMES = [
    { name: 'Classic', shapes: ['circle', 'square', 'triangle'] },
    { name: 'Crystal', shapes: ['diamond', 'star', 'circle'] },
    { name: 'Geo', shapes: ['hexagon', 'triangle', 'square'] }
  ];
  const dayTheme = THEMES[new Date().getDate() % THEMES.length];
  themeEl.textContent = dayTheme.name + ' set';

  function initStars() {
    bgStars = [];
    for (let i = 0; i < 60; i++) {
      bgStars.push({
        x: Math.random(), y: Math.random(),
        r: 0.5 + Math.random() * 1.5,
        a: 0.15 + Math.random() * 0.4
      });
    }
  }
  initStars();

  class Shape {
    constructor() {
      const margin = 40;
      this.x = margin + Math.random() * Math.max(10, W - margin * 2);
      this.y = H + 40;
      this.type = dayTheme.shapes[Math.floor(Math.random() * dayTheme.shapes.length)];
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.size = Math.max(18, Math.min(W, H) * 0.04) + Math.random() * 10;
      this.vx = (Math.random() - 0.5) * (2.5 + difficulty * 0.4);
      this.vy = -(7 + Math.random() * 5 + difficulty * 0.5);
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.18;
      this.gravity = 0.12 + difficulty * 0.01;
      this.isBomb = Math.random() < (0.06 + difficulty * 0.01);
      if (this.isBomb) this.color = '#ff2244';
    }
    update(dt) {
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotSpeed * dt;
      if (this.x < this.size) { this.x = this.size; this.vx *= -0.75; }
      if (this.x > W - this.size) { this.x = W - this.size; this.vx *= -0.75; }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 18;
      ctx.shadowColor = this.color;

      if (this.isBomb) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.floor(this.size) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 1);
      } else {
        drawShapePath(this.type, this.size);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawShapePath(type, s) {
    ctx.beginPath();
    if (type === 'circle') {
      ctx.arc(0, 0, s, 0, Math.PI * 2);
    } else if (type === 'square') {
      ctx.rect(-s, -s, s * 2, s * 2);
    } else if (type === 'triangle') {
      ctx.moveTo(0, -s); ctx.lineTo(s, s); ctx.lineTo(-s, s); ctx.closePath();
    } else if (type === 'diamond') {
      ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath();
    } else if (type === 'hexagon') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const fn = i === 0 ? ctx.moveTo : ctx.lineTo;
        fn.call(ctx, Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.closePath();
    } else {
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        const fn = i === 0 ? ctx.moveTo : ctx.lineTo;
        fn.call(ctx, Math.cos(a1) * s, Math.sin(a1) * s);
        ctx.lineTo(Math.cos(a2) * s * 0.45, Math.sin(a2) * s * 0.45);
      }
      ctx.closePath();
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x; this.y = y;
      this.vx = (Math.random() - 0.5) * 10;
      this.vy = (Math.random() - 0.5) * 10 - 2;
      this.life = 1;
      this.decay = 0.018 + Math.random() * 0.02;
      this.color = color;
      this.size = 3 + Math.random() * 5;
    }
    update(dt) {
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.vy += 0.15 * dt; this.life -= this.decay * dt;
    }
    draw() {
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.globalAlpha = 1;
    }
  }

  class Floater {
    constructor(x, y, text, color) {
      this.x = x; this.y = y; this.text = text; this.color = color;
      this.life = 1; this.vy = -1.2;
    }
    update(dt) { this.y += this.vy * dt; this.life -= 0.015 * dt; }
    draw() {
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.font = 'bold 18px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y);
      ctx.globalAlpha = 1;
    }
  }

  function pointInShape(px, py, s) {
    const dx = px - s.x, dy = py - s.y;
    return Math.sqrt(dx * dx + dy * dy) < s.size * 1.25;
  }

  function processSwipe() {
    if (swipePath.length < 2 || !gameRunning || isPaused) return;
    let lastColor = null, chain = 0, swipeScore = 0;

    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      let hit = false;
      for (let j = 0; j < swipePath.length; j++) {
        if (pointInShape(swipePath[j].x, swipePath[j].y, s)) { hit = true; break; }
      }
      if (!hit) continue;

      if (s.isBomb) { shake = 18; endGame(); return; }

      if (s.color === lastColor) chain++;
      else { chain = 1; lastColor = s.color; }

      const mult = 1 + (chain - 1) * 0.6;
      const pts = Math.floor(40 * mult * (1 + difficulty * 0.05));
      swipeScore += pts;

      for (let k = 0; k < 14; k++) particles.push(new Particle(s.x, s.y, s.color));
      floaters.push(new Floater(s.x, s.y - 10, '+' + pts, s.color));
      if (chain >= 3) {
        floaters.push(new Floater(s.x, s.y - 30, chain + 'x COMBO!', '#ffd700'));
        shake = Math.min(12, chain);
      }
      shapes.splice(i, 1);
    }

    if (swipeScore > 0) {
      score += swipeScore;
      maxCombo = Math.max(maxCombo, chain);
      scoreEl.textContent = score;
      comboEl.textContent = chain > 1 ? chain + 'x combo' : '';
      setTimeout(function () { if (gameRunning) comboEl.textContent = ''; }, 900);
    }
  }

  function updateMissesUI() {
    missesEl.textContent = '♥'.repeat(Math.max(0, 3 - misses)) + '♡'.repeat(misses);
  }

  let lastTime = performance.now();
  function tick(now) {
    const rawDt = (now - lastTime) / 16.67;
    lastTime = now;
    const dt = Math.min(rawDt, 2.5);

    if (gameRunning && !isPaused) {
      difficulty = 1 + score / 2500;
      spawnTimer -= dt;
      if (spawnTimer <= 0 && shapes.length < 10 + Math.floor(difficulty)) {
        shapes.push(new Shape());
        spawnTimer = Math.max(18, 38 - difficulty * 3);
      }

      for (let i = shapes.length - 1; i >= 0; i--) {
        shapes[i].update(dt);
        if (shapes[i].y > H + 60) {
          if (!shapes[i].isBomb) {
            misses++;
            updateMissesUI();
            shake = 6;
            if (misses >= 3) endGame();
          }
          shapes.splice(i, 1);
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      for (let i = floaters.length - 1; i >= 0; i--) {
        floaters[i].update(dt);
        if (floaters[i].life <= 0) floaters.splice(i, 1);
      }
      if (shake > 0) shake *= 0.85;
      if (shake < 0.3) shake = 0;
    }

    draw();
    requestAnimationFrame(tick);
  }

  function draw() {
    const ox = shake ? (Math.random() - 0.5) * shake : 0;
    const oy = shake ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(ox, oy);

    ctx.fillStyle = '#07071a';
    ctx.fillRect(-10, -10, W + 20, H + 20);

    for (let i = 0; i < bgStars.length; i++) {
      const st = bgStars[i];
      ctx.globalAlpha = st.a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const step = Math.max(40, Math.min(W, H) / 12);
    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    for (let i = 0; i < shapes.length; i++) shapes[i].draw();
    for (let i = 0; i < particles.length; i++) particles[i].draw();
    for (let i = 0; i < floaters.length; i++) floaters[i].draw();

    if (swipePath.length > 1) {
      ctx.strokeStyle = 'rgba(255,215,0,0.9)';
      ctx.lineWidth = 7;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(swipePath[0].x, swipePath[0].y);
      for (let i = 1; i < swipePath.length; i++) ctx.lineTo(swipePath[i].x, swipePath[i].y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    if (!firstFrameSent) {
      firstFrameSent = true;
      if (inPlayables) safe(function () { ytgame.game.firstFrameReady(); });
    }
  }

  function canvasPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (W / r.width),
      y: (clientY - r.top) * (H / r.height)
    };
  }

  function startSwipe(x, y) {
    if (!gameRunning || isPaused) return;
    isSwiping = true;
    swipePath = [{ x: x, y: y }];
  }
  function moveSwipe(x, y) {
    if (!isSwiping) return;
    swipePath.push({ x: x, y: y });
    if (swipePath.length > 40) swipePath.shift();
  }
  function endSwipe() {
    if (!isSwiping) return;
    isSwiping = false;
    processSwipe();
    swipePath = [];
  }

  canvas.addEventListener('mousedown', function (e) {
    const p = canvasPos(e.clientX, e.clientY);
    startSwipe(p.x, p.y);
  });
  canvas.addEventListener('mousemove', function (e) {
    const p = canvasPos(e.clientX, e.clientY);
    moveSwipe(p.x, p.y);
  });
  canvas.addEventListener('mouseup', endSwipe);
  canvas.addEventListener('mouseleave', endSwipe);

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    const t = e.touches[0];
    const p = canvasPos(t.clientX, t.clientY);
    startSwipe(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    const t = e.touches[0];
    const p = canvasPos(t.clientX, t.clientY);
    moveSwipe(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    endSwipe();
  }, { passive: false });
  canvas.addEventListener('touchcancel', endSwipe);

  async function loadSave() {
    if (inPlayables) {
      const raw = await safeAsync(function () { return ytgame.game.loadData(); }, null);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (typeof d.highScore === 'number') highScore = d.highScore;
        } catch (_) {}
      }
    } else {
      highScore = parseInt(localStorage.getItem('ss_hi') || '0', 10) || 0;
    }
    bestEl.textContent = 'Best ' + highScore;
  }

  async function saveHi() {
    if (score > highScore) {
      highScore = score;
      bestEl.textContent = 'Best ' + highScore;
    }
    const payload = JSON.stringify({ highScore: highScore });
    if (inPlayables) {
      await safeAsync(function () { return ytgame.game.saveData(payload); }, null);
    } else {
      localStorage.setItem('ss_hi', String(highScore));
    }
  }

  async function reportScore() {
    if (!inPlayables) return;
    const v = Math.max(score, highScore);
    await safeAsync(function () { return ytgame.engagement.sendScore({ value: v }); }, null);
  }

  function show(el) { el.classList.add('visible'); }
  function hide(el) { el.classList.remove('visible'); }

  function startRun() {
    score = 0; maxCombo = 0; misses = 0; difficulty = 1;
    shapes = []; particles = []; floaters = []; swipePath = [];
    spawnTimer = 10; shake = 0;
    scoreEl.textContent = '0';
    comboEl.textContent = '';
    updateMissesUI();
    hide(startScreen); hide(gameoverScreen); hide(pausedScreen);
    gameRunning = true; isPaused = false;
  }

  function endGame() {
    if (!gameRunning) return;
    gameRunning = false;
    finalStats.innerHTML = 'Score <strong>' + score + '</strong><br>Best combo <strong>' + maxCombo + 'x</strong>';
    show(gameoverScreen);
    saveHi();
    reportScore();
  }

  function pauseGame() {
    isPaused = true;
    show(pausedScreen);
    saveHi();
  }
  function resumeGame() {
    isPaused = false;
    hide(pausedScreen);
  }
  function setAudio(on) { audioEnabled = on; }

  playBtn.addEventListener('click', startRun);
  retryBtn.addEventListener('click', startRun);

  async function init() {
    await loadSave();
    if (inPlayables) {
      setAudio(ytgame.system.isAudioEnabled());
      ytgame.system.onAudioEnabledChange(setAudio);
      ytgame.system.onPause(pauseGame);
      ytgame.system.onResume(resumeGame);
    }
    requestAnimationFrame(tick);
    requestAnimationFrame(function () {
      if (!gameReadySent) {
        gameReadySent = true;
        if (inPlayables) safe(function () { ytgame.game.gameReady(); });
      }
    });
  }

  init();
})();
