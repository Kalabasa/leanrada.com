import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import lunr from 'lunr';

import { fromRef, refId, dataUrl } from './dataRef.js';
import data from './data.js';

console.log('compiling data');

const idx = lunr.Index.load(require('../gen/idx.json'));

const suggestedSize = 2;
data.projects.forEach((proj, projIndex) => {
	const query = [
		...(proj.tags || []),
		...[proj.short_description, proj.full_description].filter(v => v).join(' ').split(/\s+/)
	].map(v => v.toLowerCase()).filter((v, i, self) => self.indexOf(v) === i);
	query.splice(10);

	const related = idx.search(query.join(' '))
		.filter(r => refId(r.ref) !== proj.id)
		.filter(r => r.score > 0.5);

	const suggested = related.map(r => fromRef(data, r.ref));

	let i = 1;
	while (suggested.length < suggestedSize) {
		const next = data.projects[(projIndex + i++) % data.projects.length];

		const url = dataUrl(data, next);
		if (suggested.find(v => v.url === url)) continue;

		suggested.push({
			item: next,
			url,
		});

		if (i > data.projects.length) break;
	}

	proj.suggested = suggested.map(v => ({
		name: v.item.name,
		imgSrc: v.item.image.src,
		url: v.url,
	}));
});

data.projects_featured = data.featured_projects.map(id => data.projects.find(p => p.id === id));
data.projects_byid = _.keyBy(data.projects, 'id');

if (!fs.existsSync('gen')) fs.mkdirSync('gen');
fs.writeFileSync(path.join(__dirname, '../gen/data.json'), JSON.stringify(data));
