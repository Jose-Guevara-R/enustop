// Web Audio API synthesizer for NumSTOP! board game sounds.
// All sounds are generated in code — no external audio files needed.

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('numstop_sound_muted');
      if (saved !== null) this.isMuted = JSON.parse(saved);
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try { localStorage.setItem('numstop_sound_muted', JSON.stringify(this.isMuted)); } catch {}
    return this.isMuted;
  }

  public getMuted(): boolean { return this.isMuted; }

  // MEJORA: Campana de recepción mecánica "¡STOP!" (2048 Hz, resonante)
  public playDeskBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    [[2048, 0.7, 1.6], [4186, 0.4, 1.1], [5874, 0.2, 0.8]].forEach(([freq, gain, dur]) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = freq > 5000 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(this.ctx!.destination);
      osc.start(t); osc.stop(t + dur);
    });
  }

  // Clic de sello al marcar casilla
  public playStampClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.08);
  }

  // Tap al elegir en Yan Ken Po
  public playRpsPick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.09);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.09);
  }

  // Fanfarria de victoria Yan Ken Po
  public playWinDuel() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(g); g.connect(this.ctx!.destination);
      osc.start(t); osc.stop(t + 0.3);
    });
  }

  // Empate
  public playTie() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.25);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.25);
  }

  // Fin de partida
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(g); g.connect(this.ctx!.destination);
      osc.start(t); osc.stop(t + 0.5);
    });
  }

  // MEJORA: sonido de penalización (clic erróneo)
  public playPenalty() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.18);
  }

  // MEJORA: sonido de alerta de reconexión
  public playReconnect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    [330, 440].forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(g); g.connect(this.ctx!.destination);
      osc.start(t); osc.stop(t + 0.2);
    });
  }
}

export const soundManager = new SoundManager();
