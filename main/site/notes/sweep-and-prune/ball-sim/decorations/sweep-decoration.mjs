const SWEEP_STEP = 6;
const SWEEP_STEP_DELAY = 25;

export function createSweepDecorations(renderer, pause, sweepColor, insideColor) {
  const { width, height } = renderer;
  const sweepLine = renderer.addLine({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: height,
    color: sweepColor
  });

  async function sweepTo(x) {
    while (sweepLine.x1 < x) {
      if (sweepLine.x1 + SWEEP_STEP >= x) {
        sweepLine.x1 = sweepLine.x2 = x;
      } else {
        sweepLine.x1 = sweepLine.x2 += SWEEP_STEP;
      }
      await pause(SWEEP_STEP_DELAY);
    }
  }

  const callbacks = {
    async onStartScan() {
      sweepLine.x1 = sweepLine.x2 = 0;
    },
    async onScanEdge(edge) {
      await sweepTo(edge.x);
    },
    async onEnterEdge(edge) {
      edge.ball.color = insideColor;
      await pause(250);
    },
    async onExitEdge(edge) {
      edge.ball.color = null;
    },
    async onEndScan() {
      await sweepTo(width);
    },
  };

  return { callbacks };
}
