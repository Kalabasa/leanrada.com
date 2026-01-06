export const reactionTypes = ["bubble", "heart", "sun", "cloud", "fire"];

const reactionState = reactionTypes.reduce((acc, type) => {
  acc[type] = 0;

  if (typeof window !== "undefined" && window.sessionStorage) {
    const cached = window.sessionStorage.getItem(sessionCacheKey(type));
    try {
      if (cached) acc[type] = parseInt(cached, 10) || 0;
    } catch {}
  }

  return acc;
}, {});

globalThis.customElements?.define(
  "article-reactions",
  class ArticleReactions extends HTMLElement {
    constructor() {
      super();

      this.classList.add("reactions-invisible");

      this.innerHTML = html`
        <h2 class="reaction-title">React to this post</h2>
        <button class="reaction-btn reaction-heart-btn">
          <span class="reaction-icon" aria-label="Heart"></span>
        </button>
        <div class="reaction-count reaction-heart-count"></div>
        <button class="reaction-btn reaction-fire-btn">
          <span class="reaction-icon" aria-label="Fire"></span>
        </button>
        <div class="reaction-count reaction-fire-count"></div>
        <button class="reaction-btn reaction-bubble-btn">
          <span class="reaction-icon" aria-label="Bubble"></span>
        </button>
        <div class="reaction-count reaction-bubble-count"></div>
        <button class="reaction-btn reaction-sun-btn">
          <span class="reaction-icon" aria-label="Sun"></span>
        </button>
        <div class="reaction-count reaction-sun-count"></div>
        <button class="reaction-btn reaction-cloud-btn">
          <span class="reaction-icon" aria-label="Cloud"></span>
        </button>
        <div class="reaction-count reaction-cloud-count"></div>
        <div class="reaction-error"></div>
      `;

      appendStyle(
        this.tagName,
        html`<style>
          article-reactions {
            display: grid;
            margin-inline: auto;
            grid-template-rows: repeat(3, auto);
            grid-auto-flow: column;
            justify-content: center;
            justify-items: center;
            gap: 6px;
            border: solid 1px var(--card-clr);
            border-radius: 6px;
            padding: 18px;
            font-family: var(--default-font);
          }

          .reaction-title {
            grid-column: span 5;
            margin: 0 0 6px;
            font-size: 18px;
          }

          .reaction-title-error {
            color: var(--clr1);
          }

          .reaction-heart-btn,
          .reaction-heart-count {
            --reaction-color: #bf1852;
          }
          .reaction-fire-btn,
          .reaction-fire-count {
            --reaction-color: #c68306;
          }
          .reaction-bubble-btn,
          .reaction-bubble-count {
            --reaction-color: #07bd80;
          }
          .reaction-sun-btn,
          .reaction-sun-count {
            --reaction-color: #a09b00;
          }
          .reaction-cloud-btn,
          .reaction-cloud-count {
            --reaction-color: #8063ff;
          }

          .reaction-count {
            position: relative;
            font-size: 18px;
            width: 100%;
            height: 18px;
            text-align: center;
            overflow: hidden;
          }
          .reaction-count-prev,
          .reaction-count-next {
            position: relative;
            height: 100%;
            animation: reaction-tick 0.3s var(--ease) forwards;
          }

          @keyframes reaction-tick {
            from {
              top: 0;
            }
            to {
              top: -100%;
            }
          }

          .reaction-count.reaction-spark::after {
            position: absolute;
            content: "";
            width: 36px;
            height: 36px;
            left: calc(50% - 18px);
            top: calc(100% - 18px);
            border-radius: 50%;
            animation: reaction-spark 0.1s ease-out;
          }

          @keyframes reaction-spark {
            from {
              box-shadow: inset 0 0 0 18px var(--reaction-color);
            }
            to {
              box-shadow: inset 0 0 0 0px var(--reaction-color);
            }
          }

          .reaction-btn {
            background: none;
            border: none;
            border-radius: 6px;
            width: 32px;
            height: 32px;
            padding: 2px;
            box-sizing: content-box;
            cursor: pointer;
          }
          .reaction-btn:focus-visible,
          .reaction-btn:hover {
            background: var(--reaction-color);
          }
          .reaction-btn:focus-visible .reaction-icon,
          .reaction-btn:hover .reaction-icon {
            animation-duration: 0.5s;
          }
          .reaction-btn:active .reaction-icon {
            position: relative;
            top: 2px;
          }

          .reaction-icon {
            display: block;
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
            background-image: url("/icons/reactions.png");
            background-size: 500% 200%;
            animation: reaction-icon 1.5s steps(2) infinite;
          }
          .reactions-invisible .reaction-icon {
            background-image: none;
          }
          .reaction-heart-btn .reaction-icon {
            --sheet-x: 25%;
          }
          .reaction-bubble-btn .reaction-icon {
            --sheet-x: 0%;
          }
          .reaction-sun-btn .reaction-icon {
            --sheet-x: 100%;
          }
          .reaction-cloud-btn .reaction-icon {
            --sheet-x: 75%;
          }
          .reaction-fire-btn .reaction-icon {
            --sheet-x: 50%;
          }

          @keyframes reaction-icon {
            0% {
              background-position: var(--sheet-x) 0%;
            }
            100% {
              background-position: var(--sheet-x) 200%;
            }
          }
        </style>`
      );

      this.initIntersectionObserver();
    }

    initIntersectionObserver() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            this.start();
          }
        });
      });

      observer.observe(this);
    }

    start() {
      if (this.hasInit) return;
      this.hasInit = true;

      this.classList.remove("reactions-invisible");

      const loadedData = this.loadData();

      for (const type of reactionTypes) {
        const increment = async () => {
          if (!(await loadedData)) return;

          reactionState[type]++;
          window.sessionStorage.setItem(
            sessionCacheKey(type),
            reactionState[type]
          );
          window.goatcounter.count(eventVars(type));

          this.renderCount(type, reactionState[type]);
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

    async loadData() {
      try {
        if (window.location.pathname.startsWith("/notes/")) {
          const { loadNote } = await import("/notes/index-loader.js");
          const result = await loadNote(window.location.pathname);
          if (!result?.note?.stats) return false;
          for (const type of reactionTypes) {
            const count = result.note.stats[type] || 0;
            reactionState[type] = Math.max(reactionState[type], count);
            this.renderCount(type, reactionState[type] || "");
          }
        } else {
          await Promise.all(
            reactionTypes.map(async (type) => {
              const count = await fetchHits(
                eventName(window.location.pathname, type)
              );
              reactionState[type] = Math.max(reactionState[type], count);
              this.renderCount(type, reactionState[type] || "");
            })
          );
        }

        return true;
      } catch (error) {
        console.error(error);

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

async function fetchHits(pagePath) {
  try {
    const url = `https://kalabasa.goatcounter.com/counter/${pagePath}.json`;
    const res = await fetch(url, { encoding: "utf-8" });
    if (res.status === 404) return 0;
    const data = await res.json();
    const count = parseInt(data.count.replace(/\D/g, ""), 10) || 0;
    return count;
  } catch (error) {
    console.error("Fetching reactions failed!");
    console.error(error);
    throw error;
  }
}

// returns goatcounter vars object
function eventVars(reactionType) {
  return {
    path: (p) => eventName(p, reactionType),
    referrer: (p) => p,
    event: true,
  };
}

export function eventName(pagePath, reactionType) {
  const url = new URL(pagePath, "https://leanrada.com");
  const id = url.pathname;
  return `reaction-${reactionType}-${id}`;
}

function sessionCacheKey(reactionType) {
  const url = new URL(window.location.href);
  return "cached-" + eventName(url.pathname, reactionType);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
