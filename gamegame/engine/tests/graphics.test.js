import { test } from 'node:test';
import assert from 'node:assert/strict';
// Shared browser mocks for tests

globalThis.window = {
  devicePixelRatio: 1,
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

const { createCanvas } = await import('../graphics.js');

function makeSlide() {
  return { innerHTML: '', appendChild: () => {} };
}

// ── createCanvas ──────────────────────────────────────────────────────────────

test('createCanvas returns canvas, drawing, and resetDrawState', () => {
  const result = createCanvas(makeSlide());
  assert.ok(result.canvas);
  assert.ok(result.drawing);
  assert.equal(typeof result.resetDrawState, 'function');
});

test('drawing.width and height return canvas dimensions', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.equal(drawing.width, 400);
  assert.equal(drawing.height, 600);
});

// ── drawing methods exist ─────────────────────────────────────────────────────

test('drawing has all expected methods', () => {
  const { drawing } = createCanvas(makeSlide());
  const methods = ['clear', 'fill', 'stroke', 'circle', 'rect', 'line', 'text', 'emoji', 'push', 'pop', 'translate', 'rotate', 'scale'];
  for (const m of methods) {
    assert.equal(typeof drawing[m], 'function', `missing method: ${m}`);
  }
});

// ── drawing methods don't throw ───────────────────────────────────────────────

test('clear does not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.doesNotThrow(() => drawing.clear());
  assert.doesNotThrow(() => drawing.clear('#fff'));
});

test('fill and stroke set state without throwing', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.doesNotThrow(() => drawing.fill('#f00'));
  assert.doesNotThrow(() => drawing.stroke('#0f0', 3));
});

test('circle does not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  drawing.fill('#fff');
  drawing.stroke('#000');
  assert.doesNotThrow(() => drawing.circle(100, 100, 50));
});

test('rect does not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  drawing.fill('#fff');
  drawing.stroke('#000');
  assert.doesNotThrow(() => drawing.rect(10, 10, 50, 50));
});

test('line does not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.doesNotThrow(() => drawing.line(0, 0, 100, 100));
});

test('text does not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.doesNotThrow(() => drawing.text('hello', 200, 300));
  assert.doesNotThrow(() => drawing.text('big', 200, 300, 48));
});

test('emoji does not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.doesNotThrow(() => drawing.emoji('🎮', 200, 300));
});

test('push/pop do not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.doesNotThrow(() => { drawing.push(); drawing.pop(); });
});

test('transform methods do not throw', () => {
  const { drawing } = createCanvas(makeSlide());
  assert.doesNotThrow(() => drawing.translate(10, 20));
  assert.doesNotThrow(() => drawing.rotate(0.5));
  assert.doesNotThrow(() => drawing.scale(2));
  assert.doesNotThrow(() => drawing.scale(2, 3));
});

// ── resetDrawState ────────────────────────────────────────────────────────────

test('resetDrawState does not throw', () => {
  const { drawing, resetDrawState } = createCanvas(makeSlide());
  drawing.fill('#f00');
  drawing.stroke('#0f0', 5);
  assert.doesNotThrow(() => resetDrawState());
});