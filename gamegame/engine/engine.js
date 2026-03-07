import { createCanvas } from "./graphics.js";

export const STATE_INIT = "init";
export const STATE_RUNNING = "running";
export const STATE_PAUSED = "paused";
export const STATE_ENDED = "ended";

export const RESULT_WIN = "win";
export const RESULT_LOSE = "lose";

export function createEngine(slide, onEnd, music) {
  const { canvas, drawing, resetDrawState } = createCanvas(slide);

  let state = STATE_INIT;
  let gameDef = null;
  let gameTimeMs = 0;
  let gameDurationMs = 0;
  let lastFrameTime = 0;
  let lastBeatNumber = -1;

  const events = new EventTarget();

  function end(result) {
    if (state == STATE_ENDED) return;
    state = STATE_ENDED;
    onEnd(result);
  }

  class API {
    constructor() {
      Object.defineProperties(this, Object.getOwnPropertyDescriptors(drawing));
    }

    get time() { return gameTimeMs; }
    dt = 0;

    get bpm() { return music.getBpm(); }
    get beat() { return music.getGlobalBeat(); }
    get beatFrac() { return music.getGlobalBeat() % 1; }
    /** Sharp attack on beat, quick decay. 1→0. Usage: size * (1 + 0.2 * api.pulse) */
    get pulse() { return Math.exp(-(music.getGlobalBeat() % 1) * 6); }
    onBeat(fn) { events.addEventListener("beat", fn); }

    complexity = 0;

    win() { end(RESULT_WIN); }
    lose() { end(RESULT_LOSE); }

    soundTap() { music.soundTap(); }

    dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
    lerp(a, b, t) { return a + (b - a) * t; }
    map(v, a, b, c, d) { return c + ((v - a) / (b - a)) * (d - c); }
    random(min = 0, max = 1) {
      if (arguments.length === 1) { max = min; min = 0; }
      return min + Math.random() * (max - min);
    }
  }

  const api = new API();

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

  function tick(now) {
    if (state !== STATE_RUNNING) return;

    if (lastFrameTime === 0) lastFrameTime = now;
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    gameTimeMs += dt;

    api.dt = dt;

    const currentBeatNumber = Math.floor(music.getGlobalBeat());
    if (currentBeatNumber > lastBeatNumber && lastBeatNumber >= 0) {
      events.dispatchEvent(new BeatEvent(currentBeatNumber));
    }
    lastBeatNumber = currentBeatNumber;

    resetDrawState();
    gameDef.draw(api);

    if (gameTimeMs >= gameDurationMs) {
      const timeoutResult = gameDef.timeoutResult ?? RESULT_LOSE;
      end(timeoutResult, timeoutResult === RESULT_WIN ? 1 : 0);
    }

    requestAnimationFrame(tick);
  }

  return {
    run(def) {
      if (state === STATE_ENDED) return;
      state = STATE_RUNNING;
      gameDef = def;
      music.start();
      lastBeatNumber = Math.floor(music.getGlobalBeat());
      lastFrameTime = 0;
      gameTimeMs = 0;
      gameDurationMs = music.beatsToMs(def.duration);
      requestAnimationFrame(tick);
    },

    pause() {
      if (state !== STATE_RUNNING) return;
      music.pause();
      state = STATE_PAUSED;
    },

    resume() {
      if (state !== STATE_PAUSED) return;
      state = STATE_RUNNING;
      lastFrameTime = 0;
      requestAnimationFrame(tick);
      music.resume();
    },

    get timeRemainingMs() {
      return Math.max(0, gameDurationMs - gameTimeMs);
    },

    get gameDurationMs() {
      return gameDurationMs;
    },

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
