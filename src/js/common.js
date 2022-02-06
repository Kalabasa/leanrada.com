import page from './page.js';
import Barba from 'barba.js';

const searchPagePath = '/search.html';

page.ready(() => {
	const header = [...document.querySelectorAll('header.header')].pop();
	const searchForm = [...document.querySelectorAll('#header-search')].pop();
	const searchInput = [...document.querySelectorAll('#header-search input')].pop();

	searchInput.addEventListener('focus', () => {
		header.classList.add('header-searching');
	});

	searchInput.addEventListener('blur', () => {
		header.classList.remove('header-searching');
	});

	// use hash params instead of query params for performance
	searchForm.addEventListener('submit', (event) => {
		event.preventDefault();
		if (searchInput.value) navigateToSearch(searchInput.value);
	});

	// prefetch search page
	const prefetchSearch = () => {
		if ((searchInput.value || '').length >= 2) {
			const link = document.createElement('link');
			link.rel = 'preload';
			link.href = searchPagePath;
			link.as = 'fetch';
			document.querySelector('head').appendChild(link);

			searchInput.removeEventListener('change', prefetchSearch);
		}
	};
	searchInput.addEventListener('change', prefetchSearch);
});

function navigateToSearch(query) {
	if (window.location.pathname === searchPagePath) {
		window.location.hash = query;
	} else {
		try {
			// Barba may break on hash change
			Barba.Pjax.goTo(`${searchPagePath}#${encodeURIComponent(query)}`);
			window.dispatchEvent(new HashChangeEvent('hashchange'));
		} catch (err) {
			if (ENV_DEBUG) console.warn(err);
			window.location.href = `${searchPagePath}?q=${encodeURIComponent(query)}`;
		}
	}
}

export { page };
