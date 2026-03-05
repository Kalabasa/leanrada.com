let audioCtx = null;
let drumBus = null;
let noiseBuffer = null;
let reverbNode = null;

export function initInstruments() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();
}
export function now() { return audioCtx ? audioCtx.currentTime * 1000 : 0; }

function getReverb() {
  if (!reverbNode) {
    reverbNode = audioCtx.createConvolver();
    const len = audioCtx.sampleRate * 0.2;
    const ir = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    reverbNode.buffer = ir;
    const wet = audioCtx.createGain();
    wet.gain.value = 0.2;
    reverbNode.connect(wet);
    wet.connect(audioCtx.destination);
  }
  return reverbNode;
}

function getDrumBus() {
  if (!drumBus) {
    drumBus = audioCtx.createGain();
    drumBus.connect(audioCtx.destination);
    drumBus.connect(getReverb());
  }
  return drumBus;
}

function getNoiseBuffer() {
  if (!noiseBuffer) {
    const len = audioCtx.sampleRate;
    noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function playNoise(t, dur, vol, filterType, filterFreq, filterQ = 1) {
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(getDrumBus());
  src.start(t);
  src.stop(t + dur + 0.01);
}

export function createInstrument() {
  return { playEvent };
}

/** @param {import('./composition.js').MusicEvent & {t: number, dur?: number}} e */
export function playEvent(e) {
  if (!audioCtx) return;
  const t = e.t / 1000;
  e = { ...e, t, ...(e.dur !== undefined ? { dur: e.dur / 1000 } : {}) };

  switch (e.type) {
    case 'kick': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.07);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain); gain.connect(getDrumBus());
      osc.start(t); osc.stop(t + 0.2);
      playNoise(t, 0.008, 0.4, 'bandpass', 3000, 0.8);
      break;
    }
    case 'snare': {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
      oscGain.gain.setValueAtTime(0.35, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(oscGain); oscGain.connect(getDrumBus());
      osc.start(t); osc.stop(t + 0.08);
      playNoise(t, 0.18, 0.4, 'bandpass', 2500, 0.6);
      playNoise(t, 0.06, 0.25, 'highpass', 6000, 0.5);
      break;
    }
    case 'ghost':
      playNoise(t, 0.06, 0.07, 'bandpass', 2500, 0.6);
      break;
    case 'hat':
      playNoise(t, 0.035, 0.12, 'highpass', 8000, 0.8);
      break;
    case 'open_hat':
      playNoise(t, 0.18, 0.15, 'highpass', 7000, 0.5);
      break;
    case 'bass': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(e.freq / 2, t);
      osc.frequency.exponentialRampToValueAtTime(e.freq / 2 * 0.92, t + 0.06);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
      osc.connect(gain); gain.connect(getDrumBus());
      osc.start(t); osc.stop(t + 0.1);
      break;
    }
    case 'roll_hit': {
      const vol = 0.12 + (e.step / 3) * 0.45;
      playNoise(t, 0.018, vol * 0.6, 'bandpass', 4000, 1.2);
      playNoise(t, 0.012, vol * 0.5, 'highpass', 10000, 1.0);
      break;
    }
    case 'tone': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = e.wave || 'sine';
      osc.frequency.setValueAtTime(e.freq, t);
      gain.gain.setValueAtTime(e.vol ?? 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + e.dur);
      osc.connect(gain);
      gain.connect(e.bus === 'drum' ? getDrumBus() : audioCtx.destination);
      gain.connect(getReverb());
      osc.start(t); osc.stop(t + e.dur + 0.01);
      break;
    }
    case 'noise':
      playNoise(t, e.dur, e.vol, e.filterType, e.filterFreq, e.filterQ);
      break;
  }
}
