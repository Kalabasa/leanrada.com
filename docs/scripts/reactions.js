
  import { BaseElement } from "/lib/base_element.mjs";
  import { waitFor } from "/lib/wait_for.mjs";

  const reactionTypes = ["bubble", "heart", "sun", "cloud", "fire"];
  const reactionData = {};

  customElements.define(
    "reactions-client",
    class ReactionsField extends BaseElement {
      constructor() {
        super();

        this.visibilityListener({
          show: () => this.start(),
        });
      }

      start() {
        if (this.hasInit) return;
        this.hasInit = true;

        this.classList.remove("reactions-invisible");

        const loadedData = this.loadData();

        for (const type of reactionTypes) {
          const increment = async () => {
            if (!(await loadedData)) return;

            window.goatcounter.count(eventVars(type));
            reactionData[type]++;

            this.renderCount(type, reactionData[type]);
          };

          for (const button of this.querySelectorAll(`.reaction-${type}-btn`)) {
            button.addEventListener("click", increment);
          }
        }
      }

      renderCount(type, content) {
        const countElements = this.querySelectorAll(`.reaction-${type}-count`);
        for (const countElement of countElements) {
          const prev =
            countElement.querySelector(".reaction-count-next")?.textContent ??
            countElement.textContent;

          countElement.innerHTML =
            `<div class="reaction-count-prev">${prev}</div>` +
            `<div class="reaction-count-next">${content}</div>`;

          countElement.addEventListener(
            "animationend",
            async () => {
              if (
                !countElement
                  .getAnimations({ subtree: true })
                  .every((animation) => animation.finished)
              ) {
                return;
              }

              countElement.textContent = content;

              if (
                !Number.isNaN(parseInt(prev)) &&
                !Number.isNaN(parseInt(content))
              ) {
                countElement.classList.add("reaction-spark");
                await delay(200);
                countElement.classList.remove("reaction-spark");
              }
            },
            { once: true }
          );
        }
      }

      // todo: prerender counts so they don't depend on the client lib
      async loadData() {
        const timeout = Symbol();
        try {
          await Promise.race([
            waitFor(() => window.goatcounter?.count != null),
            delay(8000).finally(() => {
              throw timeout;
            }),
          ]);
          await Promise.all(
            reactionTypes.map(async (type, i) => {
              this.renderCount(type, "");

              await delay(Math.random() * 2000);

              const eventURL = window.goatcounter.url(eventVars(type));
              const pagePath = new URL(eventURL).searchParams.get("p");
              if (!pagePath) throw new Error("Invalid eventURL!");

              const hits = await getHits(pagePath);
              reactionData[type] = hits;

              this.renderCount(type, hits > 0 ? hits : "");
            })
          );
          return true;
        } catch (error) {
          if (error !== timeout) throw error;

          for (const type of reactionTypes) {
            this.renderCount(type, "-");
          }

          const title = this.querySelector(".reaction-title");
          title.classList.add("reaction-title-error");
          title.textContent = "Couldn’t load reactions :(";

          return false;
        }
      }
    }
  );

  async function getHits(pagePath) {
    try {
      const res = await fetch(
        `https://kalabasa.goatcounter.com/counter/${pagePath}.json`,
        { mode: "cors" }
      );
      const data = await res.json();
      return parseInt(data.count.replaceAll(/\D/g, ""));
    } catch (err) {
      return 0;
    }
  }

  // returns goatcounter vars object
  function eventVars(reactionType) {
    return {
      path: (p) => eventName(p, reactionType),
      referrer: p,
      event: true,
    };
  }

  function eventName(pagePath, reactionType) {
    return `reaction-${reactionType}-${pagePath}`;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
