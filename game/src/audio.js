// audio.js — all sound is synthesized with WebAudio. No audio files, no network.
// A tiny folk loop (plucked melody over a walking bass) plus one-shot effects:
// gobble, jump, coin, hit, spotted alarm, escape fanfare and the caught sting.

const MELODY = [
  // [midi note, beats] — a jaunty autumn jig in A minor
  [69, 0.5], [72, 0.5], [76, 0.5], [72, 0.5],
  [74, 0.5], [71, 0.5], [69, 1.0], [0, 0.5],
  [69, 0.5], [72, 0.5], [76, 0.5], [79, 0.5],
  [76, 0.5], [74, 0.5], [72, 1.0], [0, 0.5],
  [74, 0.5], [74, 0.5], [72, 0.5], [71, 0.5],
  [72, 0.5], [74, 0.5], [76, 0.5], [74, 0.5],
  [72, 1.5], [0, 0.5], [67, 0.5], [69, 0.5],
];
const BASS = [45, 0, 45, 0, 52, 0, 45, 0, 43, 0, 45, 0, 52, 0, 55, 0];

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.beatSeconds = 0.21;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.context = new Ctx();
      this.master = this.context.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.context.destination);
    } catch (err) {
      this.context = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, when = 0, lowpass = 1200) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const len = Math.max(1, Math.floor(this.context.sampleRate * dur));
    const buffer = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.context.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  gobble() {
    // The turkey's signature: three descending clucks.
    [0, 0.09, 0.18].forEach((delay, i) => {
      this.tone(340 - i * 40, 0.09, 'square', 0.16, delay, 180 - i * 20);
    });
  }

  jump() {
    this.tone(280, 0.16, 'sine', 0.2, 0, 620);
  }

  dash() {
    this.noise(0.18, 0.12, 0, 2600);
  }

  corn() {
    this.tone(880, 0.08, 'triangle', 0.18);
    this.tone(1318, 0.12, 'triangle', 0.14, 0.07);
  }

  hit() {
    this.noise(0.22, 0.3, 0, 700);
    this.tone(140, 0.25, 'sawtooth', 0.22, 0, 60);
  }

  spotted() {
    // Two-note alarm: the farmer has seen you.
    this.tone(392, 0.14, 'square', 0.16);
    this.tone(311, 0.22, 'square', 0.16, 0.14);
  }

  hideSafe() {
    this.tone(523, 0.1, 'sine', 0.12);
    this.tone(659, 0.14, 'sine', 0.1, 0.09);
  }

  stageClear() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.18, i * 0.1));
  }

  escapedFanfare() {
    [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) =>
      this.tone(f, 0.24, 'triangle', 0.2, i * 0.13),
    );
    this.gobble();
  }

  caughtSting() {
    [392, 370, 349, 311].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.14, i * 0.16));
    this.noise(0.4, 0.2, 0.5, 500);
  }

  startMusic() {
    if (!this.context || this.musicTimer) return;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => this.playMusicStep(), this.beatSeconds * 1000);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playMusicStep() {
    if (!this.context || this.muted) {
      this.musicStep++;
      return;
    }
    const step = this.musicStep;
    const [note, beats] = MELODY[step % MELODY.length];
    if (note > 0) this.tone(midiToFreq(note), this.beatSeconds * beats * 0.95, 'triangle', 0.07);
    const bassNote = BASS[step % BASS.length];
    if (bassNote > 0 && step % 2 === 0) {
      this.tone(midiToFreq(bassNote), this.beatSeconds * 1.8, 'sine', 0.1);
    }
    this.musicStep++;
  }
}
