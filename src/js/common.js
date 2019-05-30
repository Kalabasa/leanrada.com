import page from './page.js';
import Barba from 'barba.js';

initGtag();

page.ready(() => {
	const header = [...document.querySelectorAll('header.header')].pop();;
	const searchForm = [...document.querySelectorAll('#header-search')].pop();
	const searchInput = [...document.querySelectorAll('#header-search input')].pop();

	searchInput.addEventListener('focus', () => {
		header.classList.add('header-searching');
	});

	searchInput.addEventListener('blur', () => {
		header.classList.remove('header-searching');
	});

	// use hash params instead of query params for performance
	searchForm.addEventListener('submit', event => {
		event.preventDefault();
		if (searchInput.value) {
			const url = `/search.html#${encodeURIComponent(searchInput.value)}`;
			try {
				// Breaks when hash change
				Barba.Pjax.goTo(url);
			} catch (err) {
				if (ENV_DEBUG) console.warn(err);
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

function initGtag() {
	const id = 'UA-141010266-1';

	if ('gtag' in window) {
		return;
	}

	const gtagScript = document.createElement('script');
	gtagScript.type = 'text/javascript';
	gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
	gtagScript.async = true;
	document.head.appendChild(gtagScript);

	window.dataLayer = window.dataLayer || [];
	window.gtag = () => dataLayer.push(arguments);
	gtag('js', new Date());

	gtag('config', id);
}

export { page };
