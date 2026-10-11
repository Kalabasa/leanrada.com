import { html } from "../components/html.js";
import { OptionGroup, OptionGroupOption } from "../components/option-group.js";
import { observable } from "../lib/mobx.js";
import { observer } from "../util/observer.js";
import { LabelText } from "../typography/text.js";
import { useEffect, useRef } from "../lib/htm-preact.js";
import { classes } from "../util/classes.js";

const viramaStyles = ["pamudpod", "krus", "precolonial"];

export function createSpellingControls() {
  const initialViramaStyle = new URLSearchParams(location.search).get(
    "viramaStyle",
  );
  const viramaStyle = observable.box(
    viramaStyles.includes(initialViramaStyle) ? initialViramaStyle : "pamudpod",
  );
  const separateRa = observable.box(false);

  if (initialViramaStyle) {
    const url = new URL(location.href);
    url.searchParams.delete("viramaStyle");
    history.replaceState(history.state, "", url);
  }

  const SpellingControls = observer(
    ({ inputText, baybayinUnits }) => html`
      <style id=${SpellingControls.name}>
        .spellingControls {
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          height: 100%;
        }
        .spellingControl {
          transition: opacity 0.6s ease-out;
        }
        .spellingControlDimmed {
          opacity: var(--opacity-tertiary);
        }
      </style>
      <div class="spellingControls">
        <div
          class=${classes(
            "spellingControl",
            !baybayinUnits.get().length && "spellingControlDimmed",
          )}
        >
          <${LabelText}>Virama<//>
          <${OptionGroup}
            name="viramaStyle"
            value=${viramaStyle.get()}
            onChange=${(value) => viramaStyle.set(value)}
          >
            <${OptionGroupOption} value="pamudpod">
              <${SpellingPreview}
                baybayinUnits=${["ba", "y", "ba", "yi", "n"]}
                viramaStyle="pamudpod"
              />
              pamudpod
            <//>
            <${OptionGroupOption} value="krus">
              <${SpellingPreview}
                baybayinUnits=${["ba", "y", "ba", "yi", "n"]}
                viramaStyle="krus"
              />
              krus
            <//>
            <${OptionGroupOption} value="precolonial">
              <${SpellingPreview}
                baybayinUnits=${["ba", "ba", "yi"]}
                viramaStyle="precolonial"
              />
              none (precolonial)
            <//>
          <//>
        </div>
        <div
          class=${classes(
            "spellingControl",
            (!baybayinUnits.get().length || !inputText.get().includes("r")) &&
              "spellingControlDimmed",
          )}
        >
          <${LabelText}>R distinction<//>
          <${OptionGroup}
            name="separateRa"
            value=${separateRa.get() ? "ra" : "da"}
            onChange=${(value) => separateRa.set(value === "ra")}
          >
            <${OptionGroupOption} value="da">
              <${SpellingPreview} baybayinUnits=${["da"]} viramaStyle="krus" />
              traditional D/R
            <//>
            <${OptionGroupOption} value="ra">
              <${SpellingPreview} baybayinUnits=${["ra"]} viramaStyle="krus" />
              modern R
            <//>
          <//>
        </div>
      </div>
    `,
  );

  return { SpellingControls, viramaStyle, separateRa };
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
    width=${baybayinUnits.length * 25}
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
