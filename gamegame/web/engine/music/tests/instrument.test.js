import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWaveBuffer } from '../instrument.js';

test('square timbre=0: classic 50% duty, first half +1, second half -1', () => {
  const data = wave('square', 0);
  assert.equal(data[0], 1);
  assert.equal(data[511], 1);
  assert.equal(data[512], -1);
  assert.equal(data[1023], -1);
});

test('square timbre=1: all +1 (high portion only)', () => {
  const data = wave('square', 1);
  for (let i = 0; i < data.length; i++) assert.equal(data[i], 1);
});

test('square timbre=0.5: first half +1 rest -1', () => {
  const data = wave('square', 0.5);
  // loopSamples = round(1024 * 0.75) = 768; halfPeriod = 512
  assert.equal(data[0], 1);
  assert.equal(data[511], 1);
  assert.equal(data[512], -1);
  assert.equal(data[data.length - 1], -1);
});

test('triangle timbre=0: pure triangle, peaks at center', () => {
  const data = wave('triangle', 0);
  assert.ok(Math.abs(data[0] - -1) < 0.05);
  assert.ok(Math.abs(data[512] - 1) < 0.05);
  assert.ok(Math.abs(data[1023] - -1) < 0.1);
  for (let i = 1; i < 512; i++) assert.ok(data[i] > data[i - 1]);
  for (let i = 513; i < 1024; i++) assert.ok(data[i] < data[i - 1]);
});

test('triangle timbre=1: sawtooth, monotonically rising', () => {
  const data = wave('triangle', 1);
  assert.ok(Math.abs(data[0] - -1) < 0.05);
  assert.ok(data[data.length - 1] > 0.9);
  for (let i = 1; i < data.length; i++) assert.ok(data[i] > data[i - 1]);
});

test('noise: all values in [-1, 1]', () => {
  const data = wave('noise', 0);
  for (let i = 0; i < data.length; i++) {
    assert.ok(data[i] >= -1 && data[i] <= 1);
  }
});

test('createWaveBuffer: minimum 2 samples for all types at timbre=1', () => {
  for (const type of ['square', 'triangle', 'noise']) {
    const data = wave(type, 1);
    assert.ok(data.length >= 2, `${type} timbre=1 buffer should have at least 2 samples`);
  }
});

for (const timbre of [0, 0.25, 0.5, 0.75]) {
  for (const note of [48, 60, 72]) { // C3, C4, C5
    test(`square timbre=${timbre} note=${note}: fundamental is dominant`, () => {
      assertFundamental('square', timbre, note);
    });
    test(`triangle timbre=${timbre} note=${note}: fundamental is dominant`, () => {
      assertFundamental('triangle', timbre, note);
    });
  }
}

// noise at high timbre becomes tonal (short looping buffer acts like a pitched wave)
for (const note of [48, 60, 72]) {
  test(`noise timbre=0.95 note=${note}: fundamental is dominant`, () => {
    assertFundamental('noise', 0.95, note);
  });
}

// noise at timbre=0 is white noise — energy is spread evenly, no frequency dominates
test('noise timbre=0: energy is spectrally uniform', () => {
  const data = wave('noise', 0);
  const mags = sampleMagnitudes(data, 200, 4000, 20);
  const sorted = [...mags].sort((a, b) => a - b);
  const p90 = sorted[Math.floor(mags.length * 0.9)];
  const mean = mags.reduce((a, b) => a + b) / mags.length;
  assert.ok(p90 < mean * 3, `noise timbre=0 should be spectrally flat (p90/mean=${(p90/mean).toFixed(2)})`);
});

function assertFundamental(type, timbre, note) {
  const sampleRate = 44100;
  const loop = wave(type, timbre);
  const freq = 440 * Math.pow(2, (note - 69) / 12);
  const refFreq = sampleRate / loop.length;
  const playbackRate = freq / refFreq;

  // render 16 cycles at the correct playback rate
  const outSamples = Math.round(loop.length / playbackRate) * 16;
  const out = new Float32Array(outSamples);
  for (let i = 0; i < outSamples; i++) out[i] = loop[Math.floor((i * playbackRate) % loop.length)];

  const neighborMult = Math.pow(2, 1 / 12); // 1 semitone
  const [lowerMag, fundamentalMag, higherMag] = sampleMagnitudes(out, freq / neighborMult, freq * neighborMult, 3, sampleRate);

  assert.ok(
    fundamentalMag > lowerMag && fundamentalMag > higherMag,
    `${type} timbre=${timbre} note=${note}: fundamental ${freq.toFixed(1)}Hz should be strongest (got fund=${fundamentalMag.toFixed(1)}, lower=${lowerMag.toFixed(1)}, higher=${higherMag.toFixed(1)})`
  );
}

function wave(type, timbre) {
  const buffer = createWaveBuffer(type, timbre, 44100, mockCreateBuffer);
  return buffer.getChannelData(0);
}

// Samples N magnitudes exponentially spaced between freqMin and freqMax
function sampleMagnitudes(data, freqMin, freqMax, n, sampleRate = 44100) {
  return Array.from({ length: n }, (_, i) => {
    const freq = freqMin * Math.pow(freqMax / freqMin, i / (n - 1));
    return goertzel(data, freq, sampleRate);
  });
}

// FFT via Goertzel — computes magnitude at a single frequency bin
function goertzel(data, targetFreq, sampleRate) {
  const N = data.length;
  const k = targetFreq * N / sampleRate;
  const omega = 2 * Math.PI * k / N;
  const coeff = 2 * Math.cos(omega);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < N; i++) {
    const s = data[i] + coeff * s1 - s2;
    s2 = s1; s1 = s;
  }
  return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2);
}

function mockCreateBuffer(_ch, len, sampleRate) {
  const data = new Float32Array(len);
  return { length: len, sampleRate, getChannelData: () => data };
}
