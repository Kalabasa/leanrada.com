import { useEffect, useState } from "../lib/htm-preact.js";
import { delay } from "../util/delay.js";
import { html } from "./html.js";

export function Loader({ promise, render }) {
  const [state, setState] = useState({
    status: "loading",
    component: null,
  });

  // avoid setState on the same tick as render
  useEffect(() => {
    delay(1)
      .then(() => promise)
      .then((value) => {
        setState({
          status: "loaded",
          component: () => render(value),
        });
      })
      .catch((error) => {
        setState({
          status: "error",
          error,
        });
      });
  }, []);

  switch (state.status) {
    case "loading":
      return html`<h1>Loading...</h1>`;
    default:
    case "error":
      return html`<h1>Error loading content :(</h1>`;
    case "loaded":
      return html`<${state.component} />`;
  }
}
