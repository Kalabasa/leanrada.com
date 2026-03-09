import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { devicePixelRatio: 1 };
globalThis.document = {
  createElement: () => ({
    style: {},
    clientWidth: 400,
    clientHeight: 600,
    getContext: () => ({
      setTransform: () => {}, fillRect: () => {}, clearRect: () => {},
      fillText: () => {},
    }),
    innerHTML: '',
    appendChild: () => {},
  }),
};

const { createCanvas } = await import('../graphics.js');

function makeContainer() {
  return { innerHTML: '', appendChild: () => {} };
}

test('createCanvas returns canvas and drawing', () => {
  const result = createCanvas(makeContainer());
  assert.ok(result.canvas);
  assert.ok(result.drawing);
});

test('drawing.width and height return canvas dimensions', () => {
  const { drawing } = createCanvas(makeContainer());
  assert.equal(drawing.width, 400);
  assert.equal(drawing.height, 600);
});

test('drawing has all expected methods', () => {
  const { drawing } = createCanvas(makeContainer());
  const methods = ['clear', 'circle', 'circleOutline', 'rect', 'rectOutline', 'line', 'text', 'emoji'];
  for (const m of methods) {
    assert.equal(typeof drawing[m], 'function', `missing method: ${m}`);
  }
});

test('clear does not throw', () => {
  const { drawing } = createCanvas(makeContainer());
  assert.doesNotThrow(() => drawing.clear());
  assert.doesNotThrow(() => drawing.clear(0xffffff));
});

test('circle does not throw', () => {
  const { drawing } = createCanvas(makeContainer());
  assert.doesNotThrow(() => drawing.circle(100, 100, 50, 0xffffff));
});

test('rect does not throw', () => {
  const { drawing } = createCanvas(makeContainer());
  assert.doesNotThrow(() => drawing.rect(10, 10, 50, 50, 0xffffff));
});

test('line does not throw', () => {
  const { drawing } = createCanvas(makeContainer());
  assert.doesNotThrow(() => drawing.line(0, 0, 100, 100, 0xffffff));
});

test('text does not throw', () => {
  const { drawing } = createCanvas(makeContainer());
  assert.doesNotThrow(() => drawing.text('hello', 200, 300, 0xffffff));
  assert.doesNotThrow(() => drawing.text('big', 200, 300, 0xffffff, 48));
});

test('emoji does not throw', () => {
  const { drawing } = createCanvas(makeContainer());
  assert.doesNotThrow(() => drawing.emoji('🎮', 200, 300));
});
