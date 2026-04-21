import { initAudio, nowMs } from './audio.js';

export const SECTION_BEAT_LENGTH = 4;
export const SECTION_MAIN = 'main';
export const SECTION_WIN = 'win';
export const SECTION_LOSE = 'lose';

export class Sequencer {
  #comp; #getNowMs;
  #bpm; #beatStartMs; #accumulatedBeats; #started;
  #scheduledUntil; #loopTimer;
  #pendingSection; #pendingSectionBeat;
  #queue; #barStartBeat;

  constructor({ composer, getNowMs = nowMs }) {
    this.#comp = composer;
    this.#getNowMs = getNowMs;

    this.#bpm = 100;
    this.#beatStartMs = 0;
    this.#accumulatedBeats = 0;
    this.#started = false;

    this.#scheduledUntil = 0;
    this.#loopTimer = null;

    this.#pendingSection = null;
    this.#pendingSectionBeat = null;

    this.#queue = [];
    this.#barStartBeat = -SECTION_BEAT_LENGTH;
  }

  initAudio() { initAudio(); this.start(); }

  start() {
    if (this.#started) return;
    this.#started = true;
    this.#beatStartMs = this.#getNowMs();
    this.#tick();
  }

  pause() { clearTimeout(this.#loopTimer); }

  resume() { if (this.#started) this.#tick(); }

  getBpm() { return this.#bpm; }

  setBpm(bpm) {
    if (this.#started && bpm !== this.#bpm) this.#snapshotBeat();
    this.#bpm = bpm;
  }

  getGlobalBeat() {
    if (!this.#started) return 0;
    return this.#accumulatedBeats + (this.#getNowMs() - this.#beatStartMs) * (this.#bpm / 60000);
  }

  beatsToMs(beats) { return (beats / this.#bpm) * 60000; }

  /** @returns {number} bar end time (ms) */
  beatToTimeMs(b) {
    return this.#beatStartMs + this.beatsToMs(b - this.#accumulatedBeats);
  }

  /** @returns {number} bar end time (ms) */
  soundWin() { return this.#queueSection(SECTION_WIN); }

  /** @returns {number} bar end time (ms) */
  soundLose() { return this.#queueSection(SECTION_LOSE); }

  soundTap() {
    const tS = this.#getNowMs() / 1000;
    const msPerBeat = 60000 / this.#bpm;
    for (const e of this.#comp.buildTap()) {
      e.instrument.play(tS, e.dur * msPerBeat / 1000, e.note, e.vol);
    }
  }

  getMusicState() {
    return {
      nextSection: this.#pendingSection,
      nextSectionBeat: this.#pendingSectionBeat,
      bpm: this.#bpm,
    };
  }

  #snapshotBeat() {
    this.#accumulatedBeats = this.getGlobalBeat();
    this.#beatStartMs = this.#getNowMs();
  }

  /** @returns {number} bar end time (ms) */
  #queueSection(sectionName) {
    this.#pendingSection = sectionName;
    const halfSection = Math.ceil(SECTION_BEAT_LENGTH / 2);
    this.#pendingSectionBeat = Math.ceil(this.getGlobalBeat() / halfSection) * halfSection;
    return this.beatToTimeMs(this.#pendingSectionBeat + SECTION_BEAT_LENGTH);
  }

  #startBar(beat, section) {
    const cutoff = this.#queue.findIndex(e => e.t > beat + 1e-9);
    if (cutoff !== -1) this.#queue.length = cutoff;
    this.#barStartBeat = beat;
    this.#queue.push(
      ...this.#comp.buildBar(section)
        .map(e => ({ ...e, t: beat + e.beatOffset }))
        .sort((a, b) => a.beatOffset - b.beatOffset)
    );
  }

  #tick() {
    const beatNow = this.getGlobalBeat();
    const scheduleTo = beatNow + 1;
    const s16beat = 0.25;
    const msPerBeat = 60000 / this.#bpm;
    const swingMs = msPerBeat * 0.25 * 0.18;

    for (let b = Math.ceil(this.#scheduledUntil); b < scheduleTo; b += s16beat) {
      if (this.#pendingSection !== null && b >= this.#pendingSectionBeat) {
        this.#startBar(this.#pendingSectionBeat, this.#pendingSection);
        this.#pendingSection = null;
        this.#pendingSectionBeat = null;
      } else if (b >= this.#barStartBeat + SECTION_BEAT_LENGTH) {
        this.#startBar(b, SECTION_MAIN);
      }

      while (this.#queue.length > 0 && this.#queue[0].t <= b + 1e-9) {
        const e = this.#queue.shift();
        const swing = (Math.round(e.beatOffset * 4) % 2 === 1) ? swingMs : 0;
        const tS = (this.beatToTimeMs(e.t) + swing) / 1000;
        const durS = e.dur * msPerBeat / 1000;
        e.instrument.play(tS, durS, e.note, e.vol);
      }
    }

    this.#scheduledUntil = scheduleTo;
    this.#loopTimer = setTimeout(() => this.#tick(), 50);
  }
}
