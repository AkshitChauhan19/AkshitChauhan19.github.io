// Soothing generative ambient felt-piano & silk-pad background music engine (Web Audio API)
// Zero external audio files required — warm stereo convolution reverb + meditative Maj9 chords

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private chordTimer: number | null = null;
  private melodyTimer: number | null = null;
  private chordIndex = 0;

  // Warm dreamy Maj9 / Add9 progression (Fmaj9 -> Cmaj9 -> Am9 -> G6)
  private readonly chords: number[][] = [
    [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9 (F3 A3 C4 E4 G4)
    [130.81, 196.0, 246.94, 293.66, 329.63], // Cmaj9 (C3 G3 B3 D4 E4)
    [110.0, 164.81, 220.0, 246.94, 329.63], // Am9   (A2 E3 A3 B3 E4)
    [196.0, 246.94, 293.66, 329.63, 440.0], // G6/9  (G3 B3 D4 E4 A4)
  ];

  // Delicate C-major pentatonic / Lydian upper harp notes
  private readonly melodyNotes: number[] = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.0,  // A5
    987.77, // B5
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createImpulseResponse(ctx: AudioContext, durationSec = 3.2): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2.8);
        const white = Math.random() * 2 - 1;
        // Soft low-passed velvety reverb tail
        lastOut = lastOut * 0.72 + white * 0.28;
        data[i] = lastOut * decay * 0.65;
      }
    }
    return buffer;
  }

  private ensureBus(ctx: AudioContext): { master: GainNode; reverb: ConvolverNode } {
    if (!this.masterGain || !this.reverbNode) {
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);

      const warmthFilter = ctx.createBiquadFilter();
      warmthFilter.type = 'lowpass';
      warmthFilter.frequency.setValueAtTime(1650, ctx.currentTime);
      warmthFilter.Q.setValueAtTime(0.5, ctx.currentTime);

      const reverb = ctx.createConvolver();
      reverb.buffer = this.createImpulseResponse(ctx, 3.4);

      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(0.55, ctx.currentTime);

      const dryGain = ctx.createGain();
      dryGain.gain.setValueAtTime(0.5, ctx.currentTime);

      reverb.connect(wetGain);
      wetGain.connect(warmthFilter);
      dryGain.connect(warmthFilter);
      warmthFilter.connect(master);
      master.connect(ctx.destination);

      this.masterGain = master;
      this.reverbNode = reverb;
    }
    return { master: this.masterGain, reverb: this.reverbNode };
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
    return this.enabled;
  }

  private triggerWarmChord(freqs: number[]) {
    if (!this.enabled || !this.ctx || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = 7.4;

    freqs.forEach((freq, idx) => {
      // Soft dual-detuned sine/triangle silk pad voice
      const osc = ctx.createOscillator();
      const oscDetune = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      const lpf = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      oscDetune.type = 'triangle';
      oscDetune.frequency.setValueAtTime(freq * 1.0025, now);

      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(520 + idx * 90, now);
      lpf.frequency.linearRampToValueAtTime(920, now + 3.0);
      lpf.frequency.linearRampToValueAtTime(420, now + duration);

      // Gentle staggered breathing envelope
      const startOffset = idx * 0.14;
      const peak = idx === 0 ? 0.055 : 0.032;
      voiceGain.gain.setValueAtTime(0.0001, now + startOffset);
      voiceGain.gain.linearRampToValueAtTime(peak, now + startOffset + 2.2);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(lpf);
      oscDetune.connect(lpf);
      lpf.connect(voiceGain);
      voiceGain.connect(this.reverbNode!);

      osc.start(now + startOffset);
      oscDetune.start(now + startOffset);
      osc.stop(now + duration + 0.15);
      oscDetune.stop(now + duration + 0.15);
    });
  }

  private triggerFeltPianoNote() {
    if (!this.enabled || !this.ctx || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = this.melodyNotes[Math.floor(Math.random() * this.melodyNotes.length)];

    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.18, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(380, now + 2.4);

    // Felt-piano pluck decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);

    osc.connect(filter);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);
    filter.connect(gain);
    gain.connect(this.reverbNode);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 3.25);
    overtone.stop(now + 3.25);
  }

  private startAmbientMusic() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const { master } = this.ensureBus(ctx);
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.linearRampToValueAtTime(0.85, now + 1.4);

    this.chordIndex = 0;
    this.triggerWarmChord(this.chords[0]);

    if (this.chordTimer) window.clearInterval(this.chordTimer);
    this.chordTimer = window.setInterval(() => {
      if (!this.enabled) return;
      this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      this.triggerWarmChord(this.chords[this.chordIndex]);
    }, 6200);

    if (this.melodyTimer) window.clearInterval(this.melodyTimer);
    this.melodyTimer = window.setInterval(() => {
      if (!this.enabled) return;
      if (Math.random() > 0.25) {
        this.triggerFeltPianoNote();
      }
    }, 2400);
  }

  private stopAmbientMusic() {
    if (this.chordTimer) {
      window.clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    if (this.melodyTimer) {
      window.clearInterval(this.melodyTimer);
      this.melodyTimer = null;
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.0001), now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    }
  }

  public playHover() {
    if (!this.enabled || !this.ctx || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5 soft harmonic whisper
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.014, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.reverbNode);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playClick() {
    if (!this.enabled || !this.ctx || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5 gentle chime
    osc.frequency.exponentialRampToValueAtTime(392.0, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.024, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.reverbNode);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playTransition() {
    if (!this.enabled || !this.ctx || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [329.63, 493.88].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.0001, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.02, now + i * 0.06 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(gain);
      gain.connect(this.reverbNode!);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.6);
    });
  }
}

export const soundEngine = new SoundEngine();
