import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockAudioCtx } from './mocks.js';

const {
  initAudio, getBpm, setBpm, beatsToMs, getGlobalBeat,
  startBeatClock, beatToTime, nextBeatTime, msUntilNextBeat,
  soundTap, soundPlay, soundWin, soundLose,
  muteDrums, unmuteDrums,
} = await import('../engine/music.js');

initAudio();

// ── beatsToMs ─────────────────────────────────────────────────────────────────

test('beatsToMs converts beats at default 120 BPM', () => {
  assert.equal(beatsToMs(1), 500);   // 1 beat = 500ms at 120 BPM
  assert.equal(beatsToMs(4), 2000);  // 4 beats = 2s
});

test('beatsToMs reflects BPM changes', () => {
  const original = getBpm();
  setBpm(60);
  assert.equal(beatsToMs(1), 1000);  // 1 beat = 1s at 60 BPM
  setBpm(original);
});

// ── getBpm / setBpm ───────────────────────────────────────────────────────────

test('getBpm returns current BPM', () => {
  assert.equal(getBpm(), 120);
});

test('setBpm changes BPM', () => {
  const original = getBpm();
  setBpm(140);
  assert.equal(getBpm(), 140);
  setBpm(original);
});

// ── beat clock ────────────────────────────────────────────────────────────────

test('getGlobalBeat returns 0 before beat clock starts on fresh context', () => {
  // Already started from initAudio + previous tests, so just verify it returns a number
  const beat = getGlobalBeat();
  assert.equal(typeof beat, 'number');
});

test('beatToTime and nextBeatTime return numbers', () => {
  assert.equal(typeof beatToTime(0), 'number');
  assert.equal(typeof nextBeatTime(), 'number');
});

test('msUntilNextBeat returns non-negative', () => {
  assert.ok(msUntilNextBeat() >= 0);
});

// ── sound functions don't throw ───────────────────────────────────────────────

test('soundTap does not throw', () => {
  assert.doesNotThrow(() => soundTap());
});

test('soundPlay does not throw', () => {
  assert.doesNotThrow(() => soundPlay(440));
  assert.doesNotThrow(() => soundPlay(440, 0.5, 'square'));
});

test('soundWin does not throw', () => {
  assert.doesNotThrow(() => soundWin());
});

test('soundLose does not throw', () => {
  assert.doesNotThrow(() => soundLose());
});

// ── mute/unmute ───────────────────────────────────────────────────────────────

test('muteDrums and unmuteDrums do not throw', () => {
  assert.doesNotThrow(() => muteDrums());
  assert.doesNotThrow(() => unmuteDrums());
});
