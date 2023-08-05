const DIR_NEG = -1;
const DIR_POS = 1;

export class SweepAndPruneSwap2DStrat {
  constructor(ballSim, processFunc, callbacks = {}, eventTarget = undefined) {
    this.ballSim = ballSim;
    this.processFunc = processFunc;
    this.callbacks = callbacks;
    this.eventTarget = eventTarget;
    this.overlapsX = new Map();
    this.overlapsY = new Map();
    this.init();
  }

  init() {
    this.edgesX = [];
    this.edgesY = [];

    let ballID = 0;
    for (const ball of this.ballSim.balls) {
      this.edgesX.push({ ballID, ball, dir: DIR_NEG, x: ball.x });
      this.edgesX.push({ ballID, ball, dir: DIR_POS, x: ball.x });
      this.edgesY.push({ ballID, ball, dir: DIR_NEG, y: ball.y });
      this.edgesY.push({ ballID, ball, dir: DIR_POS, y: ball.y });
      ballID++;
    }

    this.edgesX.sort((a, b) => a.x - b.x);
    this.edgesY.sort((a, b) => a.y - b.y);
  }

  async step() {
    const { edgesX, edgesY } = this;

    syncEdge(edgesX[0], "x");

    // Sweep X
    for (let i = 1; i < edgesX.length; i++) {
      syncEdge(edgesX[i], "x");

      for (let j = i - 1; j >= 0; j--) {
        if (edgesX[j].x < edgesX[j + 1].x) break;

        [edgesX[j], edgesX[j + 1]] = [edgesX[j + 1], edgesX[j]]

        const left = edgesX[j];
        const right = edgesX[j + 1];

        if (left.dir < 0 && right.dir > 0) { // enter
          this.overlapsX.set(overlapKey(left, right), [left.ball, right.ball]);
        } else if (left.dir > 0 && right.dir < 0) { // exit
          this.overlapsX.delete(overlapKey(left, right));
        }
      }
    }

    syncEdge(edgesY[0], "y");

    // Sweep Y
    for (let i = 1; i < edgesY.length; i++) {
      syncEdge(edgesY[i], "y");

      for (let j = i - 1; j >= 0; j--) {
        if (edgesY[j].y < edgesY[j + 1].y) break;

        [edgesY[j], edgesY[j + 1]] = [edgesY[j + 1], edgesY[j]]

        const up = edgesY[j];
        const down = edgesY[j + 1];

        if (up.dir < 0 && down.dir > 0) { // enter
          this.overlapsY.set(overlapKey(up, down), [up.ball, down.ball]);
        } else if (up.dir > 0 && down.dir < 0) { // exit
          this.overlapsY.delete(overlapKey(up, down));
        }
      }
    }

    // Report overlaps
    if (this.overlapsX.size < this.overlapsY.size) {
      for (const [key, [ball1, ball2]] of this.overlapsX.entries()) {
        if (this.overlapsY.has(key)) {
          await this.processFunc(ball1, ball2);
        }
      }
    } else {
      for (const [key, [ball1, ball2]] of this.overlapsY.entries()) {
        if (this.overlapsX.has(key)) {
          await this.processFunc(ball1, ball2);
        }
      }
    }
  }
}

function overlapKey(edge1, edge2) {
  const id1 = edge1.ballID;
  const id2 = edge2.ballID;
  if (id1 < id2) return `${id1}-${id2}`;
  else return `${id2}-${id1}`;
}

function syncEdge(edge, coord) {
  edge[coord] = edge.ball[coord] + edge.ball.radius * edge.dir;
}
