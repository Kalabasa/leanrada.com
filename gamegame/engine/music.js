// gamegame music — audio context, beat clock, drums, sound effects

// ============================================================
// Audio Context
// ============================================================

let audioCtx = null;
export function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
export function getAudioCtx() { return audioCtx; }

export function initAudio() { ensureAudioCtx().resume(); }
export function pauseAudio() { if (audioCtx) audioCtx.suspend(); }
export function resumeAudio() { if (audioCtx) audioCtx.resume(); }

// ============================================================
// Beat Clock (global, persists across games)
// ============================================================

let globalBpm = 120;
let globalBeatStart = 0; // audioCtx.currentTime when current BPM segment started
let accumulatedBeats = 0; // beats accumulated before current BPM segment
let beatClockStarted = false;

// rename to get/setGlobalBpm
export function getBpm() { return globalBpm; }
export function setBpm(bpm) {
  if (beatClockStarted && bpm !== globalBpm) {
    accumulatedBeats = getGlobalBeat();
    globalBeatStart = audioCtx.currentTime;
  }
  globalBpm = bpm;
}

export function getGlobalBeat() {
  if (!beatClockStarted) return 0;
  const elapsed = audioCtx.currentTime - globalBeatStart;
  return accumulatedBeats + (elapsed / 60) * globalBpm;
}

export function startBeatClock() {
  if (beatClockStarted) return;
  beatClockStarted = true;
  globalBeatStart = audioCtx.currentTime;
  scheduleDrums();
}

export function beatsToMs(beats) {
  return (beats / globalBpm) * 60000;
}

/** Convert a global beat number to audioCtx.currentTime */
export function beatToTime(b) {
  return globalBeatStart + ((b - accumulatedBeats) / globalBpm) * 60;
}

/** audioCtx.currentTime of the next beat boundary */
export function nextBeatTime() {
  const beat = getGlobalBeat();
  const nextBeat = Math.ceil(beat + 0.01);
  return beatToTime(nextBeat);
}

/** ms until the next beat boundary */
export function msUntilNextBeat() {
  return Math.max(0, (nextBeatTime() - audioCtx.currentTime) * 1000);
}

// ============================================================
// Music — procedural beat-locked drums
// ============================================================

let drumsScheduledUntil = 0;
let drumLoopTimer = null;
let drumsMuted = false;
let bassRoot = 110;
let drumBus = null;

function getDrumBus() {
  if (!drumBus) {
    drumBus = ensureAudioCtx().createGain();
    drumBus.connect(audioCtx.destination);
  }
  return drumBus;
}

export function muteDrums() { drumsMuted = true; }
export function unmuteDrums() { drumsMuted = false; }

export function scheduleDrums() {
  if (!audioCtx) return;
  if (drumsMuted) {
    drumsScheduledUntil = getGlobalBeat();
    drumLoopTimer = setTimeout(scheduleDrums, 100);
    return;
  }
  const lookAhead = 0.2;
  const now = audioCtx.currentTime;
  const beatNow = getGlobalBeat();
  const scheduleTo = beatNow + (globalBpm / 60) * lookAhead + 2;

  for (let b = Math.max(Math.ceil(drumsScheduledUntil * 2) / 2, 0); b < scheduleTo; b += 0.5) {
    const t = beatToTime(b);
    if (t < now - 0.01) continue;
    const beatInBar = ((b % 4) + 4) % 4;

    if (beatInBar === 0 || beatInBar === 2) {
      playDrum(t, 'kick');
    }
    if (beatInBar === 1 || beatInBar === 3) {
      playDrum(t, 'snare');
    }
    playDrum(t, 'hat');
  }
  drumsScheduledUntil = scheduleTo;
  drumLoopTimer = setTimeout(scheduleDrums, 100);
}

function playDrum(t, type) {
  if (type === 'kick') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(getDrumBus());
    osc.start(t);
    osc.stop(t + 0.2);
  } else if (type === 'snare') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(getDrumBus());
    osc.start(t);
    osc.stop(t + 0.1);
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(800, t);
    gain2.gain.setValueAtTime(0.08, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc2.connect(gain2);
    gain2.connect(getDrumBus());
    osc2.start(t);
    osc2.stop(t + 0.08);
  } else if (type === 'hat') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(6000 + Math.random() * 2000, t);
    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(getDrumBus());
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export function changeBassRoot() {
  const roots = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196];
  bassRoot = roots[Math.floor(Math.random() * roots.length)];
}

// ============================================================
// Sound helpers
// ============================================================

export function soundTap() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(600 + Math.random() * 400, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.12);
}

export function soundPlay(freq, dur = 0.2, type = 'sine') {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

/** Beat-aligned win melody — scheduled on next beat, plays eighth-note triplet */
export function soundWin() {
  const t = nextBeatTime();
  const eighth = (60 / globalBpm) / 2;
  const notes = [523, 659, 784];
  notes.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t + i * eighth);
    gain.gain.setValueAtTime(0.15, t + i * eighth);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * eighth + eighth * 0.9);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t + i * eighth);
    osc.stop(t + i * eighth + eighth);
  });
}

/** Beat-aligned lose sound — descending on the beat */
export function soundLose() {
  const t = nextBeatTime();
  const eighth = (60 / globalBpm) / 2;
  const notes = [293, 220]; // D4 → A3 descending
  notes.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, t + i * eighth);
    gain.gain.setValueAtTime(0.1, t + i * eighth);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * eighth + eighth * 1.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t + i * eighth);
    osc.stop(t + i * eighth + eighth * 1.8);
  });
}