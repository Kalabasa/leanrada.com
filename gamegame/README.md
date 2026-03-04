# gamegame

TikTok for games. Infinite feed of microgames — chiptune music, pixel art, tight controls.

## Concept

- Endless feed of short microgames, auto-advancing on win/lose/timeout
- No swipe-to-advance — games own all touch input, transitions are automatic
- Visual transition between games is TikTok-style slide-up
- Global beat clock drives music, timer, animations — everything syncs
- Games are meant to be AI-generated for infinite content

## Style

**Chiptune + pixel art.** Synthesized drums (white noise + oscillator), funky 16th-note groove with swing, pentatonic key that changes per game. Sprites are pixel art images, not emoji.

## Architecture

Single-page app, no build step, no external dependencies. Vanilla JS + Canvas2D + Web Audio.

```
index.html       — shell (timer, pause, game loop, transitions)
engine/
  engine.js      — canvas API, beat clock, input handling, game loop
  music.js       — beat clock, funk groove, chiptune SFX
  graphics.js    — Canvas2D drawing API
games/
  drag.js        — drag object to target
  dodge.js       — dodge falling obstacles
  parry.js       — parry timed attacks
  oddoneout.js   — find the different one
  split.js       — split a shape at a target ratio
  count.js       — count objects
  match.js       — match pairs
```

### Engine (`engine/engine.js`)

Creates a canvas per game, runs the update loop, provides a p5-like drawing API.

#### Game format

```js
// games/my-game.js
export function myGame(api) {
  // Use api.width, api.height, api.random() for setup
  let x = api.width / 2;

  return {
    title: 'My Game',
    duration: 8,        // in beats (not ms!) — scales with BPM
    timeoutResult: 'lose', // 'win' or 'lose' (default: 'lose')

    draw(api) {
      api.clear('#222');
      const pulse = 1 + 0.2 * api.pulse;
      api.circle(x, 200, 32 * pulse);
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
// add to gameTypes array
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

**Beat:**
- `beat` — global beat as float (e.g. 3.7)
- `bpm` — current tempo
- `beatFrac` — fractional part of beat (0–1)
- `pulse` — sharp attack on beat, quick decay (1→0). Usage: `size * (1 + 0.2 * api.pulse)`
- `onBeat(fn)` — callback on each beat boundary

**Helpers:**
- `dist(x1, y1, x2, y2)`, `lerp(a, b, t)`, `map(v, inMin, inMax, outMin, outMax)`, `random(min?, max?)`
- `complexity` — float starting at 0, grows with win streak. Use to scale difficulty.

**Game control:**
- `win()`, `lose()`

**Sound:**
- `soundTap()` — in-tune UI blip (pentatonic scale)
- `soundPlay(freq, dur, type?)` — custom tone
- `soundWin()`, `soundLose()` — called automatically, but available manually

### Beat clock

- Global BPM (starts 120), continuous across games
- Duration in beats: `8 beats @ 120bpm = 4s`, `8 beats @ 160bpm = 3s`
- BPM increases by 3 each win (max 180) — natural difficulty curve
- Drives: music, timer bar, game animations

### Music (`engine/music.js`)

Procedural chiptune funk, never stops between games:
- **Groove:** 16th-note grid with ~18% swing
- **Drums:** white noise + oscillator synthesis (kick, snare + wires, ghost notes, open/closed hats)
- **Bass:** syncopated sawtooth bass line following chord changes
- **Chord chops:** staccato off-beat stabs on the "and" of 2 and 4
- **Melody riffs:** short syncopated phrases every 2 bars
- **Key:** major pentatonic, root changes per game (`changeBassRoot()`)
- **Win/lose SFX:** melodic riffs + drum accents in the current key

### What AI generates vs engine provides

**Engine provides:** canvas drawing, shapes, beat clock, sound, input handling, timer, transitions, complexity scaling

**AI generates:** game logic — `draw()` + input handlers + win/lose conditions, composing from the engine toolkit

## TODO

- Pixel art sprites (replacing emoji)
- More game types
- AI game generation
- Scoring / streak display
- Real share/save/comment functionality
