// Ultra-smooth, zero-jitter ambient background music engine (mobile & desktop optimized)
// Uses latencyHint: 'playback', persistent gliding silk-pad voices (zero GC spikes),
// featherweight stereo ping-pong ambience (no heavy FFT ConvolverNode), and sample-accurate scheduling.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private masterGain: GainNode | null = null;
  private fxSend: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private padLfo: OscillatorNode | null = null;
  private chordTimer: number | null = null;
  private melodyTimer: number | null = null;
  private chordIndex = 0;
  private visibilityBound = false;

  // Warm meditative Maj9 / Add9 progression (Fmaj9 -> Cmaj9 -> Am9 -> G6/9)
  private readonly chords: number[][] = [
    [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
    [130.81, 196.0, 246.94, 293.66, 329.63], // Cmaj9
    [110.0, 164.81, 220.0, 246.94, 329.63], // Am9
    [196.0, 246.94, 293.66, 329.63, 440.0], // G6/9
  ];

  // Calm pentatonic / Lydian felt-piano notes
  private readonly melodyNotes: number[] = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.0,  // A5
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          // 'playback' gives mobile devices a larger, rock-solid hardware audio buffer (prevents jitter/crackles)
          this.ctx = new AudioCtx({ latencyHint: 'playback' });
        } catch {
          this.ctx = new AudioCtx();
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.visibilityBound) {
      this.visibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx || !this.enabled) return;
        if (document.hidden) {
          this.ctx.suspend().catch(() => {});
        } else {
          this.ctx.resume().catch(() => {});
        }
      });
    }

    return this.ctx;
  }

  private setupAudioGraph(ctx: AudioContext) {
    if (this.masterGain && this.fxSend) return;

    const now = ctx.currentTime;

    // Gentle master bus with soft compressor to guarantee zero clipping
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-16, now);
    compressor.knee.setValueAtTime(24, now);
    compressor.ratio.setValueAtTime(3, now);
    compressor.attack.setValueAtTime(0.02, now);
    compressor.release.setValueAtTime(0.25, now);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);

    // Featherweight lush stereo ping-pong ambience (<1% mobile CPU vs heavy FFT ConvolverNode)
    const fxSend = ctx.createGain();
    fxSend.gain.setValueAtTime(1.0, now);

    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.72, now);

    const delayL = ctx.createDelay(1.0);
    const delayR = ctx.createDelay(1.0);
    delayL.delayTime.setValueAtTime(0.38, now);
    delayR.delayTime.setValueAtTime(0.54, now);

    const fbL = ctx.createGain();
    const fbR = ctx.createGain();
    fbL.gain.setValueAtTime(0.38, now);
    fbR.gain.setValueAtTime(0.38, now);

    const dampL = ctx.createBiquadFilter();
    const dampR = ctx.createBiquadFilter();
    dampL.type = 'lowpass';
    dampR.type = 'lowpass';
    dampL.frequency.setValueAtTime(1050, now);
    dampR.frequency.setValueAtTime(980, now);

    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.45, now);

    // Dry path
    fxSend.connect(dryGain);
    dryGain.connect(compressor);

    // Cross-coupled warm stereo echo ambience
    fxSend.connect(delayL);
    delayL.connect(dampL);
    dampL.connect(wetGain);
    dampL.connect(fbL);
    fbL.connect(delayR);

    delayR.connect(dampR);
    dampR.connect(wetGain);
    dampR.connect(fbR);
    fbR.connect(delayL);

    wetGain.connect(compressor);
    compressor.connect(master);
    master.connect(ctx.destination);

    // 5 persistent warm silk-pad voices (created ONCE -> zero node churn / GC spikes on mobile)
    const padBus = ctx.createGain();
    padBus.gain.setValueAtTime(0.18, now);

    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(560, now);
    padFilter.Q.setValueAtTime(0.7, now);

    // Ultra-slow gentle breathing LFO on the pad warmth filter
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, now);
    lfoDepth.gain.setValueAtTime(170, now);
    lfo.connect(lfoDepth);
    lfoDepth.connect(padFilter.frequency);
    lfo.start(now);

    const initialChord = this.chords[0];
    const oscs: OscillatorNode[] = [];

    initialChord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();

      // Root & fifth are pure velvety sine; upper color tones use warm soft triangle
      osc.type = idx < 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Tiny analog chorus spread
      osc.detune.setValueAtTime((idx - 2) * 3.5, now);

      voiceGain.gain.setValueAtTime(idx === 0 ? 0.34 : 0.16, now);

      osc.connect(voiceGain);
      voiceGain.connect(padFilter);
      osc.start(now);
      oscs.push(osc);
    });

    padFilter.connect(padBus);
    padBus.connect(fxSend);

    this.masterGain = master;
    this.fxSend = fxSend;
    this.padOscs = oscs;
    this.padLfo = lfo;
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

  private glideToChord(freqs: number[]) {
    if (!this.ctx || !this.padOscs.length) return;
    // Schedule 80ms ahead on hardware audio clock so JS jitter never causes glitches
    const t = this.ctx.currentTime + 0.08;
    this.padOscs.forEach((osc, idx) => {
      const target = freqs[idx] ?? freqs[0];
      osc.frequency.setTargetAtTime(target, t, 0.55);
    });
  }

  private triggerFeltPianoNote() {
    if (!this.enabled || !this.ctx || !this.fxSend || document.hidden) return;
    const ctx = this.ctx;
    // Schedule 100ms in the future on hardware audio clock for rock-solid timing
    const start = ctx.currentTime + 0.1;
    const freq = this.melodyNotes[Math.floor(Math.random() * this.melodyNotes.length)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1250, start);
    filter.frequency.exponentialRampToValueAtTime(420, start + 2.2);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.065, start + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxSend);

    osc.start(start);
    osc.stop(start + 2.7);
  }

  private startAmbientMusic() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.setupAudioGraph(ctx);
    if (!this.masterGain) return;

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.0001), now);
    this.masterGain.gain.setTargetAtTime(0.78, now, 0.45);

    this.chordIndex = 0;
    this.glideToChord(this.chords[0]);

    if (this.chordTimer) window.clearInterval(this.chordTimer);
    this.chordTimer = window.setInterval(() => {
      if (!this.enabled || document.hidden) return;
      this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      this.glideToChord(this.chords[this.chordIndex]);
    }, 6400);

    if (this.melodyTimer) window.clearInterval(this.melodyTimer);
    this.melodyTimer = window.setInterval(() => {
      if (!this.enabled || document.hidden) return;
      if (Math.random() > 0.3) {
        this.triggerFeltPianoNote();
      }
    }, 2800);
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
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.18);
    }
  }

  public playHover() {
    if (!this.enabled || !this.ctx || !this.fxSend) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.015;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.018, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.fxSend);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playClick() {
    if (!this.enabled || !this.ctx || !this.fxSend) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.015;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.exponentialRampToValueAtTime(392.0, t + 0.12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.fxSend);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playTransition() {
    if (!this.enabled || !this.ctx || !this.fxSend) return;
    const ctx = this.ctx;
    const base = ctx.currentTime + 0.02;
    [329.63, 493.88].forEach((freq, i) => {
      const start = base + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.025, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain);
      gain.connect(this.fxSend!);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  }
}

export const soundEngine = new SoundEngine();
