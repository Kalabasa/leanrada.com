export class Renderer {
  constructor(ballSim, canvas, labels, draggable) {
    this.ballSim = ballSim;
    this.lines = new Set();
    this.canvas = canvas;
    this.labels = labels;
    this.draggable = draggable;
    this.context = canvas.getContext("2d");
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  addLine(line) {
    this.lines.add(line);
    return line;
  }

  removeLine(line) {
    this.lines.delete(line);
  }

  render() {
    /** @type {{context:CanvasRenderingContext2D}} */
    const { context, draggable } = this;
    const { width, height } = this.canvas;
    const { balls } = this.ballSim;

    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    context.lineWidth = 2;

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];

      context.beginPath();
      context.arc(
        ball.x,
        ball.y,
        ball.radius + context.lineWidth * 0.5,
        0,
        2 * Math.PI
      );
      context.fillStyle = getColor(ball);
      context.fill();

      const label = this.labels[i];
      if (label) {
        context.font = "30px bold Space Mono, sans-serif";
        context.fillStyle = "#000";
        context.fillText(label, ball.x - 10 * label.length, ball.y + 10);
      }
    }

    if (draggable) {
      context.setLineDash([6, 9]);
      for (const ball of balls) {
        context.beginPath();
        context.arc(
          ball.x,
          ball.y,
          ball.radius - context.lineWidth * 1,
          0,
          2 * Math.PI
        );
        context.strokeStyle = "#000";
        context.stroke();
      }
      context.setLineDash([]);
    }

    for (const line of this.lines) {
      const { x1, y1, x2, y2, color, dash = [] } = line;
      context.setLineDash(dash);
      context.beginPath();
      context.moveTo(x1, y1)
      context.lineTo(x2, y2);
      context.strokeStyle = color;
      context.stroke();
    }
    context.setLineDash([]);
  }
}

export function getColor(ball) {
  return ball?.color ?? "#ccc";
}