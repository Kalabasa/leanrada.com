export class SkippingDelegateStrat {
  constructor (interval, delegate) {
    this.interval = interval;
    this.delegate = delegate;
    this.count = 0;
  }

  async step() {
    if (this.count > 0) {
      this.count--;
    } else {
      this.count = this.interval;
      await this.delegate.step();
    }
  }
}
