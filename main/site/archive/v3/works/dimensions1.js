(function () {
  // import snippet to set up window.workPage.ready() callback queue
  window.workPage = window.workPage || {
    ready: function ready(callback) {
      window.workPage.readyCallbacks = window.workPage.readyCallbacks || [];
      window.workPage.readyCallbacks.push(callback);
    }
  };

  window.workPage.ready(function () {
    return setTimeout(addInstagramEmbedScript, 0);
  });

  function addInstagramEmbedScript() {
    var instagramEmbedScript = document.createElement('script');
    instagramEmbedScript.src = '//www.instagram.com/embed.js';
    instagramEmbedScript.async = true;
    var main = window.workPage.getCurrentMainElement();
    main.appendChild(instagramEmbedScript);
  }

}());
