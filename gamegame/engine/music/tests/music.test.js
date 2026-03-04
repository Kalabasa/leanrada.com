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
  let t = startTime;
  const clock = { now: () => t, advance: (s) => { t += s; } };
  const instrument = mockInstrument();
  const composition = createComposition();
  composition.changeBassRoot();
  const seq = new Sequencer({ bars: BARS, instrument, composition, getTime: clock.now });
  seq._started = true;
  seq._beatStart = startTime;
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

test('nextBeatTime is in the future', () => {
  const { seq, clock } = makeSeq(0);
  clock.advance(0.3); // mid-beat
  assert.ok(seq.nextBeatTime() > clock.now());
});

test('msUntilNextBeat is non-negative', () => {
  const { seq, clock } = makeSeq(0);
  clock.advance(0.3);
  assert.ok(seq.msUntilNextBeat() >= 0);
});

// ── Section state ──────────────────────────────────────────────────────────────

test('initial section is main_a', () => {
  const { seq } = makeSeq();
  assert.equal(seq.getMusicState().currentSection, 'main_a');
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

// ── soundWin / soundLose return values ────────────────────────────────────────

test('soundWin returns end time = next beat + 1 bar', () => {
  const { seq, clock } = makeSeq(0);
  seq.setBpm(120);
  clock.advance(0.1);
  const end = seq.soundWin();
  const barDur = (4 / 120) * 60; // 2s
  assert.ok(end > clock.now() + barDur - 0.01);
  assert.ok(end < clock.now() + barDur + 1);
});

test('soundLose returns end time = next beat + 1 bar', () => {
  const { seq, clock } = makeSeq(0);
  seq.setBpm(120);
  clock.advance(0.1);
  const end = seq.soundLose();
  const barDur = (4 / 120) * 60;
  assert.ok(end > clock.now() + barDur - 0.01);
  assert.ok(end < clock.now() + barDur + 1);
});

// ── soundWin / soundLose scheduled events ────────────────────────────────────

test('soundWin schedules 4 ascending tone events', () => {
  const { seq, instrument } = makeSeq(0);
  seq.soundWin();
  const tones = instrument.ofType('tone');
  assert.equal(tones.length, 4);
  for (let i = 1; i < tones.length; i++)
    assert.ok(tones[i].t >= tones[i - 1].t, 'tones not in time order');
});

test('soundWin schedules 4 roll_hit events', () => {
  const { seq, instrument } = makeSeq(0);
  seq.soundWin();
  const rolls = instrument.ofType('roll_hit');
  assert.equal(rolls.length, 4);
  assert.deepEqual(rolls.map(r => r.step), [0, 1, 2, 3]);
});

test('soundWin roll ends at bar end time', () => {
  const { seq, instrument } = makeSeq(0);
  const end = seq.soundWin();
  const rolls = instrument.ofType('roll_hit');
  const last = rolls[rolls.length - 1];
  const s16 = (60 / 120) * 0.25;
  assert.ok(Math.abs(last.t - (end - s16)) < 0.001, 'last roll hit should be one 16th before bar end');
});

test('soundLose schedules 3 tone events', () => {
  const { seq, instrument } = makeSeq(0);
  seq.soundLose();
  const tones = instrument.ofType('tone');
  assert.equal(tones.length, 3);
  for (let i = 1; i < tones.length; i++)
    assert.ok(tones[i].t >= tones[i - 1].t);
});

// ── soundTap / soundPlay ──────────────────────────────────────────────────────

test('soundTap schedules a tone event at now', () => {
  const { seq, instrument, clock } = makeSeq(5);
  clock.advance(0.2);
  seq.soundTap();
  const tones = instrument.ofType('tone');
  assert.equal(tones.length, 1);
  assert.ok(Math.abs(tones[0].t - clock.now()) < 0.001);
});

test('soundPlay schedules a tone event with given freq', () => {
  const { seq, instrument } = makeSeq(0);
  seq.soundPlay(440, 0.3, 'square');
  const tones = instrument.ofType('tone');
  assert.equal(tones.length, 1);
  assert.equal(tones[0].freq, 440);
  assert.equal(tones[0].wave, 'square');
});

// ── Composition: builders ─────────────────────────────────────────────────────

test('buildWinRiff returns 4 tone events with ascending dt', () => {
  const comp = createComposition();
  comp.changeBassRoot();
  const events = comp.buildWinRiff(120);
  assert.equal(events.length, 4);
  events.forEach(e => { assert.equal(e.type, 'tone'); assert.ok(e.freq > 0); });
  for (let i = 1; i < events.length; i++)
    assert.ok(events[i].dt > events[i - 1].dt);
});

test('buildLoseRiff returns 3 tone events', () => {
  const comp = createComposition();
  comp.changeBassRoot();
  assert.equal(comp.buildLoseRiff(120).length, 3);
});

test('buildRoll returns 4 roll_hit events, last at endT - one 16th', () => {
  const comp = createComposition();
  const endT = 10;
  const events = comp.buildRoll(endT, 120);
  assert.equal(events.length, 4);
  const s16 = (60 / 120) * 0.25;
  assert.ok(Math.abs(events[3].t - (endT - s16)) < 0.001);
  assert.deepEqual(events.map(e => e.step), [0, 1, 2, 3]);
});

test('getScaleNote returns a plausible frequency after changeBassRoot', () => {
  const comp = createComposition();
  comp.changeBassRoot();
  const f = comp.getScaleNote(0);
  assert.ok(f > 50 && f < 10000, `unexpected freq ${f}`);
});

test('buildChop returns a chop event with 3 freqs', () => {
  const comp = createComposition();
  comp.changeBassRoot();
  const events = comp.buildChop();
  assert.equal(events[0].type, 'chop');
  assert.equal(events[0].freqs.length, 3);
});
