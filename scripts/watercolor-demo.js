
  import { BaseElement } from "/lib/base_element.mjs";
  import { WatercolorDemo } from "/notes/_watercolour-simulation-with-webgl/demo/watercolor-demo.mjs";

  customElements.define(
    "watercolor-demo-client",
    class WatercolorDemoClient extends BaseElement {
      constructor() {
        super();
        this.hasInit = false;
        this.watercolorDemo = null;
        this.isPointerDown = false;
      }

      connectedCallback() {
        super.connectedCallback();

        this.visibilityListener({
          show: () => this.start(),
          hide: () => this.stop(),
        });

        this.aliveListener(this, "pointerdown", this.onDown);
        this.aliveListener(this, "pointermove", this.onMove);
        this.aliveListener(this, "pointerup", this.onUp);
      }

      start() {
        const rulesAttr = this.getAttribute("rules").split(",");
        const rules = {};
        rules.water = rulesAttr.includes("water");
        rules.paint = rulesAttr.includes("paint");
        rules.blurWater = rulesAttr.includes("blur-water");

        const actionAttr = this.getAttribute("action").split(",");
        const action = {};
        action.water = rulesAttr.includes("water");
        action.paint = rulesAttr.includes("paint");

        const displayAttr = this.getAttribute("display").split(",");
        const display = {};
        display.water = displayAttr.includes("water");
        display.paint = displayAttr.includes("paint");

        this.watercolorDemo = new WatercolorDemo(this, rules, action, display);
        this.watercolorDemo.init();
        this.watercolorDemo.start();
      }

      stop() {
        this.watercolorDemo.stop();
        this.watercolorDemo.destroy();
        this.watercolorDemo = null;
      }

      onDown = (event) => {
        const x = event.offsetX;
        const y = event.offsetY;
        this.watercolorDemo.act(x, y);
        this.isPointerDown = true;
      };

      onMove = (event) => {
        if (!this.isPointerDown) return;
        const x = event.offsetX;
        const y = event.offsetY;
        this.watercolorDemo.act(x, y);
      };

      onUp = (event) => {
        this.isPointerDown = false;
      };
    }
  );
