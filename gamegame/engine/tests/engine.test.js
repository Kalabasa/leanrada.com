import { test } from 'node:test';
import assert from 'node:assert/strict';


const mockNode = {
  connect: () => {},
  disconnect: () => {},
  start: () => {},
  stop: () => {},
  type: '',
  gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
  frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
};
const mockAudioCtx = {
  currentTime: 0,
  destination: {},
  resume: () => {},
  suspend: () => {},
  createOscillator: () => ({ ...mockNode }),
  createGain: () => ({ ...mockNode }),
  createBufferSource: () => ({ ...mockNode, buffer: null }),
  createBuffer: (ch, len, sr) => ({ getChannelData: () => new Float32Array(len) }),
  createBiquadFilter: () => ({ ...mockNode, type: '', Q: { value: 0 } }),
  sampleRate: 44100,
};

globalThis.window = {
  AudioContext: class { constructor() { return mockAudioCtx; } },
};
let rafCallback = null;
globalThis.requestAnimationFrame = (fn) => { rafCallback = fn; };
globalThis.setTimeout = () => {};
globalThis.EventTarget = EventTarget;
globalThis.Event = Event;
globalThis.document = {
  createElement: () => ({
    style: {},
    clientWidth: 400,
    clientHeight: 600,
    getContext: () => ({
      setTransform: () => {}, fillRect: () => {}, save: () => {}, restore: () => {},
      beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
      strokeRect: () => {}, moveTo: () => {}, lineTo: () => {},
      fillText: () => {}, translate: () => {}, rotate: () => {}, scale: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    innerHTML: '',
    appendChild: () => {},
  }),
};

export function tickRaf(ms) {
  if (rafCallback) { const fn = rafCallback; rafCallback = null; fn(ms); }
}

// TODO shouldn't import from music
const { initAudio, beatsToMs } = await import('../music/sequencer.js');
const { createEngine, RESULT_WIN, RESULT_LOSE } = await import('../engine.js');
initAudio();

function makeSlide() {
  return { innerHTML: '', appendChild: () => {} };
}

function tick(engine, ms) {
  tickRaf(ms);
}

// ── win / lose ────────────────────────────────────────────────────────────────

test('win() calls onEnd with win result', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, draw(api) { api.win(); } });
  tick(engine, 0);
  assert.equal(result, RESULT_WIN);
});

test('lose() calls onEnd with lose result', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, draw(api) { api.lose(); } });
  tick(engine, 0);
  assert.equal(result, RESULT_LOSE);
});

test('onEnd fires only once even if win called multiple times', () => {
  let count = 0;
  const engine = createEngine(makeSlide(), () => { count++; });
  engine.run({ duration: 8, draw(api) { api.win(); api.win(); } });
  tick(engine, 0);
  assert.equal(count, 1);
});

// ── timeout ───────────────────────────────────────────────────────────────────

test('game times out with lose when duration exceeded', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, draw() {} });
  tick(engine, 1000);                       // frame 1: gameTimeMs = 0
  tick(engine, 1000 + beatsToMs(8) + 1);   // frame 2: gameTimeMs = duration+1
  assert.equal(result, RESULT_LOSE);
});

test('game times out with win when timeoutResult is win', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, timeoutResult: RESULT_WIN, draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + beatsToMs(8) + 1);
  assert.equal(result, RESULT_WIN);
});

test('game does not end before duration', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + beatsToMs(4)); // halfway
  assert.equal(result, null);
});
