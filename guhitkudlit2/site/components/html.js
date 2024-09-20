import { html as htm } from "../lib/htm-preact.js";
import { Style } from "./style.js";

export function html(...args) {
  const node = htm(...args);
  if (typeof node !== "string") {
    if (Array.isArray(node)) {
      node.forEach(swapStyle);
    } else if (node) {
      swapStyle(node);
    }
  }
  return node;
}

function swapStyle(node) {
  if (node.type === "style") {
    node.type = Style;
  }
}
