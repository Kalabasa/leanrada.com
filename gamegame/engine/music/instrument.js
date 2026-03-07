let audioCtx = null;

export function initInstruments() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();
}

export function nowMs() { return audioCtx ? audioCtx.currentTime * 1000 : 0; }

/**
 * @typedef {'square'|'triangle'|'noise'} InstrumentType
 *
 * @typedef {Object} Instrument
 * @property {(tS: number, durS: number, note: number, gain: number) => void} play
 */

/**
 * @param {{ type: InstrumentType, timbre?: number, sustain?: number }} options
 * @returns {Instrument}
 */
export function createInstrument({ type, timbre = 0, sustain = 0.5 }) {
  let buffer = null;
  return {
    play(tS, durS, note, gain) {
      if (!audioCtx) return;
      buffer ??= createWaveBuffer(type, timbre, audioCtx.sampleRate, audioCtx.createBuffer.bind(audioCtx));
      const noteFreq = 440 * Math.pow(2, (note - 69) / 12);
      const refFreq = audioCtx.sampleRate / buffer.length;
      playWave(sustain, tS, durS, noteFreq, refFreq, buffer, gain);
    }
  };
}

export function createWaveBuffer(type, timbre, sampleRate, createBuffer) {
  const refPeriodSamples = type === 'noise' ? 8192 : 1024;
  // noise: exponential curve so timbre=0 -> full buffer (white), timbre=1 -> 1 sample (tonal)
  const loopSamples = type === 'noise'
    ? Math.max(2, Math.round(refPeriodSamples * Math.pow(1 - timbre, 1.5)))
    : Math.max(2, Math.round(refPeriodSamples * (1 - timbre * 0.5)));
  const buffer = createBuffer(1, loopSamples, sampleRate);
  fillWave(type, buffer.getChannelData(0), loopSamples, refPeriodSamples);
  return buffer;
}

function playWave(sustain, tS, durS, noteFreq, refFreq, buffer, gain) {
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.playbackRate.value = noteFreq / refFreq;

  const gainNode = audioCtx.createGain();
  // sustain=0: instant falloff, sustain=1: full gain until end
  const decayEnd = tS + durS;
  const decayStart = tS + durS * sustain;
  gainNode.gain.setValueAtTime(gain, tS);
  if (decayStart < decayEnd) {
    gainNode.gain.setValueAtTime(gain, decayStart);
    gainNode.gain.exponentialRampToValueAtTime(0.001, decayEnd);
  } else {
    gainNode.gain.exponentialRampToValueAtTime(0.001, decayEnd);
  }

  src.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  src.start(tS);
  src.stop(decayEnd + 0.01);
}

function fillWave(type, data, loopSamples, periodSamples) {
  console.assert(loopSamples >= 2, 'loopSamples must be at least 2');
  console.assert(loopSamples <= periodSamples, 'loopSamples must not exceed periodSamples');
  console.assert(data.length === loopSamples, 'data.length must equal loopSamples');
  if (type === 'square') {
    // timbre=0 (loopSamples=periodSamples): 50% duty classic square
    // timbre=1 (loopSamples=periodSamples/2): 100% duty -> silence
    const halfPeriod = periodSamples / 2;
    for (let i = 0; i < loopSamples; i++) {
      data[i] = i < halfPeriod ? 1 : -1;
    }
  } else if (type === 'triangle') {
    // timbre=0: pure triangle, timbre=1: sawtooth
    for (let i = 0; i < loopSamples; i++) {
      const t = i / periodSamples;
      // triangle: up then down over full period; sawtooth: linear up over half period
      // at timbre=0 loopSamples=periodSamples, at timbre=1 loopSamples=periodSamples/2
      // a half-period triangle is a sawtooth (rises linearly, then loops)
      data[i] = t < 0.5 ? t * 4 - 1 : (1 - t) * 4 - 1;
    }
  } else if (type === 'noise') {
    // short looping noise buffer — higher timbre = shorter loop = brighter metallic texture
    for (let i = 0; i < loopSamples; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
}
