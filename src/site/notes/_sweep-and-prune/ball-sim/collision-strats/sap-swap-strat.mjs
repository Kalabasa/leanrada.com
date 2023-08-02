const DIR_LEFT = -1;
const DIR_RIGHT = 1;

export class SweepAndPruneSwapStrat {
  constructor(ballSim, processFunc, callbacks = {}, eventTarget = undefined) {
    this.ballSim = ballSim;
    this.processFunc = processFunc;
    this.callbacks = callbacks;
    this.eventTarget = eventTarget;
    this.overlaps = new Map();
    this.init();
  }

  init() {
    this.edges = [];

    let ballID = 0;
    for (const ball of this.ballSim.balls) {
      this.edges.push({ ballID, ball, dir: DIR_LEFT, x: ball.x });
      this.edges.push({ ballID, ball, dir: DIR_RIGHT, x: ball.x });
      ballID++;
    }

    this.edges.sort((a, b) => a.x - b.x);
  }

  async step() {
    const { edges } = this;
    const { onStartScan, onScanEdge, onEndScan, onCompare, onSwap } = this.callbacks;

    await onStartScan?.(this.edges);
    for (let i = 0; i < edges.length; i++) {
      syncEdge(edges[i]);
      await onScanEdge?.(edge);
      for (let j = i - 1; j >= 0; j--) {
        await onCompare?.(edges[j], edges[j + 1]);
        if (edges[j].x < edges[j + 1].x) break;

        await onSwap?.(edges[j], edges[j + 1]);
        [edges[j], edges[j + 1]] = [edges[j + 1], edges[j]]

        const left = edges[j];
        const right = edges[j + 1];

        const key = overlapKey(left, right);
        if (left.dir < 0 && right.dir > 0) { // enter
          this.overlaps.set(key, [left.ball, right.ball]);
        } else if (left.dir > 0 && right.dir < 0) { // exit
          this.overlaps.delete(key);
        }
      }
    }
    await onEndScan?.();

    for (const [ball1, ball2] of this.overlaps.values()) {
      await this.processFunc(ball1, ball2);
    }
  }
}

function overlapKey(edge1, edge2) {
  const id1 = edge1.ballID;
  const id2 = edge2.ballID;
  if (id1 < id2) return `${id1}-${id2}`;
  else return `${id2}-${id1}`;
}

function syncEdge(edge) {
  edge.x = edge.ball.x + edge.ball.radius * edge.dir;
}
