import "/lib/vendor/p5.min.js";
import { waitFor } from "/lib/wait_for.mjs";

export class WatercolorDemo {
  constructor(container, rules, action) {
    this.container = container;
    this.rules = rules;
    this.action = action;
    this.width = null;
    this.height = null;
    this.p5 = null;
  }

  async init() {
    await waitFor(() => window.p5 != null);
    new window.p5(this.initP5, this.container);
  }

  initP5 = (p5) => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    p5.setup = () => {
      p5.createCanvas(this.width, this.height);
      p5.noLoop();
      this.p5 = p5;
    };
    p5.draw = this.update;
  }

  start() {
    waitFor(() => this.p5 != null).then(() => this.p5.loop());
  }

  stop() {
    this.p5.noLoop();
  }

  update = () => {
    this.p5.background(82);
  }
}
