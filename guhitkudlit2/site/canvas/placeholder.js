import { Button } from "../components/form.js";
import { html } from "../components/html.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { delay } from "../util/delay.js";

const exampleWords = ["kumusta", "mabuhay", "kalayaan"];
const backgroundWords = [
  "pili pinas",
  "bay bayin",
  "baybayin",
  "guhi kuli",
  "guhit kudlit",
  "sago gulaman",
  "tinolang manok",
  "manila",
  "teka lang",
  "bayang magiliw",
  "malayong lupain",
  "hahahaha hahahaha",
  "bababa ba bababa",
  "astig yon",
  "basta",
  "oo sige go",
];
const backgroundPauseMs = 3000;

export function CanvasPlaceholder({
  canvasWidth,
  canvasHeight,
  onClickExample,
}) {
  const backgroundCanvasRef = useRef();

  useEffect(() => {
    const abortController = new AbortController();
    drawBackgroundWords(backgroundCanvasRef.current, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, []);

  return html`
    <style id=${CanvasPlaceholder.name}>
      .canvasPlaceholder {
        grid-area: 1 / 1 / -1 / -1;
        position: relative;
        background: #fff;
        box-shadow: var(--shadow-m);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: var(--size-l);
        overflow: hidden;
      }
      .canvasBackground {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0.08;
      }
      .canvasHeader {
        position: relative;
        padding: 3vh;
        text-align: center;
      }
      .canvasHeading {
        font-size: 4vh;
        letter-spacing: -0.44vh;
      }
      .canvasSubheading {
        font-size: 1.5vh;
        text-transform: uppercase;
        color: var(--color-fg-secondary);
      }
      .canvasExamples {
        position: relative;
        display: flex;
        gap: var(--size-s);
      }
    </style>
    <div class="canvasPlaceholder">
      <canvas
        class="canvasBackground"
        width=${canvasWidth}
        height=${canvasHeight}
        ref=${backgroundCanvasRef}
      ></canvas>
      <div class="canvasHeader">
        <h1 class="canvasHeading">Maligayang padating sa Guhit Kudlit</h1>
        <h2 class="canvasSubheading">
          Baybayin translator (transliterator) & calligraphy generator
        </h2>
      </div>
      <div class="canvasExamples">
        ${exampleWords.map(
          (exampleWord) => html`
            <${Button}
              type="button"
              onClick=${() => onClickExample(exampleWord)}
            >
              ${exampleWord}
            <//>
          `,
        )}
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
      composeSteps: Math.round(15 + Math.random() * 60),
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
