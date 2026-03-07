import { getAudioCtx } from './audio.js';

/**
 * @typedef {'square'|'triangle'|'noise'} InstrumentType
 *
 * @typedef {Object} Instrument
 * @property {(tS: number, durS: number, note: number, volume: number) => void} play
 */

/**
 * @param {{ type: InstrumentType, timbre?: number, sustain?: number }} options
 * @returns {Instrument}
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

function playWave(sustain, tS, durS, noteFreq, refFreq, buffer, gain) {
  const src = getAudioCtx().createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.playbackRate.value = noteFreq / refFreq;

  const gainNode = getAudioCtx().createGain();
  // sustain=0: instant falloff, sustain=1: full gain until end
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
* @param {AudioContext['createBuffer']} createBuffer
*/
export function createWaveBuffer(type, timbre, sampleRate, createBuffer) {
  const period = type === 'noise' ? 8192 : 1024;
  let fraction;
  switch (type) {
    case 'square':
      fraction = 1 - timbre * 0.475;
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
  const samples =  Math.max(2, Math.round(period * fraction));
  const buffer = createBuffer(1, samples, sampleRate);
  fillWave(type, buffer.getChannelData(0), period);
  return buffer;
}

/**
 * Fills a buffer with a partial or full period of a waveform.
 *
 * The `data` array acts as a looping waveform. The synthesizer repeats it every `period`
 * samples. data.length and sampleRate defines the frequency of the sound.
 *
 * @param {'square' | 'triangle' | 'noise'} type - The waveform shape to generate.
 *
 *   - **square** — Classic square wave. At `data.length === period`, produces a 50% duty cycle.
 *     Decreasing `data.length` toward `period / 2` narrows the pulse toward 100% duty.
 *
 *   - **triangle** — Symmetric triangle wave. At `data.length === period`, produces a pure
 *     triangle. Decreasing `data.length` toward `period / 2` morphs toward a sawtooth, since
 *     only the rising half of the waveform fits in the buffer.
 *
 *   - **noise** — Random white noise buffer. Shorter buffers loop more frequently, creating a
 *     metallic, pitched texture.
 *
 * @param {number[]} data - Output buffer to fill. Must satisfy `2 <= data.length <= period`.
 *   Values are written in-place in the range [-1, 1].
 * @param {number} period - The full wavelength in samples, determining the perceived pitch.
 *   Must be >= `data.length`.
 *
 * @example
 * // 50% duty square wave at a 32-sample period
 * const buf = new Array(32);
 * fillWave('square', buf, 32);
 *
 * @example
 * // Sawtooth-like triangle (half-period buffer)
 * const buf = new Array(16);
 * fillWave('triangle', buf, 32);
 */
function fillWave(type, data, period) {
  console.assert(data.length >= 2, 'data.length must be at least 2');
  console.assert(data.length <= period, 'data.length must not exceed period');
  if (type === 'square') {
    // data.length == period: 50% duty classic square
    // data.length == period/2: 100% duty -> silence
    const halfPeriod = period / 2;
    for (let i = 0; i < data.length; i++) {
      data[i] = i < halfPeriod ? 1 : -1;
    }
  } else if (type === 'triangle') {
    // data.length == period: pure triangle
    // data.length == period/2: sawtooth
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
