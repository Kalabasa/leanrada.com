import { Button, Input } from "../components/form.js";
import { html } from "../components/html.js";
import { useEffect, useRef, useState } from "../lib/htm-preact.js";
import { delay } from "../util/delay.js";

const now = new Date();
const exampleConfigs = [
  now.getMonth() === /*May*/ 4 && {
    text: "pamana",
    arrangement: "grid",
    density: 1,
  },
  now.getMonth() === /*Jun*/ 5 && {
    text: "malaya",
    viramaStyle: "pamudpod",
    arrangement: "normal",
    density: 1,
  },
  now.getMonth() === /*Aug*/ 7 && {
    text: "wika",
    arrangement: "grid",
  },
  now.getMonth() === /*Dec*/ 11 && {
    text: "pasko",
    viramaStyle: "krus",
    arrangement: "grid",
    painterName: "flat",
    colorStyle: "greenOnBlack",
    density: 1,
  },
  {
    text: "masigla",
    viramaStyle: "krus",
    arrangement: "diamond",
  },
  {
    text: "basag-ulo",
    viramaStyle: "krus",
    arrangement: "diamond",
    density: 1,
  },
  {
    text: "kuting",
    viramaStyle: "krus",
    arrangement: "normal",
    colorStyle: "orangeOnWhite",
  },
  {
    text: "tatawa",
    viramaStyle: "pamudpod",
    arrangement: "grid",
  },
  {
    text: "iiyak",
    viramaStyle: "precolonial",
    arrangement: "grid",
    colorStyle: "blackOnWhite",
  },
]
  .filter(Boolean)
  .slice(0, 5);

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
  "sagisag",
];

export function IntroCanvas({ canvasWidth, canvasHeight, onConfig }) {
  const backgroundCanvasRef = useRef();
  const [tlLogo, setTlLogo] = useState(false);

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
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        gap: var(--size-l);
        overflow: hidden;
        contain: inline-size;
        view-transition-name: intro;
        @media (max-width: 750px) {
          gap: 0;
        }
      }
      .introBackground {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0.1;
      }
      .introHeader {
        padding: 2vh;
        position: relative;
        text-align: center;
      }
      .introSubheading {
        margin-top: 0.5vh;
        font-size: 1.5vh;
        text-transform: uppercase;
        font-weight: bold;
        color: var(--color-fg-secondary);
      }
      .introStarter {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--size-s);
        padding: var(--size-l);
        background: #fff6;
        box-shadow: 0 0 30px 30px #fff6;
        max-width: 100%;
        box-sizing: border-box;
        @media (max-width: 750px) {
          padding: var(--size-s);
        }
      }
      .introText {
        font-size: var(--font-size-m);
      }
      .introInput {
        width: 100%;
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
        &:focus-visible {
          outline: solid 4px var(--color-bg-darker);
          outline-offset: 1px;
        }
      }
      .introExamples {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
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
        <img
          src=${tlLogo ? "app/logo-tl.svg" : "app/logo.svg"}
          alt="GuhitKudlit"
          style=${{ height: "14vh" }}
          onClick=${() => setTlLogo(!tlLogo)}
        />
        <h2 class="introSubheading">
          Baybayin translator (transliterator)<br />& calligraphy maker
        </h2>
      </div>
      <div class="introStarter">
        <p class="introText">Write a word</p>
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
      density: Math.random() * 4 - 2,
      canvas: backgroundCanvas,
      abortSignal,
      speed: 1,
      composeSteps: Math.round(10 + Math.random() * 40),
      scale: 1.2 + Math.random() * 0.4,
    });
    await delay(2000);
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
