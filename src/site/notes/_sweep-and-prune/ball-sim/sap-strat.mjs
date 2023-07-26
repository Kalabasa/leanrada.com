const DIR_LEFT = -1;
const DIR_RIGHT = 1;

const tmpSet = new Set();

export class SweepAndPruneStrat {
  constructor(ballSim, sortFunc, processFunc) {
    this.ballSim = ballSim;
    this.sortFunc = sortFunc;
    this.processFunc = processFunc;
    this.init();
  }

  init() {
    this.edges = [];

    for (const ball of this.ballSim.balls) {
      this.edges.push({ ball, dir: DIR_LEFT, x: 0 });
      this.edges.push({ ball, dir: DIR_RIGHT, x: 0 });
    }
  }

  async step() {
    for (const edge of this.edges) {
      syncEdge(edge);
    }
    this.sortFunc(this.edges);

    const inside = tmpSet;
    inside.clear();

    for (const edge of this.edges) {
      const { ball } = edge;
      if (edge.dir < 0) {
        for (const other of inside) {
          await this.processFunc(ball, other);
        }
        inside.add(ball);
      } else {
        inside.delete(ball);
      }
    }
  }
}

function syncEdge(edge) {
  edge.x = edge.ball.x + edge.ball.radius * edge.dir;
}