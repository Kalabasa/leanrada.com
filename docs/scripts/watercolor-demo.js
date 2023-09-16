
  import { BaseElement } from "/lib/base_element.mjs";
  import { WatercolorDemo } from "/notes/_watercolour-simulation-with-webgl/demo/watercolor-demo.mjs";

  customElements.define(
    "watercolor-demo-client",
    class WatercolorDemoClient extends BaseElement {
      constructor() {
        super();
        this.hasInit = false;
        this.watercolorDemo = null;
      }

      connectedCallback() {
        super.connectedCallback();

        this.visibilityListener({
          show: () => {
            if (!this.hasInit) this.init();
            this.watercolorDemo.start();
          },
          hide: () => {
            this.watercolorDemo.stop();
          },
        });
      }

      init() {
        this.hasInit = true;

        const rulesAttr = this.getAttribute("rules").split(",");
        const rules = {};
        rules.water = rulesAttr.includes("water");
        
        const actionAttr = this.getAttribute("action").split(",");
        const action = {};
        action.water = rulesAttr.includes("water");

        this.watercolorDemo = new WatercolorDemo(this, rules, action);
        this.watercolorDemo.init();
      }
    }
  );
