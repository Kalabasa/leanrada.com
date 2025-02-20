(() => {
  customElements.define(
    "bump-tally",
    class HitCounter extends HTMLElement {
      constructor() {
        super();

        this.innerHTML = String(this.textContent)
          .padStart(6, "0")
          .split("")
          .map((digit) => html`<span>${digit}</span>`)
          .join("");
        appendStyle(
          this.tagName,
          html`<style>
            bump-tally {
              container-type: inline-size;
              width: 100%;
              height: auto;
              text-align: center;
            }
            bump-tally span {
              display: inline-block;
              margin: 0 1.5px;
              padding: 0 6px;
              height: 54px;
              box-sizing: border-box;
              border: solid 1px var(--text2-clr);
              border-radius: 6px;
              font-family: var(--display-font);
              font-size: 36px;
              font-weight: bold;
            }
            @container (max-width: 240px) {
              bump-tally span {
                margin: 0 1px;
                padding: 0 1px;
                height: 40px;
                font-size: 27px;
              }
            }
            @container (max-width: 150px) {
              bump-tally span {
                margin: 0 1px;
                padding: 0 1px;
                height: 27px;
                font-size: 18px;
              }
            }
          </style>`
        );

        let populated = false;
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.target !== this) continue;
            if (!populated && entry.isIntersecting) {
              populated = true;
              this.#populate();
            }
          }
        });
        observer.observe(this);
      }

      async #populate() {
        const digitEls = Array.from(this.children);

        const loadingAnimationAbortController = new AbortController();
        for (let i = 0; i < digitEls.length; i++) {
          this.#animateDigitLoading(
            digitEls[i],
            loadingAnimationAbortController.signal
          );
        }

        const strDigits = String(await getHits()).padStart(
          digitEls.length,
          "0"
        );

        loadingAnimationAbortController.abort();
        for (let i = 0; i < digitEls.length; i++) {
          this.#animateDigit(
            digitEls[i],
            Number(strDigits[i]),
            200 + 100 * (i + 1)
          );
        }
      }

      async #animateDigitLoading(el, abortSignal) {
        while (!abortSignal.aborted) {
          el.textContent = Math.floor(Math.random() * 10);
          await delay(25 + Math.random() * 25);
        }
      }

      async #animateDigit(el, n, durationMs) {
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
          "https://kalabasa.goatcounter.com/counter/TOTAL.json",
          { mode: "cors" }
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
})();
