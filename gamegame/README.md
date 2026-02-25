# gamegame

TikTok for games. AI-generated microgames in an infinite feed.

## Concept

- Endless feed of short microgames, auto-advancing on win/lose/timeout
- No swipe-to-advance — games own all touch input, transitions are automatic
- Visual transition between games is TikTok-style slide-up
- Global beat clock drives music, timer, animations — everything syncs
- Games are meant to be AI-generated for infinite content

## Architecture

Single-page app, no build step, no external dependencies. Vanilla JS + Canvas2D + Web Audio.

```
index.html      — shell (timer, sidebar, bottom bar, game loop, transitions)
engine.js       — canvas API, beat clock, drums, input handling, sound
games/
  drag.js       — drag emoji to target
  dodge.js      — dodge falling obstacles
  parry.js      — parry timed attacks
  oddoneout.js  — find the different emoji
  split.js      — split a shape at a target ratio
```

### Engine (`engine.js`)

Creates a canvas per game, runs the update loop, provides a p5-like drawing API.

#### Game format

```js
// games/my-game.js
export function myGame(api) {
  // Use api.width, api.height, api.random() for setup
  let x = api.width / 2;

  return {
    duration: 8,  // in beats (not ms!) — scales with BPM

    draw(api) {
      api.clear('#222');
      const pulse = 1 + 0.2 * api.pulse;
      api.emoji('🐱', x, 200, 64 * pulse);
      api.fill('#fff');
      api.text('Catch!', api.width / 2, 50, 24);
    },

    onTap(x, y) { /* pointer down */ },
    onDrag(x, y, dx, dy) { /* pointer move while down */ },
    onRelease(x, y) { /* pointer up */ },
    cleanup() { /* optional extra teardown */ },
  };
}
```

Then register in `index.html`:
```js
import { myGame } from './games/my-game.js';
gameTypes.push(myGame);
```

#### API reference

**Drawing (immediate mode, Canvas2D):**
- `clear(color?)`, `fill(color)`, `stroke(color, width?)`
- `circle(x, y, r)`, `rect(x, y, w, h)`, `line(x1, y1, x2, y2)`
- `text(str, x, y, size?)`, `emoji(str, x, y, size?)`
- `push()`, `pop()`, `translate(x, y)`, `rotate(angle)`, `scale(s)`
- `width`, `height`

**Time:**
- `time` — elapsed game time (ms)
- `dt` — frame delta (ms)
- `frame` — frame count

**Beat:**
- `beat` — global beat as float (e.g. 3.7)
- `bpm` — current tempo
- `beatFrac` — fractional part of beat (0-1), for pulse animations
- `pulse` — sharp attack on beat with quick decay (1→0), e.g. `size * (1 + 0.2 * api.pulse)`
- `onBeat(fn)` — callback on each beat boundary

**Helpers:**
- `dist(x1, y1, x2, y2)`, `lerp(a, b, t)`, `map(v, inMin, inMax, outMin, outMax)`, `random(min?, max?)`

**Game control:**
- `win()`, `lose()`, `score(n)`

**Sound:**
- `sound.tap()` — UI blip
- `sound.play(freq, dur, type?)` — custom tone

### Beat clock

- Global BPM (starts 120), continuous across games
- Duration in beats: `8 beats @ 120bpm = 4s`, `8 beats @ 160bpm = 3s`
- Drives: music (procedural drums), timer, game animations
- BPM can ramp up over session = natural difficulty curve

### Music

Procedural beat-locked drums via Web Audio, never stops between games:
- Kick on 1 & 3, snare on 2 & 4, hi-hat on eighths
- Bass root changes per game

### What AI generates vs engine provides

**Engine provides:** canvas drawing, emoji rendering, shapes, drums, beat clock, sound primitives, input handling, timer, transitions

**AI generates:** game logic — a `draw()` function + input handlers + win/lose conditions, composing from the engine toolkit

## TODO

- BPM ramping over session
- More game types
- AI game generation
- Scoring / streak tracking
- Pause on tab hide / resume
- Real share/save/comment functionality
