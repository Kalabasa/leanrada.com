export class PairwiseStrat {
  constructor(ballSim, processFunc) {
    this.ballSim = ballSim;
    this.processFunc = processFunc;
  }

  async step() {
    const { processFunc } = this;
    const { balls } = this.ballSim;
    const { length } = balls;
    for (let i = 0; i < length; i++) {
      const ball1 = balls[i];
      for (let j = i + 1; j < length; j++) {
        const ball2 = balls[j]
        await processFunc(ball1, ball2);
      }
    }
  }
}
