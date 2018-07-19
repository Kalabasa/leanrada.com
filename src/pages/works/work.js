import page from '../../js/page.js';
import supportBlendMode from '../../js/supportBlendMode.js';

if (ENV_DEBUG) console.log('work.js execute');

page.ready(() => {
	if (ENV_DEBUG) console.log('work.js ready');
	
	supportBlendMode();
});
