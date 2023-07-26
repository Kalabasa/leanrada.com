const GRAVITY = 0.4;
const RESTITUTION = 0.98;

export class BallSim {
  constructor(width, height, initBalls, isStatic) {
    this.width = width;
    this.height = height;
    this.balls = initBalls;
    this.static = isStatic;
  }

  step() {
    for (const ball of this.balls) {
      if (!this.static) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += GRAVITY;
      }

      const { x, y, radius } = ball;

      if (x - radius < 0) {
        ball.x = radius;
        ball.vx *= -RESTITUTION;
      } else if (x + radius > this.width) {
        ball.x = this.width - radius;
        ball.vx *= -RESTITUTION;
      }

      if (y + radius > this.height) {
        ball.y = this.height - radius;
        ball.vy *= -RESTITUTION;
      } else if (y - radius < 0) {
        ball.y = radius;
        ball.vy *= -RESTITUTION;
      }
    }
  }
}

BallSim.create = function (width, height) {
  const initBalls = [];
  let isStatic = false;

  return {
    setStatic(value) {
      isStatic = value;
      return this;
    },
    addBall(x, y, radius) {
      const vx = 8 * (Math.random() * 2 - 1);
      const vy = 2 * (Math.random() * 2 - 1);
      initBalls.push({ x, y, vx, vy, radius, color: undefined });
      return this;
    },
    addRandomBalls(count, sizeMultiplier) {
      const meanRadius = Math.min(width, height) * sizeMultiplier;
      for (let i = 0; i < count; i++) {
        const radius = meanRadius * (0.9 + 0.2 * Math.random());
        const x = radius + (width - radius * 2) * Math.random();
        const y = radius + (height - radius * 2) * Math.random();
        this.addBall(x, y, radius);
      }
      return this;
    },
    build() {
      return new BallSim(width, height, initBalls, isStatic);
    }
  };
}
