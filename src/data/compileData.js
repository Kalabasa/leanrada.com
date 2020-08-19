import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import elasticlunr from 'elasticlunr';

import { fromRef, refId, dataUrl } from './dataRef.js';
import data from './data.js';
import searchConfig from './searchConfig.js';

console.log('compiling data');

const idx = elasticlunr.Index.load(require('../../gen/idx.json'));

// TODO See if suggested items is reusable
const suggestedSize = 3;
data.projects.forEach((proj, projIndex) => {
	const query = [
		...(proj.tags || []),
		...[proj.short_description, proj.full_description].filter(v => v).join(' ').split(/\s+/)
	].map(v => v.toLowerCase()).filter((v, i, self) => self.indexOf(v) === i);

	query.splice(8);

	const related = idx.search(query.join(' '), searchConfig)
		.filter(r => refId(r.ref) !== proj.id)
		.filter(r => r.score > 0.6);

	related.splice(2);

	const suggested = related.map(r => ({
		...fromRef(data, r.ref),
		related: true,
	}));

	suggested.splice(suggestedSize);

	let i = 1;
	while (suggested.length < suggestedSize) {
		const next = data.projects[(projIndex + i++) % data.projects.length];

		const url = dataUrl(data, next);
		if (suggested.find(v => v.url === url)) continue;

		suggested.push({
			item: next,
			url,
			related: false,
		});

		if (i > data.projects.length) break;
	}

	console.log(`suggestions for ${proj.name}: ${suggested.map(s => s.item.name + (s.related ? ' [r]' : '')).join(', ')}`);

	proj.suggested = suggested.map(v => ({
		name: v.item.name,
		description: v.item.short_description,
		imgSrc: v.item.image.src,
		typeClass: 'works', // FIXME Hardcoded value
		url: v.url,
		related: v.related,
	}));
});

data.projects_featured = data.featured_projects.map(id => data.projects.find(p => p.id === id));
data.projects_byid = _.keyBy(data.projects, 'id');

if (!fs.existsSync('gen')) fs.mkdirSync('gen');
fs.writeFileSync(path.join(__dirname, '../../gen/data.json'), JSON.stringify(data));
