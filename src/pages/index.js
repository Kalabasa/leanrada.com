import { page } from '../js/common.js';

if (ENV_DEBUG) console.log('index.js execute');

page.ready(() => {
	if (ENV_DEBUG) console.log('index.js ready');
});
