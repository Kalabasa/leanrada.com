# Game Design Principles

## The name of the game is variety
This is an endless TikTok-style feed of microgames. The player should **never feel like they're playing the same game twice**. Every swipe brings a surprise — a different game type, a different variant, a different vibe. The feed is the product, not any individual game.

- Each game type has multiple variants. Each play picks ONE variant randomly.
- Complexity intensifies the chosen variant, it doesn't pile on more stuff.
- "More enemies" is not fun. "Enemies that behave differently" is fun.
- A dodge game with zigzag obstacles feels totally different from one with homing missiles — same game type, different experience.
- The player thinks "what will I get next?" not "oh this again but harder."

## Core loop
Endless feed of microgames. Win → complexity goes up, BPM goes up. Lose → complexity goes down, BPM stays. Self-balancing.

## Complexity, not difficulty
- `api.complexity` is unbounded (0 → ∞), grows super-linearly with wins
- Complexity means **more to think about**, not more precision required
- The game is on a touch screen — inputs should be lenient (fat tap targets, generous hitboxes, forgiving timing windows)
- Challenge comes from **fast thinking**: scanning a bigger grid, tracking more objects, parsing a harder fraction
- Never punish imprecise fingers. Punish slow brains.

## BPM as a clock, not a difficulty knob
- BPM drives the global beat clock, drums, timer, transitions
- BPM increases on wins (capped at 180) — this is the "speed" axis
- BPM never decreases — the music always pushes forward
- Games don't change BPM. BPM is set between games by the session.
- Music plays continuously across transitions, never interrupted by game logic

## Complexity scale reference

`api.complexity` is a single number that all games use to calibrate challenge. Games should feel roughly equivalent at the same complexity — a player who can handle c=2 in one game should be able to handle c=2 in another.

| c | Session state | Mental load | Examples |
|---|---|---|---|
| **0** | First game ever | Trivial, tutorial-level. One thing to process. | 3×3 grid, obvious pair. 1 obstacle. Split 1/2. 2 attacks. |
| **0.5** | A few wins in | Easy but not trivial. A small amount to scan/track. | 3×3 grid, same-category emoji. 2 obstacles/spawn. Split 1/3. 3 attacks. |
| **1** | Warmed up | Moderate. Requires actual scanning or tracking. | 4×4 grid. 3 obstacles/spawn. Split 2/5. 4 attacks. Drifting target. |
| **2** | On a streak | Busy. Multiple things competing for attention. | 5×5 grid. 5 obstacles/spawn. Split 3/8. 6 attacks. Fast-drifting target. |
| **5** | Long streak | Chaotic. Screen is dense, answer is buried. | 7×7 grid. 11 obstacles/spawn. Split 5/17. 12 attacks. |
| **10** | God mode | Absurd. Where's Waldo in a crowd. Bullet hell. | 10×10 grid. 21 obstacles/spawn. Split 7/32. 22 attacks. |

### How to use this table
- Your game should be **instantly winnable** at c=0 — a new player sees it and gets it in <1 second
- At c=1, it should take a moment of thought — scan, track, calculate
- At c=5+, it should feel overwhelming but still technically possible
- Use `c` as a continuous parameter in formulas, not `if (c > 2) items = 20`
- **Use diminishing returns** for quantities that could become impossible. Linear `1 + c * 2` becomes a wall. Use `log2(1 + c)` or `sqrt(c)` so the game always gets harder but never becomes literally unwinnable. There must always be a gap to dodge through, a moment to think, a way to win.
- Test your game at c=0, c=1, c=5, c=10 to make sure it scales sensibly and is always technically winnable

## Procedural generation over hardcoded content
- Game content (emoji, ratios, grids, attack patterns) should be **generated**, not picked from curated lists
- Complexity scaling should be a continuous function, not if/else tiers
- One algorithm that naturally produces simple content at c=0 and chaotic content at c=10
- If you're writing `if (c < 0.5) ... else ...`, you're doing it wrong. Use `c` as a parameter to a formula.

## Variation dimensions

Every game should scale across **multiple independent dimensions**, not just "more of the same." Complexity should change the _nature_ of the challenge, not just the quantity. Think of it as: at c=0 you're playing checkers, at c=10 you're playing 3D chess on a moving board.

### Dimension types

**Quantity** — more things to process
- More items, more obstacles, more attacks, more targets
- This is the obvious one. Necessary but not sufficient alone.

**Spatial** — harder to find / parse visually
- Scattered vs grid layout, overlapping elements, varied sizes
- Things placed in unexpected positions, visual noise

**Motion** — things move, requiring tracking
- Static → drifting → bouncing → tracking the player
- Speed and direction variety

**Behavioral** — things don't all act the same
- Some obstacles zigzag, some fall straight. Some attacks are feints.
- Items that change mid-game, targets that swap

**Cognitive** — requires more mental steps
- Harder fractions, longer sequences, multiple rules at once
- "Parry the red ones, dodge the blue ones"

**Twists** — qualitative changes that reframe the game
- These emerge at complexity thresholds and add new rules
- Not harder versions of the same task, but _different_ tasks layered on
- Examples below per game

### Per-game variation dimensions

**Dodge**
| Dimension | Low c | High c |
|---|---|---|
| Quantity | 1 obstacle/wave | Many per wave |
| Motion | Straight down | Zigzag, sine wave, aimed at player |
| Behavioral | All identical | Mixed: fast/slow, big/small, some track player |
| Twist | — | Obstacles you must collect (marked differently) mixed with ones to dodge |

**Drag**
| Dimension | Low c | High c |
|---|---|---|
| Motion | Static target | Drifting target |
| Quantity | 1 ball, 1 target | Multiple balls to deliver |
| Spatial | Clear path | Obstacles/walls between ball and target |
| Twist | — | Target changes which emoji it wants mid-drag |

**Parry**
| Dimension | Low c | High c |
|---|---|---|
| Quantity | 2 attacks | Many attacks |
| Motion | One side at a time | Simultaneous from both sides |
| Behavioral | All real attacks | Feints mixed in (tap = lose) |
| Twist | — | Color-coded: tap red, swipe blue |

**Odd One Out**
| Dimension | Low c | High c |
|---|---|---|
| Quantity | 9 items | Dozens |
| Spatial | Neat grid | Scattered, overlapping |
| Motion | Static | Bouncing, swarming |
| Size | Uniform | Varied sizes |
| Twist | — | Multiple odd ones to find, or odd one keeps changing |

**Split**
| Dimension | Low c | High c |
|---|---|---|
| Cognitive | 1/2, 1/3 | 3/7, 5/12, weird fractions |
| Spatial | Horizontal bar | Vertical, diagonal, or circular shape |
| Quantity | 1 cut | Multiple cuts needed |
| Twist | — | Bar is pre-divided into segments you must count |

### Variety ≠ chaos

The goal is that each play of a game **feels different** — not that every play is overwhelming.

- **Pick, don't pile.** Each instance should randomly select ONE variation to emphasize, not activate all of them at once. A dodge game might have zigzag obstacles OR aimed obstacles OR size variation — not all three.
- **Complexity intensifies the pick.** Once a variation is chosen, `c` controls how intense it is. A c=5 zigzag dodge is very wiggly. A c=5 aimed dodge has aggressive homing. But it's still one clear challenge, not a mess.
- **Surprise comes from variety across plays.** The player doesn't know which variant they'll get. One dodge game is bullet hell, the next is a homing missile challenge. Same game type, different feel every time.
- **Each variant should be a coherent experience.** If you can't describe the variant in 3 words ("zigzag obstacles", "moving grid", "feint attacks"), it's too complex.

### Implementation pattern

```js
// Pick ONE variation for this instance
const variants = ['normal', 'zigzag', 'aimed', 'mixed-sizes'];
const variant = variants[Math.floor(api.random(variants.length))];

// Complexity intensifies the chosen variant
if (variant === 'zigzag') {
  sineAmount = 0.5 + c * 0.3;
} else if (variant === 'aimed') {
  aimStrength = 0.1 + c * 0.05;
}
// etc — only one is active
```

At low complexity, even the "hard" variants are gentle. At high complexity, any variant is intense. But it's always **one clear thing**.

### Twists
- Twists are qualitative rule changes (feints in parry, walls in drag)
- They go into the variant pool alongside simpler variants
- At low c, twists are mild. At high c, twists are intense. But a twist is still just one variant.
- The title card should hint at the twist ("Parry! (ignore fakes)")

## Game format
Each game is a factory function that receives `api` and returns:
- `title` — shown for 2 beats before the game starts
- `duration` — in beats (not ms), scales with BPM automatically
- `timeoutResult` — `'win'` or `'lose'` (default: `'lose'`)
- `draw(api)` — called every frame
- `onTap(x, y)`, `onDrag(x, y, dx, dy)`, `onRelease(x, y)` — input handlers
- Call `api.win()` or `api.lose()` to end

## Adding new games
1. Create `games/mygame.js` with an exported factory function
2. Import and add to `gameTypes` array in `index.html`
3. Use `api.complexity` to scale the challenge
4. Use `api.random()` for all randomness (theming, layout, content)
5. Keep it simple — a microgame should be instantly understood from the title + first glance
