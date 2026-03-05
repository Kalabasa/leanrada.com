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

/**
 * Section event with pitch as scale degree relative to chord root.
 * `degree` is resolved to `freq` at build time via getScaleNote(octave + chordRoot + degree).
 * Drum events (kick/snare/ghost/hat/open_hat/roll_hit) omit degree.
 *
 * @typedef {Object} SectionEvent
 * @property {string} type
 * @property {number} at - beat offset
 * @property {number} [degree] - scale index offset from chord root
 * @property {number} [octave] - octave offset into scaleNotes (default 5)
 * @property {number} [dur] - duration in beats
 * @property {string} [wave] - OscillatorType
 * @property {number} [vol] - gain 0–1
 * @property {string} [bus]
 * @property {number} [step]
 */

const PENTATONIC = [0, 2, 4, 7, 9]; // major pentatonic semitone intervals
const ROOT_FREQS = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196]; // A2..G3

// Good melodic intervals in the pentatonic scale (steps of scale-note index)
const VOICE_LEAD_STEPS = [1, 2, 3, -1, -2, -3, 4, -4]; // prefer steps/thirds, allow 4ths

/** @type {Record<string, SectionEvent[]>} */
const SECTIONS = {
  main_a: [
    { type: 'kick',     at: 0 },
    { type: 'kick',     at: 0.75 },
    { type: 'kick',     at: 1.5 },
    { type: 'kick',     at: 2.5 },
    { type: 'kick',     at: 2.75 },
    { type: 'snare',    at: 1 },
    { type: 'snare',    at: 3 },
    { type: 'ghost',    at: 1.25 },
    { type: 'ghost',    at: 1.75 },
    { type: 'ghost',    at: 3.25 },
    { type: 'hat',      at: 0 },
    { type: 'hat',      at: 0.5 },
    { type: 'hat',      at: 1 },
    { type: 'hat',      at: 1.5 },
    { type: 'hat',      at: 2 },
    { type: 'hat',      at: 2.5 },
    { type: 'hat',      at: 3 },
    { type: 'hat',      at: 3.5 },
    { type: 'open_hat', at: 1.5 },
    { type: 'open_hat', at: 3.5 },
    { type: 'bass',     at: 0,    degree: 0 },
    { type: 'bass',     at: 0.75, degree: 0 },
    { type: 'bass',     at: 1.5,  degree: 2 },
    { type: 'bass',     at: 2,    degree: 0 },
    { type: 'bass',     at: 2.75, degree: 4 },
    { type: 'bass',     at: 3.25, degree: 0 },
    { type: 'chop',     at: 1.5 },
    { type: 'chop',     at: 3.5 },
    { type: 'riff',     at: 0 }, // marker — expanded randomly at build time
  ],
  main_b: [
    { type: 'kick',     at: 0 },
    { type: 'kick',     at: 2 },
    { type: 'kick',     at: 2.75 },
    { type: 'kick',     at: 3.5 },
    { type: 'snare',    at: 1 },
    { type: 'snare',    at: 3 },
    { type: 'ghost',    at: 0.5 },
    { type: 'ghost',    at: 1.5 },
    { type: 'ghost',    at: 2.5 },
    { type: 'hat',      at: 0 },
    { type: 'hat',      at: 0.5 },
    { type: 'hat',      at: 1 },
    { type: 'hat',      at: 1.5 },
    { type: 'hat',      at: 2 },
    { type: 'hat',      at: 2.5 },
    { type: 'hat',      at: 3 },
    { type: 'hat',      at: 3.5 },
    { type: 'open_hat', at: 0.5 },
    { type: 'open_hat', at: 2.5 },
    { type: 'bass',     at: 0,    degree: 0 },
    { type: 'bass',     at: 1.5,  degree: 1 },
    { type: 'bass',     at: 2,    degree: 2 },
    { type: 'bass',     at: 2.75, degree: 0 },
    { type: 'bass',     at: 3.5,  degree: 3 },
    { type: 'chop',     at: 0.5 },
    { type: 'chop',     at: 2.5 },
  ],
  win: [
    // dense first 2 beats — celebration
    { type: 'kick',     at: 0 },
    { type: 'kick',     at: 0.5 },
    { type: 'kick',     at: 0.75 },
    { type: 'kick',     at: 1.25 },
    { type: 'kick',     at: 1.75 },
    { type: 'snare',    at: 1 },
    { type: 'snare',    at: 1.5 },
    { type: 'ghost',    at: 0.25 },
    { type: 'ghost',    at: 0.75 },
    { type: 'ghost',    at: 2.25 },
    { type: 'hat',      at: 0 },
    { type: 'hat',      at: 0.25 },
    { type: 'hat',      at: 0.5 },
    { type: 'hat',      at: 0.75 },
    { type: 'hat',      at: 1 },
    { type: 'hat',      at: 1.25 },
    { type: 'hat',      at: 1.5 },
    { type: 'hat',      at: 1.75 },
    { type: 'hat',      at: 2 },
    { type: 'hat',      at: 2.25 },
    { type: 'hat',      at: 2.5 },
    { type: 'hat',      at: 2.75 },
    // beat 3–4: open hats + roll — anticipation
    { type: 'open_hat', at: 3 },
    { type: 'open_hat', at: 3.5 },
    { type: 'bass',     at: 0,    degree: 0 },
    { type: 'bass',     at: 0.5,  degree: 4 },
    { type: 'bass',     at: 1,    degree: 2 },
    { type: 'bass',     at: 1.75, degree: 5 },
    { type: 'chop',     at: 0.25 },
    { type: 'chop',     at: 0.75 },
    { type: 'chop',     at: 1.25 },
    { type: 'chop',     at: 1.75 },
    { type: 'chop',     at: 2.25 },
    // melody: leap up, step back, quick bouncy fill at the top
    { type: 'tone', at: 0,    degree: 7, octave: 7, dur: 0.22, wave: 'triangle', vol: 0.22 },
    { type: 'tone', at: 0.5,  degree: 4, octave: 7, dur: 0.22, wave: 'triangle', vol: 0.22 },
    { type: 'tone', at: 1,    degree: 9, octave: 7, dur: 0.22, wave: 'triangle', vol: 0.22 },
    { type: 'tone', at: 1.25, degree: 7, octave: 7, dur: 0.22, wave: 'triangle', vol: 0.22 },
    { type: 'tone', at: 1.5,  degree: 4, octave: 7, dur: 0.22, wave: 'triangle', vol: 0.22 },
    { type: 'tone', at: 1.75, degree: 5, octave: 7, dur: 0.22, wave: 'triangle', vol: 0.22 },
    { type: 'roll_hit', at: 3,    step: 0 },
    { type: 'roll_hit', at: 3.25, step: 1 },
    { type: 'roll_hit', at: 3.5,  step: 2 },
    { type: 'roll_hit', at: 3.75, step: 3 },
  ],
  lose: [
    // dense first 2 beats — commiseration
    { type: 'kick',     at: 0 },
    { type: 'kick',     at: 0.75 },
    { type: 'kick',     at: 1.25 },
    { type: 'kick',     at: 2 },
    { type: 'snare',    at: 1 },
    { type: 'snare',    at: 1.75 },
    { type: 'ghost',    at: 0.5 },
    { type: 'ghost',    at: 1.5 },
    { type: 'ghost',    at: 2.5 },
    { type: 'hat',      at: 0 },
    { type: 'hat',      at: 0.25 },
    { type: 'hat',      at: 0.5 },
    { type: 'hat',      at: 0.75 },
    { type: 'hat',      at: 1 },
    { type: 'hat',      at: 1.25 },
    { type: 'hat',      at: 1.5 },
    { type: 'hat',      at: 1.75 },
    { type: 'hat',      at: 2 },
    { type: 'hat',      at: 2.25 },
    { type: 'hat',      at: 2.5 },
    { type: 'hat',      at: 2.75 },
    // beat 3–4: open hats + roll — anticipation
    { type: 'open_hat', at: 3 },
    { type: 'open_hat', at: 3.5 },
    { type: 'bass',     at: 0,    degree: 4 },
    { type: 'bass',     at: 0.75, degree: 2 },
    { type: 'bass',     at: 1.25, degree: 3 },
    { type: 'bass',     at: 2,    degree: 0 },
    { type: 'chop',     at: 0 },
    { type: 'chop',     at: 0.5 },
    { type: 'chop',     at: 1 },
    { type: 'chop',     at: 1.5 },
    { type: 'chop',     at: 2.25 },
    // melody: starts high, dips, briefly lifts, then falls below root
    { type: 'tone', at: 0,   degree: 4,  octave: 6, dur: 0.4, wave: 'sawtooth', vol: 0.12 },
    { type: 'tone', at: 0.5, degree: 1,  octave: 6, dur: 0.4, wave: 'sawtooth', vol: 0.12 },
    { type: 'tone', at: 1,   degree: 3,  octave: 6, dur: 0.4, wave: 'sawtooth', vol: 0.12 },
    { type: 'tone', at: 1.5, degree: 2,  octave: 6, dur: 0.4, wave: 'sawtooth', vol: 0.12 },
    { type: 'tone', at: 2,   degree: -1, octave: 6, dur: 0.4, wave: 'sawtooth', vol: 0.12 },
    { type: 'roll_hit', at: 3,    step: 0 },
    { type: 'roll_hit', at: 3.25, step: 1 },
    { type: 'roll_hit', at: 3.5,  step: 2 },
    { type: 'roll_hit', at: 3.75, step: 3 },
  ],
};

export function createComposition() {
  let scaleRoot = 0; // Hz, set on initScale
  let semitonesUp = 0; // -1–3, up on win, down on lose
  let scaleNotes = [];
  let chordIndex = 0;
  let mainBarCount = 0;
  let chordProgression = [0, 3, 4, 2]; // initial: I IV V iii
  let progressionBarsLeft = 0;
  let shiftPending = 0; // +1 on win, -1 on lose, applied at next main bar

  function generateProgression(startRoot) {
    const prog = [startRoot];
    for (let i = 1; i < 4; i++) {
      const prev = prog[i - 1];
      const step = VOICE_LEAD_STEPS[Math.floor(Math.random() * VOICE_LEAD_STEPS.length)];
      prog.push(((prev + step) % 5 + 5) % 5);
    }
    return prog;
  }

  function rebuildScale() {
    const root = scaleRoot * Math.pow(2, semitonesUp / 12);
    scaleNotes = [];
    for (let oct = 0; oct < 4; oct++) {
      for (const interval of PENTATONIC) {
        scaleNotes.push(root * Math.pow(2, (oct * 12 + interval) / 12));
      }
    }
  }

  function initScale() {
    scaleRoot = ROOT_FREQS[Math.floor(Math.random() * ROOT_FREQS.length)];
    semitonesUp = 0;
    rebuildScale();
    chordIndex = 0;
    chordProgression = generateProgression(0);
    progressionBarsLeft = 0;
  }

  function getScaleNote(index) {
    if (!scaleNotes.length) return 440;
    return scaleNotes[((index % scaleNotes.length) + scaleNotes.length) % scaleNotes.length];
  }

  function getCurrentChordRoot() {
    return chordProgression[chordIndex % chordProgression.length];
  }

  function resolveEvent(e) {
    const beatOffset = e.at;
    if (e.type === 'chop') {
      const root = getCurrentChordRoot();
      const oct = 5;
      return [root, root + 2, root + 4].map(ni => ({
        type: 'tone', beatOffset, freq: getScaleNote(oct + ni),
        dur: 0.08, wave: 'sawtooth', vol: 0.05,
      }));
    }
    if (e.type === 'bass') {
      return [{ type: 'bass', beatOffset, freq: getScaleNote(getCurrentChordRoot() + e.degree) }];
    }
    if (e.type === 'tone') {
      const oct = e.octave ?? 5;
      return [{ ...e, beatOffset, freq: getScaleNote(oct + getCurrentChordRoot() + e.degree), at: undefined, octave: undefined, degree: undefined }];
    }
    if (e.type === 'hat') {
      // suppress hat where open_hat is present at same beat
      const section = currentSection;
      if (section?.some(o => o.type === 'open_hat' && o.at === e.at)) return [];
    }
    return [{ ...e, beatOffset, at: undefined }];
  }

  function buildRiff() {
    if (!scaleNotes.length) return [];
    const chordRoot = getCurrentChordRoot();
    const oct = 8;
    const offsets = [0, 0.25, 0.75, 1]; // 16th positions
    const pool = [0, 1, 2, 3, 4].map(i => chordRoot + i);
    return offsets.map((beatOffset, i) => {
      const ni = pool[Math.min(i + Math.floor(Math.random() * 2), pool.length - 1)];
      return { type: 'tone', beatOffset, freq: getScaleNote(oct + ni), dur: 1.8 / 4, wave: 'sine', vol: 0.1, bus: 'drum' };
    });
  }

  let currentSection = null;

  /** @returns {MusicEvent[]} */
  function buildBar(section) {
    if (!scaleNotes.length) initScale();
    if (section === 'win') {
      shiftPending = 1;
    } else if (section === 'lose') {
      shiftPending = -1;
    } else if (section === 'main') {
      if (shiftPending !== 0 || progressionBarsLeft <= 0) {
        semitonesUp = Math.max(-1, Math.min(3, semitonesUp + shiftPending));
        rebuildScale();
        const lastRoot = chordProgression[chordIndex % chordProgression.length];
        chordProgression = generateProgression(lastRoot);
        progressionBarsLeft = 4 + Math.floor(Math.random() * 3);
        shiftPending = 0;
      }
      progressionBarsLeft--;
    }
    chordIndex++;
    const events = [];

    if (section === 'main') {
      const sectionKey = (mainBarCount % 2 === 0) ? 'main_a' : 'main_b';
      currentSection = SECTIONS[sectionKey];
      for (const e of currentSection) {
        if (e.type === 'riff') { events.push(...buildRiff()); continue; }
        events.push(...resolveEvent(e));
      }
      mainBarCount++;
    } else {
      currentSection = SECTIONS[section];
      for (const e of currentSection) {
        events.push(...resolveEvent(e));
      }
    }

    currentSection = null;
    return events;
  }

  function buildTap() {
    if (!scaleNotes.length) return [];
    const idx = Math.floor(scaleNotes.length / 2) +
      Math.floor(Math.random() * Math.ceil(scaleNotes.length / 2));
    return [{ type: 'tone', beatOffset: 0, freq: getScaleNote(idx), dur: 0.04, wave: 'square', vol: 0.1 }];
  }

  return { buildBar, buildTap };
}
