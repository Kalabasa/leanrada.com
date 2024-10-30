export class BasePainter {
  constructor() {}

  /**
   * @param {import("./generate-path.js").Stroke[]} path
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {void}
   */
  *drawPath(path, canvasContext) {
    for (const stroke of path) {
      yield* this.drawStroke(stroke, canvasContext);
    }
  }

  /**
   * @param {import("./generate-path.js").Stroke} stroke
   * @param {CanvasRenderingContext2D} canvasContext
   * @yields {void}
   */
  *drawStroke(stroke, canvasContext) {
    const brush = {
      x: stroke.vertices[0].x,
      y: stroke.vertices[0].y,
      z: 0,
    };

    canvasContext.lineCap = "round";
    canvasContext.strokeStyle = "#000";

    let index = 0;
    let limit = 5000;
    while (index < stroke.vertices.length && limit > 0) {
      limit--;

      const vertex = stroke.vertices[index];

      const nextX = vertex.x;
      const nextY = vertex.y;
      canvasContext.beginPath();
      canvasContext.moveTo(brush.x, brush.y);
      canvasContext.lineTo(nextX, nextY);
      canvasContext.lineWidth = 20;
      yield canvasContext.stroke();
      brush.x = nextX;
      brush.y = nextY;

      if (
        Math.hypot(vertex.x - brush.x, vertex.y - brush.y) <=
        this.reachThreshold()
      ) {
        index++;
      }
    }
  }

  reachThreshold() {
    return 5;
  }
}
