/**
 * @typedef {Object} MusicEvent
 * @property {string} type - 'kick'|'snare'|'ghost'|'hat'|'open_hat'|'bass'|'tone'|'roll_hit'
 * @property {number} beatOffset - beat offset within bar
 * @property {number} [freq] - Hz
 * @property {number} [dur] - duration in beats
 * @property {string} [wave] - OscillatorType
 * @property {number} [vol] - gain 0–1
 * @property {string} [bus] - audio bus name
 * @property {number} [step] - roll step index
 */

const PENTATONIC = [0, 2, 4, 7, 9]; // major pentatonic semitone intervals
const ROOT_FREQS = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196]; // A2..G3

const BARS = {
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
    //                beat: 0  1  2  3  (s16: 0..15)
    kick:     new Set([0, 2, 3, 5, 7]),     // dense first half, drops off
    snare:    new Set([4, 6]),               // snappy early
    ghost:    new Set([1, 3, 9]),
    hat:      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), // 16ths die off at beat 3
    open_hat: new Set([12, 14]),             // beat 3-4: open hats build tension
    bass:     new Map([[0, 0], [2, 4], [4, 2], [7, 5]]),
    chop:     new Set([1, 3, 5, 7, 9]),     // syncopated stabs, stops before roll
    riff:     false,
  },
  lose: {
    kick:     new Set([0, 3, 5, 8]),
    snare:    new Set([4, 7]),
    ghost:    new Set([2, 6, 10]),
    hat:      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
    open_hat: new Set([12, 14]),             // same anticipation gap
    bass:     new Map([[0, 4], [3, 2], [5, 3], [8, 0]]),
    chop:     new Set([0, 2, 4, 6, 9]),
    riff:     false,
  },
};

export function createComposition() {
  let scaleNotes = [];
  let chordIndex = 0;
  let mainBarCount = 0; // tracks main bar count for riff cadence and a/b alternation

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

  function buildDrumEvents(bar) {
    const events = [];
    for (const s16 of bar.kick)     events.push({ type: 'kick',     beatOffset: s16 / 4 });
    for (const s16 of bar.snare)    events.push({ type: 'snare',    beatOffset: s16 / 4 });
    for (const s16 of bar.ghost)    events.push({ type: 'ghost',    beatOffset: s16 / 4 });
    for (const s16 of bar.open_hat) events.push({ type: 'open_hat', beatOffset: s16 / 4 });
    // Hat only where open_hat isn't
    for (const s16 of bar.hat) {
      if (!bar.open_hat.has(s16)) events.push({ type: 'hat', beatOffset: s16 / 4 });
    }
    return events;
  }

  function buildBassEvents(bar) {
    const events = [];
    const chordRoot = getCurrentChordRoot();
    for (const [s16, scaleOffset] of bar.bass) {
      events.push({ type: 'bass', beatOffset: s16 / 4, freq: getScaleNote(chordRoot + scaleOffset) });
    }
    return events;
  }

  function buildChopEvents(bar) {
    const events = [];
    const notes = getCurrentChordNotes();
    const oct = 5;
    const freqs = notes.map(ni => getScaleNote(oct + ni));
    for (const s16 of bar.chop) {
      for (const freq of freqs) {
        events.push({ type: 'tone', beatOffset: s16 / 4, freq, dur: 0.08, wave: 'sawtooth', vol: 0.05 });
      }
    }
    return events;
  }

  function buildRiff() {
    if (!scaleNotes.length) return [];
    const chordRoot = getCurrentChordRoot();
    const oct = 8;
    const offsets = [0, 1, 3, 4]; // 16th positions
    const pool = [0, 1, 2, 3, 4].map(i => chordRoot + i);
    return offsets.map((o, i) => {
      const ni = pool[Math.min(i + Math.floor(Math.random() * 2), pool.length - 1)];
      return {
        type: 'tone', beatOffset: o / 4,
        freq: getScaleNote(oct + ni),
        dur: 1.8 / 4, wave: 'sine', vol: 0.1, bus: 'drum',
      };
    });
  }

  function buildWinRiff() {
    if (!scaleNotes.length) return [];
    const chordRoot = getCurrentChordRoot();
    const oct = 7;
    // leap up, step back, quick bouncy fill at the top
    const notes   = [chordRoot + 7, chordRoot + 4, chordRoot + 9, chordRoot + 7, chordRoot + 4, chordRoot + 5];
    const offsets = [0,             0.5,           1,             1.25,          1.5,           1.75];
    return notes.map((ni, i) => ({
      type: 'tone', beatOffset: offsets[i],
      freq: getScaleNote(oct + ni),
      dur: 0.22, wave: 'triangle', vol: 0.22,
    }));
  }

  function buildLoseRiff() {
    if (!scaleNotes.length) return [];
    const chordRoot = getCurrentChordRoot();
    const oct = 6;
    // starts high, dips, briefly lifts, then falls below root
    const notes   = [chordRoot + 4, chordRoot + 1, chordRoot + 3, chordRoot + 2, chordRoot - 1];
    const offsets = [0,             0.5,           1,             1.5,           2.0];
    return notes.map((ni, i) => ({
      type: 'tone', beatOffset: offsets[i],
      freq: getScaleNote(oct + ni),
      dur: 0.4, wave: 'sawtooth', vol: 0.12,
    }));
  }

  function buildRoll(barDur) {
    return [0, 1, 2, 3].map(i => ({
      type: 'roll_hit',
      beatOffset: barDur - (4 - i) / 4,
      step: i,
    }));
  }

  /** @returns {MusicEvent[]} */
  function buildBar(section) {
    const events = [];

    if (section === 'main') {
      const barKey = (mainBarCount % 2 === 0) ? 'main_a' : 'main_b';
      const bar = BARS[barKey];
      chordIndex++;
      events.push(...buildDrumEvents(bar));
      events.push(...buildBassEvents(bar));
      events.push(...buildChopEvents(bar));
      if (bar.riff) {
        events.push(...buildRiff());
      }
      mainBarCount++;
    } else if (section === 'win') {
      const bar = BARS.win;
      chordIndex++;
      events.push(...buildDrumEvents(bar));
      events.push(...buildWinRiff());
      events.push(...buildRoll(4));
    } else if (section === 'lose') {
      const bar = BARS.lose;
      chordIndex++;
      events.push(...buildDrumEvents(bar));
      events.push(...buildLoseRiff());
      events.push(...buildRoll(4));
    }

    return events;
  }

  function buildTap() {
    if (!scaleNotes.length) return [];
    const idx = Math.floor(scaleNotes.length / 2) +
      Math.floor(Math.random() * Math.ceil(scaleNotes.length / 2));
    return [{ type: 'tone', beatOffset: 0, freq: getScaleNote(idx), dur: 0.04, wave: 'square', vol: 0.1 }];
  }

  return {
    changeBassRoot,
    buildBar,
    buildTap,
  };
}
