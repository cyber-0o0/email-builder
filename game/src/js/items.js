'use strict';
/* ===== Droppable items ===== */
/* kind: impact | explode | cluster | acid | drill | freeze | bolt | laser | hole */
const ITEMS = [
  { id: 'rock', name: { ru: 'Камень', en: 'Rock' }, desc: { ru: 'Простой и надёжный', en: 'Simple and reliable' },
    unlock: 1, cost: 12, kind: 'impact', dmg: 9, aoe: 46, r: 17, mass: 1.2, cd: 0.32, pierce: 0.25, bounce: 0.35 },
  { id: 'brick', name: { ru: 'Кирпич', en: 'Brick' }, desc: { ru: 'Тяжелее камня', en: 'Heavier than a rock' },
    unlock: 2, cost: 20, kind: 'impact', dmg: 15, aoe: 50, r: 17, mass: 1.5, cd: 0.5, pierce: 0.3, bounce: 0.2 },
  { id: 'bowling', name: { ru: 'Шар для боулинга', en: 'Bowling Ball' }, desc: { ru: 'Катится и добивает', en: 'Rolls and keeps hitting' },
    unlock: 3, cost: 35, kind: 'impact', dmg: 26, aoe: 52, r: 21, mass: 3, cd: 0.9, pierce: 0.55, bounce: 0.3 },
  { id: 'bomb', name: { ru: 'Фейерверк', en: 'Firework' }, desc: { ru: 'Лопается ярким салютом', en: 'Pops into a bright salute' },
    unlock: 4, cost: 55, kind: 'explode', dmg: 42, aoe: 115, r: 20, mass: 2, cd: 2.2, whistle: true, party: true },
  { id: 'anvil', name: { ru: 'Наковальня', en: 'Anvil' }, desc: { ru: 'Пробивает насквозь', en: 'Punches straight through' },
    unlock: 5, cost: 80, kind: 'impact', dmg: 55, aoe: 60, r: 25, mass: 8, cd: 1.6, pierce: 0.88, bounce: 0.05 },
  { id: 'piano', name: { ru: 'Пианино', en: 'Piano' }, desc: { ru: 'Музыкальный урон', en: 'Musical damage' },
    unlock: 6, cost: 120, kind: 'impact', dmg: 85, aoe: 90, r: 33, mass: 9, cd: 3, pierce: 0.6, bounce: 0.1, breaks: true },
  { id: 'cluster', name: { ru: 'Хлопушка', en: 'Party Popper' }, desc: { ru: 'Разлетается на 6 конфетти-шаров', en: 'Splits into 6 confetti balls' },
    unlock: 7, cost: 170, kind: 'cluster', dmg: 28, aoe: 72, r: 19, mass: 2, cd: 3.4, n: 6, party: true },
  { id: 'acid', name: { ru: 'Ведро слизи', en: 'Slime Bucket' }, desc: { ru: 'Липкая слизь размягчает всё вокруг', en: 'Sticky goo softens everything' },
    unlock: 9, cost: 260, kind: 'acid', dmg: 16, aoe: 135, r: 22, mass: 3, cd: 5, dur: 4 },
  { id: 'drill', name: { ru: 'Бур', en: 'Drill' }, desc: { ru: 'Сверлит до самой земли', en: 'Drills down to the ground' },
    unlock: 10, cost: 340, kind: 'drill', dmg: 75, aoe: 30, r: 20, mass: 4, cd: 4, dur: 1.5 },
  { id: 'cow', name: { ru: 'Резиновая уточка', en: 'Rubber Duck' }, desc: { ru: 'Прыгучая. Очень. Пищит', en: 'Very bouncy. Squeaks' },
    unlock: 12, cost: 480, kind: 'impact', dmg: 60, aoe: 75, r: 30, mass: 6, cd: 3.5, pierce: 0.2, bounce: 0.72, squeak: true },
  { id: 'freeze', name: { ru: 'Морозный снежок', en: 'Frost Snowball' }, desc: { ru: 'Заморозка: урон x2.5', en: 'Frozen: x2.5 damage' },
    unlock: 13, cost: 600, kind: 'freeze', dmg: 10, aoe: 165, r: 20, mass: 2, cd: 7, dur: 6 },
  { id: 'bolt', name: { ru: 'Молния', en: 'Lightning' }, desc: { ru: 'Мгновенный разряд по цепи', en: 'Instant chain strike' },
    unlock: 15, cost: 800, kind: 'bolt', dmg: 48, aoe: 50, r: 0, mass: 0, cd: 2.4, n: 8 },
  { id: 'weight', name: { ru: 'Гиря 16 т', en: '16 t Weight' }, desc: { ru: 'Классика жанра', en: 'A true classic' },
    unlock: 17, cost: 1100, kind: 'impact', dmg: 170, aoe: 100, r: 35, mass: 20, cd: 5, pierce: 0.92, bounce: 0.02 },
  { id: 'meteor', name: { ru: 'Метеорит', en: 'Meteor' }, desc: { ru: 'Огненный удар с неба', en: 'Fire from the sky' },
    unlock: 19, cost: 1500, kind: 'explode', dmg: 160, aoe: 165, r: 26, mass: 10, cd: 7, fire: true },
  { id: 'laser', name: { ru: 'Солнечная лупа', en: 'Sun Magnifier' }, desc: { ru: 'Солнечный луч плавит сверху вниз', en: 'A sunbeam melts top to bottom' },
    unlock: 22, cost: 2300, kind: 'laser', dmg: 140, aoe: 36, r: 0, mass: 0, cd: 10, dur: 1.8 },
  { id: 'hole', name: { ru: 'Космический пылесос', en: 'Space Vacuum' }, desc: { ru: 'Засасывает обломки', en: 'Sucks up the debris' },
    unlock: 25, cost: 3500, kind: 'hole', dmg: 95, aoe: 160, r: 18, mass: 3, cd: 14, dur: 2.6 },
  { id: 'nuke', name: { ru: 'Астероид', en: 'Asteroid' }, desc: { ru: 'Самый большой камень в космосе', en: 'The biggest rock in space' },
    unlock: 28, cost: 6000, kind: 'explode', dmg: 950, aoe: 430, r: 34, mass: 20, cd: 35, mega: true, fire: true },
];
const ITEM = {};
ITEMS.forEach((d) => { ITEM[d.id] = d; });

/* upgrade math */
const itemLevel = (id) => (SAVE.items[id] === undefined ? -1 : SAVE.items[id]);
const itemUnlocked = (id) => SAVE.level >= ITEM[id].unlock;
const itemDmgMult = (lvl) => Math.pow(1.22, lvl);
const itemCost = (d, lvl) => Math.round(d.cost * Math.pow(1.45, lvl));
const GLOBAL_UPS = [
  { id: 'power', name: 'power', desc: 'powerDesc', base: 60, k: 1.55, max: 50, eff: (l) => '+' + l * 12 + '%' },
  { id: 'greed', name: 'greed', desc: 'greedDesc', base: 70, k: 1.55, max: 50, eff: (l) => '+' + l * 15 + '%' },
  { id: 'speed', name: 'speed', desc: 'speedDesc', base: 110, k: 1.75, max: 10, eff: (l) => '-' + Math.round((1 - cdMult(l)) * 100) + '%' },
  { id: 'crit', name: 'critU', desc: 'critDesc', base: 130, k: 1.7, max: 12, eff: (l) => l * 4 + '%' },
  { id: 'drone', name: 'drone', desc: 'droneDesc', base: 220, k: 1.8, max: 10, eff: (l) => (l ? (droneInterval(l)).toFixed(1) + 's' : '—') },
];
const cdMult = (l) => Math.pow(0.93, l);
const droneInterval = (l) => 4.2 / (1 + 0.28 * (l - 1));
const upCost = (u, l) => Math.round(u.base * Math.pow(u.k, l));
function itemDamage(id) {
  const lv = Math.max(0, itemLevel(id));
  return ITEM[id].dmg * itemDmgMult(lv) * (1 + SAVE.up.power * 0.12);
}
function itemCooldown(id) { return ITEM[id].cd * cdMult(SAVE.up.speed); }

/* ===== item drawing (shared by game & icons). Draw centered, radius r ===== */
function drawItem(g, id, r, t, seed) {
  const s = r / 20;
  g.save();
  g.scale(s, s);
  switch (id) {
    case 'rock': {
      const R = mulberry32(seed || 7);
      g.beginPath();
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, rr = 17 + R() * 5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath();
      const gr = g.createRadialGradient(-6, -7, 2, 0, 0, 24); gr.addColorStop(0, '#b5b0a8'); gr.addColorStop(1, '#5b5650');
      g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = '#3c3935'; g.stroke();
      g.fillStyle = '#4b4743'; g.beginPath(); g.arc(5, 4, 3, 0, TAU); g.arc(-6, 6, 2, 0, TAU); g.fill();
      break;
    }
    case 'brick': {
      g.rotate(0.15);
      g.fillStyle = '#8e3a26'; g.fillRect(-21, -11, 42, 24);
      g.fillStyle = '#c0583c'; g.fillRect(-22, -13, 42, 22);
      g.fillStyle = '#7a2f20'; g.fillRect(-12, -6, 6, 8); g.fillRect(-2, -6, 6, 8); g.fillRect(8, -6, 6, 8);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-22, -13, 42, 3);
      break;
    }
    case 'bowling': {
      const gr = g.createRadialGradient(-7, -8, 2, 0, 0, 21); gr.addColorStop(0, '#6f8cff'); gr.addColorStop(0.5, '#2a3fb8'); gr.addColorStop(1, '#101a55');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill();
      g.fillStyle = '#060a24'; g.beginPath(); g.arc(4, -5, 3, 0, TAU); g.arc(10, -1, 3, 0, TAU); g.arc(5, 4, 3.4, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-8, -10, 5, 3, -0.6, 0, TAU); g.fill();
      break;
    }
    case 'bomb': case 'cluster_b': {
      // firework ball: striped paper shell with a sparkling wick
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -16); g.quadraticCurveTo(6, -24, 3, -29); g.stroke();
      const main = id === 'bomb' ? ['#ff4d6d', '#ffd23f', '#3fa7ff'] : ['#9b5cff', '#4fd36a', '#ffd23f'];
      g.save(); g.beginPath(); g.arc(0, 2, 18, 0, TAU); g.clip();
      for (let i = -3; i < 4; i++) { g.fillStyle = main[(i + 3) % 3]; g.fillRect(i * 9 - 4.5, -20, 9, 44); }
      const sh = g.createRadialGradient(-6, -5, 2, 0, 2, 20); sh.addColorStop(0, 'rgba(255,255,255,.45)'); sh.addColorStop(1, 'rgba(0,0,0,.35)');
      g.fillStyle = sh; g.fillRect(-20, -20, 40, 44); g.restore();
      const fl = 0.7 + 0.3 * Math.sin((t || 0) * 40);
      g.fillStyle = '#fff6b0'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + (t || 0) * 9; g.fillRect(3 + Math.cos(a) * 6 * fl - 1, -29 + Math.sin(a) * 6 * fl - 1, 2.5, 2.5); }
      g.fillStyle = '#ffd25a'; g.beginPath(); g.arc(3, -29, 3.5 * fl, 0, TAU); g.fill();
      break;
    }
    case 'anvil': {
      const ag = g.createLinearGradient(0, -12, 0, 16); ag.addColorStop(0, '#8d96a3'); ag.addColorStop(1, '#3a3f47');
      g.fillStyle = ag; g.strokeStyle = '#1c1f24'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(-24, -12); g.lineTo(18, -12); g.quadraticCurveTo(30, -12, 32, -6); g.lineTo(12, -2); g.lineTo(8, 6); g.lineTo(14, 16); g.lineTo(-14, 16); g.lineTo(-8, 6); g.lineTo(-12, -2); g.lineTo(-24, -4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#c9d0d8'; g.fillRect(-23, -12, 40, 3);
      g.fillStyle = '#1c1f24'; g.fillRect(-14, 12, 28, 4);
      break;
    }
    case 'piano': {
      g.fillStyle = '#5a3a26'; g.fillRect(-27, -23, 54, 42);
      g.fillStyle = '#3a2416'; g.fillRect(-26, -22, 52, 40);
      g.fillStyle = '#6b4630'; g.fillRect(-26, -22, 52, 6);
      g.fillStyle = '#f2efe6'; g.fillRect(-23, 2, 46, 9);
      g.fillStyle = '#121216'; for (let i = -20; i < 22; i += 6.5) g.fillRect(i + 2, 2, 3, 5);
      g.fillStyle = '#121216'; g.fillRect(-24, 11, 5, 9); g.fillRect(19, 11, 5, 9);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-22, -14, 44, 2);
      break;
    }
    case 'cluster': {
      // party popper cone with confetti
      g.fillStyle = '#ff7ab6'; g.beginPath(); g.moveTo(-14, -18); g.lineTo(14, -18); g.lineTo(0, 24); g.closePath(); g.fill();
      g.fillStyle = '#ffd23f'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-12 + i * 4, -12 + i * 12); g.lineTo(12 - i * 4, -12 + i * 12); g.lineTo(10 - i * 4, -8 + i * 12); g.lineTo(-10 + i * 4, -8 + i * 12); g.fill(); }
      const cc = ['#3fa7ff', '#4fd36a', '#ff4d6d', '#ffd23f', '#9b5cff'];
      for (let i = 0; i < 9; i++) { g.fillStyle = cc[i % 5]; g.fillRect(-14 + i * 3.4, -26 - (i % 3) * 3, 3, 4); }
      break;
    }
    case 'acid': {
      // bucket full of green slime
      g.fillStyle = '#7d8ea3'; g.beginPath(); g.moveTo(-18, -16); g.lineTo(18, -16); g.lineTo(13, 20); g.lineTo(-13, 20); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-12, -14, 4, 32);
      g.strokeStyle = '#4a5666'; g.lineWidth = 2; g.beginPath(); g.arc(0, -16, 18, Math.PI, 0); g.stroke();
      g.fillStyle = '#7cf04a'; g.beginPath(); g.ellipse(0, -16, 18, 5, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-10, -14); g.quadraticCurveTo(-11, -2, -8, -2); g.quadraticCurveTo(-5, -2, -6, -14); g.fill();
      g.beginPath(); g.moveTo(6, -14); g.quadraticCurveTo(5, 4, 9, 4); g.quadraticCurveTo(12, 4, 11, -14); g.fill();
      g.fillStyle = '#c8ff9a'; g.beginPath(); g.arc(-4, -17, 2.5, 0, TAU); g.arc(6, -15, 1.8, 0, TAU); g.fill();
      break;
    }
    case 'drill': {
      const gr = g.createLinearGradient(-14, 0, 14, 0); gr.addColorStop(0, '#6a727d'); gr.addColorStop(0.5, '#e4e9ef'); gr.addColorStop(1, '#5a616b');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-14, -16); g.lineTo(14, -16); g.lineTo(0, 26); g.closePath(); g.fill();
      g.strokeStyle = '#3b4048'; g.lineWidth = 2; const sp = ((t || 0) * 60) % 10;
      for (let y = -16 + sp; y < 22; y += 10) { const w = 14 * (1 - (y + 16) / 42); g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y + 6); g.stroke(); }
      g.fillStyle = '#e8b622'; g.fillRect(-16, -26, 32, 11);
      g.fillStyle = '#2d3138'; g.fillRect(-16, -18, 32, 3);
      break;
    }
    case 'cow': {
      // rubber duck
      g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(-2, 6, 22, 14, 0, 0, TAU); g.fill();
      g.beginPath(); g.arc(10, -10, 12, 0, TAU); g.fill();
      g.fillStyle = '#ffb000'; g.beginPath(); g.ellipse(-6, 5, 10, 6, -0.3, 0, TAU); g.fill();
      g.fillStyle = '#ff8a2a'; g.beginPath(); g.ellipse(23, -7, 7, 3.5, 0.15, 0, TAU); g.fill();
      g.fillStyle = '#1d1d1d'; g.beginPath(); g.arc(13, -13, 2.2, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(13.6, -13.8, 0.8, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(-10, -1, 7, 3, -0.3, 0, TAU); g.fill();
      break;
    }
    case 'freeze': {
      const gr = g.createRadialGradient(-5, -6, 2, 0, 0, 20); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#8fdcff'); gr.addColorStop(1, '#2a86c4');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 19, 0, TAU); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + (t || 0); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); g.stroke(); }
      break;
    }
    case 'bolt': {
      g.fillStyle = '#ffe14a'; g.strokeStyle = '#c47f00'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(4, -24); g.lineTo(-12, 3); g.lineTo(-1, 3); g.lineTo(-6, 24); g.lineTo(12, -5); g.lineTo(1, -5); g.closePath(); g.fill(); g.stroke();
      break;
    }
    case 'weight': {
      const wg = g.createLinearGradient(-28, 0, 28, 0); wg.addColorStop(0, '#3a3e46'); wg.addColorStop(0.35, '#6a707b'); wg.addColorStop(1, '#25272c');
      g.strokeStyle = '#4a4f58'; g.lineWidth = 4; g.beginPath(); g.arc(0, -30, 6, Math.PI, 0); g.stroke();
      g.fillStyle = wg; g.beginPath(); g.moveTo(-16, -22); g.lineTo(16, -22); g.lineTo(28, 20); g.lineTo(-28, 20); g.closePath(); g.fill();
      g.fillStyle = '#4a4f58'; g.fillRect(-6, -30, 12, 9);
      g.fillStyle = '#e8e8e8'; g.font = '900 15px Arial Black, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('16T', 0, 4);
      break;
    }
    case 'meteor': {
      const R = mulberry32(seed || 3);
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, rr = 17 + R() * 5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath();
      const gr = g.createRadialGradient(4, 6, 2, 0, 0, 24); gr.addColorStop(0, '#ffdd66'); gr.addColorStop(0.35, '#ff7a1f'); gr.addColorStop(1, '#5a2410');
      g.fillStyle = gr; g.fill();
      g.fillStyle = 'rgba(60,20,10,.7)'; g.beginPath(); g.arc(-5, -4, 4, 0, TAU); g.arc(6, -7, 2.5, 0, TAU); g.fill();
      break;
    }
    case 'laser': {
      // magnifying glass
      g.strokeStyle = '#8a5a2a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(12, 12); g.lineTo(24, 24); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = 'rgba(190,235,255,.75)'; g.beginPath(); g.arc(-3, -3, 16, 0, TAU); g.fill();
      g.strokeStyle = '#c9a23a'; g.lineWidth = 4; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-9, -9, 5, 3, -0.7, 0, TAU); g.fill();
      g.fillStyle = '#fff3a0'; g.beginPath(); g.arc(-3, -3, 3, 0, TAU); g.fill();
      break;
    }
    case 'hole': {
      // friendly space vacuum: swirling purple portal
      const gr = g.createRadialGradient(0, 0, 4, 0, 0, 22); gr.addColorStop(0, '#2a1060'); gr.addColorStop(0.6, '#6a3ad0'); gr.addColorStop(0.85, '#c6a0ff'); gr.addColorStop(1, 'rgba(198,160,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill();
      g.strokeStyle = '#f0e0ff'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 6 + i * 5, (t || 0) * 4 + i, (t || 0) * 4 + i + 2.2); g.stroke(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
      break;
    }
    case 'nuke': {
      // asteroid: big cratered space rock
      const R = mulberry32(seed || 11);
      g.beginPath();
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, rr = 18 + R() * 4; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath();
      const gr = g.createRadialGradient(-6, -7, 2, 0, 0, 24); gr.addColorStop(0, '#b7a9c9'); gr.addColorStop(1, '#4a3f5c');
      g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = '#2e2640'; g.stroke();
      g.fillStyle = 'rgba(40,30,60,.55)';
      for (const [x, y, r] of [[-6, -5, 5], [7, 3, 4], [-3, 9, 3], [8, -8, 2.5]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.25)';
      for (const [x, y, r] of [[-7, -6, 2], [6, 2, 1.5]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
      break;
    }
  }
  g.restore();
}
