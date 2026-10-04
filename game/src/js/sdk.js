'use strict';
/* ===== Yandex Games SDK wrapper (works without SDK too) ===== */
const SDK = {
  ysdk: null,
  player: null,
  lastAd: 0,
  adOpen: false,
  async init() {
    try {
      if (!window.YaGames) {
        await new Promise((res) => {
          const s = document.createElement('script');
          s.src = '/sdk.js';
          s.async = true;
          s.onload = res;
          s.onerror = res;
          setTimeout(res, 2500);
          document.head.appendChild(s);
        });
      }
      if (window.YaGames) {
        this.ysdk = await window.YaGames.init();
        try { this.player = await this.ysdk.getPlayer({ scopes: false }); } catch (e) { this.player = null; }
      }
    } catch (e) { this.ysdk = null; }
  },
  lang() {
    try { if (this.ysdk) return this.ysdk.environment.i18n.lang; } catch (e) { /* ignore */ }
    return (navigator.language || 'ru').slice(0, 2);
  },
  ready() { try { this.ysdk && this.ysdk.features.LoadingAPI && this.ysdk.features.LoadingAPI.ready(); } catch (e) { /* ignore */ } },
  gameplayStart() { try { this.ysdk && this.ysdk.features.GameplayAPI && this.ysdk.features.GameplayAPI.start(); } catch (e) { /* ignore */ } },
  gameplayStop() { try { this.ysdk && this.ysdk.features.GameplayAPI && this.ysdk.features.GameplayAPI.stop(); } catch (e) { /* ignore */ } },
  async loadData() {
    if (!this.player) return null;
    try { const d = await this.player.getData(['save']); return d && d.save ? d.save : null; } catch (e) { return null; }
  },
  saveData(save) {
    if (!this.player) return;
    try { this.player.setData({ save }, false).catch(() => {}); } catch (e) { /* ignore */ }
  },
  showFullscreen(done) {
    const fin = () => { this.adOpen = false; Audio2.duck(false); done && done(); };
    if (!this.ysdk) { done && done(); return; }
    this.adOpen = true; Audio2.duck(true);
    try {
      this.ysdk.adv.showFullscreenAdv({ callbacks: { onClose: fin, onError: fin, onOffline: fin } });
    } catch (e) { fin(); }
  },
  showRewarded(onReward, done) {
    if (!this.ysdk) { onReward(); done && done(); return; }
    let rewarded = false;
    this.adOpen = true; Audio2.duck(true);
    const fin = () => { this.adOpen = false; Audio2.duck(false); if (rewarded) onReward(); done && done(); };
    try {
      this.ysdk.adv.showRewardedVideo({
        callbacks: { onRewarded: () => { rewarded = true; }, onClose: fin, onError: fin },
      });
    } catch (e) { fin(); }
  },
};
