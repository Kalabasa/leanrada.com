// gamegame engine — game loop, input, api

import {
  getGlobalBeat,
  getBpm,
  startBeatClock,
  changeBassRoot,
  beatsToMs,
  pauseAudio,
  resumeAudio,
  soundTap,
  soundPlay,
  soundWin,
  soundLose,
} from "./music.js";
import { createCanvas } from "./graphics.js";

export const STATE_INIT = "init";
export const STATE_RUNNING = "running";
export const STATE_PAUSED = "paused";
export const STATE_ENDED = "ended";

export const RESULT_WIN = "win";
export const RESULT_LOSE = "lose";

// ============================================================
// Engine — creates canvas, runs game loop, provides API
// ============================================================

export function createEngine(slide, onEnd) {
  const { canvas, drawing, resetDrawState } = createCanvas(slide);

  let state = STATE_INIT;
  let gameDef = null;
  let gameTimeMs = 0;
  let lastFrameTime = 0;
  let lastBeatNumber = -1;

  const events = new EventTarget();

  function end(result) {
    if (state == STATE_ENDED) return;
    state = STATE_ENDED;
    onEnd(result);
  }

  // TODO class instead of Object.create()
  class API {
    get bpm() {
      return getBpm();
    }
    // ...
  }

  const api = Object.create(drawing, {
    // Time
    time: { get() { return gameTimeMs } },
    dt: { value: 0, writable: true },

    // Beat
    bpm: {
      get() {
        return getBpm();
      },
    },
    beat: {
      get() {
        return getGlobalBeat();
      },
    },
    beatFrac: {
      get() {
        return getGlobalBeat() % 1;
      },
    },
    /** Sharp attack on beat, quick decay. 1→0. Usage: size * (1 + 0.2 * api.pulse) */
    pulse: {
      get() {
        return Math.exp(-(getGlobalBeat() % 1) * 6);
      },
    },
    onBeat: {
      value(fn) {
        events.addEventListener("beat", fn);
      },
    },
    /** Complexity, starts at 0, unbounded. Set by index before game init. */
    complexity: { value: 0, writable: true },

    // Game control
    win: {
      value() {
        end(RESULT_WIN);
      },
    },
    lose: {
      value() {
        end(RESULT_LOSE);
      },
    },

    // Sound
    soundTap: { value: soundTap },
    soundPlay: { value: soundPlay },
    soundWin: { value: soundWin },
    soundLose: { value: soundLose },

    // Helpers
    dist: { value: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) },
    lerp: { value: (a, b, t) => a + (b - a) * t },
    map: { value: (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c) },
    random: {
      value(min = 0, max = 1) {
        if (arguments.length === 1) {
          max = min;
          min = 0;
        }
        return min + Math.random() * (max - min);
      },
    },
  });

  // --- Input handling ---
  let pointerDown = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function onPointerDown(e) {
    if (state === STATE_ENDED) return;
    e.preventDefault();
    pointerDown = true;
    const [x, y] = getXY(e);
    lastPointerX = x;
    lastPointerY = y;
    gameDef?.onTap?.(x, y);
  }

  function onPointerMove(e) {
    if (state === STATE_ENDED || !pointerDown) return;
    e.preventDefault();
    const [x, y] = getXY(e);
    const dx = x - lastPointerX;
    const dy = y - lastPointerY;
    lastPointerX = x;
    lastPointerY = y;
    gameDef?.onDrag?.(x, y, dx, dy);
  }

  function onPointerUp(e) {
    if (state === STATE_ENDED) return;
    pointerDown = false;
    const [x, y] = getXY(e);
    gameDef?.onRelease?.(x, y);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerUp);

  // --- Game loop ---
  function tick(now) {
    if (state === STATE_ENDED) return;

    if (lastFrameTime === 0) lastFrameTime = now;
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    gameTimeMs += dt;

    api.dt = dt;

    // Beat callbacks
    const currentBeatNumber = Math.floor(getGlobalBeat());
    if (currentBeatNumber > lastBeatNumber && lastBeatNumber >= 0) {
      events.dispatchEvent(new BeatEvent(currentBeatNumber));
    }
    lastBeatNumber = currentBeatNumber;

    resetDrawState();
    gameDef.draw(api);

    if (gameTimeMs >= beatsToMs(gameDef.duration)) {
      const timeoutResult = gameDef.timeoutResult ?? RESULT_LOSE;
      end(timeoutResult, timeoutResult === RESULT_WIN ? 1 : 0);
    }

    requestAnimationFrame(tick);
  }

  // --- Public engine interface ---
  return {
    /** Start running a game definition */
    run(def) {
      state = STATE_RUNNING;
      gameDef = def;
      startBeatClock();
      changeBassRoot();
      lastBeatNumber = Math.floor(getGlobalBeat());
      lastFrameTime = 0;
      gameTimeMs = 0;
      requestAnimationFrame(tick);
    },

    pause() {
      if (state !== STATE_RUNNING) return;
      state = STATE_PAUSED;
      pauseAudio();
    },

    resume() {
      if (state !== STATE_PAUSED) return;
      state = STATE_RUNNING;
      lastFrameTime = 0;
      requestAnimationFrame(tick);
      resumeAudio();
    },

    get timeRemainingMs() {
      return gameDef
        ? Math.max(0, beatsToMs(gameDef.duration) - gameTimeMs)
        : 0;
    },

    get gameDurationMs() {
      return gameDef ? beatsToMs(gameDef.duration) : 0;
    },

    /** Tear down everything */
    cleanup() {
      state = STATE_ENDED;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      gameDef?.cleanup?.();
    },

    api,
  };
}

class BeatEvent extends Event {
  constructor(beatNumber) {
    super("beat");
    this.beatNumber = beatNumber;
  }
}
