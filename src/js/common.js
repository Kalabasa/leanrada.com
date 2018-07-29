import page from './page.js';
import Barba from 'barba.js';

page.ready(() => {
	const searchForm = [...document.querySelectorAll('#header-search')].pop();
	const searchInput = [...document.querySelectorAll('#header-search input')].pop();

	// use hash params instead of query params for performance
	searchForm.addEventListener('submit', event => {
		event.preventDefault();
		if (searchInput.value) {
			const url = `/search.html#${encodeURIComponent(searchInput.value)}`;
			try {
				// Breaks when hash change
				Barba.Pjax.goTo(url);
			} catch (err) {
				console.error(err);
			}
			if (window.location.href !== url) window.location.href = url;
			window.dispatchEvent(new HashChangeEvent('hashchange'));
		}
	});

	// search.html prefetch
	const prefetchSearch = () => {
		if ((searchInput.value || '').length >= 2) {
			const link = document.createElement('link');
			link.rel = 'preload';
			link.href = '/search.html';
			link.as = 'fetch';
			document.querySelector('head').appendChild(link);

			searchInput.removeEventListener('change', prefetchSearch);
		}
	};
	searchInput.addEventListener('change', prefetchSearch);
});

export { page };
