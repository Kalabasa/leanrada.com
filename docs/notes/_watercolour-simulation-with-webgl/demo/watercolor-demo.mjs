import "/lib/vendor/p5.min.js";
import { waitFor } from "/lib/wait_for.mjs";

const basePath = "/notes/_watercolour-simulation-with-webgl/demo/";
const identityVert = fetch(basePath + "identity.vert").then(r => r.text());
const waterFrag = fetch(basePath + "water.frag").then(r => r.text());
const paintFrag = fetch(basePath + "paint.frag").then(r => r.text());

export class WatercolorDemo {
  constructor(container, rules, action) {
    this.container = container;
    this.rules = rules;
    this.action = action;

    this.width = null;
    this.height = null;

    this.p5 = null;

    this.waterGraphics = null;
    this.paintGraphics = null;
    this.bufferGraphics = null;

    this.identityVertCode = null;
    this.waterFragCode = null;
    this.paintFragCode = null;
    this.waterShader = null;
    this.paintShader = null;

    this.actionRadius = 0;
    this.actionCallbacks = [];
    this.waterUpdateQueue = [];
    this.paintUpdateQueue = [];
  }

  async init() {
    this.identityVertCode = await identityVert;
    this.waterFragCode = await waterFrag;
    this.paintFragCode = await paintFrag;

    // wait for library
    await waitFor(() => window.p5 != null);
    new window.p5(this.initP5, this.container);

    // wait for init completion
    await waitFor(() => this.p5 != null);

    this.bufferGraphics = this.p5.createGraphics(this.width, this.height, this.p5.WEBGL);
    // normalize webgl coords
    this.bufferGraphics.translate(-this.width / 2, -this.height / 2);

    if (this.rules.water) {
      this.waterGraphics = this.p5.createGraphics(this.width, this.height, this.p5.WEBGL);
      // normalize webgl coords
      this.waterGraphics.translate(-this.width / 2, -this.height / 2);
      this.waterGraphics.background(0);

      if (this.rules.blurWater) {
        this.waterFragCode = "#define blurWater\n" + this.waterFragCode;
      }

      this.waterShader = this.waterGraphics.createShader(this.identityVertCode, this.waterFragCode);

      if (this.action.water) {
        this.actionCallbacks.push(this.actWater);
      }
    }

    if (this.rules.paint) {
      this.paintGraphics = this.p5.createGraphics(this.width, this.height, this.p5.WEBGL);
      // normalize webgl coords
      this.paintGraphics.translate(-this.width / 2, -this.height / 2);
      this.paintGraphics.background(255, 0);

      this.paintShader = this.paintGraphics.createShader(this.identityVertCode, this.paintFragCode);

      if (this.action.paint) {
        this.actionCallbacks.push(this.actPaint);
      }
    }
  }

  initP5 = (p5) => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.actionRadius = Math.round(Math.min(this.width, this.height) * 0.05);

    p5.setup = () => {
      p5.createCanvas(this.width, this.height, p5.WEBGL);
      p5.noLoop();
      p5.frameRate(30);
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
    if (this.paintGraphics) {
      this.paintGraphics.push();

      // Copy current state on work buffer
      this.bufferGraphics.background(0);
      this.bufferGraphics.image(this.paintGraphics, 0, 0, this.width, this.height);

      // Apply updates
      while (this.paintUpdateQueue.length > 0) this.paintUpdateQueue.pop()();

      // Simulate next state via shader
      this.paintGraphics.noStroke();
      this.paintGraphics.shader(this.paintShader);
      this.paintShader.setUniform("waterTex", this.waterGraphics);
      this.paintShader.setUniform("paintTex", this.bufferGraphics);
      this.paintGraphics.quad(0, 0, 1, 0, 1, 1, 0, 1);

      this.paintGraphics.pop();
    }

    if (this.waterGraphics) {
      this.waterGraphics.push();

      // Copy current state on work buffer
      this.bufferGraphics.background(0);
      this.bufferGraphics.image(this.waterGraphics, 0, 0, this.width, this.height);

      // Apply updates
      while (this.waterUpdateQueue.length > 0) this.waterUpdateQueue.pop()();

      // Simulate next state via shader
      this.waterGraphics.noStroke();
      this.waterGraphics.shader(this.waterShader);
      this.waterShader.setUniform("waterTex", this.bufferGraphics);
      this.waterGraphics.quad(0, 0, 1, 0, 1, 1, 0, 1);

      this.waterGraphics.pop();
    }

    if (this.paintGraphics) {
      this.p5.image(this.paintGraphics, -this.width / 2, -this.height / 2, this.width, this.height);
    } else if (this.waterGraphics) {
      this.p5.image(this.waterGraphics, -this.width / 2, -this.height / 2, this.width, this.height);
    }
  }

  act = (x, y) => {
    for (const callback of this.actionCallbacks) {
      callback(x, y);
    }
  };

  actWater = (x, y) => {
    this.waterUpdateQueue.unshift(() => {
      this.bufferGraphics.noStroke();
      this.bufferGraphics.fill(255, 32);
      this.bufferGraphics.circle(x, y, this.actionRadius * 2);
    });
  };

  actPaint = (x, y) => {
    this.paintUpdateQueue.unshift(() => {
      this.bufferGraphics.noStroke();
      this.bufferGraphics.fill(255, 0, 0, 32);
      this.bufferGraphics.circle(x, y, this.actionRadius * 2);
    });
  };
}
