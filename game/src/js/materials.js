'use strict';
/* ===== Materials: strength, look, sound, particles ===== */
const MATS = {
  wood:     { hp: 1.0, dens: 0.6, cat: 'wood',    cols: ['#a36d3d', '#6b4224', '#d29a5c'], chip: 'splinter', coin: 1 },
  plank:    { hp: 0.9, dens: 0.6, cat: 'wood',    cols: ['#8e5b34', '#5a361c', '#c08552'], chip: 'splinter', coin: 1 },
  redwood:  { hp: 1.0, dens: 0.6, cat: 'wood',    cols: ['#a8382e', '#6e1f19', '#d65a45'], chip: 'splinter', coin: 1 },
  brick:    { hp: 1.4, dens: 1.0, cat: 'stone',   cols: ['#b4533b', '#7a2f20', '#dd8a6c'], chip: 'chip', coin: 1 },
  stone:    { hp: 1.8, dens: 1.2, cat: 'stone',   cols: ['#8c8a86', '#5d5b58', '#b9b6b0'], chip: 'chip', coin: 1 },
  concrete: { hp: 2.0, dens: 1.2, cat: 'stone',   cols: ['#a3a7ab', '#6f7378', '#cdd1d4'], chip: 'chip', coin: 1 },
  stucco:   { hp: 1.1, dens: 0.9, cat: 'stone',   cols: ['#e9dcc3', '#b7a586', '#fff6e4'], chip: 'chip', coin: 1 },
  roof:     { hp: 1.0, dens: 0.9, cat: 'stone',   cols: ['#a7402c', '#6c2216', '#d4664c'], chip: 'chip', coin: 1 },
  sandstone:{ hp: 1.5, dens: 1.1, cat: 'stone',   cols: ['#d9b16b', '#a07d3e', '#f3d699'], chip: 'chip', coin: 1 },
  clay:     { hp: 1.0, dens: 1.0, cat: 'stone',   cols: ['#c48656', '#8a5632', '#e3ad7f'], chip: 'chip', coin: 1 },
  marble:   { hp: 1.7, dens: 1.2, cat: 'stone',   cols: ['#e9e6e1', '#a9a59e', '#ffffff'], chip: 'chip', coin: 2 },
  glass:    { hp: 0.3, dens: 0.8, cat: 'glass',   cols: ['#9fd6f2', '#4e93b8', '#e9f8ff'], chip: 'shard', coin: 1, alpha: 0.78 },
  ice:      { hp: 0.8, dens: 0.8, cat: 'ice',     cols: ['#bfe8fb', '#6fb2d6', '#f4fcff'], chip: 'shard', coin: 1, alpha: 0.9 },
  snow:     { hp: 0.6, dens: 0.4, cat: 'soft',    cols: ['#f2f6fa', '#b9c8d6', '#ffffff'], chip: 'snow', coin: 1 },
  metal:    { hp: 3.0, dens: 2.0, cat: 'metal',   cols: ['#8d98a5', '#545d68', '#c9d2dc'], chip: 'spark', coin: 1 },
  steel:    { hp: 4.0, dens: 2.2, cat: 'metal',   cols: ['#4b525c', '#2a2f36', '#7d8792'], chip: 'spark', coin: 2 },
  hull:     { hp: 2.6, dens: 2.0, cat: 'metal',   cols: ['#e7e9ec', '#9aa2ab', '#ffffff'], chip: 'spark', coin: 1 },
  gold:     { hp: 1.5, dens: 2.5, cat: 'metal',   cols: ['#f2c230', '#b5861a', '#fff1a6'], chip: 'spark', coin: 8 },
  crystal:  { hp: 1.3, dens: 1.0, cat: 'crystal', cols: ['#b48cff', '#6c46c9', '#efe2ff'], chip: 'shard', coin: 4, alpha: 0.9, glow: '#c9a8ff' },
  alien:    { hp: 1.6, dens: 1.0, cat: 'crystal', cols: ['#37e0b0', '#138a6c', '#b6ffe8'], chip: 'shard', coin: 3, glow: '#59ffd0' },
  tnt:      { hp: 0.5, dens: 0.6, cat: 'wood',    cols: ['#d0322a', '#7f1611', '#ff6a55'], chip: 'splinter', coin: 2, explode: true },
  rubber:   { hp: 1.2, dens: 0.8, cat: 'soft',    cols: ['#2d2e33', '#141518', '#55575f'], chip: 'chip', coin: 1 },
  plant:    { hp: 0.8, dens: 0.6, cat: 'soft',    cols: ['#4f9a3a', '#2c6420', '#86c96a'], chip: 'chip', coin: 1 },
  hay:      { hp: 0.4, dens: 0.3, cat: 'soft',    cols: ['#e8c25a', '#b08a2a', '#fbe496'], chip: 'splinter', coin: 1 },
  dark:     { hp: 3.4, dens: 2.0, cat: 'metal',   cols: ['#3a3348', '#1d1826', '#6b5f85'], chip: 'spark', coin: 2, glow: '#ff4fd8' },
  carrot:   { hp: 0.5, dens: 0.6, cat: 'soft',    cols: ['#f07a1e', '#b04e0b', '#ffad60'], chip: 'chip', coin: 1 },
};
for (const k in MATS) MATS[k].id = k;

/* ===== textures (128px tiles drawn procedurally) ===== */
const PATTERNS = {};
function makeTex(id) {
  const S = 128;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const m = MATS[id];
  const [base, dark, light] = m.cols;
  const R = mulberry32(id.length * 977 + id.charCodeAt(0) * 31);
  const speck = (n, col, a, s0, s1) => {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
      g.globalAlpha = a * (0.4 + R() * 0.6);
      const s = s0 + R() * (s1 - s0);
      g.fillRect(R() * S, R() * S, s, s);
    }
    g.globalAlpha = 1;
  };
  const blot = (n, col, a, r0, r1) => {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
      g.globalAlpha = a * R();
      const x = R() * S, y = R() * S, r = r0 + R() * (r1 - r0);
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1;
  };
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  switch (id) {
    case 'wood': case 'plank': case 'redwood': case 'tnt': {
      const ph = id === 'tnt' ? 32 : 21.33;
      for (let y = 0; y < S; y += ph) {
        g.fillStyle = R() < 0.5 ? dark : light; g.globalAlpha = 0.12; g.fillRect(0, y, S, ph); g.globalAlpha = 1;
        for (let k = 0; k < 7; k++) {
          g.strokeStyle = R() < 0.6 ? dark : light; g.globalAlpha = 0.25 + R() * 0.25; g.lineWidth = 0.6 + R();
          g.beginPath();
          const yy = y + 2 + R() * (ph - 4), amp = 1 + R() * 2, fr = 0.03 + R() * 0.05, ph0 = R() * 6;
          for (let x = 0; x <= S; x += 4) g.lineTo(x, yy + Math.sin(x * fr + ph0) * amp);
          g.stroke();
        }
        g.globalAlpha = 0.7; g.fillStyle = dark; g.fillRect(0, y, S, 1.5); g.globalAlpha = 1;
        const jx = R() * S; g.fillStyle = dark; g.globalAlpha = 0.6; g.fillRect(jx, y, 1.5, ph); g.globalAlpha = 1;
      }
      if (R() < 2) { g.fillStyle = dark; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(R() * S, R() * S, 4, 2.5, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
      if (id === 'tnt') {
        g.fillStyle = '#2a0b08'; g.globalAlpha = 0.85; g.fillRect(0, 40, S, 48); g.globalAlpha = 1;
        g.fillStyle = '#ffe9c9'; g.font = '900 30px Arial Black, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('TNT', 64, 66);
      }
      break;
    }
    case 'brick': {
      g.fillStyle = '#d6c2a4'; g.fillRect(0, 0, S, S);
      const bw = 32, bh = 16;
      for (let r = 0; r < S / bh; r++) {
        for (let k = -1; k < S / bw + 1; k++) {
          const x = k * bw + (r % 2 ? bw / 2 : 0), y = r * bh;
          const t = R();
          g.fillStyle = t < 0.33 ? base : t < 0.66 ? '#a8492f' : '#c1644a';
          g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
          g.fillStyle = light; g.globalAlpha = 0.25; g.fillRect(x + 1.5, y + 1.5, bw - 3, 2); g.globalAlpha = 1;
          g.fillStyle = dark; g.globalAlpha = 0.3; g.fillRect(x + 1.5, y + bh - 3.5, bw - 3, 2); g.globalAlpha = 1;
        }
      }
      speck(220, dark, 0.35, 0.8, 2);
      break;
    }
    case 'stone': case 'sandstone': case 'marble': case 'clay': {
      blot(30, dark, 0.15, 6, 18); blot(30, light, 0.15, 5, 14);
      speck(500, dark, 0.35, 0.7, 1.8); speck(300, light, 0.35, 0.7, 1.6);
      if (id === 'stone' || id === 'sandstone') {
        const bw = 64, bh = 32;
        g.strokeStyle = dark; g.globalAlpha = 0.45; g.lineWidth = 1.6;
        for (let r = 0; r < S / bh; r++) {
          g.beginPath(); g.moveTo(0, r * bh + 0.8); g.lineTo(S, r * bh + 0.8); g.stroke();
          for (let k = 0; k < 3; k++) { const x = k * bw + (r % 2 ? bw / 2 : 0); g.beginPath(); g.moveTo(x, r * bh); g.lineTo(x, r * bh + bh); g.stroke(); }
        }
        g.globalAlpha = 1;
      }
      if (id === 'sandstone') { g.globalAlpha = 0.18; g.fillStyle = dark; for (let y = 4; y < S; y += 9) g.fillRect(0, y + R() * 3, S, 1.5); g.globalAlpha = 1; }
      if (id === 'marble') {
        g.strokeStyle = '#8f8a83'; g.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          g.globalAlpha = 0.4; g.beginPath();
          let x = R() * S, y = 0; g.moveTo(x, y);
          while (y < S) { x += (R() - 0.5) * 18; y += 8 + R() * 10; g.lineTo(x, y); }
          g.stroke();
        }
        g.globalAlpha = 1;
      }
      break;
    }
    case 'concrete': case 'stucco': {
      speck(1400, dark, 0.25, 0.6, 1.4); speck(600, light, 0.3, 0.6, 1.3); blot(14, dark, 0.07, 10, 30);
      if (id === 'concrete') { g.fillStyle = dark; for (let i = 0; i < 18; i++) { g.globalAlpha = 0.5; g.beginPath(); g.arc(R() * S, R() * S, 0.8 + R() * 1.5, 0, TAU); g.fill(); } g.globalAlpha = 1; }
      break;
    }
    case 'roof': {
      g.fillStyle = dark; g.fillRect(0, 0, S, S);
      for (let r = 0; r < 8; r++) for (let k = -1; k < 5; k++) {
        const x = k * 32 + (r % 2 ? 16 : 0), y = r * 16;
        g.fillStyle = R() < 0.5 ? base : '#b64a33';
        g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + 31, y); g.lineTo(x + 31, y + 10); g.quadraticCurveTo(x + 16, y + 19, x + 1, y + 10); g.closePath(); g.fill();
        g.fillStyle = light; g.globalAlpha = 0.3; g.fillRect(x + 3, y + 1, 26, 2); g.globalAlpha = 1;
      }
      break;
    }
    case 'glass': case 'ice': case 'crystal': case 'alien': {
      const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, light); gr.addColorStop(0.5, base); gr.addColorStop(1, dark);
      g.fillStyle = gr; g.globalAlpha = 0.6; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
      g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.globalAlpha = 0.25;
      for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 48, S); g.lineTo(k * 48 + S, 0); g.stroke(); }
      g.lineWidth = 2; g.globalAlpha = 0.3;
      for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 48 + 14, S); g.lineTo(k * 48 + 14 + S, 0); g.stroke(); }
      g.globalAlpha = 1;
      if (id === 'ice') { speck(60, '#ffffff', 0.6, 1, 2.5); }
      if (id === 'crystal' || id === 'alien') {
        g.strokeStyle = light; g.lineWidth = 1; g.globalAlpha = 0.55;
        for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(R() * S, R() * S); g.lineTo(R() * S, R() * S); g.stroke(); }
        g.globalAlpha = 1;
      }
      break;
    }
    case 'snow': { speck(800, '#cbd8e4', 0.4, 0.8, 2); speck(300, '#ffffff', 0.9, 1, 2.5); blot(10, '#dfe8f0', 0.25, 8, 20); break; }
    case 'metal': case 'steel': case 'hull': case 'dark': {
      for (let y = 0; y < S; y++) { g.fillStyle = R() < 0.5 ? dark : light; g.globalAlpha = 0.07 + R() * 0.08; g.fillRect(0, y, S, 1); }
      g.globalAlpha = 1;
      g.strokeStyle = dark; g.lineWidth = 2; g.globalAlpha = 0.6;
      g.beginPath(); g.moveTo(0, 1); g.lineTo(S, 1); g.moveTo(1, 0); g.lineTo(1, S); g.stroke();
      g.strokeStyle = light; g.globalAlpha = 0.4; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, 3); g.lineTo(S, 3); g.moveTo(3, 0); g.lineTo(3, S); g.stroke();
      g.globalAlpha = 1;
      for (const [x, y] of [[10, 10], [54, 10], [10, 54], [54, 54], [74, 10], [118, 10], [10, 74], [10, 118], [74, 74], [118, 118], [74, 118], [118, 74]]) {
        g.fillStyle = dark; g.beginPath(); g.arc(x + 1, y + 1, 2.6, 0, TAU); g.fill();
        g.fillStyle = light; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill();
      }
      if (id === 'dark') { g.strokeStyle = m.glow; g.globalAlpha = 0.5; g.lineWidth = 1.5; g.beginPath(); g.moveTo(20, 64); g.lineTo(108, 64); g.moveTo(64, 20); g.lineTo(64, 108); g.stroke(); g.globalAlpha = 1; }
      break;
    }
    case 'gold': {
      for (let y = 0; y < S; y += 32) {
        const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, light); gr.addColorStop(0.45, base); gr.addColorStop(1, dark);
        g.fillStyle = gr; g.fillRect(0, y, S, 32);
        g.fillStyle = dark; g.globalAlpha = 0.6; g.fillRect(0, y + 31, S, 1.5); g.globalAlpha = 1;
        const off = (y / 32) % 2 ? 32 : 0;
        for (let x = off; x < S + 64; x += 64) { g.fillStyle = dark; g.globalAlpha = 0.5; g.fillRect(x, y, 1.5, 32); g.globalAlpha = 1; }
      }
      speck(80, '#ffffff', 0.5, 0.8, 1.6);
      break;
    }
    case 'rubber': { speck(400, light, 0.25, 0.8, 1.6); g.strokeStyle = light; g.globalAlpha = 0.2; for (let x = 0; x < S; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, S); g.stroke(); } g.globalAlpha = 1; break; }
    case 'plant': case 'carrot': {
      for (let x = 0; x < S; x += 16) { g.fillStyle = dark; g.globalAlpha = 0.35; g.fillRect(x, 0, 3, S); g.fillStyle = light; g.globalAlpha = 0.3; g.fillRect(x + 6, 0, 4, S); }
      g.globalAlpha = 1;
      if (id === 'plant') { g.fillStyle = '#fff6c0'; for (let i = 0; i < 40; i++) { const x = Math.floor(R() * 8) * 16 + 4, y = R() * S; g.fillRect(x, y, 1.2, 4); } }
      else { g.strokeStyle = dark; g.globalAlpha = 0.4; for (let y = 6; y < S; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + 3); g.stroke(); } g.globalAlpha = 1; }
      break;
    }
    case 'hay': {
      for (let i = 0; i < 260; i++) { g.strokeStyle = R() < 0.5 ? dark : light; g.globalAlpha = 0.5; g.lineWidth = 1; const x = R() * S, y = R() * S, a = (R() - 0.5) * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.stroke(); }
      g.globalAlpha = 1; break;
    }
    default: speck(300, dark, 0.3, 1, 2);
  }
  return c;
}
function initPatterns(ctx) {
  for (const id in MATS) {
    const tex = makeTex(id);
    MATS[id].tex = tex;
    PATTERNS[id] = ctx.createPattern(tex, 'repeat');
  }
}
