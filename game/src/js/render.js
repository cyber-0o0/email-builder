'use strict';
/* ===== Rendering: backgrounds, structure layer, frame composition ===== */
const Render = {
  cv: null, ctx: null, bg: null, bgx: null, st: null, stx: null, vig: null,
  W: 0, H: 0, dpr: 1, clouds: [], amb: [],

  init(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.bg = document.createElement('canvas'); this.bgx = this.bg.getContext('2d');
    this.st = document.createElement('canvas'); this.stx = this.st.getContext('2d');
    this.vig = document.createElement('canvas');
    initPatterns(this.ctx);
  },

  resize() {
    const W = window.innerWidth, H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, W * H > 1400000 ? 1.5 : 2);
    this.W = W; this.H = H; this.dpr = dpr;
    for (const c of [this.cv, this.bg, this.st, this.vig]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px';
    this.layout();
    this.drawVignette();
    if (!this.clouds.length) this.makeClouds();
  },

  /* camera: fit the current target with room above for drops */
  layout() {
    const W = this.W, H = this.H;
    const bar = H < 500 ? 78 : 96;
    const top = H < 500 ? 54 : 70;
    G.gy = H - bar - (H < 500 ? 22 : 44);
    const b = World.bbox;
    const tw = World.cells.length ? Math.max(400, b.x1 - b.x0) : 560;
    const th = World.cells.length ? Math.max(320, -b.y0) : 700;
    G.s = Math.min(W / (tw + 150), (G.gy - top) / (th + 320));
    G.cx = W / 2;
    G.topY = -G.gy / G.s;
    this.drawBackground();
    World.structDirty = true;
  },

  w2s(x, y) { return [G.cx + x * G.s, G.gy + y * G.s]; },
  s2w(x, y) { return [(x - G.cx) / G.s, (y - G.gy) / G.s]; },

  drawVignette() {
    const c = this.vig, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const gr = g.createRadialGradient(c.width / 2, c.height * 0.45, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height * 0.5, Math.max(c.width, c.height) * 0.75);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,6,20,0.38)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  },

  makeClouds() {
    this.clouds = [];
    for (let i = 0; i < 7; i++) this.clouds.push({ x: rand(-1400, 1400), y: rand(-1500, -650), s: rand(0.6, 1.4), v: rand(8, 22) });
    this.cloudSprite = (() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 110;
      const g = c.getContext('2d');
      const blobs = [[60, 70, 38], [100, 50, 48], [150, 55, 44], [195, 72, 34], [125, 78, 40]];
      g.fillStyle = 'rgba(255,255,255,0.92)';
      for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
      g.globalCompositeOperation = 'source-atop';
      const gr = g.createLinearGradient(0, 20, 0, 110); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(120,140,170,0.35)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 110);
      return c;
    })();
  },

  /* ---------- background per world ---------- */
  drawBackground() {
    const g = this.bgx, W = this.W, H = this.H, dpr = this.dpr;
    const w = WORLDS[G.world || 0];
    const R = mulberry32(99 + (G.world || 0) * 17);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, G.gy);
    sky.addColorStop(0, w.sky[0]); sky.addColorStop(0.6, w.sky[1]); sky.addColorStop(1, w.sky[2]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const s = G.s;
    const X = (x) => G.cx + x * s, Y = (y) => G.gy + y * s;
    const xL = -G.cx / s - 50, xR = (W - G.cx) / s + 50;

    // sun / moon / planet
    if (w.id === 'space') {
      for (let i = 0; i < 220; i++) {
        g.fillStyle = `rgba(255,255,255,${0.2 + R() * 0.8})`;
        const z = R() < 0.1 ? 2 : 1;
        g.fillRect(R() * W, R() * G.gy, z, z);
      }
      const neb = g.createRadialGradient(W * 0.25, G.gy * 0.3, 0, W * 0.25, G.gy * 0.3, W * 0.5);
      neb.addColorStop(0, 'rgba(160,90,255,0.22)'); neb.addColorStop(1, 'rgba(160,90,255,0)');
      g.fillStyle = neb; g.fillRect(0, 0, W, H);
      // earth
      const ex = W * 0.72, ey = G.gy * 0.32, er = 110 * s;
      const eg = g.createRadialGradient(ex - er * 0.4, ey - er * 0.4, er * 0.1, ex, ey, er);
      eg.addColorStop(0, '#9ad7ff'); eg.addColorStop(0.5, '#2f7fd0'); eg.addColorStop(1, '#0d2a5c');
      g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.fill();
      g.fillStyle = 'rgba(90,170,80,0.85)';
      for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(ex + (R() - 0.5) * er, ey + (R() - 0.5) * er, er * (0.15 + R() * 0.2), er * (0.1 + R() * 0.15), R() * 3, 0, TAU); g.fill(); }
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(0,0,20,0.5)'; g.beginPath(); g.arc(ex + er * 0.5, ey + er * 0.4, er, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(140,200,255,0.4)'; g.lineWidth = 4 * s; g.beginPath(); g.arc(ex, ey, er + 3 * s, 0, TAU); g.stroke();
    } else {
      const sx = X(xL * 0.6), sy = Y(w.id === 'city' ? -300 : -1150), sr = (w.id === 'city' ? 120 : 70) * s;
      const sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 5);
      sg.addColorStop(0, w.sun); sg.addColorStop(0.18, w.sun + 'aa'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sg; g.fillRect(0, 0, W, H);
      g.fillStyle = w.sun; g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill();
    }

    // far layers
    const ridge = (base, amp, col, freq, jag) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(X(xL), Y(0));
      for (let x = xL; x <= xR; x += jag ? 40 : 20) {
        const h = base + Math.sin(x * freq + base) * amp + Math.sin(x * freq * 2.7 + 1.3) * amp * 0.4 + (jag ? (R() - 0.5) * amp * 0.6 : 0);
        g.lineTo(X(x), Y(-h));
      }
      g.lineTo(X(xR), Y(0)); g.closePath(); g.fill();
    };
    if (w.id === 'village') {
      ridge(260, 70, w.far2, 0.004, false);
      ridge(150, 50, w.far, 0.006, false);
      for (let i = 0; i < 18; i++) {
        const x = xL + R() * (xR - xL);
        if (Math.abs(x) < 330) continue;
        const h = 60 + R() * 70;
        g.fillStyle = '#5b3d22'; g.fillRect(X(x - 5), Y(-h * 0.5), 10 * s, h * 0.5 * s);
        g.fillStyle = R() < 0.5 ? '#4f8f3a' : '#5ea444';
        g.beginPath(); g.arc(X(x), Y(-h * 0.6), 34 * s, 0, TAU); g.arc(X(x - 22), Y(-h * 0.45), 24 * s, 0, TAU); g.arc(X(x + 22), Y(-h * 0.45), 24 * s, 0, TAU); g.fill();
      }
    } else if (w.id === 'city') {
      for (const [col, hmin, hmax, win] of [[w.far, 260, 620, 0.25], [w.far2, 140, 420, 0.45]]) {
        let x = xL;
        while (x < xR) {
          const bw = 60 + R() * 110, bh = hmin + R() * (hmax - hmin);
          g.fillStyle = col; g.fillRect(X(x), Y(-bh), bw * s, bh * s);
          for (let yy = 20; yy < bh - 20; yy += 26) for (let xx = 10; xx < bw - 14; xx += 20) {
            if (R() < win) { g.fillStyle = R() < 0.7 ? 'rgba(255,214,140,0.85)' : 'rgba(170,220,255,0.7)'; g.fillRect(X(x + xx), Y(-bh + yy), 9 * s, 12 * s); }
          }
          x += bw + R() * 15;
        }
      }
    } else if (w.id === 'desert') {
      for (let i = 0; i < 3; i++) {
        const px = [xL * 0.75, xR * 0.7, xR * 0.9][i], ph = [180, 240, 120][i];
        g.fillStyle = ['#d79a52', '#c98a45', '#dba15a'][i];
        g.beginPath(); g.moveTo(X(px - ph * 1.1), Y(-60)); g.lineTo(X(px), Y(-60 - ph)); g.lineTo(X(px + ph * 1.1), Y(-60)); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(X(px), Y(-60 - ph)); g.lineTo(X(px + ph * 1.1), Y(-60)); g.lineTo(X(px + ph * 0.2), Y(-60)); g.fill();
      }
      ridge(110, 40, w.far, 0.005, false);
      ridge(60, 30, w.far2, 0.008, false);
    } else if (w.id === 'ice') {
      g.fillStyle = w.far2; g.beginPath(); g.moveTo(X(xL), Y(0));
      let x = xL;
      while (x < xR) { const pw = 160 + R() * 220, ph = 260 + R() * 360; g.lineTo(X(x + pw / 2), Y(-ph)); g.lineTo(X(x + pw), Y(-60)); x += pw * 0.7; }
      g.lineTo(X(xR), Y(0)); g.fill();
      ridge(130, 50, w.far, 0.006, true);
    } else if (w.id === 'space') {
      ridge(120, 60, w.far, 0.005, true);
      ridge(55, 25, w.far2, 0.01, false);
    }

    // ground
    const gTop = Y(0);
    const gg = g.createLinearGradient(0, gTop, 0, H);
    gg.addColorStop(0, w.ground[0]); gg.addColorStop(0.15, w.ground[1]); gg.addColorStop(1, w.ground[2]);
    g.fillStyle = gg; g.fillRect(0, gTop, W, H - gTop);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
      const z = (1 + R() * 3) * s;
      g.fillRect(R() * W, gTop + R() * (H - gTop), z, z);
    }
    if (w.id === 'village') {
      g.strokeStyle = '#7cc04f'; g.lineWidth = 2 * s;
      for (let i = 0; i < 260; i++) { const x = R() * W; g.beginPath(); g.moveTo(x, gTop + 4); g.lineTo(x + (R() - 0.5) * 8 * s, gTop - (6 + R() * 12) * s); g.stroke(); }
    } else if (w.id === 'city') {
      g.fillStyle = '#6b6e76'; g.fillRect(0, gTop, W, 10 * s);
      g.fillStyle = 'rgba(255,220,120,0.6)';
      for (let x = (G.cx % (120 * s)) - 120 * s; x < W; x += 120 * s) g.fillRect(x, gTop + 40 * s, 60 * s, 6 * s);
    } else if (w.id === 'desert') {
      g.strokeStyle = 'rgba(150,100,40,0.25)'; g.lineWidth = 2 * s;
      for (let y = gTop + 14 * s; y < H; y += 16 * s) { g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, y + Math.sin(x * 0.03 + y) * 3 * s); g.stroke(); }
    } else if (w.id === 'ice') {
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 60; i++) g.fillRect(R() * W, gTop + R() * (H - gTop), 2 * s, 2 * s);
    } else if (w.id === 'space') {
      for (let i = 0; i < 14; i++) {
        const x = R() * W, y = gTop + 20 * s + R() * (H - gTop), rx = (20 + R() * 50) * s;
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.25, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2 * s; g.beginPath(); g.ellipse(x, y + 2 * s, rx, rx * 0.25, 0, 0.2, Math.PI - 0.2); g.stroke();
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(0, gTop, W, 3 * s);
  },

  /* ---------- structure layer (redrawn only when changed) ---------- */
  drawStructure() {
    const g = this.stx, dpr = this.dpr, s = G.s;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.st.width, this.st.height);
    g.setTransform(dpr * s, 0, 0, dpr * s, dpr * G.cx, dpr * G.gy);
    g.lineJoin = 'round';
    const cells = World.cells;
    const path = (p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); };
    // silhouette outline
    g.strokeStyle = 'rgba(25,16,10,0.55)'; g.lineWidth = 5;
    for (const c of cells) if (c.alive) { path(c.pts); g.stroke(); }
    // fills
    for (const c of cells) {
      if (!c.alive) continue;
      const m = MATS[c.mat];
      path(c.pts);
      g.fillStyle = PATTERNS[c.mat];
      g.globalAlpha = m.alpha || 1;
      g.fill();
      if (!m.alpha) { g.strokeStyle = PATTERNS[c.mat]; g.lineWidth = 1.4; g.stroke(); }
      g.globalAlpha = 1;
    }
    // damage: darken, seams, cracks
    for (const c of cells) {
      if (!c.alive) continue;
      const f = 1 - c.hp / c.maxHP;
      if (c.frozen > 0) { path(c.pts); g.fillStyle = 'rgba(160,225,255,0.5)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.2; g.stroke(); }
      if (c.acid > 0) { path(c.pts); g.fillStyle = 'rgba(120,255,60,0.28)'; g.fill(); }
      if (f < 0.04) continue;
      path(c.pts);
      g.fillStyle = `rgba(20,12,6,${f * 0.28})`; g.fill();
      g.strokeStyle = `rgba(15,8,4,${0.25 + f * 0.6})`; g.lineWidth = 1 + f * 1.4; g.stroke();
      const len = Math.min(1, f * 1.6);
      for (const line of c.cracks) {
        const n = (line.length / 2 - 1) * len;
        g.beginPath(); g.moveTo(line[0], line[1]);
        let i = 1;
        for (; i <= Math.floor(n); i++) g.lineTo(line[i * 2], line[i * 2 + 1]);
        const fr = n - Math.floor(n);
        if (fr > 0 && i * 2 < line.length) g.lineTo(lerp(line[i * 2 - 2], line[i * 2], fr), lerp(line[i * 2 - 1], line[i * 2 + 1], fr));
        g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2.2; g.stroke();
        g.strokeStyle = `rgba(10,5,2,${0.5 + f * 0.4})`; g.lineWidth = 1.3; g.stroke();
      }
    }
    // global light: top bright, bottom & right darker
    const b = World.bbox;
    g.globalCompositeOperation = 'source-atop';
    const lg = g.createLinearGradient(b.x0, b.y0, b.x1 * 0.4, b.y1);
    lg.addColorStop(0, 'rgba(255,250,235,0.16)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(10,5,20,0.22)');
    g.fillStyle = lg; g.fillRect(b.x0 - 20, b.y0 - 20, b.x1 - b.x0 + 40, b.y1 - b.y0 + 40);
    const ao = g.createLinearGradient(0, -60, 0, 0);
    ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.fillStyle = ao; g.fillRect(b.x0 - 20, -60, b.x1 - b.x0 + 40, 60);
    g.globalCompositeOperation = 'source-over';
    World.structDirty = false;
  },

  /* ---------- per-frame ---------- */
  frame(dt) {
    const g = this.ctx, dpr = this.dpr, s = G.s, W = this.W, H = this.H;
    if (World.structDirty) this.drawStructure();
    // shake
    const tr = G.trauma * G.trauma;
    const t = G.time;
    const ox = (Math.sin(t * 61.3) + Math.sin(t * 23.7) * 0.5) * 16 * tr;
    const oy = (Math.cos(t * 57.1) + Math.sin(t * 31.9) * 0.5) * 16 * tr;
    const zoom = 1 + G.punch * 0.025;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.drawImage(this.bg, (ox * 0.4 - 6) * dpr, (oy * 0.4 - 6) * dpr, this.bg.width + 12 * dpr, this.bg.height + 12 * dpr);

    // clouds
    if (WORLDS[G.world].id !== 'space') {
      g.setTransform(dpr * s, 0, 0, dpr * s, dpr * (G.cx + ox * 0.5), dpr * (G.gy + oy * 0.5));
      g.globalAlpha = WORLDS[G.world].id === 'city' ? 0.35 : 0.8;
      for (const c of this.clouds) {
        c.x += c.v * dt; if (c.x > 1500) c.x = -1500;
        g.drawImage(this.cloudSprite, c.x, c.y, 256 * c.s, 110 * c.s);
      }
      g.globalAlpha = 1;
    }

    // world transform with punch-zoom around ground centre
    const wx = G.cx + ox, wy = G.gy + oy;
    const ws = s * zoom;
    const setW = () => g.setTransform(dpr * ws, 0, 0, dpr * ws, dpr * wx, dpr * wy);
    setW();

    // ambient particles behind
    Ambient.draw(g);

    // contact shadow under the structure
    const b = World.bbox;
    if (World.cells.length) {
      const frac = clamp(World.standingHP / World.totalHP, 0, 1);
      const cx = (b.x0 + b.x1) / 2, rw = (b.x1 - b.x0) * 0.62;
      g.globalAlpha = 0.35 * frac;
      g.drawImage(softSprite('#000000'), cx - rw, -18, rw * 2, 36);
      g.globalAlpha = 1;
    }

    // structure
    const introY = G.introY || 0;
    g.setTransform(zoom, 0, 0, zoom, (1 - zoom) * G.cx * dpr + ox * dpr, (1 - zoom) * G.gy * dpr + (oy + introY * s) * dpr);
    g.drawImage(this.st, 0, 0);
    setW();
    if (introY) g.translate(0, introY);

    // hit flashes
    const path = (p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); };
    for (const c of G.flashing) {
      if (!c.alive || c.flash <= 0) continue;
      path(c.pts); g.fillStyle = `rgba(255,255,255,${c.flash * 0.75})`; g.fill();
    }
    if (introY) g.translate(0, -introY);

    // debris
    for (const d of World.debris) {
      if (d.dead) continue;
      const m = MATS[d.mat];
      g.save();
      g.translate(d.x, d.y); g.rotate(d.a);
      if (d.shrink !== 1) g.scale(d.shrink, d.shrink);
      g.translate(-d.ox, -d.oy);
      const p = d.wp;
      g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath();
      g.globalAlpha = d.alpha * (m.alpha || 1);
      g.fillStyle = PATTERNS[d.mat]; g.fill();
      g.globalAlpha = d.alpha;
      g.fillStyle = `rgba(0,0,0,${0.1 + d.dmg * 0.15})`; g.fill();
      g.strokeStyle = 'rgba(20,10,5,0.55)'; g.lineWidth = 1.3; g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;

    Effects.drawUnder(g);

    // items
    for (const it of G.items) {
      if (it.dead) continue;
      g.save(); g.translate(it.x, it.y); g.rotate(it.a);
      g.globalAlpha = it.alpha;
      drawItem(g, it.def.id === 'cluster' && it.mini ? 'cluster_b' : it.def.id, it.r, G.time, it.seed);
      g.restore();
    }
    g.globalAlpha = 1;

    Effects.drawOver(g);
    FX.draw(g, ws);
    Drone.draw(g);
    G.drawAim(g);

    // screen space
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    Coins.draw(g);
    if (G.flashA > 0) { g.globalAlpha = Math.min(1, G.flashA); g.fillStyle = G.flashCol; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.vig, 0, 0);
  },
};

/* ===== ambient weather per world ===== */
const Ambient = {
  list: [], t: 0,
  reset() { this.list.length = 0; },
  update(dt) {
    const id = WORLDS[G.world].id;
    this.t += dt;
    const xL = -G.cx / G.s, xR = (Render.W - G.cx) / G.s;
    const want = id === 'ice' ? 70 : id === 'village' ? 10 : id === 'desert' ? 25 : id === 'space' ? 6 : 0;
    while (this.list.length < want) {
      this.list.push({ x: rand(xL, xR), y: rand(G.topY, 0), vx: rand(-30, 30), vy: id === 'ice' ? rand(40, 90) : id === 'desert' ? rand(-10, 10) : rand(30, 60), s: rand(2, 5), a: rand(TAU), k: id });
    }
    for (const p of this.list) {
      p.a += dt;
      if (p.k === 'ice') { p.x += (p.vx + Math.sin(p.a * 2) * 20) * dt; p.y += p.vy * dt; }
      else if (p.k === 'village') { p.x += (60 + Math.sin(p.a * 1.5) * 40) * dt; p.y += (p.vy + Math.cos(p.a * 3) * 30) * dt; }
      else if (p.k === 'desert') { p.x += 140 * dt; p.y += Math.sin(p.a * 2) * 10 * dt; }
      else if (p.k === 'space') { p.x += 600 * dt; p.y += 300 * dt; }
      if (p.y > 0 || p.x > xR + 50 || p.x < xL - 50) {
        p.x = p.k === 'ice' ? rand(xL, xR) : xL - rand(0, 200); p.y = p.k === 'ice' ? G.topY : rand(G.topY, -50);
        if (p.k === 'space') { p.x = rand(xL - 800, xR); p.y = G.topY - rand(0, 900); }
      }
    }
  },
  draw(g) {
    for (const p of this.list) {
      if (p.k === 'ice') { g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); }
      else if (p.k === 'village') { g.save(); g.translate(p.x, p.y); g.rotate(p.a * 2); g.fillStyle = '#7cb342'; g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, TAU); g.fill(); g.restore(); }
      else if (p.k === 'desert') { g.fillStyle = 'rgba(255,240,200,0.5)'; g.fillRect(p.x, p.y, p.s * 3, 1.5); }
      else if (p.k === 'space') { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 60, p.y - 30); g.stroke(); }
    }
  },
};
