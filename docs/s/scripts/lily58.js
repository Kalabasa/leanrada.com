
  (() => {
    const lilies = document.querySelectorAll(".lily58");
    for (const lily of lilies) {
      const layerButtons = lily.querySelectorAll(".lily58-layer-button");

      if (!layerButtons.length) {
        lily.classList.add("lily58-no-layers");
        continue;
      }

      let currentLayer = 0;
      lily.classList.add("lily58-on-layer" + currentLayer);
      const toggleLayer = () => {
        lily.classList.remove("lily58-on-layer" + currentLayer);
        currentLayer = 1 - currentLayer;
        lily.classList.add("lily58-on-layer" + currentLayer);
      };

      for (const layerButton of layerButtons) {
        layerButton.addEventListener("click", toggleLayer);
      }
    }
  })();
