import { page } from '../js/common.js';
import supportBlendMode from '../js/supportBlendMode.js';

if (ENV_DEBUG) console.log('works.js execute');

/** @typedef ProjectType {'web' | 'game' | 'music' | 'art'} */
/** @type {ProjectType | undefined} */
let currentFilterType = undefined;
/** @type {HTMLElement} */
let grid;
/** @type {HTMLElement[]} */
let projectItemElements;

page.ready(() => {
	if (ENV_DEBUG) console.log('works.js ready');

	supportBlendMode();

	grid = document.querySelector('section.works .grid');
	projectItemElements = [...document.querySelectorAll('.projects-item')];

	const section = document.querySelector('section.works');
	section.addEventListener('click', (event) => {
		const item = projectItemElements.find((it) => it.contains(event.target));
		if (item) item.classList.add('item-selected');
	});

	/** @type HTMLInputElement */
	const filterToggle = document.querySelector('#filter-checkbox');
	filterToggle.addEventListener('change', (event) => {
		if (filterToggle.checked) {
			if (currentFilterType) applyFilter(currentFilterType);
		} else {
			applyFilter();
		}
	});

	const filterBar = document.querySelector('.filter-bar');
	filterBar.addEventListener('change', (event) => {
		if (event.target instanceof HTMLInputElement && event.target.name === 'filterType') {
			const type = event.target.value;
			applyFilter(type);
			currentFilterType = type;
		}
	});
});

/**
 * @param type {ProjectType | undefined}
 */
function applyFilter(type) {
	grid.classList.add('grid-filtered');

	// exit all
	for (const element of projectItemElements) {
		element.classList.add('projects-item-hiding');
	}

	// reveal next
	setTimeout(() => {
		for (const element of projectItemElements) {
			const visible = type === undefined || type === element.dataset.projectType;
			if (visible) {
				element.classList.remove('projects-item-hiding');
				element.classList.remove('projects-item-hidden');
			} else {
				element.classList.add('projects-item-hidden');
			}
		}
	}, 101);
}
