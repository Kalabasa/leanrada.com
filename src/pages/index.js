import { page } from '../js/common.js';

if (ENV_DEBUG) console.log('index.js execute');

page.ready(() => {
	if (ENV_DEBUG) console.log('index.js ready');

	const introSection = [...document.querySelectorAll('.intro')].pop();
	introSection.addEventListener('click', (event) => {
		console.log(event.target);
		if (
			event.target instanceof HTMLAnchorElement &&
			event.target.classList.contains('intro-anchor-link') &&
			event.target.hash
		) {
			const target = document.querySelector(event.target.hash);
			if (!target) return;

			target.scrollIntoView({
				behavior: 'smooth',
			});
			event.preventDefault();
			console.log('auy');
		}
	});
});
