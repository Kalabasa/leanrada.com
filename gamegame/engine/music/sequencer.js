export const SECTION_BEAT_LENGTH = 4;
export const SECTION_MAIN = 'main';
export const SECTION_WIN = 'win';
export const SECTION_LOSE = 'lose';

import { createInstrument, initInstruments, now } from './instruments.js';
import { createComposition } from './composition.js';

class Sequencer {
  #instrument; #comp; #nowMs;
  #bpm; #beatStartMs; #accumulatedBeats; #started;
  #scheduledUntil; #loopTimer;
  #pendingSection; #pendingSectionBeat;
  #queue; #barStartBeat;

  constructor({ instrument, composition, getNowMs = now }) {
    this.#instrument = instrument;
    this.#comp = composition;
    this.#nowMs = getNowMs;

    this.#bpm = 120;
    this.#beatStartMs = 0;      // getNowMs() when current BPM segment started
    this.#accumulatedBeats = 0;    // beats accumulated before current BPM segment
    this.#started = false;

    this.#scheduledUntil = 0;
    this.#loopTimer = null;

    this.#pendingSection = null;
    this.#pendingSectionBeat = null;

    this.#queue = [];             // pending events for current bar, sorted by beatOffset
    this.#barStartBeat = -SECTION_BEAT_LENGTH; // triggers #startBar at first b=0
  }

  getBpm() { return this.#bpm; }

  setBpm(bpm) {
    if (this.#started && bpm !== this.#bpm) this.#snapshotBeat();
    this.#bpm = bpm;
  }

  #snapshotBeat() {
    this.#accumulatedBeats = this.getGlobalBeat();
    this.#beatStartMs = this.#nowMs();
  }

  getGlobalBeat() {
    if (!this.#started) return 0;
    return this.#accumulatedBeats + (this.#nowMs() - this.#beatStartMs) * (this.#bpm / 60000);
  }

  beatsToMs(beats) { return (beats / this.#bpm) * 60000; }

  beatToTimeMs(b) {
    return this.#beatStartMs + this.beatsToMs(b - this.#accumulatedBeats);
  }

  initAudio() { initInstruments(); this.start(); }
  pause() {
    clearTimeout(this.#loopTimer);
  }

  resume() {
    if (this.#started) this.#tick();
  }

  start() {
    if (this.#started) return;
    this.#started = true;
    this.#beatStartMs = this.#nowMs();
    this.#tick();
  }

  /** @returns {number} bar end time (ms) */
  soundWin() {
    return this.#queueSection(SECTION_WIN);
  }

  /** @returns {number} bar end time (ms) */
  soundLose() {
    return this.#queueSection(SECTION_LOSE);
  }

  soundTap() {
    this.#comp.buildTap().forEach(e => {
      const dur = e.dur * (60000 / this.#bpm);
      this.#instrument.playEvent(e, this.#nowMs(), dur);
    });
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
    this.#queue.push(...this.#comp.buildBar(section).map(e => ({...e, t: beat + e.beatOffset })).sort((a, b) => a.beatOffset - b.beatOffset));
  }

  #tick() {
    const beatNow = this.getGlobalBeat();
    const scheduleTo = beatNow + 1;
    const s16beat = 0.25;
    const msPerBeat = 60000 / this.#bpm;
    const swingMs = msPerBeat * 0.25 * 0.18;

    for (let b = Math.ceil(this.#scheduledUntil); b < scheduleTo; b += s16beat) {
      // Section transition — start new bar immediately
      if (this.#pendingSection !== null && b >= this.#pendingSectionBeat) {
        this.#startBar(this.#pendingSectionBeat, this.#pendingSection);
        this.#pendingSection = null;
        this.#pendingSectionBeat = null;
      }
      // Bar boundary — start next bar
      else if (b >= this.#barStartBeat + SECTION_BEAT_LENGTH) {
        this.#startBar(b, SECTION_MAIN);
      }

      // Consume queued events at this step
      while (this.#queue.length > 0 && this.#queue[0].t <= b + 1e-9) {
        const e = this.#queue.shift();
        const swing = (Math.round(e.beatOffset * 4) % 2 === 1) ? swingMs : 0;
        const t = this.beatToTimeMs(e.t) + swing;
        const dur = e.dur !== undefined ? e.dur * msPerBeat : undefined;
        this.#instrument.playEvent(e, t, dur);
      }
    }

    this.#scheduledUntil = scheduleTo;
    this.#loopTimer = setTimeout(() => this.#tick(), 50);
  }

  getMusicState() {
    return {

      nextSection: this.#pendingSection,
      nextSectionBeat: this.#pendingSectionBeat,
      bpm: this.#bpm,
    };
  }
}

export function createMusic() {
  const instrument = createInstrument();
  const composition = createComposition();
  return new Sequencer({ instrument, composition });
}

export { Sequencer, createComposition };
