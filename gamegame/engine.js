// gamegame engine — canvas API, beat clock, input, sound

// ============================================================
// Beat Clock (global, persists across games)
// ============================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let globalBpm = 120;
let globalBeatStart = 0; // audioCtx.currentTime when beat 0 started
let beatClockStarted = false;

let timerMultiplier = 1.0; // user-facing multiplier (for future "hard mode" etc)

function setBpm(bpm) { globalBpm = bpm; }
function getTimerMultiplier() { return timerMultiplier; }
function setTimerMultiplier(m) { timerMultiplier = m; }

function getGlobalBeat() {
  if (!beatClockStarted) return 0;
  const elapsed = audioCtx.currentTime - globalBeatStart;
  return (elapsed / 60) * globalBpm;
}

function startBeatClock() {
  if (beatClockStarted) return;
  beatClockStarted = true;
  globalBeatStart = audioCtx.currentTime;
  scheduleDrums();
}

function beatsToMs(beats) {
  return (beats / globalBpm) * 60000;
}

/** audioCtx.currentTime of the next beat boundary */
function nextBeatTime() {
  const beat = getGlobalBeat();
  const nextBeat = Math.ceil(beat + 0.01); // small epsilon to avoid landing on current
  return globalBeatStart + (nextBeat / globalBpm) * 60;
}

/** ms until the next beat boundary */
function msUntilNextBeat() {
  return Math.max(0, (nextBeatTime() - audioCtx.currentTime) * 1000);
}

// ============================================================
// Music — procedural beat-locked drums
// ============================================================

let drumsScheduledUntil = 0;
let drumLoopTimer = null;
let drumsMuted = false;
let bassRoot = 110;

function muteDrums() { drumsMuted = true; }
function unmuteDrums() { drumsMuted = false; }

function scheduleDrums() {
  if (!beatClockStarted) return;
  if (drumsMuted) {
    // Keep the loop alive but don't schedule sounds
    drumsScheduledUntil = getGlobalBeat();
    drumLoopTimer = setTimeout(scheduleDrums, 100);
    return;
  }
  const lookAhead = 0.2; // schedule 200ms ahead
  const now = audioCtx.currentTime;
  const beatNow = getGlobalBeat();
  const scheduleTo = beatNow + (globalBpm / 60) * lookAhead + 2; // schedule 2 beats ahead

  for (let b = Math.max(Math.ceil(drumsScheduledUntil * 2) / 2, 0); b < scheduleTo; b += 0.5) {
    const t = globalBeatStart + (b / globalBpm) * 60;
    if (t < now - 0.01) continue;
    const beatInBar = ((b % 4) + 4) % 4;

    // Kick on 1, 3
    if (beatInBar === 0 || beatInBar === 2) {
      playDrum(t, 'kick');
    }
    // Snare on 2, 4
    if (beatInBar === 1 || beatInBar === 3) {
      playDrum(t, 'snare');
    }
    // Hi-hat on every eighth
    playDrum(t, 'hat');
  }
  drumsScheduledUntil = scheduleTo;

  // Keep scheduling
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
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  } else if (type === 'snare') {
    // Noise burst via oscillator detuning
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
    // Noise component
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(800, t);
    gain2.gain.setValueAtTime(0.08, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
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
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

function changeBassRoot() {
  const roots = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196];
  bassRoot = roots[Math.floor(Math.random() * roots.length)];
}

// ============================================================
// Sound helpers
// ============================================================

const sound = {
  tap() {
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
  },

  play(freq, dur = 0.2, type = 'sine') {
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
  },

  /** Beat-aligned win melody — scheduled on next beat, plays eighth-note triplet */
  win() {
    const t = nextBeatTime();
    const eighth = (60 / globalBpm) / 2;
    // Ascending major triad on the beat
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
  },

  /** Beat-aligned lose sound — descending on the beat */
  lose() {
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
  },
};

// ============================================================
// Engine — creates canvas, runs game loop, provides API
// ============================================================

export function createEngine(slide, onEnd) {
  // Canvas setup
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  slide.innerHTML = '';
  slide.appendChild(canvas);

  // Result overlay (kept in DOM above canvas)
  const resultEl = document.createElement('div');
  resultEl.className = 'slide-result';
  slide.appendChild(resultEl);

  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const w = () => canvas.clientWidth;
  const h = () => canvas.clientHeight;

  // State
  let ended = false;
  let gameTime = 0;
  let lastFrameTime = 0;
  let frameCount = 0;
  let rafId = null;
  let gameDef = null;
  let beatCallbacks = [];
  let lastBeatInt = -1;

  // Drawing state
  let fillStyle = '#fff';
  let strokeStyle = '#fff';
  let lineWidth = 2;

  function end(result, score) {
    if (ended) return;
    ended = true;
    onEnd(result, score);
  }

  // --- Drawing API ---
  const api = {
    // Dimensions
    get width() { return w(); },
    get height() { return h(); },

    // Time
    time: 0,
    dt: 0,
    frame: 0,

    // Beat
    get beat() { return getGlobalBeat(); },
    get bpm() { return globalBpm; },
    get beatFrac() { return getGlobalBeat() % 1; },
    onBeat(fn) { beatCallbacks.push(fn); },

    // Game control
    win(score) { end('win', score ?? 1); },
    lose(score) { end('lose', score ?? 0); },
    score(n) { end('win', n); },

    // Sound
    sound,

    // Drawing
    clear(color = '#000') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w(), h());
    },

    fill(color) {
      fillStyle = color;
    },

    stroke(color, width) {
      strokeStyle = color;
      if (width !== undefined) lineWidth = width;
    },

    circle(x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    },

    rect(x, y, rw, rh) {
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, rw, rh);
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, rw, rh);
      }
    },

    line(x1, y1, x2, y2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    },

    text(str, x, y, size = 24) {
      ctx.fillStyle = fillStyle;
      ctx.font = `bold ${size}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, x, y);
    },

    emoji(str, x, y, size = 48) {
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, x, y);
    },

    push() { ctx.save(); },
    pop() { ctx.restore(); },
    translate(x, y) { ctx.translate(x, y); },
    rotate(angle) { ctx.rotate(angle); },
    scale(sx, sy) { ctx.scale(sx, sy ?? sx); },

    // Helpers
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    lerp: (a, b, t) => a + (b - a) * t,
    map: (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c),
    random(min = 0, max = 1) {
      if (arguments.length === 1) { max = min; min = 0; }
      return min + Math.random() * (max - min);
    },
  };

  // --- Input handling ---
  let pointerDown = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function onPointerDown(e) {
    if (ended) return;
    e.preventDefault();
    pointerDown = true;
    const [x, y] = getXY(e);
    lastPointerX = x;
    lastPointerY = y;
    gameDef?.onTap?.(x, y);
  }

  function onPointerMove(e) {
    if (ended || !pointerDown) return;
    e.preventDefault();
    const [x, y] = getXY(e);
    const dx = x - lastPointerX;
    const dy = y - lastPointerY;
    lastPointerX = x;
    lastPointerY = y;
    gameDef?.onDrag?.(x, y, dx, dy);
  }

  function onPointerUp(e) {
    if (ended) return;
    pointerDown = false;
    const [x, y] = getXY(e);
    gameDef?.onRelease?.(x, y);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);

  // --- Game loop ---
  function tick(now) {
    if (ended) return;
    if (lastFrameTime === 0) lastFrameTime = now;
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    gameTime += dt;
    frameCount++;

    api.time = gameTime;
    api.dt = dt;
    api.frame = frameCount;

    // Beat callbacks
    const currentBeatInt = Math.floor(getGlobalBeat());
    if (currentBeatInt > lastBeatInt && lastBeatInt >= 0) {
      beatCallbacks.forEach(fn => fn(currentBeatInt));
    }
    lastBeatInt = currentBeatInt;

    // Reset draw state each frame
    fillStyle = '#fff';
    strokeStyle = null;
    lineWidth = 2;

    gameDef?.draw?.(api);

    rafId = requestAnimationFrame(tick);
  }

  // --- Public engine interface ---
  return {
    /** Start running a game definition */
    run(def) {
      gameDef = def;
      startBeatClock();
      changeBassRoot();
      lastBeatInt = Math.floor(getGlobalBeat());
      lastFrameTime = 0;
      gameTime = 0;
      frameCount = 0;
      rafId = requestAnimationFrame(tick);
    },

    /** Duration in ms (converted from beats, scaled by timer multiplier) */
    getDurationMs(beats) {
      return beatsToMs(beats) * timerMultiplier;
    },

    /** Show result overlay */
    showResult(result) {
      const won = result === 'win';
      resultEl.textContent = won ? 'NICE!' : 'TOO SLOW';
      resultEl.style.background = won ? 'rgba(0,200,100,0.3)' : 'rgba(200,0,50,0.3)';
      resultEl.classList.add('visible');
    },

    /** Tear down everything */
    cleanup() {
      ended = true;
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      beatCallbacks = [];
      gameDef?.cleanup?.();
    },

    api,
    sound,
  };
}

function pauseAudio() { audioCtx.suspend(); }
function resumeAudio() { audioCtx.resume(); }

export { sound, getGlobalBeat, globalBpm, msUntilNextBeat, beatsToMs, setBpm, getTimerMultiplier, setTimerMultiplier, pauseAudio, resumeAudio, muteDrums, unmuteDrums };
