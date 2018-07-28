import page from './page.js';

page.ready(() => {
	const searchForm = document.querySelector('#header-search');
	const searchInput = document.querySelector('#header-search input');

	// use hash params instead of query params for performance
	searchForm.addEventListener('submit', event => {
		event.preventDefault();
		if (searchInput.value) {
			window.location.href = `/search.html#${encodeURIComponent(searchInput.value)}`;
		}
	});

	// search.html prefetch
	const prefetchSearch = () => {
		if (searchInput.value) {
			const link = document.createElement('link');
			link.setAttribute('rel', 'preload');
			link.setAttribute('href', '/search.html');
			document.querySelector('head').appendChild(link);

			searchInput.removeEventListener('change', prefetchSearch);
		}
	};
	searchInput.addEventListener('change', prefetchSearch);
});

export { page };
