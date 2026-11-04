(function () {
  if (document.currentScript && document.currentScript.dataset.prefix) {
    const prefix = document.currentScript.dataset.prefix;
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.path = function (p) { return prefix + p; };
  }
  var script = document.createElement('script');
  script.dataset.goatcounter = 'https://kalabasa.goatcounter.com/count';
  script.async = true;
  script.setAttribute('src', '//gc.zgo.at/count.js');
  document.head.appendChild(script);

  window.addEventListener('error', (event) => {
    window.goatcounter?.count?.({
      path: `error-${event.filename}:${event.lineno}-${event.message}`,
      title: event.message,
      referrer: location.href,
      event: true,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!(event.reason instanceof Error)) return;
    var match = event.reason.stack.match(/((?:blob:)?(?:https?|file):\/\/[^\s()]+):(\d+):\d+/);
    var file = match?.[1] ?? "unknown";
    var line = match?.[2] ?? 0;
    window.goatcounter?.count?.({
      path: `error-${file}:${line}-${event.reason.message}`,
      title: event.reason.message,
      referrer: location.href,
      event: true,
    });
  });
})();
