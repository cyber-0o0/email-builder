'use strict';
/* ===== Game state, item logic, effects, loop ===== */
const DUST = { wood: '#b08a62', plank: '#a07850', redwood: '#a0604f', brick: '#c4806a', stone: '#a9a49c', concrete: '#b8bcbf', stucco: '#e8dcc6', roof: '#b9705a',
  sandstone: '#e6c88e', clay: '#d1a07a', marble: '#eeeae4', glass: '#d8f1ff', ice: '#e4f6ff', snow: '#ffffff', metal: '#9aa3ad', steel: '#7a828c', hull: '#e0e4ea',
  gold: '#ffe48a', crystal: '#d9c4ff', alien: '#a8ffe0', tnt: '#8a7a6a', rubber: '#55565c', plant: '#9ccf7f', hay: '#f0d98a', dark: '#6a5f85', carrot: '#ffb070' };

const LOOT_K = 0.014; // coins per point of destroyed HP
const G = {
  s: 1, cx: 0, gy: 0, topY: -1000, world: 0, level: 1, info: null,
  items: [], flashing: [], splitQueue: [],
  time: 0, trauma: 0, punch: 0, flashA: 0, flashCol: '#ffffff', hitstop: 0, timeScale: 1, slowT: 0,
  state: 'idle', introT: 0, introY: 0, winTimer: 0, paused: false,
  cd: {}, cdMax: {}, sel: 'rock',
  pointer: { x: 0, y: 0, down: false, over: false },
  combo: 0, comboT: 0, levelTime: 0, loot: 0, lootAcc: 0, coinUnit: 1, lastHitstop: 0, lastVib: 0,
  dealtAcc: 0,

  startLevel(level) {
    Coins.flush();
    this.level = level;
    this.info = World.build(level);
    this.world = this.info.world;
    Music.world = this.world;
    this.items.length = 0; this.flashing.length = 0; this.splitQueue.length = 0;
    FX.list.length = 0; FX.texts.length = 0; Effects.list.length = 0;
    Ambient.reset();
    Render.layout();
    this.combo = 0; this.comboT = 0; this.levelTime = 0; this.loot = 0; this.lootAcc = 0;
    this.coinUnit = Math.max(1, Math.round(levelReward(level) / 30));
    this.state = 'intro'; this.introT = 0; this.introY = -1200;
    this.timeScale = 1; this.slowT = 0; this.winTimer = 0;
    Drone.timer = 2;
    UI.onLevelStart();
  },

  /* show a target without starting play (behind title / job card) */
  preview(level) {
    Coins.flush();
    this.level = level;
    this.info = World.build(level);
    this.world = this.info.world;
    Music.world = this.world;
    this.items.length = 0; FX.list.length = 0; FX.texts.length = 0; Effects.list.length = 0;
    this.state = 'idle'; this.introY = 0;
    Render.layout();
    UI.onLevelStart();
  },

  /* ---------- input ---------- */
  tryDrop(explicit) {
    if (this.state !== 'play' || this.paused) return false;
    const id = this.sel;
    const def = ITEM[id];
    if (!def || !itemUnlocked(id)) return false;
    if ((this.cd[id] || 0) > 0) { if (explicit) { Audio2.deny(); UI.denyItem(id); } return false; }
    const [wx] = Render.s2w(this.pointer.x, this.pointer.y);
    const cd = itemCooldown(id);
    this.cd[id] = cd; this.cdMax[id] = cd;
    SAVE.stats.drops++;
    const dmg = itemDamage(id);
    if (def.kind === 'bolt') Effects.bolt(wx, dmg, def);
    else if (def.kind === 'laser') Effects.laser(wx, dmg, def);
    else this.spawnItem(id, wx, this.topY - def.r - 10, rand(-15, 15), def.mass > 5 ? 500 : 700);
    if (!SAVE.tut) { SAVE.tut = 1; UI.hint(false); }
    return true;
  },

  spawnItem(id, x, y, vx, vy, o = {}) {
    const def = ITEM[id];
    const upright = ['anvil', 'weight', 'piano', 'drill', 'acid', 'cluster'].includes(id);
    const it = {
      def, x, y, vx, vy, a: upright ? 0 : rand(-0.4, 0.4), av: upright ? 0 : rand(-4, 4), r: o.r || def.r,
      age: 0, hits: 0, hitCD: 0, alpha: 1, restT: 0, seed: randi(1, 1e6), dmg: (o.dmg || itemDamage(id)) * (o.dmgMult || 1),
      mini: !!o.mini, state: null, dead: false, drone: !!o.drone,
    };
    this.items.push(it);
    if (def.whistle && !o.mini) Audio2.whistle(0.75);
    if (!o.mini) Audio2.drop(def.mass / 10);
    return it;
  },

  /* ---------- damage model ---------- */
  damageArea(x, y, radius, dmg, o = {}) {
    let total = 0;
    const crit = !o.noCrit && Math.random() < SAVE.up.crit * 0.04;
    const cm = crit ? 3 : 1;
    const ext = 70;
    World.query(x - radius - ext, y - radius - ext, x + radius + ext, y + radius + ext, (c) => {
      const dx = c.cx - x, dy = c.cy - y;
      const d = Math.max(0, Math.sqrt(dx * dx + dy * dy) - c.r * 0.6);
      if (d >= radius) return;
      const f = 0.3 + 0.7 * (1 - d / radius);
      total += this.hitCell(c, dmg * f * cm * (c.frozen > 0 ? 2.5 : 1), x, y, o);
    });
    if (total > 0) {
      this.combo++; this.comboT = 1.6;
      if (!o.quiet) {
        FX.text(x, y - 30, fmt(Math.max(1, total)), crit ? '#ffdd33' : '#ffffff', crit ? 40 : 28 + Math.min(14, Math.log10(total + 1) * 4));
        if (crit) { FX.text(x, y - 80, T('crit'), '#ff4d3d', 34, 0.8); this.shake(0.25); }
      }
    }
    return total;
  },

  hitCell(c, amt, x, y, o) {
    if (!c.alive || amt <= 0) return 0;
    const a = Math.min(amt, c.hp);
    c.hp -= amt;
    World.standingHP -= a;
    World.structDirty = true;
    if (!o.quiet || Math.random() < 0.15) { if (c.flash <= 0) this.flashing.push(c); c.flash = 1; }
    if (c.hp <= 0.0001) this.destroyCell(c, x, y, o.power || 500);
    else if (!o.quiet && amt > c.maxHP * 0.15) FX.chips(c.cx, c.cy, c.mat, 1 + (Math.random() < 0.5 ? 1 : 0), 0.5);
    return a;
  },

  destroyCell(c, ix, iy, power) {
    World.killCell(c);
    c.hp = 0;
    const m = MATS[c.mat];
    let polys = [c.pts];
    if (c.area > 600) polys = splitPoly(c.pts, c.cx, c.cy, rand(TAU));
    if (c.area > 1500) polys = polys.flatMap((p) => { const ce = polyCentroid(p); return ce.a > 500 ? splitPoly(p, ce.x, ce.y, rand(TAU)) : [p]; });
    const many = World.debris.length > 260;
    for (const P of polys) {
      if (P.length < 6) continue;
      const ce = polyCentroid(P);
      if (ce.a < 60 || (many && ce.a < 300)) continue;
      let dx = ce.x - ix, dy = ce.y - iy;
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const sp = power * rand(0.35, 1);
      const d = World.addDebris(P, c.mat, dx * sp + rand(-60, 60), dy * sp - rand(60, 240), rand(-9, 9));
      if (d) d.dmg = 0.7;
    }
    FX.chips(c.cx, c.cy, c.mat, 3 + Math.min(6, (c.area / 250) | 0), clamp(power / 700, 0.4, 1.4), c.cx - ix, c.cy - iy);
    FX.dust(c.cx, c.cy, DUST[c.mat] || '#bbb', 1, 22 + Math.sqrt(c.area) * 0.4, 10, 30);
    if (m.glow) FX.sparks(c.cx, c.cy, 4, 400, m.glow);
    this.addLoot(c.maxHP * LOOT_K * m.coin, c.cx, c.cy);
    if (m.explode) Effects.tnt(c.cx, c.cy);
    SAVE.stats.destroyed++;
  },

  detach(cells) {
    if (!cells.length) return;
    let area = 0;
    for (const c of cells) {
      const d = World.addDebris(c.pts, c.mat, rand(-15, 15), rand(-10, 30), rand(-0.6, 0.6));
      if (d) d.dmg = 0.25;
      area += c.area;
      this.addLoot(c.maxHP * LOOT_K * MATS[c.mat].coin, c.cx, c.cy);
    }
    const p = clamp(area / 25000, 0.25, 1.4);
    Audio2.crumble(p);
    this.shake(0.15 + p * 0.3);
    this.vibrate(20 + p * 40);
  },

  explode(x, y, radius, dmg, o = {}) {
    const k = o.k || 1;
    this.damageArea(x, y, radius, dmg, { power: 700 + radius * 3, noCrit: o.noCrit });
    const R = radius * 1.7;
    for (const d of World.debris) {
      if (d.dead) continue;
      const dx = d.x - x, dy = d.y - y, dist = Math.hypot(dx, dy) || 1;
      if (dist > R) continue;
      const f = 1 - dist / R;
      const imp = (900 + radius * 4) * f * k;
      d.vx += (dx / dist) * imp; d.vy += (dy / dist) * imp - 300 * f; d.av += rand(-12, 12) * f;
      d.sleep = false; d.still = 0;
    }
    FX.flash(x, y, radius * 1.5, o.col || '#fff3c4', 0.22);
    FX.ring(x, y, radius * 1.35, 'rgba(255,255,255,0.9)', 0.45, 14);
    FX.fire(x, y, Math.min(60, 10 + radius / 5), radius * 0.35, radius * 4);
    FX.smoke(x, y, Math.min(24, 3 + radius / 18), radius * 0.4, o.smoke || '#4a4440');
    FX.sparks(x, y, Math.min(40, 8 + radius / 8), radius * 6);
    FX.dust(x, Math.min(0, y + radius * 0.3), '#c9b8a0', 3, radius * 0.5, radius * 0.5, 60);
    Audio2.explode(radius / 120);
    this.shake(clamp(radius / 260, 0.2, 1));
    this.punch = Math.min(1.5, this.punch + radius / 150);
    if (radius >= 100) this.doHitstop(0.05);
    this.vibrate(clamp(radius / 2, 30, 200));
    if (o.party) {
      const cc = ['#ff4d6d', '#ffd23f', '#3fa7ff', '#4fd36a', '#9b5cff', '#ffffff'];
      for (let i = 0; i < 26; i++) { const a = rand(TAU), sp = rand(200, 800); FX.add({ type: PT.CHIP, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: rand(1, 1.8), size: rand(4, 7), col: pick(cc), a: rand(TAU), av: rand(-15, 15), g: 0.35 }); }
      for (let i = 0; i < 4; i++) FX.sparks(x, y, 6, radius * 6, pick(cc));
    }
    if (o.mega) {
      this.flashA = 1; this.flashCol = '#fffbe8';
      for (let i = 0; i < 30; i++) FX.add({ type: PT.DUST, x: x + rand(-radius, radius), y: rand(-60, 0), vx: rand(-400, 400), vy: rand(-200, -40), life: rand(1.8, 3), size: rand(50, 90), col: pick(['#c9b8a0', '#b7a9c9', '#d8cbb5']), g: 0, alpha: 0.55 });
      for (let i = 0; i < 30; i++) { const a = rand(-Math.PI, 0), sp = rand(400, 1200); FX.add({ type: PT.CHIP, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(1, 2), size: rand(6, 12), col: pick(['#7a6a8c', '#4a3f5c', '#9a8cad']), a: rand(TAU), av: rand(-10, 10) }); }
      FX.ring(x, 0, radius * 2.5, 'rgba(255,240,200,0.9)', 1.2, 30);
      this.shake(1.2); this.slowT = 0.6;
      Audio2.explode(2.5);
    }
  },

  shake(a) { this.trauma = Math.min(1, this.trauma + a); },
  doHitstop(t) { if (this.time - this.lastHitstop > 0.35) { this.hitstop = t; this.lastHitstop = this.time; } },
  vibrate(ms) {
    if (!SAVE.settings.vibro || !navigator.vibrate) return;
    const now = performance.now();
    if (now - this.lastVib < 70) return;
    this.lastVib = now;
    try { navigator.vibrate(Math.round(ms)); } catch (e) { /* ignore */ }
  },

  addLoot(v, wx, wy) {
    const mult = (1 + SAVE.up.greed * 0.15) * (1 + Math.min(this.combo, 50) * 0.02);
    v *= mult;
    this.loot += v; this.lootAcc += v;
    let n = 0;
    while (this.lootAcc >= this.coinUnit && n < 6) {
      this.lootAcc -= this.coinUnit; n++;
      const [sx, sy] = Render.w2s(wx, wy + this.introY);
      Coins.spawn(sx, sy, this.coinUnit);
    }
    if (this.lootAcc >= this.coinUnit) { const extra = Math.floor(this.lootAcc / this.coinUnit) * this.coinUnit; this.lootAcc -= extra; Coins.bank(extra); }
  },

  /* ---------- item simulation ---------- */
  onContact(it, ct) {
    const def = it.def;
    const vn = -(it.vx * ct.nx + it.vy * ct.ny);
    switch (def.kind) {
      case 'explode':
        it.dead = true;
        this.explode(it.x, it.y, def.aoe, it.dmg, { mega: def.mega, party: def.party, col: def.fire ? '#ffb347' : undefined });
        if (def.fire) FX.fire(it.x, it.y, 40, 40, 700);
        return;
      case 'cluster':
        it.dead = true;
        if (it.mini) this.explode(it.x, it.y, def.aoe, it.dmg, { k: 0.6, party: true });
        else this.explode(it.x, it.y, def.aoe * 1.3, it.dmg * 2, { party: true });
        return;
      case 'acid': it.dead = true; Effects.acid(it.x, it.y, it.dmg, def); return;
      case 'freeze': it.dead = true; Effects.freeze(it.x, it.y, it.dmg, def); return;
      case 'hole': it.dead = true; Effects.hole(it.x, it.y, it.dmg, def); return;
      case 'drill':
        if (!it.drilled) { it.state = 'drill'; it.drillT = 0; it.drilled = true; it.vx = 0; it.vy = 0; it.a = 0; it.av = 0; Audio2.drill(def.dur); return; }
        break;
    }
    if (vn > 140 && it.hitCD <= 0) {
      const power = clamp(vn / 1700, 0.3, 1.5);
      const dmg = it.dmg * power * (it.hits ? 0.6 : 1);
      const mat = ct.c.mat;
      const dealt = this.damageArea(ct.px, ct.py, def.aoe * (0.8 + power * 0.25), dmg, { power: vn * (0.25 + def.mass * 0.03) });
      const heavy = def.mass / 10;
      Audio2.impact(MATS[mat].cat, power * (0.6 + heavy * 0.6));
      if (heavy > 0.5) Audio2.impact('stone', power);
      FX.chips(ct.px, ct.py, mat, 3 + Math.round(def.mass), power, ct.nx, ct.ny);
      FX.dust(ct.px, ct.py, DUST[mat] || '#ccc', 1 + Math.round(heavy * 2), 20 + def.r, 10, 40);
      if (def.mass >= 3) FX.ring(ct.px, ct.py, def.aoe * 1.2, 'rgba(255,255,255,0.7)', 0.3, 6);
      this.shake(0.08 + heavy * 0.35 * power);
      this.punch = Math.min(1.5, this.punch + heavy * power);
      if (heavy * power > 0.8) this.doHitstop(0.045);
      this.vibrate(15 + heavy * 60);
      it.hits++;
      if (def.squeak && it.hits === 1) Audio2.squeak();
      if (def.breaks) { this.breakPiano(it); return; }
      if (!ct.c.alive) {
        const keep = 0.3 + (def.pierce || 0) * 0.62;
        it.vx *= keep; it.vy *= keep; it.hitCD = 0;
        return;
      }
      it.hitCD = 0.06;
    }
    // resolve
    it.x += ct.nx * ct.depth; it.y += ct.ny * ct.depth;
    const vdot = it.vx * ct.nx + it.vy * ct.ny;
    if (vdot < 0) {
      const e = vn > 200 ? def.bounce || 0.2 : 0;
      it.vx -= (1 + e) * vdot * ct.nx; it.vy -= (1 + e) * vdot * ct.ny;
      const tx = -ct.ny, ty = ct.nx;
      const vt = it.vx * tx + it.vy * ty;
      it.vx -= tx * vt * 0.03; it.vy -= ty * vt * 0.03;
      it.av = vt / it.r;
    }
  },

  breakPiano(it) {
    it.dead = true;
    Audio2.piano();
    for (let i = 0; i < 5; i++) {
      const w = rand(14, 30), h = rand(10, 22), x = it.x + rand(-25, 25), y = it.y + rand(-20, 10);
      World.addDebris([x, y, x + w, y, x + w, y + h, x, y + h], 'rubber', rand(-400, 400), rand(-700, -200), rand(-12, 12));
    }
    for (let i = 0; i < 18; i++) FX.add({ type: PT.KEY, x: it.x, y: it.y, vx: rand(-500, 500), vy: rand(-900, -200), life: rand(1, 1.8), size: rand(5, 8), col: i % 3 ? '#f4f1e8' : '#111', a: rand(TAU), av: rand(-15, 15) });
  },

  stepItems(dt) {
    const canHit = this.state === 'play' || this.state === 'collapse';
    for (const it of this.items) {
      if (it.dead) continue;
      it.age += dt;
      const def = it.def;
      if (it.state === 'drill') {
        it.drillT += dt;
        it.y += 230 * dt;
        it.a = Math.sin(it.drillT * 80) * 0.04;
        const dealt = this.damageArea(it.x, it.y + it.r * 0.6, def.aoe, it.dmg * dt, { quiet: true, power: 300, noCrit: true });
        this.dealtAcc += dealt;
        if (Math.random() < 0.5) FX.sparks(it.x, it.y + it.r, 1, 500);
        if (Math.random() < 0.3) { const ct = World.circleContact(it.x, it.y + it.r, 8); if (ct) FX.chips(it.x, it.y + it.r, ct.c.mat, 1, 0.6); }
        this.trauma = Math.max(this.trauma, 0.22);
        if (it.drillT > def.dur || it.y + it.r > 0) {
          it.state = null; it.vy = 100;
          if (this.dealtAcc >= 1) FX.text(it.x, it.y - 40, fmt(this.dealtAcc), '#ffffff', 32);
          this.dealtAcc = 0;
        }
        continue;
      }
      if (def.kind === 'cluster' && !it.mini && it.age > 0.38) {
        it.dead = true;
        Audio2.explode(0.3);
        FX.flash(it.x, it.y, 60); FX.smoke(it.x, it.y, 4, 25);
        for (let i = 0; i < def.n; i++) this.spawnItem('cluster', it.x, it.y, ((i / (def.n - 1)) - 0.5) * 900 + rand(-60, 60), it.vy * 0.6 + rand(-100, 50), { mini: true, r: 11, dmg: it.dmg });
        continue;
      }
      it.vy += G_ITEM * dt;
      it.x += it.vx * dt; it.y += it.vy * dt; it.a += it.av * dt;
      if (it.hitCD > 0) it.hitCD -= dt;
      if (def.fire && Math.random() < 0.9) FX.fire(it.x, it.y - it.r * 0.5, 1, it.r * 0.9, 80);
      if ((def.kind === 'explode' || it.mini) && Math.random() < 0.3) FX.add({ type: PT.SMOKE, x: it.x, y: it.y, vx: 0, vy: 0, life: 0.5, size: it.r * 0.6, col: '#8a8a8a', g: 0, alpha: 0.35 });
      if (canHit) {
        const ct = World.circleContact(it.x, it.y, it.r);
        if (ct) { this.onContact(it, ct); if (it.dead) continue; }
      }
      // ground
      if (it.y + it.r > 0) {
        it.y = -it.r;
        if (['explode', 'cluster', 'acid', 'freeze', 'hole'].includes(def.kind)) {
          this.onContact(it, { nx: 0, ny: -1, depth: 0, px: it.x, py: 0, c: { mat: 'stone', alive: true } });
          continue;
        }
        if (it.vy > 300) {
          Audio2.land(it.vy / 2500 * (0.5 + def.mass / 10));
          FX.dust(it.x, 0, WORLDS[this.world].ground[0], 2, 20 + it.r, 15, 30);
          if (def.mass > 5) this.shake(0.15);
          if (def.squeak && !it.hits) { Audio2.squeak(); it.hits = 1; }
        }
        it.vy = -it.vy * (def.bounce || 0.2) * 0.7;
        if (Math.abs(it.vy) < 60) it.vy = 0;
        it.vx *= 0.9; it.av = it.vx / it.r;
      }
      // push debris
      for (const d of World.debris) {
        if (d.dead) continue;
        const dx = d.x - it.x, dy = d.y - it.y, rr = d.cr * 0.8 + it.r;
        if (dx * dx + dy * dy > rr * rr) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist, ny = dy / dist;
        const share = Math.min(1, (def.mass || 1) / (d.m + 0.5));
        const rel = it.vx * nx + it.vy * ny;
        if (rel > 0) { d.vx += nx * rel * share; d.vy += ny * rel * share; d.av += rand(-3, 3); d.sleep = false; d.still = 0; it.vx *= 0.97; it.vy *= 0.97; }
        d.x += nx * (rr - dist) * 0.5; d.y += ny * (rr - dist) * 0.5;
      }
      // rest & fade
      if (Math.abs(it.vx) + Math.abs(it.vy) < 50) it.restT += dt; else it.restT = Math.max(0, it.restT - dt);
      if (it.restT > 0.9 || it.age > 9) { it.alpha -= dt * 2.5; if (it.alpha <= 0) it.dead = true; }
      if (Math.abs(it.x) > 2500) it.dead = true;
    }
  },

  collapse() {
    this.state = 'collapse';
    this.slowT = 1.1;
    const b = World.bbox;
    const cx = (b.x0 + b.x1) / 2;
    let area = 0;
    for (const c of World.cells) {
      if (!c.alive) continue;
      World.killCell(c);
      area += c.area;
      const pieces = c.area > 700 ? splitPoly(c.pts, c.cx, c.cy, rand(TAU)) : [c.pts];
      for (const P of pieces) {
        const dx = c.cx - cx, dy = c.cy + 20;
        const dl = Math.hypot(dx, dy) || 1;
        const sp = rand(150, 600);
        World.addDebris(P, c.mat, (dx / dl) * sp + rand(-80, 80), (dy / dl) * sp * 0.7 - rand(100, 400), rand(-7, 7));
      }
      if (Math.random() < 0.5) FX.dust(c.cx, c.cy, DUST[c.mat] || '#ccc', 1, 30, 10, 20);
      this.addLoot(c.maxHP * LOOT_K * MATS[c.mat].coin, c.cx, c.cy);
    }
    World.standingHP = 0;
    World.structDirty = true;
    for (let x = b.x0; x <= b.x1; x += 40) FX.dust(x, -10, DUST.stone, 1, 60, 20, 80);
    FX.ring(cx, 0, (b.x1 - b.x0), 'rgba(255,255,255,0.8)', 0.7, 20);
    Audio2.crumble(1.5); Audio2.explode(0.8);
    this.shake(0.9); this.flashA = 0.35; this.flashCol = '#ffffff';
    this.vibrate(220);
    this.winTimer = 1.9;
    setTimeout(() => Audio2.fanfare(), 650);
    SDK.gameplayStop();
  },

  onDebrisLand(d, impact) {
    if (impact > 750 && d.area > 650 && World.debris.length < 280 && !d.split) { d.split = true; this.splitQueue.push(d); }
    if (impact > 400) {
      const cat = MATS[d.mat].cat;
      Audio2.impact(cat, clamp(impact / 2500, 0.1, 0.6) * Math.min(1, d.area / 1500));
      if (Math.random() < 0.6) FX.dust(d.x, -5, DUST[d.mat] || '#ccc', 1, 12 + Math.sqrt(d.area) * 0.5, 10, 25);
      if (d.area > 1500 && impact > 900) this.shake(0.06);
    }
  },

  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    this.punch = Math.max(0, this.punch - dt * 6);
    this.flashA = Math.max(0, this.flashA - dt * 2.5);
    Coins.update(dt);
    if (this.paused) return;
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    if (this.slowT > 0) { this.slowT -= dt; this.timeScale = lerp(1, 0.3, clamp(this.slowT / 0.3, 0, 1)); } else this.timeScale = 1;
    const sdt = dt * this.timeScale;
    this.time += sdt;

    if (this.state === 'intro') {
      this.introT += dt;
      const t = clamp(this.introT / 0.55, 0, 1);
      this.introY = -1200 * (1 - t) * (1 - t);
      if (t >= 1) {
        this.introY = 0; this.state = 'play';
        const b = World.bbox;
        for (let x = b.x0; x <= b.x1; x += 30) FX.dust(x, -6, DUST[World.cells[0] ? World.cells[0].mat : 'stone'] || '#ccc', 1, 40, 10, 60);
        Audio2.land(1); Audio2.crumble(0.35);
        this.shake(0.45); this.vibrate(60);
        SDK.gameplayStart();
        UI.onPlayStart();
      }
    }
    if (this.state === 'play') this.levelTime += sdt;

    for (const id in this.cd) {
      if (this.cd[id] > 0) { this.cd[id] -= sdt; if (this.cd[id] <= 0) { this.cd[id] = 0; UI.onReady(id); } }
    }
    // cell timers
    let fl = 0;
    for (const c of this.flashing) { c.flash -= sdt * 6; if (c.flash > 0) this.flashing[fl++] = c; }
    this.flashing.length = fl;
    for (const c of World.cells) {
      if (c.frozen > 0) { c.frozen -= sdt; if (c.frozen <= 0) { c.frozen = 0; World.structDirty = true; } }
      if (c.acid > 0) { c.acid -= sdt; if (c.acid <= 0) { c.acid = 0; World.structDirty = true; } }
    }

    const sub = 4;
    for (let i = 0; i < sub; i++) this.stepItems(sdt / sub);
    this.items = this.items.filter((it) => !it.dead);
    Effects.update(sdt);

    World.stepDebris(sdt / 2, (d, imp) => this.onDebrisLand(d, imp));
    World.stepDebris(sdt / 2, (d, imp) => this.onDebrisLand(d, imp));
    World.collideDebris();
    for (const d of this.splitQueue) if (!d.dead) {
      const parts = World.splitDebris(d);
      FX.chips(d.x, d.y, d.mat, 3, 0.5);
    }
    this.splitQueue.length = 0;
    // debris lifetime
    const n = World.debris.length;
    for (const d of World.debris) {
      if (d.dead) continue;
      const limit = n > 300 ? 1.2 : n > 180 ? 3 : 5.5;
      if ((d.sleep && d.still > limit) || d.life > 14 || d.shrink < 0.15) { d.alpha -= sdt * 1.6; if (d.alpha <= 0) d.dead = true; }
    }
    if (World.debris.some((d) => d.dead)) World.debris = World.debris.filter((d) => !d.dead);

    if (World.checkPending && (this.state === 'play')) this.detach(World.structuralCheck());
    else World.checkPending = false;

    FX.update(sdt, World.grav);
    Ambient.update(sdt);
    Drone.update(sdt);

    if (this.comboT > 0) { this.comboT -= sdt; if (this.comboT <= 0) this.combo = 0; }

    if (this.pointer.down && this.state === 'play') this.tryDrop(false);

    if (this.state === 'play' && World.standingHP <= World.winHP) this.collapse();
    if (this.state === 'collapse') {
      this.winTimer -= dt;
      if (this.winTimer <= 0) { this.state = 'win'; Coins.flush(); UI.showWin(); }
    }
  },

  drawAim(g) {
    if (this.state !== 'play' || this.paused || !(this.pointer.over || this.pointer.down)) return;
    const [wx] = Render.s2w(this.pointer.x, this.pointer.y);
    const def = ITEM[this.sel];
    const ready = !(this.cd[this.sel] > 0);
    let yHit = 0;
    World.query(wx - 2, this.topY, wx + 2, 0, (c) => { if (c.bb.x0 <= wx && c.bb.x1 >= wx) yHit = Math.min(yHit, c.bb.y0); });
    g.save();
    g.setLineDash([14, 12]);
    g.lineDashOffset = -this.time * 60;
    g.strokeStyle = def.kind === 'laser' ? 'rgba(255,220,90,0.7)' : def.kind === 'bolt' ? 'rgba(255,230,90,0.6)' : 'rgba(255,255,255,0.45)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(wx, this.topY + 80); g.lineTo(wx, yHit); g.stroke();
    g.setLineDash([]);
    g.globalAlpha = ready ? 0.9 : 0.35;
    g.strokeStyle = '#fff'; g.lineWidth = 3;
    g.beginPath(); g.arc(wx, yHit, 14 + Math.sin(this.time * 8) * 3, 0, TAU); g.stroke();
    if (def.r) { g.translate(wx, this.topY + 50); drawItem(g, def.id, def.r, this.time, 7); }
    g.restore();
  },
};

/* ===== Area / timed effects ===== */
const Effects = {
  list: [],
  tnt(x, y) { this.list.push({ type: 'tnt', x, y, t: 0, dur: rand(0.07, 0.16) }); },
  acid(x, y, dmg, def) {
    this.list.push({ type: 'acid', x, y, t: 0, dur: def.dur, r: def.aoe, dmg, tick: 0, dealt: 0, show: 0 });
    Audio2.acid();
    for (let i = 0; i < 40; i++) FX.add({ type: PT.DROP, x, y, vx: rand(-500, 500), vy: rand(-600, -100), life: rand(0.6, 1.2), size: rand(3, 7), col: pick(['#8cff4a', '#5adb2a', '#c4ff7a']) });
    FX.flash(x, y, def.aoe, '#9cff5a', 0.3);
    this.applyAcid(this.list[this.list.length - 1], 0.25);
  },
  applyAcid(e, k) {
    World.query(e.x - e.r, e.y - e.r, e.x + e.r, e.y + e.r, (c) => { if (Math.hypot(c.cx - e.x, c.cy - e.y) < e.r) { c.acid = 0.5; World.structDirty = true; } });
    e.dealt += G.damageArea(e.x, e.y, e.r, (e.dmg * k) / 1, { quiet: true, power: 200, noCrit: true });
  },
  freeze(x, y, dmg, def) {
    let n = 0;
    World.query(x - def.aoe, y - def.aoe, x + def.aoe, y + def.aoe, (c) => { if (Math.hypot(c.cx - x, c.cy - y) < def.aoe) { c.frozen = def.dur; n++; } });
    World.structDirty = true;
    G.damageArea(x, y, def.aoe * 0.5, dmg, { power: 200 });
    FX.flash(x, y, def.aoe * 1.2, '#bdf0ff', 0.35);
    FX.ring(x, y, def.aoe, 'rgba(190,240,255,0.95)', 0.5, 16);
    for (let i = 0; i < 30; i++) FX.add({ type: PT.SHARD, x, y, vx: rand(-700, 700), vy: rand(-800, 100), life: rand(0.6, 1.3), size: rand(4, 9), col: pick(['#e9fbff', '#9fe3ff', '#ffffff']), a: rand(TAU), av: rand(-12, 12), alpha: 0.9 });
    Audio2.freeze(); G.shake(0.25); G.vibrate(40);
    FX.text(x, y - 60, '❄ x2.5', '#bdf0ff', 30);
  },
  bolt(x, dmg, def) {
    let top = null;
    World.query(x - 30, G.topY, x + 30, 0, (c) => { if (!top || c.bb.y0 < top.bb.y0) top = c; });
    const pts = [];
    let px = x, py = 0;
    if (top) { px = clamp(x, top.bb.x0, top.bb.x1); py = top.cy; }
    const segs = [];
    segs.push(this.jag(x + rand(-40, 40), G.topY - 50, px, py, 40));
    let dealt = G.damageArea(px, py, def.aoe, dmg, { power: 600 });
    const hit = new Set();
    if (top) hit.add(top);
    let prev = { cx: px, cy: py };
    for (let i = 0; i < def.n; i++) {
      const cand = [];
      World.query(prev.cx - 180, prev.cy - 180, prev.cx + 180, prev.cy + 180, (c) => { if (!hit.has(c) && Math.hypot(c.cx - prev.cx, c.cy - prev.cy) < 180) cand.push(c); });
      if (!cand.length) break;
      const c = pick(cand);
      hit.add(c);
      segs.push(this.jag(prev.cx, prev.cy, c.cx, c.cy, 18));
      dealt += G.damageArea(c.cx, c.cy, def.aoe * 0.7, dmg * 0.65, { quiet: true, power: 400 });
      FX.sparks(c.cx, c.cy, 5, 500, '#cfe8ff');
      prev = c;
    }
    this.list.push({ type: 'bolt', t: 0, dur: 0.35, segs });
    FX.flash(px, py, 160, '#d8ecff', 0.3);
    FX.sparks(px, py, 20, 900, '#e8f4ff');
    G.flashA = 0.35; G.flashCol = '#dfeaff';
    G.shake(0.35); G.vibrate(50);
    Audio2.zap();
    if (dealt > 0) FX.text(px, py - 70, fmt(dealt), '#cfe8ff', 34);
  },
  jag(x0, y0, x1, y1, amp) {
    const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 40));
    const p = [x0, y0];
    for (let i = 1; i < n; i++) { const t = i / n; p.push(lerp(x0, x1, t) + rand(-amp, amp), lerp(y0, y1, t) + rand(-amp * 0.3, amp * 0.3)); }
    p.push(x1, y1);
    return p;
  },
  laser(x, dmg, def) {
    this.list.push({ type: 'laser', x, t: 0, dur: def.dur, dmg, r: def.aoe, head: G.topY, dealt: 0, show: 0 });
    Audio2.laser(def.dur);
    G.flashA = 0.2; G.flashCol = '#fff2b0';
  },
  hole(x, y, dmg, def) {
    this.list.push({ type: 'hole', x, y, t: 0, dur: def.dur, dmg, r: def.aoe, dealt: 0, show: 0 });
    Audio2.hole(def.dur);
    FX.flash(x, y, 140, '#b98aff', 0.3);
  },
  update(dt) {
    for (const e of this.list) {
      e.t += dt;
      switch (e.type) {
        case 'tnt':
          if (e.t >= e.dur && !e.done) { e.done = true; G.explode(e.x, e.y, 105, World.totalHP * 0.03 + 20, { k: 0.9, noCrit: true, party: true }); }
          break;
        case 'acid':
          e.tick += dt;
          if (e.tick >= 0.25) { e.tick = 0; this.applyAcid(e, 0.25); }
          if (Math.random() < 0.6) FX.add({ type: PT.DUST, x: e.x + rand(-e.r, e.r) * 0.7, y: e.y + rand(-e.r, e.r) * 0.5, vx: 0, vy: -30, life: 0.8, size: 14, col: '#8cff4a', g: 0, alpha: 0.4 });
          if (Math.random() < 0.4) FX.add({ type: PT.DROP, x: e.x + rand(-e.r, e.r) * 0.6, y: e.y + rand(-20, 30), vx: rand(-30, 30), vy: rand(0, 60), life: 1, size: rand(2, 4), col: '#7aef3a' });
          e.show += dt;
          if (e.show > 1 && e.dealt >= 1) { FX.text(e.x, e.y - 40, fmt(e.dealt), '#b8ff7a', 26); e.dealt = 0; e.show = 0; }
          break;
        case 'laser': {
          const k = clamp(e.t / (e.dur * 0.9), 0, 1);
          e.head = lerp(G.topY + 100, 0, k * k * (3 - 2 * k));
          e.dealt += G.damageArea(e.x, e.head, e.r, e.dmg * dt, { quiet: true, power: 300, noCrit: true });
          if (Math.random() < 0.8) FX.sparks(e.x, e.head, 2, 600, pick(['#fff2a0', '#fff', '#ffc84a']));
          if (Math.random() < 0.3) FX.smoke(e.x, e.head, 1, 20, '#5a4a4a');
          G.trauma = Math.max(G.trauma, 0.2);
          e.show += dt;
          if (e.show > 0.4 && e.dealt >= 1) { FX.text(e.x + 40, e.head - 20, fmt(e.dealt), '#fff2a0', 26); e.dealt = 0; e.show = 0; }
          break;
        }
        case 'hole': {
          e.dealt += G.damageArea(e.x, e.y, e.r, e.dmg * dt, { quiet: true, power: 100, noCrit: true });
          const R = e.r * 2.6;
          for (const d of World.debris) {
            const dx = e.x - d.x, dy = e.y - d.y, dist = Math.hypot(dx, dy) || 1;
            if (dist > R) continue;
            const acc = 2600 * (1 - dist / R) + 900;
            d.vx += (dx / dist) * acc * dt; d.vy += (dy / dist) * acc * dt - G_DEBRIS * World.grav * dt * 0.9;
            d.vx *= 0.985; d.vy *= 0.985;
            d.av += dt * 6; d.sleep = false; d.still = 0;
            if (dist < 40) d.shrink = Math.max(0.05, d.shrink - dt * 4);
          }
          if (Math.random() < 0.8) { const a = rand(TAU), rr = rand(e.r, e.r * 1.6); FX.add({ type: PT.DUST, x: e.x + Math.cos(a) * rr, y: e.y + Math.sin(a) * rr, vx: -Math.cos(a) * rr * 2 - Math.sin(a) * 200, vy: -Math.sin(a) * rr * 2 + Math.cos(a) * 200, life: 0.5, size: 10, col: '#b98aff', g: 0, alpha: 0.6 }); }
          G.trauma = Math.max(G.trauma, 0.18);
          e.show += dt;
          if (e.show > 0.6 && e.dealt >= 1) { FX.text(e.x, e.y - e.r * 0.6, fmt(e.dealt), '#d9b8ff', 28); e.dealt = 0; e.show = 0; }
          if (e.t >= e.dur && !e.done) { e.done = true; G.explode(e.x, e.y, e.r * 0.9, e.dmg * 1.2, { col: '#c9a0ff', smoke: '#3a2a5a' }); }
          break;
        }
      }
    }
    this.list = this.list.filter((e) => e.t < e.dur || (e.type === 'tnt' && !e.done) || (e.type === 'hole' && !e.done));
  },
  drawUnder(g) {
    for (const e of this.list) {
      if (e.type === 'acid') {
        const a = (1 - e.t / e.dur) * 0.5;
        g.globalAlpha = a; g.drawImage(softSprite('#7aef3a'), e.x - e.r, e.y - e.r * 0.7, e.r * 2, e.r * 1.4);
        g.globalAlpha = 1;
      }
    }
  },
  drawOver(g) {
    for (const e of this.list) {
      if (e.type === 'bolt') {
        const a = (1 - e.t / e.dur) * (Math.random() < 0.3 ? 0.4 : 1);
        g.globalCompositeOperation = 'lighter';
        for (const [w, col] of [[14, 'rgba(120,170,255,0.35)'], [6, 'rgba(200,225,255,0.8)'], [2.5, '#ffffff']]) {
          g.strokeStyle = col; g.lineWidth = w; g.globalAlpha = a; g.lineJoin = 'round';
          for (const p of e.segs) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); }
        }
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      } else if (e.type === 'laser') {
        const k = e.t / e.dur;
        const fade = k > 0.9 ? (1 - k) / 0.1 : Math.min(1, e.t / 0.08);
        const w = e.r * (0.9 + Math.sin(e.t * 50) * 0.08);
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.35 * fade; g.fillStyle = '#ffb92e'; g.fillRect(e.x - w, G.topY, w * 2, e.head - G.topY);
        g.globalAlpha = 0.7 * fade; g.fillStyle = '#ffe07a'; g.fillRect(e.x - w * 0.45, G.topY, w * 0.9, e.head - G.topY);
        g.globalAlpha = fade; g.fillStyle = '#fff4f0'; g.fillRect(e.x - w * 0.15, G.topY, w * 0.3, e.head - G.topY);
        g.drawImage(softSprite('#ffd24a'), e.x - w * 3, e.head - w * 3, w * 6, w * 6);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      } else if (e.type === 'hole') {
        const k = e.t / e.dur;
        const sc = k < 0.15 ? easeOutBack(k / 0.15) : k > 0.9 ? (1 - k) / 0.1 : 1;
        const r = e.r * 0.45 * sc;
        g.save(); g.translate(e.x, e.y);
        g.globalAlpha = 0.85;
        g.drawImage(softSprite('#5a1aa8'), -r * 3, -r * 3, r * 6, r * 6);
        g.globalAlpha = 1;
        g.rotate(e.t * 3);
        g.strokeStyle = '#e8ccff'; g.lineWidth = 4;
        g.beginPath(); g.ellipse(0, 0, r * 1.7, r * 0.5, 0, 0, TAU); g.stroke();
        g.strokeStyle = '#b07aff'; g.lineWidth = 8; g.globalAlpha = 0.5;
        g.beginPath(); g.ellipse(0, 0, r * 2, r * 0.65, 0.3, 0, TAU); g.stroke();
        g.globalAlpha = 1;
        g.fillStyle = '#2a1060'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,220,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r + 2, 0, TAU); g.stroke();
        g.restore();
      }
    }
  },
};

/* ===== Flying coins (screen space) ===== */
const Coins = {
  list: [], banked: 0, n: 0,
  spawn(x, y, v) {
    if (this.list.length > 90) { this.bank(v); return; }
    const a = rand(-Math.PI * 0.9, -Math.PI * 0.1);
    const sp = rand(150, 420);
    this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, v, spin: rand(TAU) });
  },
  bank(v) { this.banked += v; },
  update(dt) {
    const tgt = UI.coinTarget();
    for (const c of this.list) {
      c.t += dt; c.spin += dt * 9;
      if (c.t < 0.35) { c.vy += 1500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.97; }
      else {
        const k = Math.min(1, dt * (5 + (c.t - 0.35) * 30));
        c.x = lerp(c.x, tgt[0], k); c.y = lerp(c.y, tgt[1], k);
        if (Math.hypot(c.x - tgt[0], c.y - tgt[1]) < 14) { c.done = true; this.collect(c.v); }
      }
    }
    this.list = this.list.filter((c) => !c.done);
    if (this.banked >= 1 && !this.list.length) { const v = Math.floor(this.banked); this.banked -= v; SAVE.coins += v; UI.bumpCoins(); }
  },
  collect(v) {
    SAVE.coins += v; this.n++;
    Audio2.coin(G.combo);
    UI.bumpCoins();
  },
  flush() {
    let v = 0;
    for (const c of this.list) v += c.v;
    v += Math.floor(this.banked); this.banked = 0;
    this.list.length = 0;
    if (v) { SAVE.coins += v; UI.bumpCoins(); }
  },
  draw(g) {
    for (const c of this.list) {
      const sx = Math.abs(Math.cos(c.spin));
      g.save(); g.translate(c.x, c.y); g.scale(Math.max(0.15, sx), 1);
      g.fillStyle = '#b5791a'; g.beginPath(); g.arc(0, 1.5, 10, 0, TAU); g.fill();
      g.fillStyle = '#ffcf3a'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
      g.fillStyle = '#ffe98a'; g.beginPath(); g.arc(-2, -2, 6, 0, TAU); g.fill();
      g.fillStyle = '#d9981f'; g.fillRect(-1.5, -5, 3, 10);
      g.restore();
    }
  },
};

/* ===== Auto-dropping drone upgrade ===== */
const Drone = {
  x: 0, y: -600, t: 0, timer: 2, vis: 0,
  update(dt) {
    const lvl = SAVE.up.drone;
    const on = lvl > 0 && G.state === 'play';
    this.vis = clamp(this.vis + (on ? dt : -dt) * 2, 0, 1);
    if (!lvl) return;
    this.t += dt;
    const b = World.bbox;
    const cx = (b.x0 + b.x1) / 2, hw = Math.max(60, (b.x1 - b.x0) / 2 - 20);
    this.x = cx + Math.sin(this.t * 0.8) * hw;
    this.y = Math.max(G.topY + 110, b.y0 - 180) + Math.sin(this.t * 3) * 8;
    if (!on) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = droneInterval(lvl);
      G.spawnItem('rock', this.x, this.y + 24, 0, 200, { r: 14, dmgMult: 0.5 + 0.12 * lvl, drone: true });
    }
  },
  draw(g) {
    if (this.vis <= 0) return;
    g.save(); g.globalAlpha = this.vis; g.translate(this.x, this.y);
    g.rotate(Math.cos(this.t * 0.8) * 0.12);
    g.fillStyle = '#2b2f36'; g.fillRect(-34, -4, 68, 6);
    for (const x of [-34, 34]) {
      g.fillStyle = '#2b2f36'; g.fillRect(x - 2, -10, 4, 8);
      g.fillStyle = 'rgba(200,210,220,0.55)'; g.beginPath(); g.ellipse(x, -11, 18 * Math.abs(Math.sin(this.t * 40)) + 4, 3, 0, 0, TAU); g.fill();
    }
    g.fillStyle = '#ffc93c'; g.beginPath(); g.ellipse(0, 2, 18, 11, 0, 0, TAU); g.fill();
    g.fillStyle = '#1c1f24'; g.beginPath(); g.arc(0, 8, 5, 0, TAU); g.fill();
    g.fillStyle = (Math.floor(this.t * 3) % 2) ? '#ff4d3d' : '#55ff7a'; g.beginPath(); g.arc(10, -2, 2.5, 0, TAU); g.fill();
    g.restore();
  },
};
