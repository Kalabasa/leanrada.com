// Shared browser mocks for tests

let rafCallback = null;
globalThis.requestAnimationFrame = (fn) => { rafCallback = fn; };
globalThis.setTimeout = () => {};
globalThis.EventTarget = EventTarget;
globalThis.Event = Event;
globalThis.document = {
  createElement: () => ({
    style: {},
    clientWidth: 400,
    clientHeight: 600,
    getContext: () => ({
      setTransform: () => {}, fillRect: () => {}, save: () => {}, restore: () => {},
      beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
      strokeRect: () => {}, moveTo: () => {}, lineTo: () => {},
      fillText: () => {}, translate: () => {}, rotate: () => {}, scale: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    innerHTML: '',
    appendChild: () => {},
  }),
};

const mockNode = {
  connect: () => {},
  disconnect: () => {},
  start: () => {},
  stop: () => {},
  type: '',
  gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
  frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
};
const mockAudioCtx = {
  currentTime: 0,
  destination: {},
  resume: () => {},
  suspend: () => {},
  createOscillator: () => ({ ...mockNode }),
  createGain: () => ({ ...mockNode }),
};
globalThis.window = {
  devicePixelRatio: 1,
  AudioContext: class { constructor() { return mockAudioCtx; } },
};

export { rafCallback, mockAudioCtx, mockNode };

export function tickRaf(ms) {
  if (rafCallback) { const fn = rafCallback; rafCallback = null; fn(ms); }
}
