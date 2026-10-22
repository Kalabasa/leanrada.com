import { html } from "../components/html.js";

export const colorStyles = [
  { name: "blackOnWhite", inkRgb: [0, 0, 0], paperRgb: [255, 255, 255] },
  { name: "orangeOnWhite", inkRgb: [251, 119, 86], paperRgb: [255, 255, 255] },
  { name: "whiteOnBlack", inkRgb: [255, 255, 255], paperRgb: [0, 0, 0] },
  { name: "greenOnBlack", inkRgb: [142, 249, 21], paperRgb: [0, 0, 0] },
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
  context.save();
  context.filter = formatColorStyleFilter(colorStyleName);
  context.drawImage(sourceCanvas, 0, 0);
  context.restore();
  return colorStyledCanvas;
}

function formatFilterId(colorStyleName) {
  return `colorStyle-${colorStyleName}`;
}

function formatTableValues(colorStyle, channelIndex) {
  const inkValue = colorStyle.inkRgb[channelIndex] / 255;
  const paperValue = colorStyle.paperRgb[channelIndex] / 255;
  return `${inkValue} ${paperValue}`;
}
