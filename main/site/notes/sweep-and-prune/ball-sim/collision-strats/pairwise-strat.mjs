export class PairwiseStrat {
  constructor(ballSim, renderer, processFunc) {
    this.ballSim = ballSim;
    this.width = renderer.width;
    this.height = renderer.height;
    this.processFunc = processFunc;
  }

  async step() {
    const { processFunc } = this;
    const { balls } = this.ballSim;
    const { length } = balls;

    // sorting balls makes it easier to visualise
    const sortedBalls = [...balls].sort((a, b) => this.sortRank(a) - this.sortRank(b));

    for (let i = 0; i < length; i++) {
      const ball1 = sortedBalls[i];
      for (let j = i + 1; j < length; j++) {
        const ball2 = sortedBalls[j]
        await processFunc(ball1, ball2);
      }
    }
  }

  sortRank(ball) {
    // Clockwise around the centerish
    return Math.atan2(
      ball.x - this.width * 0.6,
      this.height * 0.7 - ball.y
    );
  }
}
