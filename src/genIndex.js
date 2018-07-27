import fs from 'fs';
import path from 'path';

import lunr from 'lunr';
import marked from 'marked';
import markedPlaintext from 'marked-plaintext';

import { toRef } from './dataRef.js';
import data from './data.js';

const markedOptions = { renderer: new markedPlaintext };

console.log('generating index');

// homogenize searchable data
const searchable = [
	...data.projects.map(p => ({
		id: toRef(data, p),
		name: p.name,
		text: [
			p.short_description,
			p.full_description,
			marked(
				fs.readFileSync(path.join(__dirname, `pages/works/${p.id}.md`), 'utf8'),
				markedOptions,
			)
		].filter(v => v).join('\n\n'),
		tags: [
			...(p.tags || []),
			...(p.tech || []),
			...(p.links || []).map(l => l.name)
		].join(' '),
	})),
];

const idx = lunr(function() {
	this.ref('id');
	this.field('name');
	this.field('text');
	this.field('tags');

	for (let s of searchable) {
		this.add(s);
	}
});

if (!fs.existsSync('gen')) fs.mkdirSync('gen');
fs.writeFileSync(path.join(__dirname, '../gen/idx.json'), JSON.stringify(idx));
