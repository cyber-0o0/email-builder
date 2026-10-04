'use strict';
/* ===== Boot, input, main loop ===== */
async function boot() {
  const cv = $('game');
  Render.init(cv);
  await SDK.init();
  const l = SDK.lang();
  LANG = ['ru', 'be', 'kk', 'uk', 'uz', 'tr'].includes(l) ? (l === 'tr' ? 'en' : 'ru') : 'en';
  const remote = await SDK.loadData();
  const local = loadLocal();
  SAVE = mergeSave(remote && (!local || (remote.ts || 0) >= (local.ts || 0)) ? remote : local);
  ITEMS.forEach((d) => { if (SAVE.level >= d.unlock && SAVE.items[d.id] === undefined) SAVE.items[d.id] = 0; });
  Audio2.sound = SAVE.settings.sound; Audio2.music = SAVE.settings.music;
  G.sel = SAVE.sel || 'rock';

  UI.init();
  // preview of the current target behind the title screen
  G.level = SAVE.level;
  G.info = World.build(SAVE.level);
  G.world = G.info.world;
  Music.world = G.world;
  Render.resize();
  G.state = 'idle';
  UI.onLevelStart();
  UI.showTitle();

  /* ---------- input ---------- */
  const setP = (e) => { G.pointer.x = e.clientX; G.pointer.y = e.clientY; };
  cv.addEventListener('pointerdown', (e) => {
    Audio2.init();
    setP(e); G.pointer.down = true; G.pointer.over = true;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    G.tryDrop(true);
  });
  cv.addEventListener('pointermove', (e) => { setP(e); G.pointer.over = true; });
  const up = (e) => { G.pointer.down = false; if (e.pointerType !== 'mouse') G.pointer.over = false; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { G.pointer.over = false; G.pointer.down = false; });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.repeat && e.code !== 'Space') return;
    const n = '1234567890'.indexOf(e.key);
    if (n >= 0) { const d = ITEMS[n]; if (d && itemUnlocked(d.id)) UI.select(d.id); }
    if (e.code === 'Space') { e.preventDefault(); Audio2.init(); G.tryDrop(!e.repeat); }
    if (e.code === 'Escape') { ['shop', 'settings'].forEach((id) => { if (!$(id).hidden) UI.close(id); }); }
  });
  window.addEventListener('resize', () => Render.resize());
  document.addEventListener('visibilitychange', () => {
    const h = document.hidden;
    G.hidden = h;
    Audio2.setHidden(h);
    if (h) { saveGame(true); SDK.gameplayStop(); } else if (G.state === 'play' && !G.paused) SDK.gameplayStart();
  });
  window.addEventListener('pagehide', () => saveGame(true));

  /* ---------- loop ---------- */
  let last = performance.now();
  let saveT = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000;
    last = now;
    if (G.hidden) return;
    dt = Math.min(dt, 1 / 24);
    G.update(dt);
    Render.frame(G.paused || G.hitstop > 0 ? 0 : dt * G.timeScale);
    UI.update(dt);
    saveT += dt;
    if (saveT > 10) { saveT = 0; saveGame(); }
  };
  requestAnimationFrame(loop);
  SDK.ready();
}
window.addEventListener('load', () => { boot().catch((e) => { console.error(e); }); });
