import "/lib/vendor/p5.min.js";
import { waitFor } from "/lib/wait_for.mjs";

const basePath = "/notes/_watercolour-simulation-with-webgl/demo/";
const identityVert = fetch(basePath + "identity.vert").then(r => r.text());
// const waterFrag = fetch(basePath + "water.frag").then(r => r.text());
// const paintFrag = fetch(basePath + "paint.frag").then(r => r.text());
const flowFrag = fetch(basePath + "flow.frag").then(r => r.text());

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
    this.flowMap = null;
    this.paintMap = null;
    this.bufferMap = null;

    this.identityVertCode = null;
    this.flowFragCode = null;
    this.waterFragCode = null;
    this.paintFragCode = null;

    this.flowPass1Shader = null;
    this.flowPass2Shader = null;

    this.actionRadius = 0;
    this.actionCallbacks = [];
    this.waterUpdateQueue = [];
    this.paintUpdateQueue = [];
  }

  async init() {
    this.identityVertCode = await identityVert;
    this.flowFragCode = await flowFrag;
    // this.waterFragCode = await waterFrag;
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

      this.flowMap = this.p5.createGraphics(this.width, this.height, this.p5.WEBGL);
      // normalize webgl coords
      this.flowMap.translate(-this.width / 2, -this.height / 2);
      this.flowMap.background(0);

      let flowPass1FragCode = "#define passIndex 0\n" + this.flowFragCode;
      let flowPass2FragCode = "#define passIndex 1\n" + this.flowFragCode;

      // if (this.rules.blurWater) {
      //   flowPass1FragCode = "#define blurWater\n" + flowPass1FragCode;
      //   flowPass2FragCode = "#define blurWater\n" + flowPass2FragCode;
      // }

      this.flowPass1Shader = this.flowMap.createShader(this.identityVertCode, flowPass1FragCode);
      this.flowPass2Shader = this.flowMap.createShader(this.identityVertCode, flowPass2FragCode);

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

  update = () => {
    if (this.waterMap) {
      // this.flowMap.image(this.waterMap, 0, 0, this.width, this.height);

      // this.waterMap.push();
      // this.waterMap.noStroke();

      // // Copy current state on work buffer
      // this.bufferMap.image(this.waterMap, 0, 0, this.width, this.height);

      // // Apply updates
      // while (this.waterUpdateQueue.length > 0) this.waterUpdateQueue.pop()();

      // // Simulate next state via shader
      // // First pass
      // this.waterMap.shader(this.waterPass1Shader);
      // this.waterPass1Shader.setUniform("waterTex", this.bufferMap);
      // this.waterPass1Shader.setUniform("texelSize", [1.0 / this.width, 1.0 / this.height]);
      // this.waterMap.quad(0, 0, 1, 0, 1, 1, 0, 1);

      // // Copy back to work buffer
      // this.bufferMap.image(this.waterMap, 0, 0, this.width, this.height);

      // // Second pass
      // this.waterMap.shader(this.waterPass2Shader);
      // this.waterPass2Shader.setUniform("waterTex", this.bufferMap);
      // this.waterPass2Shader.setUniform("texelSize", [1.0 / this.width, 1.0 / this.height]);
      // this.waterMap.quad(0, 0, 1, 0, 1, 1, 0, 1);

      // this.waterMap.pop();

      // this.flowMap.blend(this.waterMap, 0, 0, this.width, this.height);
    }

    if (this.paintMap) {
      this.paintMap.push();
      this.paintMap.noStroke();

      // Copy current state on work buffer
      this.bufferMap.clear();
      this.bufferMap.image(this.paintMap, 0, 0, this.width, this.height);

      // Apply updates
      while (this.paintUpdateQueue.length > 0) this.paintUpdateQueue.pop()();

      // Simulate next state via shader
      this.paintMap.clear();
      this.paintMap.shader(this.paintShader);
      this.paintShader.setUniform("waterTex", this.waterMap);
      this.paintShader.setUniform("paintTex", this.bufferMap);
      this.paintMap.quad(0, 0, 1, 0, 1, 1, 0, 1);

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
  }

  act = (x, y) => {
    for (const callback of this.actionCallbacks) {
      callback(x, y);
    }
  };

  actWater = (x, y) => {
    this.waterUpdateQueue.unshift(() => {
      this.bufferMap.noStroke();
      this.bufferMap.fill(255, 32);
      this.bufferMap.circle(x, y, this.actionRadius * 2);
    });
  };

  actPaint = (x, y) => {
    this.paintUpdateQueue.unshift(() => {
      this.bufferMap.noStroke();
      this.bufferMap.fill(255, 0, 0, 32);
      this.bufferMap.circle(x, y, this.actionRadius * 2);
    });
  };
}
