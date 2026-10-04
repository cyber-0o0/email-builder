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
  { id: 'bomb', name: { ru: 'Бомба', en: 'Bomb' }, desc: { ru: 'Взрыв по площади', en: 'Area explosion' },
    unlock: 4, cost: 55, kind: 'explode', dmg: 42, aoe: 115, r: 20, mass: 2, cd: 2.2, whistle: true },
  { id: 'anvil', name: { ru: 'Наковальня', en: 'Anvil' }, desc: { ru: 'Пробивает насквозь', en: 'Punches straight through' },
    unlock: 5, cost: 80, kind: 'impact', dmg: 55, aoe: 60, r: 25, mass: 8, cd: 1.6, pierce: 0.88, bounce: 0.05 },
  { id: 'piano', name: { ru: 'Пианино', en: 'Piano' }, desc: { ru: 'Музыкальный урон', en: 'Musical damage' },
    unlock: 6, cost: 120, kind: 'impact', dmg: 85, aoe: 90, r: 33, mass: 9, cd: 3, pierce: 0.6, bounce: 0.1, breaks: true },
  { id: 'cluster', name: { ru: 'Кассетная бомба', en: 'Cluster Bomb' }, desc: { ru: 'Распадается на 6 бомб', en: 'Splits into 6 bomblets' },
    unlock: 7, cost: 170, kind: 'cluster', dmg: 28, aoe: 72, r: 19, mass: 2, cd: 3.4, n: 6 },
  { id: 'acid', name: { ru: 'Бочка кислоты', en: 'Acid Barrel' }, desc: { ru: 'Разъедает всё вокруг', en: 'Eats through everything' },
    unlock: 9, cost: 260, kind: 'acid', dmg: 16, aoe: 135, r: 22, mass: 3, cd: 5, dur: 4 },
  { id: 'drill', name: { ru: 'Бур', en: 'Drill' }, desc: { ru: 'Сверлит до самой земли', en: 'Drills down to the ground' },
    unlock: 10, cost: 340, kind: 'drill', dmg: 75, aoe: 30, r: 20, mass: 4, cd: 4, dur: 1.5 },
  { id: 'cow', name: { ru: 'Корова', en: 'Cow' }, desc: { ru: 'Прыгучая. Очень', en: 'Very bouncy. Moo' },
    unlock: 12, cost: 480, kind: 'impact', dmg: 60, aoe: 75, r: 30, mass: 6, cd: 3.5, pierce: 0.2, bounce: 0.72, moo: true },
  { id: 'freeze', name: { ru: 'Ледяная бомба', en: 'Freeze Bomb' }, desc: { ru: 'Заморозка: урон x2.5', en: 'Frozen: x2.5 damage' },
    unlock: 13, cost: 600, kind: 'freeze', dmg: 10, aoe: 165, r: 20, mass: 2, cd: 7, dur: 6 },
  { id: 'bolt', name: { ru: 'Молния', en: 'Lightning' }, desc: { ru: 'Мгновенный разряд по цепи', en: 'Instant chain strike' },
    unlock: 15, cost: 800, kind: 'bolt', dmg: 48, aoe: 50, r: 0, mass: 0, cd: 2.4, n: 8 },
  { id: 'weight', name: { ru: 'Гиря 16 т', en: '16 t Weight' }, desc: { ru: 'Классика жанра', en: 'A true classic' },
    unlock: 17, cost: 1100, kind: 'impact', dmg: 170, aoe: 100, r: 35, mass: 20, cd: 5, pierce: 0.92, bounce: 0.02 },
  { id: 'meteor', name: { ru: 'Метеорит', en: 'Meteor' }, desc: { ru: 'Огненный удар с неба', en: 'Fire from the sky' },
    unlock: 19, cost: 1500, kind: 'explode', dmg: 160, aoe: 165, r: 26, mass: 10, cd: 7, fire: true },
  { id: 'laser', name: { ru: 'Орбитальный лазер', en: 'Orbital Laser' }, desc: { ru: 'Луч режет сверху вниз', en: 'A beam that cuts top to bottom' },
    unlock: 22, cost: 2300, kind: 'laser', dmg: 140, aoe: 36, r: 0, mass: 0, cd: 10, dur: 1.8 },
  { id: 'hole', name: { ru: 'Чёрная дыра', en: 'Black Hole' }, desc: { ru: 'Засасывает обломки', en: 'Swallows the debris' },
    unlock: 25, cost: 3500, kind: 'hole', dmg: 95, aoe: 160, r: 18, mass: 3, cd: 14, dur: 2.6 },
  { id: 'nuke', name: { ru: 'Ядерная бомба', en: 'Nuke' }, desc: { ru: 'Без комментариев', en: 'No comment' },
    unlock: 28, cost: 6000, kind: 'explode', dmg: 950, aoe: 430, r: 28, mass: 6, cd: 35, nuke: true, whistle: true },
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
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, -14); g.quadraticCurveTo(16, -24, 12, -28); g.stroke();
      const gr = g.createRadialGradient(-6, -6, 2, 0, 2, 20); gr.addColorStop(0, '#5d6470'); gr.addColorStop(1, '#111318');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 2, 18, 0, TAU); g.fill();
      g.fillStyle = '#2b2f36'; g.fillRect(2, -16, 10, 7);
      const fl = 0.7 + 0.3 * Math.sin((t || 0) * 40);
      g.fillStyle = '#ffd25a'; g.beginPath(); g.arc(12, -28, 4 * fl, 0, TAU); g.fill();
      g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(12, -28, 2.2 * fl, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-7, -5, 5, 3, -0.7, 0, TAU); g.fill();
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
      g.fillStyle = '#56603a'; g.beginPath(); g.ellipse(0, 0, 13, 22, 0, 0, TAU); g.fill();
      g.fillStyle = '#3c4428'; g.beginPath(); g.moveTo(-13, -14); g.lineTo(-20, -24); g.lineTo(-6, -20); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(13, -14); g.lineTo(20, -24); g.lineTo(6, -20); g.closePath(); g.fill();
      g.fillStyle = '#e6c84a'; g.fillRect(-13, -2, 26, 4);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-5, -6, 3, 9, 0, 0, TAU); g.fill();
      break;
    }
    case 'acid': {
      g.fillStyle = '#3d8f2a'; g.fillRect(-16, -21, 32, 42);
      g.fillStyle = '#2a6b1c'; g.fillRect(-16, -12, 32, 3); g.fillRect(-16, 9, 32, 3);
      g.fillStyle = '#f2e14a'; g.beginPath(); g.moveTo(0, -6); g.lineTo(7, 6); g.lineTo(-7, 6); g.closePath(); g.fill();
      g.fillStyle = '#1b1b1b'; g.fillRect(-1, -2, 2, 5);
      g.fillStyle = '#9cff5a'; g.beginPath(); g.ellipse(0, -21, 16, 4, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-12, -21, 4, 42);
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
      g.fillStyle = '#fafafa'; g.beginPath(); g.ellipse(0, 0, 22, 14, 0, 0, TAU); g.fill();
      g.fillStyle = '#1d1d1d'; g.beginPath(); g.ellipse(-8, -4, 6, 5, 0.4, 0, TAU); g.ellipse(8, 5, 5, 4, -0.3, 0, TAU); g.fill();
      g.fillStyle = '#fafafa'; g.beginPath(); g.ellipse(22, -8, 9, 8, 0, 0, TAU); g.fill();
      g.fillStyle = '#f2a9b8'; g.beginPath(); g.ellipse(28, -5, 5, 4, 0, 0, TAU); g.fill();
      g.fillStyle = '#1d1d1d'; g.beginPath(); g.arc(21, -11, 1.6, 0, TAU); g.fill();
      g.fillStyle = '#d9d3c7'; g.beginPath(); g.moveTo(17, -15); g.lineTo(15, -21); g.lineTo(20, -16); g.fill(); g.beginPath(); g.moveTo(24, -15); g.lineTo(27, -21); g.lineTo(27, -14); g.fill();
      g.fillStyle = '#fafafa'; for (const x of [-15, -6, 6, 15]) g.fillRect(x - 2.5, 10, 5, 10);
      g.fillStyle = '#1d1d1d'; for (const x of [-15, -6, 6, 15]) g.fillRect(x - 2.5, 18, 5, 3);
      g.strokeStyle = '#1d1d1d'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-22, -2); g.quadraticCurveTo(-28, 4, -26, 10); g.stroke();
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
      g.fillStyle = '#c9d1db'; g.fillRect(-8, -10, 16, 20);
      g.fillStyle = '#2b5fb8'; g.fillRect(-26, -7, 15, 14); g.fillRect(11, -7, 15, 14);
      g.strokeStyle = '#7fa6e8'; g.lineWidth = 1; for (const x of [-21, -16, 16, 21]) { g.beginPath(); g.moveTo(x, -7); g.lineTo(x, 7); g.stroke(); }
      g.fillStyle = '#ff3d3d'; g.beginPath(); g.arc(0, 13, 5, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,90,90,.5)'; g.beginPath(); g.arc(0, 13, 8, 0, TAU); g.fill();
      break;
    }
    case 'hole': {
      const gr = g.createRadialGradient(0, 0, 4, 0, 0, 22); gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#14062a'); gr.addColorStop(0.75, '#9a4dff'); gr.addColorStop(1, 'rgba(154,77,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill();
      g.strokeStyle = '#e6c8ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 21, 6, (t || 0) * 2, 0, TAU); g.stroke();
      g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill();
      break;
    }
    case 'nuke': {
      g.fillStyle = '#3e4330';
      g.beginPath(); g.moveTo(-8, -26); g.lineTo(8, -26); g.lineTo(14, -16); g.lineTo(-14, -16); g.closePath(); g.fill();
      g.fillStyle = '#d8c23a'; g.beginPath(); g.ellipse(0, 4, 16, 22, 0, 0, TAU); g.fill();
      g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(0, 4, 3, 0, TAU); g.fill();
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU - Math.PI / 2; g.beginPath(); g.moveTo(0, 4); g.arc(0, 4, 11, a - 0.5, a + 0.5); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(-7, -4, 3, 8, 0, 0, TAU); g.fill();
      break;
    }
  }
  g.restore();
}
