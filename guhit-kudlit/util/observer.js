import { useEffect, useState } from "../lib/htm-preact.js";
import { autorun } from "../lib/mobx.js";

const pendingRuns = new Set();

export function flushObservers() {
  const runs = [...pendingRuns];
  pendingRuns.clear();
  for (const run of runs) run();
}

export function observer(render) {
  const scheduler = (run) => {
    pendingRuns.add(run);
    requestAnimationFrame(flushObservers);
  };
  return (props) => {
    const [node, setNode] = useState(null);
    useEffect(
      () =>
        autorun(
          () => {
            setNode(render(props));
          },
          { scheduler }
        ),
      Object.values(props)
    );
    return node;
  };
}
