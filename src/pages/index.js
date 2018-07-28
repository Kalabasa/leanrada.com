import { page } from '../js/common.js';
import supportBlendMode from '../js/supportBlendMode.js';

if (ENV_DEBUG) console.log('index.js execute');

page.ready(() => {
	if (ENV_DEBUG) console.log('index.js ready');

	supportBlendMode();
});
