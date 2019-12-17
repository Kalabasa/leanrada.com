import './snippet';

window.workPage.ready(() => setTimeout(addFacebookEmbedScript, 0));

function addFacebookEmbedScript() {
  const facebookEmbedScript = document.createElement('script');
  facebookEmbedScript.src = '//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v5.0';
  facebookEmbedScript.defer = true;
  facebookEmbedScript.async = true;
  facebookEmbedScript.crossOrigin = "anonymous";
  const main = window.workPage.getCurrentMainElement();
  main.appendChild(facebookEmbedScript);
}
