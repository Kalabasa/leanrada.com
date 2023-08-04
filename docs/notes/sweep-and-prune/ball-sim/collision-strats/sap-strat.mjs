const DIR_LEFT = -1;
const DIR_RIGHT = 1;

export class SweepAndPruneStrat {
  constructor(ballSim, sortFunc, processFunc, callbacks = {}, eventTarget = undefined) {
    this.ballSim = ballSim;
    this.sortFunc = sortFunc;
    this.processFunc = processFunc;
    this.callbacks = callbacks;
    this.eventTarget = eventTarget;
    this.tmpSet = new Set();
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
    const { onStartScan, onScanEdge, onEnterEdge, onExitEdge, onEndScan } = this.callbacks;

    for (const edge of this.edges) {
      syncEdge(edge);
    }
    await this.sortFunc(this.edges);

    if (this.eventTarget) {
      const event = new Event("sap-sort");
      event.edges = this.edges;
      this.eventTarget.dispatchEvent(event);
    }

    const contacts = this.tmpSet;
    contacts.clear();

    await onStartScan?.(this.edges);
    for (const edge of this.edges) {
      await onScanEdge?.(edge);

      const { ball } = edge;

      if (edge.dir < 0) {
        await onEnterEdge?.(edge);
        for (const other of contacts) {
          await this.processFunc(ball, other);
        }
        contacts.add(ball);
      } else {
        contacts.delete(ball);
        await onExitEdge?.(edge);
      }
    }
    await onEndScan?.();
  }
}

function syncEdge(edge) {
  edge.x = edge.ball.x + edge.ball.radius * edge.dir;
}
