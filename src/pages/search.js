import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import elasticlunr from 'elasticlunr/elasticlunr.min.js';
import handlebars from 'handlebars/lib/handlebars.js';

import { page } from '../js/common.js';
import { fromRef } from '../data/dataRef.js';
import searchConfig from '../data/searchConfig.js';

if (ENV_DEBUG) console.log('search.js execute');

const http = axios.create({
	adapter: cacheAdapterEnhancer(axios.defaults.adapter),
});

page.ready(() => {
	if (ENV_DEBUG) console.log('search.js ready');

	let query = '';
	if (window.location.hash.length) {
		query = decodeURIComponent(window.location.hash.substring(1));
	} else {
		// query string fallback
		query = (new URL(window.location)).searchParams.q;
	}

	search(query);

	const form = document.querySelector('section.search form.search-form');
	form.addEventListener('submit', event => {
		event.preventDefault();
		search(form.elements.q.value);
	});
});

function search(query) {
	history.pushState(null, null, '#' + (query ? encodeURIComponent(query) : ''));

	document.querySelector('section.search .search-form input').value = query;
	document.querySelectorAll('section.search .query').forEach(el => el.innerText = query);

	const resultsContainer = document.querySelector('section.search #results');
	const resultsInfo = document.querySelector('section.search .results-info');
	const resultsInfoCount = document.querySelector('section.search .results-info .count');
	const resultsEmpty = document.querySelector('section.search .results-empty');

	const htmlTemplates = document.querySelectorAll('section.search template[data-item-type]');
	const templates = {};
	for (let t of htmlTemplates) {
		templates[t.dataset.itemType] = handlebars.compile(t.innerHTML);
	}

	const existingResults = document.createRange();
	existingResults.selectNodeContents(resultsContainer);
	existingResults.deleteContents();

	Promise.all([
		http.get('/idx.json'),
		http.get('/data.json'),
	]).then(([idxResp, dataResp]) => {
		const idx = elasticlunr.Index.load(idxResp.data);
		let results = idx.search(query, searchConfig);

		if (ENV_DEBUG) console.log(`raw search results "${query}": `, results);
		results = results.filter(v => v.score > 0.3);

		if (results.length) {
			const items = results.map(v => fromRef(dataResp.data, v.ref));
			renderResults(resultsContainer, templates, items);
			resultsInfoCount.textContent = results.length;
			resultsInfo.style.display = 'block';
			resultsEmpty.style.display = 'none';
		} else {
			resultsInfo.style.display = 'none';
			if (query) resultsEmpty.style.display = 'block';
		}
	});
}

function renderResults(container, templates, items) {
	items.map(item => renderItem(templates[item.type], item)).forEach(content => {
		container.appendChild(content);
	});
}

function renderItem(template, item) {
	if (!template) throw new Error('no template');
	const html = document.createElement('template');
	html.innerHTML = template(item);
	return html.content;
}
