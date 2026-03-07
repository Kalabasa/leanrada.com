export { nowMs } from './audio.js';

/**
 * @typedef {Object} Music
 * @property {() => void} initAudio
 * @property {() => void} pause
 * @property {() => void} resume
 * @property {() => number} getBpm
 * @property {(bpm: number) => void} setBpm
 * @property {() => number} getGlobalBeat
 * @property {(beats: number) => number} beatsToMs
 * @property {(b: number) => number} beatToTimeMs
 * @property {() => number} soundWin
 * @property {() => number} soundLose
 * @property {() => void} soundTap
 * @property {() => object} getMusicState
 */

import { Sequencer } from './sequencer.js';
import { createComposer } from './composer.js';

/** @returns {Music} */
export function createMusic() {
  return new Sequencer({ composer: createComposer() });
}
