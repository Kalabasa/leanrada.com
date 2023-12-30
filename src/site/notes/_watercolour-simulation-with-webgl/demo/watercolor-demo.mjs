import "/lib/vendor/p5.min.js";
import { waitFor } from "/lib/wait_for.mjs";

const basePath = "/notes/_watercolour-simulation-with-webgl/demo/";
const identityVert = fetch(basePath + "identity.vert").then(r => r.text());
const waterFrag = fetch(basePath + "water.frag").then(r => r.text());
// const paintFrag = fetch(basePath + "paint.frag").then(r => r.text());

// 1. Generate 2D displacement map from moisture map
// 2. Apply displacement to the moisture map
// 3. Apply displacement to the paint map
// 4. Evaporate

export class WatercolorDemo {
  constructor(container, rules, action, display) {
    this.container = container;
    this.rules = rules;
    this.action = action;
    this.display = display;

    this.width = null;
    this.height = null;

    this.p5 = null;

    this.waterMap = null;
    this.paintMap = null;
    this.bufferMap = null;

    this.identityVertCode = null;
    this.waterFragCode = null;
    this.paintFragCode = null;

    this.waterShader = null;

    this.actionRadius = 0;
    this.actionCallbacks = [];
    this.waterUpdateQueue = [];
    this.paintUpdateQueue = [];
  }

  async init() {
    this.identityVertCode = await identityVert;
    this.waterFragCode = await waterFrag;
    // this.paintFragCode = await paintFrag;

    // wait for library
    await waitFor(() => window.p5 != null);
    new window.p5(this.initP5, this.container);

    // wait for init completion
    await waitFor(() => this.p5 != null);

    this.bufferMap = this.p5.createGraphics(this.width, this.height, this.p5.WEBGL);
    // normalize webgl coords
    this.bufferMap.translate(-this.width / 2, -this.height / 2);

    if (this.rules.water) {
      this.waterMap = this.p5.createGraphics(this.width, this.height, this.p5.WEBGL);
      // normalize webgl coords
      this.waterMap.translate(-this.width / 2, -this.height / 2);
      this.waterMap.background(0);

      this.waterShader = this.waterMap.createShader(this.identityVertCode, this.waterFragCode);

      if (this.action.water) {
        this.actionCallbacks.push(this.actWater);
      }
    }

    if (this.rules.paint) {
      this.paintMap = this.p5.createGraphics(this.width, this.height, this.p5.WEBGL);
      // normalize webgl coords
      this.paintMap.translate(-this.width / 2, -this.height / 2);
      this.paintMap.background(255, 0);

      this.paintShader = this.paintMap.createShader(this.identityVertCode, this.paintFragCode);

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

  destroy() {
    this.p5.remove();
    this.p5 = null;
  }

  update = () => {
    if (this.waterMap) {

      this.waterMap.push();

      // Apply updates
      while (this.waterUpdateQueue.length > 0) this.waterUpdateQueue.pop()();

      // Apply flow
      // this.bufferMap.copy(this.waterMap, -this.width / 2, -this.height / 2, this.width, this.height, 0, 0, this.width, this.height);
      // this.waterShader.setUniform("waterTex", this.bufferMap);
      // this.waterShader.setUniform("texelSize", [1.0 / this.width, 1.0 / this.height]);
      // this.waterMap.shader(this.waterShader);
      // this.waterMap.quad(0, 0, 1, 0, 1, 1, 0, 1);

      this.waterMap.pop();
    }

    if (this.paintMap) {
      this.paintMap.push();
      this.paintMap.pop();
    }

    // render
    this.p5.background(0);
    if (this.display.water && this.waterMap) {
      this.p5.image(this.waterMap, -this.width / 2, -this.height / 2, this.width, this.height);
    }
    if (this.display.paint && this.paintMap) {
      this.p5.image(this.paintMap, -this.width / 2, -this.height / 2, this.width, this.height);
    }
    if (this.p5.keyIsPressed) {
      this.p5.image(this.bufferMap, -this.width / 2, -this.height / 2, this.width, this.height);
    }
  }

  act = (x, y) => {
    for (const callback of this.actionCallbacks) {
      callback(x, y);
    }
  };

  actWater = (x, y) => {
    this.waterUpdateQueue.unshift(() => {
      this.waterMap.noStroke();
      this.waterMap.fill(255, 32);
      this.waterMap.circle(x, y, this.actionRadius * 2);
    });
  };

  actPaint = (x, y) => {
    this.paintUpdateQueue.unshift(() => {
      this.paintMap.noStroke();
      this.paintMap.fill(255, 0, 0, 32);
      this.paintMap.circle(x, y, this.actionRadius * 2);
    });
  };
}
