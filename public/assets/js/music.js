/**
 * Musik latar.
 * ---------------------------------------------------------------------------
 * Bila `CONFIG.musik.berkas` diisi, berkas audio itu yang diputar (loop).
 * Bila kosong, undangan membangkitkan instrumental bernuansa Islami langsung
 * di peramban memakai Web Audio API: drone lembut, gema (reverb) buatan, dan
 * melodi petikan pada maqam Hijaz. Tidak ada berkas, tidak ada royalti, dan
 * hemat kuota — cocok untuk Cloudflare Workers/Pages.
 */

const NOTE = {
  D2: 73.42, F2: 87.31, G2: 98.0, A2: 110.0, Bb2: 116.54, C3: 130.81, D3: 146.83,
  F3: 174.61, G3: 196.0, A3: 220.0, Bb3: 233.08, C4: 261.63, D4: 293.66,
  Eb4: 311.13, Fs4: 369.99, G4: 392.0, A4: 440.0, Bb4: 466.16, C5: 523.25,
  D5: 587.33, Eb5: 622.25, Fs5: 739.99, G5: 783.99, A5: 880.0,
};

/* Motif melodi (maqam Hijaz D) — pasangan [nada, panjang dalam ketukan]. */
const MOTIF = [
  ["D4", 2], ["A4", 1], ["Bb4", 1], ["C5", 2.5],
  ["Bb4", 1], ["A4", 1], ["G4", 2], ["Fs4", 2],
  ["G4", 1], ["A4", 1], ["Bb4", 1], ["A4", 3],
  ["D5", 2], ["C5", 1], ["Bb4", 1], ["A4", 4],
  ["G4", 1.5], ["Fs4", 1.5], ["Eb4", 2], ["D4", 4],
];

/* Drone tiga lapis yang berganti tiap 16 ketukan. */
const PADS = [
  ["D2", "A2", "D3"],
  ["Bb2", "F3", "Bb3"],
  ["C3", "G3", "C4"],
  ["D2", "A2", "D3"],
];

const BEAT = 1.15; // ≈ 52 BPM, tenang

export class Music {
  constructor(config = {}) {
    this.config = config;
    this.master = null;
    this.ctx = null;
    this.playing = false;
    this.starting = false;
    this.timer = null;
    this.el = null;
    this.startAt = 0;
    this.step = 0;
    this.padIndex = 0;
    this.nextPad = 0;
    this.baseVolume = typeof config.volume === "number" ? config.volume : 0.5;
    this.onChange = null;
  }

  get tersedia() {
    return Boolean(this.config.aktif !== false);
  }

  #notify() {
    if (typeof this.onChange === "function") this.onChange(this.playing);
  }

  /** Harus dipanggil dari gestur pengguna (klik) agar diizinkan peramban. */
  async start() {
    if (!this.tersedia || this.playing || this.starting) return this.playing;
    this.starting = true;
    try {
      return await this.#start();
    } finally {
      this.starting = false;
    }
  }

  async #start() {

    if (this.config.berkas) {
      return this.#startFile();
    }
    return this.#startSynth();
  }

  async #startFile() {
    if (!this.el) {
      this.el = new Audio(this.config.berkas);
      this.el.loop = true;
      this.el.preload = "auto";
      this.el.crossOrigin = "anonymous";
    }
    try {
      this.el.volume = this.baseVolume;
      await this.el.play();
      this.playing = true;
      this.#notify();
    } catch (err) {
      console.warn("Musik berkas gagal diputar:", err);
      this.playing = false;
      this.#notify();
    }
    return this.playing;
  }

  async #startSynth() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;

    if (!this.ctx) {
      this.ctx = new Ctx();
      this.#buildGraph();
    }
    try {
      await this.ctx.resume();
    } catch { /* diabaikan */ }

    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.master.gain.exponentialRampToValueAtTime(this.baseVolume, this.ctx.currentTime + 3.5);

    this.playing = true;
    this.startAt = this.ctx.currentTime + 0.15;
    this.step = 0;
    this.padIndex = 0;
    this.nextPad = this.startAt;
    this.#loop();
    this.#notify();
    return true;
  }

  #buildGraph() {
    const ctx = this.ctx;

    // Reverb buatan: derau yang meluruh.
    const len = Math.floor(ctx.sampleRate * 3.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.8) * (0.6 + 0.4 * Math.sin(i * 0.0021));
      }
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = ir;

    this.wet = ctx.createGain();
    this.wet.gain.value = 0.5;

    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;

    // Pemotong frekuensi tinggi agar terdengar hangat dan tidak menusuk.
    this.tone = ctx.createBiquadFilter();
    this.tone.type = "lowpass";
    this.tone.frequency.value = 3200;
    this.tone.Q.value = 0.4;

    const dry = ctx.createGain();
    dry.gain.value = 0.75;

    this.bus = ctx.createGain();
    this.bus.gain.value = 0.9;

    this.bus.connect(this.tone);
    this.tone.connect(dry);
    this.tone.connect(this.reverb);
    this.reverb.connect(this.wet);
    this.wet.connect(this.master);
    dry.connect(this.master);
    this.master.connect(ctx.destination);
  }

  /* --------------------------------- Pad ---------------------------------- */
  #playPad(notes, at, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.075, at + 2.2);
    g.gain.setValueAtTime(0.075, at + dur - 2.0);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    g.connect(this.bus);

    notes.forEach((name, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = NOTE[name] ?? 220;
      osc.detune.value = (i - 1) * 4.5;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 520 + i * 180;

      osc.connect(lp);
      lp.connect(g);

      // Getar halus agar terasa hidup seperti rebab/ney.
      if (i > 0) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.13 + i * 0.04;
        lfoGain.gain.value = 2.2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);
        lfo.start(at);
        lfo.stop(at + dur + 0.2);
      }

      osc.start(at);
      osc.stop(at + dur + 0.1);
    });
  }

  /* -------------------------------- Petikan -------------------------------- */
  #pluck(freq, at, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const peak = 0.13;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    g.connect(this.bus);

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, at);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2.005, at);
    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    osc2.connect(g2);
    g2.connect(g);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3600, at);
    lp.frequency.exponentialRampToValueAtTime(900, at + dur * 0.85);

    osc.connect(lp);
    lp.connect(g);
    osc.start(at);
    osc2.start(at);
    osc.stop(at + dur + 0.05);
    osc2.stop(at + dur + 0.05);
  }

  /* ------------------------------- Penjadwal ------------------------------- */
  #loop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.#schedule(), 240);
    this.#schedule();
  }

  #schedule() {
    if (!this.ctx || !this.playing) return;
    const ctx = this.ctx;
    const lookahead = ctx.currentTime + 1.2;

    while (this.startAt < lookahead) {
      // Drone
      if (this.startAt >= this.nextPad) {
        const pad = PADS[this.padIndex % PADS.length];
        this.#playPad(pad, this.startAt, BEAT * 16 + 2.5);
        this.nextPad = this.startAt + BEAT * 16;
        this.padIndex++;
      }

      // Melodi
      const [name, beats] = MOTIF[this.step % MOTIF.length];
      const dur = Math.max(0.42, beats * BEAT * 0.82);
      this.#pluck(NOTE[name] ?? 330, this.startAt, dur);
      // Nada kelima tipis di bawah melodi (mirip qanun).
      if (beats >= 2) {
        this.#pluck((NOTE[name] ?? 330) * 0.75, this.startAt + 0.02, dur * 0.7);
      }

      this.startAt += beats * BEAT;
      this.step++;

      // Jeda napas setiap 20 nada.
      if (this.step % MOTIF.length === 0) this.startAt += BEAT * 2;
    }
  }

  /* --------------------------------- Kontrol ------------------------------- */
  async toggle() {
    if (this.playing) return this.pause();
    return this.start();
  }

  pause() {
    if (!this.playing) return false;
    if (this.el) this.el.pause();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), now);
      this.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      clearInterval(this.timer);
      this.timer = null;
      setTimeout(() => {
        if (!this.playing && this.ctx && this.ctx.state === "running") this.ctx.suspend().catch(() => {});
      }, 700);
    }
    this.playing = false;
    this.#notify();
    return false;
  }

  async resumeIfPaused() {
    if (this.playing || this.el) return;
    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume().catch(() => {});
      this.playing = true;
      this.startAt = this.ctx.currentTime + 0.2;
      this.nextPad = this.startAt;
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.master.gain.exponentialRampToValueAtTime(this.baseVolume, this.ctx.currentTime + 1.5);
      this.#loop();
      this.#notify();
    }
  }

  setVolume(v) {
    this.baseVolume = Math.max(0, Math.min(1, v));
    if (this.el) this.el.volume = this.baseVolume;
    if (this.ctx && this.playing) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(this.baseVolume, this.ctx.currentTime, 0.4);
    }
  }
}

export default Music;
