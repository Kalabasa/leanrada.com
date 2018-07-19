import page from '../js/page.js';
import supportBlendMode from '../js/supportBlendMode.js';

if (ENV_DEBUG) console.log('works.js execute');

page.ready(() => {
	if (ENV_DEBUG) console.log('works.js ready');

	supportBlendMode();

	const section = document.querySelector('section.works');
	const items = [...document.querySelectorAll('.projects-item')];
	section.addEventListener('click', (event) => {
		const item = items.find(it => it.contains(event.target));
		if (item) item.classList.add('item-selected');
	});
});
