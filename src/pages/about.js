import { page } from '../js/common.js';

if (ENV_DEBUG) console.log('about.js execute');

page.ready(() => {
	if (ENV_DEBUG) console.log('about.js ready');
});
