export class SimpleSweepAndPruneStrat {
  constructor(ballSim, sortFunc, processFunc, callbacks = {}, eventTarget = undefined) {
    this.ballSim = ballSim;
    this.sortFunc = sortFunc;
    this.processFunc = processFunc;
    this.callbacks = callbacks;
    this.eventTarget = eventTarget;
    this.tmpSet = new Set();
  }

  async step() {
    const { processFunc } = this;

    const sortedBalls = this.sortFunc([...this.ballSim.balls]);
    
    const { length } = sortedBalls;
    for (let i = 0; i < length; i++) {
      const ball1 = sortedBalls[i];
      for (let j = i + 1; j < length; j++) {
        const ball2 = sortedBalls[j]
        if (ball2.x - ball2.radius > ball1.x + ball1.radius) break;
        await processFunc(ball1, ball2);
      }
    }
  }
}
