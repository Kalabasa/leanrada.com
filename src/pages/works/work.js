import page from '../../js/page.js';
import supportBlendMode from '../../js/supportBlendMode.js';

if (ENV_DEBUG) console.log('work.js execute');

function isExternal(url) {
    const domain = url => url.replace('http://','').replace('https://','').split('/')[0];
    return domain(window.location.href) !== domain(url);
}

page.ready(() => {
	if (ENV_DEBUG) console.log('work.js ready');
	
	supportBlendMode();

	for (let a of document.querySelectorAll('.prose a')) {
		if (isExternal(a.href)) a.target = '_blank';
	}
});
