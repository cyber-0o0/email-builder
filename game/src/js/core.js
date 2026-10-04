'use strict';
/* ===== Core: math, polygons, i18n, save ===== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Polygons are flat arrays [x0,y0,x1,y1,...] */
function polyArea(p) {
  let a = 0;
  for (let i = 0, n = p.length; i < n; i += 2) {
    const j = (i + 2) % n;
    a += p[i] * p[j + 1] - p[j] * p[i + 1];
  }
  return a / 2;
}
function polyCentroid(p) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, n = p.length; i < n; i += 2) {
    const j = (i + 2) % n;
    const cr = p[i] * p[j + 1] - p[j] * p[i + 1];
    a += cr; cx += (p[i] + p[j]) * cr; cy += (p[i + 1] + p[j + 1]) * cr;
  }
  a /= 2;
  if (Math.abs(a) < 1e-6) {
    let sx = 0, sy = 0; const n = p.length / 2;
    for (let i = 0; i < p.length; i += 2) { sx += p[i]; sy += p[i + 1]; }
    return { x: sx / n, y: sy / n, a: 0 };
  }
  return { x: cx / (6 * a), y: cy / (6 * a), a: Math.abs(a) };
}
/* second moment of area about centroid (unit density) */
function polyInertia(p, cx, cy) {
  let num = 0, den = 0;
  for (let i = 0, n = p.length; i < n; i += 2) {
    const j = (i + 2) % n;
    const x1 = p[i] - cx, y1 = p[i + 1] - cy, x2 = p[j] - cx, y2 = p[j + 1] - cy;
    const cr = Math.abs(x1 * y2 - x2 * y1);
    num += cr * (x1 * x1 + x1 * x2 + x2 * x2 + y1 * y1 + y1 * y2 + y2 * y2);
    den += cr;
  }
  return den > 0 ? num / (6 * den) : 1; // per unit mass
}
/* keep side where nx*x+ny*y <= d */
function clipHalf(p, nx, ny, d) {
  const out = [];
  const n = p.length;
  if (!n) return out;
  let px = p[n - 2], py = p[n - 1];
  let pd = nx * px + ny * py - d;
  for (let i = 0; i < n; i += 2) {
    const x = p[i], y = p[i + 1];
    const cd = nx * x + ny * y - d;
    if (cd <= 0) {
      if (pd > 0) { const t = pd / (pd - cd); out.push(px + (x - px) * t, py + (y - py) * t); }
      out.push(x, y);
    } else if (pd <= 0) {
      const t = pd / (pd - cd); out.push(px + (x - px) * t, py + (y - py) * t);
    }
    px = x; py = y; pd = cd;
  }
  return out;
}
function cleanPoly(p, eps = 0.35) {
  const out = [];
  for (let i = 0; i < p.length; i += 2) {
    const x = p[i], y = p[i + 1];
    const k = out.length;
    if (k >= 2 && Math.abs(out[k - 2] - x) < eps && Math.abs(out[k - 1] - y) < eps) continue;
    out.push(x, y);
  }
  if (out.length >= 4 && Math.abs(out[0] - out[out.length - 2]) < eps && Math.abs(out[1] - out[out.length - 1]) < eps) out.length -= 2;
  return out;
}
function pointInPoly(p, x, y) {
  let inside = false;
  for (let i = 0, n = p.length, j = n - 2; i < n; j = i, i += 2) {
    const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polyBBox(p) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < p.length; i += 2) {
    const x = p[i], y = p[i + 1];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}
/* closest point on polygon boundary */
const _cp = { x: 0, y: 0, d2: 0 };
function closestOnPoly(p, x, y) {
  let best = Infinity, bx = 0, by = 0;
  for (let i = 0, n = p.length; i < n; i += 2) {
    const j = (i + 2) % n;
    const ax = p[i], ay = p[i + 1], ex = p[j] - ax, ey = p[j + 1] - ay;
    const l2 = ex * ex + ey * ey;
    let t = l2 > 0 ? ((x - ax) * ex + (y - ay) * ey) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + ex * t, qy = ay + ey * t;
    const d2 = (x - qx) * (x - qx) + (y - qy) * (y - qy);
    if (d2 < best) { best = d2; bx = qx; by = qy; }
  }
  _cp.x = bx; _cp.y = by; _cp.d2 = best;
  return _cp;
}
function distToSeg2(px, py, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey;
  let t = l2 > 0 ? ((px - ax) * ex + (py - ay) * ey) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + ex * t - px, qy = ay + ey * t - py;
  return qx * qx + qy * qy;
}
/* split polygon by line through (cx,cy) with direction angle a -> [polyA, polyB] */
function splitPoly(p, cx, cy, a) {
  const nx = Math.cos(a), ny = Math.sin(a), d = nx * cx + ny * cy;
  const A = cleanPoly(clipHalf(p, nx, ny, d));
  const B = cleanPoly(clipHalf(p, -nx, -ny, -d));
  return [A, B];
}

/* ===== number formatting ===== */
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = -1;
  let v = n;
  while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.0+$|(\.\d*?)0+$/, '$1') + u[i];
}

/* ===== i18n ===== */
let LANG = 'ru';
const STR = {
  ru: {
    play: 'Играть', tapToStart: 'Нажми, чтобы начать', level: 'Уровень', boss: 'БОСС',
    destroyed: 'ГОТОВО!', reward: 'Награда', next: 'Дальше', x2: 'x2 за рекламу',
    shop: 'Мастерская', items: 'Предметы', upgrades: 'Улучшения', settings: 'Настройки',
    sound: 'Звуки', music: 'Музыка', vibro: 'Вибрация', close: 'Закрыть', on: 'Вкл', off: 'Выкл',
    dmg: 'Урон', cd: 'Перезарядка', lvlShort: 'ур.', unlockAt: 'Откроется на уровне', max: 'МАКС',
    newItem: 'Новый предмет!', cool: 'Круто!', hint: 'Нажимай над целью, чтобы сбрасывать предметы',
    hintHold: 'Можно зажать палец — будет сбрасывать очередью',
    combo: 'КОМБО', crit: 'КРИТ!', time: 'Время', bonusFast: 'Бонус за скорость', coinsLoot: 'Добыча',
    total: 'Итого', notReady: 'Перезарядка', resetProgress: 'Сбросить прогресс', confirmReset: 'Точно? Нажми ещё раз',
    worldNew: 'Новый мир', freeCoins: 'Монеты за рекламу', get: 'Получить',
    drone: 'Дрон-помощник', droneDesc: 'Сам сбрасывает камни', power: 'Сила удара', powerDesc: 'Урон всех предметов',
    greed: 'Жадность', greedDesc: 'Больше монет', speed: 'Механика', speedDesc: 'Быстрее перезарядка',
    critU: 'Точность', critDesc: 'Шанс крита x3', buy: 'Купить', locked: 'Закрыто', paused: 'Пауза',
    sel: 'Выбрано', record: 'Рекорд',
    order: 'Заказ №', take: 'Взяться за работу!', planLbl: 'Потом здесь будет:', built: 'Готово! Здесь появится:', crew: 'БРИГАДА СНОСА: УБИРАЕМ СТАРОЕ, СТРОИМ НОВОЕ', done: 'ГОТОВО!',
  },
  en: {
    play: 'Play', tapToStart: 'Tap to start', level: 'Level', boss: 'BOSS',
    destroyed: 'JOB DONE!', reward: 'Reward', next: 'Next', x2: 'x2 for ad',
    shop: 'Workshop', items: 'Items', upgrades: 'Upgrades', settings: 'Settings',
    sound: 'Sounds', music: 'Music', vibro: 'Vibration', close: 'Close', on: 'On', off: 'Off',
    dmg: 'Damage', cd: 'Cooldown', lvlShort: 'lv.', unlockAt: 'Unlocks at level', max: 'MAX',
    newItem: 'New item!', cool: 'Awesome!', hint: 'Tap above the target to drop items',
    hintHold: 'Hold your finger to keep dropping',
    combo: 'COMBO', crit: 'CRIT!', time: 'Time', bonusFast: 'Speed bonus', coinsLoot: 'Loot',
    total: 'Total', notReady: 'Reloading', resetProgress: 'Reset progress', confirmReset: 'Sure? Tap again',
    worldNew: 'New world', freeCoins: 'Coins for ad', get: 'Get',
    drone: 'Helper drone', droneDesc: 'Drops rocks on its own', power: 'Impact power', powerDesc: 'Damage of all items',
    greed: 'Greed', greedDesc: 'More coins', speed: 'Mechanics', speedDesc: 'Faster reload',
    critU: 'Precision', critDesc: 'x3 crit chance', buy: 'Buy', locked: 'Locked', paused: 'Paused',
    sel: 'Selected', record: 'Best',
    order: 'Job #', take: 'Take the job!', planLbl: 'What comes next:', built: 'Done! Coming here:', crew: 'DEMOLITION CREW: CLEAR THE OLD, BUILD THE NEW', done: 'DONE!',
  },
};
const T = (k) => (STR[LANG] && STR[LANG][k]) || STR.ru[k] || k;
const L = (o) => (o ? o[LANG] || o.ru : '');

/* ===== save ===== */
const SAVE_KEY = 'dropsmash_v1';
const DEFAULT_SAVE = () => ({
  v: 1, level: 1, coins: 0, items: { rock: 0 }, up: { power: 0, greed: 0, speed: 0, crit: 0, drone: 0 },
  seen: {}, settings: { sound: true, music: true, vibro: true }, stats: { drops: 0, destroyed: 0, best: {} },
  tut: 0, sel: 'rock', ts: 0,
});
let SAVE = DEFAULT_SAVE();
function mergeSave(d) {
  const base = DEFAULT_SAVE();
  if (!d || typeof d !== 'object') return base;
  const s = Object.assign(base, d);
  s.items = Object.assign({ rock: 0 }, d.items || {});
  s.up = Object.assign(DEFAULT_SAVE().up, d.up || {});
  s.settings = Object.assign(DEFAULT_SAVE().settings, d.settings || {});
  s.stats = Object.assign(DEFAULT_SAVE().stats, d.stats || {});
  s.seen = d.seen || {};
  return s;
}
function loadLocal() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* storage blocked */ }
  return null;
}
let _saveTimer = 0;
function saveGame(now) {
  SAVE.ts = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* storage blocked */ }
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => SDK.saveData(SAVE), now ? 0 : 1500);
}
