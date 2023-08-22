
  import { BaseElement } from "/lib/base_element.mjs";

  customElements.define(
    "hit-counter-client",
    class HitCounter extends BaseElement {
      constructor() {
        super();

        this.visibilityListener({
          show: () => {
            if (this.shown) return;
            this.shown = true;
            this.onShow();
          },
        });
      }

      onShow() {
        this.populate();
      }

      async populate() {
        const digitEls = Array.from(this.querySelectorAll(".hit-digit"));
        const strDigits = String(await getHits()).padStart(
          digitEls.length,
          "0"
        );
        for (let i = 0; i < digitEls.length; i++) {
          this.animateDigit(
            digitEls[i],
            Number(strDigits[i]),
            200 + 100 * (i + 1)
          );
        }
      }

      async animateDigit(el, n, durationMs) {
        const current = parseInt(el.textContent);
        for (let i = 0; i < durationMs / 37.5; i++) {
          el.textContent = Math.floor(Math.random() * 10);
          await delay(25 + Math.random() * 25);
        }
        el.textContent = n;
      }
    }
  );

  async function getHits() {
    if (!getHits.result) {
      getHits.result = (async () => {
        const res = await fetch(
          "https://kalabasa.goatcounter.com/counter/TOTAL.json"
        );
        const data = await res.json();
        return parseInt(data.count.replaceAll(/\D/g, ""));
      })();
    }
    return getHits.result;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
