import { test } from 'node:test';
import assert from 'node:assert/strict';

const mockNode = {
  connect: () => {},
  disconnect: () => {},
  start: () => {},
  stop: () => {},
  gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
};
const mockAudioCtx = {
  currentTime: 0,
  destination: {},
  resume: () => {},
  createGain: () => ({ ...mockNode }),
  createBufferSource: () => ({ ...mockNode, buffer: null, loop: false, playbackRate: { value: 1 } }),
  createBuffer: (_ch, len) => ({ length: len, getChannelData: () => new Float32Array(len) }),
  createConvolver: () => ({ ...mockNode, buffer: null }),
  sampleRate: 44100,
};

globalThis.window = {
  AudioContext: class { constructor() { return mockAudioCtx; } },
};

const { Sequencer } = await import('../sequencer.js');

function mockComposer() {
  const played = [];
  const mockInstrument = { play: (tS, durS, note, gain) => played.push({ tS, durS, note, gain }) };
  return {
    played,
    buildBar: () => [{ instrument: mockInstrument, beatOffset: 0, note: 60, dur: 0.5, gain: 0.8 }],
    buildTap: () => [{ instrument: mockInstrument, beatOffset: 0, note: 72, dur: 0.04, gain: 0.1 }],
  };
}

function makeSeq(startTime = 0) {
  let t = startTime * 1000;
  const clock = { now: () => t, advance: (s) => { t += s * 1000; } };
  const composer = mockComposer();
  const seq = new Sequencer({ composer, getNowMs: clock.now });
  seq.start();
  seq.pause();
  return { seq, composer, clock };
}

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

test('soundWin returns end time = next beat + 1 bar', () => {
  const { seq, clock } = makeSeq(0);
  seq.setBpm(120);
  clock.advance(0.1);
  const end = seq.soundWin();
  const barDurMs = (4 / 120) * 60000; // 2000ms
  // end is at least 1 bar from now, at most 2 bars (waits up to halfSection=2 beats)
  assert.ok(end > clock.now() + barDurMs - 0.01);
  assert.ok(end < clock.now() + barDurMs * 2 + 0.01);
});

test('soundLose returns end time = next beat + 1 bar', () => {
  const { seq, clock } = makeSeq(0);
  seq.setBpm(120);
  clock.advance(0.1);
  const end = seq.soundLose();
  const barDurMs = (4 / 120) * 60000;
  assert.ok(end > clock.now() + barDurMs - 0.01);
  assert.ok(end < clock.now() + barDurMs * 2 + 0.01);
});