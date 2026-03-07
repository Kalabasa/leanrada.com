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

function playNoise(tS, durS, vol, filterType, filterFreq, filterQ = 1) {
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, tS);
  gain.gain.exponentialRampToValueAtTime(0.001, tS + durS);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(getDrumBus());
  src.start(tS);
  src.stop(tS + durS + 0.01);
}

export function createInstrument() {
  return { playEvent };
}

/**
 * @param {import('./composition.js').MusicEvent} e
 * @param {number} tMs - absolute scheduled time (ms)
 * @param {number} durMs - duration (ms), required for tone/noise events
 */
export function playEvent(e, tMs, durMs) {
  if (!audioCtx) return;
  const tS = tMs / 1000;
  const durS = durMs / 1000;

  switch (e.type) {
    case 'kick': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, tS);
      osc.frequency.exponentialRampToValueAtTime(42, tS + 0.07);
      gain.gain.setValueAtTime(0.9, tS);
      gain.gain.exponentialRampToValueAtTime(0.001, tS + 0.18);
      osc.connect(gain); gain.connect(getDrumBus());
      osc.start(tS); osc.stop(tS + 0.2);
      playNoise(tS, 0.008, 0.4, 'bandpass', 3000, 0.8);
      break;
    }
    case 'snare': {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, tS);
      osc.frequency.exponentialRampToValueAtTime(100, tS + 0.05);
      oscGain.gain.setValueAtTime(0.35, tS);
      oscGain.gain.exponentialRampToValueAtTime(0.001, tS + 0.06);
      osc.connect(oscGain); oscGain.connect(getDrumBus());
      osc.start(tS); osc.stop(tS + 0.08);
      playNoise(tS, 0.18, 0.4, 'bandpass', 2500, 0.6);
      playNoise(tS, 0.06, 0.25, 'highpass', 6000, 0.5);
      break;
    }
    case 'ghost':
      playNoise(tS, 0.06, 0.07, 'bandpass', 2500, 0.6);
      break;
    case 'hat':
      playNoise(tS, 0.035, 0.12, 'highpass', 8000, 0.8);
      break;
    case 'open_hat':
      playNoise(tS, 0.18, 0.15, 'highpass', 7000, 0.5);
      break;
    case 'bass': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(e.freq / 4, tS);
      osc.frequency.exponentialRampToValueAtTime(e.freq / 4 * 0.92, tS + 0.06);
      gain.gain.setValueAtTime(0.8, tS);
      gain.gain.exponentialRampToValueAtTime(0.2, tS + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, tS + 0.14);
      osc.connect(gain); gain.connect(getDrumBus());
      osc.start(tS); osc.stop(tS + 0.1);
      break;
    }
    case 'roll_hit': {
      const vol = 0.12 + (e.step / 3) * 0.45;
      playNoise(tS, 0.018, vol * 0.6, 'bandpass', 4000, 1.2);
      playNoise(tS, 0.012, vol * 0.5, 'highpass', 10000, 1.0);
      break;
    }
    case 'tone': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = e.wave || 'sine';
      osc.frequency.setValueAtTime(e.freq, tS);
      gain.gain.setValueAtTime(e.vol ?? 0.12, tS);
      gain.gain.exponentialRampToValueAtTime(0.001, tS + durS);
      osc.connect(gain);
      gain.connect(e.bus === 'drum' ? getDrumBus() : audioCtx.destination);
      gain.connect(getReverb());
      osc.start(tS); osc.stop(tS + durS + 0.01);
      break;
    }
    case 'noise':
      playNoise(tS, durS, e.vol, e.filterType, e.filterFreq, e.filterQ);
      break;
  }
}
