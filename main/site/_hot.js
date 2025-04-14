// prefixed with underscore so it doesnt get deployed
(() => {
  let watching = new Set();

  watch(location.href);

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      watch(entry.name);
    }
  });
  observer.observe({ type: "resource", buffered: true });

  function watch(urlString) {
    if (!urlString) return;
    const url = new URL(urlString);
    if (url.origin !== location.origin) return;
    if (watching.has(url.pathname)) return;
    watching.add(url.pathname);

    console.log("watching", url.pathname);

    let lastModified, etag;

    async function check() {
      const res = await fetch(url, { method: "head" });
      const newLastModified = res.headers.get("Last-Modified");
      const newEtag = res.headers.get("ETag");

      if (
        lastModified !== undefined &&
        etag !== undefined &&
        (lastModified !== newLastModified || etag !== newEtag)
      ) {
        // TODO: add @view-transition
        location.reload();
      }

      lastModified = newLastModified;
      etag = newEtag;
    }

    setInterval(check, 1000);
  }
})();
