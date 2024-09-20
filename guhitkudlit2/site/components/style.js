import { render, useLayoutEffect, useState } from "../lib/htm-preact.js";

export function Style({ children }) {
  const id = useId();

  useLayoutEffect(() => {
    {
      const existingStyle = document.getElementById(id);
      if (existingStyle) {
        const count = existingStyle.dataset.styleCount;
        existingStyle.dataset.styleCount = Number.parseInt(count) + 1;
      } else {
        const style = document.createElement("style");
        style.id = id;
        style.dataset.styleCount = "1";
        document.head.appendChild(style);
        render(children, style);
      }
    }
    return () => {
      const existingStyle = document.getElementById(id);
      if (existingStyle) {
        const count = existingStyle.dataset.styleCount;
        if (count === "1") {
          existingStyle.remove();
        } else {
          existingStyle.dataset.styleCount = Number.parseInt(count) - 1;
        }
      }
    };
  }, [children]);

  return null;
}

let nextId = 1;

function useId() {
  const [id] = useState(`__style_${nextId++}`);
  return id;
}
