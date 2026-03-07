let audioCtx = null;

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();
}

export function nowMs() { return audioCtx ? audioCtx.currentTime * 1000 : 0; }

export function getAudioCtx() { return audioCtx; }