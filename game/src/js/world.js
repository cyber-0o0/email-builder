'use strict';
/* ===== World: destructible structure (Voronoi cells), damage, debris physics ===== */
const G_ITEM = 3000;        // gravity for dropped items
const G_DEBRIS = 2500;      // gravity for debris
const BUCKET = 64;

const World = {
  cells: [], buckets: new Map(), qid: 0,
  totalHP: 0, standingHP: 0, winHP: 0,
  bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
  debris: [], structDirty: true, checkPending: false,
  grav: 1,

  build(level) {
    const info = targetForLevel(level);
    const parts = info.def.build();
    const R = mulberry32(level * 7919 + 13);
    const cells = [];
    let totalArea = 0;
    for (const part of parts) totalArea += Math.abs(polyArea(part.pts));
    const CS = clamp(Math.sqrt(totalArea / 190), 22, 38);
    this.cellSize = CS;
    for (const part of parts) {
      const pts = [];
      for (let i = 0; i < part.pts.length; i += 2) pts.push(part.pts[i], -part.pts[i + 1]);
      if (polyArea(pts) < 0) { // normalize winding
        const rev = [];
        for (let i = pts.length - 2; i >= 0; i -= 2) rev.push(pts[i], pts[i + 1]);
        pts.length = 0; pts.push(...rev);
      }
      const area = Math.abs(polyArea(pts));
      const n = Math.max(1, Math.round(area / (CS * CS)));
      const bb = polyBBox(pts);
      const seeds = [];
      const minD = CS * 0.62;
      let tries = 0;
      while (seeds.length < n && tries < n * 60) {
        tries++;
        const x = bb.x0 + R() * (bb.x1 - bb.x0), y = bb.y0 + R() * (bb.y1 - bb.y0);
        if (!pointInPoly(pts, x, y)) continue;
        const md = tries < n * 40 ? minD : minD * 0.4;
        let ok = true;
        for (let k = 0; k < seeds.length; k += 2) { const dx = seeds[k] - x, dy = seeds[k + 1] - y; if (dx * dx + dy * dy < md * md) { ok = false; break; } }
        if (ok) seeds.push(x, y);
      }
      if (seeds.length <= 2) { cells.push(this.makeCell(pts, part.m, R)); continue; }
      for (let i = 0; i < seeds.length; i += 2) {
        let poly = pts;
        const sx = seeds[i], sy = seeds[i + 1];
        for (let j = 0; j < seeds.length; j += 2) {
          if (i === j) continue;
          const tx = seeds[j], ty = seeds[j + 1];
          const nx = tx - sx, ny = ty - sy;
          if (nx * nx + ny * ny > CS * CS * 20) continue;
          poly = clipHalf(poly, nx, ny, nx * (sx + tx) / 2 + ny * (sy + ty) / 2);
          if (poly.length < 6) break;
        }
        poly = cleanPoly(poly);
        if (poly.length < 6 || Math.abs(polyArea(poly)) < 6) continue;
        cells.push(this.makeCell(poly, part.m, R));
      }
    }
    // HP normalisation
    let raw = 0;
    for (const c of cells) raw += c.area * MATS[c.mat].hp;
    const hp = levelHP(level);
    const k = hp / raw;
    for (const c of cells) { c.maxHP = c.hp = c.area * MATS[c.mat].hp * k; }
    cells.forEach((c, i) => { c.id = i; });
    this.cells = cells;
    this.totalHP = this.standingHP = hp;
    this.winHP = hp * 0.12;
    this.adjacency();
    this.rebuildBuckets();
    this.debris.length = 0;
    this.structDirty = true;
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const c of cells) { b.x0 = Math.min(b.x0, c.bb.x0); b.y0 = Math.min(b.y0, c.bb.y0); b.x1 = Math.max(b.x1, c.bb.x1); b.y1 = Math.max(b.y1, c.bb.y1); }
    this.bbox = b;
    this.grav = WORLDS[info.world].grav;
    // sanity: anything floating at start gets anchored to avoid instant collapse
    const reach = this.reachable();
    for (const c of cells) if (!reach[c.id]) c.anchored = true;
    return info;
  },

  makeCell(pts, mat, R) {
    const cen = polyCentroid(pts);
    const bb = polyBBox(pts);
    let r = 0;
    for (let i = 0; i < pts.length; i += 2) r = Math.max(r, Math.hypot(pts[i] - cen.x, pts[i + 1] - cen.y));
    // crack polylines from an off-centre point toward random vertices
    const cracks = [];
    const ox = cen.x + (R() - 0.5) * r * 0.5, oy = cen.y + (R() - 0.5) * r * 0.5;
    const nb = 2 + Math.floor(R() * 2);
    const nv = pts.length / 2;
    for (let b = 0; b < nb; b++) {
      const vi = Math.floor(R() * nv) * 2;
      const tx = pts[vi] * 0.85 + cen.x * 0.15, ty = pts[vi + 1] * 0.85 + cen.y * 0.15;
      const line = [ox, oy];
      const steps = 3;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const j = s === steps ? 0 : (R() - 0.5) * r * 0.35;
        line.push(lerp(ox, tx, t) + j, lerp(oy, ty, t) + j * 0.7);
      }
      cracks.push(line);
    }
    return {
      id: 0, pts, cx: cen.x, cy: cen.y, area: cen.a, r, bb, mat, hp: 1, maxHP: 1, alive: true,
      nb: [], anchored: bb.y1 >= -2.5, cracks, frozen: 0, acid: 0, flash: 0, _q: 0,
    };
  },

  adjacency() {
    const cs = this.cells;
    const eps = 3;
    const near = (a, b) => { // count vertices of a lying on/inside b
      let n = 0;
      const p = a.pts, q = b.pts;
      for (let i = 0; i < p.length; i += 2) {
        const x = p[i], y = p[i + 1];
        if (x < b.bb.x0 - eps || x > b.bb.x1 + eps || y < b.bb.y0 - eps || y > b.bb.y1 + eps) continue;
        if (pointInPoly(q, x, y)) { n++; continue; }
        const cp = closestOnPoly(q, x, y);
        if (cp.d2 < eps * eps) n++;
      }
      return n;
    };
    for (let i = 0; i < cs.length; i++) {
      const a = cs[i];
      for (let j = i + 1; j < cs.length; j++) {
        const b = cs[j];
        if (a.bb.x1 + eps < b.bb.x0 || b.bb.x1 + eps < a.bb.x0 || a.bb.y1 + eps < b.bb.y0 || b.bb.y1 + eps < a.bb.y0) continue;
        if (near(a, b) + near(b, a) >= 2) { a.nb.push(j); b.nb.push(i); }
      }
    }
  },

  rebuildBuckets() {
    this.buckets.clear();
    for (const c of this.cells) {
      if (!c.alive) continue;
      const ix0 = Math.floor(c.bb.x0 / BUCKET), ix1 = Math.floor(c.bb.x1 / BUCKET);
      const iy0 = Math.floor(c.bb.y0 / BUCKET), iy1 = Math.floor(c.bb.y1 / BUCKET);
      for (let ix = ix0; ix <= ix1; ix++) for (let iy = iy0; iy <= iy1; iy++) {
        const k = (ix + 512) * 4096 + (iy + 2048);
        let arr = this.buckets.get(k);
        if (!arr) { arr = []; this.buckets.set(k, arr); }
        arr.push(c);
      }
    }
  },

  /* iterate alive cells whose bucket overlaps the box */
  query(x0, y0, x1, y1, fn) {
    const q = ++this.qid;
    const ix0 = Math.floor(x0 / BUCKET), ix1 = Math.floor(x1 / BUCKET);
    const iy0 = Math.floor(y0 / BUCKET), iy1 = Math.floor(y1 / BUCKET);
    for (let ix = ix0; ix <= ix1; ix++) for (let iy = iy0; iy <= iy1; iy++) {
      const arr = this.buckets.get((ix + 512) * 4096 + (iy + 2048));
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        if (!c.alive || c._q === q) continue;
        c._q = q;
        if (c.bb.x1 < x0 || c.bb.x0 > x1 || c.bb.y1 < y0 || c.bb.y0 > y1) continue;
        if (fn(c) === false) return;
      }
    }
  },

  /* deepest contact between a circle and standing cells */
  circleContact(x, y, r) {
    let best = null, bestDepth = 0;
    this.query(x - r, y - r, x + r, y + r, (c) => {
      const inside = pointInPoly(c.pts, x, y);
      const cp = closestOnPoly(c.pts, x, y);
      const d = Math.sqrt(cp.d2);
      if (!inside && d >= r) return;
      let nx, ny, depth;
      if (d < 1e-4) { nx = 0; ny = -1; depth = r; }
      else if (inside) { nx = (cp.x - x) / d; ny = (cp.y - y) / d; depth = r + d; }
      else { nx = (x - cp.x) / d; ny = (y - cp.y) / d; depth = r - d; }
      if (depth > bestDepth) { bestDepth = depth; best = { c, nx, ny, depth, px: cp.x, py: cp.y }; }
    });
    return best;
  },

  reachable() {
    const seen = new Uint8Array(this.cells.length);
    const stack = [];
    for (const c of this.cells) if (c.alive && c.anchored) { seen[c.id] = 1; stack.push(c.id); }
    while (stack.length) {
      const id = stack.pop();
      const nb = this.cells[id].nb;
      for (let i = 0; i < nb.length; i++) {
        const j = nb[i];
        if (!seen[j] && this.cells[j].alive) { seen[j] = 1; stack.push(j); }
      }
    }
    return seen;
  },

  /* detach everything no longer connected to the ground; returns detached cells */
  structuralCheck() {
    this.checkPending = false;
    const seen = this.reachable();
    const out = [];
    for (const c of this.cells) {
      if (c.alive && !seen[c.id]) { c.alive = false; this.standingHP -= c.hp; out.push(c); }
    }
    if (out.length) { this.structDirty = true; this.rebuildBuckets(); }
    return out;
  },

  killCell(c) {
    c.alive = false;
    this.structDirty = true;
    this.checkPending = true;
    this._bucketsDirty = true;
  },

  /* ===== debris rigid bodies ===== */
  addDebris(wp, mat, vx, vy, av, ref) {
    if (wp.length < 6) return null;
    const cen = polyCentroid(wp);
    if (cen.a < 8) return null;
    const m = MATS[mat];
    const mass = (cen.a * m.dens) / 1000;
    const Iu = polyInertia(wp, cen.x, cen.y);
    let r = 0;
    for (let i = 0; i < wp.length; i += 2) r = Math.max(r, Math.hypot(wp[i] - cen.x, wp[i + 1] - cen.y));
    let x = cen.x, y = cen.y, a = 0;
    if (ref) { // piece of an already moving body: map reference-frame centroid to world
      const c = Math.cos(ref.a), s = Math.sin(ref.a);
      const lx = cen.x - ref.ox, ly = cen.y - ref.oy;
      x = ref.x + lx * c - ly * s; y = ref.y + lx * s + ly * c; a = ref.a;
    }
    const d = {
      wp, ox: cen.x, oy: cen.y, x, y, a, vx, vy, av, m: mass, I: Math.max(mass * Iu, 0.01),
      r, cr: Math.sqrt(cen.a / Math.PI) * 0.92, area: cen.a, mat, sleep: false, still: 0, life: 0, alpha: 1,
      dmg: 0, shrink: 1, landed: false,
    };
    this.debris.push(d);
    return d;
  },

  splitDebris(d) {
    const ang = rand(TAU);
    const [A, B] = splitPoly(d.wp, d.ox, d.oy, ang);
    const out = [];
    for (const P of [A, B]) {
      if (P.length < 6) continue;
      const cen = polyCentroid(P);
      const c = Math.cos(d.a), s = Math.sin(d.a);
      const rx = (cen.x - d.ox) * c - (cen.y - d.oy) * s, ry = (cen.x - d.ox) * s + (cen.y - d.oy) * c;
      const vx = d.vx - d.av * ry + rx * rand(1, 4), vy = d.vy + d.av * rx - rand(40, 160);
      const nd = this.addDebris(P, d.mat, vx, vy, d.av + rand(-4, 4), d);
      if (nd) { nd.dmg = d.dmg; nd.life = d.life; out.push(nd); }
    }
    d.dead = true;
    return out;
  },

  stepDebris(dt, onLand) {
    const g = G_DEBRIS * this.grav;
    const list = this.debris;
    for (let k = 0; k < list.length; k++) {
      const d = list[k];
      if (d.dead) continue;
      d.life += dt;
      if (d.sleep) { d.still += dt; continue; }
      d.vy += g * dt;
      d.vx *= 0.9995; d.av *= 0.996;
      d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.av * dt;
      // ground contact
      if (d.y + d.r > 0) {
        const c = Math.cos(d.a), s = Math.sin(d.a);
        let deep = 0, rx = 0, ry = 0, cnt = 0, sx = 0;
        const wp = d.wp;
        for (let i = 0; i < wp.length; i += 2) {
          const lx = (wp[i] - d.ox) * d.shrink, ly = (wp[i + 1] - d.oy) * d.shrink;
          const wx = lx * c - ly * s, wy = lx * s + ly * c;
          const pen = d.y + wy;
          if (pen > 0) { cnt++; sx += wx; if (pen > deep) { deep = pen; rx = wx; ry = wy; } }
        }
        if (cnt) {
          if (cnt > 1) rx = (rx + sx / cnt) / 2; // blend toward contact centre for stability
          d.y -= deep;
          const vcx = d.vx - d.av * ry, vcy = d.vy + d.av * rx;
          if (vcy > 0) {
            const impact = vcy;
            const e = impact > 300 ? 0.18 : 0.02;
            const rn = -rx;
            const j = ((1 + e) * vcy) / (1 / d.m + (rn * rn) / d.I);
            d.vy -= j / d.m;
            d.av += (rn * j) / d.I;
            const vt = d.vx - d.av * ry;
            const rt = -ry;
            let jt = -vt / (1 / d.m + (rt * rt) / d.I);
            const mu = 0.55 * j;
            jt = clamp(jt, -mu, mu);
            d.vx += jt / d.m;
            d.av += (rt * jt) / d.I;
            if (impact > 250 && onLand) onLand(d, impact);
            d.landed = true;
          }
          d.av *= 0.97; d.vx *= 0.985;
        }
        const sp = d.vx * d.vx + d.vy * d.vy;
        if (sp < 400 && Math.abs(d.av) < 0.6 && cnt) { d.still += dt; if (d.still > 0.35) { d.sleep = true; d.vx = d.vy = d.av = 0; } }
        else d.still = 0;
      }
    }
  },

  /* cheap circle-based debris vs debris separation (gives piles) */
  collideDebris() {
    const list = this.debris;
    const H = new Map();
    const S = 70;
    for (let i = 0; i < list.length; i++) {
      const d = list[i];
      if (d.dead || d.alpha < 0.6) continue;
      const k = (Math.floor(d.x / S) + 512) * 4096 + Math.floor(d.y / S) + 2048;
      let a = H.get(k); if (!a) { a = []; H.set(k, a); } a.push(d);
    }
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead || a.sleep || a.alpha < 0.6) continue;
      const bx = Math.floor(a.x / S), by = Math.floor(a.y / S);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        const arr = H.get((bx + ox + 512) * 4096 + by + oy + 2048);
        if (!arr) continue;
        for (let j = 0; j < arr.length; j++) {
          const b = arr[j];
          if (b === a || (!b.sleep && b._pair === a)) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const rr = (a.cr + b.cr) * 0.8;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr || d2 < 1e-6) continue;
          a._pair = b;
          const dist = Math.sqrt(d2), nx = dx / dist, ny = dy / dist;
          const pen = rr - dist;
          const ima = 1 / a.m, imb = b.sleep ? 0 : 1 / b.m;
          const sum = ima + imb;
          a.x -= nx * pen * (ima / sum) * 0.6; a.y -= ny * pen * (ima / sum) * 0.6;
          if (!b.sleep) { b.x += nx * pen * (imb / sum) * 0.6; b.y += ny * pen * (imb / sum) * 0.6; }
          const rv = (b.sleep ? 0 : b.vx - a.vx) * nx + ((b.sleep ? 0 : b.vy) - a.vy) * ny;
          const rvx = (b.sleep ? 0 : b.vx) - a.vx, rvy = (b.sleep ? 0 : b.vy) - a.vy;
          const vn = rvx * nx + rvy * ny;
          if (vn < 0) {
            const jn = (-1.1 * vn) / sum;
            a.vx -= jn * nx * ima; a.vy -= jn * ny * ima;
            if (!b.sleep) { b.vx += jn * nx * imb; b.vy += jn * ny * imb; }
            a.av *= 0.96;
            if (b.sleep && Math.abs(rv) > 500) b.sleep = false;
          }
          if (b.sleep && a.vy * a.vy + a.vx * a.vx < 900) { a.still += 0.02; if (a.still > 0.5) { a.sleep = true; a.vx = a.vy = a.av = 0; } }
        }
      }
    }
  },
};
