// @ts-check
/// <reference types="../../../.vscode/pixi.js.d.ts" />
// @ts-ignore
import * as PIXI_ from "/lib/vendor/pixi-8.min.mjs";
/** @type {typeof globalThis.PIXI} */
const PIXI = PIXI_;

const audio = new Audio("./Isolation.mp3");

const app = new PIXI.Application();
await app.init({
  width: 800,
  height: 800,
  background: 0x111111,
});
document.body.appendChild(app.canvas);
document.body.addEventListener("click", start, { once: true });

function start() {
  const ctx = new AudioContext();
  const src = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  const analyserBuffer = new Uint8Array(analyser.frequencyBinCount);

  src.connect(analyser);
  analyser.connect(ctx.destination);

  audio.play();

  app.ticker.add(() => {
    analyser.getByteFrequencyData(analyserBuffer);
    update(analyserBuffer);
  });
}

const detectBass = createPeakDetector({
  start: 0,
  end: 2,
  threshold: 16,
});

const detectHigh = createPeakDetector({
  start: 160,
  end: 180,
  threshold: 4,
});

let scene = null;

function update(analysis) {
  if (!scene) {
    setupBubblesScene(audio.currentTime);
  }

  scene?.update(audio.currentTime, analysis);
}

function setupBubblesScene(startTime) {
  const bubbleGraphics = new PIXI.Graphics();
  bubbleGraphics.circle(0, 0, 80).stroke({
    width: 4,
    color: 0xffffff,
  });
  const bubbleTexture = app.renderer.generateTexture(bubbleGraphics);

  app.stage.removeChildren();

  const bubbleContainer = new PIXI.Container();
  bubbleContainer.position.set(app.renderer.width / 2, app.renderer.height / 2);
  app.stage.addChild(bubbleContainer);

  const bubbleCols = 8;
  const bubbleRows = 8;
  const bubbleGrid = Array.from({ length: bubbleCols }, (_, col) =>
    Array.from({ length: bubbleRows }, (_, row) => {
      const bubble = new PIXI.Sprite(bubbleTexture);
      bubble.anchor.set(0.5);
      bubble.position.set(
        ((col + 0.5) / bubbleCols - 0.5) * app.renderer.width * Math.SQRT2,
        ((row + 0.5) / bubbleRows - 0.5) * app.renderer.height * Math.SQRT2
      );
      bubble.scale.set(0.5);
      bubble["bubbleCol"] = col;
      bubble["bubbleRow"] = row;
      bubbleContainer.addChild(bubble);
      return bubble;
    })
  );

  const startingBubble =
    bubbleContainer.children[Math.round(bubbleContainer.children.length * 0.3)];
  startingBubble["bubblePainted"] = true;
  startingBubble.tint = 0x00ffff;

  scene = {
    update(time, analysis) {
      const elapsedTime = time - startTime;
      const bass = detectBass(analysis);
      const high = detectHigh(analysis);

      bubbleContainer.rotation = 1 + elapsedTime * 0.03;
      bubbleContainer.scale.set(1 + elapsedTime * 0.01);

      const toPaint = [];

      for (const bubble of bubbleContainer.children) {
        const col = bubble["bubbleCol"];
        const row = bubble["bubbleRow"];
        const painted = bubble["bubblePainted"];
        const polarity = ((col + row + +!!painted) % 2) * -2 + 1;

        let targetScale = 0.5 * (painted ? bass / 255 : high / 128);
        const diff = targetScale - (bubble.scale.x - 0.5) * polarity;
        bubble.scale.set(
          bubble.scale.x + polarity * diff * (0.1 + 0.9 * +(diff > 0))
        );

        if (bass > 60 && painted) {
          const d = Math.round(Math.random()) * 2 - 1;
          const a = Math.round(Math.random());
          const dx = d * a;
          const dy = d * (1 - a);
          if (Math.abs(dx) + Math.abs(dy) === 1) {
            const neighbor = bubbleGrid[col + dx]?.[row + dy];
            if (neighbor && !neighbor["bubblePainted"]) {
              toPaint.push(neighbor);
            }
          }
        }
      }

      for (const bubble of toPaint) {
        bubble["bubblePainted"] = true;
        bubble.tint = 0x00ffff;
      }
    },
  };
}

function createPeakDetector({
  start = 0,
  end = 512,
  historySize = 60,
  threshold = 16,
  peakDecay = 0.96,
} = {}) {
  const history = new Float32Array(historySize);
  let historyIndex = 0;
  let historyCount = 0;
  let runningSum = 0;
  let rising = false;
  let lastPeak = 0;

  return function detect(freqAnalysis, debug = false) {
    let bucketSum = 0;
    for (let i = start; i < end; i++) bucketSum += freqAnalysis[i];
    const bucketAvg = bucketSum / (end - start);

    runningSum += bucketAvg - history[historyIndex];
    history[historyIndex] = bucketAvg;
    historyCount = Math.min(historySize, historyCount + 1);
    historyIndex = (historyIndex + 1) % historySize;

    const mean = runningSum / historyCount;
    const delta = Math.max(
      0,
      bucketAvg - mean * (historySize / historyCount) - threshold
    );
    if (debug) console.log({ delta, lastPeak, bucketAvg, mean });

    if (delta > lastPeak) {
      rising = true;
      lastPeak = delta;
      return 0;
    } else {
      if (rising) {
        rising = false;
        return lastPeak;
      }
      lastPeak *= peakDecay;
      return 0;
    }
  };
}
