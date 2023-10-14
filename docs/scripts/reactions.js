
  import { waitFor } from "/lib/wait_for.mjs";

  const reactionTypes = ["bubble", "heart", "sun", "cloud", "fire"];
  const reactionData = {};
  const loadingData = loadData();

  for (const type of reactionTypes) {
    const buttonClass = `reaction-${type}-btn`;
    const countClass = `reaction-${type}-count`;

    const increment = async () => {
      await loadingData;
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

  function renderCount(countElement, number) {
    const prev =
      countElement.querySelector(".reaction-count-next")?.textContent ??
      countElement.textContent;
    countElement.innerHTML =
      `<div class="reaction-count-prev">${prev}</div>` +
      `<div class="reaction-count-next">${number}</div>`;
    countElement.addEventListener("animationend", async () => {
      if (
        !countElement
          .getAnimations({ subtree: true })
          .every((animation) => animation.finished)
      )
        return;

      countElement.textContent = number;
      countElement.classList.add("reaction-spark");
      await delay(200);
      countElement.classList.remove("reaction-spark");
    });
  }

  // returns goatcounter vars object
  function eventVars(reactionType) {
    return {
      path: (p) => eventName(p, reactionType),
      event: true,
    };
  }

  async function loadData() {
    await waitFor(() => window.goatcounter?.count != null);
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
