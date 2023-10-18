
  import { waitFor } from "/lib/wait_for.mjs";

  const reactionTypes = ["bubble", "heart", "sun", "cloud", "fire"];
  const reactionData = {};
  const loadedData = loadData();

  for (const type of reactionTypes) {
    const buttonClass = `reaction-${type}-btn`;
    const countClass = `reaction-${type}-count`;

    const increment = async () => {
      if (!(await loadedData)) return;

      window.goatcounter.count(eventVars(type));
      reactionData[type]++;

      for (const count of document.querySelectorAll("." + countClass)) {
        renderCount(count, reactionData[type]);
      }
    };

    for (const button of document.querySelectorAll("." + buttonClass)) {
      button.addEventListener("click", increment);
    }
  }

  function renderCount(countElement, content) {
    const prev =
      countElement.querySelector(".reaction-count-next")?.textContent ??
      countElement.textContent;
    countElement.innerHTML =
      `<div class="reaction-count-prev">${prev}</div>` +
      `<div class="reaction-count-next">${content}</div>`;
    countElement.addEventListener("animationend", async () => {
      if (
        !countElement
          .getAnimations({ subtree: true })
          .every((animation) => animation.finished)
      )
        return;

      countElement.textContent = content;

      if (!Number.isNaN(parseInt(content))) {
        countElement.classList.add("reaction-spark");
        await delay(200);
        countElement.classList.remove("reaction-spark");
      }
    });
  }

  // returns goatcounter vars object
  function eventVars(reactionType) {
    return {
      path: (p) => eventName(p, reactionType),
      event: true,
    };
  }

  // todo: prerender counts so they don't depend on the client lib
  async function loadData() {
    const timeout = Symbol();
    try {
      await Promise.race([
        waitFor(() => window.goatcounter?.count != null),
        delay(8000).finally(() => {
          throw timeout;
        }),
      ]);
      await Promise.all(
        reactionTypes.map(async (type) => {
          const eventURL = window.goatcounter.url(eventVars(type));
          const pagePath = new URL(eventURL).searchParams.get("p");
          const hits = await getHits(pagePath);
          reactionData[type] = hits;

          if (hits > 0) {
            const countClass = `reaction-${type}-count`;
            for (const count of document.querySelectorAll("." + countClass)) {
              renderCount(count, hits);
            }
          }
        })
      );
      return true;
    } catch (error) {
      if (error !== timeout) throw error;

      for (const count of document.querySelectorAll(".reaction-count")) {
        renderCount(count, "?");
      }

      const title = document.querySelector(".reaction-title");
      title.classList.add("reaction-title-error");
      title.textContent = "Couldn’t load reactions :(";

      return false;
    }
  }

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

  function eventName(pagePath, reactionType) {
    return `reaction-${reactionType}-${pagePath}`;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
