(() => {
  const scripts = document.querySelectorAll("script[data-src]");
  const batches = [...scripts].reduce((acc, script) => {
    const order = parseInt(script.dataset.order);
    acc[order] = acc[order] || [];
    acc[order].push(script);
    return acc;
  }, []);

  loadNext(0);

  function loadNext(order) {
    if (batches[order]) {
      loadBatch(batches[order], () => loadNext(order + 1));
    }
  }

  function loadBatch(scripts, callback) {
    let count = scripts.length;
    for (const script of scripts) {
      const copy = document.createElement("script");
      copy.src = script.dataset.src;
      copy.onload = () => --count === 0 && callback();
      document.head.appendChild(copy);
      script.remove();
    }
  }
})();
