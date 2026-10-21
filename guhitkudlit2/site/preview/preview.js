import { PARAMS } from "../app/flags.js";
import { render } from "../canvas/render.js";
import { syllabicate } from "../transliteration/syllabicate.js";

if (window.innerWidth !== 1260 || window.innerHeight !== 630) {
  alert(
    `Viewport is ${window.innerWidth}×${window.innerHeight}, expected 1260×630`,
  );
}

const word = PARAMS.get("word") ?? "";
const { baybayinUnits } = syllabicate(word);

const aspectRatio = Math.min(1.5, 2 * (window.innerWidth / window.innerHeight));
const canvasWidth =
  Math.min(window.innerWidth, window.innerHeight * aspectRatio) * 0.9;

const canvas = document.querySelector(".previewCanvas canvas");
canvas.width = canvasWidth;
canvas.height = canvasWidth / aspectRatio;
canvas.style.setProperty("--aspect-ratio", aspectRatio);

document.querySelector(".previewInput").textContent = word;

render({
  baybayinUnits,
  viramaStyle: "pamudpod",
  arrangement: "normal",
  density: 0.5,
  canvas,
  speed: 20,
  painterName: "brush",
});
