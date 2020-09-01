import { page } from '../../js/common.js';
import supportBlendMode from '../../js/supportBlendMode.js';

if (ENV_DEBUG) console.log('work.js execute');

function isExternal(hrefString) {
  return /^[a-z0-9+\-.]+:\/\//i.test(hrefString);
}

const readyCallbacks = window.workPage && window.workPage.readyCallbacks || [];

window.workPage = page;

page.ready(() => {
	if (ENV_DEBUG) console.log('work.js ready');

	for (const c of readyCallbacks) {
		c();
	}
	
	supportBlendMode();

	for (let a of document.querySelectorAll('.prose a')) {
		if (isExternal(a.getAttribute("href"))) {
			a.target = '_blank';
			a.classList.add('no-barba');
		}
	}
});
