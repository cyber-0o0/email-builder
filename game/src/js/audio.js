'use strict';
/* ===== Procedural audio: every sound is synthesized, no files ===== */
const Audio2 = {
  ctx: null, master: null, sfx: null, mus: null, noiseBuf: null,
  sound: true, music: true, ducked: false, hidden: false,
  _last: {}, voices: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
    const len = c.sampleRate * 1.5;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // brown-ish noise for rumbles
    this.brownBuf = c.createBuffer(1, len, c.sampleRate);
    const b = this.brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
    this.applyVolumes();
    Music.start();
  },
  applyVolumes() {
    if (!this.ctx) return;
    const on = !this.ducked && !this.hidden;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.sound ? 1 : 0, t, 0.05);
    this.mus.gain.setTargetAtTime(this.music ? 0.16 : 0, t, 0.3);
    if (!on && this.ctx.state === 'running') { /* keep running, gain is 0 */ }
  },
  duck(b) { this.ducked = b; this.applyVolumes(); },
  setHidden(b) {
    this.hidden = b; this.applyVolumes();
    if (!this.ctx) return;
    if (b) this.ctx.suspend && this.ctx.suspend();
    else if (!this.ducked) this.ctx.resume && this.ctx.resume();
  },
  ok(name, gap) {
    if (!this.ctx || !this.sound || this.ducked || this.hidden) return false;
    const now = this.ctx.currentTime;
    if (gap && this._last[name] && now - this._last[name] < gap) return false;
    if (this.voices > 40) return false;
    this._last[name] = now;
    return true;
  },
  _env(g, t, a, dur, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
  },
  tone(o) {
    const c = this.ctx; const t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + (o.slide || o.dur));
    if (o.detune) osc.detune.value = o.detune;
    let node = osc;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g); g.connect(o.out || this.sfx);
    this._env(g, t, o.a || 0.004, o.dur, o.g || 0.2);
    osc.start(t); osc.stop(t + (o.a || 0.004) + o.dur + 0.05);
    this.voices++; osc.onended = () => { this.voices--; };
  },
  noise(o) {
    const c = this.ctx; const t = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource(); src.buffer = o.brown ? this.brownBuf : this.noiseBuf;
    src.playbackRate.value = o.rate || 1;
    const f = c.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q || 0.8;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.slide || o.dur));
    const g = c.createGain();
    src.connect(f); f.connect(g); g.connect(o.out || this.sfx);
    this._env(g, t, o.a || 0.002, o.dur, o.g || 0.3);
    const off = Math.random() * 0.8;
    src.start(t, off); src.stop(t + (o.a || 0.002) + o.dur + 0.05);
    this.voices++; src.onended = () => { this.voices--; };
  },

  /* ---------- SFX ---------- */
  impact(cat, p) {
    if (!this.ok('imp_' + cat, 0.035)) return;
    p = clamp(p, 0.15, 1.5);
    const r = rand(0.9, 1.1);
    // body thump common to all
    this.tone({ f: 120 * r, f2: 38, dur: 0.18 + p * 0.15, g: 0.35 * p, type: 'sine' });
    switch (cat) {
      case 'wood':
        this.noise({ f: 900 * r, ft: 'bandpass', q: 1.2, dur: 0.12, g: 0.5 * p });
        this.tone({ f: 230 * r, f2: 150, dur: 0.09, g: 0.25 * p, type: 'triangle' });
        this.noise({ f: 2600, ft: 'highpass', dur: 0.05 + p * 0.1, g: 0.12 * p, delay: 0.02 });
        break;
      case 'stone':
        this.noise({ f: 1400 * r, f2: 300, ft: 'lowpass', dur: 0.25 + p * 0.3, g: 0.55 * p });
        this.noise({ f: 3500, ft: 'bandpass', q: 0.7, dur: 0.06, g: 0.2 * p });
        for (let i = 0; i < 3; i++) this.noise({ f: rand(1500, 3500), ft: 'bandpass', q: 2, dur: 0.03, g: 0.12 * p, delay: rand(0.05, 0.25) });
        break;
      case 'glass':
        this.shatter(p, 1);
        break;
      case 'ice':
        this.shatter(p, 0.6);
        break;
      case 'metal': {
        const f0 = rand(180, 320);
        [1, 2.76, 5.4, 8.9].forEach((m, i) => this.tone({ f: f0 * m, dur: 0.5 + p * 0.5 - i * 0.08, g: (0.16 / (i + 1)) * p, type: 'sine' }));
        this.noise({ f: 5000, ft: 'highpass', dur: 0.05, g: 0.25 * p });
        break;
      }
      case 'soft':
        this.noise({ f: 500 * r, f2: 150, ft: 'lowpass', dur: 0.18, g: 0.5 * p });
        break;
      case 'crystal': {
        const base = pick([880, 988, 1175, 1319]);
        [1, 1.5, 2.01].forEach((m, i) => this.tone({ f: base * m, dur: 0.7, g: 0.08 * p, delay: i * 0.03 }));
        this.shatter(p * 0.5, 1.2);
        break;
      }
      default:
        this.noise({ f: 1200, ft: 'lowpass', dur: 0.2, g: 0.4 * p });
    }
  },
  shatter(p, pitch) {
    this.noise({ f: 4000 * pitch, ft: 'highpass', dur: 0.25 + p * 0.25, g: 0.35 * p });
    const n = 4 + Math.floor(p * 6);
    for (let i = 0; i < n; i++) {
      this.tone({ f: rand(2200, 6000) * pitch, dur: rand(0.04, 0.16), g: 0.05 * p, delay: rand(0, 0.3), type: 'sine' });
    }
  },
  crumble(p) {
    if (!this.ok('crumble', 0.12)) return;
    p = clamp(p, 0.2, 1.5);
    this.noise({ brown: true, f: 400, ft: 'lowpass', dur: 0.6 + p * 0.8, g: 0.6 * p, a: 0.02 });
    for (let i = 0; i < 6; i++) this.noise({ f: rand(800, 2500), ft: 'bandpass', q: 1.5, dur: 0.05, g: 0.12 * p, delay: rand(0, 0.6) });
  },
  land(p) {
    if (!this.ok('land', 0.05)) return;
    this.tone({ f: 90, f2: 35, dur: 0.15, g: 0.3 * clamp(p, 0.1, 1) });
    this.noise({ f: 700, ft: 'lowpass', dur: 0.12, g: 0.25 * clamp(p, 0.1, 1) });
  },
  explode(p) {
    if (!this.ok('explode', 0.05)) return;
    p = clamp(p, 0.3, 2.5);
    const big = Math.min(p, 1.5);
    this.tone({ f: 110, f2: 28, dur: 0.6 + p * 0.4, g: 0.7 * big, type: 'sine' });
    this.noise({ f: 3500, f2: 180, ft: 'lowpass', dur: 0.7 + p * 0.7, g: 0.8 * big, slide: 0.5 + p * 0.5 });
    this.noise({ brown: true, f: 300, ft: 'lowpass', dur: 1.2 + p, g: 0.7 * big, a: 0.01 });
    for (let i = 0; i < 8; i++) this.noise({ f: rand(1500, 4000), ft: 'bandpass', q: 2, dur: 0.04, g: 0.15 * big, delay: rand(0.05, 0.6) });
  },
  coin(i) {
    if (!this.ok('coin', 0.045)) return;
    const f = 1050 * Math.pow(1.03, Math.min(i, 30));
    this.tone({ f, dur: 0.06, g: 0.07, type: 'square', lp: 4000 });
    this.tone({ f: f * 1.5, dur: 0.12, g: 0.06, type: 'square', lp: 5000, delay: 0.045 });
  },
  click() { if (!this.ok('click', 0.03)) return; this.tone({ f: 700, f2: 400, dur: 0.05, g: 0.15, type: 'triangle' }); this.noise({ f: 3000, ft: 'highpass', dur: 0.02, g: 0.1 }); },
  deny() { if (!this.ok('deny', 0.12)) return; this.tone({ f: 160, dur: 0.12, g: 0.15, type: 'square', lp: 900 }); this.tone({ f: 120, dur: 0.12, g: 0.12, type: 'square', lp: 900, delay: 0.08 }); },
  ready() { if (!this.ok('ready', 0.08)) return; this.tone({ f: 1400, dur: 0.08, g: 0.05, type: 'triangle' }); },
  drop(w) {
    if (!this.ok('drop', 0.04)) return;
    this.noise({ f: 1800, f2: 600, ft: 'bandpass', q: 1.5, dur: 0.18, g: 0.08 + w * 0.06 });
  },
  whistle(dur) {
    if (!this.ok('whistle', 0.2)) return;
    this.tone({ f: 1600, f2: 500, dur, slide: dur, g: 0.07, type: 'sine', a: 0.05 });
  },
  moo() {
    if (!this.ok('moo', 0.4)) return;
    const c = this.ctx; const t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(175, t + 0.25); o.frequency.linearRampToValueAtTime(120, t + 0.9);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(900, t + 0.3); f.frequency.linearRampToValueAtTime(400, t + 0.9);
    const g = c.createGain(); this._env(g, t, 0.08, 0.9, 0.35);
    o.connect(f); f.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 1.1);
  },
  piano() {
    if (!this.ok('piano', 0.2)) return;
    [220, 233, 277, 311, 349, 415, 466].forEach((f) => {
      const ff = f * pick([1, 2, 0.5]);
      this.tone({ f: ff, dur: 1.4, g: 0.06, type: 'triangle', delay: rand(0, 0.08) });
    });
    this.noise({ f: 800, ft: 'bandpass', dur: 0.2, g: 0.4 });
  },
  zap() {
    if (!this.ok('zap', 0.08)) return;
    this.noise({ f: 6000, f2: 800, ft: 'bandpass', q: 0.5, dur: 0.25, g: 0.6 });
    this.tone({ f: 1800, f2: 80, dur: 0.25, g: 0.12, type: 'sawtooth' });
    this.noise({ brown: true, f: 200, ft: 'lowpass', dur: 1.6, g: 0.6, a: 0.08, delay: 0.1 });
  },
  laser(dur) {
    if (!this.ok('laser', 0.3)) return;
    const c = this.ctx; const t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 110;
    const lfo = c.createOscillator(); lfo.frequency.value = 18; const lg = c.createGain(); lg.gain.value = 30; lfo.connect(lg); lg.connect(o.frequency);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; f.Q.value = 6;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.08); g.gain.setValueAtTime(0.18, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.3); lfo.stop(t + dur + 0.3);
    this.tone({ f: 2400, f2: 600, dur: 0.4, g: 0.1, type: 'square', lp: 3000 });
  },
  freeze() {
    if (!this.ok('freeze', 0.2)) return;
    for (let i = 0; i < 10; i++) this.tone({ f: rand(1800, 4200), dur: 0.3, g: 0.05, delay: i * 0.03 });
    this.noise({ f: 6000, ft: 'highpass', dur: 0.6, g: 0.2, a: 0.1 });
  },
  acid() {
    if (!this.ok('acid', 0.2)) return;
    this.noise({ f: 2500, ft: 'bandpass', q: 0.6, dur: 1.4, g: 0.18, a: 0.1 });
    for (let i = 0; i < 8; i++) this.tone({ f: rand(300, 900), f2: rand(900, 1600), dur: 0.05, g: 0.05, delay: rand(0, 1.2) });
  },
  drill(dur) {
    if (!this.ok('drill', 0.3)) return;
    const c = this.ctx; const t = c.currentTime;
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 75;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 1;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14, t + 0.05); g.gain.setValueAtTime(0.14, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    o.connect(f); f.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.2);
    this.noise({ f: 2500, ft: 'bandpass', q: 1, dur, g: 0.15, a: 0.05 });
  },
  hole(dur) {
    if (!this.ok('hole', 0.3)) return;
    this.tone({ f: 60, f2: 30, dur, g: 0.4, type: 'sine', a: 0.3 });
    this.tone({ f: 400, f2: 60, dur, g: 0.08, type: 'sawtooth', lp: 900, a: 0.2 });
  },
  fanfare() {
    if (!this.ctx || !this.sound) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      this.tone({ f, dur: 0.25, g: 0.12, type: 'square', lp: 2500, delay: i * 0.09 });
      this.tone({ f: f / 2, dur: 0.3, g: 0.08, type: 'triangle', delay: i * 0.09 });
    });
    this.tone({ f: 1047, dur: 0.9, g: 0.1, type: 'triangle', delay: 0.4 });
    this.tone({ f: 1319, dur: 0.9, g: 0.08, type: 'triangle', delay: 0.4 });
  },
  unlock() {
    if (!this.ctx || !this.sound) return;
    [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone({ f, dur: 0.4, g: 0.08, type: 'triangle', delay: i * 0.06 }));
  },
  buy() {
    if (!this.ok('buy', 0.05)) return;
    this.tone({ f: 660, dur: 0.07, g: 0.1, type: 'square', lp: 3000 });
    this.tone({ f: 990, dur: 0.15, g: 0.1, type: 'square', lp: 3000, delay: 0.06 });
    this.noise({ f: 5000, ft: 'highpass', dur: 0.08, g: 0.1, delay: 0.06 });
  },
};

/* ===== Generative background music: soft plucks per world ===== */
const Music = {
  timer: 0, step: 0, next: 0, world: 0,
  // chord roots (semitones from A2) and modes per world
  prog: [
    [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]], // village: major, bright
    [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], // city: minor lofi
    [[0, 1, 4, 7], [0, 1, 5, 8], [-2, 1, 5, 8], [0, 1, 4, 7]], // desert: phrygian dominant
    [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], // ice: maj7 glassy
    [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [-5, -1, 2, 5]], // space: dreamy minor
  ],
  start() {
    if (this.timer) return;
    this.next = Audio2.ctx.currentTime + 0.2;
    this.timer = setInterval(() => this.tick(), 120);
  },
  tick() {
    const A = Audio2; const c = A.ctx;
    if (!c || !A.music || A.ducked || A.hidden) { if (c) this.next = c.currentTime + 0.1; return; }
    const spb = 0.3; // 8th note
    while (this.next < c.currentTime + 0.4) {
      const prog = this.prog[this.world % this.prog.length];
      const bar = Math.floor(this.step / 8) % prog.length;
      const chord = prog[bar];
      const s = this.step % 8;
      const base = 110;
      const fr = (st) => base * Math.pow(2, st / 12);
      const t = this.next - c.currentTime;
      if (s === 0) this.voice(fr(chord[0] - 12), 2.2, 0.22, 'triangle', t, 600);
      if (s === 4) this.voice(fr(chord[0] - 12 + 7), 1.0, 0.12, 'triangle', t, 600);
      const pattern = [0, 2, 1, 2, 0, 2, 1, 3];
      const idx = pattern[s] % chord.length;
      if (Math.random() < 0.85) this.voice(fr(chord[idx] + 12), 0.45, 0.09, 'triangle', t, 2400);
      if (s === 0 && Math.random() < 0.5) this.voice(fr(chord[(bar + 1) % chord.length] + 24), 1.2, 0.04, 'sine', t + spb * 2, 3000);
      this.step++;
      this.next += spb;
    }
  },
  voice(f, dur, g, type, delay, lp) {
    Audio2.tone({ f, dur, g, type, delay: Math.max(0, delay), lp, out: Audio2.mus, a: 0.01 });
  },
};
