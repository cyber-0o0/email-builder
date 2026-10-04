'use strict';
/* ===== Worlds & destructible targets =====
   Authoring coords: x centered at 0, y = height above ground (up positive). */
const R_ = (x, y, w, h, m) => ({ pts: [x, y, x + w, y, x + w, y + h, x, y + h], m });
const P_ = (pts, m) => ({ pts: pts.flat(), m });
const C_ = (cx, cy, r, m, n = 22, ry) => {
  const p = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * (ry || r)); }
  return { pts: p, m };
};
/* half ellipse / dome, flat side down */
const D_ = (cx, cy, rx, ry, m, n = 16) => {
  const p = [cx - rx, cy];
  for (let i = 1; i < n; i++) { const a = Math.PI - (i / n) * Math.PI; p.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
  p.push(cx + rx, cy);
  return { pts: p, m };
};
const ROT_ = (cx, cy, w, h, ang, m) => {
  const c = Math.cos(ang), s = Math.sin(ang), p = [];
  for (const [x, y] of [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]) p.push(cx + x * c - y * s, cy + x * s + y * c);
  return { pts: p, m };
};
const TRI_ = (x, y, w, h, m) => P_([[x, y], [x + w, y], [x + w / 2, y + h]], m);
/* wall with rectangular windows: splits into non-overlapping rects */
function WALL_(x, y, w, h, m, wins, wm = 'glass') {
  const xs = new Set([x, x + w]), ys = new Set([y, y + h]);
  for (const [wx, wy, ww, wh] of wins) { xs.add(wx); xs.add(wx + ww); ys.add(wy); ys.add(wy + wh); }
  const X = [...xs].sort((a, b) => a - b), Y = [...ys].sort((a, b) => a - b);
  const out = [];
  const inWin = (px, py) => wins.find(([wx, wy, ww, wh]) => px > wx && px < wx + ww && py > wy && py < wy + wh);
  for (let j = 0; j < Y.length - 1; j++) {
    let run = null;
    for (let i = 0; i < X.length - 1; i++) {
      const cx = (X[i] + X[i + 1]) / 2, cy = (Y[j] + Y[j + 1]) / 2;
      const win = inWin(cx, cy);
      if (win) {
        if (run) { out.push(R_(run, Y[j], X[i] - run, Y[j + 1] - Y[j], m)); run = null; }
        out.push(R_(X[i], Y[j], X[i + 1] - X[i], Y[j + 1] - Y[j], win[4] || wm));
      } else if (run === null) run = X[i];
    }
    if (run !== null) out.push(R_(run, Y[j], X[X.length - 1] - run, Y[j + 1] - Y[j], m));
  }
  return out;
}
const grid = (x0, y0, nx, ny, w, h, gx, gy) => {
  const r = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) r.push([x0 + i * (w + gx), y0 + j * (h + gy), w, h]);
  return r;
};

const WORLDS = [
  { id: 'village', name: { ru: 'Деревня', en: 'Village' }, sky: ['#5fb4ea', '#bfe6fb', '#eaf8ff'], far: '#93c47d', far2: '#76ad62', ground: ['#5f9d3c', '#4a7f2c', '#6d4a2c'], amb: 'leaf', grav: 1, sun: '#fff7d0' },
  { id: 'city', name: { ru: 'Город', en: 'City' }, sky: ['#2e3366', '#c96b78', '#ffc58e'], far: '#3c3d63', far2: '#2a2b4a', ground: ['#4c4f57', '#36383e', '#2a2b30'], amb: 'none', grav: 1, sun: '#ffd9a8' },
  { id: 'desert', name: { ru: 'Пустыня', en: 'Desert' }, sky: ['#f19a4b', '#f8c879', '#fde9bb'], far: '#e3a95c', far2: '#d18f45', ground: ['#e8c07a', '#cf9f58', '#b98443'], amb: 'dust', grav: 1, sun: '#fffbe0' },
  { id: 'ice', name: { ru: 'Ледяные земли', en: 'Frozen Lands' }, sky: ['#6aa7d8', '#b9dcf3', '#eef8ff'], far: '#e4f1fb', far2: '#c3dcef', ground: ['#f4f9fd', '#cfe0ee', '#9fb7cb'], amb: 'snow', grav: 1, sun: '#ffffff' },
  { id: 'space', name: { ru: 'Луна', en: 'The Moon' }, sky: ['#05060f', '#151237', '#2b1f55'], far: '#3a3456', far2: '#2a2542', ground: ['#8b8798', '#6c6879', '#4f4c5c'], amb: 'stars', grav: 0.42, sun: '#cfd8ff' },
];

/* 30 target designs, 6 per world. The 6th of each world is a boss. */
const TARGETS = [
  /* ---------- VILLAGE ---------- */
  { name: { ru: 'Сарай', en: 'Shed' }, build: () => [
    ...WALL_(-140, 0, 280, 170, 'plank', [[-40, 0, 80, 120, 'wood'], [70, 70, 45, 45]]),
    TRI_(-165, 170, 330, 120, 'redwood'),
  ] },
  { name: { ru: 'Стог сена', en: 'Haystack' }, build: () => [
    R_(-170, 0, 340, 22, 'plank'),
    D_(0, 22, 165, 210, 'hay', 18),
    R_(-14, 225, 28, 40, 'wood'),
  ] },
  { name: { ru: 'Деревенский дом', en: 'Cottage' }, build: () => [
    ...WALL_(-170, 0, 340, 210, 'brick', [[-130, 90, 70, 70], [60, 90, 70, 70], [-30, 0, 60, 115, 'wood']]),
    P_([[-200, 210], [200, 210], [0, 370]], 'roof'),
    R_(80, 290, 40, 110, 'brick'),
  ] },
  { name: { ru: 'Мельница', en: 'Windmill' }, build: () => [
    ...WALL_(-110, 0, 220, 60, 'stone', [[-25, 0, 50, 60, 'wood']]),
    P_([[-100, 60], [100, 60], [62, 400], [-62, 400]], 'stucco'),
    P_([[-62, 400], [62, 400], [25, 440], [-25, 440]], 'roof'),
    R_(-25, 440, 50, 50, 'wood'),
    R_(-16, 490, 32, 210, 'plank'),
    R_(-235, 450, 210, 30, 'plank'),
    R_(25, 450, 210, 30, 'plank'),
  ] },
  { name: { ru: 'Водонапорная башня', en: 'Water Tower' }, build: () => [
    R_(-120, 0, 30, 330, 'wood'), R_(90, 0, 30, 330, 'wood'), R_(-15, 0, 30, 330, 'wood'),
    R_(-90, 110, 75, 18, 'plank'), R_(15, 110, 75, 18, 'plank'),
    R_(-90, 220, 75, 18, 'plank'), R_(15, 220, 75, 18, 'plank'),
    R_(-150, 330, 300, 170, 'metal'),
    P_([[-160, 500], [160, 500], [0, 570]], 'steel'),
  ] },
  { name: { ru: 'Ферма', en: 'Farm' }, boss: true, build: () => [
    ...WALL_(-240, 0, 260, 220, 'redwood', [[-160, 0, 90, 140, 'plank'], [-140, 160, 50, 45, 'hay']]),
    P_([[-255, 220], [20, 220], [-117, 330]], 'roof'),
    R_(20, 0, 130, 400, 'metal'),
    R_(20, 120, 130, 14, 'steel'), R_(20, 260, 130, 14, 'steel'),
    D_(85, 400, 65, 70, 'steel', 14),
    R_(150, 0, 60, 30, 'hay'), R_(160, 30, 40, 26, 'hay'),
  ] },

  /* ---------- CITY ---------- */
  { name: { ru: 'Киоск', en: 'Kiosk' }, build: () => [
    R_(-150, 0, 300, 30, 'concrete'),
    ...WALL_(-140, 30, 280, 190, 'metal', [[-120, 80, 110, 110], [10, 80, 110, 110]]),
    R_(-170, 220, 340, 30, 'redwood'),
    R_(-100, 250, 200, 50, 'hull'),
  ] },
  { name: { ru: 'Автомобиль', en: 'Car' }, build: () => [
    C_(-110, 42, 42, 'rubber', 16), C_(110, 42, 42, 'rubber', 16),
    P_([[-215, 50], [215, 50], [225, 140], [-225, 140]], 'metal'),
    P_([[-140, 140], [-100, 225], [-5, 225], [-5, 140]], 'glass'),
    P_([[5, 140], [5, 225], [100, 225], [140, 140]], 'glass'),
    R_(-5, 140, 10, 85, 'steel'),
    R_(-110, 225, 220, 18, 'metal'),
  ] },
  { name: { ru: 'Сейф банка', en: 'Bank Vault' }, build: () => [
    R_(-170, 0, 340, 40, 'steel'),
    R_(-170, 40, 40, 260, 'steel'), R_(130, 40, 40, 260, 'steel'), R_(-170, 300, 340, 40, 'steel'),
    ...grid(-129, 40, 5, 6, 50, 40, 2, 2).map(([x, y, w, h]) => R_(x, y, w, h, 'gold')),
    R_(-130, 290, 260, 10, 'steel'),
  ] },
  { name: { ru: 'Многоэтажка', en: 'Apartment Block' }, build: () => [
    ...WALL_(-160, 0, 320, 540, 'concrete', grid(-135, 40, 4, 7, 50, 50, 26, 22)),
    R_(-170, 540, 340, 20, 'steel'),
    R_(40, 560, 70, 60, 'metal'),
  ] },
  { name: { ru: 'Стеклянная башня', en: 'Glass Tower' }, build: () => [
    R_(-120, 0, 240, 40, 'concrete'),
    ...WALL_(-110, 40, 220, 560, 'steel', grid(-100, 50, 4, 10, 44, 46, 8, 8)),
    P_([[-110, 600], [110, 600], [0, 680]], 'glass'),
    R_(-4, 680, 8, 60, 'steel'),
  ] },
  { name: { ru: 'Памятник', en: 'Monument' }, boss: true, build: () => [
    R_(-150, 0, 300, 50, 'stone'),
    R_(-110, 50, 220, 170, 'marble'),
    R_(-130, 220, 260, 25, 'stone'),
    // statue
    R_(-50, 245, 35, 150, 'steel'), R_(15, 245, 35, 150, 'steel'),
    P_([[-60, 395], [60, 395], [70, 560], [-70, 560]], 'steel'),
    ROT_(-117, 595, 30, 140, 0.86, 'steel'),
    ROT_(82, 495, 28, 115, 0.3, 'steel'),
    C_(0, 602, 42, 'steel', 18),
    P_([[-188, 632], [-152, 642], [-180, 700]], 'gold'),
  ] },

  /* ---------- DESERT ---------- */
  { name: { ru: 'Глиняная хижина', en: 'Adobe Hut' }, build: () => [
    ...WALL_(-160, 0, 320, 180, 'clay', [[-30, 0, 60, 110, 'plank'], [-125, 80, 50, 45, 'plank'], [75, 80, 50, 45, 'plank']]),
    R_(-175, 180, 350, 25, 'plank'),
    D_(0, 205, 120, 90, 'clay'),
  ] },
  { name: { ru: 'Гигантский кактус', en: 'Giant Cactus' }, build: () => [
    R_(-45, 0, 90, 560, 'plant'),
    D_(0, 560, 45, 40, 'plant'),
    R_(-170, 200, 125, 60, 'plant'), R_(-170, 260, 60, 170, 'plant'), D_(-140, 430, 30, 28, 'plant'),
    R_(45, 300, 110, 55, 'plant'), R_(100, 355, 55, 130, 'plant'), D_(127.5, 485, 27.5, 26, 'plant'),
    C_(0, 615, 18, 'carrot', 10),
  ] },
  { name: { ru: 'Обелиск', en: 'Obelisk' }, build: () => [
    R_(-130, 0, 260, 50, 'sandstone'),
    R_(-100, 50, 200, 30, 'sandstone'),
    P_([[-70, 80], [70, 80], [48, 600], [-48, 600]], 'sandstone'),
    P_([[-48, 600], [48, 600], [0, 670]], 'gold'),
  ] },
  { name: { ru: 'Храм', en: 'Temple' }, build: () => [
    R_(-250, 0, 500, 40, 'sandstone'),
    ...[-215, -115, -15, 85, 185].map((x) => R_(x, 40, 30, 260, 'marble')),
    R_(-250, 300, 500, 40, 'sandstone'),
    P_([[-260, 340], [260, 340], [0, 440]], 'sandstone'),
    C_(0, 380, 22, 'gold', 14),
  ] },
  { name: { ru: 'Сфинкс', en: 'Sphinx' }, build: () => [
    R_(-260, 0, 520, 40, 'sandstone'),
    P_([[-240, 40], [120, 40], [140, 170], [-200, 150]], 'sandstone'),
    R_(110, 40, 140, 45, 'sandstone'),
    P_([[90, 170], [210, 170], [215, 320], [85, 320]], 'sandstone'),
    P_([[70, 175], [90, 175], [85, 320], [60, 290]], 'gold'), P_([[210, 175], [232, 175], [240, 290], [215, 320]], 'gold'),
    P_([[85, 320], [215, 320], [195, 380], [105, 380]], 'gold'),
    P_([[-240, 40], [-200, 150], [-262, 120]], 'sandstone'),
  ] },
  { name: { ru: 'Пирамида', en: 'Pyramid' }, boss: true, build: () => {
    const out = [];
    const rows = 7, H = 75;
    for (let i = 0; i < rows; i++) {
      const w0 = 560 - i * 75, w1 = 560 - (i + 1) * 75;
      const y0 = i * H, y1 = (i + 1) * H;
      if (i === 2) {
        out.push(P_([[-w0 / 2, y0], [-45, y0], [-45, y1], [-w1 / 2, y1]], 'sandstone'));
        out.push(R_(-45, y0, 90, H, 'tnt'));
        out.push(P_([[45, y0], [w0 / 2, y0], [w1 / 2, y1], [45, y1]], 'sandstone'));
      } else out.push(P_([[-w0 / 2, y0], [w0 / 2, y0], [w1 / 2, y1], [-w1 / 2, y1]], 'sandstone'));
    }
    out.push(P_([[-17.5, rows * H], [17.5, rows * H], [0, rows * H + 30]], 'gold'));
    return out;
  } },

  /* ---------- ICE ---------- */
  { name: { ru: 'Снеговик', en: 'Snowman' }, build: () => [
    C_(0, 120, 125, 'snow', 26),
    C_(0, 320, 90, 'snow', 22),
    C_(0, 460, 62, 'snow', 20),
    P_([[52, 472], [52, 448], [130, 456]], 'carrot'),
    R_(-55, 515, 110, 14, 'rubber'), R_(-38, 529, 76, 70, 'rubber'),
    ROT_(-130, 360, 110, 12, -0.5, 'wood'), ROT_(130, 360, 110, 12, 0.5, 'wood'),
  ] },
  { name: { ru: 'Иглу', en: 'Igloo' }, build: () => {
    const out = [];
    const rx = 210, ry = 200;
    for (let r = 0; r < 4; r++) {
      const a0 = (r / 5) * (Math.PI / 2), a1 = ((r + 1) / 5) * (Math.PI / 2);
      const y0 = Math.sin(a0) * ry, y1 = Math.sin(a1) * ry, x0 = Math.cos(a0) * rx, x1 = Math.cos(a1) * rx;
      out.push(P_([[-x0, y0], [x0, y0], [x1, y1], [-x1, y1]], 'ice'));
    }
    out.push(D_(0, Math.sin(0.4 * Math.PI) * ry, Math.cos(0.4 * Math.PI) * rx, 28, 'ice', 10));
    out.push(D_(205, 0, 70, 100, 'snow', 12));
    return out;
  } },
  { name: { ru: 'Маяк', en: 'Lighthouse' }, build: () => [
    R_(-150, 0, 300, 40, 'stone'),
    P_([[-95, 40], [95, 40], [60, 470], [-60, 470]], 'stucco'),
    P_([[-90, 120], [90, 120], [85, 175], [-85, 175]], 'redwood'),
    P_([[-80, 260], [80, 260], [75, 310], [-75, 310]], 'redwood'),
    P_([[-70, 380], [70, 380], [66, 430], [-66, 430]], 'redwood'),
    R_(-80, 470, 160, 18, 'steel'),
    R_(-55, 488, 110, 75, 'glass'),
    P_([[-70, 563], [70, 563], [0, 620]], 'redwood'),
  ] },
  { name: { ru: 'Корабль во льдах', en: 'Frozen Ship' }, build: () => [
    R_(-280, 0, 560, 60, 'ice'),
    P_([[-250, 60], [250, 60], [290, 170], [-270, 170]], 'plank'),
    R_(-150, 170, 210, 70, 'wood'),
    R_(-12, 240, 24, 330, 'wood'),
    P_([[12, 300], [170, 330], [170, 530], [12, 550]], 'stucco'),
    R_(-200, 170, 18, 160, 'wood'), P_([[-182, 200], [-80, 215], [-80, 320], [-182, 330]], 'stucco'),
  ] },
  { name: { ru: 'Ледяная скульптура', en: 'Ice Sculpture' }, build: () => [
    R_(-130, 0, 260, 50, 'ice'),
    P_([[-60, 50], [60, 50], [40, 220], [-40, 220]], 'ice'),
    P_([[-40, 220], [40, 220], [120, 340], [0, 300], [-120, 340]], 'crystal'),
    C_(0, 360, 55, 'ice', 18),
    P_([[-30, 410], [30, 410], [0, 520]], 'crystal'),
    P_([[-120, 340], [-150, 470], [-60, 380]], 'ice'), P_([[120, 340], [60, 380], [150, 470]], 'ice'),
  ] },
  { name: { ru: 'Ледяной замок', en: 'Ice Castle' }, boss: true, build: () => [
    ...WALL_(-260, 0, 120, 430, 'ice', [[-225, 300, 50, 70, 'crystal']]),
    ...WALL_(140, 0, 120, 430, 'ice', [[175, 300, 50, 70, 'crystal']]),
    ...WALL_(-140, 0, 280, 300, 'ice', [[-50, 0, 100, 150, 'steel'], [-110, 190, 50, 60, 'crystal'], [60, 190, 50, 60, 'crystal']]),
    ...[-260, -220, -180].map((x) => R_(x + 2, 430, 32, 40, 'ice')),
    ...[142, 182, 222].map((x) => R_(x + 2, 430, 32, 40, 'ice')),
    P_([[-140, 300], [140, 300], [0, 470]], 'crystal'),
    R_(-10, 470, 20, 60, 'crystal'),
  ] },

  /* ---------- SPACE ---------- */
  { name: { ru: 'Луноход', en: 'Moon Rover' }, build: () => [
    C_(-140, 38, 38, 'rubber', 14), C_(0, 38, 38, 'rubber', 14), C_(140, 38, 38, 'rubber', 14),
    R_(-200, 76, 400, 70, 'hull'),
    R_(-200, 146, 400, 14, 'gold'),
    R_(-120, 160, 140, 80, 'metal'),
    R_(40, 160, 14, 140, 'steel'),
    D_(47, 300, 80, 40, 'metal', 10),
  ] },
  { name: { ru: 'Ракета', en: 'Rocket' }, build: () => [
    P_([[-140, 0], [-60, 0], [-60, 200]], 'metal'),
    P_([[60, 0], [140, 0], [60, 200]], 'metal'),
    ...WALL_(-60, 0, 120, 480, 'hull', [[-30, 330, 60, 60], [-60, 150, 120, 22, 'redwood']]),
    P_([[-60, 480], [60, 480], [0, 640]], 'redwood'),
  ] },
  { name: { ru: 'Робот', en: 'Robot' }, build: () => [
    R_(-90, 0, 70, 30, 'steel'), R_(20, 0, 70, 30, 'steel'),
    R_(-75, 30, 45, 170, 'metal'), R_(30, 30, 45, 170, 'metal'),
    R_(-120, 200, 240, 200, 'hull'),
    R_(-60, 260, 120, 80, 'alien'),
    R_(-175, 220, 55, 180, 'metal'), R_(120, 220, 55, 180, 'metal'),
    R_(-30, 400, 60, 20, 'steel'),
    R_(-80, 420, 160, 110, 'metal'),
    R_(-50, 455, 35, 30, 'alien'), R_(15, 455, 35, 30, 'alien'),
    R_(-4, 530, 8, 50, 'steel'), C_(0, 590, 12, 'alien', 10),
  ] },
  { name: { ru: 'Антенна', en: 'Dish Antenna' }, build: () => [
    R_(-130, 0, 260, 40, 'concrete'),
    R_(-30, 40, 60, 260, 'steel'),
    R_(-80, 300, 160, 40, 'metal'),
    P_([[-250, 470], [-180, 380], [-80, 340], [80, 340], [180, 380], [250, 470], [0, 400]], 'hull'),
    R_(-6, 400, 12, 140, 'steel'), C_(0, 555, 20, 'alien', 10),
  ] },
  { name: { ru: 'НЛО', en: 'UFO' }, build: () => [
    R_(-150, 0, 26, 160, 'steel'), R_(124, 0, 26, 160, 'steel'),
    P_([[-140, 160], [140, 160], [280, 230], [140, 290], [-140, 290], [-280, 230]], 'hull'),
    R_(-260, 226, 520, 10, 'alien'),
    D_(0, 290, 120, 120, 'glass', 18),
    C_(0, 335, 26, 'alien', 12),
  ] },
  { name: { ru: 'Крепость пришельцев', en: 'Alien Citadel' }, boss: true, build: () => [
    R_(-270, 0, 540, 60, 'dark'),
    ...WALL_(-240, 60, 120, 380, 'dark', [[-210, 140, 60, 80, 'alien'], [-210, 280, 60, 80, 'alien']]),
    ...WALL_(120, 60, 120, 380, 'dark', [[150, 140, 60, 80, 'alien'], [150, 280, 60, 80, 'alien']]),
    ...WALL_(-120, 60, 240, 260, 'steel', [[-40, 60, 80, 120, 'tnt']]),
    P_([[-240, 440], [-120, 440], [-180, 560]], 'alien'), P_([[120, 440], [240, 440], [180, 560]], 'alien'),
    P_([[-120, 320], [120, 320], [60, 560], [-60, 560]], 'dark'),
    P_([[-60, 560], [60, 560], [0, 700]], 'alien'),
  ] },
];

function targetForLevel(level) {
  const idx = (level - 1) % TARGETS.length;
  const cycle = Math.floor((level - 1) / TARGETS.length);
  const world = Math.floor(idx / 6);
  return { idx, cycle, world, def: TARGETS[idx], boss: !!TARGETS[idx].boss };
}
/* growth curve: steep early so upgrades matter, gentler in the endless tail */
function growth(level) {
  const a = Math.min(level, 40) - 1, b = Math.max(0, level - 40);
  return Math.pow(1.22, a) * Math.pow(1.16, b);
}
function levelHP(level) {
  const t = targetForLevel(level);
  return Math.round(1250 * growth(level) * (t.boss ? 2.1 : 1));
}
function levelReward(level) {
  const t = targetForLevel(level);
  return Math.round(28 * growth(level) * (t.boss ? 2.5 : 1));
}
