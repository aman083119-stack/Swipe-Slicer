export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazy initialize when first audio is requested
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(mute: boolean): boolean {
    this.muted = mute;
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playSwoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playSlice(combo: number = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    const pitchMultiplier = 1 + (Math.max(1, combo) - 1) * 0.12;
    const baseFreq = 800 * pitchMultiplier;
    const endFreq = Math.min(6000, 3000 * pitchMultiplier);

    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playCombo(mult: number) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    // Ascending harmonic frequencies based on combo multiplier index
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    let note = scale[Math.min(mult, scale.length - 1)];
    if (mult >= scale.length) note *= 1.5;

    osc.frequency.setValueAtTime(note, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(note * 1.2, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  public playBomb() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Low rumble base
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  public playAchievement() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      const noteStart = startTime + idx * 0.08;
      const noteEnd = noteStart + 0.22;

      gain.gain.setValueAtTime(0.12, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

      osc.start(noteStart);
      osc.stop(noteEnd);
    });
  }
}

export const sound = new SoundEngine();
