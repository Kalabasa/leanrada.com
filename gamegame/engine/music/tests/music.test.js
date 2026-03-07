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
  createBuffer: (_ch, len) => ({ getChannelData: () => new Float32Array(len) }),
  createBiquadFilter: () => ({ ...mockNode, type: '', Q: { value: 0 } }),
  createConvolver: () => ({ ...mockNode, buffer: null }),
  sampleRate: 44100,
};

const { Sequencer, BARS, createComposition } = await import('../sequencer.js');

globalThis.window = {
  AudioContext: class { constructor() { return mockAudioCtx; } },
};
// ── Test helpers ───────────────────────────────────────────────────────────────

function mockInstrument() {
  const events = [];
  return {
    events,
    playEvent(e) { events.push({ ...e }); },
    ofType: (type) => events.filter(e => e.type === type),
  };
}

function makeSeq(startTime = 0) {
  let t = startTime * 1000;
  const clock = { now: () => t, advance: (s) => { t += s * 1000; } };
  const instrument = mockInstrument();
  const composition = createComposition();
  const seq = new Sequencer({ bars: BARS, instrument, composition, getNowMs: clock.now });
  seq.start();
  seq.pause();
  return { seq, instrument, clock };
}

// ── Beat clock ─────────────────────────────────────────────────────────────────

test('beatsToMs at 120 bpm', () => {
  const { seq } = makeSeq();
  assert.equal(seq.beatsToMs(1), 500);
  assert.equal(seq.beatsToMs(4), 2000);
});

test('beatsToMs scales with bpm', () => {
  const { seq } = makeSeq();
  seq.setBpm(60);
  assert.equal(seq.beatsToMs(1), 1000);
});

test('getBpm / setBpm', () => {
  const { seq } = makeSeq();
  assert.equal(seq.getBpm(), 120);
  seq.setBpm(140);
  assert.equal(seq.getBpm(), 140);
});

test('getGlobalBeat advances with time', () => {
  const { seq, clock } = makeSeq(0);
  seq.setBpm(120);
  clock.advance(0.5); // 0.5s = 1 beat at 120bpm
  assert.ok(Math.abs(seq.getGlobalBeat() - 1) < 0.01);
});

// ── Section state ──────────────────────────────────────────────────────────────


test('soundWin queues win section', () => {
  const { seq } = makeSeq();
  seq.soundWin();
  assert.equal(seq.getMusicState().nextSection, 'win');
});

test('soundLose queues lose section', () => {
  const { seq } = makeSeq();
  seq.soundLose();
  assert.equal(seq.getMusicState().nextSection, 'lose');
});

// ── soundWin / soundLose return values ────────────────────────────────────────

test('soundWin returns end time = next beat + 1 bar', () => {
  const { seq, clock } = makeSeq(0);
  seq.setBpm(120);
  clock.advance(0.1);
  const end = seq.soundWin();
  const barDurMs = (4 / 120) * 60000; // 2000ms
  const beatDurMs = barDurMs / 4;     // 500ms
  assert.ok(end > clock.now() + barDurMs - 0.01);
  assert.ok(end < clock.now() + barDurMs + beatDurMs);
});

test('soundLose returns end time = next beat + 1 bar', () => {
  const { seq, clock } = makeSeq(0);
  seq.setBpm(120);
  clock.advance(0.1);
  const end = seq.soundLose();
  const barDurMs = (4 / 120) * 60000;
  const beatDurMs = barDurMs / 4;
  assert.ok(end > clock.now() + barDurMs - 0.01);
  assert.ok(end < clock.now() + barDurMs + beatDurMs);
});
