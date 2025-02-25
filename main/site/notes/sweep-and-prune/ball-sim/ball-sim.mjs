import { SweepAndPruneStrat } from "./collision-strats/sap-strat.mjs";
import { createProcessPhysicsFunc } from "./process-physics.mjs";

const GRAVITY = 0.4;
const RESTITUTION = 0.96;

export class BallSim {
  constructor(width, height, initBalls, isStatic, eventTarget = undefined) {
    this.width = width;
    this.height = height;
    this.balls = initBalls;
    this.static = isStatic;
    this.eventTarget = eventTarget;
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

    if (this.eventTarget) {
      const event = new Event("simulate");
      event.balls = this.balls;
      this.eventTarget.dispatchEvent(event);
    }
  }
}

BallSim.create = function (width, height) {
  const initBalls = [];
  let isStatic = false;
  let eventTarget = undefined;

  return {
    setStatic(value) {
      isStatic = value;
      return this;
    },
    setEventTarget(value) {
      eventTarget = value;
      return this;
    },
    addBall(x, y, radius) {
      const vx = 6 * (Math.random() * 2 - 1);
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
      const ballSim = new BallSim(width, height, initBalls, isStatic, eventTarget);

      if (isStatic) {
        // Initially settle collisions before becoming static as asked
        const sapStrat = new SweepAndPruneStrat(
          ballSim,
          (arr) => arr.sort((a, b) => a.x - b.x),
          createProcessPhysicsFunc()
        );
        sapStrat.step();
      }

      return ballSim;
    }
  };
}
