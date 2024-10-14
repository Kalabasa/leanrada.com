import { action, makeAutoObservable } from "../lib/mobx.js";

export function createActions({ appState, createGlyph }) {
  const addGlyph = action(() => {
    appState.glyphs.push(createGlyph());
  });

  const selectGlyph = action((name) => {
    appState.selectedGlyph = appState.glyphs.find(
      (glyph) => glyph.name === name
    );
  });

  const addNode = action(() => {
    if (!appState.selectedGlyph) return;
    const { nodes } = appState.selectedGlyph;

    let x = 100;
    let y = 100;
    while (nodes.some((node) => node.x === x && node.y === y)) {
      x += 25;
      y += 25;
    }

    let id = 0;
    while (nodes.some((node) => node.id === id)) {
      id++;
    }

    nodes.push(
      makeAutoObservable({
        id,
        x,
        y,
        controlX: x + 50,
        controlY: y,
        width: 100,
        selected: false,
      })
    );
  });

  const connectNodes = action(() => {
    if (!appState.selectedGlyph) return;
    const { nodes, edges } = appState.selectedGlyph;

    const selectedIDs = nodes
      .filter((node) => node.selected)
      .map((node) => node.id);

    if (selectedIDs.length !== 2) {
      alert("Select exactly 2 nodes to connect!");
      return;
    }

    if (
      edges.some(
        (edge) =>
          (edge.nodes[0] == selectedIDs[0] &&
            edge.nodes[1] == selectedIDs[1]) ||
          (edge.nodes[0] == selectedIDs[1] && edge.nodes[1] == selectedIDs[0])
      )
    ) {
      alert("Already connected!");
      return;
    }

    let id = 0;
    while (edges.some((edge) => edge.id === id)) {
      id++;
    }

    edges.push(
      makeAutoObservable({
        id,
        nodes: selectedIDs,
        selected: false,
      })
    );
  });

  const deleteSelected = action(() => {
    if (!appState.selectedGlyph) return;
    const { nodes, edges } = appState.selectedGlyph;
    nodes.replace(nodes.filter((node) => !node.selected));
    edges.replace(edges.filter((edge) => !edge.selected));
  });

  const selectItems = action((ids, inCollection, additive) => {
    if (!appState.selectedGlyph) return;
    const { nodes, edges } = appState.selectedGlyph;

    if (!additive) {
      edges.forEach((edge) => (edge.selected = false));
      nodes.forEach((node) => (node.selected = false));
    }
    inCollection.forEach((item) => {
      const selected = ids.includes(item.id);
      if (additive) {
        item.selected = item.selected !== selected;
      } else if (item.selected !== selected) {
        item.selected = selected;
      }
    });
  });

  const deselectAll = action(() => {
    if (!appState.selectedGlyph) return;
    const { nodes, edges } = appState.selectedGlyph;
    nodes.forEach((node) => (node.selected = false));
    edges.forEach((edge) => (edge.selected = false));
  });

  return {
    addGlyph,
    selectGlyph,
    addNode,
    connectNodes,
    deleteSelected,
    selectItems,
    deselectAll,
  };
}
