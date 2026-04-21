export const STATE_INIT = "init";
export const STATE_RUNNING = "running";
export const STATE_PAUSED = "paused";
export const STATE_ENDED = "ended";

export const RESULT_WIN = "win";
export const RESULT_LOSE = "lose";

export function createEngine(onEnd, music, createGraphics) {
  let state = STATE_INIT;
  let gameDef = null;
  let gameTimeMs = 0;
  let gameDurationMs = 0;
  let lastFrameTime = 0;
  let lastBeatNumber = -1;
  const events = new EventTarget();

  function end(result, message) {
    if (state == STATE_ENDED) return;
    if (result === RESULT_LOSE && !message) {
      throw new Error('lose requires a message saying why');
    }
    state = STATE_ENDED;
    onEnd(result, message);
  }

  function onTap(x, y) {
    if (state === STATE_ENDED) return;
    gameDef?.onTap?.(x, y);
  }

  function onDrag(x, y, dx, dy) {
    if (state === STATE_ENDED) return;
    gameDef?.onDrag?.(x, y, dx, dy);
  }

  function onRelease(x, y) {
    if (state === STATE_ENDED) return;
    gameDef?.onRelease?.(x, y);
  }

  const { drawing, getSafeInsets, cleanup: cleanupGraphics } = createGraphics({ onTap, onDrag, onRelease });

  class API {
    constructor() {
      Object.defineProperties(this, Object.getOwnPropertyDescriptors(drawing));
    }

    get time() { return gameTimeMs; }
    dt = 0;

    get bpm() { return music.getBpm(); }
    get beat() { return music.getGlobalBeat(); }
    get beatFrac() { return music.getGlobalBeat() % 1; }
    get pulse() { return Math.exp(-(music.getGlobalBeat() % 1) * 6); }
    onBeat(fn) { events.addEventListener("beat", fn); }

    complexity = 0;

    get safeTop() { return getSafeInsets().top; }

    win(message) { end(RESULT_WIN, message); }
    lose(message) { end(RESULT_LOSE, message); }

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

    gameDef.draw(api);

    if (gameTimeMs >= gameDurationMs) {
      const timeoutResult = gameDef.timeoutResult ?? RESULT_LOSE;
      end(timeoutResult, gameDef.timeoutMessage);
    }

    requestAnimationFrame(tick);
  }

  return {
    run(def) {
      if (state === STATE_ENDED) return;
      const timeoutResult = def.timeoutResult ?? RESULT_LOSE;
      if (timeoutResult === RESULT_LOSE && !def.timeoutMessage) {
        throw new Error('game with lose timeout requires timeoutMessage');
      }
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
      cleanupGraphics?.();
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
