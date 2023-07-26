export class SweepAndPruneStratHighlight {
  constructor(sap, renderer) {
    this.sap = sap;
    this.renderer = renderer;
    this.lines = [];
    this.init();
  }

  init() {
    for (const edge of this.sap.edges) {
      this.lines.push(
        {
          edge,
          data:
            this.renderer.addLine(edge.x, edge.ball.y, edge.x, this.renderer.height, edge.ball.color),
        }
      );
    }
  }

  async step() {
    await this.sap.step();

    for (const { edge, data } of this.lines) {
      data[0] = data[2] = edge.x;
      data[1] = edge.ball.y;
    }
  }
}