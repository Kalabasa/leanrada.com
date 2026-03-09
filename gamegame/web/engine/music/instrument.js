import { getAudioCtx } from './audio.js';

/**
 * @param {{ type: 'square'|'triangle'|'noise', timbre?: number, sustain?: number }} options
 * @returns {{ play: (tS: number, durS: number, note: number, volume: number) => void }}
 */
export function createInstrument({ type, timbre = 0, sustain = 0.5 }) {
  let buffer = null;
  let normalizationGain = 0;
  function getBuffer() {
    if (!buffer) {
      buffer = createWaveBuffer(type, timbre, getAudioCtx().sampleRate, getAudioCtx().createBuffer.bind(getAudioCtx()));
      const rms = getRootMeanSquare(buffer);
      normalizationGain = rms > 0 ? 0.5 / rms : 1;
    }
    return buffer;
  }

  return {
    play(tS, durS, note, volume) {
      if (!getAudioCtx()) return;
      const noteFreq = 440 * Math.pow(2, (note - 69) / 12);
      const refFreq = getAudioCtx().sampleRate / getBuffer().length;
      const gain = volume * normalizationGain;
      playWave(sustain, tS, durS, noteFreq, refFreq, getBuffer(), gain);
    }
  };
}

export function createWaveBuffer(type, timbre, sampleRate, createBuffer) {
  const period = type === 'noise' ? 8192 : 1024;
  let fraction;
  switch (type) {
    case 'square':
      fraction = 1 - timbre * 0.5;
      break;
    case 'triangle':
      fraction = 1 - timbre * 0.5;
      break;
    case 'noise':
      fraction = 1 - (timbre ** 0.25) * 0.95;
      break;
    default:
      throw new Error(`unknown type: ${type}`);
  }
  const samples = Math.max(2, Math.round(period * fraction));
  const buffer = createBuffer(1, samples, sampleRate);
  fillWave(type, buffer.getChannelData(0), period);
  return buffer;
}

function playWave(sustain, tS, durS, noteFreq, refFreq, buffer, gain) {
  const src = getAudioCtx().createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.playbackRate.value = noteFreq / refFreq;

  const gainNode = getAudioCtx().createGain();
  const decayEnd = tS + durS;
  const decayStart = tS + durS * sustain;
  gainNode.gain.setValueAtTime(gain, tS);
  gainNode.gain.setValueAtTime(gain, decayStart);
  gainNode.gain.exponentialRampToValueAtTime(0.001, decayEnd);

  src.connect(gainNode);
  gainNode.connect(getAudioCtx().destination);
  src.start(tS);
  src.stop(decayEnd + 0.01);
}

function getRootMeanSquare(buffer) {
  const data = buffer.getChannelData(0);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

/**
 * Fills a buffer with a partial or full period of a waveform.
 *
 * - **square** — At `data.length === period`, 50% duty cycle.
 *   Decreasing toward `period / 2` narrows the pulse toward 100% duty.
 * - **triangle** — At `data.length === period`, pure triangle.
 *   Decreasing toward `period / 2` morphs toward sawtooth.
 * - **noise** — Random white noise. Shorter buffers = metallic, pitched texture.
 *
 * @param {'square' | 'triangle' | 'noise'} type
 * @param {number[]} data - Output buffer (2 <= length <= period), values in [-1, 1].
 * @param {number} period - Full wavelength in samples.
 */
function fillWave(type, data, period) {
  console.assert(data.length >= 2, 'data.length must be at least 2');
  console.assert(data.length <= period, 'data.length must not exceed period');
  if (type === 'square') {
    const halfPeriod = period / 2;
    for (let i = 0; i < data.length; i++) {
      data[i] = i < halfPeriod ? 1 : -1;
    }
  } else if (type === 'triangle') {
    for (let i = 0; i < data.length; i++) {
      const t = i / period;
      data[i] = t < 0.5 ? t * 4 - 1 : (1 - t) * 4 - 1;
    }
  } else if (type === 'noise') {
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
}
