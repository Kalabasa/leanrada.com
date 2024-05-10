(function () {
  // import snippet to set up window.workPage.ready() callback queue
  window.workPage = window.workPage || {
    ready: function ready(callback) {
      window.workPage.readyCallbacks = window.workPage.readyCallbacks || [];
      window.workPage.readyCallbacks.push(callback);
    }
  };

  window.workPage.ready(function () {
    return setTimeout(addFacebookEmbedScript, 0);
  });

  function addFacebookEmbedScript() {
    var facebookEmbedScript = document.createElement('script');
    facebookEmbedScript.src = '//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v5.0';
    facebookEmbedScript.defer = true;
    facebookEmbedScript.async = true;
    facebookEmbedScript.crossOrigin = "anonymous";
    var main = window.workPage.getCurrentMainElement();
    main.appendChild(facebookEmbedScript);
  }

}());
