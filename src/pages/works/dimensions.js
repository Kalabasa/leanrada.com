import './snippet';

window.workPage.ready(() => setTimeout(addInstagramEmbedScript, 0));

function addInstagramEmbedScript() {
  const instagramEmbedScript = document.createElement('script');
  instagramEmbedScript.src = '//www.instagram.com/embed.js';
  instagramEmbedScript.async = true;
  const main = window.workPage.getCurrentMainElement();
  main.appendChild(instagramEmbedScript);
}
