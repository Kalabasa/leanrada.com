// gamegame music — bar sequencer
// No AudioContext. Accepts instrument (playEvent) and composition as dependencies.

import { createInstrument, initAudio as _initAudio, pauseAudio as _pauseAudio,
         resumeAudio as _resumeAudio, now } from './instruments.js';
import { createComposition, BARS } from './composition.js';

// ============================================================
// Sequencer class
// ============================================================

class Sequencer {
  constructor({ bars, instrument, composition, getTime = now }) {
    this._bars = bars;
    this._instrument = instrument;
    this._comp = composition;
    this._now = getTime;

    this._bpm = 120;
    this._beatStart = 0;      // getTime() when current BPM segment started
    this._accumulated = 0;    // beats accumulated before current BPM segment
    this._started = false;

    this._scheduledUntil = 0;
    this._loopTimer = null;

    this._currentSection = 'main_a';
    this._nextSection = null;
    this._nextSectionBeat = null;
    this._mainAlt = false;
  }

  // ── Beat clock ──────────────────────────────────────────────

  getBpm() { return this._bpm; }

  setBpm(bpm) {
    if (this._started && bpm !== this._bpm) {
      this._accumulated = this.getGlobalBeat();
      this._beatStart = this._now();
    }
    this._bpm = bpm;
  }

  getGlobalBeat() {
    if (!this._started) return 0;
    return this._accumulated + (this._now() - this._beatStart) * (this._bpm / 60);
  }

  beatsToMs(beats) { return (beats / this._bpm) * 60000; }

  _beatToTime(b) {
    return this._beatStart + ((b - this._accumulated) / this._bpm) * 60;
  }

  nextBeatTime() {
    const next = Math.ceil(this.getGlobalBeat() + 0.01);
    return this._beatToTime(next);
  }

  msUntilNextBeat() {
    return Math.max(0, (this.nextBeatTime() - this._now()) * 1000);
  }

  // ── Lifecycle ───────────────────────────────────────────────

  start() {
    if (this._started) return;
    this._started = true;
    this._beatStart = this._now();
    this._tick();
  }

  stop() {
    clearTimeout(this._loopTimer);
    this._loopTimer = null;
  }

  // ── Section management ──────────────────────────────────────

  _queueSection(name) {
    this._nextSection = name;
    const t = this.nextBeatTime();
    this._nextSectionBeat = this.getGlobalBeat() + 1;
    return t;
  }

  // ── Public sound API ────────────────────────────────────────

  /** Queue win bar at next beat. Returns bar end time (audioCtx seconds). */
  soundWin() {
    const t = this._queueSection('win');
    const barDur = (4 / this._bpm) * 60;
    // TODO, only win bar, can build bar dynamically, but not schedule individual elements
    // Schedule riff and roll directly — bypass lookahead lag
    this._comp.buildWinRiff(this._bpm).forEach(e =>
      this._instrument.playEvent({ ...e, t: t + e.dt }));
    this._comp.buildRoll(t + barDur, this._bpm).forEach(e =>
      this._instrument.playEvent(e));
    return t + barDur;
  }

  /** Queue lose bar at next beat. Returns bar end time (audioCtx seconds). */
  soundLose() {
    const t = this._queueSection('lose');
    const barDur = (4 / this._bpm) * 60;
    // TODO, only lose bar, can build bar dynamically, but not schedule individual elements
    this._comp.buildLoseRiff(this._bpm).forEach(e =>
      this._instrument.playEvent({ ...e, t: t + e.dt }));
    return t + barDur;
  }

  soundTap() {
    this._comp.buildTap().forEach(e =>
      this._instrument.playEvent({ ...e, t: this._now() }));
  }

  soundPlay(freq, dur = 0.2, type = 'sine') {
    this._instrument.playEvent({ type: 'tone', t: this._now(), freq, dur, wave: type, vol: 0.12 });
  }

  // ── Scheduler loop ──────────────────────────────────────────

  _tick() {
    const lookAhead = 0.2;
    const beatNow = this.getGlobalBeat();
    const n = this._now();
    const scheduleTo = beatNow + 1;
    const s16beat = 0.25;
    const swingS = (60 / this._bpm) * 0.25 * 0.18;

    for (let b = Math.max(Math.ceil(this._scheduledUntil * 4) / 4, 0); b < scheduleTo; b += s16beat) {
      // Section transition
      if (this._nextSection !== null && this._nextSectionBeat !== null &&
          b >= this._nextSectionBeat - 0.001) {
        this._currentSection = this._nextSection;
        this._nextSection = null;
        this._nextSectionBeat = null;
      }

      const s16 = Math.round(((b % 4) * 4 + 64)) % 16;
      const swing = (s16 % 2 === 1) ? swingS : 0;
      const t = this._beatToTime(b) + swing;
      if (t < n - 0.01) continue;

      const bar = this._bars[this._currentSection];
      const play = (e) => this._instrument.playEvent({ ...e, t });

      if (bar.kick.has(s16))              play({ type: 'kick' });
      if (bar.snare.has(s16))             play({ type: 'snare' });
      if (bar.ghost.has(s16))             play({ type: 'ghost' });
      if (bar.open_hat.has(s16))          play({ type: 'open_hat' });
      else if (bar.hat.has(s16))          play({ type: 'hat' });
      if (bar.bass.has(s16)) {
        const e = this._comp.buildBassNote(bar.bass.get(s16), this._bpm);
        play(e);
      }
      if (bar.chop.has(s16)) {
        this._comp.buildChop().forEach(e => play(e));
      }

      // Bar-start events
      if (s16 === 0 && b % 4 < 0.01) {
        this._comp.advanceChord();
        // Return from one-shot section
        if (this._currentSection === 'win' || this._currentSection === 'lose') {
          this._mainAlt = !this._mainAlt;
          this._currentSection = this._mainAlt ? 'main_b' : 'main_a';
        }
      }

      // Groove riff every 2 bars
      if (s16 === 0 && b % 8 < 0.01 && bar.riff === true) {
        this._comp.buildRiff(this._bpm).forEach(e =>
          this._instrument.playEvent({ ...e, t: t + e.dt }));
      }
    }

    this._scheduledUntil = scheduleTo;
    this._loopTimer = setTimeout(() => this._tick(), 100);
  }

  // ── Test hook ────────────────────────────────────────────────

  getMusicState() {
    return {
      currentSection: this._currentSection,
      nextSection: this._nextSection,
      nextSectionBeat: this._nextSectionBeat,
      bpm: this._bpm,
    };
  }
}

// ============================================================
// Factory — wires up real instrument + composition
// ============================================================

export function createMusic() {
  const instrument = createInstrument();
  const composition = createComposition();
  return new Sequencer({ bars: BARS, instrument, composition });
}


// TODO Remove all these exports
// ============================================================
// Singleton for engine.js / index.html (backwards compat)
// ============================================================

let _music = null;
function getMusic() {
  if (!_music) _music = createMusic();
  return _music;
}

export function initAudio()    { _initAudio(); getMusic().start(); }
export function pauseAudio()   { _pauseAudio(); }
export function resumeAudio()  { _resumeAudio(); }

export function getBpm()              { return getMusic().getBpm(); }
export function setBpm(bpm)           { getMusic().setBpm(bpm); }
export function getGlobalBeat()       { return getMusic().getGlobalBeat(); }
export function startBeatClock()      { getMusic().start(); }
export function beatsToMs(beats)      { return getMusic().beatsToMs(beats); }
export function nextBeatTime()        { return getMusic().nextBeatTime(); }
export function msUntilNextBeat()     { return getMusic().msUntilNextBeat(); }
export function changeBassRoot()      { getMusic()._comp.changeBassRoot(); }
export function getScaleNote(i)       { return getMusic()._comp.getScaleNote(i); }
export function soundTap()            { getMusic().soundTap(); }
export function soundPlay(f, d, w)    { getMusic().soundPlay(f, d, w); }
export function soundWin()            { return getMusic().soundWin(); }
export function soundLose()           { return getMusic().soundLose(); }
export function getMusicState()       { return getMusic().getMusicState(); }

// For index.html (getAudioCtx used for timing calculations)
export { getAudioCtx } from './instruments.js';

export { Sequencer, BARS, createComposition };
