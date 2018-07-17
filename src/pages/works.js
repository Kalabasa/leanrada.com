import page from '../js/page.js';

page.ready(() => {
	const section = document.querySelector('section.works');
	const items = [...document.querySelectorAll('.projects-item')];
	section.addEventListener('click', (event) => {
		const item = items.find(it => it.contains(event.target));
		if (item) item.classList.add('item-selected');
	});
});
