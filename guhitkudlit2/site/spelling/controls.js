import { html } from "../components/html.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { LabelText } from "../typography/text.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { hasVirama } from "../transliteration/syllabicate.js";
import { classes } from "../util/classes.js";

export function createSpellingControls() {
  const viramaStyle = observable.box("pamudpod");
  const separateRa = observable.box(false);
  const precolonial = observable.box(false);

  const SpellingControls = observer(
    ({ inputText, baybayinUnits }) => html`
      <style id=${SpellingControls.name}>
        .spellingControls {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          height: 100%;
        }
        .spellingControl {
          anchor-scope: --spellingOptionActive;
          transition: opacity 0.6s ease-out;
        }
        .spellingControlDimmed {
          opacity: var(--opacity-tertiary);
        }
        .spellingOptions {
          display: flex;
          position: relative;
          &::before {
            content: "";
            background: #f0f0f0;
            position: absolute;
            inset: 0;
            border-radius: var(--size-xs);
            z-index: -2;
          }
          &::after {
            content: "";
            background: #fff;
            border: solid 2px var(--color-orange-darker);
            border-radius: var(--size-xs);
            position: absolute;
            inset: anchor(--spellingOptionActive top)
              anchor(--spellingOptionActive right)
              anchor(--spellingOptionActive bottom)
              anchor(--spellingOptionActive left);
            transition: inset 0.15s;
            z-index: -1;
          }
        }
        .spellingOption {
          flex: 1 1 1%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--size-xs);
          cursor: pointer;
          font-size: var(--font-size-s);
          font-weight: bold;
          border-radius: var(--size-xs);
          &:has(input:checked) {
            anchor-name: --spellingOptionActive;
          }
          &:not(:has(input:checked)) {
            &:hover {
              background: #0001;
            }
            &:active {
              background: #0002;
            }
          }
          input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
          }
        }
      </style>
      <div class="spellingControls">
        <div class="spellingControl">
          <${LabelText}>Syllabication<//>
          <div class="spellingOptions">
            <label class="spellingOption">
              <input
                type="radio"
                name="precolonial"
                value="colonial"
                checked=${!precolonial.get()}
                onChange=${() => precolonial.set(false)}
              />
              <${SpellingPreview}
                baybayinUnits=${["ba", "y", "ba", "yi", "n"]}
                viramaStyle="krus"
              />
              colonial
            </label>
            <label class="spellingOption">
              <input
                type="radio"
                name="precolonial"
                value="precolonial"
                checked=${precolonial.get()}
                onChange=${() => precolonial.set(true)}
              />
              <${SpellingPreview}
                baybayinUnits=${["ba", "ba", "yi"]}
                viramaStyle="krus"
              />
              precolonial
            </label>
          </div>
        </div>
        <div
          class=${classes(
            "spellingControl",
            (!hasVirama(baybayinUnits.get()) || precolonial.get()) &&
              "spellingControlDimmed",
          )}
        >
          <${LabelText}>Virama<//>
          <div class="spellingOptions">
            <label class="spellingOption">
              <input
                type="radio"
                name="viramaStyle"
                value="pamudpod"
                checked=${viramaStyle.get() === "pamudpod"}
                onChange=${() => viramaStyle.set("pamudpod")}
              />
              <${SpellingPreview}
                baybayinUnits=${["k"]}
                viramaStyle="pamudpod"
              />
              pamudpod
            </label>
            <label class="spellingOption">
              <input
                type="radio"
                name="viramaStyle"
                value="krus"
                checked=${viramaStyle.get() === "krus"}
                onChange=${() => viramaStyle.set("krus")}
              />
              <${SpellingPreview} baybayinUnits=${["k"]} viramaStyle="krus" />
              krus
            </label>
          </div>
        </div>
        <div
          class=${classes(
            "spellingControl",
            !inputText.get().includes("r") && "spellingControlDimmed",
          )}
        >
          <${LabelText}>R distinction<//>
          <div class="spellingOptions">
            <label class="spellingOption">
              <input
                type="radio"
                name="separateRa"
                value="da"
                checked=${!separateRa.get()}
                onChange=${() => separateRa.set(false)}
              />
              <${SpellingPreview} baybayinUnits=${["da"]} viramaStyle="krus" />
              traditional
            </label>
            <label class="spellingOption">
              <input
                type="radio"
                name="separateRa"
                value="ra"
                checked=${separateRa.get()}
                onChange=${() => separateRa.set(true)}
              />
              <${SpellingPreview} baybayinUnits=${["ra"]} viramaStyle="krus" />
              modern
            </label>
          </div>
        </div>
      </div>
    `,
  );

  return { SpellingControls, viramaStyle, separateRa, precolonial };
}

function SpellingPreview({ baybayinUnits, viramaStyle }) {
  const canvasRef = useRef();
  useEffect(() => {
    const abortController = new AbortController();
    drawSpellingPreview(
      canvasRef.current,
      baybayinUnits,
      viramaStyle,
      abortController.signal,
    );
    return () => abortController.abort();
  }, []);
  return html`<canvas
    ref=${canvasRef}
    width=${baybayinUnits.length * 30}
    height="30"
  />`;
}

async function drawSpellingPreview(
  canvas,
  baybayinUnits,
  viramaStyle,
  abortSignal,
) {
  const [{ layoutCalligraphy }, { BasePainter }] = await Promise.all([
    import("../calligraphy/calligraphy.js"),
    import("../calligraphy/painter.js"),
  ]);
  const { path, cellSize } = await layoutCalligraphy(baybayinUnits, canvas, {
    viramaStyle,
    maxComposeSteps: 5,
  });
  if (abortSignal.aborted) return;
  for (const _ of new BasePainter().drawPaths(
    path,
    cellSize,
    canvas.getContext("2d"),
  ));
}
