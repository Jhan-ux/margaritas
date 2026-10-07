/**
 * Interactive Web Audio Synthesizer for Daisy 3D Experience.
 * Runs 100% in the browser with zero external audio assets, works seamlessly on Vercel.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private isWindPlaying: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.windGain && this.ctx) {
      this.windGain.gain.setValueAtTime(muted ? 0 : 0.04, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Delicate acoustic chime / harp note when plucking a petal
   */
  public playPetalPluck(pitchFactor = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale notes for pleasant harmony
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = baseFreqs[Math.floor(Math.random() * baseFreqs.length)] * pitchFactor;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    // Subtle vibrato
    osc.frequency.exponentialRampToValueAtTime(freq * 0.99, t + 0.6);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

    // Harmonic sparkle
    const sparkle = this.ctx.createOscillator();
    const sparkleGain = this.ctx.createGain();
    sparkle.type = 'triangle';
    sparkle.frequency.setValueAtTime(freq * 2.01, t);
    sparkleGain.gain.setValueAtTime(0.05, t);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    sparkle.connect(sparkleGain);
    sparkleGain.connect(this.ctx.destination);
    sparkle.start(t);
    sparkle.stop(t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  /**
   * Blooming shimmer sound
   */
  public playBloom() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chord = [392.0, 523.25, 659.25, 783.99, 1046.5];

    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.8, t + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq, t + idx * 0.08 + 0.4);

      gain.gain.setValueAtTime(0.0001, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.08 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 1.25);
    });
  }

  /**
   * Celebratory triumphal chime when daisy prediction is complete
   */
  public playCelebration() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.001, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 1.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 1.6);
    });
  }

  /**
   * Ambient gentle wind rustling synthesizer
   */
  public startAmbientWind() {
    if (this.isWindPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Pinkish/Brown noise approximation for realistic wind
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
      this.windFilter = filter;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, this.ctx.currentTime);
      this.windGain = gain;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      this.isWindPlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public updateWindIntensity(speedFactor: number) {
    if (!this.windFilter || !this.ctx || !this.windGain) return;
    const targetFreq = 250 + speedFactor * 350;
    const targetGain = this.isMuted ? 0 : 0.02 + speedFactor * 0.035;
    this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);
    this.windGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
  }
}

export const sound = new SoundManager();
