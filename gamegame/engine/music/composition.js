// gamegame composition — scales, chords, bar patterns, riff builders
// Pure musical knowledge: no AudioContext, no scheduling.

// ============================================================
// Scale / Key
// ============================================================

const PENTATONIC = [0, 2, 4, 7, 9]; // major pentatonic semitone intervals
const ROOT_FREQS = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196]; // A2..G3

export function createComposition() {
  let scaleNotes = [];
  let chordIndex = 0;

  function changeBassRoot() {
    const root = ROOT_FREQS[Math.floor(Math.random() * ROOT_FREQS.length)];
    scaleNotes = [];
    for (let oct = 0; oct < 4; oct++) {
      for (const interval of PENTATONIC) {
        scaleNotes.push(root * Math.pow(2, (oct * 12 + interval) / 12));
      }
    }
    chordIndex = 0;
  }

  function getScaleNote(index) {
    if (!scaleNotes.length) return 440;
    return scaleNotes[((index % scaleNotes.length) + scaleNotes.length) % scaleNotes.length];
  }

  // Chord roots as scale-note indices: I IV V iii
  const CHORD_ROOTS = [0, 3, 4, 2];

  function getCurrentChordRoot() {
    return CHORD_ROOTS[chordIndex % CHORD_ROOTS.length];
  }

  function getCurrentChordNotes() {
    const root = getCurrentChordRoot();
    return [root, root + 2, root + 4];
  }

  function advanceChord() {
    chordIndex++;
  }

  // ============================================================
  // Event builders — return arrays of event objects
  // Callers add `t` offset as needed.
  // ============================================================

  /** Groove riff: 4-note syncopated melody at bar start. Returns tone events. */
  function buildRiff(bpm) {
    if (!scaleNotes.length) return [];
    const s16 = (60 / bpm) * 0.25;
    const chordRoot = getCurrentChordRoot();
    const oct = 8;
    const offsets = [0, 1, 3, 4];
    const pool = [0, 1, 2, 3, 4].map(i => chordRoot + i);
    return offsets.map((o, i) => {
      const ni = pool[Math.min(i + Math.floor(Math.random() * 2), pool.length - 1)];
      return {
        type: 'tone', dt: o * s16,
        freq: getScaleNote(oct + ni),
        dur: s16 * 1.8, wave: 'sine', vol: 0.1, bus: 'drum',
      };
    });
  }

  /** Win riff: ascending 4-note phrase. */
  function buildWinRiff(bpm) {
    if (!scaleNotes.length) return [];
    const eighth = (60 / bpm) / 2;
    const chordRoot = getCurrentChordRoot();
    const oct = 7;
    return [chordRoot, chordRoot + 2, chordRoot + 4, chordRoot + 5].map((ni, i) => ({
      type: 'tone', dt: i * eighth,
      freq: getScaleNote(oct + ni),
      dur: eighth, wave: 'sine', vol: 0.15,
    }));
  }

  /** Lose riff: descending 3-note phrase. */
  function buildLoseRiff(bpm) {
    if (!scaleNotes.length) return [];
    const eighth = (60 / bpm) / 2;
    const chordRoot = getCurrentChordRoot();
    const oct = 6;
    return [chordRoot + 3, chordRoot + 1, chordRoot].map((ni, i) => ({
      type: 'tone', dt: i * eighth,
      freq: getScaleNote(oct + ni),
      dur: eighth * 1.8, wave: 'sawtooth', vol: 0.1,
    }));
  }

  /** Roll: 4 crescendo snare hits ending at `endT`. Returns roll_hit events with absolute `t`. */
  function buildRoll(endT, bpm) {
    const s16 = (60 / bpm) * 0.25;
    return [0, 1, 2, 3].map(i => ({
      type: 'roll_hit',
      t: endT - (4 - i) * s16,
      step: i,
    }));
  }

  /** Bass note event (dt = offset from bar start). */
  function buildBassNote(scaleOffset, bpm) {
    const chordRoot = getCurrentChordRoot();
    return {
      type: 'bass',
      freq: getScaleNote(chordRoot + scaleOffset),
    };
  }

  /** Chord chop events at a single time. */
  function buildChop() {
    const notes = getCurrentChordNotes();
    const oct = 5;
    return [{ type: 'chop', freqs: notes.map(ni => getScaleNote(oct + ni)) }];
  }

  /** Tap sound: random note from upper half of scale. */
  function buildTap() {
    if (!scaleNotes.length) return [];
    const idx = Math.floor(scaleNotes.length / 2) +
      Math.floor(Math.random() * Math.ceil(scaleNotes.length / 2));
    return [{ type: 'tone', dt: 0, freq: getScaleNote(idx), dur: 0.08, wave: 'square', vol: 0.1 }];
  }

  // TODO Do not expose individual elements, only bars.
  return {
    changeBassRoot,
    getScaleNote,
    advanceChord,
    buildRiff,
    buildWinRiff,
    buildLoseRiff,
    buildRoll,
    buildBassNote,
    buildChop,
    buildTap,
  };
}

// ============================================================
// Bar pattern definitions
// ============================================================
// 16th-note positions (0–15) per 4-beat bar.

export const BARS = {
  main_a: {
    kick:     new Set([0, 3, 6, 10, 11]),
    snare:    new Set([4, 12]),
    ghost:    new Set([5, 7, 13]),
    hat:      new Set([0, 2, 4, 6, 8, 10, 12, 14]),
    open_hat: new Set([6, 14]),
    bass:     new Map([[0, 0], [3, 0], [6, 2], [8, 0], [11, 4], [13, 0]]),
    chop:     new Set([6, 14]),
    riff:     true,
  },
  main_b: {
    kick:     new Set([0, 8, 11, 14]),
    snare:    new Set([4, 12]),
    ghost:    new Set([2, 6, 10]),
    hat:      new Set([0, 2, 4, 6, 8, 10, 12, 14]),
    open_hat: new Set([2, 10]),
    bass:     new Map([[0, 0], [6, 1], [8, 2], [11, 0], [14, 3]]),
    chop:     new Set([2, 10]),
    riff:     false,
  },
  win: {
    kick:     new Set([0, 8]),
    snare:    new Set([4]),
    ghost:    new Set([]),
    hat:      new Set([0, 2, 4, 6, 8, 10]),
    open_hat: new Set([6]),
    bass:     new Map([]),
    chop:     new Set([]),
  },
  lose: {
    kick:     new Set([0]),
    snare:    new Set([4, 10]),
    ghost:    new Set([6]),
    hat:      new Set([0, 4, 8]),
    open_hat: new Set([]),
    bass:     new Map([]),
    chop:     new Set([]),
  },
};
