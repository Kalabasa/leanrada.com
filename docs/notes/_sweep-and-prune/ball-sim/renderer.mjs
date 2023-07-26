export class Renderer {
  constructor(ballSim, canvas, labels) {
    this.ballSim = ballSim;
    this.lines = new Set();
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.labels = labels;
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  addLine(x1, y1, x2, y2, color) {
    const line = [x1, y1, x2, y2, color];
    this.lines.add(line);
    return line;
  }

  removeLine(line) {
    this.lines.delete(line);
  }

  render() {
    /** @type {{context:CanvasRenderingContext2D}} */
    const { context } = this;
    const { width, height } = this.canvas;
    const { balls } = this.ballSim;

    context.clearRect(0, 0, width, height);

    context.lineWidth = 2;

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];

      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
      context.fillStyle = context.strokeStyle = ball.color ?? "#ccc";
      context.fill();
      context.stroke();

      const label = this.labels[i];
      if (label) {
        context.font = "30px bold Space Mono, sans-serif";
        context.fillStyle = "#000";
        context.fillText(label, ball.x - 10, ball.y + 10);
      }
    }

    for (const line of this.lines) {
      const [x1, y1, x2, y2, color] = line;
      context.beginPath();
      context.moveTo(x1, y1)
      context.lineTo(x2, y2);
      context.strokeStyle = color;
      context.stroke();
    }
  }
}