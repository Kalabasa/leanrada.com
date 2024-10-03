import { useEffect, useState } from "../lib/htm-preact.js";
import { autorun } from "../lib/mobx.js";

export function observer(render) {
  return () => {
    const [node, setNode] = useState(null);
    useEffect(
      () =>
        autorun(() => {
          setNode(render());
        }),
      []
    );
    return node;
  };
}
