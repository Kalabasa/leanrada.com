import { html } from "../components/html.js";

export const colorStyles = [
  { name: "blackOnWhite", fg: [0, 0, 0], bg: [255, 255, 255] },
  { name: "orangeOnWhite", fg: [251, 119, 86], bg: [255, 255, 255] },
  { name: "whiteOnBlack", fg: [255, 255, 255], bg: [0, 0, 0] },
  { name: "greenOnBlack", fg: [142, 249, 21], bg: [0, 0, 0] },
];

export function ColorStyleFilters() {
  return html`
    <style id=${ColorStyleFilters.name}>
      .colorStyleFilters {
        position: absolute;
      }
    </style>
    <svg class="colorStyleFilters" width="0" height="0" aria-hidden="true">
      ${colorStyles.map(
        (colorStyle) => html`
          <filter
            id=${formatFilterId(colorStyle.name)}
            color-interpolation-filters="sRGB"
          >
            <feComponentTransfer>
              <feFuncR
                type="table"
                tableValues=${formatTableValues(colorStyle, 0)}
              />
              <feFuncG
                type="table"
                tableValues=${formatTableValues(colorStyle, 1)}
              />
              <feFuncB
                type="table"
                tableValues=${formatTableValues(colorStyle, 2)}
              />
            </feComponentTransfer>
          </filter>
        `,
      )}
    </svg>
  `;
}

export function formatColorStyleFilter(colorStyleName) {
  return `url(#${formatFilterId(colorStyleName)})`;
}

export function drawColorStyledCanvas(sourceCanvas, colorStyleName) {
  const colorStyledCanvas = document.createElement("canvas");
  colorStyledCanvas.width = sourceCanvas.width;
  colorStyledCanvas.height = sourceCanvas.height;
  const context = colorStyledCanvas.getContext("2d");
  context.drawImage(sourceCanvas, 0, 0);
  applyColorStyle(context, colorStyleName);
  return colorStyledCanvas;
}

export function applyColorStyle(context, colorStyleName) {
  const colorStyle = colorStyles.find(
    (style) => style.name === colorStyleName,
  );
  const { width, height } = context.canvas;
  context.save();
  if (colorStyle.bg.every((value) => value === 255)) {
    context.globalCompositeOperation = "screen";
    context.fillStyle = formatRgb(colorStyle.fg);
    context.fillRect(0, 0, width, height);
  } else if (colorStyle.bg.every((value) => value === 0)) {
    context.globalCompositeOperation = "difference";
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "multiply";
    context.fillStyle = formatRgb(colorStyle.fg);
    context.fillRect(0, 0, width, height);
  } else {
    throw new Error(`Unexpected bg color: ${colorStyle.bg}`);
  }
  context.restore();
}

function formatRgb(rgb) {
  return `rgb(${rgb.join(" ")})`;
}

function formatFilterId(colorStyleName) {
  return `colorStyle-${colorStyleName}`;
}

function formatTableValues(colorStyle, channelIndex) {
  const fgValue = colorStyle.fg[channelIndex] / 255;
  const bgValue = colorStyle.bg[channelIndex] / 255;
  return `${fgValue} ${bgValue}`;
}
