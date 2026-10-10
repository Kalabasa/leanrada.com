import { Button, Input } from "../components/form.js";
import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { delay } from "../util/delay.js";

const exampleConfigs = [
  {
    text: "masigla",
    viramaStyle: "krus",
    separateRa: false,
    precolonial: false,
    formation: "diamond",
  },
  {
    text: "iiyak",
    viramaStyle: "pamudpod",
    separateRa: false,
    precolonial: true,
    formation: "grid",
  },
  {
    text: "tatawa",
    viramaStyle: "pamudpod",
    separateRa: false,
    precolonial: false,
    formation: "grid",
  },
  {
    text: "kuting",
    viramaStyle: "krus",
    separateRa: false,
    precolonial: false,
    formation: "normal",
  },
  {
    text: "basag-ulo",
    viramaStyle: "krus",
    separateRa: false,
    precolonial: false,
    formation: "diamond",
  },
];
const backgroundWords = [
  "bay bayin",
  "guhi kuli",
  "mahal bigas",
  "salamin salamin",
  "manila",
  "haha hahaha haha",
  "bababa ba bababa",
  "oo sige na",
  "kala basa",
  "sagi sag",
];
const backgroundPauseMs = 3000;

export function IntroCanvas({ canvasWidth, canvasHeight, onConfig }) {
  const backgroundCanvasRef = useRef();

  useEffect(() => {
    const abortController = new AbortController();
    drawBackgroundWords(backgroundCanvasRef.current, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, []);

  const configure = (config, sourceElement) => {
    sourceElement.style.viewTransitionName = "introConfig";
    requestAnimationFrame(() => {
      onConfig({ ...config, sourceElement });
    });
  };

  const onSubmitTextForm = (event) => {
    event.preventDefault();
    const text = event.currentTarget.elements.text.value;
    if (text === "") return;
    configure({ text }, event.currentTarget);
  };

  return html`
    <style id=${IntroCanvas.name}>
      .introCanvas {
        grid-area: 1 / 1 / -1 / -1;
        position: relative;
        background: #fff;
        box-shadow: var(--shadow-m);
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        gap: var(--size-l);
        overflow: hidden;
      }
      .introBackground {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0.04;
      }
      .introHeader {
        padding: 2vh;
        position: relative;
        text-align: center;
      }
      .introHeading {
        font-size: 4vh;
        letter-spacing: -0.44vh;
      }
      .introSubheading {
        margin-top: 0.5vh;
        font-size: 1.5vh;
        text-transform: uppercase;
        color: var(--color-fg-secondary);
      }
      .introStarter {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--size-s);
        padding: var(--size-l);
        box-shadow: var(--shadow-m);
        background: #fff6;
        border-radius: var(--size-s);
      }
      .introText {
        font-size: var(--font-size-m);
      }
      .introInput {
        font-size: var(--font-size-xl);
        text-align: center;
        border-color: transparent;
        background:
          linear-gradient(var(--color-bg), var(--color-bg)) padding-box,
          linear-gradient(
              to right,
              var(--color-green-darker),
              var(--color-fg),
              var(--color-orange-darker)
            )
            border-box;
      }
      .introExamples {
        display: flex;
        gap: var(--size-s);
      }
    </style>
    <div class="introCanvas">
      <canvas
        class="introBackground"
        width=${canvasWidth}
        height=${canvasHeight}
        ref=${backgroundCanvasRef}
      ></canvas>
      <div class="introHeader">
        <h1 class="introHeading">Maligayang padating sa Guhit Kudlit</h1>
        <h2 class="introSubheading">
          Baybayin translator (transliterator) & calligraphy generator
        </h2>
      </div>
      <div class="introStarter">
        <p class="introText">Enter word to generate</p>
        <form onSubmit=${onSubmitTextForm}>
          <${Input}
            autofocus
            class="introInput"
            type="text"
            name="text"
            maxlength="30"
            autocomplete="off"
            intro="kumusta"
          />
        </form>
        <p class="introText">or start with an example</p>
        <div class="introExamples">
          ${exampleConfigs.map(
            (exampleConfig) => html`
              <${Button}
                type="button"
                onClick=${(event) =>
                  configure(exampleConfig, event.currentTarget)}
              >
                ${exampleConfig.text}
              <//>
            `,
          )}
        </div>
      </div>
    </div>
  `;
}

async function drawBackgroundWords(backgroundCanvas, abortSignal) {
  const [{ syllabicate }, { render }] = await Promise.all([
    import("../transliteration/syllabicate.js"),
    import("./render.js"),
  ]);
  const shuffledWords = shuffle(backgroundWords);
  for (let i = 0; !abortSignal.aborted; i = (i + 1) % shuffledWords.length) {
    const { baybayinUnits } = syllabicate(shuffledWords[i]);
    await render({
      baybayinUnits,
      viramaStyle: Math.random() < 0.5 ? "pamudpod" : "krus",
      canvas: backgroundCanvas,
      abortSignal,
      drawInterval: 1,
      composeSteps: Math.round(10 + Math.random() * 40),
      scale: 1.2 + Math.random() * 0.4,
    });
    await delay(backgroundPauseMs);
  }
}

function shuffle(items) {
  const shuffledItems = [...items];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swappedItem = shuffledItems[i];
    shuffledItems[i] = shuffledItems[j];
    shuffledItems[j] = swappedItem;
  }
  return shuffledItems;
}
