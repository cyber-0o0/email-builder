'use strict';
/* ===== Particles, floating texts, flying coins ===== */
const SOFT = new Map();
function softSprite(col) {
  let c = SOFT.get(col);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, 64, 64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.35, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  SOFT.set(col, c);
  return c;
}

/* particle types */
const PT = { CHIP: 0, DUST: 1, SPARK: 2, SMOKE: 3, FIRE: 4, SHARD: 5, RING: 6, DROP: 7, FLASH: 8, SNOW: 9, KEY: 10 };
const FX = {
  list: [], texts: [], coins: [], max: 1400,
  add(o) {
    if (this.list.length >= this.max) { this.list.shift(); }
    o.t = 0; o.a = o.a || 0; o.av = o.av || 0; o.g = o.g === undefined ? 1 : o.g;
    this.list.push(o);
    return o;
  },
  chips(x, y, mat, n, power, dirx = 0, diry = -1) {
    const m = MATS[mat];
    const type = m.chip === 'shard' ? PT.SHARD : m.chip === 'spark' ? PT.SPARK : m.chip === 'snow' ? PT.SNOW : PT.CHIP;
    for (let i = 0; i < n; i++) {
      const sp = rand(150, 600) * power;
      const a = Math.atan2(diry, dirx) + rand(-1.3, 1.3);
      this.add({
        type, x: x + rand(-6, 6), y: y + rand(-6, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(50, 250),
        life: rand(0.5, 1.3), size: type === PT.SPARK ? rand(2, 4) : rand(3, 9) * (m.chip === 'splinter' ? 1.2 : 1),
        col: pick(m.cols), a: rand(TAU), av: rand(-14, 14), long: m.chip === 'splinter', alpha: m.alpha || 1,
      });
      if (type === PT.SPARK && Math.random() < 0.4) this.add({ type: PT.CHIP, x, y, vx: Math.cos(a) * sp * 0.6, vy: Math.sin(a) * sp * 0.6, life: rand(0.5, 1), size: rand(2, 5), col: m.cols[1], a: rand(TAU), av: rand(-10, 10) });
    }
  },
  dust(x, y, col, n, size, spread = 30, up = 40) {
    for (let i = 0; i < n; i++) {
      this.add({ type: PT.DUST, x: x + rand(-spread, spread), y: y + rand(-spread * 0.5, spread * 0.5), vx: rand(-90, 90), vy: rand(-up, up * 0.3) - 20, life: rand(0.8, 1.8), size: size * rand(0.7, 1.4), col, g: 0, alpha: rand(0.35, 0.6) });
    }
  },
  smoke(x, y, n, size, col = '#3b3a3a') {
    for (let i = 0; i < n; i++) this.add({ type: PT.SMOKE, x: x + rand(-20, 20), y: y + rand(-20, 20), vx: rand(-60, 60), vy: rand(-140, -40), life: rand(1.4, 2.6), size: size * rand(0.7, 1.3), col, g: 0, alpha: rand(0.35, 0.6) });
  },
  fire(x, y, n, size, spd = 500) {
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), sp = rand(0.2, 1) * spd;
      this.add({ type: PT.FIRE, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: rand(0.3, 0.8), size: size * rand(0.6, 1.3), col: pick(['#ffd35a', '#ff8a2a', '#ff5a1f', '#fff1b0']), g: -0.1 });
    }
  },
  sparks(x, y, n, spd = 700, col) {
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), sp = rand(0.3, 1) * spd;
      this.add({ type: PT.SPARK, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, life: rand(0.3, 0.9), size: rand(2, 4), col: col || pick(['#fff3b0', '#ffd35a', '#ffb02a']) });
    }
  },
  ring(x, y, r, col = 'rgba(255,255,255,0.9)', life = 0.45, w = 10) { this.add({ type: PT.RING, x, y, vx: 0, vy: 0, life, size: r, col, g: 0, w }); },
  flash(x, y, r, col = '#fff6d8', life = 0.18) { this.add({ type: PT.FLASH, x, y, vx: 0, vy: 0, life, size: r, col, g: 0 }); },

  text(x, y, s, col = '#fff', size = 30, life = 0.9) {
    if (this.texts.length > 40) this.texts.shift();
    this.texts.push({ x: x + rand(-10, 10), y, s, col, size, t: 0, life, vy: -120 });
  },

  update(dt, grav) {
    const L = this.list;
    let w = 0;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      p.t += dt;
      if (p.t >= p.life) continue;
      switch (p.type) {
        case PT.DUST: case PT.SMOKE: p.vx *= 0.96; p.vy *= 0.96; p.vy -= (p.type === PT.SMOKE ? 30 : 10) * dt; break;
        case PT.FIRE: p.vx *= 0.92; p.vy *= 0.92; p.vy -= 200 * dt; break;
        case PT.SNOW: p.vy += 900 * grav * dt; p.vx *= 0.97; break;
        default: p.vy += 1800 * grav * p.g * dt;
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.av * dt;
      if ((p.type === PT.CHIP || p.type === PT.SHARD || p.type === PT.SNOW || p.type === PT.KEY || p.type === PT.DROP) && p.y > -p.size * 0.3) {
        p.y = -p.size * 0.3;
        if (p.vy > 60) { p.vy *= -0.3; p.vx *= 0.6; p.av *= 0.5; } else { p.vy = 0; p.vx *= 0.85; p.av *= 0.8; }
      }
      if (p.type === PT.SPARK && p.y > 0) { p.y = 0; p.vy *= -0.4; }
      L[w++] = p;
    }
    L.length = w;
    for (const t of this.texts) { t.t += dt; t.y += t.vy * dt; t.vy *= 0.92; }
    this.texts = this.texts.filter((t) => t.t < t.life);
  },

  draw(g, s) {
    const L = this.list;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      const k = p.t / p.life;
      switch (p.type) {
        case PT.CHIP: case PT.SHARD: case PT.SNOW: case PT.KEY: {
          g.globalAlpha = (k > 0.7 ? (1 - k) / 0.3 : 1) * (p.alpha || 1);
          g.fillStyle = p.col;
          g.save(); g.translate(p.x, p.y); g.rotate(p.a);
          const z = p.size;
          if (p.type === PT.SHARD) { g.beginPath(); g.moveTo(-z, -z * 0.4); g.lineTo(z, -z * 0.2); g.lineTo(-z * 0.2, z * 0.7); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-z * 0.6, -z * 0.3, z, 1); }
          else if (p.type === PT.SNOW) { g.beginPath(); g.arc(0, 0, z * 0.6, 0, TAU); g.fill(); }
          else if (p.type === PT.KEY) { g.fillRect(-z * 0.3, -z, z * 0.6, z * 2); }
          else if (p.long) g.fillRect(-z, -z * 0.22, z * 2, z * 0.44);
          else { g.beginPath(); g.moveTo(-z * 0.6, -z * 0.5); g.lineTo(z * 0.5, -z * 0.6); g.lineTo(z * 0.6, z * 0.4); g.lineTo(-z * 0.3, z * 0.6); g.closePath(); g.fill(); }
          g.restore();
          break;
        }
        case PT.DUST: case PT.SMOKE: {
          const sz = p.size * (1 + k * (p.type === PT.SMOKE ? 2.2 : 1.6));
          g.globalAlpha = p.alpha * (1 - k) * (k < 0.1 ? k / 0.1 : 1);
          g.drawImage(softSprite(p.col), p.x - sz, p.y - sz, sz * 2, sz * 2);
          break;
        }
        case PT.FIRE: {
          const sz = p.size * (1 - k * 0.7);
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 1 - k;
          g.drawImage(softSprite(p.col), p.x - sz, p.y - sz, sz * 2, sz * 2);
          g.globalCompositeOperation = 'source-over';
          break;
        }
        case PT.SPARK: {
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 1 - k;
          g.strokeStyle = p.col; g.lineWidth = p.size;
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); g.stroke();
          g.globalCompositeOperation = 'source-over';
          break;
        }
        case PT.RING: {
          const r = p.size * easeOutCubic(k);
          g.globalAlpha = (1 - k) * 0.9;
          g.strokeStyle = p.col; g.lineWidth = p.w * (1 - k) + 1;
          g.beginPath(); g.arc(p.x, p.y, r, 0, TAU); g.stroke();
          break;
        }
        case PT.FLASH: {
          const sz = p.size * (0.6 + k * 0.6);
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 1 - k;
          g.drawImage(softSprite(p.col), p.x - sz, p.y - sz, sz * 2, sz * 2);
          g.globalCompositeOperation = 'source-over';
          break;
        }
        case PT.DROP: {
          g.globalAlpha = 1 - k; g.fillStyle = p.col;
          g.beginPath(); g.arc(p.x, p.y, p.size, 0, TAU); g.fill();
          break;
        }
      }
    }
    g.globalAlpha = 1;
    // floating texts
    for (const t of this.texts) {
      const k = t.t / t.life;
      const pop = k < 0.15 ? easeOutBack(k / 0.15) : 1;
      const sz = (t.size * pop) / s;
      g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      g.font = `${Math.round(sz)}px "Russo One", "Arial Black", Impact, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = sz * 0.16; g.strokeStyle = 'rgba(20,14,8,.85)'; g.lineJoin = 'round';
      g.strokeText(t.s, t.x, t.y);
      g.fillStyle = t.col; g.fillText(t.s, t.x, t.y);
    }
    g.globalAlpha = 1;
  },
};
