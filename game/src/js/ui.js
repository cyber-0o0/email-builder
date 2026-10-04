'use strict';
/* ===== DOM user interface ===== */
const $ = (id) => document.getElementById(id);
const UP_ICONS = {
  power: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  greed: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15.9V19h-2v-1.1c-1.7-.3-3-1.3-3.1-3h2c.1.9.8 1.4 2.1 1.4 1.4 0 1.8-.7 1.8-1.2 0-.6-.4-1.1-2-1.5-1.9-.5-3.4-1.2-3.4-3 0-1.4 1.1-2.4 2.6-2.7V6.8h2v1.1c1.6.4 2.4 1.5 2.4 2.8h-2c0-.9-.5-1.4-1.6-1.4-1.1 0-1.7.5-1.7 1.1 0 .6.5.9 2 1.3 1.6.4 3.4 1 3.4 3.1 0 1.6-1.2 2.6-2.5 2.9z"/></svg>',
  speed: '<svg viewBox="0 0 24 24"><path d="M12 4a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V4zm-1 3v7l5 3 1-1.7-4-2.3V7z"/><path d="M15 2h6v6l-2-2-3 3-1.4-1.4 3-3z"/></svg>',
  crit: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>',
  drone: '<svg viewBox="0 0 24 24"><path d="M2 5h7v2H6.5v2H9l1 2h4l1-2h2.5V7H15V5h7v2h-2.5v2H21v2h-4.2l-1.6 3H8.8l-1.6-3H3V9h1.5V7H2zm8 11h4l-1 4h-2z"/></svg>',
};

const UI = {
  shown: { hp: 1, ghost: 1, coins: 0 },
  tab: 'items',
  winData: null,
  coinPos: [0, 0],

  init() {
    this.applyTexts();
    $('btnShop').addEventListener('click', () => { Audio2.init(); Audio2.click(); this.openShop(); });
    $('btnSet').addEventListener('click', () => { Audio2.init(); Audio2.click(); this.openSettings(); });
    $('shopClose').addEventListener('click', () => { Audio2.click(); this.close('shop'); });
    $('setClose').addEventListener('click', () => { Audio2.click(); this.close('settings'); });
    document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { Audio2.click(); this.tab = b.dataset.tab; this.renderShop(); }));
    $('btnPlay').addEventListener('click', () => this.play());
    $('btnNext').addEventListener('click', () => this.next(false));
    $('btnX2').addEventListener('click', () => this.next(true));
    $('orderOk').addEventListener('click', () => { Audio2.init(); Audio2.click(); this.close('order'); G.startLevel(G.level); });
    $('unlockOk').addEventListener('click', () => { Audio2.click(); this.close('unlock'); if (this._afterUnlock) { const f = this._afterUnlock; this._afterUnlock = null; f(); } });
    window.addEventListener('resize', () => this.measure());
    this.buildBar();
    this.shown.coins = SAVE.coins;
    $('coinText').textContent = fmt(SAVE.coins);
  },

  applyTexts() {
    document.documentElement.lang = LANG;
    $('shopLbl').textContent = T('shop');
    $('playLbl').textContent = T('play');
    $('btnNext').textContent = T('next');
    $('shopTitle').textContent = T('shop');
    $('tabItems').textContent = T('items');
    $('tabUps').textContent = T('upgrades');
    $('setTitle').textContent = T('settings');
    $('winTitle').textContent = T('destroyed');
    $('unlockTitle').textContent = T('newItem');
    $('unlockOk').textContent = T('cool');
    $('hintText').textContent = T('hint');
    if (LANG !== 'ru') { $('logo1').textContent = 'DROP'; $('logo2').textContent = '& SMASH'; document.title = 'Drop & Smash'; }
    $('logoSub').textContent = T('crew');
    $('orderOk').textContent = T('take');
    $('orderPlanLbl').textContent = T('planLbl');
  },

  measure() {
    const r = document.querySelector('#coinChip .coin-ico').getBoundingClientRect();
    this.coinPos = [r.left + r.width / 2, r.top + r.height / 2];
  },
  coinTarget() { return this.coinPos; },

  /* ---------- item bar ---------- */
  buildBar() {
    const box = $('items');
    box.innerHTML = '';
    let teaser = false;
    ITEMS.forEach((d, i) => {
      const unlocked = itemUnlocked(d.id);
      if (!unlocked && teaser) return;
      if (!unlocked) teaser = true;
      const b = document.createElement('button');
      b.className = 'it' + (unlocked ? '' : ' locked') + (unlocked && !SAVE.seen[d.id] && d.id !== 'rock' ? ' new' : '');
      b.dataset.id = d.id;
      const c = document.createElement('canvas'); c.width = c.height = 108;
      const g = c.getContext('2d'); g.translate(54, 54); drawItem(g, d.id, 34, 0.3, 7);
      b.appendChild(c);
      const lv = document.createElement('span'); lv.className = 'lv';
      lv.textContent = unlocked ? T('lvlShort') + ' ' + (itemLevel(d.id) + 1) : T('lvlShort') + ' ' + d.unlock;
      b.appendChild(lv);
      if (unlocked && i < 10) { const k = document.createElement('span'); k.className = 'key'; k.textContent = (i + 1) % 10; b.appendChild(k); }
      b.setAttribute('aria-label', L(d.name));
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); Audio2.init(); });
      b.addEventListener('click', () => {
        if (!unlocked) { Audio2.deny(); this.toast(T('unlockAt') + ' ' + d.unlock, L(d.name)); return; }
        this.select(d.id);
      });
      box.appendChild(b);
    });
    if (!itemUnlocked(G.sel)) G.sel = 'rock';
    this.select(G.sel, true);
  },
  select(id, silent) {
    G.sel = id; SAVE.sel = id;
    if (!SAVE.seen[id]) { SAVE.seen[id] = 1; }
    document.querySelectorAll('.it').forEach((b) => {
      b.classList.toggle('sel', b.dataset.id === id);
      if (b.dataset.id === id) { b.classList.remove('new'); if (!silent) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
    });
    if (!silent) Audio2.click();
  },
  denyItem(id) { const b = document.querySelector(`.it[data-id="${id}"]`); if (b) { b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny'); } },
  onReady(id) {
    const b = document.querySelector(`.it[data-id="${id}"]`);
    if (b) { b.style.setProperty('--cd', 0); b.classList.remove('ready'); void b.offsetWidth; b.classList.add('ready'); }
    if (ITEM[id].cd > 1.5) Audio2.ready();
  },

  /* ---------- per-frame ---------- */
  update(dt) {
    // hp
    const eff = Math.max(0, World.standingHP - World.winHP);
    const tot = Math.max(1, World.totalHP - World.winHP);
    const f = clamp(eff / tot, 0, 1);
    if (f < this.shown.hp - 0.0005) { const hp = $('hp'); hp.classList.remove('hit'); void hp.offsetWidth; hp.classList.add('hit'); }
    this.shown.hp = f;
    this.shown.ghost = this.shown.ghost > f ? Math.max(f, this.shown.ghost - dt * 0.35) : f;
    $('hpFill').style.width = (f * 100).toFixed(2) + '%';
    $('hpGhost').style.width = (this.shown.ghost * 100).toFixed(2) + '%';
    const txt = fmt(Math.ceil(eff));
    if (this._hpTxt !== txt) { $('hpText').textContent = txt; this._hpTxt = txt; }
    // coins (rolling counter)
    const c = SAVE.coins;
    if (this.shown.coins !== c) {
      this.shown.coins = c > this.shown.coins ? Math.min(c, this.shown.coins + Math.max(1, (c - this.shown.coins) * dt * 10)) : c;
      $('coinText').textContent = fmt(this.shown.coins);
    }
    // cooldowns
    for (const b of document.querySelectorAll('.it:not(.locked)')) {
      const id = b.dataset.id;
      const v = G.cd[id] > 0 ? G.cd[id] / (G.cdMax[id] || 1) : 0;
      const q = Math.round(v * 100) / 100;
      if (b._cd !== q) { b.style.setProperty('--cd', q); b._cd = q; }
    }
    // combo
    const cb = $('combo');
    if (G.combo >= 5) {
      cb.classList.add('on');
      if (this._combo !== G.combo) {
        cb.innerHTML = `${T('combo')} x${G.combo}<small>+${Math.min(G.combo, 50) * 2}% 🪙</small>`.replace('🪙', LANG === 'ru' ? 'монет' : 'coins');
        cb.classList.remove('pulse'); void cb.offsetWidth; cb.classList.add('pulse');
        this._combo = G.combo;
      }
    } else cb.classList.remove('on');
    // shop dot
    this._dotT = (this._dotT || 0) - dt;
    if (this._dotT <= 0) { this._dotT = 0.5; $('btnShop').classList.toggle('can', this.canAffordAny()); }
  },
  bumpCoins() { const e = $('coinChip'); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); },

  onLevelStart() {
    const info = G.info;
    $('lvlNum').textContent = T('level') + ' ' + G.level;
    $('worldName').textContent = L(WORLDS[info.world].name);
    $('tName').innerHTML = (info.boss ? `<span class="boss"><span>${T('boss')}</span></span>` : '') + L(info.def.name) + (info.cycle ? ' ' + 'I'.repeat(Math.min(info.cycle + 1, 5)) : '');
    this.shown.hp = 1; this.shown.ghost = 1;
    if (G.state === 'idle') { this.measure(); return; }
    if (info.boss) this.toast(T('boss'), L(info.def.name));
    this.measure();
  },
  onPlayStart() {
    if (!SAVE.tut) this.hint(true);
  },
  hint(on) { $('hint').hidden = !on; },
  toast(small, big) {
    const t = $('toast');
    t.querySelector('small').textContent = small; t.querySelector('b').textContent = big;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  },

  open(id) { $(id).hidden = false; },
  close(id) {
    $(id).hidden = true;
    if (id === 'shop' || id === 'settings') { G.paused = false; this.buildBar(); }
  },

  /* ---------- title ---------- */
  showTitle() {
    $('titleMeta').textContent = SAVE.level > 1 ? T('level') + ' ' + SAVE.level : '';
    this.open('title');
  },
  play() {
    Audio2.init(); Audio2.click();
    this.close('title');
    this.showOrder(SAVE.level);
  },

  /* ---------- win ---------- */
  showWin() {
    const lvl = G.level;
    const base = Math.round(levelReward(lvl) * (1 + SAVE.up.greed * 0.15));
    const par = G.info.boss ? 45 : 28;
    const fast = G.levelTime <= par ? Math.round(base * 0.3) : 0;
    const total = base + fast;
    this.winData = { total, lvl };
    $('winTarget').textContent = L(G.info.def.name) + ' · ' + T('level') + ' ' + lvl;
    const coin = '<i class="coin-ico"></i>';
    $('winStats').innerHTML =
      `<div><span>${T('time')}</span><b>${G.levelTime.toFixed(1)}s</b></div>` +
      `<div><span>${T('coinsLoot')}</span><b>${fmt(G.loot)} ${coin}</b></div>` +
      `<div><span>${T('reward')}</span><b>${fmt(base)} ${coin}</b></div>` +
      (fast ? `<div><span>${T('bonusFast')} (&lt;${par}s)</span><b>+${fmt(fast)} ${coin}</b></div>` : '') +
      `<div class="total"><span>${T('total')}</span><b id="winTotal">0 ${coin}</b></div>`;
    const nx = document.getElementById('winNext') || (() => { const d = document.createElement('div'); d.id = 'winNext'; d.className = 'win-next'; $('winStats').before(d); return d; })();
    nx.innerHTML = `${T('built')} <b>${L(STORY[G.info.idx].next)}</b>`;
    $('btnX2').innerHTML = `▶ ${T('x2')}`;
    $('btnX2').disabled = false;
    this.open('win');
    // count-up
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 700);
      const el = $('winTotal'); if (!el) return;
      el.innerHTML = fmt(total * easeOutCubic(k)) + ' ' + coin;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    const best = SAVE.stats.best[G.info.idx];
    if (!best || G.levelTime < best) SAVE.stats.best[G.info.idx] = Math.round(G.levelTime * 10) / 10;
  },
  next(double) {
    if (!this.winData) return;
    Audio2.init(); Audio2.click();
    const finish = (mult) => {
      if (!this.winData) return;
      SAVE.coins += this.winData.total * mult;
      this.bumpCoins(); Audio2.buy();
      this.winData = null;
      this.close('win');
      this.advance();
    };
    if (double) {
      $('btnX2').disabled = true;
      SDK.showRewarded(() => finish(2), () => { if (this.winData) $('btnX2').disabled = false; });
    } else finish(1);
  },
  advance() {
    const prevWorld = targetForLevel(SAVE.level).world;
    SAVE.level++;
    const newItems = ITEMS.filter((d) => d.unlock === SAVE.level);
    newItems.forEach((d) => { if (SAVE.items[d.id] === undefined) SAVE.items[d.id] = 0; });
    saveGame(true);
    const go = () => {
      this.showOrder(SAVE.level);
      if (targetForLevel(SAVE.level).world !== prevWorld) this.toast(T('worldNew'), L(WORLDS[targetForLevel(SAVE.level).world].name));
    };
    const afterAd = () => {
      if (newItems.length) { this.buildBar(); this.showUnlock(newItems[0], go); }
      else go();
    };
    if (SAVE.level % 2 === 1 && SAVE.level > 3) SDK.showFullscreen(afterAd); else afterAd();
  },
  /* job card: who asked for the demolition and what will be built */
  showOrder(level) {
    G.preview(level);
    const info = G.info, st = STORY[info.idx], cl = CLIENTS[info.world];
    $('orderTitle').textContent = T('order') + level;
    $('orderTarget').textContent = L(info.def.name);
    const av = $('orderAvatar'); av.textContent = L(cl.letter); av.style.background = cl.color;
    $('orderClient').textContent = L(cl.name);
    $('orderWhy').textContent = L(st.why);
    $('orderNext').textContent = L(st.next);
    this.open('order');
  },
  showUnlock(d, then) {
    this._afterUnlock = () => { this.select(d.id); then(); };
    const c = $('unlockIco'), g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 300, 300); g.translate(150, 150);
    drawItem(g, d.id, 95, 0.3, 7);
    $('unlockName').textContent = L(d.name);
    $('unlockDesc').textContent = L(d.desc);
    Audio2.unlock();
    this.open('unlock');
  },

  /* ---------- shop ---------- */
  canAffordAny() {
    for (const d of ITEMS) if (itemUnlocked(d.id) && SAVE.coins >= itemCost(d, itemLevel(d.id))) return true;
    for (const u of GLOBAL_UPS) if (SAVE.up[u.id] < u.max && SAVE.coins >= upCost(u, SAVE.up[u.id])) return true;
    return false;
  },
  openShop() { G.paused = true; this.renderShop(); this.open('shop'); },
  renderShop() {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tab));
    $('shopCoins').textContent = fmt(SAVE.coins);
    const body = $('shopBody');
    const coin = '<i class="coin-ico"></i>';
    let html = '';
    if (SDK.ysdk) html += `<div class="free-coins"><span>${T('freeCoins')}: <b>+${fmt(levelReward(SAVE.level))}</b></span><button class="btn ad" data-free="1">▶ ${T('get')}</button></div>`;
    if (this.tab === 'items') {
      for (const d of ITEMS) {
        const un = itemUnlocked(d.id);
        const lv = Math.max(0, itemLevel(d.id));
        const cost = itemCost(d, lv);
        const dmgNow = itemDamage(d.id), dmgNext = dmgNow * 1.22;
        html += `<div class="srow ${un ? '' : 'locked'}"><canvas data-icon="${d.id}" width="104" height="104"></canvas><div><div class="nm">${L(d.name)}${un ? `<small>${T('lvlShort')} ${lv + 1}</small>` : ''}</div>` +
          (un ? `<div class="ds">${T('dmg')}: ${fmt(dmgNow)} → <b>${fmt(dmgNext)}</b> · ${T('cd')} ${itemCooldown(d.id).toFixed(1)}s</div>` : `<div class="ds">${T('unlockAt')} ${d.unlock}</div>`) +
          `</div>${un ? `<button class="btn" data-buy="${d.id}" ${SAVE.coins < cost ? 'disabled' : ''}>${coin}${fmt(cost)}</button>` : ''}</div>`;
      }
    } else {
      for (const u of GLOBAL_UPS) {
        const lv = SAVE.up[u.id];
        const max = lv >= u.max;
        const cost = upCost(u, lv);
        html += `<div class="srow"><div class="uico">${UP_ICONS[u.id]}</div><div><div class="nm">${T(u.name)}<small>${T('lvlShort')} ${lv}</small></div>` +
          `<div class="ds">${T(u.desc)}: ${u.eff(lv)}${max ? '' : ` → <b>${u.eff(lv + 1)}</b>`}</div></div>` +
          `<button class="btn" data-up="${u.id}" ${max || SAVE.coins < cost ? 'disabled' : ''}>${max ? T('max') : coin + fmt(cost)}</button></div>`;
      }
    }
    body.innerHTML = html;
    body.querySelectorAll('canvas[data-icon]').forEach((c) => { const g = c.getContext('2d'); g.translate(52, 52); drawItem(g, c.dataset.icon, 34, 0.3, 7); });
    body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => this.buyItem(b.dataset.buy)));
    body.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => this.buyUp(b.dataset.up)));
    const fb = body.querySelector('[data-free]');
    if (fb) fb.addEventListener('click', () => { fb.disabled = true; SDK.showRewarded(() => { SAVE.coins += levelReward(SAVE.level); saveGame(); Audio2.buy(); }, () => this.renderShop()); });
  },
  buyItem(id) {
    const d = ITEM[id];
    const lv = Math.max(0, itemLevel(id));
    const cost = itemCost(d, lv);
    if (SAVE.coins < cost) { Audio2.deny(); return; }
    SAVE.coins -= cost; SAVE.items[id] = lv + 1;
    Audio2.buy(); saveGame();
    this.shown.coins = SAVE.coins;
    $('coinText').textContent = fmt(SAVE.coins);
    this.renderShop();
  },
  buyUp(id) {
    const u = GLOBAL_UPS.find((x) => x.id === id);
    const lv = SAVE.up[id];
    const cost = upCost(u, lv);
    if (lv >= u.max || SAVE.coins < cost) { Audio2.deny(); return; }
    SAVE.coins -= cost; SAVE.up[id] = lv + 1;
    Audio2.buy(); saveGame();
    this.shown.coins = SAVE.coins;
    $('coinText').textContent = fmt(SAVE.coins);
    this.renderShop();
  },

  /* ---------- settings ---------- */
  openSettings() { G.paused = true; this.renderSettings(); this.open('settings'); },
  renderSettings() {
    const s = SAVE.settings;
    const row = (k, lbl) => `<div class="set-row"><span>${T(lbl)}</span><button class="tog ${s[k] ? 'on' : ''}" data-set="${k}" aria-label="${T(lbl)}" aria-pressed="${!!s[k]}"></button></div>`;
    $('setBody').innerHTML = row('sound', 'sound') + row('music', 'music') + row('vibro', 'vibro') + `<button class="reset" id="btnReset">${T('resetProgress')}</button>`;
    $('setBody').querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.set; s[k] = !s[k];
      Audio2.sound = s.sound; Audio2.music = s.music; Audio2.applyVolumes();
      Audio2.click(); saveGame(); this.renderSettings();
    }));
    $('btnReset').addEventListener('click', (e) => {
      if (!this._resetArm) { this._resetArm = true; e.target.textContent = T('confirmReset'); setTimeout(() => { this._resetArm = false; }, 3000); return; }
      this._resetArm = false;
      const settings = SAVE.settings;
      SAVE = DEFAULT_SAVE(); SAVE.settings = settings; SAVE.tut = 1;
      saveGame(true);
      G.cd = {};
      this.close('settings');
      this.showOrder(1);
    });
  },
};
