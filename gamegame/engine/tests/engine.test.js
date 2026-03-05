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
  createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len) }),
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

const { createMusic } = await import('../music/sequencer.js');
const { createEngine, RESULT_WIN, RESULT_LOSE } = await import('../engine.js');
const music = createMusic();
music.initAudio();

function makeSlide() {
  return { innerHTML: '', appendChild: () => {} };
}

function tick(engine, ms) {
  tickRaf(ms);
}

// ── win / lose ────────────────────────────────────────────────────────────────

test('win() calls onEnd with win result', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; }, music);
  engine.run({ duration: 8, draw(api) { api.win(); } });
  tick(engine, 0);
  assert.equal(result, RESULT_WIN);
});

test('lose() calls onEnd with lose result', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; }, music);
  engine.run({ duration: 8, draw(api) { api.lose(); } });
  tick(engine, 0);
  assert.equal(result, RESULT_LOSE);
});

test('onEnd fires only once even if win called multiple times', () => {
  let count = 0;
  const engine = createEngine(makeSlide(), () => { count++; }, music);
  engine.run({ duration: 8, draw(api) { api.win(); api.win(); } });
  tick(engine, 0);
  assert.equal(count, 1);
});

// ── timeout ───────────────────────────────────────────────────────────────────

test('game times out with lose when duration exceeded', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; }, music);
  engine.run({ duration: 8, draw() {} });
  tick(engine, 1000);                       // frame 1: gameTimeMs = 0
  tick(engine, 1000 + music.beatsToMs(8) + 1);   // frame 2: gameTimeMs = duration+1
  assert.equal(result, RESULT_LOSE);
});

test('game times out with win when timeoutResult is win', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; }, music);
  engine.run({ duration: 8, timeoutResult: RESULT_WIN, draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + music.beatsToMs(8) + 1);
  assert.equal(result, RESULT_WIN);
});

test('game does not end before duration', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; }, music);
  engine.run({ duration: 8, draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + music.beatsToMs(4)); // halfway
  assert.equal(result, null);
});

// ── pause / resume ────────────────────────────────────────────────────────────

test('paused game does not advance time or call draw', () => {
  let draws = 0;
  const engine = createEngine(makeSlide(), () => {}, music);
  engine.run({ duration: 8, draw() { draws++; } });
  tick(engine, 1000);   // frame 1: runs draw
  engine.pause();
  tick(engine, 2000);   // frame 2: paused, should not run
  tick(engine, 3000);   // frame 3: paused, should not run
  assert.equal(draws, 1);
});

test('resumed game continues from where it left off', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; }, music);
  const dur = music.beatsToMs(2); // short duration: 1000ms at 120bpm
  engine.run({ duration: 2, draw() {} });
  tick(engine, 1000);          // frame 1: lastFrameTime=0→1000, gameTimeMs=0
  engine.pause();
  tick(engine, 1000 + dur);    // while paused — no time advance
  assert.equal(result, null);  // should not have ended
  engine.resume();             // lastFrameTime resets to 0
  tick(engine, 1000 + dur);    // frame 2: lastFrameTime=0→1000+dur, gameTimeMs=0 (dt=0)
  tick(engine, 2000 + dur);    // frame 3: dt=1000, gameTimeMs=1000 >= dur → timeout
  assert.equal(result, RESULT_LOSE);
});

test('pause is idempotent when already paused', () => {
  const engine = createEngine(makeSlide(), () => {}, music);
  engine.run({ duration: 8, draw() {} });
  tick(engine, 1000);
  engine.pause();
  engine.pause(); // should not throw
  engine.resume();
  tick(engine, 2000); // should draw without error
});

test('resume is a no-op when not paused', () => {
  let draws = 0;
  const engine = createEngine(makeSlide(), () => {}, music);
  engine.run({ duration: 8, draw() { draws++; } });
  tick(engine, 1000);  // frame 1
  engine.resume();     // no-op
  tick(engine, 2000);  // frame 2: should still run normally
  assert.equal(draws, 2);
});
