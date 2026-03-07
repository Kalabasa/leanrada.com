# Music system

## Public API

External code imports only from `music.js`:

```js
import { createMusic, nowMs } from './engine/music/music.js';
```

`createMusic()` returns a `Music` object (implemented by `Sequencer`).
`nowMs()` returns the current audio context time in milliseconds.

## Architecture

```
┌─────────────────────────────────────┐
│              index.html             │
│  music.soundWin / soundLose / Tap   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│              music.js               │  ← only public interface
│  createMusic()  nowMs()             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│            sequencer.js             │  beat clock, scheduler, swing
│  Sequencer                          │
│  - converts beats → seconds         │
│  - queues MusicEvents from composer │
│  - calls event.instrument.play()    │
└────────┬──────────────┬─────────────┘
         │              │
         ▼              ▼
┌─────────────┐  ┌──────────────────────────────┐
│   audio.js  │  │          composer.js          │
│  initAudio  │  │  createComposer()             │
│  nowMs      │  │  - owns all Instrument objs   │
│  getAudioCtx│  │  - resolves scale/chord/pitch │
└──────┬──────┘  │  - outputs MusicEvent[]       │
       │         └──────────────┬───────────────┘
       │                        │
       │                        ▼
       │         ┌──────────────────────────────┐
       └────────►│          instrument.js        │
                 │  createInstrument()           │
                 │  createWaveBuffer()           │
                 │  - Web Audio buffer synthesis │
                 │  - square / triangle / noise  │
                 └──────────────────────────────┘
```

## Data flow

```
composer.buildBar(section)
└─► MusicEvent[] { instrument, beatOffset, note, dur, gain }
     │
     └─► sequencer #tick()
          └─► beat → seconds conversion
               └─► instrument.play(tS, durS, note, gain)
                    └─► Web Audio API
```

## MusicEvent

The contract between composer and sequencer:

```js
{
  instrument: Instrument,  // plays the sound
  beatOffset: number,      // position within bar (in beats)
  note: number,            // MIDI note number
  dur: number,             // duration (in beats)
  gain: number,            // volume 0–1
}
```

## Files

| File            | Role                                          |
|-----------------|-----------------------------------------------|
| `music.js`      | Public facade — only entry point              |
| `sequencer.js`  | Beat clock, scheduler, swing, section logic   |
| `composer.js`   | Musical content — sections, scale, instruments|
| `instrument.js` | Web Audio synthesis — waveform + playback     |
| `audio.js`      | AudioContext lifecycle and time               |