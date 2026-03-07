import { createInstrument } from './instrument.js';

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
    { type: 'riff',     at: 0 },
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
    { type: 'tone',     at: 0,    degree: 7, octave: 7, dur: 0.22, vol: 0.22 },
    { type: 'tone',     at: 0.5,  degree: 4, octave: 7, dur: 0.22, vol: 0.22 },
    { type: 'tone',     at: 1,    degree: 9, octave: 7, dur: 0.22, vol: 0.22 },
    { type: 'tone',     at: 1.25, degree: 7, octave: 7, dur: 0.22, vol: 0.22 },
    { type: 'tone',     at: 1.5,  degree: 4, octave: 7, dur: 0.22, vol: 0.22 },
    { type: 'tone',     at: 1.75, degree: 5, octave: 7, dur: 0.22, vol: 0.22 },
    { type: 'roll_hit', at: 3,    step: 0 },
    { type: 'roll_hit', at: 3.25, step: 1 },
    { type: 'roll_hit', at: 3.5,  step: 2 },
    { type: 'roll_hit', at: 3.75, step: 3 },
  ],
  lose: [
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
    { type: 'tone',     at: 0,   degree: 4,  octave: 6, dur: 0.4, vol: 0.12 },
    { type: 'tone',     at: 0.5, degree: 1,  octave: 6, dur: 0.4, vol: 0.12 },
    { type: 'tone',     at: 1,   degree: 3,  octave: 6, dur: 0.4, vol: 0.12 },
    { type: 'tone',     at: 1.5, degree: 2,  octave: 6, dur: 0.4, vol: 0.12 },
    { type: 'tone',     at: 2,   degree: -1, octave: 6, dur: 0.4, vol: 0.12 },
    { type: 'roll_hit', at: 3,    step: 0 },
    { type: 'roll_hit', at: 3.25, step: 1 },
    { type: 'roll_hit', at: 3.5,  step: 2 },
    { type: 'roll_hit', at: 3.75, step: 3 },
  ],
};

export function createComposer() {
  const instruments = {
    kick:     createInstrument({ type: 'noise', timbre: 0,    sustain: 0.1 }),
    kickTone: createInstrument({ type: 'triangle', timbre: 0,    sustain: 0.1 }),
    snare:    createInstrument({ type: 'noise', timbre: 0.3,  sustain: 0.2 }),
    hat:      createInstrument({ type: 'noise', timbre: 0.7,  sustain: 0.1 }),
    open_hat: createInstrument({ type: 'noise', timbre: 0.5,  sustain: 0.6 }),
    bass:     createInstrument({ type: 'triangle', timbre: 1,   sustain: 0.1 }),
    chop:     createInstrument({ type: 'triangle', timbre: 0, sustain: 0.1 }),
    tone:     createInstrument({ type: 'triangle', timbre: 0, sustain: 0.5 }),
    roll:     createInstrument({ type: 'noise', timbre: 0.9,  sustain: 0.3 }),
    riff:     createInstrument({ type: 'triangle', timbre: 0, sustain: 0.3 }),
    tap:      createInstrument({ type: 'square', timbre: 0,   sustain: 0.2 }),
  };

  let scaleRoot = 0;
  let semitonesUp = 0;
  let scaleNotes = [];
  let chordIndex = 0;
  let mainBarCount = 0;
  let chordProgression = [0, 3, 4, 2]; // I IV V iii
  let progressionBarsLeft = 0;
  let shiftPending = 0;

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

    const sectionKey = section === 'main' ? (mainBarCount % 2 === 0 ? 'main_a' : 'main_b') : section;
    if (section === 'main') mainBarCount++;

    const sectionEvents = SECTIONS[sectionKey];
    const events = [];
    for (const e of sectionEvents) {
      if (e.type === 'hat' && sectionEvents.some(o => o.type === 'open_hat' && o.at === e.at)) continue;
      if (e.type === 'riff') { events.push(...buildRiff(e.at)); continue; }
      events.push(...resolveEvent(e));
    }
    return events;
  }

  function buildTap() {
    if (!scaleNotes.length) return [];
    const idx = Math.floor(scaleNotes.length / 2) +
      Math.floor(Math.random() * Math.ceil(scaleNotes.length / 2));
    return [{ instrument: instruments.tap, beatOffset: 0, note: freqToNote(getScaleNote(idx)), dur: 0.04, vol: 0.1 }];
  }

  function resolveEvent(e) {
    const beatOffset = e.at;
    const chordRoot = chordProgression[chordIndex % chordProgression.length];
    if (e.type === 'chop') {
      const oct = 5;
      return [chordRoot, chordRoot + 2, chordRoot + 4].map(ni => ({
        instrument: instruments.chop, beatOffset,
        note: freqToNote(getScaleNote(oct + ni)), dur: 0.08, vol: 0.5,
      }));
    }
    if (e.type === 'bass') {
      return [
        { instrument: instruments.bass, beatOffset, note: freqToNote(getScaleNote(chordRoot + e.degree) / 4), dur: 0.4, vol: 0.3 },
        { instrument: instruments.bass, beatOffset, note: freqToNote(getScaleNote(chordRoot + e.degree) / 2), dur: 0.1, vol: 0.1 }
      ];
    }
    if (e.type === 'tone') {
      const oct = e.octave ?? 5;
      return [{ instrument: instruments.tone, beatOffset, note: freqToNote(getScaleNote(oct + chordRoot + e.degree)), dur: e.dur ?? 0.25, vol: e.vol ?? 0.15 }];
    }
    if (e.type === 'roll_hit') {
      return [{ instrument: instruments.roll, beatOffset, note: 49 + e.step, dur: 0.1, vol: 0.7 }]; // rising cymbal
    }
    // TODO: Make drums normal like the others
    // drums: kick, snare, ghost, hat, open_hat
    const drumNotes = { kick: 36, snare: 38, ghost: 38, hat: 42, open_hat: 46 };
    const drumGains = { kick: 0.9, snare: 0.7, ghost: 0.25, hat: 0.5, open_hat: 0.6 };
    const inst = e.type === 'ghost' ? instruments.snare : instruments[e.type];
    const events = [{ instrument: inst, beatOffset, note: drumNotes[e.type], dur: 0.05, vol: drumGains[e.type] }];
    if (e.type === 'kick') {
      events.push({ instrument: instruments.kickTone, beatOffset, note: 30, dur: 0.2, vol: 0.9 });
    }
    return events;
  }

  function buildRiff(beatOffset) {
    if (!scaleNotes.length) return [];
    const chordRoot = chordProgression[chordIndex % chordProgression.length];
    const oct = 8;
    const offsets = [0, 0.25, 0.75, 1]; // 16th positions
    const pool = [0, 1, 2, 3, 4].map(i => chordRoot + i);
    return offsets.map((offsetWithinRiff, i) => {
      const ni = pool[Math.min(i + Math.floor(Math.random() * 2), pool.length - 1)];
      return { instrument: instruments.riff, beatOffset: beatOffset + offsetWithinRiff, note: freqToNote(getScaleNote(oct + ni)), dur: 0.45, vol: 0.1 };
    });
  }

  function initScale() {
    scaleRoot = ROOT_FREQS[Math.floor(Math.random() * ROOT_FREQS.length)];
    semitonesUp = 0;
    rebuildScale();
    chordIndex = 0;
    chordProgression = generateProgression(0);
    progressionBarsLeft = 0;
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

  function generateProgression(startRoot) {
    const prog = [startRoot];
    for (let i = 1; i < 4; i++) {
      const prev = prog[i - 1];
      const step = VOICE_LEAD_STEPS[Math.floor(Math.random() * VOICE_LEAD_STEPS.length)];
      prog.push(((prev + step) % 5 + 5) % 5);
    }
    return prog;
  }

  function getScaleNote(index) {
    if (!scaleNotes.length) return 440;
    return scaleNotes[((index % scaleNotes.length) + scaleNotes.length) % scaleNotes.length];
  }

  return { buildBar, buildTap };
}

// TODO: Delete this.
function freqToNote(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}
