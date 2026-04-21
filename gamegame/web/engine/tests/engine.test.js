import { test } from 'node:test';
import assert from 'node:assert/strict';

let rafCallback = null;
globalThis.requestAnimationFrame = (fn) => { rafCallback = fn; };

function tickRaf(ms) {
  if (rafCallback) { const fn = rafCallback; rafCallback = null; fn(ms); }
}

const BPM = 120;
const music = {
  getBpm: () => BPM,
  getGlobalBeat: () => 0,
  beatsToMs: (beats) => (beats / BPM) * 60000,
  soundTap: () => {},
  start: () => {},
  pause: () => {},
  resume: () => {},
};

const noop = () => {};
const mockDrawing = {
  get width() { return 400; },
  get height() { return 600; },
  clear: noop, circle: noop, circleOutline: noop,
  rect: noop, rectOutline: noop, line: noop,
  text: noop, emoji: noop,
};

function mockGraphics() {
  return { drawing: mockDrawing };
}

const { createEngine, RESULT_WIN, RESULT_LOSE } = await import('../engine.js');

function tick(engine, ms) {
  tickRaf(ms);
}

test('win() calls onEnd with win result', () => {
  let result = null;
  const engine = createEngine((r) => { result = r; }, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw(api) { api.win(); } });
  tick(engine, 0);
  assert.equal(result, RESULT_WIN);
});

test('lose() calls onEnd with lose result', () => {
  let result = null;
  const engine = createEngine((r) => { result = r; }, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw(api) { api.lose('oops'); } });
  tick(engine, 0);
  assert.equal(result, RESULT_LOSE);
});

test('onEnd fires only once even if win called multiple times', () => {
  let count = 0;
  const engine = createEngine(() => { count++; }, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw(api) { api.win(); api.win(); } });
  tick(engine, 0);
  assert.equal(count, 1);
});

test('game times out with lose when duration exceeded', () => {
  let result = null;
  const engine = createEngine((r) => { result = r; }, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + music.beatsToMs(8) + 1);
  assert.equal(result, RESULT_LOSE);
});

test('game times out with win when timeoutResult is win', () => {
  let result = null;
  const engine = createEngine((r) => { result = r; }, music, mockGraphics);
  engine.run({ duration: 8, timeoutResult: RESULT_WIN, draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + music.beatsToMs(8) + 1);
  assert.equal(result, RESULT_WIN);
});

test('game does not end before duration', () => {
  let result = null;
  const engine = createEngine((r) => { result = r; }, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + music.beatsToMs(4));
  assert.equal(result, null);
});

test('paused game does not advance time or call draw', () => {
  let draws = 0;
  const engine = createEngine(() => {}, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw() { draws++; } });
  tick(engine, 1000);
  engine.pause();
  tick(engine, 2000);
  tick(engine, 3000);
  assert.equal(draws, 1);
});

test('resumed game continues from where it left off', () => {
  let result = null;
  const engine = createEngine((r) => { result = r; }, music, mockGraphics);
  const dur = music.beatsToMs(2);
  engine.run({ duration: 2, timeoutMessage: 'time up', draw() {} });
  tick(engine, 1000);
  engine.pause();
  tick(engine, 1000 + dur);
  assert.equal(result, null);
  engine.resume();
  tick(engine, 1000 + dur);
  tick(engine, 2000 + dur);
  assert.equal(result, RESULT_LOSE);
});

test('pause is idempotent when already paused', () => {
  const engine = createEngine(() => {}, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw() {} });
  tick(engine, 1000);
  engine.pause();
  engine.pause();
  engine.resume();
  tick(engine, 2000);
});

test('resume is a no-op when not paused', () => {
  let draws = 0;
  const engine = createEngine(() => {}, music, mockGraphics);
  engine.run({ duration: 8, timeoutMessage: 'time up', draw() { draws++; } });
  tick(engine, 1000);
  engine.resume();
  tick(engine, 2000);
  assert.equal(draws, 2);
});
