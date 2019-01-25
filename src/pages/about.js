import { page } from '../js/common.js';
import supportBlendMode from '../js/supportBlendMode.js';

if (ENV_DEBUG) console.log('about.js execute');

page.ready(() => {
	if (ENV_DEBUG) console.log('about.js ready');

	supportBlendMode();
});
