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
})();
