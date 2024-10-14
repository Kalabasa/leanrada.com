import { useLayoutEffect, useState } from "../lib/htm-preact.js";
import { autorun } from "../lib/mobx.js";

export function observer(render) {
  return (props) => {
    const [node, setNode] = useState(null);
    useLayoutEffect(
      () =>
        autorun(() => {
          setNode(render(props));
        }),
      Object.values(props)
    );
    return node;
  };
}
