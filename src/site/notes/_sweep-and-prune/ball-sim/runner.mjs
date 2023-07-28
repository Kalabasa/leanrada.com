export class Runner {
  constructor(collisionStrategy, ballSim, renderer) {
    this.collisionStrategy = collisionStrategy;
    this.ballSim = ballSim;
    this.renderer = renderer;
    this.collisionSkipFrames = 0;
    this.running = false;
    this.paused = false;
    this.updateCallbackID = undefined;
    this.renderCallbackID = undefined;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.updateLoop();
    this.renderLoop();
  }

  stop() {
    this.running = false;
    clearTimeout(this.updateCallbackID);
    clearTimeout(this.renderCallbackID);
  }

  async pause(duration) {
    return new Promise(resolve => {
      this.paused = true;
      setTimeout(() => {
        this.paused = false;
        resolve();
      }, duration);
    });
  }

  updateLoop = async () => {
    if (!this.running) return;
    if (!this.paused) {
      this.ballSim.step();
      await this.collisionStrategy.step();
    }
    this.updateCallbackID = setTimeout(this.updateLoop, 25);
  }

  renderLoop = async () => {
    if (!this.running) return;
    this.renderer.render();
    this.renderCallbackID = setTimeout(this.renderLoop, 25);
  }
}
