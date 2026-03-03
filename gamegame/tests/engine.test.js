import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tickRaf } from './mocks.js';

const { initAudio, beatsToMs } = await import('../engine/music.js');
const { createEngine } = await import('../engine/engine.js');
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
  assert.equal(result, 'win');
});

test('lose() calls onEnd with lose result', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, draw(api) { api.lose(); } });
  tick(engine, 0);
  assert.equal(result, 'lose');
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
  assert.equal(result, 'lose');
});

test('game times out with win when timeoutResult is win', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, timeoutResult: 'win', draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + beatsToMs(8) + 1);
  assert.equal(result, 'win');
});

test('game does not end before duration', () => {
  let result = null;
  const engine = createEngine(makeSlide(), (r) => { result = r; });
  engine.run({ duration: 8, draw() {} });
  tick(engine, 1000);
  tick(engine, 1000 + beatsToMs(4)); // halfway
  assert.equal(result, null);
});
